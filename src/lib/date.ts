/**
 * 虚拟时间工具 - 使整个前端以 2026-07-27 为"今天"
 * 所有获取"当前时间"的地方都应使用此工具函数
 */
export const VIRTUAL_DATE_STR = '2026-07-27'

/** 虚拟"现在"时间戳 (2026-07-27 08:00 CST) */
const VIRTUAL_NOW = new Date('2026-07-27T08:00:00+08:00')

/** 获取虚拟的"当前时间" */
export function getNow(): Date {
  return new Date(VIRTUAL_NOW.getTime())
}

/** 获取虚拟的"今天 00:00:00" */
export function getTodayStart(): Date {
  const d = getNow()
  d.setHours(0, 0, 0, 0)
  return d
}

/** 获取虚拟的"当前时间戳" */
export function getNowTimestamp(): number {
  return VIRTUAL_NOW.getTime()
}

/** 判断一个日期是否等于虚拟的"今天" */
export function isVirtualToday(date: Date): boolean {
  const t = getTodayStart()
  return date.getFullYear() === t.getFullYear()
    && date.getMonth() === t.getMonth()
    && date.getDate() === t.getDate()
}

/** 获取虚拟本周的周一 */
export function getVirtualMonday(): Date {
  const d = getTodayStart()
  const day = d.getDay() // 0=周日, 1=周一 ...
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d
}
