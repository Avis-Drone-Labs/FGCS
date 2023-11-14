from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import QGridLayout, QHBoxLayout, QLabel, QWidget


class TelemetryDataWidget(QWidget):
    """Telemetry Data widget to contain updating and and creating telemetry data"""

    def __init__(self):
        # Widget Setup
        super().__init__(parent=None)
        self.layout: QHBoxLayout = QHBoxLayout()
        self.layout.setSpacing(30)
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
            "longitude": [0, None],
            "latitude": [0, None],
        }
        # ESC Telemetry Labels - same format - 4 dictionaries for 4 motor properties in a list
        self.telemetryEscData = [
            {
                "name": ["Motor 1", None],
                "voltage": [0, None],
                "rpm": [0, None],
                "temperature": [0, None],
            },
            {
                "name": ["Motor 2", None],
                "voltage": [0, None],
                "rpm": [0, None],
                "temperature": [0, None],
            },
            {
                "name": ["Motor 3", None],
                "voltage": [0, None],
                "rpm": [0, None],
                "temperature": [0, None],
            },
            {
                "name": ["Motor 4", None],
                "voltage": [0, None],
                "rpm": [0, None],
                "temperature": [0, None],
            },
        ]
        self.font = QFont("Ubuntu Mono", 30)

        self._createTelemetryLabels()

    def _createTelemetryLabels(self):
        """A function to create telemetry labels initially, to update use self._updateTelemetryLabels"""
        telemetryLayout = QGridLayout()
        telemetryLayout.setHorizontalSpacing(10)
        telemetryLayout.setVerticalSpacing(20)

        for index, (key, label) in enumerate(self.telemetryLabels.items()):
            keyWidget = QLabel(key)
            keyWidget.setFont(self.font)
            keyWidget.setObjectName("telemetry-key")

            valueWidget = QLabel(f"{label[0]}")
            valueWidget.setFont(self.font)
            valueWidget.setObjectName("telemetry-value")

            telemetryLayout.addWidget(keyWidget, index, 0)
            telemetryLayout.addWidget(valueWidget, index, 1)

            self.telemetryLabels[key][1] = valueWidget
        self.layout.addLayout(telemetryLayout)

        # Use Outer Grid Layout to store the ESC data layout for each motor in 1 grid
        escOuterGridLayout = QGridLayout()
        escOuterGridLayout.setVerticalSpacing(20)

        for idx, item in enumerate(self.telemetryEscData):
            # Inner grid stores Esc data for a single motor to move it to outer grid
            escInternalGrid = QGridLayout()
            escInternalGrid.setVerticalSpacing(5)
            escInternalGrid.setHorizontalSpacing(5)

            for index, (key, label) in enumerate(item.items()):
                keyEscWidget = QLabel(key)
                keyEscWidget.setFont(self.font)
                keyEscWidget.setObjectName("ESC-Key")

                valueEscWidget = QLabel(f"{label[0]}")
                valueEscWidget.setFont(self.font)
                valueEscWidget.setObjectName("ESC-Value")  #

                escInternalGrid.addWidget(keyEscWidget, index, 0)
                escInternalGrid.addWidget(valueEscWidget, index, 1)

                item[key][1] = valueEscWidget

            # Use to store each motor telemetry data in seperate parts of the grid, based of motor number
            if idx <= 1:
                escOuterGridLayout.addLayout(escInternalGrid, 0, idx)
            else:
                escOuterGridLayout.addLayout(escInternalGrid, 1, idx - 2)
        self.layout.addLayout(escOuterGridLayout)

    def updateTelemetryLabels(self, label_values: dict, esc_label_values):
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

        """ For ESC data - loop through all dictionaries in the list and update each dictionary as above"""
        for index, item in enumerate(esc_label_values):
            for key, value in item.items():
                if (
                    key in self.telemetryEscData[index].keys()
                    and self.telemetryEscData[index][key][1] is not None
                ):
                    self.telemetryEscData[index][key][0] = value
                    self.telemetryEscData[index][key][1].setText(f"{value}")

    def getTelemetryLabels(self):
        """
        Get all telemetry labels, very useful for updateTelemetryLabels
        :return dict labels: A list of all label keys and current values
        """
        labels = {}
        for key, value in self.telemetryLabels.items():
            labels[key] = value[0]

        """ append dict labels for each motors telemetry data, to the list motors and return the list"""
        motors = []
        for item in self.telemetryEscData:
            labelsEsc = {}
            for key, value in item.items():
                labelsEsc[key] = value[0]
            motors.append(labelsEsc)
            labelsEsc.clear()
        return motors, labels
