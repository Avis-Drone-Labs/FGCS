import { createSlice } from "@reduxjs/toolkit"

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
  },
  reducers: {
    notificationShown: (state) => {
      state.notifications.shift()
    },
    queueNotification: (state, action) => {
      state.notifications.push(action.payload)
    },
    queueErrorNotification: (state, action) => {
      state.notifications.push({ type: "error", message: action.payload })
    },
    queueSuccesssNotification: (state, action) => {
      state.notifications.push({ type: "success", message: action.payload })
    },
  },
  selectors: {
    selectNotificationQueue: (state) => state.notifications,
  },
})

export const {
  notificationShown,
  queueNotification,
  queueErrorNotification,
  queueSuccesssNotification,
} = notificationSlice.actions
export const { selectNotificationQueue } = notificationSlice.selectors

export default notificationSlice
