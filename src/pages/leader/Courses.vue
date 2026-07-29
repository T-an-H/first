<template>
  <div class="space-y-6">
    <!-- 标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">课程总览</h1>
      <p class="text-gray-400 mt-1">查看本学院的所有课程信息（数据来源：MySQL）</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center">
          <BookOpen class="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p class="text-xs text-gray-400">总课程数</p>
          <p class="text-xl font-bold text-gray-900">{{ courses.length }}</p>
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
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input v-model="searchText" type="text" placeholder="搜索课程名称..."
        class="w-full pl-9 pr-4 py-2.5 border border-brand-400/20 rounded-lg text-sm bg-white focus:border-brand-400 outline-none" />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-12 text-gray-400">
      <LoaderCircle class="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
      <span>加载中...</span>
    </div>

    <!-- 课程卡片列表 -->
    <div v-else class="space-y-3">
      <div v-for="course in filteredCourses" :key="course.id"
        class="bg-white rounded-xl border border-brand-400/20 shadow-sm p-5 hover:shadow-md transition-all flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <BookOpen class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{{ course.title }}</h3>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ course.teacher }} · {{ course.status === 'active' ? '进行中' : '已结束' }}
            </p>
          </div>
        </div>
        <span class="text-xs px-2 py-0.5 rounded-full" :class="course.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'">
          {{ course.status === 'active' ? '进行中' : '已结束' }}
        </span>
      </div>
      <div v-if="filteredCourses.length === 0" class="text-center py-12 text-gray-400">
        暂无课程数据
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, BookOpen, Play, CheckCircle, LoaderCircle } from 'lucide-vue-next'
import { fetchDepartmentCourses } from '@/api'

const courses = ref<any[]>([])
const loading = ref(true)
const searchText = ref('')

const activeCount = computed(() => filteredCourses.value.filter((c: any) => c.status === 'active').length)
const inactiveCount = computed(() => filteredCourses.value.filter((c: any) => c.status !== 'active').length)

const filteredCourses = computed(() => {
  if (!searchText.value.trim()) return courses.value
  const q = searchText.value.trim().toLowerCase()
  return courses.value.filter((c: any) => c.title.toLowerCase().includes(q))
})

onMounted(async () => {
  try {
    // 从登录信息获取院系
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const dept = userInfo.department || '计算机学院'
    const res = await fetchDepartmentCourses(dept)
    if (res.success) courses.value = res.courses
  } catch (e) {
    console.error('加载课程失败:', e)
  } finally {
    loading.value = false
  }
})
</script>
