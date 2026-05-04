# Getting Started

Welcome to the **Kitchen Sink Module** demo application. This guide covers installation, configuration, and first steps.

## Prerequisites

| Requirement | Version | Notes |
|-|-|-|
| Node.js | >= 20.0.0 | LTS recommended |
| npm | >= 10.0.0 | Comes with Node.js |
| Angular CLI | >= 17.0.0 | Install globally |
| TypeScript | >= 5.2.0 | Included in project |

## Installation

```bash
git clone https://github.com/example/kitchen-sink-module.git
cd kitchen-sink-module
npm install
```

## Project Structure

```
src/
├── app/
│   ├── core/           # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   ├── services/
│   │   └── tokens/
│   ├── shared/         # Reusable components, directives, pipes
│   │   ├── components/
│   │   ├── directives/
│   │   ├── interfaces/
│   │   ├── miscellaneous/
│   │   ├── models/
│   │   └── pipes/
│   ├── features/       # Feature modules
│   │   ├── dashboard/
│   │   ├── users/
│   │   └── settings/
│   └── about/
└── assets/
```

## Quick Start

1. Start the development server:

   ```bash
   ng serve
   ```

2. Navigate to `http://localhost:4200/`

3. The app will automatically reload on source changes.

## Configuration

The application uses `InjectionToken` for configuration:

```typescript
import { API_BASE_URL, FEATURE_FLAGS } from './core/tokens/api.tokens';

providers: [
    { provide: API_BASE_URL, useValue: 'https://api.example.com' },
    { provide: FEATURE_FLAGS, useValue: { darkMode: true, newDashboard: false } },
]
```

> **Note:** Feature flags can be toggled at runtime via the admin panel.

## Next Steps

- Read the [Authentication Guide](./guides/authentication.md) to set up login
- Check the [State Management Guide](./guides/state-management.md) for the todo store
- See the [API Reference](./api/api-reference.md) for detailed method documentation
