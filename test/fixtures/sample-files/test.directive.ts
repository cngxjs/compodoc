import { Directive } from '@angular2/core';

/**
 * Test class for JSDoc @example language specification
 * 
 * @example
 * ```typescript
 * // TypeScript example
 * const instance = new TestClass();
 * instance.testMethod();
 * ```
 * 
 * @example
 * ```html
 * <!-- HTML example -->
 * <div>Hello World</div>
 * ```
 * 
 * @example
 * ```javascript
 * // JavaScript example
 * const result = testFunction();
 * ```
 */
@Directive({ selector: '[app-test]' })
export class TestClass {
    /**
     * Test method with examples
     * 
     * @example
     * ```typescript
     * // Method usage
     * const test = new TestClass();
     * test.testMethod();
     * ```
     */
    testMethod(): void {
        console.log('Test method');
    }
} 