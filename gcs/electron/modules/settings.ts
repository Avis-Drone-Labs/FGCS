// This file contains logs of disgusting hacky typescript but it DOES
// make it so that accessing a setting which does not exist in default_settings.json 
// causes a build error so we should never crash from accessing non-existant settings

import fs from 'node:fs'
import path from 'node:path'
import { exit } from 'node:process';
import { app, ipcMain } from 'electron';

import Data from "../../data/default_settings.json"
import { logDebug, logFatal, logInfo, logWarning } from './logging';


type SettingsShape = typeof Data;
type SettingsGroup = keyof SettingsShape;
type Setting<G extends SettingsGroup> = keyof SettingsShape[G];

type SettingValue<G extends SettingsGroup, S extends Setting<G>> =
  SettingsShape[G][S] extends { default: infer V } ? V : never;

interface DefaultSetting<G extends SettingsGroup, S extends Setting<G>> {
  default: SettingValue<G, S>,
  [k: string]: any
}

// Hack to create a type which MAY contain keys from the default_settings.json, and each of those keys
// MAY contain any number of the settings listed in that section of default_settings.json
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
    logWarning("Attempting to check app version when user settings have not been loaded");
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
  if (userSettings !== null) return userSettings
  logDebug("Fetching user settings")

  // Directories
  const userDir = app.getPath('userData');
  const config = path.join(userDir, 'settings.json');

  // Write version and blank settings to user config if doesn't exist
  if (!fs.existsSync(config)) {
    logInfo("Generating user setings")
    userSettings = {version: app.getVersion(), settings: {}}
    fs.writeFileSync(config, JSON.stringify(userSettings))
  } else{
    logInfo("Reading user settings from config file " + config)
    userSettings = JSON.parse(fs.readFileSync(config, 'utf-8'))
    checkAppVersion(config)
  }
  if (userSettings != null) return userSettings
  
  logFatal("Could not create settings for some reason")
  exit(-1);
}

function getDefault<G extends SettingsGroup, S extends Setting<G>>(group: G, setting: S): SettingValue<G, S> {
  const df = defaultSettings[group][setting] as DefaultSetting<G, S>
  return df.default
}

/**
 * Get the given user setting (or the default value from default_settings.json)
 * 
 * A method exists for this in the frontend (see the settings provider)
 * but this is useful to have if you need to access a setting in electron 
 * (for example for logging)
 * 
 * @param group
 * @param setting 
 */
export function getSetting<G extends SettingsGroup, S extends Setting<G>>(group: G, setting: S): SettingValue<G, S> {

  // Development settings only take effect in development!
  if (process.env.NODE_ENV == "production" && group == "Development") return getDefault(group, setting)

  //Get user setting or return default if it doesn't exist
  const userConfig = getUserConfiguration().settings[group] as Partial<SettingsShape[G]>;
  const userSetting = userConfig?.[setting];

  if (userSetting) return userSetting as SettingValue<G, S>
  return getDefault(group, setting)
}

export default function registerSettingsIPC(){
    ipcMain.handle("getSettings", () => {return getUserConfiguration(); })
    ipcMain.handle("setSettings", (_, settings) => {saveUserConfiguration(settings)})
}