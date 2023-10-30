# Frontend

This should contain the frontend code using `Python` and `PYQT`

## Setup

To setup this project please make your own venv with `python -m venv venv`, once this is created you'll need to activate it; this is different on different operating systems so please below.

- On Unix or MacOS, using the bash shell: `source /path/to/venv/bin/activate`
- On Unix or MacOS, using the csh shell: `source /path/to/venv/bin/activate.csh`
- On Unix or MacOS, using the fish shell: `source /path/to/venv/bin/activate.fish`
- On Windows using the Command Prompt: `path\to\venv\Scripts\activate.bat`
- On Windows using PowerShell: `path\to\venv\Scripts\Activate.ps1`
- One Linux using Bash: `source path/to/venv/activate`
  > You'll need to run this each time you want to use the venv (basically every time you want to code)

Once you have activated your venv you can then install all required packages with `pip install -r requirements.txt`. Once this is done you are free to code :thumbs_up:

## Code style

Use Ruff for code styling. This should be installed automatically along with the other requirements, so you can just run `ruff format .` in the terminal to format all files in the current working directory.

- Keep filenames in `snake_case.py`
- Keep variable and function names in `camelCase`

## Notes

- Basic tutorial: <https://realpython.com/python-pyqt-gui-calculator/>
