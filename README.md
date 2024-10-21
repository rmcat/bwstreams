# bwstreams

## Overview

bwstreams is a Python 2 Google App Engine app that tracks Brood War streams from [AfreecaTV](http://afreecatv.com). See it live at https://bwstreams.appspot.com.

[<img src="demo.png" height=400>](demo.png)

## Running the development server

1. Install Python 2.7.18
2. Install the [Google Cloud SDK](https://cloud.google.com/appengine/docs/standard/python/download)
3. Open Google Cloud SDK Shell
4. `gcloud components update --version 359.0.0` to downgrade gcloud
5. `gcloud components install app-engine-python-extras app-engine-python cloud-datastore-emulator` (run with admin privilege if errors are encountered)
6. Run dev_appserver.bat (or run the command `dev_appserver.py app.yaml` using Python 2)

### Useful Google Cloud Commands

- gcloud app versions list
- gcloud app versions delete
- gcloud meta list-files-for-upload
- gcloud app deploy

## Adding streams

Visit http://localhost:8080/admin/initialise_database to initialise a new database from a [preset list](afreeca_database.json), .

Use the admin control panel http://localhost:8080/admin.html to add, edit or remove streams.

## Triggering an update

The app refreshes stream information [every minute](cron.yaml). Visit http://localhost:8080/admin/update_database to manually trigger a refresh.

## Stream information (JSON)

All the stream information can be found at http://localhost:8080/streams.json.

## Useful Links

| Description             | Local Dev Link                                  | Hosted Link                                                       |
| ----------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| Main page               | http://localhost:8080                           | https://bwstreams.appspot.com                                     |
| Stream list (barebones) | http://localhost:8080/afreeca_database.json     | https://bwstreams.appspot.com/afreeca_database.json               |
| Initialise database     | http://localhost:8080/admin/initialise_database | https://bwstreams.appspot.com/admin/initialise_database           |
| Admin control panel     | http://localhost:8080/admin.html                | https://bwstreams.appspot.com/admin.html                          |
| Trigger update          | http://localhost:8080/admin/update_database     | https://bwstreams.appspot.com/admin/update_database               |
| Stream information      | http://localhost:8080/streams.json              | https://bwstreams.appspot.com/streams.json                        |
| Google Cloud Dashboard  |                                                 | https://console.cloud.google.com/home/dashboard?project=bwstreams |
