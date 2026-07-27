<template>
  <div id="student-schedule-root"></div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'
import { isVirtualToday, getVirtualMonday } from '@/lib/date'

const store = useAppStore()

// ---- 周导航 ----
const weekStart = ref(getVirtualMonday())

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  date.setHours(0, 0, 0, 0)
  return date
}

function fmtDate(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function isToday(d: Date): boolean {
  return isVirtualToday(d)
}

const weekDays = computed(() => {
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return { label: labels[i], date: d, dateStr: fmtDate(d), isToday: isToday(d) }
  })
})

const weekRange = computed(() => `${weekDays.value[0].dateStr} - ${weekDays.value[6].dateStr}`)

const weekNumber = computed(() => {
  const s = new Date(weekStart.value)
  const y = new Date(s.getFullYear(), 0, 1)
  return Math.ceil(((s.getTime() - y.getTime()) / 86400000 + y.getDay() + 1) / 7)
})

function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d; reRender() }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d; reRender() }
function todayFn() { weekStart.value = getVirtualMonday(); reRender() }

// ---- 学生课表数据 ----
const student = computed(() => store.students.find((s) => s.name === store.currentUser) ?? store.students[0])

const mySchedules = computed(() => {
  if (!student.value) return []
  const ids = store.enrollments.filter((e) => e.studentId === student.value.id).map((e) => e.courseId)
  return store.schedules.filter((s) => ids.includes(s.courseId))
})

// ---- 提取课程的周规律 ----
interface CoursePattern {
  dayOfWeek: number   // 0=周一, 6=周日
  timeSlot: string
  title: string
  teacher: string
  room: string
}

const coursePatterns = computed(() => {
  const map = new Map<string, CoursePattern[]>()
  mySchedules.value.forEach((s) => {
    const sd = new Date(s.startDate)
    const day = sd.getDay()
    const dow = day === 0 ? 6 : day - 1
    if (!map.has(s.courseId)) map.set(s.courseId, [])
    const list = map.get(s.courseId)!
    if (!list.some(p => p.dayOfWeek === dow && p.timeSlot === s.timeSlot)) {
      list.push({ dayOfWeek: dow, timeSlot: s.timeSlot, title: s.title, teacher: s.teacher, room: s.room })
    }
  })
  return map
})

// ---- 标准时间段 ----
interface ParsedSlot { key: string; label: string; periodLabel: string }

const STANDARD_SLOTS: ParsedSlot[] = [
  { key: '08:00', label: '08:00', periodLabel: '上午一' },
  { key: '09:00', label: '09:00', periodLabel: '上午二' },
  { key: '10:00', label: '10:00', periodLabel: '上午三' },
  { key: '11:00', label: '11:00', periodLabel: '上午四' },
  { key: '13:00', label: '13:00', periodLabel: '下午一' },
  { key: '14:00', label: '14:00', periodLabel: '下午二' },
  { key: '15:00', label: '15:00', periodLabel: '下午三' },
  { key: '16:00', label: '16:00', periodLabel: '下午四' },
  { key: '17:00', label: '17:00', periodLabel: '下午五' },
  { key: '19:00', label: '19:00', periodLabel: '晚课一' },
  { key: '20:00', label: '20:00', periodLabel: '晚课二' },
]

const timeSlots = computed(() => STANDARD_SLOTS)

// ---- 块状布局参数 ----
const HOUR_HEIGHT = 56
const SCHEDULE_START = 8
const SCHEDULE_END = 21

const totalHeight = computed(() => (SCHEDULE_END - SCHEDULE_START) * HOUR_HEIGHT)

// ---- 配色方案 ----
interface CourseColor {
  cellBg: string
  cardBg: string
  border: string
  text: string
}

