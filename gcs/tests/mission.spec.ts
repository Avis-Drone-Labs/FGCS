import { expect, test } from "@playwright/test"
import {
  cleanupSharedElectronApp,
  getSharedElectronApp,
  getSharedMainWindow,
} from "./electron-fixtures"

test.describe("Mission Tests", () => {
  test.beforeAll(async () => {
    await getSharedElectronApp()
  })

  test.afterAll(async () => {
    await cleanupSharedElectronApp()
  })

  test("should be able to navigate to the missions page", async () => {
    const mainWindow = await getSharedMainWindow()

    // Find the link to /missions on the navbar
    const missionsNavButton = mainWindow.locator('a[href="#/missions"]').first()
    await missionsNavButton.click()

    // Expect text 'Missions' to be visible on the page
    await expect(
      mainWindow.locator(
        'p:has-text("Not connected to drone. Please connect to view missions")',
      ),
    ).toBeVisible()
  })
})
