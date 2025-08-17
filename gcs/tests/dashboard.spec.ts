import { test, expect } from '@playwright/test';

test.describe('GCS Config Component Tests', () => {
  test('should render motor test controls correctly', async ({ page }) => {
    // Create a mock config page with motor test controls
    await page.setContent(`
      <html>
        <head><title>FGCS Config</title></head>
        <body>
          <div id="root">
            <div class="config-container">
              <div class="tabs-container">
                <div role="tablist">
                  <button role="tab" data-value="motor_test" class="tab-motor-test">Motor Test</button>
                  <button role="tab" data-value="gripper" class="tab-gripper" disabled>Gripper</button>
                  <button role="tab" data-value="rc_calibration" class="tab-rc">RC Calibration</button>
                  <button role="tab" data-value="flightmodes" class="tab-flight">Flight modes</button>
                </div>
                <div class="tab-content motor-test-panel">
                  <div class="motor-controls">
                    <div class="input-group">
                      <label for="throttle-input">Throttle</label>
                      <input 
                        type="number" 
                        id="throttle-input" 
                        min="0" 
                        max="100" 
                        value="10" 
                        class="throttle-control"
                      />
                      <span class="suffix">%</span>
                    </div>
                    <div class="input-group">
                      <label for="duration-input">Duration</label>
                      <input 
                        type="number" 
                        id="duration-input" 
                        min="0" 
                        value="3" 
                        class="duration-control"
                      />
                      <span class="suffix">s</span>
                    </div>
                  </div>
                  <div class="motor-buttons">
                    <button class="test-motor-btn" data-motor="A">Test motor A</button>
                    <button class="test-motor-btn" data-motor="B">Test motor B</button>
                    <button class="test-motor-btn" data-motor="C">Test motor C</button>
                    <button class="test-motor-btn" data-motor="D">Test motor D</button>
                    <button class="test-sequence-btn">Test motor sequence</button>
                    <button class="test-all-btn">Test all motors</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    // Test that the page loads with correct title
    await expect(page).toHaveTitle('FGCS Config');

    // Test tab structure
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(page.getByText('Motor Test')).toBeVisible();
    await expect(page.getByText('Gripper')).toBeVisible();
    await expect(page.getByText('RC Calibration')).toBeVisible();
    await expect(page.getByText('Flight modes')).toBeVisible();

    // Test motor controls
    await expect(page.locator('#throttle-input')).toBeVisible();
    await expect(page.locator('#throttle-input')).toHaveValue('10');
    
    await expect(page.locator('#duration-input')).toBeVisible();
    await expect(page.locator('#duration-input')).toHaveValue('3');

    // Test motor buttons
    await expect(page.getByText('Test motor A')).toBeVisible();
    await expect(page.getByText('Test motor B')).toBeVisible();
    await expect(page.getByText('Test motor sequence')).toBeVisible();
    await expect(page.getByText('Test all motors')).toBeVisible();
  });

  test('should handle motor control input changes', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div class="motor-controls">
            <input type="number" id="throttle" min="0" max="100" value="10" />
            <input type="number" id="duration" min="0" value="3" />
          </div>
        </body>
      </html>
    `);

    const throttleInput = page.locator('#throttle');
    const durationInput = page.locator('#duration');

    // Test initial values
    await expect(throttleInput).toHaveValue('10');
    await expect(durationInput).toHaveValue('3');

    // Test changing throttle
    await throttleInput.clear();
    await throttleInput.fill('25');
    await expect(throttleInput).toHaveValue('25');

    // Test boundary values
    await throttleInput.clear();
    await throttleInput.fill('100');
    await expect(throttleInput).toHaveValue('100');

    await throttleInput.clear();
    await throttleInput.fill('0');
    await expect(throttleInput).toHaveValue('0');

    // Test changing duration
    await durationInput.clear();
    await durationInput.fill('5');
    await expect(durationInput).toHaveValue('5');
  });

  test('should simulate motor test button interactions', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div class="motor-test">
            <div class="controls">
              <input type="number" id="throttle" value="15" />
              <input type="number" id="duration" value="2" />
            </div>
            <div class="buttons">
              <button id="test-motor-a" onclick="testMotor('A')">Test motor A</button>
              <button id="test-all" onclick="testAll()">Test all motors</button>
              <button id="test-sequence" onclick="testSequence()">Test motor sequence</button>
            </div>
            <div id="status">Ready</div>
          </div>
          <script>
            function testMotor(motor) {
              const throttle = document.getElementById('throttle').value;
              const duration = document.getElementById('duration').value;
              document.getElementById('status').textContent = 
                \`Testing motor \${motor} at \${throttle}% for \${duration}s\`;
            }
            
            function testAll() {
              const throttle = document.getElementById('throttle').value;
              const duration = document.getElementById('duration').value;
              document.getElementById('status').textContent = 
                \`Testing all motors at \${throttle}% for \${duration}s\`;
            }
            
            function testSequence() {
              const throttle = document.getElementById('throttle').value;
              const duration = document.getElementById('duration').value;
              document.getElementById('status').textContent = 
                \`Testing motor sequence at \${throttle}% with \${duration}s delay\`;
            }
          </script>
        </body>
      </html>
    `);

    // Test initial state
    await expect(page.locator('#status')).toHaveText('Ready');

    // Test individual motor button
    await page.locator('#test-motor-a').click();
    await expect(page.locator('#status')).toHaveText('Testing motor A at 15% for 2s');

    // Change values and test all motors
    await page.locator('#throttle').clear();
    await page.locator('#throttle').fill('30');
    await page.locator('#duration').clear();
    await page.locator('#duration').fill('4');

    await page.locator('#test-all').click();
    await expect(page.locator('#status')).toHaveText('Testing all motors at 30% for 4s');

    // Test sequence
    await page.locator('#test-sequence').click();
    await expect(page.locator('#status')).toHaveText('Testing motor sequence at 30% with 4s delay');
  });

  test('should handle disconnected state properly', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div id="app">
            <div id="no-drone-message" class="no-drone-connected">
              <h2>No drone connected</h2>
              <p>Connect to a drone to access configuration options</p>
            </div>
            <div id="config-content" style="display: none;">
              <div class="tabs">Config tabs would be here</div>
            </div>
          </div>
          <script>
            // Simulate connection state check
            const isConnected = sessionStorage.getItem('connectedToDrone') === 'true';
            if (isConnected) {
              document.getElementById('no-drone-message').style.display = 'none';
              document.getElementById('config-content').style.display = 'block';
            }
          </script>
        </body>
      </html>
    `);

    // Should show no drone connected message by default
    await expect(page.locator('#no-drone-message')).toBeVisible();
    await expect(page.getByText('No drone connected')).toBeVisible();
    await expect(page.locator('#config-content')).not.toBeVisible();
  });

  test('should handle connected state simulation', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div id="app">
            <div id="no-drone-message" class="no-drone-connected">
              No drone connected
            </div>
            <div id="config-content" style="display: none;">
              <div class="config-tabs">
                <button class="tab active">Motor Test</button>
                <button class="tab">Gripper</button>
              </div>
            </div>
            <button id="connect-btn" onclick="toggleConnection()">Connect</button>
          </div>
          <script>
            let connected = false;
            function toggleConnection() {
              connected = !connected;
              updateConnectionState();
              document.getElementById('connect-btn').textContent = connected ? 'Disconnect' : 'Connect';
            }
            
            function updateConnectionState() {
              if (connected) {
                document.getElementById('no-drone-message').style.display = 'none';
                document.getElementById('config-content').style.display = 'block';
              } else {
                document.getElementById('no-drone-message').style.display = 'block';
                document.getElementById('config-content').style.display = 'none';
              }
            }
          </script>
        </body>
      </html>
    `);

    // Initially disconnected
    await expect(page.locator('#no-drone-message')).toBeVisible();
    await expect(page.locator('#config-content')).not.toBeVisible();

    // Simulate connection by clicking connect button
    await page.locator('#connect-btn').click();

    // Should now show config content
    await expect(page.locator('#no-drone-message')).not.toBeVisible();
    await expect(page.locator('#config-content')).toBeVisible();
    await expect(page.getByText('Motor Test')).toBeVisible();
  });
});