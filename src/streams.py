from __future__ import unicode_literals
import datetime
import json
import re

from pprint import pprint

import utils
from log import logger


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


def format_afreeca_response_to_json(data):
    if data.startswith(b'var oBroadListData = ') and data.endswith(b';'):
        data = data[len(b'var oBroadListData = '):-1]
    data = re.sub(b'\'', b'"', data)
    data = re.sub(r'[^\x00-\x7F]+', '', data)
    pattern = '{("broad_no"[^,]+),[^}]*?' \
              '("user_id"[^,]+),[^}]*?' \
              '("is_password"[^,]+),.*?' \
              '("broad_start"[^,]+),.*?' \
              '("broad_cate_no"[^,]+),.*?' \
              '("total_view_cnt"[^,]+),[^}]*?' \
              '}'
    replace = '\n{ \\1, \\2, \\3, \\4, \\5, \\6 }'
    data = re.sub(pattern, replace, data, flags=re.DOTALL)
    return data


def get_current_streams():
    """Returns a list of streams (with only relevant keys)"""
    streams = list()
    afreeca_url = 'http://live.afreecatv.com/afreeca/broad_list_api.php'
    # afreeca_url = 'http://localhost:8000/broad_list_api.php'
    afreeca_response = utils.fetch_url(afreeca_url)
    afreeca_json_str = format_afreeca_response_to_json(afreeca_response)

    json_object = json.loads(afreeca_json_str)
    time_format = '%Y-%m-%d %H:%M'
    time_offset = 9
    for info in json_object['CHANNEL']['REAL_BROAD']:
        broad_cate_no = info['broad_cate_no']
        if broad_cate_no != '00040001':
            continue
        id = info['user_id']
        viewers = int(info['total_view_cnt'])
        locked = info['is_password'] == 'Y'
        online_since = utils.get_utc_time(info['broad_start'], time_format, time_offset)
        image = 'https://liveimg.afreecatv.com/{}_480x270.jpg'.format(info['broad_no'])
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


def main():
    try:
        db_init = get_initial_database(afreeca_init_db_json)
        with open('db_init.txt', 'w') as f:
            pprint(db_init, f)
        test_set_database(db_init, 'db_init.json')

        db_get = test_get_database('db_init.json')
        with open('db_get.txt', 'w') as f:
            pprint(db_get, f)
        test_set_database(db_get, 'db_get.json')

        db_updated = update_database(db_get, get_current_streams(), datetime.datetime.utcnow())
        with open('db_updated.txt', 'w') as f:
            pprint(db_updated, f)
        test_set_database(db_updated, 'db_updated.json')
    except:
        logger.exception("Exception at main handler")


if __name__ == '__main__':
    main()
