# Guides Overview

This section contains in-depth guides for the Kitchen Sink Module application.

## Available Guides

| Guide | Description | Difficulty |
|-|-|-|
| [Authentication](./authentication.md) | Setting up auth guards and interceptors | Intermediate |
| [State Management](./state-management.md) | Using the TodoStore for reactive state | Beginner |
| [Custom Interceptors](./advanced/custom-interceptors.md) | Building your own HTTP interceptors | Advanced |
| [Performance Tuning](./advanced/performance.md) | Optimizing change detection and rendering | Advanced |

## Architecture Diagram

The application follows a layered architecture:

```
┌─────────────────────────────────┐
│         Feature Modules         │
│  (Dashboard, Users, Settings)   │
├─────────────────────────────────┤
│          Shared Module          │
│  (Components, Directives, Pipes)│
├─────────────────────────────────┤
│           Core Module           │
│ (Services, Guards, Interceptors)│
├─────────────────────────────────┤
│         Angular Framework       │
└─────────────────────────────────┘
```
