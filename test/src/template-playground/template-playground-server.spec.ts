import * as fs from 'fs-extra';
import * as path from 'path';

import * as request from 'supertest';
import { TemplatePlaygroundServer } from '../../../src/template-playground/template-playground-server';

describe('TemplatePlaygroundServer', () => {
    let server: TemplatePlaygroundServer;
    let testDir: string;
    let originalCwd: string;

    beforeEach(async function() {

        originalCwd = process.cwd();
        testDir = path.join(process.cwd(), 'test-temp');
        await fs.ensureDir(testDir);

        // Create test playground-demo project
        const playgroundDemoDir = path.join(testDir, 'src', 'playground-demo');
        await fs.ensureDir(playgroundDemoDir);
        await fs.writeFile(path.join(playgroundDemoDir, 'tsconfig.json'), JSON.stringify({
            compilerOptions: {
                target: "es2015",
                module: "commonjs",
                experimentalDecorators: true,
                emitDecoratorMetadata: true
            },
            include: ["src/**/*"]
        }, null, 2));

        // Create minimal Angular structure
        await fs.ensureDir(path.join(playgroundDemoDir, 'src', 'app'));
        await fs.writeFile(path.join(playgroundDemoDir, 'src', 'app', 'app.component.ts'), `
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<h1>{{title}}</h1>'
})
export class AppComponent {
  title = 'Test App';
}
`);

        // Create test templates
        const templatesDir = path.join(testDir, 'src', 'templates');
        await fs.ensureDir(path.join(templatesDir, 'partials'));
        await fs.writeFile(path.join(templatesDir, 'page.hbs'), '<html><body>{{content}}</body></html>');
        await fs.writeFile(path.join(templatesDir, 'partials', 'component.hbs'), '<div>{{component.name}}</div>');

        // Create minimal static resources
        const resourcesDir = path.join(testDir, 'src', 'resources');
        await fs.ensureDir(path.join(resourcesDir, 'template-playground-app'));
        await fs.writeFile(path.join(resourcesDir, 'template-playground-app', 'index.html'),
            '<html><body>Playground</body></html>');
        await fs.writeFile(path.join(resourcesDir, 'template-playground-app', 'app.js'),
            'console.log("test");');

        // Change to test directory
        process.chdir(testDir);

        // Create server (this will call setupPaths internally)
        server = new TemplatePlaygroundServer();
        await server.start();
    });

    afterEach(async function() {

        if (server) {
            await server.stop();
        }

        process.chdir(originalCwd);
        await fs.remove(testDir);

        // Clean up any session directories from OS temp folder
        try {
            const tempDir = require('os').tmpdir();
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

    describe('Server HTTP API', () => {
        it('should serve the playground index page', async () => {
            const response = await request(server.getHttpServer())
                .get('/')
                .expect(200);

            expect(response.text).to.include('Playground');
        });

        it('should create session and return session ID', async () => {
            const response = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            expect(response.body).to.have.property('sessionId');
            expect(response.body.sessionId).to.be.a('string');
            expect(response.body.sessionId.length).to.be.greaterThan(0);
        });

        it('should list available templates for session', async () => {
            // Create session first
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Get templates list
            const templatesResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/templates`)
                .expect(200);

            expect(templatesResponse.body).to.have.property('templates');
            expect(templatesResponse.body.templates).to.be.an('array');
            expect(templatesResponse.body.templates.length).to.be.greaterThan(0);
            expect(templatesResponse.body.templates.some((t: any) => t.path === 'page.hbs')).to.be.true;
        });

        it('should get template content', async () => {
            // Create session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Get template content
            const templateResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/template/page.hbs`)
                .expect(200);

            expect(templateResponse.body).to.have.property('content');
            expect(templateResponse.body.content).to.include('<html>');
        });

        it('should save template content', async () => {
            // Create session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;
            const newContent = '<html><body><h1>Modified</h1>{{content}}</body></html>';

            // Save template content
            await request(server.getHttpServer())
                .post(`/api/session/${sessionId}/template/page.hbs`)
                .send({ content: newContent })
                .expect(200);

            // Verify content was saved
            const templateResponse = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/template/page.hbs`)
                .expect(200);

            expect(templateResponse.body.content).to.equal(newContent);
        });

        it('should generate documentation for session', async function() {

            // Create session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Generate documentation
            const docsResponse = await request(server.getHttpServer())
                .post(`/api/session/${sessionId}/generate`)
                .expect(200);

            expect(docsResponse.body).to.have.property('success', true);
        });

        it('should download template package as ZIP', async function() {

            // Create session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Download templates
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
    });

    describe('Session Management', () => {
        it('should handle multiple concurrent sessions', async () => {
            const sessions = [];

            // Create multiple sessions with explicit forceNew parameter
            for (let i = 0; i < 3; i++) {
                const response = await request(server.getHttpServer())
                    .post('/api/session?forceNew=true')
                    .expect(200);

                sessions.push(response.body.sessionId);
            }

            // Verify all sessions are unique
            const uniqueSessions = new Set(sessions);
            expect(uniqueSessions.size).to.equal(3);

            // Verify each session can access templates independently
            for (const sessionId of sessions) {
                const templatesResponse = await request(server.getHttpServer())
                    .get(`/api/session/${sessionId}/templates`)
                    .expect(200);

                expect(templatesResponse.body).to.have.property('templates');
                expect(templatesResponse.body.templates).to.be.an('array');
                expect(templatesResponse.body.templates.length).to.be.greaterThan(0);
            }
        });

        it('should isolate template modifications between sessions', async () => {
            // Create two sessions with explicit forceNew parameter
            const session1Response = await request(server.getHttpServer())
                .post('/api/session?forceNew=true')
                .expect(200);

            const session2Response = await request(server.getHttpServer())
                .post('/api/session?forceNew=true')
                .expect(200);

            const session1Id = session1Response.body.sessionId;
            const session2Id = session2Response.body.sessionId;

            // Modify template in session 1
            const content1 = '<html>Session 1 Content</html>';
            await request(server.getHttpServer())
                .post(`/api/session/${session1Id}/template/page.hbs`)
                .send({ content: content1 })
                .expect(200);

            // Modify template in session 2
            const content2 = '<html>Session 2 Content</html>';
            await request(server.getHttpServer())
                .post(`/api/session/${session2Id}/template/page.hbs`)
                .send({ content: content2 })
                .expect(200);

            // Verify isolation
            const template1Response = await request(server.getHttpServer())
                .get(`/api/session/${session1Id}/template/page.hbs`)
                .expect(200);

            const template2Response = await request(server.getHttpServer())
                .get(`/api/session/${session2Id}/template/page.hbs`)
                .expect(200);

            expect(template1Response.body.content).to.equal(content1);
            expect(template2Response.body.content).to.equal(content2);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid session ID', async () => {
            await request(server.getHttpServer())
                .get('/api/session/invalid-session-id/templates')
                .expect(404);
        });

        it('should handle invalid template path', async () => {
            // Create session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Try to get non-existent template
            await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/template/non-existent.hbs`)
                .expect(404);
        });

        it('should handle malformed requests', async () => {
            // Create session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Try to save template without content
            await request(server.getHttpServer())
                .post(`/api/session/${sessionId}/template/page.hbs`)
                .send({}) // No content field
                .expect(400);
        });
    });

    describe('Template Features', () => {
        it('should preserve template structure during modifications', async () => {
            // Create session
            const sessionResponse = await request(server.getHttpServer())
                .post('/api/session')
                .expect(200);

            const sessionId = sessionResponse.body.sessionId;

            // Get initial templates list
            const initialTemplates = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/templates`)
                .expect(200);

            // Modify a template
            await request(server.getHttpServer())
                .post(`/api/session/${sessionId}/template/page.hbs`)
                .send({ content: '<html>Modified</html>' })
                .expect(200);

            // Verify templates list is unchanged
            const finalTemplates = await request(server.getHttpServer())
                .get(`/api/session/${sessionId}/templates`)
                .expect(200);

            expect(finalTemplates.body.templates.length).to.equal(initialTemplates.body.templates.length);

            // Verify structure is maintained
            const templatePaths = finalTemplates.body.templates.map((t: any) => t.path);
            expect(templatePaths).to.include('page.hbs');
            expect(templatePaths).to.include('partials/component.hbs');
        });
    });
});
