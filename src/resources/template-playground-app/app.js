/**
 * Compodoc Template Playground Application
 * Main JavaScript file that handles all playground functionality
 */

class TemplatePlayground {
    constructor() {
        this.editor = null;
        this.currentTemplate = null;
        this.currentData = {};
        this.originalData = {};
        this.customVariables = {};
        this.debounceTimer = null;
        this.sessionId = null;

        this.init();
    }

    async init() {
        try {
            // Check JSZip availability on startup
            setTimeout(() => {
                if (typeof JSZip !== 'undefined') {
                    console.log('✅ JSZip loaded successfully');
                } else if (window.JSZipLoadError) {
                    console.error('❌ JSZip failed to load from all CDNs');
                } else {
                    console.warn('⚠️ JSZip still loading...');
                }
            }, 2000);

            // First create a session
            await this.createSession();
            await this.initializeMonacoEditor();
            this.setupEventListeners();
            this.setupResizer();
            await this.loadTemplateList();
            console.log('🎨 Template Playground initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Template Playground:', error);
            this.showError('Failed to initialize editor. Please refresh the page.');
        }
    }

    async createSession() {
        try {
            const response = await fetch('/api/session/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const result = await response.json();
            this.sessionId = result.sessionId;
            console.log('Session created:', this.sessionId);
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }

    async loadTemplateList() {
        try {
            const response = await fetch(`/api/session/${this.sessionId}/templates`);
            if (!response.ok) {
                throw new Error('Failed to load templates');
            }

            const result = await response.json();
            const templates = result.templates;

            // Update the template dropdown
            const dropdown = document.getElementById('templateSelect');
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Select a template...</option>';

                // Group templates by type
                const mainTemplates = templates.filter(t => t.type === 'template');
                const partials = templates.filter(t => t.type === 'partial');

                if (mainTemplates.length > 0) {
                    const mainGroup = document.createElement('optgroup');
                    mainGroup.label = 'Main Templates';
                    mainTemplates.forEach(template => {
                        const option = document.createElement('option');
                        option.value = template.path;
                        option.textContent = template.name;
                        mainGroup.appendChild(option);
                    });
                    dropdown.appendChild(mainGroup);
                }

                if (partials.length > 0) {
                    const partialsGroup = document.createElement('optgroup');
                    partialsGroup.label = 'Partials';
                    partials.forEach(template => {
                        const option = document.createElement('option');
                        option.value = template.path;
                        option.textContent = template.name;
                        partialsGroup.appendChild(option);
                    });
                    dropdown.appendChild(partialsGroup);
                }
            }
        } catch (error) {
            console.error('Error loading template list:', error);
            this.showError('Failed to load template list');
        }
    }

    async initializeMonacoEditor() {
        return new Promise((resolve, reject) => {
            require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});

            require(['vs/editor/editor.main'], () => {
                try {
                    // Register Handlebars language
                    monaco.languages.register({ id: 'handlebars' });

                    // Define Handlebars syntax highlighting
                    monaco.languages.setMonarchTokensProvider('handlebars', {
                        tokenizer: {
                            root: [
                                [/\{\{\{.*?\}\}\}/, 'string.html'],
                                [/\{\{.*?\}\}/, 'keyword'],
                                [/<[^>]+>/, 'tag'],
                                [/<!--.*?-->/, 'comment'],
                                [/"[^"]*"/, 'string'],
                                [/'[^']*'/, 'string'],
                                [/[{}[\]()]/, 'delimiter.bracket'],
                                [/[a-zA-Z_$][\w$]*/, 'identifier'],
                            ]
                        }
                    });

                    // Create the editor
                    this.editor = monaco.editor.create(document.getElementById('templateEditor'), {
                        value: '<!-- Select a template to start editing -->',
                        language: 'handlebars',
                        theme: 'vs',
                        automaticLayout: true,
                        wordWrap: 'on',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        renderWhitespace: 'selection'
                    });

                    // Setup editor change listener with debouncing
                    this.editor.onDidChangeModelContent(() => {
                        this.debouncePreviewUpdate();
                    });

                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    setupEventListeners() {
        // Template selection
        document.getElementById('templateSelect').addEventListener('change', (e) => {
            this.loadTemplate(e.target.value);
        });

        // Variable management
        document.getElementById('addVariable').addEventListener('click', () => {
            this.addCustomVariable();
        });

        document.getElementById('resetVariables').addEventListener('click', () => {
            this.resetVariables();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // Template actions
        document.getElementById('refreshPreview').addEventListener('click', () => {
            this.updatePreview();
        });

        document.getElementById('copyTemplate').addEventListener('click', () => {
            this.copyTemplate();
        });

        document.getElementById('downloadTemplate').addEventListener('click', () => {
            this.downloadTemplate();
        });

        // Enter key for adding variables
        ['newVariableName', 'newVariableType', 'newVariableValue'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.addCustomVariable();
                }
            });
        });
    }

    setupResizer() {
        const resizer = document.getElementById('resizer');
        const variablesPanel = document.querySelector('.variables-panel');
        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });

        function handleMouseMove(e) {
            if (!isResizing) return;

            const containerRect = document.querySelector('.playground-content').getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;

            if (newWidth >= 250 && newWidth <= containerRect.width - 400) {
                variablesPanel.style.width = newWidth + 'px';
            }
        }

        function handleMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }

    async loadTemplate(templatePath) {
        if (!templatePath) {
            this.clearTemplate();
            return;
        }

        try {
            this.showLoading('Loading template and data...');

            // Load example data for the selected template type
            const encodedTemplatePath = encodeURIComponent(templatePath);
            const dataResponse = await fetch(`/api/session/${this.sessionId}/template-data/${encodedTemplatePath}`);
            if (!dataResponse.ok) {
                throw new Error('Failed to load example data');
            }

            const { data, context } = await dataResponse.json();
            this.currentData = { ...data, ...context };
            this.originalData = JSON.parse(JSON.stringify(this.currentData));

            // Load template content - try specific template first, then fallback
            let templateContent = '';
            try {
                const encodedTemplatePathForContent = encodeURIComponent(templatePath);
                const templateResponse = await fetch(`/api/session/${this.sessionId}/template/${encodedTemplatePathForContent}`);
                if (templateResponse.ok) {
                    const template = await templateResponse.json();
                    templateContent = template.content;
                } else {
                    // Use a generic template based on type
                    templateContent = this.getGenericTemplate(templatePath);
                }
            } catch (error) {
                console.warn('Could not load specific template, using generic:', error);
                templateContent = this.getGenericTemplate(templatePath);
            }

            this.currentTemplate = {
                path: templatePath,
                content: templateContent
            };

            // Update UI
            this.updateTemplateMetadata(templatePath, data);
            this.editor.setValue(templateContent);
            this.renderVariables();
            this.updatePreview();

            this.hideLoading();

        } catch (error) {
            console.error('Error loading template:', error);
            this.showError(`Failed to load template: ${error.message}`);
        }
    }

    getGenericTemplate(templatePath) {
        const templates = {
            component: `<ol class="breadcrumb">
  <li class="breadcrumb-item">{{t "components" }}</li>
  <li class="breadcrumb-item">{{name}}</li>
</ol>

<div class="component-info">
  <h3>{{name}}</h3>
  <p class="description">{{description}}</p>

  {{#if selector}}
  <p><strong>Selector:</strong> <code>{{selector}}</code></p>
  {{/if}}

  {{#if inputs}}
  <h4>Inputs</h4>
  <ul>
    {{#each inputs}}
    <li><strong>{{name}}</strong> ({{type}}): {{description}}</li>
    {{/each}}
  </ul>
  {{/if}}

  {{#if outputs}}
  <h4>Outputs</h4>
  <ul>
    {{#each outputs}}
    <li><strong>{{name}}</strong> ({{type}}): {{description}}</li>
    {{/each}}
  </ul>
  {{/if}}
</div>`,
            module: `<ol class="breadcrumb">
  <li class="breadcrumb-item">{{t "modules" }}</li>
  <li class="breadcrumb-item">{{name}}</li>
</ol>

<div class="module-info">
  <h3>{{name}}</h3>
  <p class="description">{{description}}</p>

  {{#if declarations}}
  <h4>Declarations</h4>
  <ul>
    {{#each declarations}}
    <li>{{name}} ({{type}})</li>
    {{/each}}
  </ul>
  {{/if}}

  {{#if imports}}
  <h4>Imports</h4>
  <ul>
    {{#each imports}}
    <li>{{name}}</li>
    {{/each}}
  </ul>
  {{/if}}
</div>`,
            interface: `<ol class="breadcrumb">
  <li class="breadcrumb-item">{{t "interfaces" }}</li>
  <li class="breadcrumb-item">{{name}}</li>
</ol>

<div class="interface-info">
  <h3>{{name}}</h3>
  <p class="description">{{description}}</p>

  {{#if properties}}
  <h4>Properties</h4>
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Optional</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {{#each properties}}
      <tr>
        <td><code>{{name}}</code></td>
        <td><code>{{type}}</code></td>
        <td>{{#if optional}}Yes{{else}}No{{/if}}</td>
        <td>{{description}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{/if}}
</div>`,
            class: `<ol class="breadcrumb">
  <li class="breadcrumb-item">{{t "classes" }}</li>
  <li class="breadcrumb-item">{{name}}</li>
</ol>

<div class="class-info">
  <h3>{{name}}</h3>
  <p class="description">{{description}}</p>

  {{#if methods}}
  <h4>Methods</h4>
  {{#each methods}}
  <div class="method">
    <h5>{{name}}</h5>
    <p>{{description}}</p>
    <p><strong>Returns:</strong> <code>{{type}}</code></p>
  </div>
  {{/each}}
  {{/if}}
</div>`
        };

        return templates[templatePath] || `<h3>{{name}}</h3>
<p>{{description}}</p>
<p><strong>Type:</strong> ${templatePath}</p>`;
    }

    updateTemplateMetadata(templatePath, data) {
        const metadata = document.getElementById('templateMetadata');
        document.getElementById('templateName').textContent = data.name || templatePath;
        document.getElementById('templateFile').textContent = data.file || `${templatePath}.hbs`;
        document.getElementById('templateDescription').textContent = data.description || `Template for ${templatePath}`;
        metadata.style.display = 'block';
    }

    renderVariables() {
        const container = document.getElementById('variablesList');
        container.innerHTML = '';

        // Create variables from current data
        this.createVariableElements(this.currentData, '', container);

        // Add custom variables
        Object.entries(this.customVariables).forEach(([key, value]) => {
            this.createVariableElement(key, typeof value, value, container, true);
        });
    }

    createVariableElements(obj, prefix, container, depth = 0) {
        if (depth > 2) return; // Prevent too deep nesting

        Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Create expandable object
                if (depth < 2) {
                    const objectElement = document.createElement('div');
                    objectElement.className = 'variable-item';
                    objectElement.innerHTML = `
                        <div class="variable-name">${key}</div>
                        <div class="variable-type">object</div>
                        <button class="btn-icon" style="background: #e3f2fd; color: #1976d2;" onclick="this.parentElement.querySelector('.nested-variables').style.display = this.parentElement.querySelector('.nested-variables').style.display === 'none' ? 'block' : 'none'">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="nested-variables" style="margin-top: 0.5rem; padding-left: 1rem; border-left: 2px solid #e9ecef;"></div>
                    `;
                    container.appendChild(objectElement);

                    const nestedContainer = objectElement.querySelector('.nested-variables');
                    this.createVariableElements(value, fullKey, nestedContainer, depth + 1);
                }
            } else {
                this.createVariableElement(key, typeof value, value, container, false, fullKey);
            }
        });
    }

    createVariableElement(name, type, value, container, isCustom = false, fullPath = null) {
        const variableElement = document.createElement('div');
        variableElement.className = 'variable-item';

        let displayValue = value;
        if (typeof value === 'object') {
            displayValue = JSON.stringify(value, null, 2);
        } else if (typeof value === 'string') {
            displayValue = value;
        } else {
            displayValue = String(value);
        }

        variableElement.innerHTML = `
            <div class="variable-actions">
                ${isCustom ?
                    `<button class="btn-icon" style="background: #ffebee; color: #d32f2f;" onclick="templatePlayground.removeVariable('${name}')">
                        <i class="fas fa-trash"></i>
                    </button>` : ''
                }
            </div>
            <div class="variable-name">${name}</div>
            <div class="variable-type">${type}</div>
            <textarea class="variable-value"
                     onchange="templatePlayground.updateVariable('${fullPath || name}', this.value, ${isCustom})"
                     rows="${displayValue.split('\n').length}">${displayValue}</textarea>
        `;

        container.appendChild(variableElement);
    }

    updateVariable(path, value, isCustom = false) {
        try {
            let parsedValue;

            // Try to parse as JSON first
            try {
                parsedValue = JSON.parse(value);
            } catch {
                // If not valid JSON, treat as string
                parsedValue = value;
            }

            if (isCustom) {
                this.customVariables[path] = parsedValue;
            } else {
                // Update nested property
                this.setNestedProperty(this.currentData, path, parsedValue);
            }

            this.debouncePreviewUpdate();
        } catch (error) {
            console.error('Error updating variable:', error);
        }
    }

    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => current && current[key], obj);

        if (target && lastKey) {
            target[lastKey] = value;
        }
    }

    addCustomVariable() {
        const nameInput = document.getElementById('newVariableName');
        const typeInput = document.getElementById('newVariableType');
        const valueInput = document.getElementById('newVariableValue');

        const name = nameInput.value.trim();
        const type = typeInput.value.trim() || 'string';
        const valueStr = valueInput.value.trim();

        if (!name) {
            this.showError('Variable name is required');
            return;
        }

        let value;
        try {
            if (valueStr) {
                value = JSON.parse(valueStr);
            } else {
                value = type === 'boolean' ? false : type === 'number' ? 0 : '';
            }
        } catch {
            value = valueStr;
        }

        this.customVariables[name] = value;

        // Clear inputs
        nameInput.value = '';
        typeInput.value = '';
        valueInput.value = '';

        this.renderVariables();
        this.debouncePreviewUpdate();
        this.showSuccess('Variable added successfully');
    }

    removeVariable(name) {
        delete this.customVariables[name];
        this.renderVariables();
        this.debouncePreviewUpdate();
    }

    resetVariables() {
        this.currentData = JSON.parse(JSON.stringify(this.originalData));
        this.customVariables = {};
        this.renderVariables();
        this.updatePreview();
        this.showSuccess('Variables reset to default values');
    }

    debouncePreviewUpdate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updatePreview();
        }, 300);
    }

    async updatePreview() {
        if (!this.currentTemplate) return;

        try {
            this.setPreviewStatus('🚀 Generating documentation with CompoDoc CLI...', true);

            const templateContent = this.editor.getValue();

            // Use CompoDoc CLI generation API
            const response = await fetch(`/api/session/${this.sessionId}/generate-docs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customTemplateContent: templateContent,
                    templatePath: this.currentTemplate ? this.currentTemplate.path : null,
                    mockData: { ...this.currentData, ...this.customVariables }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || `Server responded with ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Documentation generated successfully, now load it in iframe
                this.setPreviewStatus('📄 Loading generated documentation...', true);

                // Point iframe to the generated documentation
                const iframe = document.getElementById('templatePreviewFrame');
                if (iframe) {
                    iframe.src = `/docs/${this.sessionId}/index.html?t=` + Date.now(); // Add timestamp to prevent caching

                    iframe.onload = () => {
                        this.setPreviewStatus('✅ Documentation loaded successfully', false);
                        setTimeout(() => {
                            this.setPreviewStatus('', false);
                        }, 2000);
                    };

                    iframe.onerror = () => {
                        this.setPreviewStatus('❌ Failed to load generated documentation', false);
                    };
                } else {
                    this.setPreviewStatus('❌ Preview iframe not found', false);
                }
            } else {
                throw new Error('Documentation generation failed');
            }

        } catch (error) {
            console.error('Error generating documentation:', error);
            this.setPreviewStatus(`❌ Error: ${error.message}`, false);

            // Show error in iframe
            const iframe = document.getElementById('templatePreviewFrame');
            if (iframe) {
                const errorHtml = `
                    <html>
                        <head>
                            <title>Documentation Generation Error</title>
                            <style>
                                body {
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                    padding: 40px;
                                    background: #f8f9fa;
                                    color: #333;
                                    line-height: 1.6;
                                }
                                .error-container {
                                    background: white;
                                    padding: 30px;
                                    border-radius: 8px;
                                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                    max-width: 600px;
                                    margin: 0 auto;
                                }
                                .error-icon {
                                    color: #dc3545;
                                    font-size: 48px;
                                    text-align: center;
                                    margin-bottom: 20px;
                                }
                                .error-title {
                                    color: #dc3545;
                                    margin-bottom: 15px;
                                    text-align: center;
                                }
                                .error-message {
                                    background: #f8d7da;
                                    border: 1px solid #f5c6cb;
                                    color: #721c24;
                                    padding: 15px;
                                    border-radius: 4px;
                                    margin-bottom: 20px;
                                    font-family: monospace;
                                }
                                .suggestions {
                                    background: #d1ecf1;
                                    border: 1px solid #bee5eb;
                                    color: #0c5460;
                                    padding: 15px;
                                    border-radius: 4px;
                                }
                                .suggestions h4 {
                                    margin-top: 0;
                                    margin-bottom: 10px;
                                }
                                .suggestions ul {
                                    margin-bottom: 0;
                                    padding-left: 20px;
                                }
                                .retry-button {
                                    background: #007bff;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    margin-top: 15px;
                                    display: block;
                                    margin-left: auto;
                                    margin-right: auto;
                                }
                                .retry-button:hover {
                                    background: #0056b3;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="error-container">
                                <div class="error-icon">⚠️</div>
                                <h2 class="error-title">Documentation Generation Failed</h2>
                                <div class="error-message">${error.message}</div>
                                <div class="suggestions">
                                    <h4>Possible solutions:</h4>
                                    <ul>
                                        <li>Check if your Handlebars template syntax is valid</li>
                                        <li>Ensure all referenced partials exist</li>
                                        <li>Verify that template variables match the expected data structure</li>
                                        <li>Try refreshing the page and loading a different template</li>
                                    </ul>
                                </div>
                                <button class="retry-button" onclick="parent.templatePlayground.updatePreview()">
                                    🔄 Retry Generation
                                </button>
                            </div>
                        </body>
                    </html>
                `;
                iframe.srcdoc = errorHtml;
            }
        }
    }

    setPreviewStatus(text, isLoading) {
        const statusElement = document.getElementById('previewStatus');
        statusElement.innerHTML = isLoading ?
            `<div class="spinner"></div> ${text}` : text;
    }

    async copyTemplate() {
        try {
            await navigator.clipboard.writeText(this.editor.getValue());
            this.showSuccess('Template copied to clipboard');
        } catch (error) {
            console.error('Error copying template:', error);
            this.showError('Failed to copy template');
        }
    }

        async downloadTemplate() {
        try {
            if (!this.sessionId) {
                this.showError('No active session. Please refresh the page and try again.');
                return;
            }

            // Show loading state
            this.showLoading('Creating complete template package...');

            // Call server-side ZIP creation endpoint for all templates
            const response = await fetch(`/api/session/${this.sessionId}/download-all-templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            this.hideLoading();

            if (!response.ok) {
                if (response.headers.get('content-type')?.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create template package');
                } else {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
            }

            // Get the ZIP file as a blob
            const zipBlob = await response.blob();

            // Get filename from response headers or construct it
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `compodoc-templates-${this.sessionId}.zip`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Create download link and trigger download
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Complete template package downloaded successfully');

        } catch (error) {
            console.error('Error downloading template:', error);
            this.hideLoading();

            let errorMessage = 'Failed to download complete template package';

            if (error.message) {
                errorMessage = error.message;
            }

            this.showError(errorMessage);
        }
    }

    exportData() {
        try {
            const exportData = {
                template: this.currentTemplate,
                originalData: this.originalData,
                currentData: this.currentData,
                customVariables: this.customVariables
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `template-playground-data.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Data exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Failed to export data');
        }
    }

    clearTemplate() {
        this.currentTemplate = null;
        this.currentData = {};
        this.originalData = {};
        this.customVariables = {};

        this.editor.setValue('<!-- Select a template to start editing -->');
        document.getElementById('templateMetadata').style.display = 'none';
        document.getElementById('variablesList').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Select a template to see variables
            </div>
        `;
        // Clear iframe
        const iframe = document.getElementById('templatePreviewFrame');
        if (iframe) {
            iframe.src = 'data:text/html,<div style="padding: 20px; text-align: center; color: #666;"><div style="font-size: 18px; margin-bottom: 10px;">📝</div>Select a template to see preview</div>';
        }
    }

    showLoading(message) {
        document.getElementById('variablesList').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                ${message}
            </div>
        `;
    }

    hideLoading() {
        // Loading will be replaced by renderVariables()
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        const className = type === 'error' ? 'error-message' : 'success-message';
        const messageElement = document.createElement('div');
        messageElement.className = className;
        messageElement.textContent = message;

        const container = document.querySelector('.variables-panel .panel-content');
        container.insertBefore(messageElement, container.firstChild);

        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.parentElement.removeChild(messageElement);
            }
        }, 3000);
    }
}

// Initialize the playground when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.templatePlayground = new TemplatePlayground();
});
