import datetime
import gzip
import json
import os
import urllib2
from StringIO import StringIO

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


def get_utc_time(time_str, offset):
    time = datetime.datetime.strptime(time_str, '%Y-%m-%d %H:%M')
    utc_time = time - datetime.timedelta(hours=offset)
    return utc_time


def date_handler(obj):
    if isinstance(obj, datetime.datetime) or isinstance(obj, datetime.date):
        return obj.isoformat()
    else:
        return None


def database_to_json(db):
    json_str = json.dumps(db, default=date_handler, sort_keys=True)
    return json_str


def json_to_database(json_str):
    database = json.loads(json_str)
    return database