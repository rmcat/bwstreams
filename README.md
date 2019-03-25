# bwstreams

 [![Build Status](https://travis-ci.org/rmcat/bwstreams.svg?branch=master)](https://travis-ci.org/rmcat/bwstreams)

## Overview

bwstreams is a Google App Engine application that tracks specific Brood War streams from [AfreecaTV](http://afreecatv.com). The webapp is currently hosted at https://bwstreams.appspot.com.

## Running the development server

1. Install the [Google Cloud SDK](https://cloud.google.com/appengine/docs/standard/python/download)
2. Open Google Cloud SDK Shell
3. Navigate to the project root and run the command ``dev_appserver.py app.yaml``

## Adding streams

To initialise the database from a [JSON list of streams](afreeca_database.json), go to http://localhost:8080/admin/initialise_database.

Streams may also be added through the admin control panel at http://localhost:8080/admin.html.

## Triggering an update

Stream information is automatically updated [once per minute](cron.yaml). If you wish to to trigger a manual update, go to http://localhost:8080/admin/update_database.

## Data in JSON format

Stream information may be acessed through the JSON file at http://localhost:8080/streams.json.

## Summary of links

| Description               | Local Dev Link                                    | Hosted Link                                               |
| --                        | --                                                | --                                                        |
| Main page                 | http://localhost:8080                             | https://bwstreams.appspot.com                             |
| List of streams           | http://localhost:8080/afreeca_database.json       | https://bwstreams.appspot.com/afreeca_database.json       |
| Initialise database       | http://localhost:8080/admin/initialise_database   | https://bwstreams.appspot.com/admin/initialise_database   |
| Control panel             | http://localhost:8080/admin.html                  | https://bwstreams.appspot.com/admin.html                  |
| Trigger update            | http://localhost:8080/admin/update_database       | https://bwstreams.appspot.com/admin/update_database       |
| Stream information        | http://localhost:8080/streams.json                | https://bwstreams.appspot.com/streams.json                |
