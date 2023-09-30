import sys

from PyQt6.QtCore import Qt

from PyQt6.QtWidgets import (
    QApplication,
    QGridLayout,
    QLabel,
    QMainWindow,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 800


class PyCalcWindow(QMainWindow):
    """The main window (GUI or view)."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Project Falcon GCS")
        self.setFixedSize(WINDOW_WIDTH, WINDOW_HEIGHT)
        self.generalLayout = QVBoxLayout()
        centralWidget = QWidget(self)
        centralWidget.setLayout(self.generalLayout)
        self.setCentralWidget(centralWidget)
        self._createLabels()

    def _createLabels(self):
        exampleTelemetry = [
            ["Altitude", 9.2],
            ["Airspeed", 12.5],
            ["Groundspeed", 12.4],
            ["Battery", "79%"],
        ]
        buttonsLayout = QGridLayout()

        for idx, vals in enumerate(exampleTelemetry):
            key = QLabel(f"{vals[0]}:")
            font = key.font()
            font.setPointSize(30)
            key.setFont(font)

            value = QLabel(str(vals[1]))
            font = value.font()
            font.setPointSize(30)
            value.setFont(font)

            buttonsLayout.addWidget(key, idx, 0)
            buttonsLayout.addWidget(value, idx, 1)

        buttonsLayout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.generalLayout.addLayout(buttonsLayout)


def main():
    """The main function."""
    pycalcApp = QApplication([])
    pycalcWindow = PyCalcWindow()
    pycalcWindow.show()

    sys.exit(pycalcApp.exec())


if __name__ == "__main__":
    main()
