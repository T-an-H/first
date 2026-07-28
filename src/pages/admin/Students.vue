<template>
  <div class="space-y-6">
    <!-- ====== 班级列表 ====== -->
    <template v-if="!selectedClass">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">班级管理</h1>
          <p class="text-gray-500 mt-1">管理所有班级，点击班级查看学生名单（数据来源：MySQL）</p>
        </div>
        <div class="flex items-center gap-2 text-xs" :class="loading ? 'text-amber-500' : 'text-green-500'">
          <span class="w-2 h-2 rounded-full" :class="loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'"></span>
          {{ loading ? '加载中...' : `已连接 · ${classes.length} 个班级` }}
        </div>
      </div>

      <!-- 搜索班级 -->
      <div class="relative max-w-md">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="classSearch" type="text" placeholder="搜索班级名称..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
      </div>

      <!-- 班级卡片 -->
      <div v-if="loading" class="text-center py-12 text-gray-400">
        <LoaderCircle class="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
        <span>正在从数据库加载...</span>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="c in filteredClasses"
          :key="c.name"
          @click="selectClass(c.name)"
          class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{{ c.name }}</h3>
                <p class="text-xs text-gray-400 mt-0.5">{{ c.count }} 名学生</p>
              </div>
            </div>
            <ArrowRight class="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
        <div v-if="filteredClasses.length === 0" class="col-span-full text-center py-20 text-gray-400">
          <Users class="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{{ classSearch ? '没有匹配的班级' : '暂无班级数据' }}</p>
        </div>
      </div>
    </template>

    <!-- ====== 班级内学生名单 ====== -->
    <template v-else>
      <div class="flex items-center gap-3 mb-1">
        <button @click="selectedClass = null" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft class="w-4 h-4" /> 返回班级列表
        </button>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ selectedClass }}</h1>
          <p class="text-gray-500 mt-1">{{ filteredStudents.length }} 名学生</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="triggerImport" class="px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-2">
            <Upload class="w-4 h-4" />
            Excel 导入
          </button>
          <button @click="loadClassStudents" class="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
            <RefreshCw class="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>
      <input ref="importFileInput" type="file" accept=".xlsx,.xls,.csv" @change="handleImportFile" class="hidden" />

      <!-- 搜索学生 -->
      <div class="relative max-w-md">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="studentSearch" type="text" placeholder="搜索学生姓名或学号..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
      </div>

      <div v-if="loadingStudents" class="text-center py-12 text-gray-400">
        <LoaderCircle class="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
        <span>加载中...</span>
      </div>
      <div v-else class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">姓名</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">学号</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filteredStudents" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="s.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'">
                    <span class="text-xs font-bold" :class="s.status === 'active' ? 'text-blue-600' : 'text-gray-400'">{{ s.name[0] }}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ s.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ s.studentId }}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'">
                  {{ s.status === 'active' ? '正常' : '禁用' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <router-link :to="`/admin/students/${s.id}`" class="text-xs text-blue-500 hover:underline">查看详情</router-link>
              </td>
            </tr>
            <tr v-if="filteredStudents.length === 0">
              <td colspan="4" class="px-4 py-12 text-center text-gray-400">{{ studentSearch ? '没有匹配的学生' : '该班级暂无学生' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ====== 重复数据弹窗 ====== -->
    <Teleport to="body">
      <div v-if="showDuplicateModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showDuplicateModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
          <div class="px-5 py-4 border-b border-gray-200 flex-shrink-0">
            <h3 class="text-base font-semibold text-gray-800">发现完全重复数据</h3>
            <p class="text-xs text-gray-400 mt-1">以下 {{ duplicateRows.length }} 条数据与已有学生信息完全一致，请选择处理方式</p>
          </div>
          <div class="px-5 py-3 overflow-y-auto flex-1 space-y-2">
            <div v-for="(row, i) in duplicateRows" :key="i"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-100">
              <div class="text-sm">
                <span class="font-medium text-gray-800">{{ row.name }}</span>
                <span class="text-gray-400 ml-2">{{ row.studentId || '-' }}</span>
                <span class="text-gray-400 ml-2">{{ row.className || '-' }}</span>
              </div>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" v-model="row._import" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span :class="row._import ? 'text-blue-600' : 'text-gray-400'">导入</span>
              </label>
            </div>
          </div>
          <div class="px-5 py-3 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <button @click="toggleAllDuplicates" class="text-sm text-gray-500 hover:text-gray-700">
              {{ allDuplicatesSelected ? '取消全选' : '全选' }}
            </button>
            <div class="flex items-center gap-2">
              <button @click="showDuplicateModal = false" class="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">取消</button>
              <button @click="confirmImport" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                确认导入（{{ selectedDuplicateCount }} 条）
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ====== 导入成功弹窗 ====== -->
    <Teleport to="body">
      <div v-if="showResultModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showResultModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
          <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle class="w-6 h-6 text-green-600" />
          </div>
          <h3 class="text-base font-semibold text-gray-800 mb-1">导入完成</h3>
          <p class="text-sm text-gray-500">
            {{ importResult.added }} 条新增 · {{ importResult.updated }} 条更新
          </p>
          <button @click="showResultModal = false" class="mt-4 px-6 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            知道了
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Users, ArrowLeft, ArrowRight, RefreshCw, LoaderCircle, Search, Upload, CheckCircle } from 'lucide-vue-next'
import { fetchClasses, fetchStudents } from '@/api'
import { useAppStore } from '@/stores/app'
import * as XLSX from 'xlsx'
import type { Student, StudentImportRow } from '@/types'

const store = useAppStore()

const classes = ref<any[]>([])
const loading = ref(false)
const selectedClass = ref('')
const students = ref<any[]>([])
const loadingStudents = ref(false)
const classSearch = ref('')
const studentSearch = ref('')

// 导入相关
const importFileInput = ref<HTMLInputElement | null>(null)
const showDuplicateModal = ref(false)
const showResultModal = ref(false)
const duplicateRows = ref<(StudentImportRow & { _import: boolean })[]>([])
const importResult = ref({ added: 0, updated: 0 })

/** 用户可导入的行（含非重复数据 + 用户勾选的重复数据） */
let pendingImportRows: StudentImportRow[] = []

// 班级搜索过滤
const filteredClasses = computed(() => {
  const q = classSearch.value.trim().toLowerCase()
  if (!q) return classes.value
  return classes.value.filter((c) => c.name.toLowerCase().includes(q))
})

// 学生搜索过滤
const filteredStudents = computed(() => {
  const q = studentSearch.value.trim().toLowerCase()
  if (!q) return students.value
  return students.value.filter(
    (s) => s.name.toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q)
  )
})

async function loadClasses() {
  loading.value = true
  try {
    const res = await fetchClasses()
    if (res.success) classes.value = res.classes
  } catch (e) {
    console.error('加载班级失败:', e)
  } finally {
    loading.value = false
  }
}

function selectClass(name: string) {
  selectedClass.value = name
  studentSearch.value = ''
  loadClassStudents()
}

async function loadClassStudents() {
  loadingStudents.value = true
  try {
    const res = await fetchStudents({ class: selectedClass.value, pageSize: '200' })
    if (res.success) students.value = res.students
  } catch (e) {
    console.error('加载学生失败:', e)
  } finally {
    loadingStudents.value = false
  }
}

// ====== Excel 导入 ======
function triggerImport() {
  importFileInput.value?.click()
}

function handleImportFile(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = new Uint8Array(reader.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet)
      processImportRows(rows)
    } catch (err) {
      console.error('解析 Excel 失败:', err)
      alert('文件解析失败，请确保文件格式正确')
    }
  }
  reader.readAsArrayBuffer(file)
  if (importFileInput.value) importFileInput.value.value = ''
}

