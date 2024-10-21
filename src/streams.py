from __future__ import unicode_literals
import datetime
import json
import utils
from log import logger

if not utils.is_cli:
    from google.appengine.api import urlfetch

afreeca_init_db_json = 'data/afreeca_database.json'
if utils.is_cli:
    afreeca_init_db_json = '../' + afreeca_init_db_json

"""
Game specific info

StarCraft: race
"""

"""
Stream data type

A dictionary with the following keys:

type            afreeca, twitch, etc.
id              stream id
nickname        nickname
last_seen       set to time of script update, null if never seen
online_since    null if never else given from stream info, null if offline
max_viewers     highest seen count
viewers         current count, 0 if offline
"""

"""
Database data type

A dictionary of streams with key <type>_<id>
"""


def fetch_streams():
    if utils.is_cli:
        return utils.fetch_streams_cli()

    api_endpoint = 'https://sch.sooplive.co.kr/api.php?m=categoryContentsList&szType=live&nPageNo={}&nListCnt=100&szPlatform=pc&szOrder=view_cnt_desc&szCateNo=00040001'
    all_data = []
    page_number = 1
    while True:
        url = api_endpoint.format(page_number)
        try:
            response = urlfetch.fetch(url)
            if response.status_code == 200:
                data = json.loads(response.content)
                items = data.get('data', {}).get('list', [])
                all_data.extend(items)
                if data.get('data', {}).get('is_more', False):
                    page_number += 1
                    continue
            else:
                logger.error('Unexpected response status {} when accessing {}'.format(response.getcode(), url))
            break
        except urlfetch.Error as e:
            logger.error('Failed to fetch {}: {}'.format(url, e.reason))
            break
    return all_data


def get_current_streams():
    """Returns a list of streams (with only relevant keys)"""
    streams = list()
    soop_streams = fetch_streams()
    time_format = '%Y-%m-%d %H:%M:%S.%f'
    time_offset = 9
    for info in soop_streams:
        id = info['user_id']
        viewers = int(info['view_cnt'])
        locked = info['is_password'] != 0
        online_since = utils.get_utc_time(info['broad_start'], time_format, time_offset)
        image = info['thumbnail']
        stream = {'type': 'afreeca', 'id': id, 'viewers': viewers, 'online_since': online_since,
                  'image': image, 'locked': locked}
        streams.append(stream)
    return streams


def database_key(stream_type, stream_id):
    return stream_type + '_' + stream_id


def database_type_and_id(key):
    split_index = key.find('_')
    return (key[:split_index], key[split_index + 1:])


def update_database(db, streams):
    time = datetime.datetime.utcnow()

    for key in db:
        db_stream = db[key]
        db_stream['online_since'] = None
        db_stream['viewers'] = 0
        db_stream['image'] = ''
        remove_game_info = db_stream.pop('game_info', None)
        if remove_game_info:
            db_stream['race'] = remove_game_info['race']
        db_stream.pop('game', None)

    total_online_duration = datetime.timedelta()
    n_online = 0

    for stream in streams:
        if stream['locked']:
            continue
        key = database_key(stream['type'], stream['id'])
        if key not in db:
            continue
        db_stream = db[key]
        db_stream['last_seen'] = time
        db_stream['online_since'] = stream['online_since']
        db_stream['image'] = stream['image']
        db_stream['viewers'] = stream['viewers']
        if db_stream['viewers'] > db_stream['max_viewers']:
            db_stream['max_viewers'] = db_stream['viewers']
        # logger.debug(db_stream)

        if db_stream['online_since'] is not None:
            total_online_duration += time - db_stream['online_since']
            n_online += 1

    return db


def get_initial_database(json_file):
    db = dict()
    json_str = utils.read_file(json_file)
    afreeca_json = json.loads(json_str)
    for user_id, (nickname, race) in afreeca_json.items():
        stream = {
            'type': 'afreeca',
            'id': user_id,
            'nickname': nickname,
            'last_seen': None,
            'online_since': None,
            'max_viewers': 0,
            'viewers': 0,
            'race': race,
        }
        key = database_key(stream['type'], stream['id'])
        db[key] = stream
    return db


@utils.cli_only
def test_get_database(json_file):
    with open(json_file, 'r') as f:
        json_str = f.read()
        db = utils.json_to_dict(json_str)
        return db


@utils.cli_only
def test_set_database(db, out_name):
    json_str = utils.dict_to_json(db)
    with open(out_name, 'w') as f:
        f.write(json_str)


@utils.cli_only
def main():
    try:
        from pprint import pprint
        db_init = get_initial_database(afreeca_init_db_json)
        with open('debug_init.txt', 'w') as f:
            pprint(db_init, f)
        test_set_database(db_init, 'debug_init.json')

        db_get = test_get_database('debug_init.json')
        with open('debug_get.txt', 'w') as f:
            pprint(db_get, f)
        test_set_database(db_get, 'debug_get.json')

        current_streams = get_current_streams()
        with open('debug_current_streams.txt', 'w') as f:
            pprint(current_streams, f)

        db_updated = update_database(db_get, current_streams)
        with open('debug_updated.txt', 'w') as f:
            pprint(db_updated, f)
        test_set_database(db_updated, 'debug_updated.json')
    except:
        logger.exception("Exception at main handler")


if __name__ == '__main__':
    main()
