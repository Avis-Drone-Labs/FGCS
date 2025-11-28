// Returns the point (x, y) inside a container for a pointer event.
export function getContainerPointFromEvent(event, container) {
  // Validate event and coordinates
  const hasClientCoords =
    event &&
    typeof event.clientX === "number" &&
    typeof event.clientY === "number"

  if (!hasClientCoords) {
    // Fallback safely if event is invalid; caller expects an {x, y} object
    return { x: 0, y: 0 }
  }

  const rect =
    container && typeof container.getBoundingClientRect === "function"
      ? container.getBoundingClientRect()
      : { left: 0, top: 0 }

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  return { x, y }
}
