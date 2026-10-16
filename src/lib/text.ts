import { pinyin } from 'pinyin-pro'
// @ts-ignore 无类型声明
import lunarPkg from 'lunar-javascript'
const { Solar, Lunar } = lunarPkg as any

export function toPinyin(text: string, tone: 'symbol' | 'num' | 'none' = 'symbol', mode: 'full' | 'initial' = 'full') {
  if (text.length > 5000) throw new Error('文本过长（上限 5000 字）')
  if (mode === 'initial') return { text, initials: pinyin(text, { pattern: 'first', toneType: 'none', type: 'array', nonZh: 'consecutive' }).join('') }
  const arr = pinyin(text, { toneType: tone, type: 'array', nonZh: 'consecutive' })
  return { text, pinyin: arr.join(' '), array: arr }
}

function pad(n: number) { return String(n).padStart(2, '0') }
function describe(l: any) {
  const s = l.getSolar()
  const mon = l.getMonth()
  return {
    solar: `${s.getYear()}-${pad(s.getMonth())}-${pad(s.getDay())}`,
    weekday: '周' + s.getWeekInChinese(),
    lunar: { year: l.getYear(), month: Math.abs(mon), day: l.getDay(), isLeapMonth: mon < 0, text: `${l.getYearInChinese()}年${l.getMonthInChinese()}月${l.getDayInChinese()}` },
    ganzhi: `${l.getYearInGanZhi()}年 ${l.getMonthInGanZhi()}月 ${l.getDayInGanZhi()}日`,
    zodiac: l.getYearShengXiao(),
    jieqi: l.getJieQi() || null,
    festivals: [...l.getFestivals(), ...s.getFestivals()],
  }
}
export function solarToLunar(date: string) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date.trim())
  if (!m) throw new Error('日期格式应为 YYYY-MM-DD')
  const [y, mo, d] = [+m[1], +m[2], +m[3]]
  if (y < 1900 || y > 2100) throw new Error('支持 1900–2100 年')
  const s = Solar.fromYmd(y, mo, d)
  if (s.getMonth() !== mo || s.getDay() !== d) throw new Error('无效日期')
  return describe(s.getLunar())
}
export function lunarToSolar(year: number, month: number, day: number, isLeapMonth = false) {
  if (year < 1900 || year > 2100) throw new Error('支持 1900–2100 年')
  if (isLeapMonth) {
    const leap = (lunarPkg as any).LunarYear.fromYear(year).getLeapMonth()
    if (leap !== month) throw new Error(leap ? `${year} 年闰月为闰${leap}月` : `${year} 年没有闰月`)
  }
  const l = Lunar.fromYmd(year, isLeapMonth ? -month : month, day)
  if (l.getDay() !== day) throw new Error('该农历日期不存在（小月没有三十）')
  return describe(l)
}
