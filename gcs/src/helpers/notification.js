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

export const redColor = tailwindColors.red[600]
export const greenColor = tailwindColors.green[600]
export const blueColor = tailwindColors.blue[600]
export const yellowColor = tailwindColors.yellow[600]

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
    color: redColor,
    ...notificationTheme,
  })
}

export function showSuccessNotification(message) {
  notifications.show({
    title: "Success",
    message: message,
    color: greenColor,
    ...notificationTheme,
  })
}

export function showWarningNotification(message) {
  notifications.show({
    title: "Warning",
    message: message,
    color: yellowColor,
    ...notificationTheme,
  })
}

export function showInfoNotification(message) {
  notifications.show({
    title: "Info",
    message: message,
    color: blueColor,
    ...notificationTheme,
  })
}

export function showNotification(title, message) {
  notifications.show({
    title: title,
    message: message,
    color: blueColor,
    ...notificationTheme,
  })
}

export function showLoadingNotification(title, message) {
  const id = notifications.show({
    title: title,
    message: message,
    loading: true,
    autoClose: false,
    withCloseButton: false,
    ...notificationTheme,
  })

  return id
}

export function closeLoadingNotification(id, title, message, options = {}) {
  notifications.update({
    id: id,
    title: title,
    message: message,
    loading: false,
    autoClose: 2000,
    color: greenColor,
    ...options,
    ...notificationTheme,
  })
}
