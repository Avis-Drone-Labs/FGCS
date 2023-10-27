from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QGridLayout, QLabel


class TelemetryDataWidget(QWidget):
    """Telemetry Data widget to contain updating and and creating telemetry data"""

    def __init__(self):
        # Widget Setup
        super().__init__(parent=None)
        self.layout: QVBoxLayout = QVBoxLayout()
        self.setLayout(self.layout)

        # Create and display labels
        # TelemetryLabels will be in format {"labelName": [value, labelWidget]}
        self.telemetryLabels = {
            "altitude": [9.2, None],
            "airspeed": [12.5, None],
            "groundspeed": [12.4, None],
            "battery": ["79%", None],
        }
        self.labelFont = QFont("Ubuntu Mono", 30)
        self._createTelemetryLabels()

    def _createTelemetryLabels(self):
        """A function to create telemetry labels initially, to update use self._updateTElemetryLabels"""
        labelLayout: QGridLayout = QGridLayout()
        for index, (key, label) in enumerate(self.telemetryLabels.items()):
            labelWidget = QLabel(f"{key.capitalize()}: {label[0]}")
            labelWidget.setFont(self.labelFont)
            labelLayout.addWidget(labelWidget, index, 0)
            self.telemetryLabels[key][1] = labelWidget

        # Add labelLayout to generalLayout
        labelLayout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.layout.addLayout(labelLayout)

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
                self.telemetryLabels[key][1].setText(f"{key.capitalize()}: {value}")

    def getTelemetryLabels(self):
        """
        Get all telemetry labels, very useful for updateTelemetryLabels
        :return dict labels: A list of all label keys and current values
        """
        labels = {}
        for key, value in self.telemetryLabels.items():
            labels[key] = value[0]
        return labels
