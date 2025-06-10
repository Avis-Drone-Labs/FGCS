@ECHO OFF

::--------------------------------------------------------.
:: please run this script from the root of the repository .
::--------------------------------------------------------.

:: check if virtual environment is provided
SET venv_path=%1

IF "%venv_path%"=="" (
    SET venv_path="radio\venv"
)

:: create venv if not already created
IF NOT EXIST %venv_path% (
    ECHO Virtual environment not found at %venv_path%, creating...
    py -3.11 -m venv %venv_path%
)

:: activate the virtual environment
CALL "%venv_path%\Scripts\activate.bat"

cd radio || exit /b 1
pip install -r requirements.txt
cd ..\gcs || exit /b 1
yarn