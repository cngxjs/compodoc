import * as crypto from 'node:crypto';
import type { ts } from 'ts-morph';
import type { IDep } from '../dependencies.interfaces';

export class EntityDepFactory {
    constructor() {}

    public create(
        file: any,
        srcFile: ts.SourceFile,
        name: string,
        _properties: ReadonlyArray<ts.ObjectLiteralElementLike>,
        IO: any
    ): IEntityDep {
        const sourceCode = srcFile.getText();
        const hash = crypto.createHash('sha512').update(sourceCode).digest('hex');
        const infos: IEntityDep = {
            name,
            id: `entity-${name}-${hash}`,
            file: file,
            type: 'entity',
            description: IO.description,
            rawdescription: IO.rawdescription,
            sourceCode: srcFile.text,
            deprecated: IO.deprecated,
            deprecationMessage: IO.deprecationMessage,
            properties: IO.properties,
            storybookUrl: IO.storybookUrl || '',
            figmaUrl: IO.figmaUrl || '',
            stackblitzUrl: IO.stackblitzUrl || '',
            githubUrl: IO.githubUrl || '',
            docsUrl: IO.docsUrl || ''
        };
        return infos;
    }
}

export interface IEntityDep extends IDep {
    file: any;
    sourceCode: string;
    description: string;
    rawdescription: string;
    deprecated: boolean;
    deprecationMessage: string;
    properties: Array<any>;
    storybookUrl?: string;
    figmaUrl?: string;
    stackblitzUrl?: string;
    githubUrl?: string;
    docsUrl?: string;
}
