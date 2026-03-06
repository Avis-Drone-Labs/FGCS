import { BrowserWindow } from "electron"

// Get the position for a new window centered on the parent window
export function getCenteredWindowPosition(
  parentWindow: BrowserWindow | undefined,
  windowWidth: number,
  windowHeight: number,
): { x: number; y: number } | undefined {
  if (!parentWindow) {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (focusedWindow) {
      parentWindow = focusedWindow
    } else {
      return undefined
    }
  }

  const parentBounds = parentWindow.getBounds()

  return {
    x: parentBounds.x + Math.floor((parentBounds.width - windowWidth) / 2),
    y: parentBounds.y + Math.floor((parentBounds.height - windowHeight) / 2),
  }
}
