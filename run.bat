@ECHO OFF

::--------------------------------------------------------.
:: please run this script from the root of the repository .
::--------------------------------------------------------.

:: check if virtual environment is provided
SET venv_path=%1

IF "%venv_path%"=="" (
    SET venv_path=radio\venv
)

:: create venv if not already created
IF NOT EXIST %venv_path% (
    ECHO Virtual environment not found at %venv_path%, run setup.sh first.
    exit /b 1
)

IF NOT EXIST "gcs\node_modules" (
    ECHO Node modules not found, run setup.sh first.
    exit /b 1
)

:: activate the virtual environment
CALL "%venv_path%\Scripts\activate.bat"

:: make sure concurrently is installed
where concurrently >nul 2>&1
IF ERRORLEVEL 1 (
    ECHO concurrently not found, installing...
    npm install -g concurrently
)

concurrently "python radio/app.py" "cd gcs && yarn dev" -n "backend,frontend" -c "red,blue"