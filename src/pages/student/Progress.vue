<template>
  <div id="student-progress-root"></div>
</template>
<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const store = useAppStore()
const student = computed(() => store.students.find((s) => s.name === store.currentUser))
const myEnrollments = computed(() => store.enrollments.filter((e) => e.studentId === student.value?.id))

const getCourseName = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'
const getCourseCode = (id: string) => store.courses.find((c) => c.id === id)?.id || ''

const getGrade = (courseId: string) => {
  const grade = store.grades.find((g) => g.studentId === student.value?.id && g.courseId === courseId)
  return grade?.totalScore
}

const getGradeColor = (score: number | null) => {
  if (score === null || score === undefined) return 'text-gray-400'
  if (score >= 90) return 'text-emerald-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-brand-700'
  if (score >= 60) return 'text-brand-700'
  return 'text-red-600'
}

const getProgress = (courseId: string) => {
  const grade = getGrade(courseId)
  return grade ? Math.min(100, Math.round(grade)) : 0
}

const getRegularScore = (courseId: string) => {
  // 课程未开课时不展示评价成绩
  if (!store.isFirstClassStarted(courseId)) return 0
  const detail = store.detailedGrades.find((d) => d.studentId === student.value?.id && d.courseId === courseId)
  if (!detail) return 0
  const cfg = store.gradeConfigs[courseId]
  if (!cfg) return 0
  const scores = [detail.selfEvalScore || 0, detail.peerReviewScore || 0, detail.interGroupScore || 0, detail.teacherScore || 0, detail.mentorScore || 0]
  const weights = [cfg.selfEvalWeight || 0, cfg.peerReviewWeight || 0, cfg.interGroupEvalWeight || 0, cfg.teacherScoreWeight || 0, cfg.mentorScoreWeight || 0]
  const totalWeight = weights.reduce((s, w) => s + w, 0) || 1
  return Math.round(scores.reduce((s, sc, i) => s + sc * weights[i], 0) / totalWeight)
}

const getMidtermScore = (courseId: string) => {
  const detail = store.detailedGrades.find((d) => d.studentId === student.value?.id && d.courseId === courseId)
  if (!detail) return 0
  const cfg = store.gradeConfigs[courseId]
  if (!cfg) return 0
  const total = (cfg.midtermExamWeight || 0) + (cfg.midtermProjectWeight || 0) || 1
  return Math.round(((detail.midtermExamScore || 0) * (cfg.midtermExamWeight || 0) + (detail.midtermProjectScore || 0) * (cfg.midtermProjectWeight || 0)) / total)
}

const getFinalScore = (courseId: string) => {
  const detail = store.detailedGrades.find((d) => d.studentId === student.value?.id && d.courseId === courseId)
  if (!detail) return 0
  const cfg = store.gradeConfigs[courseId]
  if (!cfg) return 0
  const total = (cfg.finalExamWeight || 0) + (cfg.finalProjectWeight || 0) || 1
  return Math.round(((detail.finalExamScore || 0) * (cfg.finalExamWeight || 0) + (detail.finalProjectScore || 0) * (cfg.finalProjectWeight || 0)) / total)
}

function renderProgress(root: HTMLElement) {
  const container = d3.select(root)
  container.html('')

  // Header
  const header = container.append('div')
  header.append('h1').attr('class', 'text-2xl font-bold text-gray-900').text('学习进度')
  header.append('p').attr('class', 'text-gray-400 mt-1').text('查看各课程学习进度和成绩')

  // Enrollments list
  const listDiv = container.append('div').attr('class', 'space-y-4')

  const enrollments = myEnrollments.value
  if (enrollments.length === 0) {
    listDiv.append('div').attr('class', 'text-center py-12 text-gray-400').text('暂无课程数据')
    return
  }

  enrollments.forEach((enroll) => {
    const courseId = enroll.courseId
    const gradeVal = getGrade(courseId)

    const card = listDiv.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-5')

    // Header row with course name and grade
    const headerRow = card.append('div').attr('class', 'flex items-center justify-between mb-3')
    const leftSide = headerRow.append('div').attr('class', 'flex items-center gap-3')
    renderIcon(leftSide, 'bookOpen', 'w-5 h-5 text-gray-600')
    const nameDiv = leftSide.append('div')
    nameDiv.append('h3').attr('class', 'font-semibold text-gray-900').text(getCourseName(courseId))
    nameDiv.append('p').attr('class', 'text-xs text-gray-400').text(getCourseCode(courseId))

    headerRow.append('span')
      .attr('class', `text-lg font-bold ${getGradeColor(gradeVal)}`)
      .text(gradeVal ?? '-')

    // Progress bars
    const barsContainer = card.append('div').attr('class', 'space-y-2')

    // Progress bar helper
    function addBar(label: string, value: number, barColor: string) {
      const row = barsContainer.append('div').attr('class', 'flex items-center gap-2')
      row.append('span').attr('class', 'text-xs text-gray-400 w-16').text(label)
      const barTrack = row.append('div').attr('class', 'flex-1 h-2 bg-brand-400/10 rounded-full overflow-hidden')
      barTrack.append('div')
        .attr('class', `h-full rounded-full ${barColor}`)
        .style('width', `${value}%`)
      row.append('span').attr('class', 'text-xs text-gray-400 w-8').text(`${value}`)
    }

    addBar('学习进度', getProgress(courseId), 'bg-brand-600')
    addBar('平时成绩', getRegularScore(courseId), 'bg-emerald-500')
    addBar('期中成绩', getMidtermScore(courseId), 'bg-brand-600')
    addBar('期末成绩', getFinalScore(courseId), 'bg-purple-500')
  })
}

onMounted(() => {
  const root = document.getElementById('student-progress-root')
  if (root) renderProgress(root)
})

watch([myEnrollments], () => {
  const root = document.getElementById('student-progress-root')
  if (root) renderProgress(root)
}, { deep: true })
</script>
