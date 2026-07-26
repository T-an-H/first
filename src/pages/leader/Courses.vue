<template>
  <div class="space-y-6">
    <!-- 标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">课程总览</h1>
      <p class="text-gray-400 mt-1">查看管辖学院的所有课程信息</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center">
          <BookOpen class="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400">总课程数</p>
          <p class="text-xl font-bold text-gray-900">{{ filteredCourses.length }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center">
          <Play class="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400">进行中</p>
          <p class="text-xl font-bold text-gray-900">{{ activeCount }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-brand-400/10 flex items-center justify-center">
          <CheckCircle class="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p class="text-xs text-gray-400">已结束</p>
          <p class="text-xl font-bold text-gray-900">{{ inactiveCount }}</p>
        </div>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="relative max-w-sm">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input v-model="searchText" type="text" placeholder="搜索课程名称..."
        class="w-full pl-9 pr-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none text-sm" />
    </div>

    <!-- 按分类分组的课程列表 -->
    <div v-for="cat in filteredCategories" :key="cat.id" class="bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden">
      <!-- 分类头部 -->
      <div class="px-5 py-4 border-b border-brand-400/20 flex items-center gap-3">
        <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: cat.color }" />
        <h2 class="text-base font-semibold text-gray-900">{{ cat.name }}</h2>
        <span class="text-xs text-gray-400 ml-auto">{{ getCategoryCourseCount(cat.id) }} 门课程</span>
      </div>

      <!-- 课程列表 -->
      <div class="divide-y divide-gray-50">
        <div v-if="getCoursesByCategory(cat.id).length === 0" class="px-5 py-8 text-center text-sm text-gray-400">
          暂无课程
        </div>
        <div v-for="course in getCoursesByCategory(cat.id)" :key="course.id"
          class="px-5 py-4 hover:bg-brand-400/10 transition-colors cursor-pointer"
          @click="openDetail(course)">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <!-- 名称 + 状态 -->
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-sm font-medium text-brand-600 hover:underline truncate">{{ course.title }}</h3>
                <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0" :class="statusBadgeClass(course.status)">
                  {{ statusLabel(course.status) }}
                </span>
              </div>
              <!-- 元信息 -->
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                <span>导师：{{ course.teacher }}</span>
                <span v-if="course.mentor">企业导师：{{ course.mentor }}</span>
                <span>{{ course.credits }} 学分</span>
                <span>课时：{{ course.duration }}</span>
                <span>学生：{{ getStudentCount(course.id) }} 人</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredCategories.length === 0" class="bg-white rounded-xl border border-brand-400/20 shadow-sm p-12 text-center">
      <BookOpen class="w-12 h-12 mx-auto mb-3 text-gray-200" />
      <p class="text-sm text-gray-400">暂无匹配课程数据</p>
    </div>

    <!-- 课程详情弹窗 -->
    <Modal :is-open="detailModalOpen" :on-close="closeDetail" :title="detailCourse?.title || '课程详情'" max-width="max-w-3xl">
      <div v-if="detailCourse" class="space-y-6">
        <!-- 课程基本信息 -->
        <div class="bg-brand-400/5 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <BookOpen class="w-5 h-5 text-brand-600" />
              <h3 class="text-lg font-semibold text-gray-900">{{ detailCourse.title }}</h3>
              <span class="text-xs px-2 py-0.5 rounded-full" :class="statusBadgeClass(detailCourse.status)">
                {{ statusLabel(detailCourse.status) }}
              </span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="flex justify-between border-b border-brand-400/10 pb-1">
              <span class="text-gray-400">分类</span>
              <span class="font-medium text-gray-800">{{ getCategoryName(detailCourse.categoryId) }}</span>
            </div>
            <div class="flex justify-between border-b border-brand-400/10 pb-1">
              <span class="text-gray-400">导师</span>
              <span class="font-medium text-gray-800">{{ detailCourse.teacher }}</span>
            </div>
            <div class="flex justify-between border-b border-brand-400/10 pb-1">
              <span class="text-gray-400">企业导师</span>
              <span class="font-medium text-gray-800">{{ detailCourse.mentor || '无' }}</span>
            </div>
            <div class="flex justify-between border-b border-brand-400/10 pb-1">
              <span class="text-gray-400">学分</span>
              <span class="font-medium text-gray-800">{{ detailCourse.credits }}</span>
            </div>
            <div class="flex justify-between border-b border-brand-400/10 pb-1">
              <span class="text-gray-400">课时</span>
              <span class="font-medium text-gray-800">{{ detailCourse.duration }}</span>
            </div>
            <div class="flex justify-between border-b border-brand-400/10 pb-1">
              <span class="text-gray-400">学生数</span>
              <span class="font-medium text-gray-800">{{ getStudentCount(detailCourse.id) }} 人</span>
            </div>
          </div>
          <p v-if="detailCourse.description" class="mt-3 text-sm text-gray-600 leading-relaxed">{{ detailCourse.description }}</p>
        </div>

        <!-- 已选学员（按班级分组） -->
        <div>
          <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users class="w-4 h-4 text-brand-600" />
            选课学员（{{ enrolledStudents.length }}人）
          </h4>

          <div v-if="enrolledStudents.length === 0" class="text-center py-6 text-gray-400 text-sm">暂无学员选课</div>

          <div v-for="cls in enrolledClassList" :key="cls" class="mb-4 last:mb-0">
            <div class="flex items-center gap-2 mb-2">
              <Users class="w-3.5 h-3.5 text-gray-400" />
              <span class="text-xs font-semibold text-gray-700">{{ cls }}</span>
              <span class="text-xs text-gray-400">（{{ groupedEnrolledStudents[cls]?.length || 0 }}人）</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div v-for="s in groupedEnrolledStudents[cls] || []" :key="s.id"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-400/20 bg-brand-400/5">
                <div class="w-7 h-7 rounded-full bg-brand-600/15 flex items-center justify-center flex-shrink-0">
                  <span class="text-[10px] font-bold text-gray-600">{{ s.name[0] }}</span>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-medium text-gray-800 truncate">{{ s.name }}</p>
                  <p class="text-[10px] text-gray-400 truncate">{{ s.studentId }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Search, BookOpen, Play, CheckCircle, Users } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import type { Course } from '@/types'

const store = useAppStore()

// ===== 数据 =====
const allCourses = computed(() => store.getLeaderCourses(store.currentUser))
const activeCount = computed(() => filteredCourses.value.filter((c) => c.status === 'active').length)
const inactiveCount = computed(() => filteredCourses.value.filter((c) => c.status === 'inactive').length)

// ===== 搜索 =====
const searchText = ref('')

const filteredCourses = computed(() => {
  if (!searchText.value.trim()) return allCourses.value
  const q = searchText.value.trim().toLowerCase()
  return allCourses.value.filter((c) => c.title.toLowerCase().includes(q))
})

// ===== 分类 =====
const categories = computed(() => {
  const catIds = new Set(allCourses.value.map((c) => c.categoryId))
  return store.categories.filter((cat) => catIds.has(cat.id))
})

const filteredCategories = computed(() =>
  categories.value.filter((cat) => getCoursesByCategory(cat.id).length > 0)
)

function getCoursesByCategory(categoryId: string): Course[] {
  return filteredCourses.value.filter((c) => c.categoryId === categoryId)
}

function getCategoryCourseCount(categoryId: string): number {
  return getCoursesByCategory(categoryId).length
}

function getStudentCount(courseId: string): number {
  return store.enrollments.filter((e) => e.courseId === courseId).length
}

function getCategoryName(categoryId: string): string {
  return store.categories.find((c) => c.id === categoryId)?.name || '未知'
}

// ===== 状态标签 =====
function statusLabel(status: string): string {
  if (status === 'active') return '进行中'
  if (status === 'inactive') return '已结束'
  return '草稿'
}

function statusBadgeClass(status: string): string {
  if (status === 'active') return 'bg-brand-600/10 text-gray-600'
  if (status === 'inactive') return 'bg-brand-400/10 text-gray-400'
  return 'bg-brand-400/10 text-gray-400'
}

// ===== 详情弹窗 =====
const detailModalOpen = ref(false)
const detailCourse = ref<Course | null>(null)

function openDetail(course: Course) {
  detailCourse.value = course
  detailModalOpen.value = true
}

function closeDetail() {
  detailModalOpen.value = false
  detailCourse.value = null
}

// ===== 弹窗内学员数据 =====
const enrolledStudents = computed(() => {
  if (!detailCourse.value) return []
  const enrollmentStudentIds = store.enrollments
    .filter((e) => e.courseId === detailCourse.value!.id)
    .map((e) => e.studentId)
  return store.students.filter((s) => enrollmentStudentIds.includes(s.id))
})

const groupedEnrolledStudents = computed(() => {
  const map: Record<string, any[]> = {}
  for (const s of enrolledStudents.value) {
    const cls = s.className || '未分类'
    if (!map[cls]) map[cls] = []
    map[cls].push(s)
  }
  return map
})

const enrolledClassList = computed(() =>
  Object.keys(groupedEnrolledStudents.value).sort()
)
</script>
