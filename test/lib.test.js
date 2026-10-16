import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dayInfo, yearSchedule, countWorkdays, addWorkdays } from '../dist/lib/holiday.js'
import { validateIdCard, validateUscc, validateMobile } from '../dist/lib/validate.js'
import { regionLookup } from '../dist/lib/region.js'
import { toPinyin, solarToLunar, lunarToSolar } from '../dist/lib/text.js'
import { searchDocs, getDoc } from '../dist/lib/docs.js'

test('节假日：法定假、调休、周末、工作日', () => {
  assert.equal(dayInfo('2026-10-01').type, '法定节假日')
  assert.equal(dayInfo('2026-10-01').holiday, '国庆节')
  assert.equal(dayInfo('2026-10-10').type, '调休上班')
  assert.equal(dayInfo('2026-02-14').isWorkday, true)
  assert.equal(dayInfo('2025-10-08').holiday, '国庆节、中秋节')
  assert.equal(dayInfo('2026-10-17').type, '周末')
  assert.equal(dayInfo('2026-10-16').type, '工作日')
  assert.match(dayInfo('2027-03-01').note, /尚未公布/)
  assert.throws(() => dayInfo('2026-02-30'))
})
test('全年安排', () => {
  const y = yearSchedule(2026)
  assert.equal(y.holidays.length, 7)
  assert.equal(y.holidays.find((h) => h.name === '春节').days, 9)
  assert.equal(yearSchedule(2027).available, false)
})
test('工作日计算', () => {
  // 2026-10-01..10-11：1–7 放假，8、9 工作日，10 调休上班，11 周日 → 3 个工作日
  assert.equal(countWorkdays('2026-10-01', '2026-10-11').workdays, 3)
  assert.equal(countWorkdays('2026-10-11', '2026-10-01').workdays, 3)
  assert.equal(addWorkdays('2026-09-30', 1).result, '2026-10-08')
  assert.equal(addWorkdays('2026-10-08', -1).result, '2026-09-30')
  assert.equal(addWorkdays('2026-10-16', 1).result, '2026-10-19')
})
test('身份证校验', () => {
  const r = validateIdCard('11010519491231002X')
  assert.equal(r.valid, true); assert.equal(r.gender, '女'); assert.equal(r.birthday, '1949-12-31'); assert.match(r.region, /北京/)
  assert.equal(validateIdCard('110105194912310021').valid, false)
  assert.equal(validateIdCard('110105194913310028').valid, false)
  assert.equal(validateIdCard('abc').valid, false)
})
test('统一社会信用代码校验', () => {
  assert.equal(validateUscc('91350100M000100Y43').valid, true)
  assert.equal(validateUscc('91350100M000100Y43').orgType, '企业')
  assert.equal(validateUscc('91350100M000100Y44').valid, false)
  assert.equal(validateUscc('91350100M000100YO3').valid, false)
})
test('手机号校验', () => {
  assert.equal(validateMobile('+86 138-0013-8000').valid, true)
  assert.equal(validateMobile('13800138000').carrierBySegment, '中国移动')
  assert.equal(validateMobile('18912345678').carrierBySegment, '中国电信')
  assert.equal(validateMobile('12345678901').valid, false)
})
test('行政区划', () => {
  assert.equal(regionLookup('330106').match.fullName, '浙江省杭州市西湖区')
  assert.ok(regionLookup('33').children.length >= 11)
  assert.ok(regionLookup('西湖区').results.some((r) => r.code === '330106'))
})
test('拼音', () => {
  assert.equal(toPinyin('重庆').pinyin, 'chóng qìng')
  assert.equal(toPinyin('银行', 'none').pinyin, 'yin hang')
  assert.equal(toPinyin('程序员项目库', 'none', 'initial').initials, 'cxyxmk')
})
test('农历', () => {
  const l = solarToLunar('2026-02-17')
  assert.equal(l.lunar.month, 1); assert.equal(l.lunar.day, 1); assert.equal(l.zodiac, '马')
  assert.equal(lunarToSolar(2026, 8, 15).solar, '2026-09-25')
  assert.equal(lunarToSolar(2027, 1, 1).solar, '2027-02-06')
  assert.throws(() => lunarToSolar(2026, 3, 1, true))
})
test('文档检索', () => {
  assert.equal(searchDocs('分包').results[0].lib === 'uni-app' || searchDocs('分包').results[0].lib === '微信小程序', true)
  assert.ok(searchDocs('表单 校验', 'Element Plus').results.some((d) => d.id === 'el-form'))
  assert.ok(getDoc('uni.request').url.startsWith('https://'))
})
