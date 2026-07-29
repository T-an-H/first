<template>
  <div class="space-y-6">
    <!-- ============ Level 1: 课程分类卡片 ============ -->
    <template v-if="!selectedCategory">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">课程管理</h1>
          <p class="text-gray-500 mt-1">
            当前学院：<span class="font-medium text-gray-700">{{ currentDeptName }}</span>
            — 管理课程分类，点击分类查看排课信息
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="switchDepartment" class="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw class="w-4 h-4" /> 切换学院
          </button>
          <button @click="openCategoryModal(null)" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Plus class="w-4 h-4" /> 新建课程分类
          </button>
        </div>
      </div>

      <!-- 分类卡片网格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="cat in departmentCategories"
          :key="cat.id"
          @click="selectCategory(cat)"
          class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ backgroundColor: cat.color }">
              <BookOpen class="w-5 h-5 text-white" />
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="openCategoryModal(cat)" class="text-xs px-2 py-1 text-blue-500 hover:bg-blue-50 rounded transition-colors">编辑</button>
              <button @click.stop="confirmDeleteCategory(cat)" class="text-xs px-2 py-1 text-red-400 hover:bg-red-50 rounded transition-colors">删除</button>
            </div>
          </div>
          <h3 class="font-semibold text-gray-900">{{ cat.name }}</h3>
          <p class="text-xs text-gray-400 mt-1">{{ getCategoryScheduleCount(cat.name) }} 条排课</p>
        </div>

        <div v-if="departmentCategories.length === 0" class="col-span-full text-center py-20 text-gray-400">
          <BookOpen class="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p class="mb-3">暂无课程分类，点击上方按钮新建</p>
          <p class="text-xs text-gray-300">创建分类后，可在分类下管理排课信息</p>
        </div>
      </div>
    </template>

    <!-- ============ Level 2: 排课表格 ============ -->
    <template v-else>
      <!-- 返回 + 标题 -->
      <div class="flex items-center gap-3 mb-2">
        <button @click="selectedCategory = null" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft class="w-4 h-4" /> 返回分类列表
        </button>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ backgroundColor: selectedCategory.color }">
            <BookOpen class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ selectedCategory.name }}</h1>
            <p class="text-gray-500 mt-1">{{ filteredSchedules.length }} 条排课记录</p>
          </div>
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

      <!-- 新增/编辑排课弹窗 -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="closeModal">
        <div class="absolute inset-0 bg-black/30" @click="closeModal" />
        <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-bold text-gray-900 mb-5">{{ editingSchedule ? '编辑排课' : '新增排课' }}</h3>

          <div class="space-y-4">
            <!-- 课程名称（自动填为分类名） -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">课程名称</label>
              <input :value="selectedCategory?.name" type="text" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 outline-none text-sm text-gray-500" readonly />
              <p class="text-[10px] text-gray-400 mt-0.5">自动使用分类名称</p>
            </div>

            <!-- 授课教师（手动输入） -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">授课教师</label>
              <input v-model="form.teacher" type="text" placeholder="输入教师姓名" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
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

            <!-- 周课表选时间 -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-2">
                选择上课时间（单击空格多选）
                <span v-if="selectedSlots.length" class="text-brand-600 ml-1">— 已选 {{ selectedSlots.length }} 个时段</span>
              </label>
              <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th class="p-2 text-left text-gray-400 font-medium w-[72px] border-r border-gray-200"></th>
                      <th v-for="d in dayLabels" :key="d" class="p-2 text-center text-gray-500 font-medium">{{ d }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="slot in timeSlots" :key="slot.label" class="border-b border-gray-100 last:border-b-0">
                      <td class="p-2 text-gray-400 border-r border-gray-100 text-[11px] text-center">{{ slot.label }}</td>
                      <td v-for="d in dayLabels" :key="d" class="p-1 border-r border-gray-100 last:border-r-0">
                        <div
                          @click="handleSlotClick(d, slot)"
                          class="relative rounded-md min-h-[36px] flex items-center justify-center text-center text-[11px] leading-tight cursor-pointer select-none transition-all duration-150"
                          :class="getCellClass(d, slot)"
                        >
                          {{ getCellContent(d, slot) }}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- 已选时段列表 -->
              <div v-if="selectedSlots.length" class="mt-2 space-y-1">
                <div class="text-xs text-gray-400">已选时段：</div>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="(sel, i) in selectedSlots"
                    :key="i"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-brand-50 text-brand-700 border border-brand-200"
                  >
                    {{ sel.dayLabel }} {{ sel.start }}-{{ sel.end }}
                    <button @click="selectedSlots.splice(i, 1)" class="text-brand-400 hover:text-brand-600">
                      <X class="w-3 h-3" />
                    </button>
                  </span>
                </div>
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

      <!-- 删除确认弹窗（排课） -->
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
    </template>

    <!-- ====== 分类新增/编辑弹窗 ====== -->
    <Teleport to="body">
      <div v-if="showCategoryModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showCategoryModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingCategory ? '编辑课程分类' : '新建课程分类' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
              <input v-model="categoryForm.name" type="text" placeholder="如：高数、物理" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <div class="flex items-center gap-2">
                <input v-model="categoryForm.color" type="color" class="w-10 h-10 rounded cursor-pointer" />
                <span class="text-sm text-gray-500">{{ categoryForm.color }}</span>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleSaveCategory" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
              <button @click="showCategoryModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 分类删除确认 -->
    <Teleport to="body">
      <div v-if="showDeleteCategoryConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showDeleteCategoryConfirm = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
          <p class="text-sm text-gray-500 mb-5">确定要删除分类「{{ deleteCategoryTarget?.name }}」吗？该分类下的课程和排课不会被删除。</p>
          <div class="flex gap-3">
            <button @click="handleDeleteCategory" class="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">确认删除</button>
            <button @click="showDeleteCategoryConfirm = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { Plus, Search, CalendarX, AlertTriangle, Upload, RefreshCw, BookOpen, ArrowLeft, X } from 'lucide-vue-next'
import type { Schedule, Category } from '@/types'
import { bulkImportSchedules, fetchClasses, fetchSchedules, updateSchedule as apiUpdateSchedule, deleteSchedule as apiDeleteSchedule } from '@/api'
import * as XLSX from 'xlsx'

const store = useAppStore()
const router = useRouter()

// ====== 当前学院 ======
const currentDept = computed(() => store.getSelectedDepartment())
const currentDeptName = computed(() => currentDept.value?.name || '')

// ====== 课程分类（仅当前学院）======
const departmentCategories = computed(() => {
  if (!store.selectedDepartmentId) return []
  return store.getDepartmentCategories(store.selectedDepartmentId)
})

function getCategoryScheduleCount(catName: string) {
  return dbSchedules.value.filter((s: any) => (s.title || '') === catName).length
}

// ====== Level 切换 ======
const selectedCategory = ref<Category | null>(null)

function selectCategory(cat: Category) {
  selectedCategory.value = cat
  searchText.value = ''
}

function switchDepartment() {
  store.setSelectedDepartment(null)
  router.push('/admin')
}

// ====== 分类管理 ======
const showCategoryModal = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryForm = ref({ name: '', color: '#3b82f6' })
const showDeleteCategoryConfirm = ref(false)
const deleteCategoryTarget = ref<Category | null>(null)

function openCategoryModal(cat: Category | null) {
  editingCategory.value = cat
  if (cat) {
    categoryForm.value = { name: cat.name, color: cat.color }
  } else {
    categoryForm.value = { name: '', color: '#3b82f6' }
  }
  showCategoryModal.value = true
}

function handleSaveCategory() {
  if (!categoryForm.value.name.trim()) return
  if (editingCategory.value) {
    store.updateCategory(editingCategory.value.id, {
      name: categoryForm.value.name.trim(),
      color: categoryForm.value.color,
    })
    if (selectedCategory.value?.id === editingCategory.value.id) {
      const updated = store.categories.find((c) => c.id === editingCategory.value!.id)
      if (updated) selectedCategory.value = updated
    }
  } else {
    store.addCategory({
      id: Date.now().toString(),
      name: categoryForm.value.name.trim(),
      color: categoryForm.value.color,
      courseCount: 0,
      departmentId: store.selectedDepartmentId || '',
    })
  }
  showCategoryModal.value = false
}

function confirmDeleteCategory(cat: Category) {
  deleteCategoryTarget.value = cat
  showDeleteCategoryConfirm.value = true
}

function handleDeleteCategory() {
  if (deleteCategoryTarget.value) {
    store.deleteCategory(deleteCategoryTarget.value.id)
    if (selectedCategory.value?.id === deleteCategoryTarget.value.id) {
      selectedCategory.value = null
    }
    showDeleteCategoryConfirm.value = false
    deleteCategoryTarget.value = null
  }
}

// ====== 班级列表 ======
const classList = ref<any[]>([])

// ====== 数据库加载 ======
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
    if (res.success && res.schedules?.length > 0) {
      dbSchedules.value = res.schedules
      return
    }
  } catch (e) {
    console.error('加载排课失败:', e)
  }
  // 后端无数据时使用本地 store（含管理端演示排课）
  dbSchedules.value = store.schedules
}

