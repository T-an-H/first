<template>
  <div class="space-y-6">
    <!-- ====== Level 1: Category Grid ====== -->
    <template v-if="!selectedCategory">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">分类管理</h1>
          <p class="text-gray-500 mt-1">管理课程分类信息，点击分类查看课程</p>
        </div>
        <button @click="openCategoryModal(null)" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus class="w-4 h-4" /> 新建分类
        </button>
      </div>

      <!-- ====== Sync Bar ====== -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span>最近一次同步时间：</span>
          <span class="font-medium text-gray-700">{{ lastSyncTime || '暂无同步记录' }}</span>
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

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="cat in apiCategories"
          :key="cat.id"
          class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group"
          @click="selectCategory(cat)"
        >
          <div class="flex items-start justify-between mb-3">
            <div :class="'w-10 h-10 rounded-lg flex items-center justify-center'" :style="{ backgroundColor: cat.color }">
              <BookOpen class="w-5 h-5 text-white" />
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="openCategoryModal(cat)" class="text-xs px-2 py-1 text-blue-500 hover:bg-blue-50 rounded transition-colors">编辑</button>
              <button @click.stop="handleDeleteCategory(cat)" class="text-xs px-2 py-1 text-red-400 hover:bg-red-50 rounded transition-colors">删除</button>
            </div>
          </div>
          <h3 class="font-semibold text-gray-900">{{ cat.name }}</h3>
          <p class="text-xs text-gray-400 mt-1">{{ getCourseCount(cat.id) }} 门课程</p>
        </div>
        <div v-if="apiCategories.length === 0" class="col-span-full text-center py-20 text-gray-400">
          <BookOpen class="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无分类，点击上方按钮新建</p>
        </div>
      </div>
    </template>

    <!-- ====== Level 2: Filtered Course List ====== -->
    <template v-else>
      <!-- Back + Title -->
      <div class="flex items-center gap-3 mb-2">
        <button @click="selectedCategory = null" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft class="w-4 h-4" /> 返回分类列表
        </button>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div :class="'w-10 h-10 rounded-lg flex items-center justify-center'" :style="{ backgroundColor: selectedCategory.color }">
            <BookOpen class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ selectedCategory.name }}</h1>
            <p class="text-gray-500 mt-1">{{ filteredCourses.length }} 门课程</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="openCategoryModal(selectedCategory)" class="flex items-center gap-1 px-3 py-2 text-sm text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
            <PenLine class="w-4 h-4" /> 编辑分类
          </button>
          <button @click="handleDeleteCategory(selectedCategory)" class="flex items-center gap-1 px-3 py-2 text-sm text-red-400 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 class="w-4 h-4" /> 删除分类
          </button>
          <button @click="openCourseModal(null)" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Plus class="w-4 h-4" /> 新建课程
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="relative">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchText" type="text" placeholder="搜索课程名称..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
      </div>

      <!-- Course Table -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">课程名称</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">教师</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in filteredCourses" :key="course.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" @click="openCourseDetail(course)">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div :class="'w-8 h-8 rounded-lg flex items-center justify-center'" :style="{ backgroundColor: selectedCategory.color }">
                    <BookOpen class="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ course.title }}</p>
                    <p class="text-xs text-gray-400">{{ course.id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ course.teacher }}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-1 rounded-full" :class="statusClass(course.status)">
                  {{ statusLabel(course.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button @click.stop="openCourseModal(course)" class="text-xs text-blue-500 hover:underline mr-3">编辑</button>
                <button @click.stop="handleDeleteCourse(course)" class="text-xs text-red-400 hover:underline">删除</button>
              </td>
            </tr>
            <tr v-if="filteredCourses.length === 0">
              <td colspan="4" class="px-4 py-12 text-center text-gray-400">暂无课程数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ====== Course Detail Modal ====== -->
    <Modal :is-open="showCourseDetail" :on-close="closeCourseDetail" :title="detailCourse?.title || '课程详情'" max-width="max-w-2xl">
      <div v-if="detailCourse" class="space-y-5">
        <!-- 状态 + 描述 -->
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusClass(detailCourse.status)">{{ statusLabel(detailCourse.status) }}</span>
          <span v-if="detailCourse.credits" class="text-xs text-gray-400">{{ detailCourse.credits }} 学分</span>
          <span v-if="detailCourse.duration" class="text-xs text-gray-400">{{ detailCourse.duration }} 课时</span>
        </div>
        <p v-if="detailCourse.description" class="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">{{ detailCourse.description }}</p>

        <!-- 信息网格 -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <BookOpen class="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div>
              <p class="text-xs text-gray-400">分类</p>
              <p class="font-medium text-gray-800">{{ getCategoryName(detailCourse.categoryId) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
            <GraduationCap class="w-4 h-4 text-purple-500 flex-shrink-0" />
            <div>
              <p class="text-xs text-gray-400">授课教师</p>
              <p class="font-medium text-gray-800">{{ detailCourse.teacher }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
            <Award class="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div>
              <p class="text-xs text-gray-400">企业导师</p>
              <p class="font-medium text-gray-800">{{ detailCourse.mentor || '无' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Users class="w-4 h-4 text-green-500 flex-shrink-0" />
            <div>
              <p class="text-xs text-gray-400">选课学生</p>
              <p class="font-medium text-gray-800">{{ getStudentCount(detailCourse.id) }} 人</p>
            </div>
          </div>
          <div class="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg">
            <Clock class="w-4 h-4 text-cyan-500 flex-shrink-0" />
            <div>
              <p class="text-xs text-gray-400">创建时间</p>
              <p class="font-medium text-gray-800">{{ detailCourse.createdAt }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
            <BookOpen class="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div>
              <p class="text-xs text-gray-400">课程编号</p>
              <p class="font-medium text-gray-800">{{ detailCourse.id }}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <!-- ====== Category Create/Edit Modal ====== -->
    <Teleport to="body">
      <div v-if="showCategoryModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showCategoryModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingCategory ? '编辑分类' : '新建分类' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
              <input v-model="categoryForm.name" type="text" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <div class="flex gap-2">
                <input v-model="categoryForm.color" type="color" class="w-10 h-10 rounded cursor-pointer" />
                <span class="text-sm text-gray-500 self-center">{{ categoryForm.color }}</span>
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

    <!-- ====== Course Create/Edit Modal ====== -->
    <Teleport to="body">
      <div v-if="showCourseModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showCourseModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingCourse ? '编辑课程' : '新建课程' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
              <input v-model="courseForm.title" type="text" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
              <textarea v-model="courseForm.description" rows="2" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select v-model="courseForm.categoryId" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
                <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">教师</label>
              <select v-model="courseForm.teacher" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
                <option v-for="t in store.teachers" :key="t.id" :value="t.name">{{ t.name }}</option>
              </select>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleSaveCourse" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
              <button @click="showCourseModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ====== Sync Result Modal ====== -->
    <Teleport to="body">
      <div v-if="showSyncResult" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="closeSyncResult" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
          <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle class="w-7 h-7 text-green-500" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">同步完成</h3>
          <p class="text-xs text-gray-400 mb-5">{{ lastSyncTime }}</p>
          <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-5">
            <div class="flex justify-between">
              <span class="text-gray-500">新增</span>
              <span class="font-medium text-green-600">+{{ syncResult.added }} 条</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">更新</span>
              <span class="font-medium text-blue-600">{{ syncResult.updated }} 条</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">失败</span>
              <span class="font-medium text-red-500">{{ syncResult.failed }} 条</span>
            </div>
          </div>
          <button @click="closeSyncResult" class="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            知道了
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { Plus, Search, BookOpen, ArrowLeft, PenLine, Trash2, RefreshCw, Loader2, CheckCircle, Users, Clock, GraduationCap, Award } from 'lucide-vue-next'
import type { Category, Course } from '@/types'
import { fetchCategories, fetchCourses, syncCategoriesFromSchedules } from '@/api'

const store = useAppStore()

// 从 API 加载的分类和课程数据
const apiCategories = ref<any[]>([])
const apiCourses = ref<any[]>([])

onMounted(() => loadData())

async function loadData() {
  try {
    const [catRes, courseRes] = await Promise.all([fetchCategories(), fetchCourses()])
    if (catRes.success) {
      apiCategories.value = catRes.categories
      // 同时更新 store 让其他页面也能用
      store.categories = catRes.categories
    }
    if (courseRes.success) {
      apiCourses.value = courseRes.courses
      // 不要覆盖 store.courses（它包含 status/cover 等完整的课程信息）
    }
  } catch (e) {
    console.error('加载分类数据失败:', e)
  }
}

// ====== Level state ======
const selectedCategory = ref<Category | null>(null)
const searchText = ref('')

// ====== Category modal state ======
const showCategoryModal = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryForm = ref({ name: '', color: '#3b82f6' })

// ====== Course modal state ======
const showCourseModal = ref(false)
const editingCourse = ref<Course | null>(null)
const courseForm = ref({ title: '', description: '', categoryId: '', teacher: '' })

// ====== Computed ======
const filteredCourses = computed(() => {
  if (!selectedCategory.value) return []
  return apiCourses.value.filter((c: any) => {
    if (c.categoryId !== selectedCategory.value!.id) return false
    if (searchText.value && !c.title.includes(searchText.value)) return false
    return true
  })
})

const getCourseCount = (catId: string) => apiCourses.value.filter((c: any) => c.categoryId === catId).length

// ====== Sync state ======
/*
 * 【真实业务同步规则 - 后端实现参考】
 * 1. 后端请求第三方教务系统获取学生、教师信息；
 * 2. 使用学号作为学生唯一匹配键，教工号作为教师唯一匹配键；
 * 3. 数据库不存在对应人员则自动新增账号；已存在相同编号人员则更新信息；
 * 4. 缺失学号/教工号、字段格式异常的数据判定为失败数据，不予入库；
 * 5. 常态依靠后端定时任务自动同步，该按钮仅作为管理员应急手动触发入口。
 */
const isSyncing = ref(false)
const showSyncResult = ref(false)
const syncResult = ref({ added: 0, updated: 0, failed: 0 })
const lastSyncTime = ref(localStorage.getItem('lastSyncTime') || '')

function formatNow(): string {
  const d = getNow()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function handleSync() {
  if (isSyncing.value) return
  isSyncing.value = true

  syncCategoriesFromSchedules().then((res) => {
    syncResult.value = {
      added: res.added ?? 0,
      updated: res.updated ?? 0,
      failed: res.failed ?? 0,
    }
    isSyncing.value = false
    showSyncResult.value = true
    // 同步后刷新数据
    loadData()
  }).catch((e) => {
    isSyncing.value = false
    syncResult.value = { added: 0, updated: 0, failed: 1 }
    showSyncResult.value = true
  })
}

function closeSyncResult() {
  showSyncResult.value = false
  lastSyncTime.value = formatNow()
  localStorage.setItem('lastSyncTime', lastSyncTime.value)
}

// ====== Category actions ======
function selectCategory(cat: Category) {
  selectedCategory.value = cat
  searchText.value = ''
}

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
  if (editingCategory.value) {
    store.updateCategory(editingCategory.value.id, { name: categoryForm.value.name, color: categoryForm.value.color })
    // If editing the currently selected category, update the reference
    if (selectedCategory.value?.id === editingCategory.value.id) {
      const updated = store.categories.find((c) => c.id === editingCategory.value!.id)
      if (updated) selectedCategory.value = updated
    }
  } else {
    store.addCategory({ id: Date.now().toString(), name: categoryForm.value.name, color: categoryForm.value.color, courseCount: 0 })
  }
  showCategoryModal.value = false
}

function handleDeleteCategory(cat: Category) {
  if (!confirm(`确定要删除分类"${cat.name}"吗？该分类下的课程不会被删除。`)) return
  store.deleteCategory(cat.id)
  if (selectedCategory.value?.id === cat.id) {
    selectedCategory.value = null
  }
}

function handleDeleteCourse(course: any) {
  if (!confirm(`确定要删除课程"${course.title}"吗？`)) return
  store.deleteCourse(course.id)
  // 同时从 apiCourses 中移除
  apiCourses.value = apiCourses.value.filter((c: any) => c.id !== course.id)
  // 重新加载分类数据
  loadData()
}

// ====== Course detail modal ======
const showCourseDetail = ref(false)
const detailCourse = ref<Course | null>(null)

function openCourseDetail(course: Course) {
  detailCourse.value = course
  showCourseDetail.value = true
}

function closeCourseDetail() {
  showCourseDetail.value = false
  detailCourse.value = null
}

const getCategoryName = (catId: string) => store.categories.find((c) => c.id === catId)?.name || '未知分类'

const getStudentCount = (courseId: string) => store.enrollments.filter((e) => e.courseId === courseId).length

const statusLabel = (status: string) => {
  if (status === 'active') return '进行中'
  if (status === 'inactive') return '已结束'
  return '草稿'
}

const statusClass = (status: string) => {
  if (status === 'active') return 'bg-green-50 text-green-600'
  if (status === 'inactive') return 'bg-gray-100 text-gray-500'
  return 'bg-yellow-50 text-yellow-600'
}

// ====== Course actions ======
function openCourseModal(course: Course | null) {
  editingCourse.value = course
  if (course) {
    courseForm.value = { title: course.title, description: course.description, categoryId: course.categoryId, teacher: course.teacher }
  } else {
    courseForm.value = { title: '', description: '', categoryId: selectedCategory.value?.id || '', teacher: '' }
  }
  showCourseModal.value = true
}

function handleSaveCourse() {
  if (editingCourse.value) {
    store.updateCourse(editingCourse.value.id, {
      title: courseForm.value.title,
      description: courseForm.value.description,
      categoryId: courseForm.value.categoryId,
      teacher: courseForm.value.teacher,
    })
  } else {
    store.addCourse({
      id: Date.now().toString(),
      title: courseForm.value.title,
      description: courseForm.value.description,
      categoryId: courseForm.value.categoryId,
      teacher: courseForm.value.teacher,
      cover: '',
      credits: 0,
      duration: 0,
      status: 'active',
      createdAt: getNow().toISOString(),
    })
  }
  showCourseModal.value = false
  editingCourse.value = null
  courseForm.value = { title: '', description: '', categoryId: selectedCategory.value?.id || '', teacher: '' }
}
</script>
