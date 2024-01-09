import { notifications } from '@mantine/notifications'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export function showErrorNotification(message) {
  notifications.show({
    title: 'Error',
    message: message,
    color: tailwindColors.red[600]
  })
}