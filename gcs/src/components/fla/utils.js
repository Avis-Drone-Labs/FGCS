export function hexToRgba(hex, alpha) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16))
  return `rgba(${r},${g},${b},${alpha})`
}

export function readableBytes(bytes) {
  if (bytes === 0) return "0"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const sizes = ["B", "KB", "MB", "GB"]

  return (
    (Math.round((bytes / Math.pow(1024, i)) * 100) / 100).toFixed(2) +
    "" +
    sizes[i]
  )
}
