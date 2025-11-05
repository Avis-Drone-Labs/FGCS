import { createContext, useContext } from "react"

export const AlertContext = createContext()

export const useAlerts = () => useContext(AlertContext)
