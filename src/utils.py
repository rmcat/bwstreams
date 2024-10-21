import datetime
import json
import os
import urllib2

from log import logger


is_cli = 'SERVER_SOFTWARE' not in os.environ
is_dev_server = os.getenv('SERVER_SOFTWARE', '').startswith('Development')
if not is_cli:
    from google.appengine.api import urlfetch


def cli_only(func):
    def inner(*args, **kwargs):
        if not is_cli:
            raise RuntimeError('{} can only be called from the command line', func.__name__)
        return func(*args, **kwargs)
    return inner


def wrap_exception(func):
    def inner(self):
        try:
            func(self)
        except:
            logger.exception('Error!')
            if is_dev_server:
                raise
            else:
                self.response.write('Error occurred')
    return inner


def read_file(filename):
    with open(filename, 'r') as f:
        return f.read()
    raise Exception('Error reading {}'.format(filename))


def fetch_streams_cli():
    api_endpoint = 'https://sch.sooplive.co.kr/api.php?m=categoryContentsList&szType=live&nPageNo={}&nListCnt=100&szPlatform=pc&szOrder=view_cnt_desc&szCateNo=00040001'
    all_data = []
    page_number = 1
    while True:
        url = api_endpoint.format(page_number)
        try:
            response = urllib2.urlopen(url)
            if response.getcode() == 200:
                data = json.load(response)
                items = data.get('data', {}).get('list', [])
                all_data.extend(items)
                if data.get('data', {}).get('is_more', False):
                    page_number += 1
                    continue
            else:
                print('Unexpected response status {} when accessing {}'.format(response.getcode(), url))
            break
        except urllib2.URLError as e:
            print('Failed to fetch {}: {}'.format(url, e.reason))
            break
    return all_data


def get_utc_time(s, format, offset):
    time = datetime.datetime.strptime(s, format)
    utc_time = time - datetime.timedelta(hours=offset)
    return utc_time


def json_date_serializer(obj):
    if isinstance(obj, datetime.datetime) or isinstance(obj, datetime.date):
        return obj.strftime('%Y-%m-%dT%H:%M:%SZ')
    else:
        return None


def json_date_deserializer(obj):
    def str_to_datetime(s):
        return datetime.datetime.strptime(s, '%Y-%m-%dT%H:%M:%SZ')

    if isinstance(obj, dict):
        for key in ('last_seen', 'online_since'):
            if key in obj and obj[key] is not None:
                obj[key] = str_to_datetime(obj[key])
        return obj
    raise Exception('Unexpected')


def dict_to_json(db):
    return json.dumps(db, default=json_date_serializer, sort_keys=True)


def json_to_dict(json_str):
    return json.loads(json_str, object_hook=json_date_deserializer)
