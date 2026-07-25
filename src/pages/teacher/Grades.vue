<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">成绩查询</h1>
        <p class="text-gray-400 mt-1">查看学生成绩、课程统计概览，支持导出和打印</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="handleExportGrades"
          class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-brand-400/30 text-gray-400 hover:bg-brand-400/10 transition-colors">
          <Download class="w-4 h-4" />
          导出 Excel
        </button>
        <button @click="handlePrintGrades"
          class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-brand-400/30 text-gray-400 hover:bg-brand-400/10 transition-colors">
          <Printer class="w-4 h-4" />
          打印成绩表
        </button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="flex flex-wrap gap-4">
      <select v-model="selectedCourse"
        class="px-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm bg-white">
        <option value="all">全部课程</option>
        <option v-for="c in myCourses" :key="c.id" :value="c.id">{{ c.title }}</option>
      </select>
      <select v-model="selectedSemester"
        class="px-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm bg-white min-w-[160px]">
        <option v-for="(sem, idx) in SEMESTERS" :key="idx" :value="idx === SEMESTERS.length - 1 ? 'all' : String(idx)">{{ sem.label }}</option>
      </select>
      <div class="relative min-w-[200px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input v-model="gradeSearch" type="text" placeholder="搜索学生姓名..."
          class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm bg-white" />
      </div>
      <button @click="showStats = !showStats"
        class="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-800 rounded-lg border border-brand-400/30 bg-white">
        <BarChart3 class="w-4 h-4" />
        统计概览
        <ChevronUp v-if="showStats" class="w-3 h-3" />
        <ChevronDown v-else class="w-3 h-3" />
      </button>
      <span class="text-sm text-gray-400">
        已评 {{ stats.totalGraded }}/{{ stats.totalStudents }} 人
      </span>
    </div>

    <!-- 班级/分组过滤（仅具体课程时显示） -->
    <div v-if="selectedCourse !== 'all'" class="flex flex-wrap gap-4 items-center">
      <select v-model="gradeFilterClass"
        class="px-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm bg-white min-w-[140px]">
        <option value="">全部班级</option>
        <option v-for="cn in gradeClassOptions" :key="cn" :value="cn">{{ cn }}</option>
      </select>
      <select v-model="gradeFilterGroup"
        class="px-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm bg-white min-w-[140px]">
        <option value="">全部分组</option>
        <option v-for="gn in gradeGroupOptions" :key="gn" :value="gn">{{ gn }}</option>
      </select>
    </div>

    <!-- 统计概览（仅选择具体课程后显示） -->
    <div v-if="showStats && selectedCourse !== 'all'" class="bg-white rounded-xl border border-brand-400/20 shadow-sm p-5 space-y-4">
      <!-- 关键指标 -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-brand-600/10 rounded-lg p-3">
          <p class="text-xs text-gray-600 mb-0.5">平均分</p>
          <p class="text-xl font-bold text-gray-800">{{ stats.avg ?? '-' }}</p>
        </div>
        <div class="bg-brand-400/10 rounded-lg p-3">
          <p class="text-xs text-gray-600 mb-0.5">最高分</p>
          <p class="text-xl font-bold text-gray-800">{{ stats.max ?? '-' }}</p>
        </div>
        <div class="bg-brand-400/10 rounded-lg p-3">
          <p class="text-xs text-gray-400 mb-0.5">最低分</p>
          <p class="text-xl font-bold text-gray-800">{{ stats.min ?? '-' }}</p>
        </div>
        <div class="bg-brand-400/10 rounded-lg p-3">
          <p class="text-xs text-gray-600 mb-0.5">及格率</p>
          <p class="text-xl font-bold text-gray-800">{{ stats.passRate !== null ? `${stats.passRate}%` : '-' }}</p>
        </div>
        <div class="bg-brand-400/10 rounded-lg p-3">
          <p class="text-xs text-gray-400 mb-0.5">已评人数</p>
          <p class="text-xl font-bold text-gray-800">{{ stats.totalGraded }}</p>
        </div>
      </div>

      <!-- 成绩分布条形图 -->
      <div v-if="stats.scoresList.length > 0">
        <p class="text-xs font-medium text-gray-400 mb-2">成绩分布（{{ selectedCourseTitle }}）</p>
        <div class="space-y-1.5">
          <div v-for="d in distribution" :key="d.label" class="flex items-center gap-2">
            <span class="text-xs text-gray-400 w-8 text-right">{{ d.label }}</span>
            <div class="flex-1 bg-brand-400/10 rounded-full h-3 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :class="d.bar" :style="{ width: `${d.pct}%` }" />
            </div>
            <span class="text-xs text-gray-400 w-12">{{ d.count }}人 ({{ d.pct }}%)</span>
          </div>
        </div>
      </div>

      <!-- 知识掌握热力图 -->
      <div v-if="selectedCourse !== 'all'" class="mt-4 border-t border-brand-400/20 pt-4">
        <p class="text-xs font-medium text-gray-400 mb-2">知识掌握热力图（{{ getCourseTitle(selectedCourse) }}）</p>
        <div class="grid grid-cols-5 gap-1.5 max-w-md">
          <div v-for="kp in knowledgePoints" :key="kp.label" class="flex flex-col items-center gap-1">
            <div class="w-full aspect-square rounded-lg flex items-center justify-center text-white text-xs font-bold" :class="kp.color">
              {{ kp.mastery }}%
            </div>
            <span class="text-[9px] text-gray-400 text-center leading-tight">{{ kp.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 权重摘要 -->
    <div v-if="currentCfg" class="bg-brand-400/10 rounded-xl p-4 border border-brand-400/50 text-sm text-gray-800 flex flex-wrap gap-x-6 gap-y-1">
      <span>总成绩 = 平时 {{ currentCfg.regularWeight }}% + 期中 {{ currentCfg.midtermWeight }}% + 期末 {{ currentCfg.finalWeight }}%</span>
      <span>平时 = 自评 {{ currentCfg.selfEvalWeight }}% + 组内互评 {{ currentCfg.peerReviewWeight }}% + 组间互评 {{ currentCfg.interGroupEvalWeight }}% + 教师 {{ currentCfg.teacherScoreWeight }}% + 企业导师 {{ currentCfg.mentorScoreWeight }}%</span>
    </div>

    <!-- 成绩查询 - 卡片列表 -->
    <div ref="printRef">
      <div v-if="filteredEnrollments.length > 0">
        <!-- 具体课程：按班级展示 -->
        <template v-if="selectedCourse !== 'all'">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="(classBlock, ci) in filteredGradeClassBlocks" :key="ci"
              @click="selectedGradeClass = classBlock.className; showGradePopup = true"
              class="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-gray-800">班级 {{ classBlock.className || '未分班' }}</span>
                <ChevronRight class="w-4 h-4 text-gray-400" />
              </div>
              <div class="mt-1 flex items-center gap-2">
                <span class="text-xs text-gray-500">{{ classBlock.groups.reduce((a, g) => a + g.items.length, 0) }}人</span>
                <span v-for="(group, gi) in classBlock.groups" :key="gi" class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{{ group.groupName }}</span>
              </div>
            </div>
          </div>
        </template>
        <!-- 全部课程：按课程展示 -->
        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="courseId in myCourseIds" :key="courseId"
              @click="selectedCourse = courseId"
              class="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-gray-800">{{ getCourseTitle(courseId) }}</span>
                <ChevronRight class="w-4 h-4 text-gray-400" />
              </div>
              <div class="mt-1 text-xs text-gray-500">{{ getCourseEnrollmentsGrouped(courseId).reduce((a, g) => a + g.items.length, 0) }}人</div>
            </div>
          </div>
        </template>
      </div>
      <div v-else class="text-center py-8 text-gray-400">暂无数据</div>
    </div>

    <!-- 成绩弹窗 -->
    <div v-if="showGradePopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="closeGradePopup">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-brand-400/20">
          <h3 class="text-lg font-semibold text-gray-900">班级 {{ selectedGradeClass }} - 成绩查询</h3>
          <button @click="closeGradePopup" class="p-1 rounded-lg hover:bg-brand-400/10 transition-colors">
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <template v-if="currentGradeClassSection">
            <template v-for="(group, gi) in currentGradeClassSection.groups" :key="gi">
              <div class="mb-2">
                <span class="text-sm font-semibold text-gray-600">{{ group.groupName }}</span>
                <span class="text-[10px] text-gray-400 ml-1">{{ group.items.length }}人</span>
              </div>
              <table class="w-full min-w-[600px] mb-6">
                <thead>
                  <tr class="bg-brand-400/10 border-b border-brand-400/20">
                    <th class="text-left px-4 py-3 text-sm font-medium text-gray-400">学生</th>
                    <th class="text-center px-4 py-3 text-sm font-medium text-gray-400">总分</th>
                    <th class="text-center px-4 py-3 text-sm font-medium text-gray-400">等级</th>
                    <th class="text-center px-4 py-3 text-sm font-medium text-gray-400">评阅时间</th>
                    <th class="text-center px-4 py-3 text-sm font-medium text-gray-400">详情</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-brand-400/20">
                  <tr v-for="enr in group.items" :key="enr.id" class="hover:bg-brand-400/10 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-brand-600/15 flex items-center justify-center flex-shrink-0">
                          <span class="text-xs font-medium text-gray-600">{{ getStudentName(enr.studentId).charAt(0) }}</span>
                        </div>
                        <span class="text-sm font-medium text-gray-900 whitespace-nowrap">{{ getStudentName(enr.studentId) }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span v-if="getStudentTotal(enr)" class="font-semibold text-sm" :class="getTotalColorClass(getStudentTotal(enr)!)">
                        {{ getStudentTotal(enr) }}
                      </span>
                      <span v-else class="text-gray-400/60">-</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span v-if="getStudentTotal(enr)" class="text-xs px-2 py-0.5 rounded-full" :class="getGradeLevel(getStudentTotal(enr)!).color">
                        {{ getGradeLevel(getStudentTotal(enr)!).label }}
                      </span>
                      <span v-else class="text-gray-400/60">-</span>
                    </td>
                    <td class="px-4 py-3 text-center text-sm text-gray-400">
                      {{ getGradedAt(enr) || '-' }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <button v-if="getStudentTotal(enr) !== null"
                        @click="openDetail(enr)"
                        class="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-brand-600/10 transition-colors">
                        查看详情
                      </button>
                      <span v-else class="text-gray-400/60">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>
          </template>
          <div v-else class="text-center py-8 text-gray-400">暂无数据</div>
        </div>
        <div class="flex justify-end px-6 py-4 border-t border-brand-400/20">
          <button @click="closeGradePopup"
            class="px-4 py-2 text-sm font-medium rounded-lg border border-brand-400/30 text-gray-600 hover:bg-brand-400/10 transition-colors">
            关闭
          </button>
        </div>
      </div>
    </div>

    <!-- ScoreDetail Modal -->
    <ScoreDetail v-if="detailTarget"
      :open="true"
      :on-close="() => detailTarget = null"
      :student-name="detailTarget.studentName"
      :course-title="detailTarget.courseTitle"
      :detail="detailTargetDetail"
      :cfg="detailTargetCfg"
      :total-score="detailTargetTotalScore"
      :exam-scores="detailTargetExamScores"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { BarChart3, ChevronDown, ChevronUp, ChevronRight, Download, Printer, Search, X } from 'lucide-vue-next'
import ScoreDetail from '@/components/ScoreDetail.vue'
import type { DetailedGrade, Enrollment } from '@/types'

const store = useAppStore()

const GRADE_COLORS = [
  { range: [90, 100], label: '优秀', color: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  { range: [80, 89], label: '良好', color: 'bg-blue-100 text-blue-800', bar: 'bg-blue-500' },
  { range: [70, 79], label: '中等', color: 'bg-brand-50 text-brand-800', bar: 'bg-brand-600' },
  { range: [60, 69], label: '及格', color: 'bg-brand-50 text-brand-800', bar: 'bg-brand-600' },
  { range: [0, 59], label: '不及格', color: 'bg-red-100 text-red-800', bar: 'bg-red-500' },
]

const PASS_THRESHOLD = 60

const SEMESTERS = [
  { label: '2026年春季', start: '2026-02-01', end: '2026-06-30' },
  { label: '2026年秋季(当前)', start: '2026-09-01', end: '2027-01-31' },
  { label: '全部学期', start: '', end: '' },
]

// ====== State ======
const selectedCourse = ref('all')
const showStats = ref(true)
const selectedSemester = ref('all')
const gradeFilterClass = ref('')
const gradeFilterGroup = ref('')
const gradeSearch = ref('')
const showGradePopup = ref(false)
const detailTarget = ref<{ studentName: string; courseTitle: string; courseId: string; studentId: string } | null>(null)
const printRef = ref<HTMLElement | null>(null)

// ====== Computed ======
const isMentor = computed(() => store.currentRole === 'mentor')

const myCourses = computed(() => {
  if (isMentor.value) {
    const mentorCourseIds = store.getMentorCourseIds(store.currentUser || '')
    return store.courses.filter((c) => mentorCourseIds.includes(c.id))
  }
  return store.courses.filter((c) => c.teacher === store.currentUser)
})
const myCourseIds = computed(() => myCourses.value.map((c) => c.id))

const filteredEnrollments = computed(() => {
  return store.enrollments.filter((e) => {
    // 只显示该教师的课程
    if (!myCourseIds.value.includes(e.courseId)) return false
    // 排除退课学生
    if (e.status === 'dropped') return false
    // 按课程筛选
    if (selectedCourse.value !== 'all' && e.courseId !== selectedCourse.value) return false
    // 按学期筛选
    if (selectedSemester.value !== 'all') {
      const idx = parseInt(selectedSemester.value)
      if (!isNaN(idx) && idx >= 0 && idx < SEMESTERS.length) {
        const sem = SEMESTERS[idx]
        if (sem && sem.start) {
          const schedule = store.schedules.find((s) => s.id === e.scheduleId)
          if (!schedule || schedule.startDate < sem.start || schedule.startDate > sem.end) {
            return false
          }
        }
      }
    }
    return true
  })
})

const getStudentName = (id: string) => store.students.find((s) => s.id === id)?.name || '未知'
const getCourseTitle = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'
const getExisting = (studentId: string, courseId: string) =>
  store.detailedGrades.find((d) => d.studentId === studentId && d.courseId === courseId)

const stats = computed(() => {
  let courseGrades = selectedCourse.value === 'all'
    ? store.grades.filter((g) => myCourseIds.value.includes(g.courseId))
    : store.grades.filter((g) => g.courseId === selectedCourse.value)

  // 按学期过滤
  if (selectedSemester.value !== 'all') {
    const sem = SEMESTERS[parseInt(selectedSemester.value)]
    if (sem && sem.start) {
      courseGrades = courseGrades.filter((g) => g.gradedAt >= sem.start && g.gradedAt <= sem.end)
    }
  }

  const scoresList = courseGrades.map((g) => g.score)
  const avg = scoresList.length > 0 ? Math.round(scoresList.reduce((a, b) => a + b, 0) / scoresList.length) : null
  const max = scoresList.length > 0 ? Math.max(...scoresList) : null
  const min = scoresList.length > 0 ? Math.min(...scoresList) : null
  const passed = courseGrades.filter((g) => g.score >= PASS_THRESHOLD).length
  const passRate = scoresList.length > 0 ? Math.round((passed / scoresList.length) * 100) : null
  const totalGraded = scoresList.length
  const totalStudents = selectedCourse.value === 'all'
    ? store.enrollments.filter((e) => myCourseIds.value.includes(e.courseId) && e.status !== 'dropped').length
    : store.enrollments.filter((e) => e.courseId === selectedCourse.value && e.status !== 'dropped').length

  return { avg, max, min, passRate, totalGraded, totalStudents, scoresList }
})

const distribution = computed(() => {
  return GRADE_COLORS.map((g) => {
    const count = stats.value.scoresList.filter((s) => s >= g.range[0] && s <= g.range[1]).length
    const pct = stats.value.scoresList.length > 0 ? Math.round((count / stats.value.scoresList.length) * 100) : 0
    return { ...g, count, pct }
  })
})

const selectedCourseTitle = computed(() => selectedCourse.value === 'all' ? '全部课程' : getCourseTitle(selectedCourse.value))

const currentCfg = computed(() => selectedCourse.value !== 'all' ? store.getGradeConfig(selectedCourse.value) : null)

const knowledgePoints = computed(() => {
  if (selectedCourse.value === 'all') return []
  const courseGrades = store.grades.filter(g => g.courseId === selectedCourse.value)
  const sortedScores = courseGrades.map(g => g.score).sort((a, b) => a - b)
  const getMastery = (idx: number) => {
    if (sortedScores.length === 0) return 60
    const p = Math.floor((idx / 4) * (sortedScores.length - 1))
    return Math.min(100, Math.max(20, sortedScores[p]))
  }
  const labels = ['基础概念', '核心算法', '应用实践', '项目开发', '前沿探索']
  return labels.map((label, i) => {
    const mastery = getMastery(i)
    const color = mastery >= 85 ? 'bg-brand-600' : mastery >= 70 ? 'bg-brand-600' : mastery >= 60 ? 'bg-brand-600' : 'bg-brand-600'
    return { label, mastery, color }
  })
})

// ====== Detail target helpers ======
const detailTargetDetail = computed(() => {
  if (!detailTarget.value) return null
  return store.detailedGrades.find((d) => d.studentId === detailTarget.value!.studentId && d.courseId === detailTarget.value!.courseId) || null
})

const detailTargetCfg = computed(() => {
  if (!detailTarget.value) return null
  return store.getGradeConfig(detailTarget.value!.courseId)
})

const detailTargetTotalScore = computed(() => {
  if (!detailTarget.value) return 0
  return store.grades.find((g) => g.studentId === detailTarget.value!.studentId && g.courseId === detailTarget.value!.courseId)?.score ?? 0
})

const detailTargetExamScores = computed(() => {
  if (!detailTarget.value) return []
  return store.examScores.filter((s) => s.studentId === detailTarget.value!.studentId && s.courseId === detailTarget.value!.courseId)
})

// ====== Functions ======

/** 获取学生该课程的总分 */
function getStudentTotal(enr: Enrollment): number | null {
  const g = store.grades.find((g) => g.studentId === enr.studentId && g.courseId === enr.courseId)
  return g?.score ?? null
}

/** 获取评阅时间 */
function getGradedAt(enr: Enrollment): string {
  const g = store.grades.find((g) => g.studentId === enr.studentId && g.courseId === enr.courseId)
  return g?.gradedAt || ''
}

const getGradeLevel = (score: number) => {
  const level = GRADE_COLORS.find((g) => score >= g.range[0] && score <= g.range[1])
  return level || GRADE_COLORS[GRADE_COLORS.length - 1]
}

const getTotalColorClass = (total: number) => {
  if (total >= 90) return 'text-emerald-600'
  if (total >= 80) return 'text-blue-600'
  if (total >= 70) return 'text-brand-700'
  if (total >= 60) return 'text-brand-700'
  return 'text-red-500'
}

const openDetail = (enr: Enrollment) => {
  detailTarget.value = {
    studentName: getStudentName(enr.studentId),
    courseTitle: getCourseTitle(enr.courseId),
    courseId: enr.courseId,
    studentId: enr.studentId,
  }
}

/** 按班级+分组组织成绩数据（用于具体课程视图） */
const gradeClassBlocks = computed(() => {
  if (selectedCourse.value === 'all') return []
  const cId = selectedCourse.value
  let enrolled = filteredEnrollments.value.filter(e => e.courseId === cId)

  // 按姓名搜索过滤
  const search = gradeSearch.value.trim().toLowerCase()
  if (search) {
    enrolled = enrolled.filter(e => {
      const student = store.students.find(s => s.id === e.studentId)
      return student && (student.name.toLowerCase().includes(search) || student.id.toLowerCase().includes(search) || (student.studentId && student.studentId.toLowerCase().includes(search)))
    })
  }

  // 按班级分组
  const classMap = new Map<string, Enrollment[]>()
  for (const enr of enrolled) {
    const student = store.students.find(s => s.id === enr.studentId)
    const cn = student?.className || '未分班'
    if (!classMap.has(cn)) classMap.set(cn, [])
    classMap.get(cn)!.push(enr)
  }

  // 按分组组织
  const result: { className: string; groups: { groupName: string; items: Enrollment[] }[] }[] = []
  const groups = store.studentGroups.filter(g => g.courseId === cId)

  for (const [className, items] of classMap) {
    const memberToGroup = new Map<string, string>()
    for (const g of groups) {
      for (const mid of g.memberIds) {
        const student = store.students.find(s => s.id === mid)
        if (student && (student.className || '未分班') === className) {
          memberToGroup.set(mid, g.name)
        }
      }
    }

    const groupedMap = new Map<string, Enrollment[]>()
    const ungrouped: Enrollment[] = []
    for (const enr of items) {
      const groupName = memberToGroup.get(enr.studentId)
      if (groupName) {
        if (!groupedMap.has(groupName)) groupedMap.set(groupName, [])
        groupedMap.get(groupName)!.push(enr)
      } else {
        ungrouped.push(enr)
      }
    }

    const groupsArr: { groupName: string; items: Enrollment[] }[] = []
    for (const [name, members] of groupedMap) {
      groupsArr.push({ groupName: name, items: members })
    }
    if (ungrouped.length > 0) {
      groupsArr.push({ groupName: '未分组', items: ungrouped })
    }

    result.push({ className, groups: groupsArr })
  }
  return result
})

const gradeClassOptions = computed(() => {
  return [...new Set(gradeClassBlocks.value.map(b => b.className))]
})

const gradeGroupOptions = computed(() => {
  const block = gradeClassBlocks.value.find(b => b.className === gradeFilterClass.value)
  return block ? block.groups.map(g => g.groupName) : []
})

const filteredGradeClassBlocks = computed(() => {
  let blocks = gradeClassBlocks.value
  if (gradeFilterClass.value) {
    blocks = blocks.filter(b => b.className === gradeFilterClass.value)
  }
  if (gradeFilterGroup.value) {
    blocks = blocks.map(b => ({
      ...b,
      groups: b.groups.filter(g => g.groupName === gradeFilterGroup.value)
    })).filter(b => b.groups.length > 0)
  }
  return blocks
})

watch(gradeFilterClass, () => { gradeFilterGroup.value = '' })

const selectedGradeClass = ref('')
const currentGradeClassSection = computed(() => {
  if (!selectedGradeClass.value) return null
  return filteredGradeClassBlocks.value.find(cb => cb.className === selectedGradeClass.value) || null
})

function closeGradePopup() {
  showGradePopup.value = false
  selectedGradeClass.value = ''
}

/** 按课程分组获取班级+分组数据（用于全部课程视图） */
function getCourseEnrollmentsGrouped(courseId: string): { groupName: string; items: Enrollment[] }[] {
  const enrolled = filteredEnrollments.value.filter(e => e.courseId === courseId)

  // 按班级分组
  const classMap = new Map<string, Enrollment[]>()
  for (const enr of enrolled) {
    const student = store.students.find(s => s.id === enr.studentId)
    const cn = student?.className || '未分班'
    if (!classMap.has(cn)) classMap.set(cn, [])
    classMap.get(cn)!.push(enr)
  }

  // 按分组 + 班级前缀组织
  const groups = store.studentGroups.filter(g => g.courseId === courseId)
  const result: { groupName: string; items: Enrollment[] }[] = []

  for (const [className, items] of classMap) {
    const memberToGroup = new Map<string, string>()
    for (const g of groups) {
      for (const mid of g.memberIds) {
        const student = store.students.find(s => s.id === mid)
        if (student && (student.className || '未分班') === className) {
          memberToGroup.set(mid, g.name)
        }
      }
    }

    const groupedMap = new Map<string, Enrollment[]>()
    const ungrouped: Enrollment[] = []
    for (const enr of items) {
      const groupName = memberToGroup.get(enr.studentId)
      if (groupName) {
        if (!groupedMap.has(groupName)) groupedMap.set(groupName, [])
        groupedMap.get(groupName)!.push(enr)
      } else {
        ungrouped.push(enr)
      }
    }

    // 添加班级分组头
    result.push({ groupName: `班级 ${className}`, items: [] })
    for (const [name, members] of groupedMap) {
      result.push({ groupName: `  ${name}`, items: members })
    }
    if (ungrouped.length > 0) {
      result.push({ groupName: '  未分组', items: ungrouped })
    }
  }
  return result
}

/** 导出 Excel */
async function handleExportGrades() {
  try {
    const XLSX = await import('xlsx')
    const data = filteredEnrollments.value.map((enr) => {
      const total = getStudentTotal(enr)
      return {
        '学生姓名': getStudentName(enr.studentId),
        '课程': getCourseTitle(enr.courseId),
        '总分': total ?? '-',
        '等级': total !== null ? getGradeLevel(total).label : '-',
        '评阅时间': getGradedAt(enr) || '-',
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `成绩查询-${selectedCourseTitle.value}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('导出失败:', err)
    alert('导出失败')
  }
}

/** 打印成绩表 */
function handlePrintGrades() {
  if (!printRef.value) return
  const printContent = printRef.value.innerHTML
  const style = `
    <style>
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { padding: 10px 16px; text-align: left; border-bottom: 1px solid #d1d9e6; }
      th { background: #bac9bd; font-weight: 600; color: #429fc4; }
    </style>
  `
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(`
      <html>
        <head><title>成绩表 - ${selectedCourseTitle.value}</title>${style}</head>
        <body>
          <h2 style="text-align:center;margin:20px 0;font-size:20px;">成绩表 - ${selectedCourseTitle.value}</h2>
          ${printContent}
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }
}
</script>
