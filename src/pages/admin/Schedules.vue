<template>
  <div class="space-y-6">
    <!-- 头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">排课管理</h1>
        <p class="text-gray-500 mt-1">管理所有课程的排课信息，支持增删改查</p>
      </div>
      <button @click="openAdd" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 新增排课
      </button>
    </div>

    <!-- 搜索 -->
    <div class="relative max-w-md">
      <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input v-model="searchText" type="text" placeholder="搜索课程名称或教师..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
    </div>

    <!-- 排课列表 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">课程</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">教师</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">教室</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">日期</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">时间段</th>
            <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="sch in filteredSchedules" :key="sch.id" class="hover:bg-gray-50/50 transition-colors"
            :class="isConflicting(sch) ? 'bg-red-50/50' : ''">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 text-sm">{{ getCourseTitle(sch.courseId) }}</span>
                <span v-if="isConflicting(sch)" class="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">冲突</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sch.teacher }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sch.room }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sch.startDate }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sch.timeSlot }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="openEdit(sch)" class="text-xs px-2.5 py-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors">编辑</button>
              <button @click="confirmDelete(sch)" class="text-xs px-2.5 py-1.5 text-red-400 hover:bg-red-50 rounded transition-colors ml-1">删除</button>
            </td>
          </tr>
          <tr v-if="filteredSchedules.length === 0">
            <td colspan="6" class="text-center py-12 text-gray-400 text-sm">
              <CalendarX class="w-8 h-8 mx-auto mb-2 text-gray-200" />
              {{ searchText ? '没有匹配的排课记录' : '暂无排课记录' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 统计 -->
    <div class="text-xs text-gray-400">
      共 {{ store.schedules.length }} 条排课记录
      <span v-if="conflictCount > 0" class="text-red-500 ml-2">{{ conflictCount }} 条存在冲突</span>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="closeModal">
      <div class="absolute inset-0 bg-black/30" @click="closeModal" />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-bold text-gray-900 mb-5">{{ editingSchedule ? '编辑排课' : '新增排课' }}</h3>

        <div class="space-y-4">
          <!-- 课程选择 -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">课程</label>
            <select v-model="form.courseId" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-white">
              <option value="" disabled>请选择课程</option>
              <option v-for="c in store.courses" :key="c.id" :value="c.id">{{ c.title }}</option>
            </select>
          </div>

          <!-- 自动填充教师 -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">授课教师</label>
            <input v-model="form.teacher" type="text" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 outline-none text-sm text-gray-500" readonly />
          </div>

          <!-- 教室 -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">教室</label>
            <input v-model="form.room" type="text" placeholder="如 A101" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
          </div>

          <!-- 日期 -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">日期</label>
            <input v-model="form.startDate" type="date" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
          </div>

          <!-- 时间段 -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">开始时间</label>
              <input v-model="form.startTime" type="time" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">结束时间</label>
              <input v-model="form.endTime" type="time" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
            </div>
          </div>

          <!-- 冲突警告 -->
          <div v-if="conflictWarning" class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium mb-0.5">排课冲突</p>
              <p>{{ conflictWarning }}</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button @click="closeModal" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
          <button @click="handleSave" :disabled="!canSave" class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
            {{ editingSchedule ? '保存修改' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="deleteTarget = null">
      <div class="absolute inset-0 bg-black/30" @click="deleteTarget = null" />
      <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 class="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
        <p class="text-sm text-gray-500 mb-5">确定要删除「{{ getCourseTitle(deleteTarget.courseId) }}」在 {{ deleteTarget.startDate }} {{ deleteTarget.timeSlot }} 的排课吗？</p>
        <div class="flex justify-end gap-2">
          <button @click="deleteTarget = null" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
          <button @click="handleDelete" class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { Plus, Search, CalendarX, AlertTriangle } from 'lucide-vue-next'
import type { Schedule } from '@/types'

const store = useAppStore()

// ---- 搜索 ----
const searchText = ref('')

const filteredSchedules = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return store.schedules
  return store.schedules.filter((s) =>
    getCourseTitle(s.courseId).toLowerCase().includes(q) ||
    s.teacher.toLowerCase().includes(q) ||
    s.room.toLowerCase().includes(q)
  )
})

// ---- 获取课程名称 ----
function getCourseTitle(courseId: string): string {
  return store.courses.find((c) => c.id === courseId)?.title || courseId
}

// ---- 冲突检测 ----
/** 判断两个时间段是否重叠 */
function timesOverlap(a: string, b: string): boolean {
  const parse = (t: string) => t.split('-').map(s => { const [h, m] = s.split(':').map(Number); return h * 60 + m })
  if (parse.length < 2) return false
  const [a1, a2] = parse(a)
  const [b1, b2] = parse(b)
  return a1 < b2 && b1 < a2
}

/** 判断某条排课是否与同教师/同教室的其他排课冲突（必须同一天） */
function isConflicting(sch: Schedule): boolean {
  return store.schedules.some((other) => {
    if (other.id === sch.id) return false
    if (other.startDate !== sch.startDate) return false
    // 同教师且时间重叠
    const sameTeacher = other.teacher === sch.teacher && timesOverlap(other.timeSlot, sch.timeSlot)
    // 同教室且时间重叠
    const sameRoom = other.room === sch.room && timesOverlap(other.timeSlot, sch.timeSlot)
    return sameTeacher || sameRoom
  })
}

const conflictCount = computed(() => store.schedules.filter(isConflicting).length)

// ---- 新增/编辑弹窗 ----
const showModal = ref(false)
const editingSchedule = ref<Schedule | null>(null)
const form = ref({
  courseId: '',
  teacher: '',
  room: '',
  startDate: '',
  startTime: '09:00',
  endTime: '11:00',
})

/** 课程选择联动填充教师 */
watch(() => form.value.courseId, (id) => {
  const course = store.courses.find((c) => c.id === id)
  form.value.teacher = course?.teacher || ''
})

/** 检测表单中的冲突 */
const conflictWarning = computed(() => {
  if (!form.value.courseId || !form.value.startDate || !form.value.startTime || !form.value.endTime || !form.value.room) return ''
  const timeSlot = `${form.value.startTime}-${form.value.endTime}`
  const other = store.schedules.filter((s) => {
    if (editingSchedule.value && s.id === editingSchedule.value.id) return false
    if (s.startDate !== form.value.startDate) return false
    return true
  })
  // 教师冲突
  const teacherConflict = other.find((s) => s.teacher === form.value.teacher && timesOverlap(s.timeSlot, timeSlot))
  if (teacherConflict) {
    return `「${form.value.teacher}」在 ${form.value.startDate} ${teacherConflict.timeSlot} 已有排课（${getCourseTitle(teacherConflict.courseId)}），时间重叠`
  }
  // 教室冲突
  const roomConflict = other.find((s) => s.room === form.value.room && timesOverlap(s.timeSlot, timeSlot))
  if (roomConflict) {
    return `「${form.value.room}」在 ${form.value.startDate} ${roomConflict.timeSlot} 已被占用（${getCourseTitle(roomConflict.courseId)}），时间重叠`
  }
  return ''
})

const canSave = computed(() =>
  form.value.courseId && form.value.startDate && form.value.startTime && form.value.endTime && form.value.room
)

function openAdd() {
  editingSchedule.value = null
  form.value = { courseId: '', teacher: '', room: '', startDate: '', startTime: '09:00', endTime: '11:00' }
  showModal.value = true
}

function openEdit(sch: Schedule) {
  editingSchedule.value = sch
  form.value = {
    courseId: sch.courseId,
    teacher: sch.teacher,
    room: sch.room,
    startDate: sch.startDate,
    startTime: sch.timeSlot.split('-')[0],
    endTime: sch.timeSlot.split('-')[1] || '11:00',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingSchedule.value = null
}

function handleSave() {
  const timeSlot = `${form.value.startTime}-${form.value.endTime}`
  const data = {
    courseId: form.value.courseId,
    title: getCourseTitle(form.value.courseId),
    startDate: form.value.startDate,
    endDate: form.value.startDate,
    timeSlot,
    room: form.value.room,
    teacher: form.value.teacher,
  }

  if (editingSchedule.value) {
    store.updateSchedule(editingSchedule.value.id, data)
  } else {
    store.addSchedule({ id: `sch-${Date.now()}`, ...data })
  }
  closeModal()
}

// ---- 删除 ----
const deleteTarget = ref<Schedule | null>(null)

function confirmDelete(sch: Schedule) {
  deleteTarget.value = sch
}

function handleDelete() {
  if (deleteTarget.value) {
    store.deleteSchedule(deleteTarget.value.id)
    deleteTarget.value = null
  }
}
</script>
