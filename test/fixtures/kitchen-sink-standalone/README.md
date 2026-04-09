# Kitchen Sink Standalone Demo

A comprehensive standalone Angular fixture exercising **every** modern feature compodocx can document.

## Features

- Standalone components, directives, pipes (no NgModule)
- ApplicationConfig with functional providers
- Functional guards: CanActivateFn, CanDeactivateFn, CanMatchFn
- Functional HTTP interceptors (HttpInterceptorFn)
- InjectionTokens with providedIn and factory
- Signal APIs: signal(), computed(), effect(), linkedSignal()
- Signal inputs: input(), input.required(), with aliases
- Signal outputs: output()
- Two-way binding: model(), model.required()
- Signal queries: viewChild(), viewChildren(), contentChild(), contentChildren()
- After-render hooks: afterRender(), afterNextRender()
- inject() function for DI
- Component input binding from routes (withComponentInputBinding)
- View transitions (withViewTransitions)
- Async animations (provideAnimationsAsync)
- Lazy-loaded standalone components (loadComponent)
- provide* and with* functional provider patterns
- JSDoc: @example, @since, @beta, @deprecated, @internal, @ignore, @category, @route
- Interfaces with generics, extends, discriminated unions
- Type aliases (mapped, conditional, template literal types)
- Enums (string, numeric)
- Functions (named, default, generic)
- Constants, variables

## Running

```bash
compodocx -p tsconfig.json -d docs
```
