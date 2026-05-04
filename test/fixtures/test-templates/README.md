# Reference template directory

This is a copy-paste-ready starting point for `compodocx --templates ./test-templates`. Two files demonstrate the JavaScript override system:

- `partials/component.js` — page-level override for the `component` template, replacing the entire ComponentPage rendering with a stripped-down structure.
- `partials/block-method.js` — block-level override for the `block-method` template, exercising every common pattern (data access, conditional rendering, iteration, helper invocation, sub-templates).

Both are CommonJS modules. Each receives `(data, helpers)` and returns a raw HTML string.

See `../../MIGRATION.md` (or the repo root `MIGRATION.md`) for the full helper API and the HBS → JS cookbook.
