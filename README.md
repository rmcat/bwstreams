# bwstreams

[bwstreams](https://bwstreams.appspot.com/) is a site that displays Brood War streams from [SOOP](https://www.sooplive.co.kr/) in an accessible way for the foreigner community. Since AfreecaTV rebranded to SOOP, the backend has been redeveloped into a new, separate project, resulting in this project being a static site.

## Requirements

1. Python 3
2. [gcloud CLI](https://cloud.google.com/sdk/docs/install)

## Project Setup

```sh
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Make the scripts executable
chmod +x run_flask.sh run_gunicorn.sh
```

## Running the Local Development Environment

```sh
# Run the Flask Development Server
./run_flask.sh

# Run the Flask App with Gunicorn
./run_gunicorn.sh
```

## Deploying to Google App Engine

```sh
gcloud app deploy

# Other useful commands
# gcloud app versions list
# gcloud app versions delete
# gcloud meta list-files-for-upload
```

## Site Preview

[<img src="demo.png">](demo.png)
