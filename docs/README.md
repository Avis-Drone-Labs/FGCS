# FGCS Documentation

This directory contains comprehensive technical documentation for the Falcon Ground Control Station (FGCS) project.

## Documentation Overview

### 📚 For New Developers

- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Complete setup, workflow, and best practices
  - Quick start guide
  - Development environment setup
  - Coding standards and conventions
  - Testing procedures
  - Debugging techniques
  - Performance optimization
  - Deployment processes

### 🔧 Backend Documentation

- **[Backend Architecture](BACKEND_ARCHITECTURE.md)** - Backend system design and components
  - Controllers architecture and usage
  - API endpoints documentation
  - Drone state management
  - Error handling and logging
  - Performance considerations

- **[MAVLink Communication](MAVLINK_COMMUNICATION.md)** - Drone communication protocol
  - MAVLink message flow
  - Command lock system
  - Parameter operations
  - Mission upload/download
  - Error handling and recovery
  - Connection management

### 🖥️ Frontend Documentation

- **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** - Frontend system design
  - Redux state management
  - Component organization patterns
  - Data flow and fetching
  - Popout window system
  - Electron integration

## Quick Navigation

### Getting Started
1. Read the [Development Guide](DEVELOPMENT_GUIDE.md) for initial setup
2. Follow the main [README.md](../README.md) for running the application
3. Review architecture docs for understanding the codebase

### Understanding the System
- **Backend Developers**: Start with [Backend Architecture](BACKEND_ARCHITECTURE.md) and [MAVLink Communication](MAVLINK_COMMUNICATION.md)
- **Frontend Developers**: Begin with [Frontend Architecture](FRONTEND_ARCHITECTURE.md)
- **Full Stack**: Review all architecture documents

### Common Tasks
- **Adding a new controller**: See Backend Architecture → Controllers section
- **Creating new Redux slice**: See Frontend Architecture → Redux section
- **Adding API endpoints**: See Backend Architecture → Endpoints section
- **Creating popout windows**: See Frontend Architecture → Popout Windows section
- **Testing changes**: See Development Guide → Testing section

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Frontend                       │
│  ┌─────────────┐    ┌─────────────────────────┐ │
│  │   Electron  │    │        React App        │ │
│  │ Main Process│◄──►│   ┌─────────────────┐   │ │
│  │             │    │   │  Redux Store    │   │ │
│  │  - Windows  │    │   │  - Connection   │   │ │
│  │  - IPC      │    │   │  - Drone Info   │   │ │
│  │  - Backend  │    │   │  - Mission      │   │ │
│  │    Mgmt     │    │   │  - Parameters   │   │ │
│  └─────────────┘    │   └─────────────────┘   │ │
│                     │                         │ │
│                     │  Components:            │ │
│                     │  - Dashboard            │ │
│                     │  - Mission Planner      │ │
│                     │  - Parameter Editor     │ │
│                     │  - Map Interface        │ │
│                     └─────────────────────────┘ │
└─────────────────────────────────────────────────┘
                           │
                    Socket.IO / HTTP
                           │
┌─────────────────────────────────────────────────┐
│                   Backend                       │
│  ┌─────────────────────────────────────────────┐ │
│  │            Flask Application               │ │
│  │                                           │ │
│  │  ┌─────────────┐    ┌─────────────────┐   │ │
│  │  │   Drone     │    │  Controllers    │   │ │
│  │  │   Manager   │◄──►│  - Params       │   │ │
│  │  │             │    │  - Mission      │   │ │
│  │  │ - Connection│    │  - Arm/Disarm   │   │ │
│  │  │ - MAVLink   │    │  - Flight Mode  │   │ │
│  │  │ - Streams   │    │  - Motors       │   │ │
│  │  │ - Commands  │    │  - Navigation   │   │ │
│  │  └─────────────┘    └─────────────────┘   │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                           │
                      MAVLink Protocol
                           │
┌─────────────────────────────────────────────────┐
│                    Drone                        │
│  ┌─────────────────────────────────────────────┐ │
│  │              ArduPilot                      │ │
│  │                                             │ │
│  │  - Flight Controller                        │ │
│  │  - Sensors (GPS, IMU, etc.)                 │ │
│  │  - Motors and Servos                        │ │
│  │  - Radio/Telemetry                          │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Key Concepts

### MAVLink Communication
- **Heartbeat**: Regular status updates from drone
- **Data Streams**: Continuous telemetry (attitude, GPS, battery)
- **Commands**: Control instructions (arm, mode change, mission)
- **Parameters**: Configuration values
- **Mission Items**: Waypoints and commands

### State Management
- **Redux Store**: Centralized application state
- **Real-time Updates**: Socket.IO events update Redux state
- **Component Props**: State flows down via selectors
- **Actions**: Events trigger state changes

### Component Architecture
- **Container Components**: Handle data and state
- **Presentation Components**: Pure UI rendering
- **Custom Hooks**: Reusable logic encapsulation
- **Memoization**: Performance optimization

### Window Management
- **Main Window**: Primary application interface
- **Popout Windows**: Dedicated single-purpose windows
- **IPC Communication**: Inter-process communication
- **State Synchronization**: Shared data between windows

## Contributing

1. **Read the Documentation**: Start with the development guide
2. **Follow Conventions**: Adhere to coding standards
3. **Write Tests**: Include tests for new functionality
4. **Update Docs**: Keep documentation current with changes
5. **Code Review**: Participate in the review process

## Need Help?

- **GitHub Discussions**: [Project Discussions](https://github.com/Avis-Drone-Labs/FGCS/discussions)
- **Issues**: [Bug Reports and Feature Requests](https://github.com/Avis-Drone-Labs/FGCS/issues)
- **Documentation Issues**: Create an issue if docs are unclear or incomplete

## Documentation Maintenance

This documentation should be updated when:
- New features are added
- Architecture changes are made
- APIs are modified
- Deployment procedures change
- Common issues are discovered

Keep documentation current to help future developers understand and contribute to the project effectively.