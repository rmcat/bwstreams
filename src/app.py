import datetime
import json

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


class JsonDatabase(ndb.Model):
    value = ndb.TextProperty()


class Time(ndb.Model):
    value = ndb.DateTimeProperty()


def ndb_set_value(kind, id, value, create_only=False):
    key = ndb.Key(kind, id)
    ndb_entity = key.get()
    if ndb_entity is not None:
        if create_only:
            raise RuntimeError('{} key \'{}\' already exists.'.format(kind.__name__, id))
        ndb_entity.value = value
    else:
        ndb_entity = kind(key=key, value=value)
    ndb_entity.put()


def ndb_get_value(kind, id):
    key = ndb.Key(kind, id)
    ndb_entity = key.get()
    if not ndb_entity:
        raise RuntimeError('{} key \'{}\' does not exist.'.format(kind.__name__, id))
    return ndb_entity.value


class InitialiseDatabaseHandler(webapp2.RequestHandler):
    def get(self):
        logger.info('Initialising database')
        afreeca_json = streams.afreeca_init_db_json
        init_db = streams.get_initial_database(afreeca_json)
        init_db_json = utils.database_to_json(init_db)
        ndb_set_value(JsonDatabase, datastore_key_database, init_db_json, True)
        ndb_set_value(Time, datastore_key_last_update, datetime.datetime.utcnow())
        logger.info('Initialisation complete')


class UpdateDatabaseHandler(webapp2.RequestHandler):
    def update_database(self):
        db_json = ndb_get_value(JsonDatabase, datastore_key_database)
        db = utils.json_to_database(db_json)
        current_streams = streams.get_current_streams()

        updated_db = streams.update_database(db, current_streams)
        updated_db_json = utils.database_to_json(updated_db)

        ndb_set_value(JsonDatabase, datastore_key_database, updated_db_json)
        memcache.delete(memcache_key_database)
        memcache.set(memcache_key_database, updated_db)

    def modify_last_update_time(self, utc_now):
        ndb_set_value(Time, datastore_key_last_update, utc_now)
        memcache.delete(memcache_key_last_update)
        memcache.set(memcache_key_last_update, utc_now)


    @ndb.transactional(xg=True)
    @utils.wrap_exception
    def get(self):
        logger.info('Updating database')
        utc_now = datetime.datetime.utcnow()
        self.update_database()
        self.modify_last_update_time(utc_now)
        logger.info('Update complete')


class StreamsJsonHandler(webapp2.RequestHandler):
    @utils.wrap_exception
    def get(self):
        # Get database
        db = memcache.get(memcache_key_database)
        if db is None:
            db = ndb_get_value(JsonDatabase, datastore_key_database)
            memcache.set(memcache_key_database, db)

        # Get last update time
        last_update_time = memcache.get(memcache_key_last_update)
        if last_update_time is None:
            last_update_time = ndb_get_value(Time, datastore_key_last_update)
            memcache.set(memcache_key_last_update, last_update_time)

        json_obj = {'streams': db, 'last_update': last_update_time }
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(json_obj, default=utils.date_handler, sort_keys=True))


class DefaultHandler(webapp2.RequestHandler):
    @utils.wrap_exception
    def get(self):
        # Get database
        db = memcache.get(memcache_key_database)
        if db is None:
            db = ndb_get_value(JsonDatabase, datastore_key_database)
            memcache.set(memcache_key_database, db)

        # Get last update time
        last_update_time = memcache.get(memcache_key_last_update)
        if last_update_time is None:
            last_update_time = ndb_get_value(Time, datastore_key_last_update)
            memcache.set(memcache_key_last_update, last_update_time)

        # Increment hit counter
        # hit_counter.increment()


app = webapp2.WSGIApplication([
    ('/admin/update_database', UpdateDatabaseHandler),
    ('/admin/initialise_database', InitialiseDatabaseHandler),
    ('/streams.json', StreamsJsonHandler),
    ('.*', DefaultHandler),
], debug=True)
