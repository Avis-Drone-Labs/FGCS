from flask_socketio import Namespace

from app import logger


class TelemetryNamespace(Namespace):
    """Namespace handler for /telemetry"""

    def on_connect(self):
        """Handle client connection to telemetry namespace"""
        logger.info("Client connected to telemetry namespace")

    def on_disconnect(self):
        """Handle client disconnection from telemetry namespace"""
        logger.info("Client disconnected from telemetry namespace")
