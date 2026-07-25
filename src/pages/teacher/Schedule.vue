<template>
  <div class="space-y-6">
    <!-- 页面头部 + 周导航 -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">我的课程表</h1>
        <p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <span>{{ weekRange }}</span>
          <span class="w-1 h-1 rounded-full bg-brand-400/60" />
          <span>第 {{ weekNumber }} 周</span>
        </p>
      </div>
      <div class="flex items-center gap-1 bg-white rounded-lg border border-brand-400/30 shadow-sm p-0.5">
        <button @click="prevWeek" class="p-2 rounded-md hover:bg-brand-400/10 transition-colors" title="上一周">
          <ChevronLeft class="w-4 h-4 text-gray-400" />
        </button>
        <button @click="goToday" class="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-brand-400/10 rounded-md transition-colors">今天</button>
        <button @click="nextWeek" class="p-2 rounded-md hover:bg-brand-400/10 transition-colors" title="下一周">
          <ChevronRight class="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="allCards.length === 0" class="bg-white rounded-xl border border-brand-400/20 shadow-sm py-20 text-center">
      <CalendarDays class="w-12 h-12 mx-auto mb-4 text-gray-200" />
      <p class="text-gray-800 font-medium">本周暂无课程安排</p>
      <p class="text-gray-400 text-sm mt-1">{{ weekRange }} 没有课程</p>
      <button @click="goToday" class="mt-4 text-sm text-gray-600 hover:text-gray-800 font-medium inline-flex items-center gap-1">
        <CalendarDays class="w-4 h-4" /> 返回本周
      </button>
    </div>

    <!-- 课表主体 -->
    <div v-else class="bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse" style="min-width: 820px; table-layout: fixed;">
          <thead>
            <tr>
              <th class="w-16 p-2 text-xs text-gray-400 font-normal text-center bg-brand-400/10 border-r border-b border-brand-400/20" />
              <th v-for="day in weekDays" :key="day.label"
                class="p-2 text-center bg-brand-400/10 border-r border-b border-brand-400/20 last:border-r-0"
                :class="day.isToday ? 'bg-brand-50' : ''">
                <div class="relative inline-flex flex-col items-center">
                  <span v-if="day.isToday" class="text-[9px] font-bold text-white bg-brand-600 px-1.5 rounded-b-sm leading-4 -mt-2 mb-0.5">今</span>
                  <span class="text-xs font-semibold" :class="day.isToday ? 'text-gray-600' : 'text-gray-600'">{{ day.label }}</span>
                  <span class="text-[11px] mt-0.5" :class="day.isToday ? 'text-gray-600 font-semibold' : 'text-gray-400'">{{ day.dateStr }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in timeSlots" :key="slot.key" class="align-top">
              <td class="w-16 p-2 text-[10px] text-gray-400 text-center bg-white border-r border-b border-brand-400/20 align-top pt-3">
                {{ slot.label }}
              </td>
              <td v-for="day in weekDays" :key="day.label"
                class="p-1 border-r border-b border-brand-400/20 last:border-r-0 align-top"
                :style="{ background: getDayCellBg(day.date, slot) }">
                <div v-for="card in getCards(day.date, slot)" :key="card.id"
                  class="rounded-lg px-2.5 py-2 text-[11px] leading-tight cursor-pointer transition-all duration-150 border hover:shadow-md"
                  :style="{ background: card.cardBg, borderColor: card.border }">
                  <p class="font-semibold truncate text-[12px]" :style="{ color: card.text }">{{ card.courseName }}</p>
                  <p class="text-[10px] mt-0.5 font-medium" :style="{ color: card.text, opacity: 0.75 }">{{ card.teacher }}</p>
                  <p class="text-[9px] mt-0.5" :style="{ color: card.text, opacity: 0.55 }">{{ card.room }} · {{ card.timeSlot }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 图例 -->
    <div v-if="courseColors.length > 0" class="flex flex-wrap gap-2 text-xs">
      <span v-for="cc in courseColors" :key="cc.label"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
        :style="{ background: cc.cardBg, borderColor: cc.border, color: cc.text }">
        <span class="w-2.5 h-2.5 rounded-sm" :style="{ background: cc.border }" />
        {{ cc.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-vue-next'

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

function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d }
function goToday() { weekStart.value = getMonday(new Date()) }

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

// ---- 课表数据 ----
/** 根据角色获取当前用户的课程安排：教师按 teacher 字段，导师按 mentor 的 courseIds */
const userSchedules = computed(() => {
  if (store.currentRole === 'teacher') {
    return store.schedules.filter((s) => s.teacher === store.currentUser)
  }
  if (store.currentRole === 'mentor') {
    const mentorCourseIds = store.getMentorCourseIds(store.currentUser)
    return store.schedules.filter((s) => mentorCourseIds.includes(s.courseId))
  }
  // fallback: 按教师名称
  return store.schedules.filter((s) => s.teacher === store.currentUser)
})

// ---- 时间槽 ----
interface ParsedSlot { key: string; label: string }
function parseSlot(t: string): ParsedSlot {
  const [s] = t.split('-')
  const [h, m] = s.split(':').map(Number)
  return { key: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, label: `${h}:${String(m).padStart(2, '0')}` }
}

const timeSlots = computed(() => {
  const map = new Map<string, ParsedSlot>()
  userSchedules.value.forEach((s) => { const p = parseSlot(s.timeSlot); if (!map.has(p.key)) map.set(p.key, p) })
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
})

// ---- 颜色方案 ----
interface CourseColor {
  cellBg: string
  cardBg: string
  border: string
  text: string
}

const PALETTE: CourseColor[] = [
  { cellBg: '#bac9bd', cardBg: '#5eb6b9', border: '#429fc4', text: '#0f5073' },
  { cellBg: '#80b8d7', cardBg: '#429fc4', border: '#429fc4', text: '#0f5073' },
  { cellBg: '#bac9bd', cardBg: '#5eb6b9', border: '#429fc4', text: '#155ea0' },
  { cellBg: '#bac9bd', cardBg: '#429fc4', border: '#429fc4', text: '#0f5073' },
  { cellBg: '#80b8d7', cardBg: '#5eb6b9', border: '#429fc4', text: '#155ea0' },
  { cellBg: '#bac9bd', cardBg: '#429fc4', border: '#429fc4', text: '#0f5073' },
  { cellBg: '#bac9bd', cardBg: '#5eb6b9', border: '#429fc4', text: '#155ea0' },
  { cellBg: '#80b8d7', cardBg: '#429fc4', border: '#429fc4', text: '#0f5073' },
]

const courseColorMap = computed(() => {
  const map = new Map<string, CourseColor>()
  const ids = Array.from(new Map(userSchedules.value.map((s) => [s.courseId, s])).keys())
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

function getCards(day: Date, slot: ParsedSlot): CardItem[] {
  return userSchedules.value
    .filter((s) => {
      const sd = new Date(s.startDate)
      const p = parseSlot(s.timeSlot)
      return sd.getFullYear() === day.getFullYear() && sd.getMonth() === day.getMonth() && sd.getDate() === day.getDate() && p.key === slot.key
    })
    .map((s) => {
      const c = getCourseColor(s.courseId)
      return { id: s.id, courseName: s.title, teacher: s.teacher, room: s.room, timeSlot: s.timeSlot, ...c }
    })
}

function getDayCellBg(day: Date, slot: ParsedSlot): string {
  const cards = getCards(day, slot)
  return cards.length > 0 ? cards[0].cellBg : '#ffffff'
}

const allCards = computed(() => {
  const r: CardItem[] = []
  weekDays.value.forEach((d) => timeSlots.value.forEach((s) => r.push(...getCards(d.date, s))))
  return r
})

// ---- 图例 ----
const courseColors = computed(() => {
  const map = new Map<string, { label: string; cardBg: string; border: string; text: string }>()
  userSchedules.value.forEach((s) => {
    if (!map.has(s.courseId)) {
      const c = getCourseColor(s.courseId)
      map.set(s.courseId, { label: s.title, cardBg: c.cardBg, border: c.border, text: c.text })
    }
  })
  return Array.from(map.values())
})
</script>
