import sys

from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QApplication,
    QGridLayout,
    QLabel,
    QMainWindow,
    QVBoxLayout,
    QWidget,
)

WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 700


class MainWindow(QMainWindow):
    """The main window (GUI or view)."""

    def __init__(self):
        # Window Setup
        super().__init__()
        self.setWindowTitle("Project Falcon GCS")
        self.setMinimumSize(WINDOW_WIDTH, WINDOW_HEIGHT)

        # Variable Setup
        # TelemetryLabels will be in format {"labelName": [value, labelWidget]}
        self.telemetryLabels = {
            "Altitude": [9.2, None],
            "Airspeed": [12.5, None],
            "Groundspeed": [12.4, None],
            "Battery": ["79%", None],
        }
        self.labelFont = QFont("Ubuntu Mono", 30)

        # Layout Setup
        self.generalLayout = QVBoxLayout()
        centralWidget = QWidget(self)
        centralWidget.setLayout(self.generalLayout)
        self.setCentralWidget(centralWidget)
        self._createTelemetryLabels()

    def _createTelemetryLabels(self):
        """A function to create telemetry labels initially, to update use self._updateTElemetryLabels"""
        labelLayout: QGridLayout = QGridLayout()
        for index, (key, label) in enumerate(self.telemetryLabels.items()):
            labelWidget = QLabel(f"{key}: {label[0]}")
            labelWidget.setFont(self.labelFont)
            labelLayout.addWidget(labelWidget, index, 0)
            self.telemetryLabels[key][1] = labelWidget

        # Add labelLayout to generalLayout
        labelLayout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.generalLayout.addLayout(labelLayout)


if __name__ == "__main__":
    app = QApplication([])
    mainWindow = MainWindow()
    mainWindow.show()

    sys.exit(app.exec())