// ====== 搜索 ======
const searchText = ref('')

// 综合数据源：API + 本地store（去重）
const allSchedules = computed(() => {
  const ids = new Set<string>()
  const combined: any[] = []
  for (const s of [...dbSchedules.value, ...store.schedules]) {
    if (!ids.has((s as any).id)) {
      ids.add((s as any).id)
      combined.push(s)
    }
  }
  return combined
})

const filteredSchedules = computed(() => {
  if (!selectedCategory.value) return []

  // 按排课标题匹配分类名
  const catName = selectedCategory.value.name
  let result = allSchedules.value.filter((s: any) =>
    (s.title || '') === catName
  )

  // 搜索过滤
  const q = searchText.value.trim().toLowerCase()
  if (q) {
    result = result.filter((s: any) =>
      (s.teacher || '').toLowerCase().includes(q) ||
      (s.room || '').toLowerCase().includes(q) ||
      (s.className || '').toLowerCase().includes(q)
    )
  }
  return result
})

// ====== 获取课程名称 ======
function getCourseTitle(courseId: string): string {
  return store.courses.find((c) => c.id === courseId)?.title || courseId
}

// ====== 冲突检测 ======
function timesOverlap(a: string, b: string): boolean {
  const [aStart, aEnd] = a.split('-')
  const [bStart, bEnd] = b.split('-')
  if (!aStart || !aEnd || !bStart || !bEnd) return false
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd)
}

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

