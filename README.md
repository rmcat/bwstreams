# bwstreams

## What is bwstreams?

[bwstreams](https://bwstreams.appspot.com) is an App Engine application that lists Brood War streams. Currently, only streams from Afreeca are supported.

## Local Development Server Setup

1. Download and install the original [App Engine SDK for Python](https://cloud.google.com/appengine/docs/standard/python/download)
2. Start _Google App Engine Launcher_
3. Add _bwstreams_ as an existing application (*File > Add Existing Application*)
4. Run _bwstreams_

The app should be up and running after executing these instructions.

## Useful Links

| Description | Local Link | Online Link |
| -- | -- | -- |
| Main page | http://localhost:8080 | https://bwstreams.appspot.com |
| Stream information in JSON | http://localhost:8080/streams.json | https://bwstreams.appspot.com/streams.json |
| Afreeca list in JSON | http://localhost:8080/afreeca_database.json | https://bwstreams.appspot.com/afreeca_database.json |
| Initialise database (requires ) | http://localhost:8080/admin/initialise_database | https://bwstreams.appspot.com/admin/initialise_database |
| Trigger database update | http://localhost:8080/admin/update_database | https://bwstreams.appspot.com/admin/update_database |
| Control panel | http://localhost:8080/admin.html | https://bwstreams.appspot.com/admin.html |

Note: Port 8080 in the above links is the regular port on the local development server.
