# compodocx

Modern documentation tool for Angular applications.

Fork of [compodoc](https://github.com/compodoc/compodoc) by Vincent Ogloblinsky, rebuilt as an Angular-focused documentation tool under the [cngx](https://github.com/cngxjs) ecosystem.

[![CI](https://github.com/cngxjs/compodocx/workflows/CI/badge.svg)](https://github.com/cngxjs/compodocx/actions)
[![npm](https://img.shields.io/npm/v/@cngx/compodocx.svg)](https://www.npmjs.com/package/@cngx/compodocx)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

## Features

- **Angular-only** -- Built specifically for Angular 17+ projects
- **Standalone-first** -- Standalone components as first-class citizens, NgModules supported
- **@category grouping** -- Organize your sidebar with `@category` JSDoc tags
- **Configurable info tabs** -- Control which sections appear via `--infoTabSections`
- **Dark mode** -- System preference detection with manual toggle
- **Search** -- Built-in search across all documented entities
- **Documentation coverage** -- Coverage reports with CI-friendly threshold checks
- **Offline** -- No server needed, generates static HTML files

## Installation

```bash
npm install --save-dev @cngx/compodocx
```

## Usage

```bash
# Generate documentation
npx compodocx -p tsconfig.app.json -d docs

# Serve documentation locally
npx compodocx -p tsconfig.app.json -d docs -s

# Export as JSON
npx compodocx -p tsconfig.app.json -e json -d .compodoc
```

## Configuration

Create a `.compodocrc.json` in your project root:

```json
{
  "tsconfig": "./tsconfig.app.json",
  "output": "./docs",
  "theme": "material",
  "hideGenerator": true,
  "navTabConfig": [
    { "id": "info", "label": "API" },
    { "id": "readme", "label": "Overview" },
    { "id": "source", "label": "Source" }
  ]
}
```

## Coming from compodoc?

compodocx is backwards-compatible with compodoc's CLI flags and configuration. Replace `@compodoc/compodoc` with `@cngx/compodocx` and `compodoc` with `compodocx` in your scripts.

## License

MIT -- Copyright (c) 2016 Vincent Ogloblinsky, 2026 Christian Weiss