const PALETTE: CourseColor[] = [
  { cellBg: '#e8f5e9', cardBg: '#4caf50', border: '#388e3c', text: '#ffffff' },
  { cellBg: '#e3f2fd', cardBg: '#2196f3', border: '#1565c0', text: '#ffffff' },
  { cellBg: '#fff3e0', cardBg: '#ff9800', border: '#e65100', text: '#ffffff' },
  { cellBg: '#fce4ec', cardBg: '#e91e63', border: '#c2185b', text: '#ffffff' },
  { cellBg: '#f3e5f5', cardBg: '#9c27b0', border: '#7b1fa2', text: '#ffffff' },
  { cellBg: '#e0f7fa', cardBg: '#00bcd4', border: '#00838f', text: '#ffffff' },
  { cellBg: '#fffde7', cardBg: '#ffc107', border: '#ff8f00', text: '#ffffff' },
  { cellBg: '#fbe9e7', cardBg: '#ff5722', border: '#bf360c', text: '#ffffff' },
  { cellBg: '#e8eaf6', cardBg: '#3f51b5', border: '#1a237e', text: '#ffffff' },
  { cellBg: '#e0f2f1', cardBg: '#009688', border: '#004d40', text: '#ffffff' },
  { cellBg: '#f1f8e9', cardBg: '#8bc34a', border: '#558b2f', text: '#ffffff' },
  { cellBg: '#ede7f6', cardBg: '#673ab7', border: '#4527a0', text: '#ffffff' },
]

const courseColorMap = computed(() => {
  const map = new Map<string, CourseColor>()
  const ids = Array.from(coursePatterns.value.keys())
  ids.forEach((id, i) => map.set(id, PALETTE[i % PALETTE.length]))
  return map
})

function getCourseColor(courseId: string): CourseColor {
  return courseColorMap.value.get(courseId) ?? PALETTE[0]
}

// ---- 课程卡片 ----
interface CardItem extends CourseColor {
  id: string
  courseName: string
  teacher: string
  room: string
  timeSlot: string
}

/** 解析时间段 "09:00-11:00" 或 "09:00-10:30" */
function parseTimeSlotToRange(timeSlot: string): { start: number; end: number; startMin: number; endMin: number } | null {
  const parts = timeSlot.split('-')
  if (parts.length !== 2) return null
  const startParts = parts[0].split(':')
  const endParts = parts[1].split(':')
  return {
    start: parseInt(startParts[0], 10),
    end: parseInt(endParts[0], 10),
    startMin: parseInt(startParts[1] || '0', 10),
    endMin: parseInt(endParts[1] || '0', 10),
  }
}

/** 获取某天的所有课程卡片（去重） */
function getDayCourseCards(day: Date): CardItem[] {
  const dayOfWeek = day.getDay() === 0 ? 6 : day.getDay() - 1
  const result: CardItem[] = []
  const added = new Set<string>()
  coursePatterns.value.forEach((patterns, courseId) => {
    for (const p of patterns) {
      if (p.dayOfWeek === dayOfWeek && !added.has(courseId)) {
        added.add(courseId)
        const c = getCourseColor(courseId)
        result.push({
          id: `${courseId}-${p.dayOfWeek}`,
          courseName: p.title,
          teacher: p.teacher,
          room: p.room,
          timeSlot: p.timeSlot,
          ...c,
        })
      }
    }
  })
  return result
}

/** 获取标准时间标签在时间轴上的 top (px) */
function getTimeLabelTop(slotKey: string): number {
  const hour = parseInt(slotKey.split(':')[0], 10)
  return (hour - SCHEDULE_START) * HOUR_HEIGHT
}

/** 获取课程块在列中的 top (px)，精确到分钟 */
function getBlockTop(timeSlot: string): number {
  const r = parseTimeSlotToRange(timeSlot)
  if (!r) return 0
  const totalMin = (r.start - SCHEDULE_START) * 60 + r.startMin
  return totalMin / 60 * HOUR_HEIGHT
}

/** 获取课程块的高度 (px)，精确到分钟 */
function getBlockHeight(timeSlot: string): number {
  const r = parseTimeSlotToRange(timeSlot)
  if (!r) return 0
  const durationMin = (r.end - r.start) * 60 + (r.endMin - r.startMin)
  return Math.max(durationMin / 60 * HOUR_HEIGHT, 24)
}

