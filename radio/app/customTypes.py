from typing import Any, Union

from typing_extensions import NotRequired, TypedDict

Number = Union[int, float]


class IncomingParam(TypedDict):
    param_id: str
    param_value: Number
    param_type: NotRequired[int]


class StoredParam(TypedDict):
    param_id: str
    param_value: Number | str
    param_type: NotRequired[int]
    param_index: int
    last_set: float


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
