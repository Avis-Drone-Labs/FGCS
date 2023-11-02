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
            max_lon=self.max_lon
        )

    def _setupDroneMarker(self):
        """A function to add the drone marker to an initial location"""

        self.drone_marker = folium.Marker(
            location=self.STARTING_COORDINATES,
            tooltip="Drone",
            icon=folium.Icon(color="red"),
        ).add_to(self.map)

    def _updateMap(self):
        """A function to update the map view"""

        data = io.BytesIO()
        self.map.save(data, close_file=False)
        self.setHtml(data.getvalue().decode())
