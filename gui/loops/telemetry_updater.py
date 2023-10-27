from PyQt6.QtCore import QRunnable, pyqtSlot
from widgets.telemetry import TelemetryDataWidget
import time


class TelemetryUpdaterLoop(QRunnable):
    """Randomly change the values of the telemetry data"""

    def __init__(self, telemetryWidget: TelemetryDataWidget) -> None:
        super().__init__()
        self.telemetryWidget = telemetryWidget
        self.labels = self.telemetryWidget.getTelemetryLabels()
        self.running = True

    @pyqtSlot()
    def run(self):
        """Generate random numbers and update all labels"""
        while self.running:
            print(self.labels)
            time.sleep(1)

    @pyqtSlot()
    def stop(self):
        self.running = False
