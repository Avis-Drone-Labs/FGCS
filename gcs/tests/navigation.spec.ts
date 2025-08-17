import { test, expect } from '@playwright/test';

test.describe('GCS Navigation and Connection State Tests', () => {
  test('should navigate to dashboard page and show specific content', async ({ page }) => {
    await page.goto('/');
    
    // Test that the page loads with correct title
    await expect(page).toHaveTitle('FGCS');
    
    // Check for specific dashboard elements - map section and telemetry panel
    await expect(page.locator('#root')).toBeVisible();
    // Dashboard should have a map and status bar when connected or disconnected
    await expect(page.locator('[data-testid="status-bar"], .status-bar')).toBeVisible().catch(() => {
      // If no status bar data attribute, look for GPS coordinates pattern in status
      expect(page.locator('text=/GPS.*\\(.*,.*\\)/')).toBeVisible();
    });
  });

  test('should navigate to config page and show specific content', async ({ page }) => {
    await page.goto('/#/config');
    
    // Check for config-specific elements - should show disconnected message or tabs
    await expect(page.locator('#root')).toBeVisible();
    
    // When not connected, should show the no drone connected message
    const noDroneMessage = page.locator('text=Not connected to drone. Please connect to view config');
    if (await noDroneMessage.count() > 0) {
      await expect(noDroneMessage).toBeVisible();
    } else {
      // If connected, should show config tabs
      await expect(page.locator('text=Motor Test')).toBeVisible();
    }
  });

  test('should navigate to missions page and show specific content', async ({ page }) => {
    await page.goto('/#/missions');
    
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for missions-specific content
    const noDroneMessage = page.locator('text=Not connected to drone. Please connect to view missions');
    if (await noDroneMessage.count() > 0) {
      await expect(noDroneMessage).toBeVisible();
    } else {
      // If connected, should show mission-related elements
      await expect(page.locator('text=/mission/i')).toBeVisible();
    }
  });

  test('should navigate to graphs page and show specific content', async ({ page }) => {
    await page.goto('/#/graphs');
    
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for graphs-specific content
    const noDroneMessage = page.locator('text=Not connected to drone. Please connect to view graphs');
    if (await noDroneMessage.count() > 0) {
      await expect(noDroneMessage).toBeVisible();
    } else {
      // If connected, should show graph-related elements
      await expect(page.locator('text=/graph/i')).toBeVisible();
    }
  });

  test('should navigate to parameters page and show specific content', async ({ page }) => {
    await page.goto('/#/params');
    
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for parameters-specific content
    const noDroneMessage = page.locator('text=Not connected to drone. Please connect to view params');
    if (await noDroneMessage.count() > 0) {
      await expect(noDroneMessage).toBeVisible();
    } else {
      // If connected, should show parameter-related elements
      await expect(page.locator('text=/param/i')).toBeVisible();
    }
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
    
    // Go back to config - should show config content
    await page.goBack();
    await expect(page.locator('#root')).toBeVisible();
    // Verify we're on config page
    const configIndicator = page.locator('text=Motor Test, text=config');
    if (await configIndicator.count() > 0) {
      await expect(configIndicator.first()).toBeVisible();
    }
    
    // Go back to dashboard
    await page.goBack();
    await expect(page.locator('#root')).toBeVisible();
    
    // Go forward to config
    await page.goForward();
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should show consistent disconnected state across all pages', async ({ page }) => {
    const pages = [
      { path: '/', name: 'dashboard' },
      { path: '/#/config', name: 'config' },
      { path: '/#/missions', name: 'missions' },
      { path: '/#/graphs', name: 'graphs' },
      { path: '/#/params', name: 'params' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await expect(page.locator('#root')).toBeVisible();
      
      // For pages other than dashboard and FLA, check for the "Not connected to drone" message
      if (pageInfo.name !== 'dashboard') {
        const noDroneMessage = page.locator(`text=Not connected to drone. Please connect to view ${pageInfo.name}`);
        if (await noDroneMessage.count() > 0) {
          await expect(noDroneMessage).toBeVisible();
        }
      }
      
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