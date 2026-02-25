import pytest
from app.controllers.missionController import (
    _checkMissionType,
    _convertCoordinate,
    _getCommandName,
    _getMissionName,
)


def test_checkMissionType_valid_mission():
    resp = _checkMissionType(0)
    assert resp["success"] is True


def test_checkMissionType_valid_fence():
    resp = _checkMissionType(1)
    assert resp["success"] is True


def test_checkMissionType_valid_rally():
    resp = _checkMissionType(2)
    assert resp["success"] is True


def test_checkMissionType_invalid_type():
    resp = _checkMissionType(9999)
    assert resp["success"] is False


def test_convertCoordinate_float_to_int():
    result = _convertCoordinate(52.7814618)
    assert isinstance(result, (int, float))
    assert result == 527814618


def test_convertCoordinate_int_to_float():
    result = _convertCoordinate(527814618)
    assert isinstance(result, (int, float))
    assert result == 52.7814618


def test_convertCoordinate_invalid_type_raises():
    with pytest.raises(ValueError) as excinfo:
        _convertCoordinate("not_a_number")

    assert (
        str(excinfo.value)
        == "Invalid coordinate type <class 'str'>. Must be int or float."
    )


def test_getMissionName_mission():
    name = _getMissionName(0)
    assert name == "mission"


def test_getMissionName_fence():
    name = _getMissionName(1)
    assert name == "fence"


def test_getMissionName_rally():
    name = _getMissionName(2)
    assert name == "rally"


def test_getMissionName_invalid_type_raises():
    with pytest.raises(ValueError) as excinfo:
        _getMissionName(9999)

    assert str(excinfo.value) == "Invalid mission type 9999"


def test_getCommandName_known_command():
    name = _getCommandName(16)  # Example known command
    assert isinstance(name, str)
    assert name == "MAV_CMD_NAV_WAYPOINT"


def test_getCommandName_unknown_command():
    name = _getCommandName(9999999)  # Example unknown command
    assert name == "Unknown command 9999999"
