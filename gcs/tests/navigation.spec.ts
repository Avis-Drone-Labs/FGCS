import { test, expect } from '@playwright/test';

test.describe('GCS Navigation Tests', () => {
  test('should navigate to dashboard page', async ({ page }) => {
    await page.goto('/');
    
    // Test that the page loads with correct title
    await expect(page).toHaveTitle('FGCS');
    
    // Check that we're on the dashboard page
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should navigate between different pages', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.locator('#root')).toBeVisible();
    
    // Test navigation to config page
    await page.goto('/#/config');
    await expect(page.locator('#root')).toBeVisible();
    
    // Test navigation to missions page  
    await page.goto('/#/missions');
    await expect(page.locator('#root')).toBeVisible();
    
    // Test navigation to graphs page
    await page.goto('/#/graphs');
    await expect(page.locator('#root')).toBeVisible();
    
    // Test navigation to parameters page
    await page.goto('/#/params');
    await expect(page.locator('#root')).toBeVisible();
    
    // Test navigation to FLA page
    await page.goto('/#/fla');
    await expect(page.locator('#root')).toBeVisible();
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

  test('should maintain connection state across navigation', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for disconnected state indicators (if they exist)
    const noDroneElements = page.locator('text=No drone connected');
    if (await noDroneElements.count() > 0) {
      await expect(noDroneElements.first()).toBeVisible();
    }
    
    // Navigate to different pages and verify consistent state
    const pages = ['/#/config', '/#/missions', '/#/graphs', '/#/params', '/#/fla'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await expect(page.locator('#root')).toBeVisible();
      
      // Verify the page loads without errors
      const errors = page.locator('[data-testid="error"], .error, .alert-error');
      if (await errors.count() > 0) {
        await expect(errors.first()).not.toBeVisible();
      }
    }
  });
});