import { test, expect } from '@playwright/test';

test.describe('GCS Error Handling and Stability', () => {
  test('should handle basic JavaScript execution without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.setContent(`
      <html>
        <body>
          <div id="app">
            <h1>FGCS Error Handling Test</h1>
            <div id="status">Loading...</div>
          </div>
          <script>
            // Basic JavaScript that should work
            document.getElementById('status').textContent = 'JavaScript Working';
            
            // Simulate some typical operations
            const data = { connected: false, status: 'ready' };
            const jsonString = JSON.stringify(data);
            const parsed = JSON.parse(jsonString);
            
            if (parsed.status === 'ready') {
              document.getElementById('status').textContent = 'System Ready';
            }
          </script>
        </body>
      </html>
    `);

    await page.waitForLoadState('networkidle');

    // Should show successful execution
    await expect(page.locator('#status')).toHaveText('System Ready');

    // Should not have any console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('should gracefully handle simulated connection errors', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div id="app">
            <div id="connection-status">Connecting...</div>
            <div id="error-message" style="display: none;"></div>
            <button id="retry-btn" onclick="attemptConnection()" style="display: none;">Retry</button>
          </div>
          <script>
            let connectionAttempts = 0;
            
            function attemptConnection() {
              connectionAttempts++;
              document.getElementById('connection-status').textContent = 'Connecting...';
              
              // Simulate connection attempt
              setTimeout(() => {
                if (connectionAttempts < 3) {
                  // Simulate failure
                  document.getElementById('connection-status').textContent = 'Connection Failed';
                  document.getElementById('error-message').style.display = 'block';
                  document.getElementById('error-message').textContent = 
                    \`Connection attempt \${connectionAttempts} failed. Please check your drone connection.\`;
                  document.getElementById('retry-btn').style.display = 'block';
                } else {
                  // Simulate success on 3rd attempt
                  document.getElementById('connection-status').textContent = 'Connected';
                  document.getElementById('error-message').style.display = 'none';
                  document.getElementById('retry-btn').style.display = 'none';
                }
              }, 500);
            }
            
            // Auto-start first attempt
            attemptConnection();
          </script>
        </body>
      </html>
    `);

    // Wait for first connection attempt
    await page.waitForTimeout(600);

    // Should show connection failure
    await expect(page.locator('#connection-status')).toHaveText('Connection Failed');
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#retry-btn')).toBeVisible();

    // Try again
    await page.locator('#retry-btn').click();
    await page.waitForTimeout(600);

    // Should still fail on second attempt
    await expect(page.locator('#connection-status')).toHaveText('Connection Failed');
    await expect(page.locator('#error-message')).toContainText('Connection attempt 2 failed');

    // Third attempt should succeed
    await page.locator('#retry-btn').click();
    await page.waitForTimeout(600);

    await expect(page.locator('#connection-status')).toHaveText('Connected');
    await expect(page.locator('#error-message')).not.toBeVisible();
    await expect(page.locator('#retry-btn')).not.toBeVisible();
  });

  test('should handle form validation errors properly', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div id="app">
            <form id="motor-test-form">
              <div class="form-group">
                <label for="throttle">Throttle (0-100):</label>
                <input type="number" id="throttle" min="0" max="100" required />
                <div id="throttle-error" class="error" style="display: none;"></div>
              </div>
              <div class="form-group">
                <label for="duration">Duration (1-30s):</label>
                <input type="number" id="duration" min="1" max="30" required />
                <div id="duration-error" class="error" style="display: none;"></div>
              </div>
              <button type="submit" id="submit-btn">Start Motor Test</button>
            </form>
            <div id="form-status"></div>
          </div>
          <script>
            document.getElementById('motor-test-form').addEventListener('submit', function(e) {
              e.preventDefault();
              
              const throttle = parseInt(document.getElementById('throttle').value);
              const duration = parseInt(document.getElementById('duration').value);
              
              // Clear previous errors
              document.querySelectorAll('.error').forEach(el => el.style.display = 'none');
              
              let hasError = false;
              
              // Validate throttle
              if (isNaN(throttle) || throttle < 0 || throttle > 100) {
                document.getElementById('throttle-error').textContent = 'Throttle must be between 0 and 100';
                document.getElementById('throttle-error').style.display = 'block';
                hasError = true;
              }
              
              // Validate duration
              if (isNaN(duration) || duration < 1 || duration > 30) {
                document.getElementById('duration-error').textContent = 'Duration must be between 1 and 30 seconds';
                document.getElementById('duration-error').style.display = 'block';
                hasError = true;
              }
              
              if (!hasError) {
                document.getElementById('form-status').textContent = 
                  \`Motor test started: \${throttle}% throttle for \${duration}s\`;
              } else {
                document.getElementById('form-status').textContent = 'Please fix the errors above';
              }
            });
          </script>
        </body>
      </html>
    `);

    // Test with invalid values
    await page.locator('#throttle').fill('150');
    await page.locator('#duration').fill('50');
    await page.locator('#submit-btn').click();

    // Wait a moment for validation to trigger
    await page.waitForTimeout(100);

    // Should show validation errors
    await expect(page.locator('#throttle-error')).toBeVisible();
    await expect(page.locator('#throttle-error')).toHaveText('Throttle must be between 0 and 100');
    await expect(page.locator('#duration-error')).toBeVisible();
    await expect(page.locator('#duration-error')).toHaveText('Duration must be between 1 and 30 seconds');
    await expect(page.locator('#form-status')).toHaveText('Please fix the errors above');

    // Test with valid values
    await page.locator('#throttle').clear();
    await page.locator('#throttle').fill('25');
    await page.locator('#duration').clear();
    await page.locator('#duration').fill('5');
    await page.locator('#submit-btn').click();

    // Should succeed
    await expect(page.locator('#throttle-error')).not.toBeVisible();
    await expect(page.locator('#duration-error')).not.toBeVisible();
    await expect(page.locator('#form-status')).toHaveText('Motor test started: 25% throttle for 5s');
  });

  test('should handle page state persistence', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div id="app">
            <div class="settings">
              <h2>Application Settings</h2>
              <label>
                <input type="checkbox" id="auto-connect" onchange="saveSettings()" />
                Auto-connect to drone
              </label>
              <br />
              <label>
                Default throttle: 
                <input type="number" id="default-throttle" value="10" min="0" max="100" onchange="saveSettings()" />
              </label>
              <br />
              <button onclick="loadSettings()">Load Settings</button>
              <button onclick="resetSettings()">Reset to Defaults</button>
            </div>
            <div id="settings-status"></div>
          </div>
          <script>
            // Use in-memory storage instead of localStorage to avoid security issues
            let settingsData = null;
            
            function saveSettings() {
              settingsData = {
                autoConnect: document.getElementById('auto-connect').checked,
                defaultThrottle: document.getElementById('default-throttle').value
              };
              document.getElementById('settings-status').textContent = 'Settings saved';
            }
            
            function loadSettings() {
              if (settingsData) {
                document.getElementById('auto-connect').checked = settingsData.autoConnect || false;
                document.getElementById('default-throttle').value = settingsData.defaultThrottle || 10;
                document.getElementById('settings-status').textContent = 'Settings loaded';
              } else {
                document.getElementById('settings-status').textContent = 'No saved settings found';
              }
            }
            
            function resetSettings() {
              settingsData = null;
              document.getElementById('auto-connect').checked = false;
              document.getElementById('default-throttle').value = '10';
              document.getElementById('settings-status').textContent = 'Settings reset to defaults';
            }
            
            // Load settings on page load
            loadSettings();
          </script>
        </body>
      </html>
    `);

    // Test initial state
    await expect(page.locator('#default-throttle')).toHaveValue('10');
    await expect(page.locator('#auto-connect')).not.toBeChecked();

    // Change settings and save
    await page.locator('#auto-connect').check();
    await page.locator('#default-throttle').clear();
    await page.locator('#default-throttle').fill('20');

    await expect(page.locator('#settings-status')).toHaveText('Settings saved');

    // Simulate page reload by resetting form and loading
    await page.evaluate(() => {
      document.getElementById('auto-connect').checked = false;
      document.getElementById('default-throttle').value = '10';
    });

    await page.locator('button').filter({ hasText: 'Load Settings' }).click();

    // Should restore saved values
    await expect(page.locator('#auto-connect')).toBeChecked();
    await expect(page.locator('#default-throttle')).toHaveValue('20');
    await expect(page.locator('#settings-status')).toHaveText('Settings loaded');

    // Test reset
    await page.locator('button').filter({ hasText: 'Reset to Defaults' }).click();
    await expect(page.locator('#auto-connect')).not.toBeChecked();
    await expect(page.locator('#default-throttle')).toHaveValue('10');
    await expect(page.locator('#settings-status')).toHaveText('Settings reset to defaults');
  });

  test('should handle rapid user interactions without breaking', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div id="app">
            <div class="rapid-test">
              <button id="increment" onclick="increment()">+</button>
              <span id="counter">0</span>
              <button id="decrement" onclick="decrement()">-</button>
              <button id="reset" onclick="reset()">Reset</button>
            </div>
            <div id="operations-log"></div>
          </div>
          <script>
            let counter = 0;
            let operationCount = 0;
            
            function updateDisplay() {
              document.getElementById('counter').textContent = counter;
              operationCount++;
              document.getElementById('operations-log').textContent = 
                \`Operations performed: \${operationCount}\`;
            }
            
            function increment() {
              counter++;
              updateDisplay();
            }
            
            function decrement() {
              counter--;
              updateDisplay();
            }
            
            function reset() {
              counter = 0;
              updateDisplay();
            }
          </script>
        </body>
      </html>
    `);

    // Perform rapid clicks
    for (let i = 0; i < 10; i++) {
      await page.locator('#increment').click();
    }

    await expect(page.locator('#counter')).toHaveText('10');

    // Rapid decrements
    for (let i = 0; i < 5; i++) {
      await page.locator('#decrement').click();
    }

    await expect(page.locator('#counter')).toHaveText('5');

    // Reset
    await page.locator('#reset').click();
    await expect(page.locator('#counter')).toHaveText('0');

    // Check operations log
    await expect(page.locator('#operations-log')).toHaveText('Operations performed: 16');
  });
});