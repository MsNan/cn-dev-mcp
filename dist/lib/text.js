import { pinyin } from 'pinyin-pro';
// @ts-ignore 无类型声明
import lunarPkg from 'lunar-javascript';
const { Solar, Lunar, LunarMonth, SolarUtil } = lunarPkg;
export function toPinyin(text, tone = 'symbol', mode = 'full') {
    if (text.length > 5000)
        throw new Error('文本过长（上限 5000 字）');
    if (mode === 'initial')
        return { text, initials: pinyin(text, { pattern: 'first', toneType: 'none', type: 'array', nonZh: 'consecutive' }).join('') };
    const arr = pinyin(text, { toneType: tone, type: 'array', nonZh: 'consecutive' });
    return { text, pinyin: arr.join(' '), array: arr };
}
function pad(n) { return String(n).padStart(2, '0'); }
function describe(l) {
    const s = l.getSolar();
    const mon = l.getMonth();
    return {
        solar: `${s.getYear()}-${pad(s.getMonth())}-${pad(s.getDay())}`,
        weekday: '周' + s.getWeekInChinese(),
        lunar: { year: l.getYear(), month: Math.abs(mon), day: l.getDay(), isLeapMonth: mon < 0, text: `${l.getYearInChinese()}年${l.getMonthInChinese()}月${l.getDayInChinese()}` },
        ganzhi: `${l.getYearInGanZhi()}年 ${l.getMonthInGanZhi()}月 ${l.getDayInGanZhi()}日`,
        zodiac: l.getYearShengXiao(),
        jieqi: l.getJieQi() || null,
        festivals: [...l.getFestivals(), ...s.getFestivals()],
    };
}
export function solarToLunar(date) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date.trim());
    if (!m)
        throw new Error('日期格式应为 YYYY-MM-DD');
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    if (y < 1900 || y > 2100)
        throw new Error('支持 1900–2100 年');
    // lunar-javascript 只检查日在 1–31 之间，2 月 30 日、4 月 31 日不会报错，要自己按月份天数判断
    if (mo < 1 || mo > 12 || d < 1 || d > SolarUtil.getDaysOfMonth(y, mo))
        throw new Error('无效日期');
    const s = Solar.fromYmd(y, mo, d);
    return describe(s.getLunar());
}
export function lunarToSolar(year, month, day, isLeapMonth = false) {
    if (year < 1900 || year > 2100)
        throw new Error('支持 1900–2100 年');
    if (isLeapMonth) {
        const leap = lunarPkg.LunarYear.fromYear(year).getLeapMonth();
        if (leap !== month)
            throw new Error(leap ? `${year} 年闰月为闰${leap}月` : `${year} 年没有闰月`);
    }
    // 库对小月三十直接抛英文错误，先查当月天数，给出中文提示
    const days = LunarMonth.fromYm(year, isLeapMonth ? -month : month).getDayCount();
    if (day > days)
        throw new Error(`农历 ${year} 年${isLeapMonth ? '闰' : ''}${month}月只有 ${days} 天`);
    const l = Lunar.fromYmd(year, isLeapMonth ? -month : month, day);
    return describe(l);
}
