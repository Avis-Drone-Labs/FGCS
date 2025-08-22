import fs from 'node:fs'
import path from 'node:path'
import { app, ipcMain } from 'electron';
import { exit } from 'node:process';

// Settings logic

interface Settings {
  version: string,
  settings: object
}

let userSettings: Settings | null = null

function saveUserConfiguration(settings: Settings){
  userSettings = settings;
  fs.writeFileSync(path.join(app.getPath('userData'), 'settings.json'), JSON.stringify(userSettings, null,  2), 'utf-8');
}

/**
 * Checks the application version within the loaded user settings and updates if it is outdated
 * @param configPath The path to the configuration file
 * @returns
 */
function checkAppVersion(configPath: string){

  if (userSettings === null){
    console.warn("Attempting to check app version when user settings have not been loaded");
    return;
  }

  if (userSettings.version == app.getVersion())
    return;

  userSettings.version = app.getVersion();
  fs.writeFileSync(configPath, JSON.stringify(userSettings))
}

/**
 * Called when the application requests user settings
 *
 * @returns Settings
 */
export function getUserConfiguration(){

  // Return the already loaded user settings if loaded
  console.log("Fetching user settings!");
  if (userSettings !== null) return userSettings


  // Directories
  const userDir = app.getPath('userData');
  const config = path.join(userDir, 'settings.json');

  // Write version and blank settings to user config if doesn't exist
  if (!fs.existsSync(config)) {
    console.log("Generating user settings")
    userSettings = {version: app.getVersion(), settings: {}}
    fs.writeFileSync(config, JSON.stringify(userSettings))
  } else{
    console.log("Reading user settings from config file " + config)
    userSettings = JSON.parse(fs.readFileSync(config, 'utf-8'))
    checkAppVersion(config)
  }
  if (userSettings != null) return userSettings
  exit(-1);
}

export default function registerSettingsIPC(){
    ipcMain.handle("getSettings", () => {return getUserConfiguration(); })
    ipcMain.handle("setSettings", (_, settings) => {saveUserConfiguration(settings)})
}