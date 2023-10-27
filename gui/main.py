import sys

from PyQt6.QtWidgets import (
    QApplication,
    QMainWindow,
    QVBoxLayout,
    QWidget,
)

from widgets.telemetry import TelemetryDataWidget

WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 700


class MainWindow(QMainWindow):
    """The main window (GUI or view)."""

    def __init__(self):
        # Window Setup
        super().__init__()
        self.setWindowTitle("Project Falcon GCS")
        self.setMinimumSize(WINDOW_WIDTH, WINDOW_HEIGHT)

        # Layout Setup
        self.generalLayout = QVBoxLayout()
        centralWidget = QWidget(self)
        centralWidget.setLayout(self.generalLayout)
        self.setCentralWidget(centralWidget)
        self.telemetryWidget = TelemetryDataWidget()
        self.generalLayout.addWidget(self.telemetryWidget)


if __name__ == "__main__":
    app = QApplication([])
    mainWindow = MainWindow()
    mainWindow.show()

    sys.exit(app.exec())
