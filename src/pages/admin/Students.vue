<template>
  <div class="space-y-6">
    <!-- ====== 班级列表 ====== -->
    <template v-if="!selectedClass">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">班级管理</h1>
          <p class="text-gray-500 mt-1">管理所有班级，点击班级查看学生名单{{ usingMockData ? '（演示模式）' : '（数据来源：MySQL）' }}</p>
        </div>
        <div class="flex items-center gap-2 text-xs" :class="loading ? 'text-amber-500' : usingMockData ? 'text-blue-500' : 'text-green-500'">
          <span class="w-2 h-2 rounded-full" :class="loading ? 'bg-amber-500 animate-pulse' : usingMockData ? 'bg-blue-500' : 'bg-green-500'"></span>
          {{ loading ? '加载中...' : usingMockData ? `演示数据 · ${classes.length} 个班级` : `已连接 · ${classes.length} 个班级` }}
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
        <div v-if="false" class="flex items-center gap-2">
          <button @click="resetStudentForm(); showStudentModal = true" class="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Plus class="w-4 h-4" />
            新增学生
          </button>
          <button @click="triggerImport" class="px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-2">
            <Upload class="w-4 h-4" />
            Excel 导入
          </button>
          <button @click="loadClassStudents" class="px-4 py-2.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center gap-2">
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
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">电话</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
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
              <td class="px-4 py-3 text-sm text-gray-600">{{ s.phone || '-' }}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'">
                  {{ s.status === 'active' ? '正常' : '禁用' }}
                </span>
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

    <!-- ====== 新增/编辑学生弹窗 ====== -->
    <Teleport to="body">
      <div v-if="showStudentModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="closeStudentModal" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-semibold text-gray-900">{{ isEditing ? '编辑学生' : '新增学生' }}</h3>
            <button @click="closeStudentModal" class="text-gray-400 hover:text-gray-600">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="text-xs text-gray-500 block mb-1.5 font-medium">姓名 <span class="text-red-500">*</span></label>
              <input v-model="studentForm.name" placeholder="请输入姓名"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1.5 font-medium">学号</label>
              <input v-model="studentForm.studentId" placeholder="请输入学号"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1.5 font-medium">电话</label>
              <input v-model="studentForm.phone" placeholder="请输入电话"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1.5 font-medium">邮箱</label>
              <input v-model="studentForm.email" placeholder="请输入邮箱"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1.5 font-medium">状态</label>
              <select v-model="studentForm.status"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-400 outline-none">
                <option value="active">正常</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="closeStudentModal" class="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">取消</button>
              <button @click="saveStudent" :disabled="!studentForm.name.trim()"
                class="flex-1 px-4 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors">
                {{ isEditing ? '保存' : '新增' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ====== 确认删除弹窗 ====== -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showDeleteModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle class="w-6 h-6 text-red-600" />
          </div>
          <h3 class="text-base font-semibold text-gray-800 mb-1">确认删除</h3>
          <p class="text-sm text-gray-500 mb-5">确定要删除学生 <span class="font-medium text-gray-800">{{ deletingStudent?.name }}</span> 吗？此操作不可恢复。</p>
          <div class="flex gap-3">
            <button @click="showDeleteModal = false" class="flex-1 px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">取消</button>
            <button @click="confirmDeleteStudent" class="flex-1 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">确认删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Users, ArrowLeft, ArrowRight, RefreshCw, LoaderCircle, Search, Upload, CheckCircle, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-vue-next'
import { fetchClasses, fetchStudents } from '@/api'
import { useAppStore } from '@/stores/app'
import * as XLSX from 'xlsx'
import type { Student, StudentImportRow } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const classes = ref<any[]>([])
const loading = ref(false)
const selectedClass = ref('')
const students = ref<any[]>([])
const loadingStudents = ref(false)
const classSearch = ref('')
const studentSearch = ref('')
const usingMockData = ref(false)

// 导入相关
const importFileInput = ref<HTMLInputElement | null>(null)
const showDuplicateModal = ref(false)
const showResultModal = ref(false)
const duplicateRows = ref<(StudentImportRow & { _import: boolean })[]>([])
const importResult = ref({ added: 0, updated: 0 })

// 新增/编辑学生相关
const showStudentModal = ref(false)
const isEditing = computed(() => !!editingStudentId.value)
const editingStudentId = ref('')
const studentForm = ref({
  name: '',
  studentId: '',
  phone: '',
  email: '',
  status: 'active' as 'active' | 'inactive',
})

// 删除学生相关
const showDeleteModal = ref(false)
const deletingStudent = ref<Student | null>(null)

function resetStudentForm() {
  studentForm.value = { name: '', studentId: '', phone: '', email: '', status: 'active' }
  editingStudentId.value = ''
}

function openEditStudent(student: Student) {
  editingStudentId.value = student.id
  studentForm.value = {
    name: student.name,
    studentId: student.studentId || '',
    phone: student.phone || '',
    email: student.email || '',
    status: student.status,
  }
  showStudentModal.value = true
}

function closeStudentModal() {
  showStudentModal.value = false
  resetStudentForm()
}

function saveStudent() {
  const form = studentForm.value
  if (!form.name.trim()) return

  if (isEditing.value) {
    store.updateStudent(editingStudentId.value, {
      name: form.name.trim(),
      studentId: form.studentId || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      status: form.status,
    })
    // 更新本地列表
    const idx = students.value.findIndex((s) => s.id === editingStudentId.value)
    if (idx >= 0) {
      students.value[idx] = { ...students.value[idx], ...form }
    }
  } else {
    const newStudent: Student = {
      id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: form.name.trim(),
      phone: form.phone,
      email: form.email,
      avatar: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: form.status,
      studentId: form.studentId || undefined,
      className: selectedClass.value,
    }
    store.addStudent(newStudent)
    students.value.push(newStudent)
  }
  closeStudentModal()
}

function handleDeleteStudent(student: Student) {
  deletingStudent.value = student
  showDeleteModal.value = true
}

function confirmDeleteStudent() {
  if (deletingStudent.value) {
    store.deleteStudent(deletingStudent.value.id)
    students.value = students.value.filter((s) => s.id !== deletingStudent.value!.id)
  }
  showDeleteModal.value = false
  deletingStudent.value = null
}

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
  usingMockData.value = false
  try {
    const res = await fetchClasses()
    if (res.success && res.classes.length > 0) {
      classes.value = res.classes
    } else {
      throw new Error('No data from API')
    }
  } catch (e) {
    console.warn('API加载班级失败，使用本地模拟数据:', e)
    usingMockData.value = true
    const classMap = new Map<string, number>()
    for (const s of store.students) {
      if (s.className) {
        classMap.set(s.className, (classMap.get(s.className) || 0) + 1)
      }
    }
    classes.value = Array.from(classMap.entries()).map(([name, count]) => ({ name, count }))
  } finally {
    loading.value = false
  }
}

function selectClass(name: string) {
  selectedClass.value = name
}

async function loadClassStudents() {
  if (!selectedClass.value) {
    students.value = []
    return
  }

  loadingStudents.value = true
  try {
    const res = await fetchStudents({ class: selectedClass.value, pageSize: '200' })
    if (res.success && res.students.length > 0) {
      students.value = res.students
    } else {
      throw new Error('No data from API')
    }
  } catch (e) {
    console.warn('API加载学生失败，使用本地模拟数据:', e)
    usingMockData.value = true
    students.value = store.students
      .filter((s) => s.className === selectedClass.value)
      .map((s) => ({
        id: s.id,
        name: s.name,
        studentId: s.studentId,
        className: s.className,
        phone: s.phone,
        email: s.email,
        status: s.status,
      }))
  } finally {
    loadingStudents.value = false
  }
}

// URL className 双向同步：支持通过 ?className=xxx 直达班级
watch(() => route.query.className, (className) => {
  const nextClassName = typeof className === 'string' ? className : ''
  if (selectedClass.value === nextClassName) return

  selectedClass.value = nextClassName
  studentSearch.value = ''
}, { immediate: true })

watch(selectedClass, (className, previousClassName) => {
  const currentClassName = typeof route.query.className === 'string' ? route.query.className : ''
  if (currentClassName !== className) {
    const nextQuery = { ...route.query }
    if (className) {
      nextQuery.className = className
    } else {
      delete nextQuery.className
    }
    void router.replace({ query: nextQuery })
  }

  if (!className) {
    students.value = []
    return
  }

  if (className !== previousClassName) {
    studentSearch.value = ''
    void loadClassStudents()
  }
})

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
  let newStudents: Student[] = []
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
      newStudents.push(newStudent)
      added++
    }
  }

  importResult.value = { added, updated }
  showResultModal.value = true

  // 同步到当前页面学生列表
  const updatedIds = new Set<string>()
  for (const s of students.value) {
    if (store.students.find((ns) => ns.id === s.id)) {
      updatedIds.add(s.id)
    }
  }
  // 将 store 中该班学生合并到页面列表（覆盖 API 数据）
  const className = selectedClass.value
  const storeStudents = store.students.filter((s) => s.className === className)
  const mergedMap = new Map<string, any>()
  for (const s of students.value) {
    mergedMap.set(s.id, {
      ...s,
      ...store.students.find((ns) => ns.id === s.id),
    })
  }
  for (const s of storeStudents) {
    mergedMap.set(s.id, s)
  }
  students.value = Array.from(mergedMap.values())
}

onMounted(loadClasses)
</script>

<style scoped>
</style>
