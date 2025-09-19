/*
  Notification system. This contains all the styles for each type of notification in an
  easy to use wrapper.
*/

// 3rd Party Imports
import { notifications } from "@mantine/notifications"

// Tailwind styling
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const notificationTheme = {
  style: {
    backgroundColor: tailwindColors.falcongrey[800],
  },
  radius: "md",
}

export function showErrorNotification(message) {
  notifications.show({
    title: "Error",
    message: message,
    color: tailwindColors.red[600],
    ...notificationTheme,
  })
}

export function showSuccessNotification(message) {
  notifications.show({
    title: "Success",
    message: message,
    color: tailwindColors.green[600],
    ...notificationTheme,
  })
}

export function showInfoNotification(message) {
  notifications.show({
    title: "Info",
    message: message,
    color: tailwindColors.blue[600],
    ...notificationTheme,
  })
}

export function showNotification(title, message) {
  notifications.show({
    title: title,
    message: message,
    color: tailwindColors.blue[600],
    ...notificationTheme,
  })
}