/** 将 Excel 行映射为标准字段 */
function normalizeRow(row: any): StudentImportRow {
  const fieldMap: Record<string, keyof StudentImportRow> = {
    '姓名': 'name', 'name': 'name',

    '学号': 'studentId', 'student_id': 'studentId', 'studentid': 'studentId', '编号': 'studentId',

    '班级': 'className', 'class_name': 'className', 'classname': 'className', 'class': 'className',

    '电话': 'phone', '手机': 'phone', '手机号': 'phone', 'phone': 'phone',

    '邮箱': 'email', 'email': 'email', '邮件': 'email',

    '入学成绩': 'enrollmentScore', 'enrollment_score': 'enrollmentScore', 'enrollmentscore': 'enrollmentScore',
    '成绩': 'enrollmentScore', '高考成绩': 'enrollmentScore',

    '入学日期': 'joinDate', 'join_date': 'joinDate', 'joindate': 'joinDate', '日期': 'joinDate',

    '状态': 'status', 'status': 'status',
  }

  const result: any = {}
  for (const [key, val] of Object.entries(row)) {
    const normalizedKey = fieldMap[key.trim()]
    if (normalizedKey) {
      result[normalizedKey] = val
    }
  }
  // 转换 enrollmentScore 为数字
  if (result.enrollmentScore !== undefined) {
    result.enrollmentScore = Number(result.enrollmentScore) || undefined
  }
  return result as StudentImportRow
}

