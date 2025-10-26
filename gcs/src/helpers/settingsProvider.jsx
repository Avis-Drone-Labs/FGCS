import { createContext, useEffect, useState } from "react"

import { getSettingFromSettings, setSettingInSettings } from "./settings"

import { useDisclosure } from "@mantine/hooks"
import DefaultSettings from "../../data/default_settings.json"

const SettingsContext = createContext({})

/**
 * Get the value of a setting based on the name of the setting in dot notation.
 * General -> maptilerAPIKey would be represented as general.maptlierAPIKey
 * @param {*} setting
 * @param {*} settings
 */
export const GetSetting = (setting, settings) => {
  let field = settings
  const keys = setting.split(".")
  for (let i = 0; i < keys.length - 1; i++) {
    field = field[keys[i]]
  }

  return field[keys[keys.length - 1]]
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null)

  const [opened, { open, close }] = useDisclosure(false)

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await window.ipcRenderer.invoke("settings:fetch-settings")
      setSettings(data)
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    const handler = () => open()
    window.ipcRenderer.on("settings:open", handler)
    return () => window.ipcRenderer.removeListener("settings:open", handler)
  }, [open])

  const setSetting = (setting, value) => {
    if (settings === null) return

    const newSettings = {
      version: settings.version,
      settings: setSettingInSettings(setting, value, settings.settings),
    }

    setSettings(newSettings)
    window.ipcRenderer.invoke("settings:save-settings", newSettings)
  }

  const getSetting = (setting) => {
    const userSetting = getSettingFromSettings(setting, settings.settings)

    return userSetting === null
      ? getSettingFromSettings(setting, DefaultSettings).default
      : userSetting
  }

  return (
    <SettingsContext.Provider
      value={{ getSetting, setSetting, settings, opened, open, close }}
    >
      {settings !== null ? children : <></>}
    </SettingsContext.Provider>
  )
}

export default SettingsContext
