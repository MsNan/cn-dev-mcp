import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { dayInfo, yearSchedule, countWorkdays, addWorkdays } from './lib/holiday.js';
import { validateIdCard, validateUscc, validateMobile, validateBankCard } from './lib/validate.js';
import { regionLookup, REGION_META } from './lib/region.js';
import { toPinyin, solarToLunar, lunarToSolar } from './lib/text.js';
import { searchDocs, getDoc, DOC_LIBS } from './lib/docs.js';
export const VERSION = '0.1.0';
const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const wrap = (fn) => async (a) => {
    try {
        return ok(await fn(a));
    }
    catch (e) {
        return { isError: true, content: [{ type: 'text', text: '错误：' + (e?.message ?? String(e)) }] };
    }
};
const DATE = z.string().describe('日期，格式 YYYY-MM-DD');
export function createServer() {
    const s = new McpServer({ name: 'cn-dev-mcp', version: VERSION });
    s.registerTool('holiday_check', { title: '节假日/调休查询', description: '查询某天是法定节假日、调休上班日、周末还是工作日（内置国务院办公厅 2025、2026 年放假通知；2027 年尚未公布）', inputSchema: { date: DATE } }, wrap(({ date }) => dayInfo(date)));
    s.registerTool('holiday_year', { title: '全年放假安排', description: '列出某年全部法定节假日放假区间与调休上班日，附官方通知来源', inputSchema: { year: z.number().int().describe('年份，如 2026') } }, wrap(({ year }) => yearSchedule(year)));
    s.registerTool('workday_count', { title: '工作日天数统计', description: '统计两个日期之间（含首尾）的工作日与休息日天数，已考虑节假日与调休', inputSchema: { start: DATE, end: DATE } }, wrap(({ start, end }) => countWorkdays(start, end)));
    s.registerTool('workday_add', { title: '第 N 个工作日', description: '计算某日期之后（n 为负数则之前）的第 n 个工作日，常用于"3 个工作日内发货"之类的截止日期', inputSchema: { date: DATE, n: z.number().int().describe('工作日数，可为负') } }, wrap(({ date, n }) => addWorkdays(date, n)));
    s.registerTool('validate_id_card', { title: '身份证号格式校验', description: '校验中国大陆居民身份证号格式、出生日期与校验位，解析出生日期、性别、地区。仅做格式校验，不查询、不核验真实身份', inputSchema: { id: z.string().describe('15 或 18 位身份证号') } }, wrap(({ id }) => validateIdCard(id)));
    s.registerTool('validate_uscc', { title: '统一社会信用代码校验', description: '校验 18 位统一社会信用代码的字符集与校验位（GB 32100-2015），解析登记管理部门、机构类别与地区。不查询工商信息', inputSchema: { code: z.string() } }, wrap(({ code }) => validateUscc(code)));
    s.registerTool('validate_mobile', { title: '手机号格式校验', description: '校验中国大陆 11 位手机号格式（支持 +86、空格、横线），按号段推测运营商', inputSchema: { phone: z.string() } }, wrap(({ phone }) => validateMobile(phone)));
    s.registerTool('validate_bank_card', { title: '银行卡号校验', description: '校验银行卡号位数（12–19 位，支持空格/横线）与 Luhn 校验位，按前缀推测卡组织（银联/Visa/Mastercard/JCB/AmEx 等），返回脱敏卡号。不识别发卡行、不查询卡状态', inputSchema: { card: z.string().describe('银行卡号') } }, wrap(({ card }) => validateBankCard(card)));
    s.registerTool('pinyin', { title: '汉字转拼音', description: '把中文转换为拼音（带声调/数字声调/无声调）或首字母，自动处理常见多音字', inputSchema: { text: z.string(), tone: z.enum(['symbol', 'num', 'none']).optional().describe('symbol=带声调 num=数字声调 none=无声调，默认 symbol'), mode: z.enum(['full', 'initial']).optional().describe('full=全拼 initial=首字母') } }, wrap(({ text, tone, mode }) => toPinyin(text, tone, mode)));
    s.registerTool('solar_to_lunar', { title: '公历转农历', description: '公历转农历，返回农历日期、干支、生肖、节气、节日（1900–2100）', inputSchema: { date: DATE } }, wrap(({ date }) => solarToLunar(date)));
    s.registerTool('lunar_to_solar', { title: '农历转公历', description: '农历转公历，如农历 2026 年八月十五 → 公历日期（1900–2100）', inputSchema: { year: z.number().int(), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(30), isLeapMonth: z.boolean().optional().describe('是否闰月') } }, wrap(({ year, month, day, isLeapMonth }) => lunarToSolar(year, month, day, isLeapMonth)));
    s.registerTool('region_lookup', { title: '行政区划代码查询', description: `按代码（2/4/6 位，或 12 位取前 6 位）或名称查询省市县行政区划。覆盖：${REGION_META.coverage}；来源：${REGION_META.source}`, inputSchema: { query: z.string().describe('代码如 330106，或名称如 西湖区'), limit: z.number().int().min(1).max(100).optional() } }, wrap(({ query, limit }) => regionLookup(query, limit)));
    s.registerTool('dev_docs_search', { title: '前端文档速查', description: '离线检索 uni-app / 微信小程序 / Element Plus / Vant 常用 API 要点摘要，每条附官方文档链接', inputSchema: { query: z.string().describe('关键词，如 "分包" "401 登录拦截" "表单校验"'), lib: z.enum(DOC_LIBS).optional(), limit: z.number().int().min(1).max(20).optional() } }, wrap(({ query, lib, limit }) => searchDocs(query, lib, limit)));
    s.registerTool('dev_docs_get', { title: '读取文档条目', description: '按 id 读取一条文档摘要（id 来自 dev_docs_search）', inputSchema: { id: z.string() } }, wrap(({ id }) => getDoc(id) ?? { error: `未找到 ${id}` }));
    return s;
}
