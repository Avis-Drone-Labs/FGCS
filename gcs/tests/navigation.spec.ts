import { test, expect } from '@playwright/test';

test.describe('GCS Navigation and Connection State Tests', () => {
  test('should navigate to dashboard page and load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test that the page loads with correct title
    await expect(page).toHaveTitle('FGCS');
    
    // Check that the root element is visible
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should navigate to config page and show disconnection message', async ({ page }) => {
    await page.goto('/#/config');
    
    await expect(page.locator('#root')).toBeVisible();
    
    // Should show the no drone connected message
    const noDroneMessage = page.locator('text=Not connected to drone. Please connect to view config');
    await expect(noDroneMessage).toBeVisible();
  });

  test('should navigate to missions page and show disconnection message', async ({ page }) => {
    await page.goto('/#/missions');
    
    await expect(page.locator('#root')).toBeVisible();
    
    // Should show the no drone connected message
    const noDroneMessage = page.locator('text=Not connected to drone. Please connect to view missions');
    await expect(noDroneMessage).toBeVisible();
  });

  test('should navigate to graphs page and show disconnection message', async ({ page }) => {
    await page.goto('/#/graphs');
    
    await expect(page.locator('#root')).toBeVisible();
    
    // Should show the no drone connected message
    const noDroneMessage = page.locator('text=Not connected to drone. Please connect to view graphs');
    await expect(noDroneMessage).toBeVisible();
  });

  test('should navigate to parameters page and show disconnection message', async ({ page }) => {
    await page.goto('/#/params');
    
    await expect(page.locator('#root')).toBeVisible();
    
    // Should show the no drone connected message
    const noDroneMessage = page.locator('text=Not connected to drone. Please connect to view params');
    await expect(noDroneMessage).toBeVisible();
  });

  test('should navigate to FLA page and show specific content', async ({ page }) => {
    await page.goto('/#/fla');
    
    await expect(page.locator('#root')).toBeVisible();
    
    // FLA page should show file selection or log analysis interface
    // Look for file button or log-related content
    const fileButton = page.locator('button:has-text("Select"), button:has-text("File"), button:has-text("Load")');
    const logText = page.locator('text=/log/i, text=/analyser/i, text=/falcon/i');
    
    // At least one of these should be visible on the FLA page
    const hasFileButton = await fileButton.count() > 0;
    const hasLogText = await logText.count() > 0;
    
    expect(hasFileButton || hasLogText).toBeTruthy();
  });

  test('should handle navigation using browser back/forward', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    
    // Navigate to config
    await page.goto('/#/config');
    await expect(page.locator('#root')).toBeVisible();
    
    // Navigate to missions
    await page.goto('/#/missions');
    await expect(page.locator('#root')).toBeVisible();
    
    // Go back to config
    await page.goBack();
    await expect(page.locator('#root')).toBeVisible();
    
    // Go back to dashboard
    await page.goBack();
    await expect(page.locator('#root')).toBeVisible();
    
    // Go forward to config
    await page.goForward();
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should show consistent disconnected state across all pages', async ({ page }) => {
    const pages = [
      { path: '/#/config', name: 'config' },
      { path: '/#/missions', name: 'missions' },
      { path: '/#/graphs', name: 'graphs' },
      { path: '/#/params', name: 'params' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await expect(page.locator('#root')).toBeVisible();
      
      // Check for the "Not connected to drone" message
      const noDroneMessage = page.locator(`text=Not connected to drone. Please connect to view ${pageInfo.name}`);
      await expect(noDroneMessage).toBeVisible();
      
      // Verify page loads without critical errors
      const criticalErrors = page.locator('[data-testid="error"], .error-boundary, .critical-error');
      if (await criticalErrors.count() > 0) {
        await expect(criticalErrors.first()).not.toBeVisible();
      }
    }
  });

  test('should maintain consistent navigation state during rapid page switching', async ({ page }) => {
    const pages = ['/', '/#/config', '/#/missions', '/#/graphs', '/#/params', '/#/fla'];
    
    // Navigate through pages multiple times rapidly
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await expect(page.locator('#root')).toBeVisible();
        
        // Verify basic application structure remains intact
        const appContainer = page.locator('#root');
        await expect(appContainer).toBeVisible();
        
        // Brief wait to ensure page is stable
        await page.waitForTimeout(100);
      }
    }
  });
});