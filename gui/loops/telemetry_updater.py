from PyQt6.QtCore import QRunnable, pyqtSlot
from widgets.telemetry import TelemetryDataWidget
import time
import random


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
            new_labels = {
                "altitude": round(random.random() * 12, 2),
                "airspeed": round(random.random() * 20, 2),
                "groundspeed": round(random.random() * 20, 2),
                "battery": f"{round(random.random()*100, 2)}%",
            }
            self.telemetryWidget.updateTelemetryLabels(new_labels)
            time.sleep(0.5)

    @pyqtSlot()
    def stop(self):
        self.running = False
