import { createContext, useEffect, useState } from "react";

import { setSettingInSettings, getSettingFromSettings } from "./settings";

import DefaultSettings from "../../data/default_settings.json"
import { useDisclosure } from "@mantine/hooks";


const SettingsContext = createContext({});

/**
 * Get the value of a setting based on the name of the setting in dot notation.
 * General -> maptilerAPIKey would be represented as general.maptlierAPIKey
 * @param {*} setting
 * @param {*} settings
 */
export const GetSetting = (setting, settings) => {
    let field = settings;
    const keys = setting.split('.');
    for (let i = 0; i < keys.length - 1; i++){
        console.log(field);
        field = field[keys[i]];
    }

    return field[keys[keys.length-1]]
}

export const SettingsProvider = ({children}) => {
    const [settings, setSettings] = useState(null);

    const [opened, { open, close }] = useDisclosure(true);

    console.log("Initialised settings provider")

    useEffect(() => {
        const fetchSettings = async () => {
            console.log("Fetching settings from electron")
            const data = await window.ipcRenderer.getSettings();
            setSettings(data);
        }
        fetchSettings();
    }, []);

    const setSetting = (setting, value) => {

        if (settings === null)
            return;

        console.log(settings)
        const newSettings = {version: settings.version, settings: setSettingInSettings(setting, value, settings.settings)}

        setSettings(newSettings);
        window.ipcRenderer.saveSettings(newSettings);
    }

    const getSetting = (setting, value) => {
        return getSettingFromSettings(setting, settings.settings, value) || getSettingFromSettings(setting, DefaultSettings, value).default
    }

    return (
        <SettingsContext.Provider value={{getSetting, setSetting, settings, opened, open, close}}>
            {settings !== null ? children : <></>}
        </SettingsContext.Provider>
    )
}

export default SettingsContext;
