cd %~dp0
call venv\Scripts\activate.bat
python "%LOCALAPPDATA%/Google/Cloud SDK/google-cloud-sdk/bin/dev_appserver.py" app.yaml
