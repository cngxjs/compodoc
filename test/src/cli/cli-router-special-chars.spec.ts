import fs from 'fs-extra';
import * as path from 'path';

import { temporaryDir, shell, exists, read } from '../helpers';

const tmp = temporaryDir();

describe('CLI Router Parser Special Characters Fix', () => {
    const distFolder = tmp.name + '-router-special-chars';

    beforeAll(() => {
        tmp.create(distFolder);

        // Create test project with problematic special characters
        const srcDir = path.join(distFolder, 'src');
        fs.ensureDirSync(srcDir);
        
        // Component with inline template to avoid file path issues
        const testComponent = `
import { Component } from '@angular/core';

@Component({
  selector: 'test-component',
  template: '<div>Test component with special routes</div>',
  styles: ['.test { color: blue; }']
})
export class TestComponent {
  constructor() {}
}`;
        
        // Module with routes containing special characters from all reported issues
        const moduleWithSpecialCharRoutes = `
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestComponent } from './test.component';

const USER = 'user';
const CREATE = 'create';
const EDIT = 'edit';

const routes: Routes = [
  { path: 'admin.config', component: TestComponent },           // Issue #1581 - dots
  { path: 'route+with+plus', component: TestComponent },        // Issue #1610 - plus
  { path: 'user(profile)', component: TestComponent },          // Issue #1594 - parentheses
  { path: 'complex.path(with)+special/chars', component: TestComponent },
  { path: \`\${USER}/\${CREATE}\`, component: TestComponent },     // New issue - template literals
  { path: \`\${USER}/\${EDIT}/:id\`, component: TestComponent }    // New issue - template literals with params
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  declarations: [TestComponent]
})
export class AppModule { }`;

        const tsconfig = `{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"]
}`;

        fs.writeFileSync(path.join(srcDir, 'test.component.ts'), testComponent);
        fs.writeFileSync(path.join(srcDir, 'app.module.ts'), moduleWithSpecialCharRoutes);
        fs.writeFileSync(path.join(distFolder, 'tsconfig.json'), tsconfig);
        
    });
    
    afterAll(() => {
        tmp.clean(distFolder);
    });

    it('should generate documentation without JSON5 parsing errors for special character routes', () => {
        
        const ls = shell('node', [
            './bin/index-cli.js',
            '-p', path.join(distFolder, 'tsconfig.json'),
            '-d', path.join(distFolder, 'docs'),
            '--disableSourceCode',
            '--disableCoverage'
        ]);

        const stdout = ls.stdout.toString();
        const stderr = ls.stderr.toString();
        
        // Primary test: should not have the specific JSON5 parsing errors from reported issues
        expect(stderr).to.not.contain('JSON5: invalid character \'+\'');   // Issue #1610
        expect(stderr).to.not.contain('JSON5: invalid character \'(\'');   // Issue #1594  
        expect(stderr).to.not.contain('JSON5: invalid character \'.\'');   // Issue #1581
        expect(stderr).to.not.contain('JSON5: invalid character \'"\'');   // New issue - template literals
        expect(stderr).to.not.contain('Unhandled Rejection');              // All issues
        
        // Should complete successfully despite special characters in routes
        expect(stdout).to.contain('Documentation generated');
        
        // Documentation should be generated
        expect(exists(path.join(distFolder, 'docs'))).to.be.true;
        
    });

    it('should handle template literal routes and complex character combinations', () => {
        
        // Test that our fix handles template literals and all reported special character issues
        const ls = shell('node', [
            './bin/index-cli.js',
            '-p', path.join(distFolder, 'tsconfig.json'),
            '-d', path.join(distFolder, 'docs-comprehensive-test'),
            '--disableSourceCode',
            '--disableCoverage'
        ]);

        const stdout = ls.stdout.toString();
        const stderr = ls.stderr.toString();
        
        // Should not crash with template literals or any of the problematic character combinations
        expect(stderr).to.not.contain('JSON5: invalid character \'"\'');   // Template literals
        expect(stderr).to.not.contain('JSON5: invalid character \'(\'');   // Parentheses
        expect(stderr).to.not.contain('JSON5: invalid character');          // Any other chars
        expect(stderr).to.not.contain('Unhandled Rejection');
        
        // Should still generate documentation successfully
        expect(stdout).to.contain('Documentation generated');
        
    });
});
