import { Injectable } from '@angular/core';

declare const JSZip: any;

@Injectable({
  providedIn: 'root'
})
export class ZipExportService {

  exportTemplates(files: any[]) {
    const zip = new JSZip();

    // Add all template files to the ZIP
    files.forEach(file => {
      zip.file(file.path, file.content);
    });

    // Add a README with instructions
    const readme = this.generateReadme();
    zip.file('README.md', readme);

    // Generate and download the ZIP file
    zip.generateAsync({ type: 'blob' })
      .then((content: Blob) => {
        this.downloadBlob(content, 'compodocx-templates.zip');
      });
  }

  private generateReadme(): string {
    return `# compodocx Template Playground export

This ZIP contains the templates you edited in the Template Playground UI.

## Heads-up — legacy format

The Template Playground is a Handlebars-era tool kept for visual reference. **The exported \`.hbs\` files in this ZIP are NOT compatible with the current \`compodocx --templates\` flag**, which expects JavaScript-based template overrides.

If you pass this directory to \`compodocx --templates ./extracted/\` the overrides will be silently ignored.

## How to actually customize compodocx templates

See \`docs/custom-templates.md\` in the compodocx repository for the JavaScript override system. Each override is a CommonJS module:

\`\`\`js
module.exports = function (data, helpers) {
  return '<your html here>';
};
\`\`\`

Place these files under \`<templatePath>/partials/\` named \`<override-name>.js\` and pass the directory via \`--templates\`.

## Why is the Playground still here?

It is on the deprecation path. A JavaScript-based replacement is planned for a later release. For now treat the export as a starting point for HTML structure, then port the markup into a \`.js\` override module by hand.
`;
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
