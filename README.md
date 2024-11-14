# bwstreams

[bwstreams](https://bwstreams.appspot.com/) is a site that displays Brood War streams from [SOOP](https://www.sooplive.co.kr/) in an accessible way for the foreigner community. Since AfreecaTV rebranded to SOOP, the backend has been redeveloped into a new, separate project, resulting in this project being a static site.

[<img src="demo.png">](demo.png)

## Deploying to Google App Engine

### Install gcloud CLI

. [gcloud CLI](https://cloud.google.com/sdk/docs/install)

### Deployment Commands

```sh
gcloud meta list-files-for-upload

gcloud app versions list

gcloud app deploy --version v2 --no-promote

# Test the new version at https://v2-dot-bwstreams.appspot.com

# Promote traffic to the new version after testing
gcloud app services set-traffic --splits v2=1

gcloud app versions delete v1
```
