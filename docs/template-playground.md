# Template Playground

The Template Playground is a standalone development tool that allows you to customize and preview Handlebars templates used by Compodoc. It provides an interactive interface for modifying templates with real-time preview and variable management.

## Overview

The Template Playground is designed as a development tool for template creators and customizers. It features:

- **Two-Column Layout**: Variables/properties panel on the left, template editor and preview on the right
- **Interactive Variable Management**: Add, remove, and modify template variables in real-time
- **Monaco Editor** with Handlebars syntax highlighting
- **Live Preview** of template changes with comprehensive mock data
- **Export Functionality** for customized templates and data
- **Comprehensive Example Data** for all Compodoc template types

## Getting Started

### Prerequisites

Before starting the Template Playground, make sure the web application is built:

```bash
npm run build-template-playground
```

This builds the frontend web application that the Template Playground server serves.

### Launch the Template Playground

To start the Template Playground development server:

```bash
compodoc --templatePlayground
```

This launches a standalone development server at `http://localhost:3001` with the Template Playground interface.

### Alternative Launch Methods

**Using the simple script:**

```bash
node scripts/start-playground-simple.js
```

**With custom port:**

```bash
# Using command line argument
node scripts/start-playground-simple.js --port 3002

# Using environment variable
PLAYGROUND_PORT=3002 node scripts/start-playground-simple.js
PORT=3002 node scripts/start-playground-simple.js
```

**Show help and options:**

```bash
node scripts/start-playground-simple.js --help
```

### Port Configuration

The Template Playground automatically handles port conflicts:

- **Default port**: 3001
- **Automatic port detection**: If the default port is busy, it will automatically find the next available port
- **Custom port options**:
  - Command line: `--port 3002` or `-p 3002`
  - Environment variables: `PLAYGROUND_PORT=3002` or `PORT=3002`

### Alternative Configuration

You can also enable it via configuration in `compodoc.json`:

```json
{
  "templatePlayground": true
}
```

Then run:

```bash
compodoc -p tsconfig.json
```

## Troubleshooting

### "Template Playground not built" Error

If you see this error in the browser:

```
Template Playground not built. Please run the build process.
```

**Solution**: Run the build command first:

```bash
npm run build-template-playground
```

Then restart the Template Playground server.

### Port Already in Use Error

If you encounter:

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions**:

1. **Use automatic port detection** (recommended):
   ```bash
   node scripts/start-playground-simple.js
   ```
   The server will automatically find an available port.

2. **Specify a different port**:
   ```bash
   node scripts/start-playground-simple.js --port 3002
   ```

3. **Stop the existing process**:
   ```bash
   # Find the process using the port
   lsof -ti:3001
   
   # Kill the process (replace PID with the actual process ID)
   kill [PID]
   ```

4. **Use environment variables**:
   ```bash
   PLAYGROUND_PORT=3002 node scripts/start-playground-simple.js
   ```

### Missing Static Assets

If CSS/JS files are not loading:

1. Ensure you've built the project: `npm run build`
2. Ensure the Template Playground is built: `npm run build-template-playground`
3. Check that `dist/resources/template-playground-app/` contains `index.html` and `app.js`

## Interface Overview

### Left Panel: Variables & Properties

The left panel provides complete control over template data:

1. **Template Selection**: Choose from all available Compodoc template types:
   - Components
   - Modules
   - Interfaces
   - Classes
   - Services/Injectables
   - Directives
   - Pipes
   - Guards
   - Interceptors
   - Entities
   - Controllers
   - And more...

2. **Template Metadata**: Displays information about the selected template

3. **Variable Management**: 
   - View and edit existing template variables
   - Modify variable values in real-time
   - Add custom variables with specific types
   - Remove custom variables
   - Reset all variables to default values

4. **Add Custom Variables**:
   - Variable name (e.g., `customProperty`)
   - Variable type (e.g., `string`, `boolean`, `number`)
   - Variable value (JSON format supported)

### Right Panel: Template Editor & Preview

The right panel shows the template and its rendered output:

1. **Template Editor**: 
   - Monaco Editor with Handlebars syntax highlighting
   - Real-time syntax validation
   - Auto-completion for Handlebars helpers
   - Responsive layout with adjustable height

2. **Live Preview**:
   - Instant rendering of template changes
   - Uses comprehensive mock data
   - Shows compilation errors when they occur
   - Updates automatically as you type (debounced)

## Available Template Types

The Template Playground includes comprehensive example data for:

### Core Angular Types
- **Components**: Full component data with inputs, outputs, methods, properties
- **Modules**: Module declarations, imports, exports, providers
- **Services/Injectables**: Service methods, properties, constructor dependencies
- **Directives**: Directive selectors, inputs, host listeners
- **Pipes**: Pipe transform methods and usage examples

### Advanced Types
- **Guards**: Route guard implementations and methods
- **Interceptors**: HTTP interceptor logic and request handling
- **Interfaces**: Interface properties with types and descriptions
- **Classes**: Class methods, properties, constructors, inheritance
- **Entities**: Database entity definitions with decorators

### Additional Types
- **Controllers**: REST API controller endpoints (NestJS style)
- **Overview**: Project structure and statistics
- **Miscellaneous**: Variables, functions, type aliases, enumerations

## Working with Variables

### Viewing Variables

When you select a template type, the left panel automatically populates with:
- **Core variables** from the example data structure
- **Nested objects** (expandable/collapsible for complex data)
- **Helper functions** and template context

### Editing Variables

- **Simple values**: Edit strings, numbers, booleans directly
- **Complex objects**: Edit as JSON in expandable text areas
- **Arrays**: Modify array contents with proper JSON syntax

