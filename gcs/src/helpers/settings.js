import { useContext } from "react";
import SettingsContext from "./settingsProvider";

export const useSettings = () => {
    return useContext(SettingsContext);
};

/**
 *
 * @param {string} setting
 * @param {object} settings
 * @returns
 */
export const getSettingFromSettings = (setting, settings) => {
    console.info("Fetching setting " + setting + "from:")
    console.info(settings)
    let field = settings;
    const keys = setting.split(".");
    for (let i = 0; i < keys.length; i++){
        console.log(field)
        if (field === undefined)
            return null
        field = field[keys[i]];
    }
    return field
}

export const setSettingInSettings = (setting, value, settings) => {

    const newSettings = {...settings.settings};

    let field = newSettings.settings;
    const keys = setting.split(".");
    for (let i = 0; i < keys.length - 1; i++){
        field = field[keys[i]];
    }
    field[keys[keys.length - 1]] = value;

    return newSettings;
}
