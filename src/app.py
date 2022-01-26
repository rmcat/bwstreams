import datetime
import json
import random

import webapp2
from google.appengine.ext import ndb
from google.appengine.api import memcache

import streams
import utils
from log import logger


memcache_key_database = 'memcache_key_database'
memcache_key_last_update = 'memcache_key_last_update'
datastore_key_database = 'database'
datastore_key_last_update = 'last_update'
datastore_key_hits_streams_json = 'streams_json'


class JsonDatabase(ndb.Model):
    value = ndb.TextProperty()


class Time(ndb.Model):
    value = ndb.DateTimeProperty(indexed=False)


class HitCounter(ndb.Model):
    value = ndb.IntegerProperty(default=0, indexed=False)


def ndb_set_value(kind, id, value, create_only=False):
    key = ndb.Key(kind, id)
    ndb_entity = key.get()
    if ndb_entity is not None:
        if create_only:
            raise KeyError('{} key \'{}\' already exists.'.format(kind.__name__, id))
        ndb_entity.value = value
    else:
        ndb_entity = kind(key=key, value=value)
    ndb_entity.put()


def ndb_get_entity(kind, id):
    key = ndb.Key(kind, id)
    ndb_entity = key.get()
    if not ndb_entity:
        raise KeyError('{} key \'{}\' does not exist.'.format(kind.__name__, id))
    return ndb_entity


def edit_database(db_json):
    db = utils.json_to_dict(db_json)

    utc_now = datetime.datetime.utcnow()
    datastore_key_database_backup = 'backup_edit_{}'.format(utc_now.strftime('%Y-%m-%d_%H-%M_%S'))
    backup_database(datastore_key_database_backup)

    ndb_set_value(JsonDatabase, datastore_key_database, db_json)
    memcache.delete(memcache_key_database)
    memcache.set(memcache_key_database, db)


def update_database():
    db_json = ndb_get_entity(JsonDatabase, datastore_key_database).value
    db = utils.json_to_dict(db_json)
    current_streams = streams.get_current_streams()

    updated_db = streams.update_database(db, current_streams)
    updated_db_json = utils.dict_to_json(updated_db)

    ndb_set_value(JsonDatabase, datastore_key_database, updated_db_json)
    memcache.delete(memcache_key_database)
    memcache.set(memcache_key_database, updated_db)


def modify_last_update_time(utc_now):
    ndb_set_value(Time, datastore_key_last_update, utc_now)
    memcache.delete(memcache_key_last_update)
    memcache.set(memcache_key_last_update, utc_now)


@ndb.transactional()
def increment_hit_counter(key):
    # Approximate hits to save datastore writes
    n = 100
    r = random.randint(0, n - 1)
    if r == 0:
        hit_count = ndb_get_entity(HitCounter, key)
        hit_count.value += n
        hit_count.put()


class InitialiseDatabaseHandler(webapp2.RequestHandler):
    def get(self):
        logger.info('Database init started')
        afreeca_json = streams.afreeca_init_db_json
        init_db = streams.get_initial_database(afreeca_json)
        init_db_json = utils.dict_to_json(init_db)
        try:
            ndb_set_value(JsonDatabase, datastore_key_database, init_db_json, True)
            ndb_set_value(Time, datastore_key_last_update, datetime.datetime.utcnow())
        except KeyError:
            pass
        try:
            ndb_set_value(HitCounter, datastore_key_hits_streams_json, 0, True)
        except KeyError:
            pass
        logger.info('Database init finished')


class UpdateDatabaseHandler(webapp2.RequestHandler):
    @ndb.transactional(xg=True)
    @utils.wrap_exception
    def get(self):
        logger.info('Update started')
        utc_now = datetime.datetime.utcnow()
        update_database()
        modify_last_update_time(utc_now)
        logger.info('Update finished')


@ndb.transactional()
def backup_database(backup_key):
    db = memcache.get(memcache_key_database)
    if db is None:
        logger.warn('memcache failed on key: {}'.format(memcache_key_database))
        db_json = ndb_get_entity(JsonDatabase, datastore_key_database).value
        db = utils.json_to_dict(db_json)
        memcache.set(memcache_key_database, db)
    db_json = utils.dict_to_json(db)
    logger.info('Backup database to key: {}'.format(backup_key))
    ndb_set_value(JsonDatabase, backup_key, db_json)


