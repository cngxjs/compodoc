# Kitchen Sink Module Demo

A comprehensive NgModule-based Angular fixture that exercises **every** feature compodocx can document.

## Features

- NgModules with declarations, imports, exports, providers, bootstrap
- Lazy-loaded feature modules with child routes
- Guards (CanActivate, CanActivateChild, CanDeactivate)
- HTTP Interceptors
- InjectionTokens with providedIn and factory
- Components with @Input, @Output, @HostBinding, @HostListener
- View queries (@ViewChild, @ViewChildren, @ContentChild, @ContentChildren)
- Animations (trigger, state, transition)
- Change detection strategies
- View encapsulation modes
- Directives with exportAs
- Pure and impure pipes
- Abstract classes and multi-level inheritance
- Generics in components and services
- Interfaces with extends, index signatures
- Enums (string, numeric, const)
- Type aliases (generics, mapped types, conditional types, unions, intersections)
- Functions (named, default, generic)
- Constants and variables
- Classes with private constructors (factory pattern)
- JSDoc tags: @example, @since, @beta, @deprecated, @internal, @ignore, @category, @route, @storybook, @figma, @slot
- Access modifiers: public, private, protected
- Getters and setters (accessors)
- Observable patterns (BehaviorSubject, operators)

## Running

```bash
compodocx -p tsconfig.json -d docs
```
