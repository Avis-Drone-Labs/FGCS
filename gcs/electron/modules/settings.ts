// This file contains logs of disgusting typescript but it DOES
// make it so that accessing a setting which does not exist in default_settings.json 
// prevents compilation so that's good

import fs from 'node:fs'
import path from 'node:path'
import { app, ipcMain } from 'electron';
import { exit } from 'node:process';
import { frontendLogger } from './logging';

import Data from "../../data/default_settings.json"


type SettingsShape = typeof Data;
type SettingsGroup = keyof SettingsShape;
type Setting<G extends SettingsGroup> = keyof SettingsShape[G];

type SettingValue<G extends SettingsGroup, S extends Setting<G>> =
  SettingsShape[G][S] extends { default: infer V } ? V : never;

interface DefaultSetting<G extends SettingsGroup, S extends Setting<G>> {
  default: SettingValue<G, S>,
  [k: string]: any
}



type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
type PartialSettings = DeepPartial<SettingsShape>

interface Settings {
  version: string,
  settings: PartialSettings
}


let userSettings: Settings | null = null
const defaultSettings: SettingsShape = Data

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
export function getUserConfiguration(): Settings{

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
  
  frontendLogger.fatal("Could not create settings for some reason")
  exit(-1);
}

/**
 * Get the given user setting
 * 
 * A method exists for this in the frontend (see the settings provider)
 * but this is useful to have if you need to access a setting in electron 
 * (for example for logging)
 * 
 * @param group
 * @param setting 
 */
export function getSetting<G extends SettingsGroup, S extends Setting<G>>(group: G, setting: S): SettingValue<G, S> {

  const userConfig = getUserConfiguration().settings[group] as Partial<SettingsShape[G]> | undefined;
  const userSetting = userConfig?.[setting];

  if (userSetting) return userSetting as SettingValue<G, S>

  // Fallback to the defaultSettings

  const defaultSetting = defaultSettings[group][setting] as DefaultSetting<G, S>
  return defaultSetting.default
}

export default function registerSettingsIPC(){
    ipcMain.handle("getSettings", () => {return getUserConfiguration(); })
    ipcMain.handle("setSettings", (_, settings) => {saveUserConfiguration(settings)})
}