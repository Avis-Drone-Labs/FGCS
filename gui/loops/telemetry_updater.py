import time

from PyQt6.QtCore import QRunnable, pyqtSlot

from mocking.telemetry_mocker import mockTelemetryData
from widgets.telemetry import TelemetryDataWidget


class TelemetryUpdaterLoop(QRunnable):
    """Update the values of the telemetry data displayed"""

    UPDATE_INTERVAL = 0.5

    def __init__(self, telemetryWidget: TelemetryDataWidget) -> None:
        super().__init__()
        self.telemetryWidget = telemetryWidget
        self.labels = self.telemetryWidget.getTelemetryLabels()
        self.running = True

    @pyqtSlot()
    def run(self):
        """Update all labels"""
        while self.running:
            self.telemetryWidget.updateTelemetryLabels(mockTelemetryData())
            time.sleep(self.UPDATE_INTERVAL)

    @pyqtSlot()
    def stop(self):
        self.running = False
