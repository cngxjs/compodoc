# Template Playground

The Template Playground is a standalone development tool that allows you to customize and preview Handlebars templates used by Compodoc. It provides an interactive interface for modifying templates with real-time preview and configuration management.

## How to Run the Template Playground

### 1. Build the Playground Frontend

Before starting the Template Playground, make sure the web application is built:

```bash
npm run build-template-playground
```

This builds the frontend web application that the Template Playground server serves.

### 2. Start the Playground Server

You can launch the Template Playground in several ways:

#### a) Using the Compodoc CLI (recommended)

```bash
compodoc --templatePlayground
```

This launches a standalone development server at `http://localhost:3001` with the Template Playground interface.

#### b) Using the provided script

```bash
node scripts/start-playground-simple.js
```

#### c) With a custom port

You can specify a custom port using a command line argument or environment variable:

```bash
node scripts/start-playground-simple.js --port 3002
# or
PLAYGROUND_PORT=3002 node scripts/start-playground-simple.js
# or
PORT=3002 node scripts/start-playground-simple.js
```

#### d) Via compodoc.json configuration

Add this to your `compodoc.json`:

```json
{
  "templatePlayground": true
}
```

Then run:

```bash
compodoc -p tsconfig.json
```

#### e) Show help and options

```bash
node scripts/start-playground-simple.js --help
```

### Port Handling

- **Default port**: 3001
- **Automatic port detection**: If the default port is busy, the server will automatically find the next available port
- **Custom port**: See above for options

### Troubleshooting

- If you see a message like `Template Playground not built`, run:
  ```bash
  npm run build-template-playground
  ```
- If you see a port conflict, use a different port as shown above.

---

## Interface Overview (Updated)

### Left Panel: Configuration Options

- **Configuration options**: All Compodoc config options are shown as editable fields.
  - **Booleans** (flags) are shown as checkboxes for easy toggling.
  - **String options with known values** (e.g., `theme`, `language`, `exportFormat`) are shown as dropdowns to prevent mistakes.
  - **Other values** are editable as text or textarea fields.
- **No custom variable management**: Only Compodoc config options are shown and editable.
- **Reset and Export**:
  - **Reset**: Restore all config options to their defaults.
  - **Export**: Download a text file with the exact Compodoc CLI command for your current configuration.

### Right Panel: Template Editor & Live Preview

- **Monaco Editor**: Edit the selected Handlebars template with syntax highlighting.
- **Live Preview**: See the generated documentation update automatically as you change config or template content.
- **Manual Refresh**: Use the refresh button for immediate updates if needed.

---

## Export and Download (Updated)

- **Export Command**: The export button in the configuration panel downloads a text file containing the full Compodoc CLI command for your current configuration. You can use this command in your terminal to generate documentation with the same settings.

---

## Best Practices

- Use the dropdowns and checkboxes to avoid mistakes in configuration.
- Use the export command to reproduce your playground results in CI or local scripts.
- If you encounter issues, check the browser console for errors and ensure the playground is built and running on the correct port.

---

## Need Help?

- Compodoc Documentation: https://compodoc.app/
- GitHub Issues: https://github.com/compodoc/compodoc/issues
- Template Documentation: https://compodoc.app/guides/templates.html 
