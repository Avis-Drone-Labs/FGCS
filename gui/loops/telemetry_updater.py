import time

from PyQt6.QtCore import QRunnable, pyqtSlot

from mocking.telemetry_mocker import mockTelemetryData
from widgets.telemetry import TelemetryDataWidget
from widgets.map import MapWidget


class TelemetryUpdaterLoop(QRunnable):
    """Update the values of the telemetry data displayed"""

    UPDATE_INTERVAL = 0.5

    def __init__(self, telemetryWidget: TelemetryDataWidget, mapWidget: MapWidget) -> None:
        super().__init__()
        self.telemetryWidget = telemetryWidget
        self.labels = self.telemetryWidget.getTelemetryLabels()
        self.mapWidget = mapWidget
        self.running = True

    @pyqtSlot()
    def run(self):
        """Update all labels"""
        while self.running:
            self.telemetryWidget.updateTelemetryLabels(mockTelemetryData())
            self.mapWidget.updateDronePosition()

            self.telemetryWidget.telemetryLabels["longitude"][0] = self.mapWidget.map.position[0]
            self.telemetryWidget.telemetryLabels["longitude"][1].setText(f"{self.mapWidget.map.position[0]}")
            self.telemetryWidget.telemetryLabels["latitude"][0] = self.mapWidget.map.position[1]
            self.telemetryWidget.telemetryLabels["latitude"][1].setText(f"{self.mapWidget.map.position[1]}")

            time.sleep(self.UPDATE_INTERVAL)

    @pyqtSlot()
    def stop(self):
        self.running = False
