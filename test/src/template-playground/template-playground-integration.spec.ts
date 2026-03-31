import * as fs from 'fs-extra';
import { tmpdir } from 'os';
import * as path from 'path';

import request from 'supertest';
import { TemplatePlaygroundServer } from '../../../src/template-playground/template-playground-server';

describe('Template Playground Integration Tests', () => {
    let server: TemplatePlaygroundServer;
    let testDir: string;
    let originalCwd: string;

    beforeEach(async function() {

        originalCwd = process.cwd();
        testDir = path.join(process.cwd(), 'test-temp-integration');
        await fs.ensureDir(testDir);

        // Create complete test project structure
        const srcDir = path.join(testDir, 'src');

        // Create playground-demo with realistic Angular project structure
        const playgroundDemoDir = path.join(srcDir, 'playground-demo');
        await fs.ensureDir(path.join(playgroundDemoDir, 'src', 'app', 'components'));
        await fs.ensureDir(path.join(playgroundDemoDir, 'src', 'app', 'services'));
        await fs.ensureDir(path.join(playgroundDemoDir, 'src', 'app', 'interfaces'));

        // Create package.json
        await fs.writeFile(path.join(playgroundDemoDir, 'package.json'), JSON.stringify({
            name: "compodoc-playground-demo",
            version: "1.0.0",
            dependencies: {
                "@angular/core": "^18.0.0",
                "@angular/common": "^18.0.0"
            }
        }, null, 2));

        // Create tsconfig.json
        await fs.writeFile(path.join(playgroundDemoDir, 'tsconfig.json'), JSON.stringify({
            compilerOptions: {
                target: "es2015",
                module: "commonjs",
                lib: ["es2015", "dom"],
                experimentalDecorators: true,
                emitDecoratorMetadata: true
            },
            include: ["src/**/*"]
        }, null, 2));

        // Create realistic Angular components
        await fs.writeFile(path.join(playgroundDemoDir, 'src', 'app', 'app.component.ts'), `
import { Component } from '@angular/core';

/**
 * Main application component
 * @description This is the root component of the application
 */
@Component({
  selector: 'app-root',
  template: '<h1>{{title}}</h1>',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  /**
   * Application title
   */
  title = 'Playground Demo App';
}
`);

        await fs.writeFile(path.join(playgroundDemoDir, 'src', 'app', 'components', 'user.component.ts'), `
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../interfaces/user.interface';

/**
 * User display component
 */
@Component({
  selector: 'app-user',
  template: '<div>{{user.name}}</div>'
})
export class UserComponent {
  /**
   * User data to display
   */
  @Input() user: User;

  /**
   * Event emitted when user is selected
   */
  @Output() userSelected = new EventEmitter<User>();
}
`);

        await fs.writeFile(path.join(playgroundDemoDir, 'src', 'app', 'services', 'user.service.ts'), `
import { Injectable } from '@angular/core';
import { User } from '../interfaces/user.interface';

/**
 * Service for managing users
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [];

  /**
   * Get all users
   * @returns Array of users
   */
  getUsers(): User[] {
    return this.users;
  }

  /**
   * Add a new user
   * @param user User to add
   */
  addUser(user: User): void {
    this.users.push(user);
  }
}
`);

        await fs.writeFile(path.join(playgroundDemoDir, 'src', 'app', 'interfaces', 'user.interface.ts'), `
/**
 * User interface
 */
export interface User {
  /**
   * Unique identifier
   */
  id: number;

  /**
   * User's full name
   */
  name: string;

  /**
   * User's email address
   */
  email: string;
}
`);

        // Create comprehensive template set
        const templatesDir = path.join(srcDir, 'templates');
        await fs.ensureDir(path.join(templatesDir, 'partials'));

        await fs.writeFile(path.join(templatesDir, 'page.hbs'), `
<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
    <meta charset="utf-8">
</head>
<body>
    <div class="container">
        {{{content}}}
    </div>
</body>
</html>
`);

        await fs.writeFile(path.join(templatesDir, 'partials', 'component.hbs'), `
<div class="component-doc">
    <h2>{{component.name}}</h2>
    <p>{{component.description}}</p>
    {{#if component.inputs}}
    <h3>Inputs</h3>
    <ul>
        {{#each component.inputs}}
        <li><strong>{{name}}</strong>: {{type}} - {{description}}</li>
        {{/each}}
    </ul>
    {{/if}}
</div>
`);

        await fs.writeFile(path.join(templatesDir, 'partials', 'service.hbs'), `
<div class="service-doc">
    <h2>{{service.name}}</h2>
    <p>{{service.description}}</p>
    {{#if service.methods}}
    <h3>Methods</h3>
    <ul>
        {{#each service.methods}}
        <li><strong>{{name}}</strong>: {{description}}</li>
        {{/each}}
    </ul>
    {{/if}}
</div>
`);

        // Create static resources
        const resourcesDir = path.join(srcDir, 'resources');
        await fs.ensureDir(path.join(resourcesDir, 'template-playground-app'));
        await fs.ensureDir(path.join(resourcesDir, 'template-playground'));
        await fs.ensureDir(path.join(resourcesDir, 'js'));
        await fs.ensureDir(path.join(resourcesDir, 'styles'));

        // Create minimal template playground app files
        await fs.writeFile(path.join(resourcesDir, 'template-playground-app', 'index.html'), `
<!DOCTYPE html>
<html>
<head><title>Template Playground</title></head>
<body>
    <div id="app">Template Playground</div>
    <script src="app.js"></script>
</body>
</html>
`);

        await fs.writeFile(path.join(resourcesDir, 'template-playground-app', 'app.js'), `
console.log('Template playground app loaded');
`);

        process.chdir(testDir);

        server = new TemplatePlaygroundServer();
        await server.start();
    });

    afterEach(async function() {

        if (server) {
            await server.stop();
        }

        process.chdir(originalCwd);
        await fs.remove(testDir);

        // Clean up any session directories that might have been created in OS temp directory
        try {
            const tempDir = tmpdir();
            const files = await fs.readdir(tempDir);
            const sessionDirs = files.filter(file =>
                file.startsWith('hbs-templates-copy-') ||
                file.startsWith('generated-documentation-')
            );
            for (const dir of sessionDirs) {
                await fs.remove(path.join(tempDir, dir)).catch(() => {});
            }
        } catch (e) {
            // Ignore cleanup errors
        }
    });

    describe('Full Workflow Integration', () => {
        it('should complete full template customization workflow', async function() {

            // 1. Create session via API
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;
            expect(sessionId).to.be.a('string');

            // 2. Get templates list
            const templatesResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/templates`)
                .expect(200);

            expect(templatesResponse.body).to.have.property('templates');
            expect(templatesResponse.body.templates).to.be.an('array');
            expect(templatesResponse.body.templates.length).to.be.greaterThan(0);

            // 3. Get template content
            const templateResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/template/partials/component.hbs`)
                .expect(200);

            const originalContent = templateResponse.body.content;
            expect(originalContent).to.include('component-doc');

            // 4. Modify template
            const modifiedContent = originalContent + '\n<!-- Modified for integration testing -->';
            await request(server.getHttpServer())
                .post(`/api/session/${sessionId}/template/partials/component.hbs`)
                .send({ content: modifiedContent })
                .expect(200);

            // 5. Verify modification was saved
            const verifyResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/template/partials/component.hbs`)
                .expect(200);

            expect(verifyResponse.body.content).to.include('Modified for integration testing');

            // 6. Generate documentation
            const docsResponse = await request(server.getHttpServer())
                .post(`/api/session/${sessionId}/generate`)
                .expect(200);

            expect(docsResponse.body).to.have.property('success', true);

            // 7. Download ZIP package
            const zipResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/download/all`)
                .expect(200);

            expect(zipResponse.headers['content-type']).to.include('application/zip');
            
            // Check ZIP content using content-length header (more reliable for binary data)
            const contentLength = parseInt(zipResponse.headers['content-length']);
            expect(contentLength).to.be.greaterThan(0);
            
            // Also verify body exists (supertest populates it as object for binary)
            expect(zipResponse.body).to.not.be.undefined;
        });

        it('should handle concurrent sessions with isolation', async function() {

            // Create multiple sessions
            const sessions = [];
            for (let i = 0; i < 3; i++) {
                const response = await request(server.getHttpServer())
                    .post('/api/session?forceNew=true')
                    .expect(200);
                sessions.push(response.body.sessionId);
            }

            // Modify templates in each session differently
            for (let i = 0; i < sessions.length; i++) {
                const sessionId = sessions[i];
                const content = `<html>Session ${i + 1} Content</html>`;

                await request(server.getHttpServer())
                    .post(`/api/session/${sessionId}/template/page.hbs`)
                    .send({ content })
                    .expect(200);
            }

            // Verify isolation - each session should have its own content
            for (let i = 0; i < sessions.length; i++) {
                const sessionId = sessions[i];
                const response = await request(server.getHttpServer())
                    .get(`/api/session/${sessionId}/template/page.hbs`)
                    .expect(200);

                expect(response.body.content).to.include(`Session ${i + 1} Content`);
            }
        });

        it('should preserve modifications across multiple operations', async function() {

            // Create session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Make multiple template modifications
            const modifications = [
                { path: 'page.hbs', content: '<html><head><title>Custom Title</title></head><body>{{{content}}}</body></html>' },
                { path: 'partials/component.hbs', content: '<div class="custom-component">{{component.name}}</div>' },
                { path: 'partials/service.hbs', content: '<div class="custom-service">{{service.name}}</div>' }
            ];

            // Apply modifications
            for (const mod of modifications) {
                await request(server.getHttpServer())
                    .post(`/api/session/${sessionId}/template/${mod.path}`)
                    .send({ content: mod.content })
                    .expect(200);
            }

            // Generate documentation
            const docsResponse = await request(server.getHttpServer())
                .post(`/api/session/${sessionId}/generate`)
                .expect(200);

            expect(docsResponse.body).to.have.property('success', true);

            // Verify modifications are still intact after generation
            for (const mod of modifications) {
                const response = await request(server.getHttpServer())
                    .get(`/api/session/${sessionId}/template/${mod.path}`)
                    .expect(200);

                expect(response.body.content).to.equal(mod.content);
            }

            // Download ZIP
            const zipResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/download/all`)
                .expect(200);

            // Check ZIP content using content-length header (more reliable for binary data)
            const contentLength = parseInt(zipResponse.headers['content-length']);
            expect(contentLength).to.be.greaterThan(0);

            // Verify modifications are still intact after ZIP creation
            for (const mod of modifications) {
                const response = await request(server.getHttpServer())
                    .get(`/api/session/${sessionId}/template/${mod.path}`)
                    .expect(200);

                expect(response.body.content).to.equal(mod.content);
            }
        });
    });

    describe('Error Recovery Integration', () => {
        it('should handle API errors gracefully', async function() {

            // Try to access non-existent session
            await request(server.getHttpServer())
                .get('/api/session/invalid-session/templates')
                .expect(404);

            // Create valid session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Try to access non-existent template
            await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/template/non-existent.hbs`)
                .expect(404);

            // Verify session is still functional
            const templatesResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/templates`)
                .expect(200);

            expect(templatesResponse.body).to.have.property('templates');
            expect(templatesResponse.body.templates).to.be.an('array');
            expect(templatesResponse.body.templates.length).to.be.greaterThan(0);
        });

        it('should handle malformed requests', async function() {

            // Create session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Try to save template without content
            await request(server.getHttpServer())
                .post(`/api/session/${sessionId}/template/page.hbs`)
                .send({}) // Missing content
                .expect(400);

            // Try to save template with invalid content type
            await request(server.getHttpServer())
                .post(`/api/session/${sessionId}/template/page.hbs`)
                .send({ content: null })
                .expect(400);

            // Verify session is still functional
            const templatesResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/templates`)
                .expect(200);

            expect(templatesResponse.body).to.have.property('templates');
            expect(templatesResponse.body.templates).to.be.an('array');
        });
    });

    describe('Resource Management', () => {
        it('should handle multiple sessions efficiently', async function() {

            const sessions = [];
            const numSessions = 5;

            // Create multiple sessions
            for (let i = 0; i < numSessions; i++) {
                const response = await request(server.getHttpServer())
                    .post('/api/session?forceNew=true')
                    .expect(200);

                sessions.push(response.body.sessionId);
            }

            // Perform operations on each session
            for (let i = 0; i < sessions.length; i++) {
                const sessionId = sessions[i];

                // Modify templates
                await request(server.getHttpServer())
                    .post(`/api/session/${sessionId}/template/page.hbs`)
                    .send({ content: `<html>Session ${i}</html>` })
                    .expect(200);

                // Generate documentation (this may take time)
                const docsResponse = await request(server.getHttpServer())
                    .post(`/api/session/${sessionId}/generate`)
                    .expect(200);

                expect(docsResponse.body).to.have.property('success', true);

                // Download ZIP
                const zipResponse = await request(server.getHttpServer())
                    .get(`/api/session/${sessionId}/download/all`)
                    .expect(200);

                // Check ZIP content using content-length header (more reliable for binary data)
            const contentLength = parseInt(zipResponse.headers['content-length']);
            expect(contentLength).to.be.greaterThan(0);
            }

            // Verify all sessions are still accessible
            for (const sessionId of sessions) {
                const response = await request(server.getHttpServer())
                    .get(`/api/session/${sessionId}/templates`)
                    .expect(200);

                expect(response.body).to.have.property('templates');
                expect(response.body.templates).to.be.an('array');
            }
        });
    });
});
