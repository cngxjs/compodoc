import Html from '@kitajs/html';
import {
    extractJsdocCodeExamples,
    isInfoSection,
    isTabEnabled,
    linkTypeHtml,
    parseDescription,
    t,
} from '../helpers';
import { BlockAccessors } from '../blocks/BlockAccessors';
import { BlockConstructor } from '../blocks/BlockConstructor';
import { BlockHostListener } from '../blocks/BlockHostListener';
import { BlockIndex } from '../blocks/BlockIndex';
import { BlockIndexSignatures } from '../blocks/BlockIndexSignatures';
import { BlockInput } from '../blocks/BlockInput';
import { BlockMethod } from '../blocks/BlockMethod';
import { BlockOutput } from '../blocks/BlockOutput';
import { BlockProperty } from '../blocks/BlockProperty';
import { EntityTabs } from '../blocks/EntityTabs';

/**
 * Shared info-tab sections for class-like entities
 * (class, directive, injectable, guard, interceptor, pipe, entity, interface).
 */
export type EntityInfoProps = {
    readonly entity: any;
    readonly entityKey: string;
    readonly breadcrumbLabel: string;
    readonly depth: number;
    readonly navTabs: any[];
    readonly disableFilePath?: boolean;
    readonly metadataHtml?: string;
    readonly showExtends?: boolean;
    readonly showIndex?: boolean;
    readonly showConstructor?: boolean;
    readonly showInputs?: boolean;
    readonly showOutputs?: boolean;
    readonly showHostBindings?: boolean;
    readonly showHostListeners?: boolean;
    readonly showMethods?: boolean;
    readonly showProperties?: boolean;
    readonly showAccessors?: boolean;
    readonly showIndexSignatures?: boolean;
    readonly showStandaloneBadge?: boolean;
    readonly showTokenBadge?: boolean;
    readonly showJsdocBadges?: boolean;
};

const InfoContent = (props: EntityInfoProps): string => {
    const e = props.entity;
    return (<>
        {isInfoSection('file') && !props.disableFilePath && (<>
            <p class="comment"><h3>{t('file')}</h3></p>
            <p class="comment"><code>{e.file}</code></p>
        </>)}

        {isInfoSection('deprecated') && e.deprecated && (<>
            <p class="comment"><h3 class="deprecated">{t('deprecated')}</h3></p>
            <p class="comment">{e.deprecationMessage}</p>
        </>)}

        {isInfoSection('description') && e.description && (<>
            <p class="comment"><h3>{t('description')}</h3></p>
            <p class="comment">{parseDescription(e.description, props.depth)}</p>
        </>)}

        {isInfoSection('extends') && props.showExtends !== false && e.extends && (<>
            <p class="comment"><h3>{t('extends')}</h3></p>
            <p class="comment">{(e.extends as string[]).map(ext => linkTypeHtml(ext)).join(' ')}</p>
        </>)}

        {isInfoSection('extends') && props.showExtends !== false && e.implements && (<>
            <p class="comment"><h3>{t('implements')}</h3></p>
            <p class="comment">{(e.implements as string[]).map(impl => linkTypeHtml(impl)).join(' ')}</p>
        </>)}

        {isInfoSection('examples') && e.jsdoctags && (() => {
            const examples = extractJsdocCodeExamples(e.jsdoctags);
            if (examples.length === 0) return '';
            return (<>
                <p class="comment"><h3>{t('example')}</h3></p>
                <div class="io-description">
                    {examples.map(ex => <div>{ex.comment}</div>)}
                </div>
            </>);
        })()}

        {props.metadataHtml}

        {isInfoSection('index') && props.showIndex !== false && (
            BlockIndex({
                properties: e.propertiesClass ?? e.properties,
                methods: e.methodsClass ?? e.methods,
                inputs: e.inputsClass,
                outputs: e.outputsClass,
                hostBindings: e.hostBindings,
                hostListeners: e.hostListeners,
                accessors: e.accessors,
            })
        )}

        {isInfoSection('constructor') && props.showConstructor !== false && e.constructorObj && (
            BlockConstructor({ constructor: e.constructorObj, file: e.file, depth: props.depth, navTabs: props.navTabs })
        )}

        {isInfoSection('inputs') && props.showInputs !== false && e.inputsClass && (
            BlockInput({ element: e, file: e.file, depth: props.depth, navTabs: props.navTabs })
        )}

        {isInfoSection('outputs') && props.showOutputs !== false && e.outputsClass && (
            BlockOutput({ element: e, file: e.file, depth: props.depth, navTabs: props.navTabs })
        )}

        {isInfoSection('hostBindings') && props.showHostBindings !== false && e.hostBindings && (
            BlockProperty({ properties: e.hostBindings, file: e.file, title: 'HostBindings', depth: props.depth, navTabs: props.navTabs })
        )}

        {isInfoSection('hostListeners') && props.showHostListeners !== false && e.hostListeners && (
            BlockHostListener({ methods: e.hostListeners, file: e.file, title: 'HostListeners', depth: props.depth, navTabs: props.navTabs })
        )}

        {isInfoSection('methods') && props.showMethods !== false && (e.methodsClass ?? e.methods) && (
            BlockMethod({ methods: e.methodsClass ?? e.methods, file: e.file, depth: props.depth, navTabs: props.navTabs })
        )}

        {isInfoSection('properties') && props.showProperties !== false && (e.propertiesClass ?? e.properties) && (
            BlockProperty({ properties: e.propertiesClass ?? e.properties, file: e.file, depth: props.depth, navTabs: props.navTabs })
        )}

        {isInfoSection('indexSignatures') && props.showIndexSignatures !== false && e.indexSignatures && (
            BlockIndexSignatures({ indexables: e.indexSignatures, file: e.file, depth: props.depth, navTabs: props.navTabs })
        )}

        {isInfoSection('accessors') && props.showAccessors !== false && e.accessors && (
            BlockAccessors({ accessors: e.accessors, file: e.file, depth: props.depth, navTabs: props.navTabs })
        )}
    </>) as string;
};

/** Generic entity detail page renderer. */
export const renderEntityPage = (props: EntityInfoProps): string => (<>
    <ol class="breadcrumb">
        <li class="breadcrumb-item">{t(props.breadcrumbLabel)}</li>
        <li class={props.entity.deprecated ? 'breadcrumb-item deprecated-name' : 'breadcrumb-item'}>
            {props.entity.name}
            {props.showStandaloneBadge && props.entity.standalone ? <span class="cdx-badge cdx-badge--standalone">Standalone</span> : ''}
            {props.showTokenBadge && props.entity.isToken ? <span class="cdx-badge cdx-badge--token">Token</span> : ''}
            {props.showJsdocBadges && props.entity.beta ? <span class="cdx-badge cdx-badge--beta">Beta</span> : ''}
            {props.showJsdocBadges && props.entity.since ? <span class="cdx-badge cdx-badge--since">v{props.entity.since}</span> : ''}
            {props.showJsdocBadges && props.entity.breaking ? <span class="cdx-badge cdx-badge--breaking">Breaking {props.entity.breaking}</span> : ''}
        </li>
    </ol>
    {EntityTabs({
        navTabs: props.navTabs,
        infoContent: InfoContent(props),
        readme: props.entity.readme,
        sourceCode: props.entity.sourceCode,
        exampleUrls: props.entity.exampleUrls,
    })}
</>) as string;
