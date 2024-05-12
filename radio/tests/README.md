# Testing

To write test please create a file thats starts with `test_` so that `pytest` can pick it up. If you are using `@falcon_test` then ensure you have `flask_client` and `socketio_client` as parameters so that they can be passed in from the wrapper.