from enum import Enum
from typing import Any, Union

from typing_extensions import NotRequired, TypedDict

Number = Union[int, float]


class IncomingParam(TypedDict):
    param_id: str
    param_value: Number
    param_type: NotRequired[int]
    initial_value: NotRequired[Number]


class Response(TypedDict):
    success: bool
    message: NotRequired[str]
    data: NotRequired[Any]


class MotorTestThrottleDurationAndNumber(TypedDict):
    throttle: int
    duration: int
    number_of_motors: int


class MotorTestThrottleAndDuration(TypedDict):
    throttle: int
    duration: int


class MotorTestAllValues(TypedDict):
    motorInstance: int
    throttle: int
    duration: int


class SetFlightModeValueAndNumber(TypedDict):
    mode_number: int
    flight_mode: int


class SetConfigParam(TypedDict):
    param_id: str
    value: Number


class BatchSetConfigParams(TypedDict):
    params: list[SetConfigParam]


class TestServoPwm(TypedDict):
    servo_instance: int
    pwm_value: int


class VehicleType(Enum):
    UNKNOWN = 0
    FIXED_WING = 1
    MULTIROTOR = 2
