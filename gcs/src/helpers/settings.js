import { useContext } from "react"
import SettingsContext from "./settingsProvider"

export const useSettings = () => {
  return useContext(SettingsContext)
}


/**
 *
 * @param {string} setting
 * @param {object} settings
 * @returns
 */
export const getSettingFromSettings = (setting, settings) => {
  let field = settings
  const keys = setting.split(".")
  for (let i = 0; i < keys.length; i++) {
    field = field[keys[i]]
    if (field === undefined) return null
  }
  return field
}

export const setSettingInSettings = (setting, value, settings) => {
  let field = settings
  const keys = setting.split(".")

  // Prevent prototype pollution
  const filteredKeys = keys.filter((x) => x !== "__proto__")
  for (let i = 0; i < filteredKeys.length - 1; i++) {
    if (!Object.hasOwn(field, filteredKeys[i])) field[filteredKeys[i]] = {}
    field = field[filteredKeys[i]]
  }
  field[filteredKeys[filteredKeys.length - 1]] = value

  return settings
}
