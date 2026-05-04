# Migration from NgModules

Step-by-step guide to converting an NgModule-based app to standalone.

## Migration Steps

| Step | Action | Risk |
|-|-|-|
| 1 | Add `standalone: true` to leaf components | Low |
| 2 | Move imports from NgModule to component | Low |
| 3 | Convert services to `providedIn: 'root'` | Medium |
| 4 | Replace class guards with functional guards | Low |
| 5 | Replace class interceptors with functional ones | Medium |
| 6 | Create `ApplicationConfig` | Low |
| 7 | Remove NgModules | High |
| 8 | Switch to `bootstrapApplication()` | High |

## Before (NgModule)

```typescript
@NgModule({
    declarations: [AppComponent, DashboardComponent],
    imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes)],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
```

## After (Standalone)

```typescript
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
    ],
};

bootstrapApplication(AppComponent, appConfig);
```

## Guard Migration

### Before

```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(private router: Router) {}
    canActivate(route, state) {
        // ...
    }
}
```

### After

```typescript
export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    // ...
};
```

## Common Pitfalls

1. **Circular imports** — standalone components importing each other
2. **Missing providers** — services that were in NgModule providers array
3. **Lazy loading** — change `loadChildren` to `loadComponent`
4. **Testing** — replace `TestBed.configureTestingModule` patterns