class AdminHandler(webapp2.RequestHandler):
    def post(self):
        updated_db_json = self.request.get('database')
        self.response.write('<html><body>')
        self.response.write('<a href="/admin.html">Back to admin</a>')
        self.response.write('<p><textarea readonly rows="80" cols="120">')
        self.response.write(updated_db_json)
        self.response.write('</textarea>')
        self.response.write('</body></html>')
        logger.info('Editing database: {}'.format(updated_db_json))
        edit_database(updated_db_json)


class BackupDatabaseHandler(webapp2.RequestHandler):
    @utils.wrap_exception
    def get(self):
        logger.info('Backup started')
        utc_now = datetime.datetime.utcnow()
        datastore_key_database_backup = 'backup_{}'.format(utc_now.strftime('%Y-%m-%d'))
        backup_database(datastore_key_database_backup)
        logger.info('Backup finished')


class BackupManualHandler(webapp2.RequestHandler):
    @utils.wrap_exception
    def get(self):
        logger.info('Backup temp started')
        backup_database('backup_manual')
        logger.info('Backup temp finished')


class StreamsJsonHandler(webapp2.RequestHandler):
    @utils.wrap_exception
    def get(self):
        increment_hit_counter(datastore_key_hits_streams_json)

        # Get database
        db = memcache.get(memcache_key_database)
        if db is None:
            logger.warn('memcache failed on key: {}'.format(memcache_key_database))
            db_json = ndb_get_entity(JsonDatabase, datastore_key_database).value
            db = utils.json_to_dict(db_json)
            memcache.set(memcache_key_database, db)

        # Get last update time
        last_update_time = memcache.get(memcache_key_last_update)
        if last_update_time is None:
            logger.warn('memcache failed on key: {}'.format(memcache_key_last_update))
            last_update_time = ndb_get_entity(Time, datastore_key_last_update).value
            memcache.set(memcache_key_last_update, last_update_time)

        json_obj = {'streams': db, 'last_update': last_update_time}
        json_str = utils.dict_to_json(json_obj)
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json_str)


class ExportAfreecaDatabaseHandler(webapp2.RequestHandler):
    @utils.wrap_exception
    def get(self):
        increment_hit_counter(datastore_key_hits_streams_json)

        # Get database
        db = memcache.get(memcache_key_database)
        if db is None:
            logger.warn('memcache failed on key: {}'.format(memcache_key_database))
            db_json = ndb_get_entity(JsonDatabase, datastore_key_database).value
            db = utils.json_to_dict(db_json)
            memcache.set(memcache_key_database, db)

        # Get last update time
        last_update_time = memcache.get(memcache_key_last_update)
        if last_update_time is None:
            logger.warn('memcache failed on key: {}'.format(memcache_key_last_update))
            last_update_time = ndb_get_entity(Time, datastore_key_last_update).value
            memcache.set(memcache_key_last_update, last_update_time)

        json_obj = dict()
        for key, value in db.items():
            stream_type, stream_id = streams.database_type_and_id(key)
            if stream_type != 'afreeca':
                continue
            race = value['race']
            nickname = value['nickname']
            json_obj[stream_id] = [ nickname, race ]

        # Output in Snipealot formatting
        json_str = '{\n'
        for key, value in sorted(json_obj.items()):
            json_str += '    "{}": [ "{}", "{}" ],\n'.format(key, value[0], value[1])
        json_str = json_str[:-2] + '\n}\n'

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json_str)


app = webapp2.WSGIApplication([
    ('/admin/update_database', UpdateDatabaseHandler),
    ('/admin/backup_database', BackupDatabaseHandler),
    ('/admin/backup_manual', BackupManualHandler),
    ('/admin/initialise_database', InitialiseDatabaseHandler),
    ('/admin/edit_database', AdminHandler),
    ('/afreeca_database.json', ExportAfreecaDatabaseHandler),
    ('/streams.json', StreamsJsonHandler),
], debug=True)
