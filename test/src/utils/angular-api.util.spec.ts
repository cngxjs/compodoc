import { expect } from 'chai';
import { AngularApiUtil } from '../../../src/utils/angular-api.util';

describe('Utils - AngularApiUtil', () => {
    let angularApiUtil: any;

    beforeEach(() => {
        // Reset the singleton instance before each test
        (AngularApiUtil as any).instance = null;
        angularApiUtil = AngularApiUtil.getInstance();
    });

    afterEach(() => {
        // Clean up singleton instance after each test
        (AngularApiUtil as any).instance = null;
    });

    describe('getInstance()', () => {
        it('should return a singleton instance', () => {
            const instance1 = AngularApiUtil.getInstance();
            const instance2 = AngularApiUtil.getInstance();

            expect(instance1).to.be.an.instanceOf(AngularApiUtil);
            expect(instance2).to.be.an.instanceOf(AngularApiUtil);
            expect(instance1).to.equal(instance2);
        });

        it('should create only one instance even when called multiple times', () => {
            const instance1 = AngularApiUtil.getInstance();
            const instance2 = AngularApiUtil.getInstance();
            const instance3 = AngularApiUtil.getInstance();

            expect(instance1).to.equal(instance2);
            expect(instance2).to.equal(instance3);
        });
    });

    describe('findApi()', () => {
        it('should find an existing API by title', () => {
            const result = angularApiUtil.findApi('animate');

            expect(result).to.be.an('object');
            expect(result).to.have.property('source', 'external');
            expect(result).to.have.property('data');
            expect(result).to.have.property('score', 1);
            expect(result.data).to.have.property('title', 'animate');
            expect(result.data).to.have.property('path', 'api/animations/animate');
            expect(result.data).to.have.property('docType', 'function');
        });

        it('should find another existing API by title', () => {
            const result = angularApiUtil.findApi('AnimateChildOptions');

            expect(result).to.be.an('object');
            expect(result).to.have.property('source', 'external');
            expect(result).to.have.property('data');
            expect(result).to.have.property('score', 1);
            expect(result.data).to.have.property('title', 'AnimateChildOptions');
            expect(result.data).to.have.property('path', 'api/animations/AnimateChildOptions');
            expect(result.data).to.have.property('docType', 'interface');
        });

        it('should find an API with different docType', () => {
            const result = angularApiUtil.findApi('AnimationBuilder');

            expect(result).to.be.an('object');
            expect(result).to.have.property('source', 'external');
            expect(result).to.have.property('data');
            expect(result).to.have.property('score', 1);
            expect(result.data).to.have.property('title', 'AnimationBuilder');
            expect(result.data).to.have.property('docType', 'class');
        });

        it('should return undefined data and score 0 for non-existing API', () => {
            const result = angularApiUtil.findApi('NonExistingApi');

            expect(result).to.be.an('object');
            expect(result).to.have.property('source', 'external');
            expect(result).to.have.property('data', undefined);
            expect(result).to.have.property('score', 0);
        });

        it('should return undefined data and score 0 for empty string', () => {
            const result = angularApiUtil.findApi('');

            expect(result).to.be.an('object');
            expect(result).to.have.property('source', 'external');
            expect(result).to.have.property('data', undefined);
            expect(result).to.have.property('score', 0);
        });

        it('should be case sensitive when searching for API', () => {
            const result = angularApiUtil.findApi('animatechild'); // lowercase

            expect(result).to.be.an('object');
            expect(result).to.have.property('source', 'external');
            expect(result).to.have.property('data', undefined);
            expect(result).to.have.property('score', 0);
        });

        it('should find API with correct case', () => {
            const result = angularApiUtil.findApi('animateChild'); // correct case

            expect(result).to.be.an('object');
            expect(result).to.have.property('source', 'external');
            expect(result).to.have.property('data');
            expect(result).to.have.property('score', 1);
            expect(result.data).to.have.property('title', 'animateChild');
        });

        it('should handle API titles with special characters', () => {
            const result = angularApiUtil.findApi('AnimationMetadataType');

            expect(result).to.be.an('object');
            expect(result).to.have.property('source', 'external');
            expect(result).to.have.property('data');
            expect(result).to.have.property('score', 1);
            expect(result.data).to.have.property('title', 'AnimationMetadataType');
        });
    });
});
