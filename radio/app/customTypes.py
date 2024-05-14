from typing import Any, Union

from typing_extensions import NotRequired, TypedDict

Number = Union[int, float]


class IncomingParam(TypedDict):
    param_id: str
    param_value: Number
    param_type: NotRequired[int]


class Response(TypedDict):
    success: bool
    message: NotRequired[str]
    data: NotRequired[Any]


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
