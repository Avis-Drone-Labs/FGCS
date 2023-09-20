# GCS
A monorepo for the ground control system

# How to update
When adding a new folder please write up about it in the correct README.md and also ask for permission with folders (this is so that we don't end up with clutter, you will most likely be allowed to add it). 

# Code style
> Please feel free to add to this its not complete
Try to stick to this code style:

```python
def nameOfFunction(variable_name: type) -> return_type:
  """Description of function"""
  variable_name = "something"

  # Comments line above
  variable_name = "New something"
  return variable_name

class nameOfClass:
  """Description of class"""

  def __init__(self):
    self.variable_name = "variable"
```

- Keep filenames in `snake_case.ext`

# Stack
- GUI
  - Python 3.11.4
  - PYQT6
- Radio
  - C++