function processImportRows(rows: any[]) {
  const existingStudents = store.students
  const dups: (StudentImportRow & { _import: boolean })[] = []
  const normal: StudentImportRow[] = []

  for (const row of rows) {
    const normalized = normalizeRow(row)
    // 姓名必填
    if (!normalized.name) continue

    // 查找是否完全重复
    const isDuplicate = existingStudents.some((s) => {
      return (
        s.name === normalized.name &&
        (s.studentId || '') === (normalized.studentId || '') &&
        (s.className || '') === (normalized.className || '')
      )
    })

    if (isDuplicate) {
      dups.push({ ...normalized, _import: false })
    } else {
      normal.push(normalized)
    }
  }

  pendingImportRows = normal

  if (dups.length > 0) {
    duplicateRows.value = dups
    showDuplicateModal.value = true
  } else {
    // 无重复，直接导入
    executeImport(pendingImportRows)
  }
}

const allDuplicatesSelected = computed(() => {
  return duplicateRows.value.length > 0 && duplicateRows.value.every((r) => r._import)
})

const selectedDuplicateCount = computed(() => {
  return duplicateRows.value.filter((r) => r._import).length
})

function toggleAllDuplicates() {
  const newVal = !allDuplicatesSelected.value
  duplicateRows.value.forEach((r) => (r._import = newVal))
}

function confirmImport() {
  // 合并用户确认的重复行 + 正常行
  const acceptedDups = duplicateRows.value.filter((r) => r._import)
  showDuplicateModal.value = false
  executeImport([...pendingImportRows, ...acceptedDups])
}

function executeImport(rows: StudentImportRow[]) {
  let added = 0
  let updated = 0
  const existingStudents = store.students

  for (const row of rows) {
    const existing = existingStudents.find((s) => {
      // 按学号匹配（学号唯一）
      if (row.studentId && s.studentId === row.studentId) return true
      // 无学号时按姓名+班级匹配
      if (!row.studentId && s.name === row.name) {
        if (row.className) return s.className === row.className
        return true
      }
      return false
    })

    if (existing) {
      // 更新已有学生
      store.updateStudent(existing.id, {
        name: row.name,
        studentId: row.studentId || existing.studentId,
        className: row.className || existing.className,
        phone: row.phone || existing.phone,
        email: row.email || existing.email,
        enrollmentScore: row.enrollmentScore ?? existing.enrollmentScore,
        joinDate: row.joinDate || existing.joinDate,
      })
      updated++
    } else {
      // 新增学生
      const newStudent: Student = {
        id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: row.name,
        phone: row.phone || '',
        email: row.email || '',
        avatar: '',
        joinDate: row.joinDate || '',
        status: 'active',
        studentId: row.studentId,
        className: row.className,
        enrollmentScore: row.enrollmentScore,
      }
      store.addStudent(newStudent)
      added++
    }
  }

  importResult.value = { added, updated }
  showResultModal.value = true
  // 刷新页面学生列表
  setTimeout(() => loadClassStudents(), 500)
}

onMounted(loadClasses)
</script>

<style scoped>
</style>
