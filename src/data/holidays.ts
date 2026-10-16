// 数据来源：国务院办公厅每年发布的《关于 X 年部分节假日安排的通知》
export interface HolidayRange { name: string; start: string; end: string }
export interface YearData { notice: string; url: string; holidays: HolidayRange[]; workdays: string[] }

export const HOLIDAYS: Record<number, YearData> = {
  2025: {
    notice: '国务院办公厅关于2025年部分节假日安排的通知（国办发明电〔2024〕12号）',
    url: 'https://www.gov.cn/zhengce/content/202411/content_6986382.htm',
    holidays: [
      { name: '元旦', start: '2025-01-01', end: '2025-01-01' },
      { name: '春节', start: '2025-01-28', end: '2025-02-04' },
      { name: '清明节', start: '2025-04-04', end: '2025-04-06' },
      { name: '劳动节', start: '2025-05-01', end: '2025-05-05' },
      { name: '端午节', start: '2025-05-31', end: '2025-06-02' },
      { name: '国庆节、中秋节', start: '2025-10-01', end: '2025-10-08' },
    ],
    workdays: ['2025-01-26', '2025-02-08', '2025-04-27', '2025-09-28', '2025-10-11'],
  },
  2026: {
    notice: '国务院办公厅关于2026年部分节假日安排的通知（国办发明电〔2025〕7号）',
    url: 'https://www.gov.cn/zhengce/content/202511/content_7047090.htm',
    holidays: [
      { name: '元旦', start: '2026-01-01', end: '2026-01-03' },
      { name: '春节', start: '2026-02-15', end: '2026-02-23' },
      { name: '清明节', start: '2026-04-04', end: '2026-04-06' },
      { name: '劳动节', start: '2026-05-01', end: '2026-05-05' },
      { name: '端午节', start: '2026-06-19', end: '2026-06-21' },
      { name: '中秋节', start: '2026-09-25', end: '2026-09-27' },
      { name: '国庆节', start: '2026-10-01', end: '2026-10-07' },
    ],
    workdays: ['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'],
  },
}
// 2027 年安排截至 2026-10-16 尚未由国务院办公厅公布（通常在前一年 10 月底至 12 月初发布）。
export const PENDING_YEARS = [2027]
