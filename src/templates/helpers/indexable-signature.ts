/** Render an indexable signature: `name[arg: type]` or `[arg: type]`. */
export const indexableSignature = (method: {
    name?: string;
    args: { name: string; type: string }[];
}): string => {
    const args = method.args.map(arg => `${arg.name}: ${arg.type}`).join(', ');
    return method.name ? `${method.name}[${args}]` : `[${args}]`;
};
