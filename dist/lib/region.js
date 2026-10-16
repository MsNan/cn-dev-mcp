import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const DATA = require('../data/pca-code.json');
const MAP = new Map();
function walk(nodes, level, parent) {
    const lv = ['省', '市', '县区'][level];
    for (const n of nodes) {
        const full = parent ? (parent.name === n.name ? parent.fullName : `${parent.fullName}${['市辖区', '县'].includes(n.name) ? '' : n.name}`) : n.name;
        const r = { code: n.code, name: n.name, level: lv, fullName: full, parentCode: parent?.code };
        MAP.set(n.code, r);
        if (n.children)
            walk(n.children, level + 1, r);
    }
}
walk(DATA, 0);
export function regionName(code) { return MAP.get(code)?.fullName; }
export function regionLookup(query, limit = 20) {
    const q = query.trim();
    if (/^\d+$/.test(q)) {
        let code = q;
        if (code.length === 12)
            code = code.slice(0, 6);
        const exact = MAP.get(code) ?? (code.length === 6 ? MAP.get(code.slice(0, 4)) ?? MAP.get(code.slice(0, 2)) : undefined);
        const children = [...MAP.values()].filter((r) => r.parentCode === code).slice(0, 100);
        return { query: q, match: exact ?? null, children: children.map(({ code, name }) => ({ code, name })) };
    }
    const results = [...MAP.values()].filter((r) => r.name.includes(q) || r.fullName.includes(q)).sort((a, b) => a.name.length - b.name.length).slice(0, limit);
    return { query: q, results };
}
export const REGION_META = { source: 'modood/Administrative-divisions-of-China（数据源自国家统计局 / 民政部公开数据）', coverage: '31 个省级行政区（不含港澳台）的省、市、县三级', total: MAP.size };
