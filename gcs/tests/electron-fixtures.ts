import {
  _electron as electron,
  ElectronApplication,
  expect,
  Page,
} from "@playwright/test"

let sharedElectronApp: ElectronApplication | null = null
let sharedMainWindow: Page | null = null

export async function getSharedElectronApp(): Promise<ElectronApplication> {
  if (sharedElectronApp) {
    return sharedElectronApp
  }

  const executePath = "dist-electron/main.js"

  const launchOptions = {
    args: [executePath],
    bypassCSP: true,
  }

  // Disable sandbox in CI environment to avoid permission issues
  if (process.env.CI) {
    launchOptions.args.push("--no-sandbox", "--disable-setuid-sandbox")
  }

  sharedElectronApp = await electron.launch(launchOptions)

  // Wait for the main window to appear
  sharedMainWindow = await sharedElectronApp.waitForEvent("window", {
    predicate: async (window) => {
      const title = await window.title()
      return title.includes("FGCS")
    },
    timeout: 30000,
  })

  await new Promise((resolve) => setTimeout(resolve, 1000))
  expect(sharedMainWindow).toBeDefined()

  await sharedMainWindow.waitForLoadState("domcontentloaded")

  return sharedElectronApp
}

export async function getSharedMainWindow(): Promise<Page> {
  if (!sharedMainWindow) {
    await getSharedElectronApp() // This will create both app and window
  }

  if (!sharedMainWindow) {
    throw new Error("Main window not found")
  }

  return sharedMainWindow
}

export async function cleanupSharedElectronApp(): Promise<void> {
  if (sharedElectronApp) {
    await sharedElectronApp.close()
    sharedElectronApp = null
    sharedMainWindow = null
  }
}
