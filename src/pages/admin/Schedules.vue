<template>
  <div class="space-y-6">
    <!-- 头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">课程管理</h1>
        <p class="text-gray-500 mt-1">管理所有课程的排课信息，支持增删改查</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="triggerImport" class="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium">
          <Upload class="w-4 h-4" /> 导入Excel
        </button>
        <button @click="openAdd" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus class="w-4 h-4" /> 新增排课
        </button>
      </div>
    </div>

    <!-- 同步教务数据 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw class="w-4 h-4 text-blue-500" />
        <span>从排课数据自动生成分类和课程</span>
      </div>
      <button
        @click="handleSync"
        :disabled="isSyncing"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        :class="isSyncing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'"
      >
        <Loader2 v-if="isSyncing" class="w-4 h-4 animate-spin" />
        <RefreshCw v-else class="w-4 h-4" />
        {{ isSyncing ? '同步中...' : '立即同步教务数据' }}
      </button>
    </div>

    <!-- 同步结果弹窗 -->
    <Teleport to="body">
      <div v-if="showSyncResult" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click="showSyncResult = false">
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" @click.stop>
          <div class="text-center mb-4">
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle class="w-6 h-6 text-green-600" />
            </div>
            <h3 class="text-lg font-bold text-gray-900">同步完成</h3>
          </div>
          <div class="space-y-2 text-sm mb-5">
            <div class="flex justify-between">
              <span class="text-gray-500">新增</span>
              <span class="font-medium text-green-600">{{ syncResult.added }} 项</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">更新</span>
              <span class="font-medium text-blue-600">{{ syncResult.updated }} 项</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">失败</span>
              <span class="font-medium text-red-500">{{ syncResult.failed }} 项</span>
            </div>
          </div>
          <button @click="showSyncResult = false" class="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            知道了
          </button>
        </div>
      </div>
    </Teleport>

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
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">班级</th>
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
                <span class="font-medium text-gray-900 text-sm">{{ sch.title || getCourseTitle(sch.courseId) }}</span>
                <span v-if="isConflicting(sch)" class="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">冲突</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sch.teacher }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sch.className || '-' }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sch.room }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sch.startDate }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sch.timeSlot }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="openEdit(sch)" class="text-xs px-2.5 py-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors">编辑</button>
              <button @click="confirmDelete(sch)" class="text-xs px-2.5 py-1.5 text-red-400 hover:bg-red-50 rounded transition-colors ml-1">删除</button>
            </td>
          </tr>
          <tr v-if="filteredSchedules.length === 0">
            <td colspan="7" class="text-center py-12 text-gray-400 text-sm">
              <CalendarX class="w-8 h-8 mx-auto mb-2 text-gray-200" />
              {{ searchText ? '没有匹配的排课记录' : '暂无排课记录' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 统计 -->
    <div class="text-xs text-gray-400">
      共 {{ dbSchedules.length }} 条排课记录
      <span v-if="conflictCount > 0" class="text-red-500 ml-2">{{ conflictCount }} 条存在冲突</span>
    </div>

    <!-- 隐藏的文件选择器 -->
    <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileChange" />

    <!-- 导入结果提示 -->
    <div v-if="importMsg" :class="`text-sm p-3 rounded-lg ${importMsg.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`">
      {{ importMsg.text }}
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

          <!-- 班级 -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5">上课班级</label>
            <select v-model="form.className" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-white">
              <option value="">不指定班级</option>
              <option v-for="c in classList" :key="c.name" :value="c.name">{{ c.name }}（{{ c.count }}人）</option>
            </select>
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
        <p class="text-sm text-gray-500 mb-5">确定要删除「{{ deleteTarget.title || getCourseTitle(deleteTarget.courseId) }}」在 {{ deleteTarget.startDate }} {{ deleteTarget.timeSlot }} 的排课吗？</p>
        <div class="flex justify-end gap-2">
          <button @click="deleteTarget = null" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
          <button @click="handleDelete" class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { Plus, Search, CalendarX, AlertTriangle, Upload, RefreshCw, Loader2, CheckCircle } from 'lucide-vue-next'
import type { Schedule } from '@/types'
import { bulkImportSchedules, fetchClasses, fetchSchedules, updateSchedule as apiUpdateSchedule, deleteSchedule as apiDeleteSchedule, syncCategoriesFromSchedules } from '@/api'
import * as XLSX from 'xlsx'

const store = useAppStore()

// 班级列表
const classList = ref<any[]>([])

// 从数据库加载的排课数据
const dbSchedules = ref<any[]>([])

onMounted(async () => {
  try {
    const res = await fetchClasses()
    if (res.success) classList.value = res.classes
  } catch (e) { /* ignore */ }
  loadSchedules()
})

async function loadSchedules() {
  try {
    const res = await fetchSchedules()
    if (res.success) dbSchedules.value = res.schedules
  } catch (e) {
    console.error('加载排课失败:', e)
  }
}

// ---- 同步教务数据 ----
const isSyncing = ref(false)
const showSyncResult = ref(false)
const syncResult = ref({ added: 0, updated: 0, failed: 0 })

function handleSync() {
  if (isSyncing.value) return
  isSyncing.value = true
  syncCategoriesFromSchedules()
    .then((res) => {
      syncResult.value = { added: res.added ?? 0, updated: res.updated ?? 0, failed: res.failed ?? 0 }
      isSyncing.value = false
      showSyncResult.value = true
    })
    .catch(() => {
      isSyncing.value = false
      syncResult.value = { added: 0, updated: 0, failed: 1 }
      showSyncResult.value = true
    })
}

// ---- 搜索 ----
const searchText = ref('')

// 直接使用数据库数据展示
const filteredSchedules = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return dbSchedules.value
  return dbSchedules.value.filter((s: any) =>
    (s.title || '').toLowerCase().includes(q) ||
    (s.teacher || '').toLowerCase().includes(q) ||
    (s.room || '').toLowerCase().includes(q)
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
function isConflicting(sch: any): boolean {
  return dbSchedules.value.some((other: any) => {
    if (other.id === sch.id) return false
    if (other.startDate !== sch.startDate) return false
    const sameTeacher = other.teacher === sch.teacher && timesOverlap(other.timeSlot, sch.timeSlot)
    const sameRoom = other.room === sch.room && timesOverlap(other.timeSlot, sch.timeSlot)
    return sameTeacher || sameRoom
  })
}

const conflictCount = computed(() => dbSchedules.value.filter(isConflicting).length)

// ---- 新增/编辑弹窗 ----
const showModal = ref(false)
const editingSchedule = ref<Schedule | null>(null)
const form = ref({
  courseId: '',
  teacher: '',
  className: '',
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
  const other = dbSchedules.value.filter((s: any) => {
    if (editingSchedule.value && s.id === editingSchedule.value.id) return false
    if (s.startDate !== form.value.startDate) return false
    return true
  })
  const teacherConflict = other.find((s) => s.teacher === form.value.teacher && timesOverlap(s.timeSlot, timeSlot))
  if (teacherConflict) {
    return `「${form.value.teacher}」在 ${form.value.startDate} ${teacherConflict.timeSlot} 已有排课（${getCourseTitle(teacherConflict.courseId)}），时间重叠`
  }
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
  form.value = { courseId: '', teacher: '', className: '', room: '', startDate: '', startTime: '09:00', endTime: '11:00' }
  showModal.value = true
}

function openEdit(sch: Schedule) {
  editingSchedule.value = sch
  form.value = {
    courseId: sch.courseId,
    teacher: sch.teacher,
    className: (sch as any).className || '',
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
    className: form.value.className,
    startDate: form.value.startDate,
    endDate: form.value.startDate,
    timeSlot,
    room: form.value.room,
    teacher: form.value.teacher,
  }

  const doSave = editingSchedule.value
    ? apiUpdateSchedule(editingSchedule.value.id, data)
    : bulkImportSchedules([data])

  doSave.then(() => loadSchedules())
  closeModal()
}

// ---- 删除 ----
const deleteTarget = ref<Schedule | null>(null)

function confirmDelete(sch: Schedule) {
  deleteTarget.value = sch
}

function handleDelete() {
  if (deleteTarget.value) {
    apiDeleteSchedule(deleteTarget.value.id).then(() => loadSchedules())
    deleteTarget.value = null
  }
}

// ====== Excel 导入 ======

const fileInput = ref<HTMLInputElement>()
const importMsg = ref<{ success: boolean; text: string } | null>(null)

function triggerImport() {
  fileInput.value?.click()
}

async function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  importMsg.value = null

  try {
    // 读取 Excel 文件
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      importMsg.value = { success: false, text: 'Excel 文件为空，请检查文件内容' }
      return
    }

    // 解析 Excel 行 → Schedule 数据
    const schedules: any[] = []
    for (const row of rows) {
      // 支持中英文列名
      const courseId = row['课程ID'] || row['courseId'] || row['课程编号'] || ''
      const title = row['课程名称'] || row['title'] || row['课程'] || ''
      const teacher = row['教师'] || row['teacher'] || row['授课教师'] || ''
      const room = row['教室'] || row['room'] || ''
      const startDate = fmtExcelDate(row['日期'] || row['date'] || row['上课日期'] || row['startDate'] || '')
      const endDate = fmtExcelDate(row['结束日期'] || row['endDate'] || row['end_date'] || '') || startDate
      const timeSlot = row['时间段'] || row['timeSlot'] || row['time_slot'] || row['时间'] || ''

      if (!title || !startDate || !timeSlot) continue

      schedules.push({
        courseId: courseId || title,
        title,
        teacher: teacher || '未指定',
        className: row['班级'] || row['className'] || row['class_name'] || row['上课班级'] || '',
        room: room || '未指定',
        startDate,
        endDate,
        timeSlot,
      })
    }

    if (schedules.length === 0) {
      importMsg.value = { success: false, text: '未能从 Excel 中解析到有效排课数据，请检查列名是否正确' }
      return
    }

    // 发送到后端 → 写入 MySQL
    const res = await bulkImportSchedules(schedules)

    // 重新加载数据库数据
    await loadSchedules()

    importMsg.value = { success: true, text: res.message || `成功导入 ${schedules.length} 条排课记录` }
    setTimeout(() => { importMsg.value = null }, 5000)
  } catch (e: any) {
    importMsg.value = { success: false, text: '导入失败：' + (e.message || '未知错误') }
  }

  // 清空 file input，允许重复选同一个文件
  if (fileInput.value) fileInput.value.value = ''
}

/** 处理 Excel 日期：可能是数字（序列号）或字符串 */
function fmtExcelDate(val: string | number): string {
  if (!val) return ''
  // 数字序列号 → 日期
  if (typeof val === 'number') {
    try {
      const date = XLSX.SSF.parse_date_code(val)
      const m = String(date.m).padStart(2, '0')
      const d = String(date.d).padStart(2, '0')
      return `${date.y}-${m}-${d}`
    } catch {
      return String(val)
    }
  }
  const s = String(val).trim()
  // 匹配 yyyy/mm/dd 或 yyyy-mm-dd 或 yyyy.mm.dd
  let m = s.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/)
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  }
  // 匹配 m/d 或 mm/dd（补当前年份）
  m = s.match(/^(\d{1,2})[\/\.](\d{1,2})$/)
  if (m) {
    const year = new Date().getFullYear()
    return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  }
  return s
}
</script>
