# Changelog

All notable changes to this project.

## [1.3.0] - 2024-12-01

### Added
- `InheritedCardComponent` with multi-level inheritance
- `FileSizePipe` for byte formatting
- `CacheInterceptor` for HTTP response caching
- Feature flag guard support

### Changed
- `TodoStore` now supports batch operations
- Improved typing for `GenericTableComponent`

### Deprecated
- `LOGGER_FN` token — use `NotificationService` instead
- `SafeHtmlPipe` — use Angular built-in sanitization
- `TodoPriority.Critical` — use `High` with a due date

## [1.2.0] - 2024-09-15

### Added
- `RoleGuard` with configurable role requirements
- `DebounceClickDirective` for form submission
- `@beta` and `@since` JSDoc tag support

### Fixed
- `TodoStore.filter()` now handles undefined tags correctly

## [1.1.0] - 2024-06-01

### Added
- `NotificationService` with severity levels
- `TimeAgoPipe` (impure)
- `CacheService` with TTL support

## [1.0.0] - 2024-03-01

### Added
- Initial release with core module architecture
- `TodoStore` with CRUD and persistence
- `AuthGuard`, `UnsavedChangesGuard`
- `AuthInterceptor`, `LoggingInterceptor`
- Shared components, directives, pipes
