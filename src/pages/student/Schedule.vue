<template>
  <div id="student-schedule-root"></div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const store = useAppStore()

// ---- 周导航 ----
const weekStart = ref(getMonday(new Date()))

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
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
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
function todayFn() { weekStart.value = getMonday(new Date()); reRender() }

// ---- 学生课表数据 ----
const student = computed(() => store.students.find((s) => s.name === store.currentUser) ?? store.students[0])

const mySchedules = computed(() => {
  if (!student.value) return []
  const ids = store.enrollments.filter((e) => e.studentId === student.value.id).map((e) => e.courseId)
  return store.schedules.filter((s) => ids.includes(s.courseId))
})

// ---- 提取课程的周规律：每门课在每周的哪几天、哪个时间段上课 ----
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
    const day = sd.getDay()       // 0=周日, 1=周一, ..., 6=周六
    const dow = day === 0 ? 6 : day - 1  // 转为 0=周一, 6=周日
    if (!map.has(s.courseId)) map.set(s.courseId, [])
    const list = map.get(s.courseId)!
    if (!list.some(p => p.dayOfWeek === dow && p.timeSlot === s.timeSlot)) {
      list.push({ dayOfWeek: dow, timeSlot: s.timeSlot, title: s.title, teacher: s.teacher, room: s.room })
    }
  })
  return map
})

// ---- 标准时间段：覆盖全天（从早自习到晚课） ----
interface ParsedSlot { key: string; label: string; periodLabel: string }

/** 标准大学课程时间段 */
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

// ---- 获取某天某时间段的课程卡片 ----
interface CardItem extends CourseColor {
  id: string
  courseName: string
  teacher: string
  room: string
  timeSlot: string
}

/** 获取课程时间段的起始小时数 */
function getSlotHour(t: string): number {
  return parseInt(t.split(':')[0], 10)
}

function getCards(day: Date, slot: ParsedSlot): CardItem[] {
  const dayOfWeek = day.getDay() === 0 ? 6 : day.getDay() - 1
  const slotHour = parseInt(slot.key.split(':')[0], 10)
  const result: CardItem[] = []
  coursePatterns.value.forEach((patterns, courseId) => {
    patterns.forEach((p) => {
      const courseHour = getSlotHour(p.timeSlot)
      if (p.dayOfWeek === dayOfWeek && courseHour === slotHour) {
        const c = getCourseColor(courseId)
        result.push({
          id: `${courseId}-${p.dayOfWeek}-${slot.key}`,
          courseName: p.title,
          teacher: p.teacher,
          room: p.room,
          timeSlot: p.timeSlot,
          ...c,
        })
      }
    })
  })
  return result
}

const allCards = computed(() => {
  const r: CardItem[] = []
  weekDays.value.forEach((d) => timeSlots.value.forEach((s) => r.push(...getCards(d.date, s))))
  return r
})

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

// ---- D3 渲染 ----
function reRender() {
  const el = document.getElementById('student-schedule-root')
  if (el) renderSchedule(el)
}

function renderSchedule(root: HTMLElement) {
  const container = d3.select(root)
  container.selectAll('*').remove()

  const days = weekDays.value
  const slots = timeSlots.value
  const cards = allCards.value
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
  const todayBtn = navDiv.append('button').attr('class', 'px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-indigo-50 rounded-md transition-colors').on('click', todayFn).text('今天')
  const nextBtn = navDiv.append('button').attr('class', 'p-2 rounded-md hover:bg-indigo-50 transition-colors').attr('title', '下一周').on('click', nextWeek)
  renderIcon(nextBtn, 'chevronRight').attr('class', 'w-4 h-4 text-gray-400')

  // ---- 空状态 ----
  if (cards.length === 0) {
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
  const tableWrap = container.append('div').attr('class', 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden')
  const scrollDiv = tableWrap.append('div').attr('class', 'overflow-x-auto')
  const table = scrollDiv.append('table').attr('class', 'w-full border-collapse').style('table-layout', 'fixed').style('min-width', '820px')

  // ---- thead ----
  const thead = table.append('thead')
  const headRow = thead.append('tr')
  headRow.append('th')
    .attr('class', 'w-[64px] p-2 text-xs text-gray-400 font-normal text-center bg-gray-50 border-r border-b border-gray-200')
  days.forEach((day) => {
    const th = headRow.append('th')
      .attr('class', `p-2 text-center border-r border-b border-gray-200 last:border-r-0 ${day.isToday ? 'bg-indigo-50' : 'bg-gray-50'}`)
    const innerDiv = th.append('div').attr('class', 'relative inline-flex flex-col items-center')
    if (day.isToday) {
      innerDiv.append('span').attr('class', 'text-[9px] font-bold text-white bg-indigo-600 px-1.5 rounded-b-sm leading-4 absolute -top-3').text('今')
    }
    innerDiv.append('span').attr('class', `text-xs font-semibold ${day.isToday ? 'text-indigo-700' : 'text-gray-700'}`).text(day.label)
    innerDiv.append('span').attr('class', `text-[11px] mt-0.5 ${day.isToday ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`).text(day.dateStr)
  })

  // ---- tbody ----
  const tbody = table.append('tbody')
  slots.forEach((slot) => {
    const row = tbody.append('tr').attr('class', 'align-top')

    // 时间标签列
    const timeTd = row.append('td')
      .attr('class', 'w-[64px] p-2 text-center bg-gray-50/50 border-r border-b border-gray-200 align-top pt-2')
    timeTd.append('div').attr('class', 'text-[11px] text-gray-400 font-medium').text(slot.label)
    timeTd.append('div').attr('class', 'text-[9px] text-gray-300 mt-0.5').text(slot.periodLabel)

    days.forEach((day) => {
      const dayCards = getCards(day.date, slot)
      const td = row.append('td')
        .attr('class', 'p-1.5 border-r border-b border-gray-200 last:border-r-0 align-top')
        .style('background', dayCards.length > 0 ? dayCards[0].cellBg : '#ffffff')

      dayCards.forEach((card) => {
        const cardDiv = td.append('div')
          .attr('class', 'relative rounded-lg px-3 py-2.5 text-[11px] leading-tight cursor-pointer transition-all duration-150 border hover:shadow-md hover:-translate-y-0.5')
          .style('background', card.cardBg)
          .style('border-color', card.border)

        // 课程名称
        cardDiv.append('p')
          .attr('class', 'font-semibold truncate text-[12px]')
          .style('color', card.text)
          .text(card.courseName)

        // 教师（带图标）
        const teacherP = cardDiv.append('p')
          .attr('class', 'text-[10px] mt-1 font-medium flex items-center gap-1')
          .style('color', card.text)
          .style('opacity', 0.75)
        const teacherIcon = teacherP.append('span').attr('class', 'inline-flex items-center')
        renderIcon(teacherIcon, 'user').attr('class', 'w-3 h-3')
        teacherP.append('span').text(card.teacher)

        // 教室（带图标）
        const roomP = cardDiv.append('p')
          .attr('class', 'text-[9px] mt-1 flex items-center gap-1')
          .style('color', card.text)
          .style('opacity', 0.55)
        const roomIcon = roomP.append('span').attr('class', 'inline-flex items-center')
        renderIcon(roomIcon, 'mapPin').attr('class', 'w-3 h-3')
        roomP.append('span').text(`${card.room} · ${card.timeSlot}`)
      })
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
