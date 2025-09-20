# Frontend Architecture Guide

The FGCS frontend is an Electron application built with React, Vite, and Redux Toolkit.

## Technology Stack

- **Electron**: Desktop application framework
- **React**: UI component library
- **Vite**: Build tool and development server
- **Redux Toolkit**: State management
- **Mantine**: Component library
- **Socket.IO Client**: Real-time communication with backend

## Project Structure

``` basg
gcs/
├── electron/           # Electron related files
│   ├── modules/        # Popout windows
│   ├── main.ts         # Main process entry point
│   └── preload.js      # Preload scripts
├── src/                # React application source
│   ├── components/     # React components
│   ├── redux/          # Redux store and slices
│   ├── helpers/        # Utility functions
│   └── css/            # Stylesheets
├── public/             # Static assets
└── data/               # Generated data
```

## Redux State Management

### Store Structure (`src/redux/store.js`)

```javascript
import { configureStore } from '@reduxjs/toolkit'
import droneConnectionSlice from './slices/droneConnectionSlice'
import droneInfoSlice from './slices/droneInfoSlice'
import missionSlice from './slices/missionSlice'
import paramsSlice from './slices/paramsSlice'
import socketSlice from './slices/socketSlice'
import statusTextSlice from './slices/statusTextSlice'
import notificationSlice from './slices/notificationSlice'

export const store = configureStore({
  reducer: {
    droneConnection: droneConnectionSlice.reducer,
    droneInfo: droneInfoSlice.reducer,
    mission: missionSlice.reducer,
    params: paramsSlice.reducer,
    socket: socketSlice.reducer,
    statusText: statusTextSlice.reducer,
    notifications: notificationSlice.reducer,
  },
})
```

### Redux Architecture Overview

The application uses Redux Toolkit with multiple slices to manage different aspects of the application state:

#### State Organization

- **Connection Management**: Handles drone connection status, port selection, and network configuration
- **Drone Data**: Manages real-time telemetry data including attitude, GPS, battery, and system status
- **Mission Planning**: Stores mission waypoints, upload progress, and execution state
- **Parameters**: Manages drone parameter data, modifications, and synchronization
- **Socket Communication**: Handles Socket.IO connection state and event management
- **UI State**: Manages notifications, status messages, and user interface state
- **etc**

#### Redux Patterns

- **Slice-based Organization**: Each major feature area has its own slice with dedicated actions and reducers
- **Memoized Selectors**: Performance-optimized selectors using `createSelector` for derived state
- **Real-time Updates**: Socket.IO events automatically dispatch Redux actions to update state
