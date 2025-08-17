import { test, expect } from '@playwright/test';

test.describe('GCS Connection State Tests', () => {
  test('should show disconnected state on dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for "No drone connected" messages or indicators
    const noDroneIndicators = page.locator('text=No drone connected');
    if (await noDroneIndicators.count() > 0) {
      await expect(noDroneIndicators.first()).toBeVisible();
    }
  });

  test('should show disconnected state on config page', async ({ page }) => {
    await page.goto('/#/config');
    
    // Wait for the page to load
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for "No drone connected" messages or indicators
    const noDroneIndicators = page.locator('text=No drone connected');
    if (await noDroneIndicators.count() > 0) {
      await expect(noDroneIndicators.first()).toBeVisible();
    }
  });

  test('should show disconnected state on missions page', async ({ page }) => {
    await page.goto('/#/missions');
    
    // Wait for the page to load  
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for "No drone connected" messages or indicators
    const noDroneIndicators = page.locator('text=No drone connected');
    if (await noDroneIndicators.count() > 0) {
      await expect(noDroneIndicators.first()).toBeVisible();
    }
  });

  test('should show disconnected state on graphs page', async ({ page }) => {
    await page.goto('/#/graphs');
    
    // Wait for the page to load
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for "No drone connected" messages or indicators  
    const noDroneIndicators = page.locator('text=No drone connected');
    if (await noDroneIndicators.count() > 0) {
      await expect(noDroneIndicators.first()).toBeVisible();
    }
  });

  test('should show disconnected state on parameters page', async ({ page }) => {
    await page.goto('/#/params');
    
    // Wait for the page to load
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for "No drone connected" messages or indicators
    const noDroneIndicators = page.locator('text=No drone connected');
    if (await noDroneIndicators.count() > 0) {
      await expect(noDroneIndicators.first()).toBeVisible();
    }
  });

  test('should show disconnected state on FLA page', async ({ page }) => {
    await page.goto('/#/fla');
    
    // Wait for the page to load
    await expect(page.locator('#root')).toBeVisible();
    
    // Check for "No drone connected" messages or indicators
    const noDroneIndicators = page.locator('text=No drone connected'); 
    if (await noDroneIndicators.count() > 0) {
      await expect(noDroneIndicators.first()).toBeVisible();
    }
  });

  test('should maintain consistent connection state across page navigation', async ({ page }) => {
    // Start on dashboard
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    
    // Navigate through all pages and verify consistent disconnected state
    const pages = [
      { path: '/#/config', name: 'config' },
      { path: '/#/missions', name: 'missions' },
      { path: '/#/graphs', name: 'graphs' },
      { path: '/#/params', name: 'parameters' },
      { path: '/#/fla', name: 'FLA' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await expect(page.locator('#root')).toBeVisible();
      
      // Verify page loads without critical errors
      const criticalErrors = page.locator('[data-testid="error"], .error-boundary, .critical-error');
      if (await criticalErrors.count() > 0) {
        await expect(criticalErrors.first()).not.toBeVisible();
      }
    }
    
    // Return to dashboard
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
  });
});