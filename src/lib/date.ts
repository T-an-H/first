function getLocalNow(): Date {
  return new Date()
}

export function getNow(): Date {
  return getLocalNow()
}

export function getTodayStart(): Date {
  const date = getLocalNow()
  date.setHours(0, 0, 0, 0)
  return date
}

export function parseLocalDate(value?: string | null): Date | null {
  const normalized = String(value ?? '').trim()
  if (!normalized) return null

  const dateOnlyMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getNowTimestamp(): number {
  return getLocalNow().getTime()
}

export function isVirtualToday(date: Date): boolean {
  const today = getTodayStart()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

export function getVirtualMonday(): Date {
  const date = getTodayStart()
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  return date
}

export function getSemesterOf(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''

  const month = date.getMonth() + 1
  const year = date.getFullYear()

  if (month >= 2 && month <= 7) return `${year}春季学期`
  if (month >= 8) return `${year}秋季学期`
  return `${year - 1}秋季学期`
}
