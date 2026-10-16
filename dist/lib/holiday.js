import { HOLIDAYS, PENDING_YEARS } from '../data/holidays.js';
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export function parseDate(s) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
    if (!m)
        throw new Error(`日期格式应为 YYYY-MM-DD：${s}`);
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3])
        throw new Error(`无效日期：${s}`);
    return d;
}
export const fmt = (d) => d.toISOString().slice(0, 10);
const index = new Map();
const workSet = new Set();
for (const y of Object.values(HOLIDAYS)) {
    for (const h of y.holidays)
        for (let d = parseDate(h.start); fmt(d) <= h.end; d = new Date(d.getTime() + 864e5))
            index.set(fmt(d), h.name);
    y.workdays.forEach((w) => workSet.add(w));
}
export function yearNote(year) {
    if (HOLIDAYS[year])
        return undefined;
    if (PENDING_YEARS.includes(year))
        return `${year} 年放假安排国务院办公厅尚未公布，以下仅按周末计算，请以 gov.cn 正式通知为准`;
    return `未内置 ${year} 年节假日数据（支持 ${Object.keys(HOLIDAYS).join('、')}），仅按周末计算`;
}
export function dayInfo(date) {
    const d = parseDate(date), key = fmt(d), year = d.getUTCFullYear();
    const wd = d.getUTCDay(), weekend = wd === 0 || wd === 6;
    const base = { date: key, weekday: WEEK[wd], dataAvailable: !!HOLIDAYS[year], note: yearNote(year) };
    if (index.has(key))
        return { ...base, type: '法定节假日', isWorkday: false, holiday: index.get(key) };
    if (workSet.has(key))
        return { ...base, type: '调休上班', isWorkday: true };
    return weekend ? { ...base, type: '周末', isWorkday: false } : { ...base, type: '工作日', isWorkday: true };
}
export function yearSchedule(year) {
    const y = HOLIDAYS[year];
    if (!y)
        return { year, available: false, note: yearNote(year) };
    return { year, available: true, notice: y.notice, source: y.url, holidays: y.holidays.map((h) => ({ ...h, days: (parseDate(h.end).getTime() - parseDate(h.start).getTime()) / 864e5 + 1 })), workdays: y.workdays };
}
/** 统计 [start, end] 闭区间内的工作日 */
export function countWorkdays(start, end) {
    let a = parseDate(start), b = parseDate(end);
    if (a > b)
        [a, b] = [b, a];
    if ((b.getTime() - a.getTime()) / 864e5 > 3660)
        throw new Error('区间不能超过 10 年');
    let work = 0, total = 0;
    const notes = new Set();
    for (let d = a; d <= b; d = new Date(d.getTime() + 864e5)) {
        const i = dayInfo(fmt(d));
        total++;
        if (i.isWorkday)
            work++;
        if (i.note)
            notes.add(i.note);
    }
    return { start: fmt(a), end: fmt(b), totalDays: total, workdays: work, restDays: total - work, notes: [...notes] };
}
/** 从 date 起往后（n<0 往前）第 n 个工作日，不含当天 */
export function addWorkdays(date, n) {
    if (!Number.isInteger(n) || Math.abs(n) > 2000)
        throw new Error('n 必须是绝对值不超过 2000 的整数');
    let d = parseDate(date);
    const step = n >= 0 ? 1 : -1;
    let left = Math.abs(n);
    const notes = new Set();
    while (left > 0) {
        d = new Date(d.getTime() + step * 864e5);
        const i = dayInfo(fmt(d));
        if (i.note)
            notes.add(i.note);
        if (i.isWorkday)
            left--;
    }
    return { from: date, n, result: fmt(d), weekday: WEEK[d.getUTCDay()], notes: [...notes] };
}
