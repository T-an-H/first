<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">我的课程</h1>
      <p class="text-gray-400 mt-1">管理课程、查看学员进度和评价</p>
    </div>

    <!-- 搜索栏 -->
    <div class="relative">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索课程名称…"
        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none transition-all"
      />
    </div>

    <!-- 课程卡片网格：放大版，任何版面仅左右 2 张 -->
    <div class="grid grid-cols-2 gap-6">
      <div
        v-for="course in sortedAndFilteredCourses" :key="course.id"
        @click="goDetail(course.id)"
        :class="[
          'group bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer',
          course.status === 'active'
            ? 'border-brand-400/20 hover:shadow-lg'
            : 'border-brand-400/30 opacity-60 hover:opacity-70'
        ]"
      >
        <!-- 渐变顶栏（无封面图，只做颜色区分） -->
        <div class="relative h-[160px]" :style="{ background: getCourseGradient(course.id) }">
          <!-- 已结束水印 -->
          <div v-if="course.status !== 'active'" class="absolute inset-0 flex items-center justify-center">
            <span class="text-white/50 text-lg font-bold tracking-widest -rotate-12 select-none">已结束</span>
          </div>

          <!-- 待评价红点标记（点击可溯源到评论管理） -->
          <button
            v-if="hasPendingEval(course.id)"
            @click.stop="goEval(course.id)"
            title="有未完成的评价，点击前往评论管理"
            class="absolute top-3 left-3 z-20 flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-red-500 text-white font-medium shadow cursor-pointer hover:bg-red-600 transition-colors">
            <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            待评价
          </button>

          <!-- 待配置红点标记（点击可溯源到成绩配置） -->
          <button
            v-if="isConfigPending(course.id)"
            @click.stop="goConfig(course.id)"
            title="成绩权重/评价方案尚未配置完成，点击前往成绩配置"
            class="absolute top-12 left-3 z-20 flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-amber-500 text-white font-medium shadow cursor-pointer hover:bg-amber-600 transition-colors">
            <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            待配置
          </button>

          <!-- 素质评价待批改红点标记（点击可溯源到素质评价管理） -->
          <button
            v-if="pendingQualityCount(course.id) > 0"
            @click.stop="goQualityEval(course.id)"
            :title="`有 ${pendingQualityCount(course.id)} 名学生提交的素质评价待批改，点击前往素质评价管理`"
            class="absolute top-[84px] left-3 z-20 flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-orange-500 text-white font-medium shadow cursor-pointer hover:bg-orange-600 transition-colors">
            <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            素质评价待批改
          </button>

          <!-- 状态标签 - 右上角 -->
          <span :class="`absolute top-3 right-3 z-10 text-xs px-2.5 py-1 rounded-full font-medium ${
            course.status === 'active'
              ? 'bg-white/20 text-white backdrop-blur-sm'
              : 'bg-white/10 text-white/60 backdrop-blur-sm'
          }`">
            <span class="inline-block w-1.5 h-1.5 rounded-full mr-1" :class="course.status === 'active' ? 'bg-white' : 'bg-white/40'"></span>
            {{ course.status === 'active' ? '进行中' : '已结束' }}
          </span>

          <!-- 课程标题 -->
          <div class="absolute bottom-3 left-4 right-4">
            <h3 class="text-white font-bold text-2xl leading-tight truncate">{{ course.title }}</h3>
          </div>
        </div>

        <!-- 卡片内容区域 -->
        <div class="p-7 space-y-5">
          <!-- 老师名字 -->
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <User class="w-4 h-4 text-gray-400" />
            <span>授课老师：<strong>{{ course.teacher }}</strong></span>
            <span class="ml-auto text-xs text-gray-400">
              <Users class="w-3.5 h-3.5 inline mr-0.5 -mt-0.5" />
              {{ studentCount(course.id) }} 名学生
            </span>
          </div>

          <!-- 课程介绍 -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">课程介绍</p>
            <p class="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {{ course.description || '暂无描述' }}
            </p>
          </div>

          <!-- 课程进度 -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">课程进度</span>
              <span class="text-sm font-semibold text-brand-600">{{ getCourseProgress(course.id) }}%</span>
            </div>
            <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-brand-400 transition-all duration-500"
                :style="{ width: getCourseProgress(course.id) + '%' }">
              </div>
            </div>
          </div>

          <!-- AI 分层分布（与学生端 AI 分层测试结果关联） -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI 分层分布</span>
              <span class="text-[10px] text-gray-400">{{ studentCount(course.id) }} 名学生</span>
            </div>
            <div v-if="studentCount(course.id) > 0" class="flex items-center gap-6">
              <div class="relative w-[140px] h-[140px] flex-shrink-0">
                <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                  <circle v-for="seg in tierPieSegments(course.id)" :key="seg.key" cx="50" cy="50" r="40" fill="none"
                    stroke-width="18" :stroke="seg.color" :stroke-dasharray="seg.dash" :stroke-dashoffset="seg.offset" />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-3xl font-bold text-gray-800 leading-none">{{ studentCount(course.id) }}</span>
                  <span class="text-xs text-gray-400 mt-1 leading-none">学生数</span>
                </div>
              </div>
              <div class="flex-1 grid grid-cols-1 gap-y-2.5">
                <div v-for="item in tierLegend(course.id)" :key="item.label" class="flex items-center gap-2 text-sm text-gray-600">
                  <span class="w-3.5 h-3.5 rounded-sm flex-shrink-0" :style="{ background: item.color }"></span>
                  <span>{{ item.label }}</span>
                  <span class="ml-auto font-semibold text-gray-800">{{ item.count }}人</span>
                </div>
              </div>
            </div>
            <div v-else class="flex items-center justify-center py-6 rounded-lg bg-gray-50 text-sm text-gray-400">暂无学生</div>
          </div>

          <!-- 底部操作 -->
          <div class="flex items-center justify-between pt-1 border-t border-gray-100">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
              :class="course.status === 'active' ? 'bg-brand-600/10 text-gray-600 border-brand-400' : 'bg-brand-400/10 text-gray-400 border-brand-400/30'">
              <BookOpen class="w-3.5 h-3.5" />
              {{ course.status === 'active' ? '教学进行中' : '课程已结束' }}
            </span>

            <span class="inline-flex items-center gap-1 text-xs font-medium transition-colors"
              :class="course.status === 'active' ? 'text-gray-600 group-hover:text-gray-800' : 'text-gray-400'">
              {{ course.status === 'active' ? '管理课程' : '查看详情' }}
              <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>


      <div v-if="myCourses.length === 0" class="col-span-2 text-center py-16 text-gray-400">
        <BookOpen class="w-12 h-12 mx-auto mb-4 text-gray-200" />
        <p>暂无课程</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

import {
  BookOpen, User, Users, Search, ArrowRight
} from 'lucide-vue-next'
import type { Course } from '@/types'


const router = useRouter()
const route = useRoute()
const store = useAppStore()

/** 导师模式：纯导师登录，或学院领导以导师身份进入 /mentor 路由 */
const isMentor = computed(() => store.currentRole === 'mentor' || route.path.startsWith('/mentor'))
const isLeaderWithTeaching = computed(() => store.leaders.some((l) => (l.name === store.currentUser || l.name === store.currentDisplayName) && l.asTeacher))

const searchQuery = ref('')
const dbCourses = ref<any[]>([])
const loading = ref(true)

onMounted(() => {
  // 清理可能被覆盖的 localStorage 课程缓存
  const stored = localStorage.getItem('courses')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // 如果存的是没有 title 的脏数据，清掉
      if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].title) {
        localStorage.removeItem('courses')
      }
    } catch { /* ignore */ }
  }
  // 课程数据由 store.initFromDatabase() 从数据库(course_db)拉取，此处直接使用 store
  loading.value = false
})

const sortedAndFilteredCourses = computed(() => {
  let list: Course[]
  if (dbCourses.value.length > 0) {
    list = dbCourses.value as any
  } else if (loading.value) {
    return []
  } else if (isMentor.value) {
    const mentorCourseIds = store.getMentorCourseIds(store.currentUser || '')
    list = store.courses.filter((c) => mentorCourseIds.includes(c.id))
  } else if (isLeaderWithTeaching.value) {
    list = store.getLeaderTeacherCourses(store.currentUser || '')
  } else {
    list = store.courses.filter((c) => c.teacher === store.currentUser)
  }
  // 按名称搜索
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((c) => c.title.toLowerCase().includes(q))
  }
  // 排序：活跃课程按名称字母先后 → 已结束放最后
  return [...list].sort((a, b) => {
    if (a.status !== 'active' && b.status === 'active') return 1
    if (a.status === 'active' && b.status !== 'active') return -1
    return a.title.localeCompare(b.title)
  })
})

const myCourses = computed(() => {
  if (isMentor.value) {
    const mentorCourseIds = store.getMentorCourseIds(store.currentUser || '')
    return store.courses.filter((c) => mentorCourseIds.includes(c.id))
  }
  if (isLeaderWithTeaching.value) {
    return store.getLeaderTeacherCourses(store.currentUser || '')
  }
  return store.courses.filter((c) => c.teacher === store.currentUser)
})

/** 根据课程 ID 分配不同的蓝色渐变配色 */
const gradients = [
  'linear-gradient(135deg, #1e3a5f, #2563eb)',
  'linear-gradient(135deg, #1e40af, #3b82f6)',
  'linear-gradient(135deg, #1e3a8a, #60a5fa)',
  'linear-gradient(135deg, #0f172a, #1e40af)',
  'linear-gradient(135deg, #1e3a5f, #3b82f6)',
  'linear-gradient(135deg, #1e40af, #60a5fa)',
  'linear-gradient(135deg, #1e3a8a, #93c5fd)',
  'linear-gradient(135deg, #0f172a, #2563eb)',
]


function getCourseGradient(courseId: string): string {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash = ((hash << 5) - hash) + courseId.charCodeAt(i)
  }
  hash |= 0
  return gradients[Math.abs(hash) % gradients.length]
}


function studentCount(courseId: string) {
  return store.enrollments.filter((e) => e.courseId === courseId && e.status !== 'dropped').length
}

function getCourseProgress(courseId: string): number {
  const courseEnrollments = store.enrollments.filter(e => e.courseId === courseId && e.status !== 'dropped')
  if (courseEnrollments.length === 0) return 0
  const avg = courseEnrollments.reduce((sum, e) => sum + e.progress, 0) / courseEnrollments.length
  return Math.round(avg)
}

// ===== AI 分层分布（饼图） =====
const TIER_COLORS: Record<string, string> = {
  excellent: '#10b981', // 卓越层（翠绿）
  advanced: '#3b82f6',  // 进阶层（蓝）
  basic: '#f59e0b',     // 基础层（琥珀）
  untested: '#d1d5db',  // 未分层（灰）
}
const TIER_ORDER = ['excellent', 'advanced', 'basic', 'untested'] as const
const TIER_LABELS: Record<string, string> = { excellent: '卓越层', advanced: '进阶层', basic: '基础层', untested: '未分层' }

/** 统计某课程内各 AI 分层人数（关联学生端分层记录） */
function getTierDistribution(courseId: string): Record<string, number> {
  const dist: Record<string, number> = { excellent: 0, advanced: 0, basic: 0, untested: 0 }
  for (const e of store.enrollments) {
    if (e.courseId !== courseId || e.status === 'dropped') continue
    const rec = store.getStudentTier(courseId, e.studentId)
    if (rec && rec.tier in dist) dist[rec.tier]++
    else dist.untested++
  }
  return dist
}

/** 生成饼图扇区（SVG circle stroke-dasharray 方案，r=40，周长 C≈251.3） */
function tierPieSegments(courseId: string) {
  const dist = getTierDistribution(courseId)
  const total = studentCount(courseId)
  if (total === 0) return []
  const C = 2 * Math.PI * 40
  let acc = 0
  return TIER_ORDER.filter((k) => dist[k] > 0).map((k) => {
    const len = (dist[k] / total) * C
    const seg = { key: k, color: TIER_COLORS[k], dash: `${len} ${C - len}`, offset: -acc }
    acc += len
    return seg
  })
}

/** 饼图图例（含未分层，仅显示人数 > 0 的项） */
function tierLegend(courseId: string) {
  const dist = getTierDistribution(courseId)
  return TIER_ORDER.filter((k) => dist[k] > 0).map((k) => ({
    label: TIER_LABELS[k],
    color: TIER_COLORS[k],
    count: dist[k],
  }))
}

function goDetail(courseId: string) {
  router.push(`${isMentor.value ? '/mentor' : '/teacher'}/courses/${courseId}`)
}

/** 当前教师/导师是否有该课程的待完成评价（用于红点溯源） */
function hasPendingEval(courseId: string) {
  return store.hasPendingEvalForCourse(courseId)
}

/** 待评价红点溯源：直达评论管理（评价填写）tab */
function goEval(courseId: string) {
  router.push(`${isMentor.value ? '/mentor' : '/teacher'}/courses/${courseId}?tab=comments`)
}

/** 该课程是否仍有未完成的成绩权重/评价方案配置（教师/领导教师显示红点） */
function isConfigPending(courseId: string) {
  if (!store.currentUser) return false
  const course = store.courses.find((c) => c.id === courseId)
  if (!course) return false
  const canConfig = course.teacher === store.currentUser || store.isLeaderTeacherCourse(store.currentUser, courseId)
  return canConfig && store.isCourseConfigPending(courseId)
}

/** 待配置红点溯源：直达成绩配置 tab */
function goConfig(courseId: string) {
  router.push(`${isMentor.value ? '/mentor' : '/teacher'}/courses/${courseId}?tab=grade-config`)
}

/** 该课程中「最新提交尚未批改」的素质评价学生人数（授课教师/领导教师显示红点） */
function pendingQualityCount(courseId: string) {
  if (!store.currentUser) return 0
  const course = store.courses.find((c) => c.id === courseId)
  if (!course) return 0
  const canGrade = course.teacher === store.currentUser || store.isLeaderTeacherCourse(store.currentUser, courseId)
  if (!canGrade) return 0
  return store.countPendingQualitySubmissions(courseId)
}

/** 素质评价待批改红点溯源：直达素质评价管理 tab */
function goQualityEval(courseId: string) {
  router.push(`${isMentor.value ? '/mentor' : '/teacher'}/courses/${courseId}?tab=quality-eval`)
}
</script>