// ---- 图例 ----
const courseColorsMap = computed(() => {
  const map = new Map<string, { label: string; cardBg: string; border: string; text: string }>()
  coursePatterns.value.forEach((patterns, courseId) => {
    if (!map.has(courseId)) {
      const c = getCourseColor(courseId)
      map.set(courseId, { label: patterns[0]?.title || '', cardBg: c.cardBg, border: c.border, text: c.text })
    }
  })
  return Array.from(map.values())
})

// ---- D3 渲染（块状布局） ----
function reRender() {
  const el = document.getElementById('student-schedule-root')
  if (el) renderSchedule(el)
}

function renderSchedule(root: HTMLElement) {
  const container = d3.select(root)
  container.selectAll('*').remove()

  const days = weekDays.value
  const legends = courseColorsMap.value

  // ---- 头部：周导航 ----
  const headerDiv = container.append('div').attr('class', 'flex items-center justify-between flex-wrap gap-3 mb-6')
  const titleDiv = headerDiv.append('div')
  titleDiv.append('h1').attr('class', 'text-2xl font-bold text-gray-900').text('我的课表')
  const subtitle = titleDiv.append('p').attr('class', 'text-sm text-gray-500 mt-1 flex items-center gap-2')
  subtitle.append('span').text(weekRange.value)
  subtitle.append('span').attr('class', 'w-1 h-1 rounded-full bg-indigo-400/60')
  subtitle.append('span').text(`第${weekNumber.value}周`)

  const navDiv = headerDiv.append('div').attr('class', 'flex items-center gap-1 bg-white rounded-lg border border-gray-200 shadow-sm p-0.5')
  const prevBtn = navDiv.append('button').attr('class', 'p-2 rounded-md hover:bg-indigo-50 transition-colors').attr('title', '上一周').on('click', prevWeek)
  renderIcon(prevBtn, 'chevronLeft').attr('class', 'w-4 h-4 text-gray-400')
  navDiv.append('button').attr('class', 'px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-indigo-50 rounded-md transition-colors').on('click', todayFn).text('今天')
  const nextBtn = navDiv.append('button').attr('class', 'p-2 rounded-md hover:bg-indigo-50 transition-colors').attr('title', '下一周').on('click', nextWeek)
  renderIcon(nextBtn, 'chevronRight').attr('class', 'w-4 h-4 text-gray-400')

  // 统计本周是否有课
  const hasCards = days.some(d => getDayCourseCards(d.date).length > 0)

  // ---- 空状态 ----
  if (!hasCards) {
    const emptyDiv = container.append('div').attr('class', 'bg-white rounded-xl border border-gray-200 shadow-sm py-20 text-center')
    const iconWrap = emptyDiv.append('div').attr('class', 'inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4')
    renderIcon(iconWrap, 'calendarDays').attr('class', 'w-8 h-8 text-gray-300')
    emptyDiv.append('p').attr('class', 'text-gray-800 font-medium').text('本周暂无课程安排')
    emptyDiv.append('p').attr('class', 'text-gray-400 text-sm mt-1').text(`${weekRange.value} 没有课程`)
    const backBtn = emptyDiv.append('button').attr('class', 'mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1').on('click', todayFn)
    renderIcon(backBtn, 'calendarDays').attr('class', 'w-4 h-4')
    backBtn.append('span').text('返回本周')
    return
  }

  // ---- 课表主体 ----
  const wrap = container.append('div').attr('class', 'bg-white rounded-xl border border-gray-200 shadow-sm')
  const scrollDiv = wrap.append('div').attr('class', 'overflow-x-auto')
  const outer = scrollDiv.append('div').style('min-width', '820px')

  // ---- 表头：日期列 ----
  const headerRow = outer.append('div').attr('class', 'flex border-b border-gray-200')
  headerRow.append('div').attr('class', 'flex-shrink-0 w-16 bg-indigo-50')

  days.forEach((day) => {
    const dayHeader = headerRow.append('div')
      .attr('class', `flex-1 p-2 text-center ${day.isToday ? 'bg-indigo-50' : 'bg-indigo-50'}`)
    const innerDiv = dayHeader.append('div').attr('class', 'relative inline-flex flex-col items-center')
    if (day.isToday) {
      innerDiv.append('span').attr('class', 'text-[9px] font-bold text-white bg-indigo-600 px-1.5 rounded-b-sm leading-4 -mt-2 mb-0.5').text('今')
    }
    innerDiv.append('span').attr('class', `text-xs font-semibold ${day.isToday ? 'text-indigo-700' : 'text-gray-600'}`).text(day.label)
    innerDiv.append('span').attr('class', `text-[11px] mt-0.5 ${day.isToday ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`).text(day.dateStr)
  })

  // ---- 时间轴 + 课程块 ----
  const body = outer.append('div').attr('class', 'flex relative').style('height', totalHeight.value + 'px')

  // 时间轴（左侧）
  const timeAxis = body.append('div').attr('class', 'flex-shrink-0 w-16 relative')
  STANDARD_SLOTS.forEach((slot) => {
    const top = getTimeLabelTop(slot.key) - 10
    const g = timeAxis.append('div')
      .attr('class', 'absolute left-0 w-full text-center')
      .style('top', top + 'px')
    g.append('div').attr('class', 'text-[11px] text-gray-400 font-medium leading-none').text(slot.label)
    g.append('div').attr('class', 'text-[9px] text-gray-300 mt-0.5 leading-none').text(slot.periodLabel)
  })

  // 每日课程列
  days.forEach((day) => {
    const col = body.append('div')
      .attr('class', 'flex-1 relative border-l border-gray-200 last:border-r-0')

    // 小时分隔线
    STANDARD_SLOTS.forEach((slot) => {
      col.append('div')
        .attr('class', 'absolute left-0 right-0 border-t border-gray-100')
        .style('top', getTimeLabelTop(slot.key) + 'px')
    })
    // 底部边界线
    col.append('div').attr('class', 'absolute left-0 right-0 bottom-0 border-t border-gray-100')

    // 课程块（绝对定位）
    const cards = getDayCourseCards(day.date)
    cards.forEach((card) => {
      const block = col.append('div')
        .attr('class', 'absolute left-0.5 right-0.5 rounded-lg px-2.5 py-1.5 overflow-hidden cursor-pointer transition-all duration-150 border hover:shadow-lg flex flex-col')
        .style('top', getBlockTop(card.timeSlot) + 'px')
        .style('height', getBlockHeight(card.timeSlot) + 'px')
        .style('background', card.cardBg)
        .style('border-color', card.border)

      block.append('p')
        .attr('class', 'font-semibold truncate text-[12px] leading-tight')
        .style('color', card.text)
        .text(card.courseName)

      block.append('p')
        .attr('class', 'text-[10px] mt-0.5 font-medium truncate')
        .style('color', card.text)
        .style('opacity', 0.8)
        .text(card.teacher)

      block.append('p')
        .attr('class', 'text-[9px] mt-0.5 truncate')
        .style('color', card.text)
        .style('opacity', 0.6)
        .text(`${card.room} · ${card.timeSlot}`)
    })
  })

  // ---- 图例 ----
  if (legends.length > 0) {
    const legendDiv = container.append('div').attr('class', 'flex flex-wrap gap-2 text-xs mt-6')
    legends.forEach((l) => {
      const item = legendDiv.append('span')
        .attr('class', 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border')
        .style('background', l.cardBg)
        .style('border-color', l.border)
        .style('color', l.text)
      item.append('span').attr('class', 'w-2.5 h-2.5 rounded-sm').style('background', l.border)
      item.append('span').text(l.label)
    })
  }
}

onMounted(() => {
  const el = document.getElementById('student-schedule-root')
  if (el) renderSchedule(el)
})

watch([mySchedules, weekStart], () => {
  const el = document.getElementById('student-schedule-root')
  if (el) renderSchedule(el)
}, { deep: true })
</script>
