import { test, expect } from '@playwright/test';

test.describe('GCS Error Handling and Application Stability Tests', () => {
  test('should load application without critical JavaScript errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).toBeVisible();

    // Filter out known/acceptable errors (if any)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') && // Network errors are expected when no server
      !error.includes('WebSocket') && // WebSocket connection errors are expected
      !error.includes('favicon') // Favicon errors are not critical
    );

    // Should not have critical JavaScript errors
    expect(criticalErrors.length).toBe(0);
  });

  test('should display proper disconnection messages when no drone is connected', async ({ page }) => {
    // Test each page that should show disconnection messages
    const pagesWithDisconnectionMessages = [
      { path: '/#/config', expectedMessage: 'Not connected to drone. Please connect to view config' },
      { path: '/#/missions', expectedMessage: 'Not connected to drone. Please connect to view missions' },
      { path: '/#/graphs', expectedMessage: 'Not connected to drone. Please connect to view graphs' },
      { path: '/#/params', expectedMessage: 'Not connected to drone. Please connect to view params' }
    ];
    
    for (const pageInfo of pagesWithDisconnectionMessages) {
      await page.goto(pageInfo.path);
      await expect(page.locator('#root')).toBeVisible();
      
      // Look for the specific full disconnection message
      const disconnectionMessage = page.locator(`text=${pageInfo.expectedMessage}`);
      await expect(disconnectionMessage).toBeVisible();
    }
  });

  test('should handle navigation errors gracefully without breaking application structure', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test navigation to all main pages
    const pages = ['/', '/#/config', '/#/missions', '/#/graphs', '/#/params', '/#/fla'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await expect(page.locator('#root')).toBeVisible();
      
      // Check for error boundaries or critical UI failures
      const errorBoundary = page.locator('[data-testid="error-boundary"], .error-boundary');
      if (await errorBoundary.count() > 0) {
        await expect(errorBoundary.first()).not.toBeVisible();
      }
      
      // Verify the application's core layout components are still present
      const layout = page.locator('nav, [data-testid="navbar"], .navbar');
      if (await layout.count() > 0) {
        await expect(layout.first()).toBeVisible();
      }
    }

    // Filter critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') &&
      !error.includes('WebSocket') &&
      !error.includes('favicon')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should handle page refresh without breaking application functionality', async ({ page }) => {
    // Go to dashboard
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    
    // Refresh the page and verify core elements are still present
    await page.reload();
    await expect(page.locator('#root')).toBeVisible();
    
    // Go to a different page and refresh
    await page.goto('/#/config');
    await expect(page.locator('#root')).toBeVisible();
    
    await page.reload();
    await expect(page.locator('#root')).toBeVisible();
    
    // After refresh, should show disconnection message
    const configMessage = page.locator('text=Not connected to drone. Please connect to view config');
    await expect(configMessage).toBeVisible();
  });

  test('should handle browser back/forward navigation without errors', async ({ page }) => {
    // Navigate through several pages
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    
    await page.goto('/#/config');
    await expect(page.locator('#root')).toBeVisible();
    
    await page.goto('/#/missions');
    await expect(page.locator('#root')).toBeVisible();
    
    // Use browser back button
    await page.goBack();
    await expect(page.locator('#root')).toBeVisible();
    
    await page.goBack();
    await expect(page.locator('#root')).toBeVisible();
    
    // Use browser forward button
    await page.goForward();
    await expect(page.locator('#root')).toBeVisible();
    
    await page.goForward();
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should maintain application stability during rapid navigation cycles', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    
    // Navigate to different pages rapidly
    const pages = ['/#/config', '/#/missions', '/#/graphs', '/#/params', '/#/fla', '/'];
    
    for (let i = 0; i < 3; i++) { // Do this cycle multiple times
      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        await expect(page.locator('#root')).toBeVisible();
        
        // Verify basic application structure remains intact
        const appContainer = page.locator('#root');
        await expect(appContainer).toBeVisible();
        
        // Ensure no critical error messages appear
        const criticalErrorMessages = page.locator('text=/error|exception|failed|crash/i');
        const visibleErrors = await criticalErrorMessages.filter({ hasText: /critical|fatal|crash/i }).count();
        expect(visibleErrors).toBe(0);
      }
    }
  });

  test('should handle invalid routes gracefully and allow recovery', async ({ page }) => {
    // Try to navigate to a non-existent route
    await page.goto('/#/invalid-route');
    
    // Should still show the app container (React Router should handle this)
    await expect(page.locator('#root')).toBeVisible();
    
    // Try another invalid route
    await page.goto('/#/does-not-exist');
    await expect(page.locator('#root')).toBeVisible();
    
    // Should be able to navigate back to valid routes
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    
    // Verify we can still navigate to other valid routes after invalid ones
    await page.goto('/#/config');
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should handle window resize without breaking layout', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1280, height: 720 },
      { width: 800, height: 600 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow layout to adjust
      
      // Verify the app is still visible and functional
      await expect(page.locator('#root')).toBeVisible();
      
      // Test navigation still works at different screen sizes
      await page.goto('/#/config');
      await expect(page.locator('#root')).toBeVisible();
    }
  });
});