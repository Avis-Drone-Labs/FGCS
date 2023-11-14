import io

import folium
from PyQt6.QtWebEngineWidgets import QWebEngineView


class MapWidget(QWebEngineView):
    """Map widget which renders a map"""

    STARTING_COORDINATES = (52.780812, -0.707359)

    # Map Boundary Coordinates
    min_lat, max_lat = 52.76674, 52.7925
    min_lon, max_lon = -0.73619, -0.67851

    def __init__(self):
        # Widget Setup
        super().__init__(parent=None)

        self._setupMap()
        self._setupDroneMarker()
        self._setupMapBorder()
        self._setupFlightPath()

        self._updateMap()

    def _setupMap(self):
        """A function to setup the initial map location"""

        self.map = folium.Map(
            max_bounds=True,
            tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attr="Project Falcon attribution",
            zoom_start=17,
            location=self.STARTING_COORDINATES,
            min_lat=self.min_lat,
            max_lat=self.max_lat,
            min_lon=self.min_lon,
            max_lon=self.max_lon,
        )

    def _setupDroneMarker(self):
        """A function to add the drone marker to an initial location"""

        self.drone_marker = folium.Marker(
            location=self.STARTING_COORDINATES,
            tooltip="Drone",
            icon=folium.Icon(color="red"),
        ).add_to(self.map)

    def _setupMapBorder(self):
        """A function to add the temporary border to the map"""

        border_coordinates = [
            (52.7829, -0.7098),
            (52.7799, -0.7098),
            (52.7799, -0.7042),
            (52.7829, -0.7042),
            (52.7829, -0.7098),
        ]

        self.map_border = folium.PolyLine(
            border_coordinates, color="red", weight=2.5, opacity=1
        ).add_to(self.map)

    def _setupFlightPath(self):
        """A function to add the flight path to the map"""

        file = open("mocking/flight_path.txt", "r")
        file_lines = [x.strip() for x in file.readlines()]
        file.close()

        self.flight_progress = 0.0
        self.flight_path_coordinates = [
            (float(x.split()[0]), float(x.split()[1])) for x in file_lines
        ]
        self.flight_path_coordinates.append(self.flight_path_coordinates[0])

        self.flight_path = folium.PolyLine(
            self.flight_path_coordinates,
            color="blue",
            weight=2.0,
            opacity=1,
            dash_array="20",
        ).add_to(self.map)

    def _updateMap(self):
        """A function to update the map view"""

        data = io.BytesIO()
        self.map.save(data, close_file=False)
        self.setHtml(data.getvalue().decode())

    def updateDronePosition(self):
        """A function that moves the drone icon to the correct location"""
        idx = int(self.flight_progress)
        multiplier = self.flight_progress - int(self.flight_progress)
        position = (
            self.flight_path_coordinates[idx][0]
            + (
                self.flight_path_coordinates[idx + 1][0]
                - self.flight_path_coordinates[idx][0]
            )
            * (multiplier),
            self.flight_path_coordinates[idx][1]
            + (
                self.flight_path_coordinates[idx + 1][1]
                - self.flight_path_coordinates[idx][1]
            )
            * (multiplier),
        )
        position = round(position[0], 4), round(position[1], 4)
        self.map.position = position
        self.flight_progress += 0.5
        if int(self.flight_progress) + 1 >= len(self.flight_path_coordinates) - 1:
            self.flight_progress -= len(self.flight_path_coordinates)
