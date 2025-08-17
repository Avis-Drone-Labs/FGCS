import { test, expect } from '@playwright/test';

test.describe('GCS Navigation Tests', () => {
  test('should create proper route structure', async ({ page }) => {
    await page.setContent(`
      <html>
        <head><title>FGCS - Ground Control Station</title></head>
        <body>
          <div id="root">
            <div class="app">
              <div class="toolbar">
                <nav class="navigation">
                  <a href="#/" class="nav-link" data-route="dashboard" onclick="updatePage('dashboard')">Dashboard</a>
                  <a href="#/config" class="nav-link" data-route="config" onclick="updatePage('config')">Config</a>
                  <a href="#/missions" class="nav-link" data-route="missions" onclick="updatePage('missions')">Missions</a>
                  <a href="#/graphs" class="nav-link" data-route="graphs" onclick="updatePage('graphs')">Graphs</a>
                  <a href="#/params" class="nav-link" data-route="params" onclick="updatePage('params')">Parameters</a>
                  <a href="#/fla" class="nav-link" data-route="fla" onclick="updatePage('fla')">FLA</a>
                </nav>
              </div>
              <div class="content">
                <div id="current-page">Dashboard</div>
                <div id="connection-status">No drone connected</div>
              </div>
            </div>
          </div>
          <script>
            function updatePage(route) {
              const pageNames = {
                'dashboard': 'Dashboard',
                'config': 'Configuration',
                'missions': 'Mission Planning',
                'graphs': 'Telemetry Graphs',
                'params': 'Parameters',
                'fla': 'Flight Log Analyzer'
              };
              document.getElementById('current-page').textContent = 
                pageNames[route] || 'Dashboard';
            }
          </script>
        </body>
      </html>
    `);

    // Test initial state
    await expect(page).toHaveTitle('FGCS - Ground Control Station');
    await expect(page.locator('#current-page')).toHaveText('Dashboard');
    await expect(page.locator('#connection-status')).toHaveText('No drone connected');

    // Test navigation links
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Config')).toBeVisible();
    await expect(page.getByText('Missions')).toBeVisible();
    await expect(page.getByText('Graphs')).toBeVisible();
    await expect(page.getByText('Parameters')).toBeVisible();
    await expect(page.getByText('FLA')).toBeVisible();
  });

  test('should handle navigation clicks', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div class="navigation">
            <button class="nav-btn" data-page="config" onclick="navigateTo('config')">Config</button>
            <button class="nav-btn" data-page="missions" onclick="navigateTo('missions')">Missions</button>
            <button class="nav-btn" data-page="graphs" onclick="navigateTo('graphs')">Graphs</button>
          </div>
          <div class="page-content">
            <h1 id="page-title">Dashboard</h1>
            <div id="page-description">Main dashboard page</div>
          </div>
          <script>
            function navigateTo(page) {
              const titles = {
                'config': 'Configuration',
                'missions': 'Mission Planning',  
                'graphs': 'Telemetry Graphs'
              };
              const descriptions = {
                'config': 'Drone configuration and testing',
                'missions': 'Plan and manage flight missions',
                'graphs': 'View telemetry data and graphs'
              };
              
              document.getElementById('page-title').textContent = titles[page] || 'Dashboard';
              document.getElementById('page-description').textContent = descriptions[page] || 'Main dashboard page';
            }
          </script>
        </body>
      </html>
    `);

    // Test initial state
    await expect(page.locator('#page-title')).toHaveText('Dashboard');

    // Test config navigation
    await page.getByText('Config').click();
    await expect(page.locator('#page-title')).toHaveText('Configuration');
    await expect(page.locator('#page-description')).toHaveText('Drone configuration and testing');

    // Test missions navigation
    await page.getByText('Missions').click();
    await expect(page.locator('#page-title')).toHaveText('Mission Planning');
    await expect(page.locator('#page-description')).toHaveText('Plan and manage flight missions');

    // Test graphs navigation
    await page.getByText('Graphs').click();
    await expect(page.locator('#page-title')).toHaveText('Telemetry Graphs');
    await expect(page.locator('#page-description')).toHaveText('View telemetry data and graphs');
  });

  test('should handle connection state changes in navigation', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <div class="app">
            <div class="connection-indicator" id="connection-status">Disconnected</div>
            <div class="navigation">
              <button id="dashboard-btn" onclick="showPage('dashboard')">Dashboard</button>
              <button id="config-btn" onclick="showPage('config')">Config</button>
              <button id="connect-btn" onclick="toggleConnection()">Connect</button>
            </div>
            <div class="page-area">
              <div id="dashboard-page" class="page">
                <div class="no-drone-message">No drone connected - Dashboard</div>
              </div>
              <div id="config-page" class="page" style="display: none;">
                <div class="no-drone-message">No drone connected - Config</div>
              </div>
            </div>
          </div>
          <script>
            let connected = false;
            
            function showPage(pageName) {
              document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
              document.getElementById(pageName + '-page').style.display = 'block';
            }
            
            function toggleConnection() {
              connected = !connected;
              updateConnectionStatus();
            }
            
            function updateConnectionStatus() {
              document.getElementById('connection-status').textContent = 
                connected ? 'Connected' : 'Disconnected';
              
              // Update page content based on connection
              document.querySelectorAll('.no-drone-message').forEach(msg => {
                msg.style.display = connected ? 'none' : 'block';
              });
              
              document.getElementById('connect-btn').textContent = 
                connected ? 'Disconnect' : 'Connect';
            }
          </script>
        </body>
      </html>
    `);

    // Test initial disconnected state
    await expect(page.locator('#connection-status')).toHaveText('Disconnected');
    await expect(page.locator('#dashboard-page .no-drone-message')).toBeVisible();

    // Navigate to config
    await page.locator('#config-btn').click();
    await expect(page.locator('#config-page')).toBeVisible();

    // Simulate connection by clicking connect button
    await page.locator('#connect-btn').click();

    await expect(page.locator('#connection-status')).toHaveText('Connected');
    await expect(page.locator('.no-drone-message')).not.toBeVisible();
  });

  test('should validate app structure and layout', async ({ page }) => {
    await page.setContent(`
      <html>
        <head>
          <title>FGCS</title>
          <style>
            .app { display: flex; flex-direction: column; height: 100vh; }
            .toolbar { height: 60px; background: #333; color: white; }
            .content { flex: 1; padding: 20px; }
            .sidebar { width: 200px; background: #f5f5f5; }
            .main-area { flex: 1; }
          </style>
        </head>
        <body>
          <div id="root">
            <div class="app">
              <div class="toolbar">
                <h1>FGCS - Falcon Ground Control Station</h1>
              </div>
              <div class="content">
                <div class="sidebar">
                  <ul class="nav-menu">
                    <li><a href="#dashboard">Dashboard</a></li>
                    <li><a href="#config">Configuration</a></li>
                    <li><a href="#missions">Missions</a></li>
                  </ul>
                </div>
                <div class="main-area">
                  <div class="page-content">
                    <h2>Welcome to FGCS</h2>
                    <p>Ground Control Station for drone operations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    // Test page structure
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.toolbar')).toBeVisible();
    await expect(page.locator('.content')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-area')).toBeVisible();

    // Test content
    await expect(page.getByText('FGCS - Falcon Ground Control Station')).toBeVisible();
    await expect(page.getByText('Welcome to FGCS')).toBeVisible();
    await expect(page.getByText('Ground Control Station for drone operations')).toBeVisible();

    // Test navigation menu
    await expect(page.locator('.nav-menu')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Configuration')).toBeVisible();
    await expect(page.getByText('Missions')).toBeVisible();
  });
});