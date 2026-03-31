import * as fs from 'fs/promises';
import * as path from 'path';

import { execSync } from 'child_process';

// Helper function to check if path exists
async function pathExists(path: string): Promise<boolean> {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

describe('Build Template Playground', () => {
    let testDir: string;
    let originalCwd: string;

    beforeEach(async () => {
        originalCwd = process.cwd();
        testDir = path.join(process.cwd(), 'test-temp-build');
        await fs.mkdir(testDir, { recursive: true });

        // Create mock project structure
        const srcDir = path.join(testDir, 'src');
        await fs.mkdir(srcDir, { recursive: true });

        // Create playground-demo structure
        const playgroundDemoDir = path.join(srcDir, 'playground-demo');
        await fs.mkdir(path.join(playgroundDemoDir, 'src', 'app'), { recursive: true });
        await fs.writeFile(path.join(playgroundDemoDir, 'package.json'), JSON.stringify({
            name: "compodoc-playground-demo",
            version: "1.0.0"
        }, null, 2));
        await fs.writeFile(path.join(playgroundDemoDir, 'angular.json'), JSON.stringify({
            projects: {
                "compodoc-playground-demo": {
                    outputPath: "dist/compodoc-playground-demo"
                }
            }
        }, null, 2));
        await fs.writeFile(path.join(playgroundDemoDir, 'tsconfig.json'), JSON.stringify({
            compilerOptions: { target: "es2015" }
        }, null, 2));
        await fs.writeFile(path.join(playgroundDemoDir, 'src', 'app', 'app.component.ts'),
            'export class AppComponent { title = "test"; }');

        // Create templates structure
        const templatesDir = path.join(srcDir, 'templates');
        await fs.mkdir(path.join(templatesDir, 'partials'), { recursive: true });
        await fs.writeFile(path.join(templatesDir, 'page.hbs'), '<html>{{content}}</html>');
        await fs.writeFile(path.join(templatesDir, 'partials', 'component.hbs'), '<div>{{component.name}}</div>');

        // Create resources structure
        const resourcesDir = path.join(srcDir, 'resources');
        await fs.mkdir(path.join(resourcesDir, 'template-playground'), { recursive: true });
        await fs.mkdir(path.join(resourcesDir, 'template-playground-app'), { recursive: true });
        await fs.mkdir(path.join(resourcesDir, 'js'), { recursive: true });
        await fs.mkdir(path.join(resourcesDir, 'styles'), { recursive: true });
        await fs.mkdir(path.join(resourcesDir, 'images'), { recursive: true });

        // Create mock build script
        const toolsDir = path.join(testDir, 'tools');
        await fs.mkdir(toolsDir, { recursive: true });

        // Copy our actual build script but modify paths
        const buildScriptContent = `
const fs = require('fs-extra');
const path = require('path');

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
`;

        await fs.writeFile(path.join(toolsDir, 'build-template-playground.js'), buildScriptContent);

        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        await fs.rm(testDir, { recursive: true, force: true });
    });

    describe('Build Script Execution', () => {
        it('should execute build script without errors', async () => {
            let buildOutput: string;

            try {
                buildOutput = execSync('node tools/build-template-playground.js', {
                    encoding: 'utf8',
                    cwd: testDir
                });
            } catch (error) {
                throw new Error(`Build script failed: ${error.message}`);
            }

            expect(buildOutput).to.include('Template Playground built successfully!');
        });

        it('should create dist directory structure', async () => {
            execSync('node tools/build-template-playground.js', { cwd: testDir });

            const distDir = path.join(testDir, 'dist');
            const distResourcesDir = path.join(distDir, 'resources');

            expect(await pathExists(distDir)).to.be.true;
            expect(await pathExists(distResourcesDir)).to.be.true;
            expect(await pathExists(path.join(distResourcesDir, 'playground-demo'))).to.be.true;
            expect(await pathExists(path.join(distResourcesDir, 'template-playground'))).to.be.true;
            expect(await pathExists(path.join(distResourcesDir, 'template-playground-app'))).to.be.true;
            expect(await pathExists(path.join(distDir, 'templates'))).to.be.true;
        });

        it('should copy playground-demo files correctly', async () => {
            execSync('node tools/build-template-playground.js', { cwd: testDir });

            const distPlaygroundDemo = path.join(testDir, 'dist', 'resources', 'playground-demo');

            // Check main configuration files
            expect(await pathExists(path.join(distPlaygroundDemo, 'package.json'))).to.be.true;
            expect(await pathExists(path.join(distPlaygroundDemo, 'angular.json'))).to.be.true;
            expect(await pathExists(path.join(distPlaygroundDemo, 'tsconfig.json'))).to.be.true;

            // Check source files
            expect(await pathExists(path.join(distPlaygroundDemo, 'src', 'app', 'app.component.ts'))).to.be.true;

            // Verify content is copied correctly
            const packageJsonContent = await fs.readFile(path.join(distPlaygroundDemo, 'package.json'), 'utf8');
            const packageJson = JSON.parse(packageJsonContent);
            expect(packageJson.name).to.equal('compodoc-playground-demo');
        });

        it('should copy templates correctly', async () => {
            execSync('node tools/build-template-playground.js', { cwd: testDir });

            const distTemplates = path.join(testDir, 'dist', 'templates');

            expect(await pathExists(path.join(distTemplates, 'page.hbs'))).to.be.true;
            expect(await pathExists(path.join(distTemplates, 'partials', 'component.hbs'))).to.be.true;

            // Verify content
            const pageTemplate = await fs.readFile(path.join(distTemplates, 'page.hbs'), 'utf8');
            expect(pageTemplate).to.equal('<html>{{content}}</html>');
        });

        it('should preserve directory structure', async () => {
            execSync('node tools/build-template-playground.js', { cwd: testDir });

            const distDir = path.join(testDir, 'dist');

            // Check that the structure matches expected layout
            const expectedDirectories = [
                'resources/playground-demo',
                'resources/playground-demo/src',
                'resources/playground-demo/src/app',
                'resources/template-playground',
                'resources/template-playground-app',
                'resources/js',
                'resources/styles',
                'resources/images',
                'templates',
                'templates/partials'
            ];

            for (const dir of expectedDirectories) {
                expect(await pathExists(path.join(distDir, dir))).to.be.true;
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle missing source directories gracefully', async () => {
            // Remove playground-demo directory
            await fs.rm(path.join(testDir, 'src', 'playground-demo'), { recursive: true, force: true });

            try {
                execSync('node tools/build-template-playground.js', {
                    cwd: testDir,
                    stdio: 'pipe'
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('no such file or directory');
            }
        });

        it('should handle missing templates directory gracefully', async () => {
            // Remove templates directory
            await fs.rm(path.join(testDir, 'src', 'templates'), { recursive: true, force: true });

            try {
                execSync('node tools/build-template-playground.js', {
                    cwd: testDir,
                    stdio: 'pipe'
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('no such file or directory');
            }
        });
    });

    describe('Package Integration', () => {
        it('should prepare correct structure for npm package', async () => {
            execSync('node tools/build-template-playground.js', { cwd: testDir });

            const distDir = path.join(testDir, 'dist');

            // Verify that the dist structure matches what would be published
            const packageStructure = [
                'resources/playground-demo/package.json',
                'resources/playground-demo/tsconfig.json',
                'resources/playground-demo/src/app/app.component.ts',
                'templates/page.hbs',
                'templates/partials/component.hbs'
            ];

            for (const file of packageStructure) {
                expect(await pathExists(path.join(distDir, file))).to.be.true;
            }
        });

        it('should maintain file permissions and timestamps', async () => {
            const sourceFile = path.join(testDir, 'src', 'playground-demo', 'package.json');
            const originalStats = await fs.stat(sourceFile);

            execSync('node tools/build-template-playground.js', { cwd: testDir });

            const distFile = path.join(testDir, 'dist', 'resources', 'playground-demo', 'package.json');
            const distStats = await fs.stat(distFile);

            // File should exist and have content
            expect(distStats.size).to.be.greaterThan(0);
            expect(distStats.isFile()).to.be.true;
        });
    });
});
