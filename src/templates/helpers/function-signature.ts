import DependenciesEngine from '../../app/engines/dependencies.engine';

const escapeHtml = (str: string): string =>
    String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
import AngularVersionUtil from '../../utils/angular-version.util';
import BasicTypeUtil from '../../utils/basic-type.util';
import Configuration from '../../app/configuration';

const miscSubtypeToPage: Record<string, string> = {
    enum: 'enumerations',
    function: 'functions',
    typealias: 'typealiases',
    variable: 'variables'
};

function buildHrefForInternalType(data: any): string {
    if (data.type === 'miscellaneous' || (data.ctype && data.ctype === 'miscellaneous')) {
        const page = miscSubtypeToPage[data.subtype] ?? '';
        return `../miscellaneous/${page}.html#${data.name}`;
    }
    const path = data.type === 'class' ? 'classe' : data.type;
    return `../${path}s/${data.name}.html`;
}

function resolveTypeLink(typeName: string): string | null {
    const result = DependenciesEngine.find(typeName);
    if (result) {
        if (result.source === 'internal') {
            const href = buildHrefForInternalType(result.data);
            return `<a href="${href}" target="_self">${escapeHtml(typeName)}</a>`;
        }
        const path = AngularVersionUtil.getApiLink(
            result.data,
            Configuration.mainData.angularVersion
        );
        return `<a href="${path}" target="_blank">${escapeHtml(typeName)}</a>`;
    }
    if (BasicTypeUtil.isKnownType(typeName)) {
        const url = BasicTypeUtil.getTypeUrl(typeName);
        return `<a href="${url}" target="_blank">${escapeHtml(typeName)}</a>`;
    }
    return null;
}

function getOptionalString(arg: any): string {
    return arg.optional ? '?' : '';
}

function handleFunction(arg: any): string {
    if (arg.function.length === 0) {
        return `${arg.name}${getOptionalString(arg)}: () => void`;
    }
    const argums = arg.function.map((argu: any) => {
        const link = resolveTypeLink(argu.type);
        if (link) return `${argu.name}${getOptionalString(arg)}: ${link}`;
        if (argu.name && argu.type) return `${argu.name}${getOptionalString(arg)}: ${argu.type}`;
        return argu.name?.text ?? '';
    });
    return `${arg.name}${getOptionalString(arg)}: (${argums.join(', ')}) => void`;
}

/** Render a method's full signature as HTML string with type links. */
export const functionSignature = (method: any): string => {
    let args = '';
    let destructuredCounterInitial = 0;
    let destructuredCounterReal = 0;

    if (method.args) {
        method.args.forEach((arg: any) => {
            if (arg.destructuredParameter) destructuredCounterInitial += 1;
        });

        method.args.forEach((arg: any, index: number) => {
            if (arg.destructuredParameter) {
                if (destructuredCounterReal === 0) args += '__namedParameters: {';
                destructuredCounterReal += 1;
            }

            const link = resolveTypeLink(arg.type);
            if (link) {
                args += `${arg.name}${getOptionalString(arg)}: ${link}`;
            } else if (arg.dotDotDotToken) {
                args += `...${arg.name}: ${arg.type}`;
            } else if (arg.function) {
                args += handleFunction(arg);
            } else if (arg.type) {
                args += `${arg.name}${getOptionalString(arg)}: ${arg.type}`;
            } else {
                args += `${arg.name}${getOptionalString(arg)}`;
            }

            if (
                arg.destructuredParameter &&
                destructuredCounterReal === destructuredCounterInitial
            ) {
                args += '}';
            }
            if (index < method.args.length - 1) args += ', ';
        });
    }

    return method.name ? `${method.name}(${args})` : `(${args})`;
};
