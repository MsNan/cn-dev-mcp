import { DOCS, type DocEntry } from '../data/docs.js'
export function searchDocs(query: string, lib?: string, limit = 5) {
  const terms = query.toLowerCase().split(/[\s,，]+/).filter(Boolean)
  const scored = DOCS.filter((d) => !lib || d.lib === lib).map((d) => {
    let score = 0
    for (const t of terms) {
      if (d.id.toLowerCase().includes(t)) score += 5
      if (d.title.toLowerCase().includes(t)) score += 4
      if (d.keywords.some((k) => k.toLowerCase().includes(t) || t.includes(k.toLowerCase()))) score += 3
      if (d.summary.toLowerCase().includes(t)) score += 1
    }
    return { d, score }
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score)
  return { query, results: scored.slice(0, limit).map((x) => x.d), note: '摘要为社区整理，详细用法以官方文档链接为准' }
}
export function getDoc(id: string): DocEntry | undefined { return DOCS.find((d) => d.id === id) }
export const DOC_LIBS = ['uni-app', '微信小程序', 'Element Plus', 'Vant'] as const
