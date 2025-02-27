import { createContext, useEffect, useState } from "react";

import { setSettingInSettings, getSettingFromSettings } from "./settings";

import DefaultSettings from "../../data/default_settings.json"


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

    console.log("Initialised settings provider")

    useEffect(() => {
        const fetchSettings = async () => {
            console.log("Loading the settings sk")
            const data = await window.ipcRenderer.getSettings();
            setSettings(data);
        }
        fetchSettings();
    }, []);

    const setSetting = (setting, value) => {

        if (settings === null)
            return;

        const newSettings = {version: settings.version, settings: setSettingInSettings(setting, value, settings)}

        setSettings(newSettings);
        window.ipcRenderer.saveSettings(newSettings);
    }

    const getSetting = (setting, value) => {
        return getSettingFromSettings(setting, settings.settings, value) || getSettingFromSettings(setting, DefaultSettings, value)
    }

    return (
        <SettingsContext.Provider value={{getSetting, setSetting, settings}}>
            {settings !== null ? children : <></>}
        </SettingsContext.Provider>
    )
}

export default SettingsContext;
