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
            "Altitude": [9.2, None],
            "Airspeed": [12.5, None],
            "Groundspeed": [12.4, None],
            "Battery": ["79%", None],
        }
        self.labelFont = QFont("Ubuntu Mono", 30)
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
        self.layout.addLayout(labelLayout)
