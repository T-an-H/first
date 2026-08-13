import type { Schedule } from '@/types'
import { parseLocalDate } from '@/lib/date'

export type ScheduleOccurrence = {
  schedule: Schedule
  start: Date
  end: Date
}

const weekdayMap: Record<string, number> = {
  '\u5468\u4e00': 0,
  '\u661f\u671f\u4e00': 0,
  '\u5468\u4e8c': 1,
  '\u661f\u671f\u4e8c': 1,
  '\u5468\u4e09': 2,
  '\u661f\u671f\u4e09': 2,
  '\u5468\u56db': 3,
  '\u661f\u671f\u56db': 3,
  '\u5468\u4e94': 4,
  '\u661f\u671f\u4e94': 4,
  '\u5468\u516d': 5,
  '\u661f\u671f\u516d': 5,
  '\u5468\u65e5': 6,
  '\u661f\u671f\u65e5': 6,
  '\u5468\u5929': 6,
  '\u661f\u671f\u5929': 6,
}

export function parseClockTime(value?: string): { hours: number; minutes: number } | null {
  const match = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return { hours, minutes }
}

export function applyClockTime(date: Date, value?: string): Date | null {
  const parsed = parseClockTime(value)
  if (!parsed) return null

  const result = new Date(date)
  result.setHours(parsed.hours, parsed.minutes, 0, 0)
  return result
}

export function normalizeDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function getMondayBasedWeekday(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

export function getWeekdayInSameWeek(anchor: Date, weekday: number): Date {
  const result = normalizeDay(anchor)
  result.setDate(result.getDate() - getMondayBasedWeekday(result) + weekday)
  return result
}

export function getScheduleDayOfWeek(schedule: Schedule): number | null {
  const label = String(schedule.day ?? '').trim()
  if (label && label in weekdayMap) return weekdayMap[label]

  const startDate = parseLocalDate(schedule.startDate)
  return startDate ? getMondayBasedWeekday(startDate) : null
}

/**
 * Expand one backend schedule into concrete class occurrences.
 *
 * startDate/endDate are treated as the first and last week boundaries when
 * an explicit weekday is provided. This matches the admin scheduling form.
 */
export function buildScheduleOccurrences(schedule: Schedule): ScheduleOccurrence[] {
  const startBoundary = parseLocalDate(schedule.startDate)
  const endBoundary = parseLocalDate(schedule.endDate) ?? startBoundary
  const [startTime = '', endTime = ''] = String(schedule.timeSlot ?? '')
    .split('-')
    .map((part) => part.trim())

  if (!startBoundary || !endBoundary || !startTime || !endTime) return []
  if (normalizeDay(endBoundary).getTime() < normalizeDay(startBoundary).getTime()) return []

  const weekday = getScheduleDayOfWeek(schedule)
  const dates: Date[] = []

  if (String(schedule.day ?? '').trim() && weekday !== null) {
    const firstDate = getWeekdayInSameWeek(startBoundary, weekday)
    const lastDate = getWeekdayInSameWeek(endBoundary, weekday)
    if (firstDate.getTime() > lastDate.getTime()) return []

    for (
      const cursor = new Date(firstDate);
      cursor.getTime() <= lastDate.getTime();
      cursor.setDate(cursor.getDate() + 7)
    ) {
      dates.push(new Date(cursor))
    }
  } else {
    dates.push(normalizeDay(startBoundary))
  }

  return dates
    .map((date) => {
      const start = applyClockTime(date, startTime)
      const end = applyClockTime(date, endTime)
      if (!start || !end) return null
      if (end.getTime() < start.getTime()) end.setDate(end.getDate() + 1)
      return { schedule, start, end }
    })
    .filter((item): item is ScheduleOccurrence => item !== null)
}

export function buildCourseScheduleOccurrences(
  schedules: Schedule[],
  courseId: string,
  className = '',
): ScheduleOccurrence[] {
  const normalizedClassName = String(className).trim()
  const courseSchedules = schedules.filter((schedule) => schedule.courseId === courseId)
  const sourceSchedules = normalizedClassName
    ? (() => {
        const exact = courseSchedules.filter(
          (schedule) => String(schedule.className ?? '').trim() === normalizedClassName,
        )
        if (exact.length > 0) return exact
        return courseSchedules.filter((schedule) => !String(schedule.className ?? '').trim())
      })()
    : courseSchedules

  const occurrences: ScheduleOccurrence[] = []
  const seen = new Set<string>()

  for (const schedule of sourceSchedules) {
    for (const occurrence of buildScheduleOccurrences(schedule)) {
      const key = `${schedule.id}::${occurrence.start.getTime()}::${occurrence.end.getTime()}`
      if (seen.has(key)) continue
      seen.add(key)
      occurrences.push(occurrence)
    }
  }

  return occurrences.sort((left, right) => left.start.getTime() - right.start.getTime())
}
