const loggingMiddleware = (store) => (next) => (action) => {
  const result = next(action)
  const state = store.getState()

  if (action.type == "logging/emitLog") {
    state.logging.handlers.forEach((handler) => {
      handler({
        ...action.payload,
        timestamp: action.payload.timestamp ?? Date.now() / 1000,
        level: action.payload.level.toLowerCase(),
      })
  })
  }

  return result
}

export default loggingMiddleware
