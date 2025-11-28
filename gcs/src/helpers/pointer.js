export function getContainerPointFromEvent(event, container) {
  const rect =
    container && typeof container.getBoundingClientRect === "function"
      ? container.getBoundingClientRect()
      : { left: 0, top: 0 }
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  return { x, y }
}
