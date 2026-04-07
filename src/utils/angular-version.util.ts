import { IAngularApi } from './angular-api.util';

export class AngularVersionUtil {
    private static readonly CorePackage = '@angular/core';

    private static instance: AngularVersionUtil;
    private constructor() {}
    public static getInstance() {
        if (!AngularVersionUtil.instance) {
            AngularVersionUtil.instance = new AngularVersionUtil();
        }
        return AngularVersionUtil.instance;
    }

    public cleanVersion(version: string): string {
        return version
            .replace('~', '')
            .replace('^', '')
            .replace('=', '')
            .replace('<', '')
            .replace('>', '');
    }

    public getAngularVersionOfProject(packageData): string {
        let _result = '';

        if (packageData.dependencies) {
            const angularCore = packageData.dependencies[AngularVersionUtil.CorePackage];
            if (angularCore) {
                _result = this.cleanVersion(angularCore);
            }
        }
        console.log('Angular version from dependencies:', _result);
        return _result;
    }

    public getApiLink(api: IAngularApi): string {
        return `https://angular.dev/${api.path}`;
    }
}

export default AngularVersionUtil.getInstance();
