from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import QWidget, QGridLayout, QLabel


class TelemetryDataWidget(QWidget):
    """Telemetry Data widget to contain updating and and creating telemetry data"""

    def __init__(self):
        # Widget Setup
        super().__init__(parent=None)
        self.layout: QGridLayout = QGridLayout()
        self.layout.setVerticalSpacing(0)
        self.setLayout(self.layout)

        # Create and display labels
        # TelemetryLabels will be in format {"labelName": [value, labelWidget]}
        self.telemetryLabels = {
            "status": ["BOOT", None],
            "altitude": [0, None],
            "airspeed": [0, None],
            "groundspeed": [0, None],
            "battery_remaining": [0, None],
            "battery_voltage": [0, None],
            "battery_current": [0, None],
        }
        self.font = QFont("Ubuntu Mono", 30)

        self._createTelemetryLabels()

    def _createTelemetryLabels(self):
        """A function to create telemetry labels initially, to update use self._updateTelemetryLabels"""
        for index, (key, label) in enumerate(self.telemetryLabels.items()):
            keyWidget = QLabel(key)
            keyWidget.setFont(self.font)
            keyWidget.setObjectName("telemetry-key")

            valueWidget = QLabel(f"{label[0]}")
            valueWidget.setFont(self.font)
            valueWidget.setObjectName("telemetry-value")

            self.layout.addWidget(keyWidget, index, 0)
            self.layout.addWidget(valueWidget, index, 1)

            self.telemetryLabels[key][1] = valueWidget

    def updateTelemetryLabels(self, label_values: dict):
        """
        Update Telemetry Labels based from a dictionary, if the value in the dictionary
        is not found then the value will be skipped (and ones not listed will not be
        updated). For example: {"altitude": 12, "airspeed": 30}
        """
        for key, value in label_values.items():
            if (
                key in self.telemetryLabels.keys()
                and self.telemetryLabels[key][1] is not None
            ):
                self.telemetryLabels[key][0] = value
                self.telemetryLabels[key][1].setText(f"{value}")

    def getTelemetryLabels(self):
        """
        Get all telemetry labels, very useful for updateTelemetryLabels
        :return dict labels: A list of all label keys and current values
        """
        labels = {}
        for key, value in self.telemetryLabels.items():
            labels[key] = value[0]
        return labels
