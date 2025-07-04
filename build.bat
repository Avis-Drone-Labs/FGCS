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

:: activate the virtual environment
CALL "%venv_path%\Scripts\activate.bat"

cd radio || exit /b 1

pyinstaller --paths .\venv\Lib\site-packages\ --add-data=".\venv\Lib\site-packages\pymavlink\message_definitions\:message_definitions" --add-data=".\venv\Lib\site-packages\pymavlink\:pymavlink" --hidden-import pymavlink --hidden-import engineio.async_drivers.threading .\app.py -n fgcs_backend

cd .. || exit /b 1

move radio\dist\fgcs_backend gcs\extras

cd gcs || exit /b 1

yarn build