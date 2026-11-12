import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dayInfo, yearSchedule, countWorkdays, addWorkdays } from '../dist/lib/holiday.js'
import { validateIdCard, validateUscc, validateMobile, validateBankCard, identifyExpressNo, luhnCheck } from '../dist/lib/validate.js'
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
  assert.equal(dayInfo('2026-10-05').type, '放假调休')
  assert.equal(dayInfo('2026-10-05').statutory, false)
  assert.equal(dayInfo('2026-02-16').statutory, true)
  assert.equal(dayInfo('2027-02-08').type, '法定节假日')
  assert.equal(dayInfo('2027-01-31').type, '调休上班')
  assert.match(dayInfo('2028-03-01').note, /尚未公布/)
  assert.throws(() => dayInfo('2026-02-30'))
})
test('全年安排', () => {
  const y = yearSchedule(2026)
  assert.equal(y.holidays.length, 7)
  assert.equal(y.holidays.find((h) => h.name === '春节').days, 9)
  assert.equal(yearSchedule(2027).available, true)
  assert.equal(yearSchedule(2028).available, false)
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
  // 15 位一代证也要检查省级代码（00 不是任何省份）
  assert.equal(validateIdCard('110105491231002').valid, true)
  assert.equal(validateIdCard('000105491231002').valid, false)
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
  // 不存在的日期要报错，不能被悄悄换算成别的日子
  assert.throws(() => solarToLunar('2024-02-30'), /无效日期/)
  assert.throws(() => solarToLunar('2023-04-31'), /无效日期/)
  assert.equal(solarToLunar('2024-02-29').solar, '2024-02-29')
  assert.throws(() => lunarToSolar(2024, 1, 30), /只有 29 天/)
})
test('文档检索', () => {
  assert.equal(searchDocs('分包').results[0].lib === 'uni-app' || searchDocs('分包').results[0].lib === '微信小程序', true)
  assert.ok(searchDocs('表单 校验', 'Element Plus').results.some((d) => d.id === 'el-form'))
  assert.ok(getDoc('uni.request').url.startsWith('https://'))
})

test('银行卡号：Luhn 与卡组织', () => {
  const r = validateBankCard('4111 1111 1111 1111')
  assert.equal(r.valid, true)
  assert.equal(r.brandByPrefix, 'Visa')
  assert.equal(r.masked, '411111******1111')
  assert.equal(validateBankCard('4111-1111-1111-1112').valid, false)
  assert.equal(validateBankCard('5555555555554444').brandByPrefix, 'Mastercard')
  assert.equal(validateBankCard('2223003122003222').brandByPrefix, 'Mastercard')
  assert.equal(validateBankCard('378282246310005').brandByPrefix, 'American Express')
  assert.equal(validateBankCard('3530111333300000').brandByPrefix, 'JCB')
  // 构造一个通过 Luhn 的 19 位 62 开头卡号
  const base = '622202100012345678'
  const check = [...'0123456789'].find((d) => luhnCheck(base + d))
  const u = validateBankCard(base + check)
  assert.equal(u.valid, true)
  assert.equal(u.brandByPrefix, '银联 UnionPay')
  assert.equal(validateBankCard('6222 0210 abc').valid, false)
  assert.equal(validateBankCard('41111111111').valid, false)
  assert.equal(validateBankCard('41111111111111111111').valid, false)
  assert.equal(luhnCheck('79927398713'), true)
  assert.equal(luhnCheck('79927398710'), false)
})


test('快递单号：高可靠度前缀；纯数字不猜测', () => {
  const sf = identifyExpressNo('SF 1023 4567 8912')
  assert.equal(sf.valid, true)
  assert.equal(sf.carrier, '顺丰速运')
  assert.equal(sf.code, 'sf')
  assert.equal(sf.confidence, 'high')
  assert.equal(sf.normalized, 'SF102345678912')

  assert.equal(identifyExpressNo('YT7500001234567').carrier, '圆通速递')
  assert.equal(identifyExpressNo('JT3300012345678').carrier, '极兔速递')
  assert.equal(identifyExpressNo('JDVA00123456789').carrier, '京东物流')
  assert.equal(identifyExpressNo('zto123456789012').carrier, '中通快递')
  assert.equal(identifyExpressNo('STO9876543210').carrier, '申通快递')
  assert.equal(identifyExpressNo('YD4310001234567').carrier, '韵达速递')
  assert.equal(identifyExpressNo('DPK0001234567').carrier, '德邦快递')
  assert.equal(identifyExpressNo('CGD0000123456').carrier, '菜鸟国际')
  assert.equal(identifyExpressNo('EA123456789CN').carrier, '邮政/EMS（万国邮联）')
  assert.equal(identifyExpressNo('SF1234567890US').carrier, '顺丰速运（国际）')

  const digits = identifyExpressNo('758123456789')
  assert.equal(digits.valid, true)
  assert.equal(digits.confidence, 'none')
  assert.deepEqual(digits.matches, [])
  assert.match(digits.note, /不猜测|手动选择/)

  assert.equal(identifyExpressNo('').valid, false)
  assert.equal(identifyExpressNo('SF@@@').valid, false)
  assert.equal(identifyExpressNo('AB').valid, false)
  // 未知字母前缀：不硬报错，但无匹配
  const unk = identifyExpressNo('XYZ1234567890')
  assert.equal(unk.valid, true)
  assert.equal(unk.confidence, 'none')
  assert.deepEqual(unk.matches, [])
})

test('节假日数据自检：每年 13 个法定日都在放假区间里，调休上班都是周末，不与放假重叠', async () => {
  const { HOLIDAYS } = await import('../dist/data/holidays.js')
  const { createRequire } = await import('node:module')
  const { Lunar } = createRequire(import.meta.url)('lunar-javascript')
  for (const [y, d] of Object.entries(HOLIDAYS)) {
    const cny = Lunar.fromYmd(+y, 1, 1).getSolar()
    const expect = [`${y}-01-01`, cny.next(-1).toYmd(), cny.toYmd(), cny.next(1).toYmd(), cny.next(2).toYmd(),
      Lunar.fromYmd(+y, 1, 1).getJieQiTable()['清明'].toYmd(), `${y}-05-01`, `${y}-05-02`,
      Lunar.fromYmd(+y, 5, 5).getSolar().toYmd(), Lunar.fromYmd(+y, 8, 15).getSolar().toYmd(), `${y}-10-01`, `${y}-10-02`, `${y}-10-03`].sort()
    assert.deepEqual([...d.statutory].sort(), expect, `${y} statutory`)
    const off = new Set()
    for (const h of d.holidays) for (let t = Date.parse(h.start + 'T00:00:00Z'); t <= Date.parse(h.end + 'T00:00:00Z'); t += 864e5) off.add(new Date(t).toISOString().slice(0, 10))
    for (const s of d.statutory) assert.ok(off.has(s), `${y} ${s} 不在放假区间`)
    for (const w of d.workdays) {
      assert.ok([0, 6].includes(new Date(w + 'T00:00:00Z').getUTCDay()), `${w} 不是周末`)
      assert.ok(!off.has(w), `${w} 与放假重叠`)
    }
  }
})
