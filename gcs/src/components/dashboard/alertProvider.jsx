/* Alert
 * {
 *     category: AlertCategory,
 *     severity: AlertSeverity,
 *     jsx: <></>
 * }
 */

import { createContext, useContext, useState } from "react";

const AlertContext = createContext();

export default function AlertProvider({ children }) {
    const [alerts, setAlerts] = useState([]);

    function dispatchAlert(alert) {
        const id = Math.random().toString(16).slice(2);
        setAlerts((prevAlerts) => [...prevAlerts, {
            ...alert,
            id
        }]);
        return id;
    }

    function dismissAlert(id) {
        setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id != id));
    }

    return (
        <AlertContext.Provider value={{ alerts, dispatchAlert, dismissAlert }}>
            {children}
        </AlertContext.Provider>
    )
}

export const useAlerts = () => useContext(AlertContext);
