import datetime
import gzip
import json
import os
import urllib2
from StringIO import StringIO
from google.appengine.api import urlfetch

from log import logger


is_cli = 'SERVER_SOFTWARE' not in os.environ
is_dev_server = os.getenv('SERVER_SOFTWARE', '').startswith('Development')


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


def fetch_url(url):
    urlfetch.set_default_fetch_deadline(30)
    try:
        request = urllib2.Request(url)
        request.add_header('Accept-encoding', 'gzip')
        response = urllib2.urlopen(request)
    except urllib2.URLError:
        return None

    if response.getcode() == 200:
        if response.info().get('Content-Encoding') == 'gzip':
            buf = StringIO(response.read())
            f = gzip.GzipFile(fileobj=buf)
            return f.read()
        else:
            return response.read()
    else:
        return None


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
