# GCS

A monorepo for the ground control system

## How to update

When adding a new folder please write up about it in the correct README.md and also ask for permission with folders (this is so that we don't end up with clutter, you will most likely be allowed to add it).

## Stack

- GUI
  - Python 3.9.13
  - PYQT6
- Radio
  - C++

## Python Version

We are going to be using **python 3.9.13** so please install that on your computer from [Python's website](https://www.python.org/downloads/). Please try to use a virtual environment when programming, if you don't know how to do this please message me (Julian)! Name the folder either "env" or "venv" so its in the .gitignore as we don't want to be uploading that to github.

## Python Code Style

We will be using `ruff` as the code style for python, please look at the documentation found [here](https://docs.astral.sh/ruff/). When pushing code we have an action to check if it is in the correct code style, if it is not in the correct style it will fail the run and you will need to fix it by running `python -m ruff format . ` in your virtual environment (or something `ruff format .` works on different systems); this should automatically reformat everything so you can push it again!
