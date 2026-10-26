import { regionName } from './region.js'

const ID_W = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const ID_C = '10X98765432'
export interface Result { valid: boolean; errors: string[]; [k: string]: unknown }

function checkBirth(y: number, m: number, d: number, errors: string[]) {
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) errors.push('出生日期无效')
  else if (dt.getTime() > Date.now()) errors.push('出生日期晚于今天')
  else if (y < 1900) errors.push('出生年份早于 1900')
}

/** 仅做格式与校验位校验，不查询、不判断该证件是否真实存在 */
export function validateIdCard(input: string): Result {
  const s = input.trim().toUpperCase(), errors: string[] = []
  if (/^\d{15}$/.test(s)) {
    const y = 1900 + +s.slice(6, 8), m = +s.slice(8, 10), d = +s.slice(10, 12)
    if (!regionName(s.slice(0, 2))) errors.push('前两位不是有效的省级行政区划代码')
    checkBirth(y, m, d, errors)
    return { valid: !errors.length, errors, version: '15 位（一代）', birthday: `${y}-${s.slice(8, 10)}-${s.slice(10, 12)}`, gender: +s[14] % 2 ? '男' : '女', region: regionName(s.slice(0, 6)) }
  }
  if (!/^\d{17}[\dX]$/.test(s)) return { valid: false, errors: ['应为 18 位：17 位数字 + 1 位数字或 X'] }
  if (!regionName(s.slice(0, 2))) errors.push('前两位不是有效的省级行政区划代码')
  const y = +s.slice(6, 10), m = +s.slice(10, 12), d = +s.slice(12, 14)
  checkBirth(y, m, d, errors)
  const sum = ID_W.reduce((acc, w, i) => acc + w * +s[i], 0)
  const expect = ID_C[sum % 11]
  if (expect !== s[17]) errors.push(`校验位错误，应为 ${expect}`)
  return { valid: !errors.length, errors, version: '18 位（二代）', birthday: `${y}-${s.slice(10, 12)}-${s.slice(12, 14)}`, gender: +s[16] % 2 ? '男' : '女', region: regionName(s.slice(0, 6)) ?? regionName(s.slice(0, 4)) ?? regionName(s.slice(0, 2)), note: '仅校验格式与校验位，不代表证件真实有效' }
}

const USCC_CHARS = '0123456789ABCDEFGHJKLMNPQRTUWXY'
const USCC_W = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28]
const DEPT: Record<string, string> = { '1': '机构编制', '2': '外交', '3': '司法行政', '4': '文化', '5': '民政', '6': '旅游', '7': '宗教', '8': '工会', '9': '工商（市场监管）', A: '中央军委改革和编制办公室', N: '农业', Y: '其他' }
const ORG: Record<string, string> = { '91': '企业', '92': '个体工商户', '93': '农民专业合作社', '11': '机关', '12': '事业单位', '13': '中央编办直接管理机构编制的群众团体', '19': '其他（机构编制）', '51': '社会团体', '52': '民办非企业单位', '53': '基金会', '59': '其他（民政）' }

export function validateUscc(input: string): Result {
  const s = input.trim().toUpperCase(), errors: string[] = []
  if (s.length !== 18) return { valid: false, errors: ['统一社会信用代码应为 18 位'] }
  const bad = [...s].filter((c) => !USCC_CHARS.includes(c))
  if (bad.length) return { valid: false, errors: [`包含非法字符：${[...new Set(bad)].join('')}（不使用 I、O、Z、S、V）`] }
  if (!/^\d{6}$/.test(s.slice(2, 8))) errors.push('第 3–8 位应为数字行政区划码')
  const sum = USCC_W.reduce((acc, w, i) => acc + w * USCC_CHARS.indexOf(s[i]), 0)
  const expect = USCC_CHARS[(31 - (sum % 31)) % 31]
  if (expect !== s[17]) errors.push(`校验位错误，应为 ${expect}`)
  return { valid: !errors.length, errors, registrationDept: DEPT[s[0]] ?? '未知', orgType: ORG[s.slice(0, 2)] ?? '未知', region: regionName(s.slice(2, 8)) ?? regionName(s.slice(2, 4)), note: '仅校验格式与校验位，不查询工商登记信息' }
}

const CARRIER: [RegExp, string][] = [
  [/^1(34[0-8]|3[5-9]|4[78]|5[0-27-9]|7[28]|8[2-478]|9[578])/, '中国移动'],
  [/^1(3[0-2]|4[56]|5[56]|6[67]|7[156]|8[56]|96)/, '中国联通'],
  [/^1(33|349|49|53|7[37]|8[019]|9[0139])/, '中国电信'],
  [/^192/, '中国广电'],
  [/^170|^171/, '虚拟运营商'],
]
export function validateMobile(input: string): Result {
  const s = input.replace(/[\s-]/g, '').replace(/^(\+?86)/, '')
  if (!/^1[3-9]\d{9}$/.test(s)) return { valid: false, errors: ['中国大陆手机号应为 11 位，以 13–19 开头'] }
  const carrier = CARRIER.find(([re]) => re.test(s))?.[1] ?? '未知（号段可能已携号转网）'
  return { valid: true, errors: [], normalized: s, carrierBySegment: carrier, note: '仅校验格式；运营商按号段推测，携号转网后可能不准确' }
}
