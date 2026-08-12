/**
 * 时间工具 - 所有获取"当前时间"的地方都应使用此工具函数
 * 使用系统真实时间，保证各页面日期与"今天"一致
 */

/** 获取"当前时间" */
export function getNow(): Date {
  return new Date()
}

/** 获取"今天 00:00:00" */
export function getTodayStart(): Date {
  const d = getNow()
  d.setHours(0, 0, 0, 0)
  return d
}

/** 获取"当前时间戳" */
export function getNowTimestamp(): number {
  return Date.now()
}

/** 判断一个日期是否等于"今天" */
export function isVirtualToday(date: Date): boolean {
  const t = getTodayStart()
  return date.getFullYear() === t.getFullYear()
    && date.getMonth() === t.getMonth()
    && date.getDate() === t.getDate()
}

/** 获取本周的周一 */
export function getVirtualMonday(): Date {
  const d = getTodayStart()
  const day = d.getDay() // 0=周日, 1=周一 ...
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d
}

/**
 * 根据日期推导所属学期
 * - 2~7 月 → 该年春季学期
 * - 8~12 月 → 该年秋季学期
 * - 1 月 → 上一年秋季学期
 */
export function getSemesterOf(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const m = d.getMonth() + 1
  const y = d.getFullYear()
  if (m >= 2 && m <= 7) return `${y}春季学期`
  if (m >= 8) return `${y}秋季学期`
  return `${y - 1}秋季学期`
}
