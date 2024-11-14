#!/bin/bash
source venv/bin/activate
gunicorn -b 0.0.0.0:8080 main:app
