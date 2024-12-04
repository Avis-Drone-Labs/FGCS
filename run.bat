@ECHO off

SET venv=%1
SET update=%2

IF NOT "%venv%"=="" (
    ECHO Starting venv...
    "./%venv%/Scripts/activate"

    @REM Update all packages, only triggered with second parameter
    IF NOT "%update%"=="" (
        ECHO Making sure packages are up to date
        pip install -r radio/requirements.txt

        ECHO Successfully went into venv, ensuring yarn is up to date
        cd gcs
        yarn

        ECHO Ensuring that concurrently is downloaded and npm is up to date
        npm i -g concurrently

        cd ../
        ECHO Yarn is up to date
    ) ELSE (
        ECHO Yarn and PIP packages could be out of date, try adding --update to update!
    )

    ECHO Starting backend and frontend...
    concurrently "python radio/app.py" "cd gcs && yarn dev" -n "backend,frontend" -c "red,blue"
) ELSE (
    ECHO You forgot to provide a path to your venv, for example "./run.bat radio/venv"
    ECHO If this is the first time running the script it will auto update all packages, this is done by adding "update" to the end of the command. For examplee "./run.bat api/venv update"
)
