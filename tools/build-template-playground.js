const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Build script for Template Playground
 * This script compiles the Angular components and copies necessary assets
 */

const srcDir = path.join(__dirname, '..', 'src');
const resourcesDir = path.join(srcDir, 'resources');
const templatePlaygroundDir = path.join(resourcesDir, 'template-playground');
const distDir = path.join(__dirname, '..', 'dist');
const playgroundDemoDir = path.join(__dirname, '..', 'src', 'playground-demo');

async function buildTemplatePlayground() {
  console.log('Building Template Playground...');

  try {
    // Ensure directories exist
    await fs.ensureDir(path.join(distDir, 'resources', 'template-playground'));
    await fs.ensureDir(path.join(distDir, 'resources', 'js'));
    await fs.ensureDir(path.join(distDir, 'resources', 'styles'));
    await fs.ensureDir(path.join(distDir, 'resources', 'playground-demo'));

    // Copy TypeScript Angular components to dist
    await fs.copy(templatePlaygroundDir, path.join(distDir, 'resources', 'template-playground'));

    // Copy template playground app files
    await fs.copy(
      path.join(resourcesDir, 'template-playground-app'),
      path.join(distDir, 'resources', 'template-playground-app')
    );

    // Copy CSS files for styling
    await fs.copy(
      path.join(resourcesDir, 'styles'),
      path.join(distDir, 'resources', 'styles')
    );

    // Copy JavaScript files for functionality
    await fs.copy(
      path.join(resourcesDir, 'js'),
      path.join(distDir, 'resources', 'js')
    );

    // Copy images (for favicon, etc.)
    await fs.copy(
      path.join(resourcesDir, 'images'),
      path.join(distDir, 'resources', 'images')
    );

    // Copy templates for the playground (source HBS templates)
    await fs.copy(
      path.join(srcDir, 'templates'),
      path.join(distDir, 'templates')
    );

    // Copy playground-demo for the playground (example TypeScript source files)
    // This provides the source code that Compodoc analyzes to generate documentation examples
    await fs.copy(
      playgroundDemoDir,
      path.join(distDir, 'resources', 'playground-demo')
    );

    console.log('Template Playground built successfully!');

  } catch (error) {
    console.error('Error building Template Playground:', error);
    process.exit(1);
  }
}

// Run the build
buildTemplatePlayground();