### Adding Custom Variables

1. Enter a variable name (e.g., `myCustomField`)
2. Specify the type (`string`, `boolean`, `number`, `object`)
3. Provide the value:
   - Simple types: enter the value directly
   - Objects/Arrays: use JSON format
   - Empty values: will use type defaults

### Variable Types and Examples

```javascript
// String variable
"Hello World"

// Boolean variable  
true

// Number variable
42

// Object variable
{
  "name": "Example",
  "value": 123,
  "active": true
}

// Array variable
["item1", "item2", "item3"]
```

## Template Helpers

The playground supports all standard Handlebars helpers plus Compodoc-specific helpers:

### Built-in Helpers
- `{{#each}}` - Iterate over arrays/objects
- `{{#if}}` - Conditional rendering
- `{{#unless}}` - Negative conditional
- `{{#with}}` - Change context

### Compodoc Helpers
- `{{t "key"}}` - Translation/localization
- `{{relativeURL}}` - Generate relative URLs
- `{{compare a "===" b}}` - Compare values
- `{{isTabEnabled navTabs "tabId"}}` - Check if tab is enabled
- `{{isInitialTab navTabs "tabId"}}` - Check if tab is initial/active

### Example Template

```handlebars
<ol class="breadcrumb">
  <li class="breadcrumb-item">{{t "components"}}</li>
  <li class="breadcrumb-item">{{name}}</li>
</ol>

<div class="component-info">
  <h3>{{name}}</h3>
  <p>{{description}}</p>
  
  {{#if inputs}}
  <h4>{{t "inputs"}}</h4>
  <ul>
    {{#each inputs}}
    <li>
      <strong>{{name}}</strong> ({{type}})
      {{#if description}}: {{description}}{{/if}}
    </li>
    {{/each}}
  </ul>
  {{/if}}
  
  {{#if customProperty}}
  <div class="custom-section">
    <h4>Custom Property</h4>
    <p>{{customProperty}}</p>
  </div>
  {{/if}}
</div>
```

## Export and Download

### Template Export

Click the **Export** button to download:
- Modified template content
- Current variable data
- Usage instructions
- All in a convenient text format

### Data Export

Use the **Export Data** button to download:
- Complete playground state
- Original and modified data
- Custom variables
- Template configuration
- JSON format for backup/sharing

## Tips and Best Practices

### Template Development
1. **Start with existing templates**: Use Compodoc's built-in templates as starting points
2. **Test with different data**: Switch between template types to see how your changes work
3. **Use mock data effectively**: The playground provides realistic example data
4. **Validate syntax**: Watch for error messages in the preview panel

### Variable Management
1. **Use meaningful names**: Name custom variables clearly (e.g., `showAdvancedInfo`)
2. **Match data types**: Ensure your custom variables match expected types
3. **Test edge cases**: Try empty arrays, null values, missing properties
4. **Document complex objects**: Use JSON format for complex data structures

### Performance
1. **Debounced updates**: The preview updates automatically but is debounced for performance
2. **Manual refresh**: Use the refresh button for immediate updates
3. **Reset when needed**: Use the reset button to restore default state

## Troubleshooting

### Common Issues

**Template not rendering**
- Check for syntax errors in the Handlebars template
- Verify variable names match the data structure
- Ensure all required variables are defined

**Variables not updating**
- Check JSON syntax for complex objects
- Ensure proper escaping for strings
- Verify variable names don't conflict with reserved words

**Editor issues**
- Refresh the page if Monaco Editor fails to load
- Check browser console for JavaScript errors
- Ensure stable internet connection for CDN resources

### Error Messages

The playground provides detailed error messages:
- **Syntax errors**: Shown in the preview panel with line numbers
- **Variable errors**: Highlighted in the variables panel
- **Network errors**: Displayed as toast notifications

### Getting Help

- Check the browser console for detailed error logs
- Verify your template syntax against Handlebars documentation
- Test with minimal examples to isolate issues
- Reset to default state and try again

## Integration with Compodoc

### Using Custom Templates

After developing templates in the playground:

1. Export your customized templates
2. Save the `.hbs` files to your project
3. Use Compodoc's custom template options:

```bash
compodoc -p tsconfig.json --templates path/to/custom/templates
```

### Template Structure

Organize your custom templates following Compodoc's structure:
```
custom-templates/
├── partials/
│   ├── component.hbs
│   ├── module.hbs
│   ├── interface.hbs
│   └── ...
└── page.hbs
```

### Configuration Options

```json
{
  "templates": "./custom-templates",
  "customFavicon": "./assets/favicon.ico",
  "customLogo": "./assets/logo.png"
}
```

## Architecture

### Client-Side Components
- **Monaco Editor**: Provides syntax-highlighted template editing
- **Template Renderer**: Real-time Handlebars compilation and rendering
- **Variable Manager**: Interactive data manipulation interface
- **Export System**: File generation and download capabilities

### Server-Side Components
- **Express Server**: Serves the playground application and API endpoints
- **Template API**: Provides access to Compodoc's template files
- **Data API**: Serves example data for different template types
- **Render API**: Server-side template compilation with Handlebars

### Communication Flow
1. User selects template type
2. Client fetches template content and example data
3. Monaco Editor loads template content
4. Variables panel populates with data
5. User modifies template or variables
6. Changes trigger debounced preview update
7. Server renders template with current data
8. Preview panel displays rendered output

This architecture ensures a smooth, responsive experience while maintaining the flexibility to work with Compodoc's template system. 
