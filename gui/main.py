import sys

from PyQt6.QtWidgets import (
    QApplication,
    QMainWindow,
    QVBoxLayout,
    QWidget,
)
from PyQt6.QtCore import QThreadPool

from widgets.telemetry import TelemetryDataWidget
from loops.telemetry_updater import TelemetryUpdaterLoop

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

        # Create threadpool
        self.threadpool = QThreadPool()
        self.activeThreads = []

        # Add and run telemetry loop
        self.telemetryUpdaterLoop = TelemetryUpdaterLoop(self.telemetryWidget)
        self.activeThreads.append(self.telemetryUpdaterLoop)
        self.threadpool.start(self.telemetryUpdaterLoop)

    def closeEvent(self, _):
        """Runs on GUI close, currently stopping all threads"""
        self.threadpool.clear()
        for thread in self.activeThreads:
            try:
                thread.stop()
            except Exception as e:
                print(f"Couldn't close thread: {e}")


if __name__ == "__main__":
    app = QApplication([])
    mainWindow = MainWindow()
    mainWindow.show()

    sys.exit(app.exec())
