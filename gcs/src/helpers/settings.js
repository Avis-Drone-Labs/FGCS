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
    let field = settings;
    const keys = setting.split(".");
    for (let i = 0; i < keys.length; i++){
        field = field[keys[i]];
        if (field === undefined)
            return null
    }
    return field
}

export const setSettingInSettings = (setting, value, settings) => {

    let field = settings;
    const keys = setting.split(".");
    for (let i = 0; i < keys.length - 1; i++){
        if (!Object.hasOwn(field, keys[i]))
            field[keys[i]] = {}
        field = field[keys[i]];
    }
    field[keys[keys.length - 1]] = value;

    return settings;
}
