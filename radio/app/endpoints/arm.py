from typing_extensions import TypedDict

import app.droneStatus as droneStatus
from app import socketio


class ArmDisarmType(TypedDict):
    arm: bool
    force: bool


@socketio.on("arm_disarm")
def arm(data: ArmDisarmType) -> None:
    """
    Attempts to arm/disarm the drone

    Args:
      data: The data from the client, this contains "arm" which us whether to arm or disarm, and "force" which forces arming/disarming
    """
    if not droneStatus.drone:
        return

    arm = data.get("arm", None)
    if arm is None:
        return

    force = data.get("force", False)

    if arm:
        result = droneStatus.drone.armController.arm(force)
    else:
        result = droneStatus.drone.armController.disarm(force)

    socketio.emit("arm_disarm", result)
