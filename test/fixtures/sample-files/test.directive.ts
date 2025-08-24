import { Directive } from '@angular2/core';

/**
 * Test class for JSDoc Example language specification
 * 
 * @example
 * ```typescript
 * // TypeScript example
 * const instance = new TestClass();
 * 
 * // Calling the test method
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