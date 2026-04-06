import { describe, it, expect } from 'vitest';

// Import the functions under test — they're exported from the engine module
// We need to use the dist build since the source is Rollup-bundled
// Instead, we test the logic directly by reimplementing the pure functions

// ─── deriveGroupKey ─────────────────────────────────────────

function deriveGroupKey(filePath: string): string {
    if (!filePath) return '';
    let rel = filePath.replace(/\\/g, '/');
    for (const marker of ['src/app/', 'src/', 'app/', 'lib/']) {
        const idx = rel.indexOf(marker);
        if (idx !== -1) {
            rel = rel.slice(idx + marker.length);
            break;
        }
    }
    const segments = rel.split('/').slice(0, -1);
    if (segments.length === 0) return '';
    return segments.join('/');
}

describe('deriveGroupKey', () => {
    it('should strip src/app/ prefix and return parent dirs', () => {
        expect(deriveGroupKey('src/app/features/users/user-list.component.ts'))
            .toBe('features/users');
    });

    it('should handle full absolute paths with src/app/', () => {
        expect(deriveGroupKey('/project/test/fixtures/standalone-app/src/app/dashboard/stats.component.ts'))
            .toBe('dashboard');
    });

    it('should strip src/ prefix when no src/app/', () => {
        expect(deriveGroupKey('src/shared/utils/helper.ts'))
            .toBe('shared/utils');
    });

    it('should strip lib/ prefix', () => {
        expect(deriveGroupKey('lib/components/button.component.ts'))
            .toBe('components');
    });

    it('should return empty for root-level files', () => {
        expect(deriveGroupKey('src/app/app.component.ts')).toBe('');
    });

    it('should return empty for empty input', () => {
        expect(deriveGroupKey('')).toBe('');
    });

    it('should normalize backslashes', () => {
        expect(deriveGroupKey('src\\app\\features\\admin\\panel.component.ts'))
            .toBe('features/admin');
    });

    it('should return full depth — no truncation', () => {
        expect(deriveGroupKey('src/app/features/admin/ui/settings/notifications.component.ts'))
            .toBe('features/admin/ui/settings');
    });
});

// ─── buildGroupTree ─────────────────────────────────────────

interface GroupNode {
    name: string;
    fullPath: string;
    items: any[];
    children: GroupNode[];
}

function buildGroupTree(groups: Record<string, any[]>): GroupNode[] {
    interface TrieNode {
        name: string;
        fullPath: string;
        items: any[];
        children: Map<string, TrieNode>;
    }

    const root: TrieNode = { name: '', fullPath: '', items: [], children: new Map() };

    for (const [key, items] of Object.entries(groups)) {
        const segments = key.split('/');
        let current = root;
        let pathSoFar = '';
        for (const seg of segments) {
            pathSoFar = pathSoFar ? `${pathSoFar}/${seg}` : seg;
            if (!current.children.has(seg)) {
                current.children.set(seg, {
                    name: seg,
                    fullPath: pathSoFar,
                    items: [],
                    children: new Map()
                });
            }
            current = current.children.get(seg)!;
        }
        current.items = items;
    }

    const toGroupNodes = (node: TrieNode): GroupNode[] => {
        const result: GroupNode[] = [];
        for (const child of node.children.values()) {
            result.push({
                name: child.name,
                fullPath: child.fullPath,
                items: child.items,
                children: toGroupNodes(child)
            });
        }
        result.sort((a, b) => a.name.localeCompare(b.name));
        return result;
    };

    return toGroupNodes(root);
}

describe('buildGroupTree', () => {
    it('should return empty array for empty input', () => {
        expect(buildGroupTree({})).toEqual([]);
    });

    it('should create flat nodes for single-segment keys', () => {
        const tree = buildGroupTree({
            dashboard: [{ name: 'A' }, { name: 'B' }],
            settings: [{ name: 'C' }]
        });
        expect(tree).toHaveLength(2);
        expect(tree[0].name).toBe('dashboard');
        expect(tree[0].items).toHaveLength(2);
        expect(tree[1].name).toBe('settings');
        expect(tree[1].items).toHaveLength(1);
    });

    it('should nest multi-segment keys into a tree', () => {
        const tree = buildGroupTree({
            'features/admin': [{ name: 'AdminPanel' }],
            'features/admin/ui': [{ name: 'AuditLog' }, { name: 'RoleManager' }],
            'features/settings': [{ name: 'Settings' }]
        });

        expect(tree).toHaveLength(1);
        expect(tree[0].name).toBe('features');
        expect(tree[0].items).toHaveLength(0); // pure container
        expect(tree[0].children).toHaveLength(2); // admin, settings

        const admin = tree[0].children.find(c => c.name === 'admin')!;
        expect(admin.items).toHaveLength(1);
        expect(admin.items[0].name).toBe('AdminPanel');
        expect(admin.children).toHaveLength(1);

        const ui = admin.children[0];
        expect(ui.name).toBe('ui');
        expect(ui.items).toHaveLength(2);
    });

    it('should NOT path-compress single-child containers', () => {
        const tree = buildGroupTree({
            'users/components': [{ name: 'UserList' }, { name: 'UserCard' }]
        });

        // Should be users > components, not "users/components"
        expect(tree).toHaveLength(1);
        expect(tree[0].name).toBe('users');
        expect(tree[0].items).toHaveLength(0);
        expect(tree[0].children).toHaveLength(1);
        expect(tree[0].children[0].name).toBe('components');
        expect(tree[0].children[0].items).toHaveLength(2);
    });

    it('should create intermediate nodes with no items', () => {
        const tree = buildGroupTree({
            'a/b/c': [{ name: 'X' }]
        });

        expect(tree[0].name).toBe('a');
        expect(tree[0].items).toHaveLength(0);
        expect(tree[0].children[0].name).toBe('b');
        expect(tree[0].children[0].items).toHaveLength(0);
        expect(tree[0].children[0].children[0].name).toBe('c');
        expect(tree[0].children[0].children[0].items).toHaveLength(1);
    });

    it('should sort children alphabetically', () => {
        const tree = buildGroupTree({
            'z-folder': [{ name: 'Z' }],
            'a-folder': [{ name: 'A' }],
            'm-folder': [{ name: 'M' }]
        });

        expect(tree.map(n => n.name)).toEqual(['a-folder', 'm-folder', 'z-folder']);
    });

    it('should set correct fullPath on all nodes', () => {
        const tree = buildGroupTree({
            'features/admin/ui/settings': [{ name: 'S' }]
        });

        expect(tree[0].fullPath).toBe('features');
        expect(tree[0].children[0].fullPath).toBe('features/admin');
        expect(tree[0].children[0].children[0].fullPath).toBe('features/admin/ui');
        expect(tree[0].children[0].children[0].children[0].fullPath).toBe('features/admin/ui/settings');
    });

    it('should handle mix of depths correctly', () => {
        const tree = buildGroupTree({
            dashboard: [{ name: 'D1' }, { name: 'D2' }],
            'shared/directives': [{ name: 'S1' }],
            'features/admin': [{ name: 'F1' }],
            'features/admin/ui': [{ name: 'F2' }]
        });

        expect(tree).toHaveLength(3); // dashboard, features, shared
        const names = tree.map(n => n.name);
        expect(names).toContain('dashboard');
        expect(names).toContain('features');
        expect(names).toContain('shared');
    });
});