// ====== 周课表（多选） ======

/** 周一到周日（getDay(): 0=周日, 1=周一...6=周六） */
const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/** 常用课时段 */
const timeSlots = [
  { label: '08:00-10:00', start: '08:00', end: '10:00' },
  { label: '10:15-12:15', start: '10:15', end: '12:15' },
  { label: '14:00-16:00', start: '14:00', end: '16:00' },
  { label: '16:15-18:15', start: '16:15', end: '18:15' },
  { label: '19:00-21:00', start: '19:00', end: '21:00' },
]

/** 用户多选的时间段列表 */
interface SlotSelection {
  dayIdx: number
  dayLabel: string
  dateStr: string
  start: string
  end: string
}
const selectedSlots = ref<SlotSelection[]>([])

/** 计算最近某周几的日期 */
function getNextWeekday(dayIndex: number): string {
  const dayMap = [1, 2, 3, 4, 5, 6, 0]
  const targetDay = dayMap[dayIndex]
  const now = new Date()
  const currentDay = now.getDay()
  let diff = targetDay - currentDay
  if (diff <= 0) diff += 7
  const d = new Date(now)
  d.setDate(d.getDate() + diff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 当前分类的排课 → 按 周几+时间段 建立索引 */
const occupiedSlots = computed(() => {
  if (!selectedCategory.value) return new Set<string>()
  const catName = selectedCategory.value.name
  const set = new Set<string>()
  for (const s of allSchedules.value) {
    if ((s.title || '') !== catName) continue
    const d = new Date(s.startDate)
    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1
    const key = `${dayIdx}|${s.timeSlot}`
    set.add(key)
  }
  return set
})

/** 判断格子是否被用户选中 */
function isSlotSelected(dayIdx: number, start: string, end: string): boolean {
  return selectedSlots.value.some(
    (sel) => sel.dayIdx === dayIdx && sel.start === start && sel.end === end
  )
}

/** 判断格子样式 */
function getCellClass(day: string, slot: { start: string; end: string; label: string }): string {
  const dayIdx = dayLabels.indexOf(day)
  if (isSlotSelected(dayIdx, slot.start, slot.end)) {
    return 'bg-brand-100 border-2 border-brand-400 text-brand-700 font-medium'
  }
  return 'bg-gray-50 text-gray-400 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 border border-dashed border-gray-200'
}

/** 获取格子内容文本 */
function getCellContent(_day: string, _slot: { start: string; end: string; label: string }): string {
  return ''
}

/** 单击格子 → 切换多选 */
function handleSlotClick(day: string, slot: { start: string; end: string; label: string }) {
  const dayIdx = dayLabels.indexOf(day)
  // 切换选中状态
  const idx = selectedSlots.value.findIndex(
    (sel) => sel.dayIdx === dayIdx && sel.start === slot.start && sel.end === slot.end
  )
  if (idx >= 0) {
    selectedSlots.value.splice(idx, 1)
  } else {
    selectedSlots.value.push({
      dayIdx,
      dayLabel: day,
      dateStr: getNextWeekday(dayIdx),
      start: slot.start,
      end: slot.end,
    })
  }
}

/** 清除所有已选 */
function clearAllSlots() {
  selectedSlots.value = []
}

// ====== 新增/编辑弹窗 ======
const showModal = ref(false)
const editingSchedule = ref<Schedule | null>(null)
const form = ref({
  teacher: '',
  className: '',
  room: '',
  startDate: '',
  startTime: '09:00',
  endTime: '11:00',
})

const conflictWarning = computed(() => {
  if (!selectedCategory.value || !form.value.teacher || selectedSlots.value.length === 0) return ''

  // 检查每个已选时段是否有教师时间冲突
  for (const sel of selectedSlots.value) {
    const timeSlot = `${sel.start}-${sel.end}`
    const conflict = dbSchedules.value.some((s: any) => {
      if (editingSchedule.value && s.id === editingSchedule.value.id) return false
      if (s.startDate !== sel.dateStr) return false
      if (s.teacher !== form.value.teacher) return false
      return timesOverlap(s.timeSlot, timeSlot)
    })
    if (conflict) {
      return `「${form.value.teacher}」在 ${sel.dateStr} ${sel.dayLabel} ${timeSlot} 已有排课`
    }
  }
  return ''
})

const canSave = computed(() =>
  selectedCategory.value && form.value.teacher && form.value.room && selectedSlots.value.length > 0
)

function openAdd() {
  editingSchedule.value = null
  form.value = { teacher: '', className: '', room: '', startDate: '', startTime: '', endTime: '' }
  selectedSlots.value = []
  showModal.value = true
}

function openEdit(sch: Schedule) {
  editingSchedule.value = sch
  form.value = {
    teacher: sch.teacher,
    className: (sch as any).className || '',
    room: sch.room,
    startDate: sch.startDate,
    startTime: sch.timeSlot.split('-')[0],
    endTime: sch.timeSlot.split('-')[1] || '11:00',
  }
  selectedSlots.value = []
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingSchedule.value = null
  selectedSlots.value = []
}

function handleSave() {
  if (!selectedCategory.value || selectedSlots.value.length === 0) return
  const catName = selectedCategory.value.name
  const catCourseId = `cat-${selectedCategory.value.id}`

  // 为每个选中的时间段创建一条排课
  const newSchedules: any[] = selectedSlots.value.map((slot, i) => ({
    courseId: catCourseId,
    title: catName,
    className: form.value.className,
    startDate: slot.dateStr,
    endDate: slot.dateStr,
    timeSlot: `${slot.start}-${slot.end}`,
    room: form.value.room,
    teacher: form.value.teacher,
  }))

  // 发送到后端
  const doSave = bulkImportSchedules(newSchedules)

  doSave
    .then(() => {
      // 成功后刷新
      loadSchedules()
    })
    .catch(() => {
      // 后端不可用时，保存到本地 store
      const now = new Date().toISOString().split('T')[0]
      newSchedules.forEach((s, i) => {
        store.addSchedule({
          id: `local-${Date.now()}-${i}`,
          courseId: s.courseId,
          title: s.title,
          startDate: s.startDate,
          endDate: s.endDate,
          timeSlot: s.timeSlot,
          room: s.room,
          teacher: s.teacher,
        })
      })
      // 重新加载（从 store 取数据）
      loadSchedules()
    })

  closeModal()
}

// ====== 删除排课 ======
const deleteTarget = ref<Schedule | null>(null)

function confirmDelete(sch: Schedule) {
  deleteTarget.value = sch
}

function handleDelete() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  apiDeleteSchedule(id)
    .then(() => loadSchedules())
    .catch(() => {
      // 后端不可用时，从本地 store 删除
      store.deleteSchedule(id)
      loadSchedules()
    })
  deleteTarget.value = null
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
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      importMsg.value = { success: false, text: 'Excel 文件为空，请检查文件内容' }
      return
    }

    const schedules: any[] = []
    for (const row of rows) {
      const courseId = row['课程ID'] || row['courseId'] || row['课程编号'] || ''
      const title = row['课程名称'] || row['title'] || row['课程'] || ''
      const teacher = row['教师'] || row['teacher'] || row['授课教师'] || row['教师姓名'] || row['教师账号'] || ''
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

    const res = await bulkImportSchedules(schedules)
    await loadSchedules()
    importMsg.value = { success: true, text: res.message || `成功导入 ${schedules.length} 条排课记录` }
    setTimeout(() => { importMsg.value = null }, 5000)
  } catch (e: any) {
    importMsg.value = { success: false, text: '导入失败：' + (e.message || '未知错误') }
  }

  if (fileInput.value) fileInput.value.value = ''
}

function fmtExcelDate(val: string | number): string {
  if (!val) return ''
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
  let m = s.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/)
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  }
  m = s.match(/^(\d{1,2})[\/\.](\d{1,2})$/)
  if (m) {
    const year = new Date().getFullYear()
    return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  }
  return s
}
</script>
