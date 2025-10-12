import { expect, test } from "@playwright/test"
import {
  cleanupSharedElectronApp,
  getSharedElectronApp,
  getSharedMainWindow,
} from "./electron-fixtures"

test.describe("Dashboard Tests", () => {
  test.beforeAll(async () => {
    await getSharedElectronApp()
  })

  test.afterAll(async () => {
    await cleanupSharedElectronApp()
  })

  test("should have the correct title", async () => {
    const mainWindow = await getSharedMainWindow()
    await expect(mainWindow).toHaveTitle("FGCS")
  })

  test("should load the dashboard", async () => {
    const mainWindow = await getSharedMainWindow()

    await expect(mainWindow.locator("body")).toBeVisible()
    await expect(mainWindow.getByTestId("dashboard")).toBeVisible()
  })
})
