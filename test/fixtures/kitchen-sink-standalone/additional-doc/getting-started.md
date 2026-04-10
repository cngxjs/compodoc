# Getting Started

Welcome to the **Kitchen Sink Standalone** demo — a modern Angular app with no NgModules.

## Prerequisites

| Requirement | Version |
|-|-|
| Node.js | >= 20.0.0 |
| Angular CLI | >= 17.0.0 |
| TypeScript | >= 5.3.0 |

## Installation

```bash
npm install
ng serve
```

## Key Concepts

### Standalone Components

Every component is self-contained:

```typescript
@Component({
    standalone: true,
    imports: [CommonModule, RouterOutlet],
    template: `<router-outlet />`,
})
export class AppComponent {}
```

### Signal-Based State

The app uses Angular signals for reactive state:

```typescript
readonly count = signal(0);
readonly doubled = computed(() => this.count() * 2);

increment() {
    this.count.update(c => c + 1);
}
```

### Functional Providers

Configuration uses the `provide*` / `with*` pattern:

```typescript
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(withInterceptors([authInterceptor])),
    ],
};
```

## Architecture

```
src/app/
├── core/          # Singleton services, guards, interceptors, tokens
├── shared/        # Reusable standalone components, directives, pipes
├── features/      # Feature pages (lazy-loaded)
├── app.config.ts  # ApplicationConfig
├── app.routes.ts  # Route definitions
└── providers.ts   # Functional provider utilities
```

> **Tip:** All components are lazy-loaded via `loadComponent` in the routes.
