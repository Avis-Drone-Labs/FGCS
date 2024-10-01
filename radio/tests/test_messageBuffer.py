import pytest
from app.utils import MessageBuffer

@pytest.fixture(name="int_buffer")
def int_buffer():
    return MessageBuffer[int]()


def test_messageBuffer_getMessages(int_buffer):
    assert int_buffer.buffer == []

    # Test valid get messages
    int_buffer.buffer = [1,2,3,4,5,6]
    assert int_buffer.getMessages(expected=6, timeout=10) == [1,2,3,4,5,6]

    # Test more than messages
    int_buffer.buffer = [1,2,3,4,5,6]
    assert int_buffer.getMessages(expected=5, timeout=10) == [2,3,4,5,6]
    assert int_buffer.buffer == [1]

    # Test timeout
    int_buffer.buffer = [1,2,3,4,5]
    assert int_buffer.getMessages(expected=6, timeout=3) == [1,2,3,4,5]
    assert int_buffer.buffer == []

def test_mesasgeBuffer_getFirst(int_buffer):
    assert int_buffer.buffer == []

    int_buffer.buffer = [1,2,3,4,5]
    assert int_buffer.findFirst(key=lambda x: x == 4, timeout=2) == 4
    assert int_buffer.buffer == [1,2,3]
