import { test, expect } from '@playwright/test';

test.describe('GCS Error Handling and Stability', () => {
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

  test('should handle navigation errors gracefully', async ({ page }) => {
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
    }

    // Filter critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') &&
      !error.includes('WebSocket') &&
      !error.includes('favicon')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should handle page refresh without breaking', async ({ page }) => {
    // Go to dashboard
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    
    // Refresh the page
    await page.reload();
    await expect(page.locator('#root')).toBeVisible();
    
    // Go to a different page and refresh
    await page.goto('/#/config');
    await expect(page.locator('#root')).toBeVisible();
    
    await page.reload();
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should handle browser back/forward without errors', async ({ page }) => {
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

  test('should maintain application state during navigation', async ({ page }) => {
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
      }
    }
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
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
  });
});