import { describe, it, expect } from 'vitest';
import { extractDeclaration } from '../../../../src/templates/helpers/extract-declaration';

describe('extractDeclaration', () => {
    it('should return null for empty input', () => {
        expect(extractDeclaration('')).toBeNull();
        expect(extractDeclaration('  ')).toBeNull();
        expect(extractDeclaration(null as unknown as string)).toBeNull();
    });

    it('should return null for source without class or decorator', () => {
        expect(extractDeclaration('const x = 5;\nconsole.log(x);')).toBeNull();
    });

    it('should extract a simple component decorator and class', () => {
        const source = `
import { Component } from '@angular/core';

@Component({
  selector: 'app-hello',
  standalone: true,
})
export class HelloComponent {
  name = 'World';
}`;
        const result = extractDeclaration(source);
        expect(result).not.toBeNull();
        expect(result).toContain('@Component');
        expect(result).toContain('selector');
        expect(result).toContain('HelloComponent');
    });

    it('should collapse method bodies with // ...', () => {
        const source = `
@Component({ selector: 'app-test' })
export class TestComponent {
  title = 'hello';

  greet() {
    console.log('hi');
    return 'hello';
  }

  farewell() {
    console.log('bye');
  }
}`;
        const result = extractDeclaration(source)!;
        expect(result).toContain('greet()');
        expect(result).toContain('// ...');
        expect(result).not.toContain("console.log('hi')");
        expect(result).not.toContain("return 'hello'");
    });

    it('should extract directive with decorator', () => {
        const source = `
import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective {
  constructor(private el: ElementRef) {}
}`;
        const result = extractDeclaration(source);
        expect(result).not.toBeNull();
        expect(result).toContain('@Directive');
        expect(result).toContain('appHighlight');
        expect(result).toContain('HighlightDirective');
    });

    it('should extract pipe with decorator', () => {
        const source = `
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number): string {
    return value.length > limit ? value.substring(0, limit) + '...' : value;
  }
}`;
        const result = extractDeclaration(source)!;
        expect(result).toContain('@Pipe');
        expect(result).toContain('TruncatePipe');
        expect(result).toContain('transform(');
        expect(result).toContain('// ...');
        expect(result).not.toContain('substring');
    });

    it('should extract injectable with decorator', () => {
        const source = `
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUsers() {
    return this.http.get('/api/users');
  }
}`;
        const result = extractDeclaration(source)!;
        expect(result).toContain('@Injectable');
        expect(result).toContain('UserService');
    });

    it('should extract export class without decorator', () => {
        const source = `
export class MyUtils {
  static format(val: string): string {
    return val.trim();
  }
}`;
        const result = extractDeclaration(source)!;
        expect(result).toContain('export class MyUtils');
        expect(result).toContain('format(');
    });

    it('should extract export interface', () => {
        const source = `
export interface UserConfig {
  name: string;
  email: string;
  age?: number;
}`;
        const result = extractDeclaration(source)!;
        expect(result).toContain('export interface UserConfig');
        expect(result).toContain('name: string');
    });

    it('should extract abstract class', () => {
        const source = `
export abstract class BaseService {
  abstract getData(): Observable<any>;

  protected log(msg: string) {
    console.log(msg);
  }
}`;
        const result = extractDeclaration(source)!;
        expect(result).toContain('export abstract class BaseService');
        expect(result).toContain('getData()');
    });

    it('should truncate declarations over 20 lines with summary', () => {
        // Generate a class with many members
        const members = Array.from({ length: 15 }, (_, i) =>
            `  method${i}() {\n    return ${i};\n  }`
        ).join('\n\n');
        const source = `@Component({ selector: 'app-big' })\nexport class BigComponent {\n${members}\n}`;
        const result = extractDeclaration(source)!;
        expect(result).not.toBeNull();
        const lines = result.split('\n');
        expect(lines.length).toBeLessThanOrEqual(25); // some tolerance
        expect(result).toContain('methods');
    });

    it('should handle nested braces in decorator metadata', () => {
        const source = `
@Component({
  selector: 'app-test',
  host: { '[class.active]': 'isActive' },
})
export class TestComponent {
  isActive = false;
}`;
        const result = extractDeclaration(source)!;
        expect(result).toContain('@Component');
        expect(result).toContain('TestComponent');
    });
});
