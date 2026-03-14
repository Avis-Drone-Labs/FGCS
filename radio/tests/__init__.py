from typing import Any

from app import socketio


@socketio.on("incoming_msg")
def ignore_incoming_msg(data: Any) -> None:
    """Silently ignore telemetry incoming_msg events during testing."""
    return None


@socketio.on("link_debug_stats")
def ignore_link_debug_stats(data: Any) -> None:
    """Silently ignore link_debug_stats events during testing."""
    return None
