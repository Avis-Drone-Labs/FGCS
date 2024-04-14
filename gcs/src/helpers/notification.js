import { notifications } from '@mantine/notifications'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export function showErrorNotification(message) {
  notifications.show({
    title: 'Error',
    message: message,
    color: tailwindColors.red[600],
  })
}

export function showSuccessNotification(message) {
  notifications.show({
    title: 'Success',
    message: message,
    color: tailwindColors.green[600],
  })
}

export function showNotification(title, message) {
  notifications.show({
    title: title,
    message: message,
    color: tailwindColors.blue[600],
  })
}
