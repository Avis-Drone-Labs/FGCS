import sys

from loops.telemetry_updater import TelemetryUpdaterLoop
from PyQt6.QtCore import QThreadPool
from PyQt6.QtWidgets import QApplication, QHBoxLayout, QMainWindow, QWidget
from widgets.map import MapWidget
from widgets.telemetry import TelemetryDataWidget

WINDOW_WIDTH = 1366
WINDOW_HEIGHT = 768


class MainWindow(QMainWindow):
    """The main window (GUI or view)."""

    def __init__(self):
        # Window Setup
        super().__init__()
        self.setWindowTitle("Project Falcon GCS")
        self.setMinimumSize(WINDOW_WIDTH, WINDOW_HEIGHT)

        # Layout Setup
        self.general_layout = QHBoxLayout()

        centralWidget = QWidget(self)
        centralWidget.setLayout(self.general_layout)
        # centralWidget.setFixedWidth(700)

        self.setCentralWidget(centralWidget)
        self.telemetryWidget = TelemetryDataWidget()
        self.general_layout.addWidget(self.telemetryWidget)

        self.mapWidget = MapWidget()
        self.general_layout.addWidget(self.mapWidget)

        # Create threadpool
        self.threadpool = QThreadPool()
        self.activeThreads = []

        # Add run telemetry loop
        self.telemetryUpdaterLoop = TelemetryUpdaterLoop(
            self.telemetryWidget, self.mapWidget
        )
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
    app = QApplication(["test"])
    mainWindow = MainWindow()
    mainWindow.show()

    # Set the stylesheet of the application
    with open("styles/styles.qss", "r") as f:
        styles = f.read()
        app.setStyleSheet(styles)

    sys.exit(app.exec())
