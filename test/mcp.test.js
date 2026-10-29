// MCP 冒烟测试：用官方 SDK Client 通过 stdio 启动服务并调用每个工具
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

test('stdio 冒烟：列出并调用全部工具', async () => {
  const client = new Client({ name: 'smoke', version: '1.0.0' })
  await client.connect(new StdioClientTransport({ command: process.execPath, args: ['dist/index.js'], stderr: 'ignore' }))
  const { tools } = await client.listTools()
  const names = tools.map((t) => t.name).sort()
  assert.deepEqual(names, ['dev_docs_get', 'dev_docs_search', 'holiday_check', 'holiday_year', 'lunar_to_solar', 'pinyin', 'region_lookup', 'solar_to_lunar', 'validate_bank_card', 'validate_id_card', 'validate_mobile', 'validate_uscc', 'workday_add', 'workday_count'])
  const calls = {
    holiday_check: { date: '2026-10-01' }, holiday_year: { year: 2026 }, workday_count: { start: '2026-10-01', end: '2026-10-31' },
    workday_add: { date: '2026-09-30', n: 3 }, validate_id_card: { id: '11010519491231002X' }, validate_uscc: { code: '91350100M000100Y43' },
    validate_mobile: { phone: '13800138000' }, validate_bank_card: { card: '4111 1111 1111 1111' }, pinyin: { text: '涛哥' }, solar_to_lunar: { date: '2026-10-16' },
    lunar_to_solar: { year: 2026, month: 8, day: 15 }, region_lookup: { query: '杭州' }, dev_docs_search: { query: '登录' }, dev_docs_get: { id: 'el-form' },
  }
  for (const [name, args] of Object.entries(calls)) {
    const r = await client.callTool({ name, arguments: args })
    assert.ok(!r.isError, `${name} 报错: ${r.content?.[0]?.text}`)
    JSON.parse(r.content[0].text)
  }
  const bad = await client.callTool({ name: 'holiday_check', arguments: { date: '2026-13-01' } })
  assert.equal(bad.isError, true)
  await client.close()
})
