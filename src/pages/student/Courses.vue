<template>
  <div id="student-courses-root"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'
import type { Enrollment } from '@/types'

const router = useRouter()
const store = useAppStore()

const student = computed(() => store.students.find((s) => s.name === store.currentUser || s.name === store.currentDisplayName))

const enrolledCourses = computed(() => {
  if (!student.value) return []
  return store.enrollments.filter((e) => e.studentId === student.value!.id)
})

const getCourse = (courseId: string) => store.courses.find((c) => c.id === courseId)

const getTeacherInfo = (teacherName: string) => store.teachers.find((t) => t.name === teacherName)

const getTeacherAvatar = (teacherName: string) => {
  const teacher = store.teachers.find((t) => t.name === teacherName)
  return teacher?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherName}`
}

const isEnded = (enrollment: Enrollment) => {
  const course = getCourse(enrollment.courseId)
  return course?.status !== 'active' || enrollment.status === 'completed' || enrollment.status === 'dropped'
}

const hasPendingEval = (enrollment: Enrollment) => {
  return store.evalReminders.some(
    (r) =>
      r.studentId === enrollment.studentId &&
      r.courseId === enrollment.courseId &&
      (r.status === 'pending' || r.status === 'overdue')
  )
}

const getTierBadge = (courseId: string) => {
  if (!student.value) return null
  const record = store.getStudentTier(courseId, student.value.id)
  if (!record) return null
  const map: Record<string, { class: string; label: string }> = {
    basic: { class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-600/15 text-gray-800 border border-brand-400/50', label: '基础层' },
    advanced: { class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-600/15 text-gray-800 border border-brand-400', label: '进阶层' },
    excellent: { class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-600/15 text-gray-800 border border-brand-400', label: '卓越层' },
  }
  return map[record.tier] || null
}

const progressBarColor = (progress: number) => {
  if (progress >= 80) return 'bg-brand-600'
  if (progress >= 40) return 'bg-brand-600'
  return 'bg-brand-600'
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'enrolled':
      return 'bg-brand-600/10 text-gray-600 border border-brand-400'
    case 'in_progress':
      return 'bg-brand-400/10 text-emerald-600 border border-brand-400'
    case 'completed':
      return 'bg-brand-400/10 text-gray-600 border border-brand-400/30'
    case 'dropped':
      return 'bg-brand-600/10 text-gray-600 border border-brand-400'
    default:
      return 'bg-brand-400/10 text-gray-600 border border-brand-400/30'
  }
}

const statusIconName = (status: string) => {
  switch (status) {
    case 'enrolled':
      return 'clock'
    case 'in_progress':
      return 'bookOpen'
    case 'completed':
      return 'checkCircle'
    case 'dropped':
      return 'alertCircle'
    default:
      return 'clock'
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'enrolled':
      return '已报名'
    case 'in_progress':
      return '学习中'
    case 'completed':
      return '已完成'
    case 'dropped':
      return '已退课'
    default:
      return status
  }
}

function renderCourses(root: HTMLElement) {
  const container = d3.select(root)
  container.html('')

  // Header
  const header = container.append('div')
  header.append('h1').attr('class', 'text-2xl font-bold text-gray-900').text('我的课程')
  header.append('p').attr('class', 'text-gray-500 mt-1').text('查看已选课程的学习进度')

  // Grid
  const grid = container.append('div').attr('class', 'grid grid-cols-1 md:grid-cols-2 gap-5')

  const enrollments = enrolledCourses.value
  if (enrollments.length === 0) {
    const emptyDiv = grid.append('div').attr('class', 'col-span-full text-center py-16 text-gray-400')
    renderIcon(emptyDiv, 'bookOpen', 'w-12 h-12 mx-auto mb-4 text-gray-400')
    emptyDiv.append('p').text('暂无已选课程')
    return
  }

  enrollments.forEach((enrollment) => {
    const course = getCourse(enrollment.courseId)
    const ended = isEnded(enrollment)
    const pendingEval = !ended && hasPendingEval(enrollment)
    const tierBadge = getTierBadge(enrollment.courseId)

    const cardClasses = [
      'group bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden relative cursor-pointer',
      ended ? 'border-brand-400/30 opacity-60 hover:opacity-70' : 'border-brand-400/20 hover:shadow-lg'
    ].join(' ')

    const card = grid.append('div').attr('class', cardClasses)
      .attr('title', pendingEval ? '有未完成的评价，点击进入评价填写' : '')
      .on('click', () => router.push(`/student/courses/${enrollment.courseId}${pendingEval ? '?tab=evaluations' : ''}`))

    // 待评价红点标记（可点击 → 直达评价填写处，实现红点溯源）
    if (pendingEval) {
      const evalBadge = card.append('div').attr('class', 'absolute top-3 right-3 z-20 cursor-pointer')
        .attr('title', '有未完成的评价，点击前往评价填写')
        .on('click', (event) => {
          event.stopPropagation()
          router.push(`/student/courses/${enrollment.courseId}?tab=evaluations`)
        })
      const span = evalBadge.append('span').attr('class', 'relative inline-flex')
      renderIcon(span, 'alertCircle', 'w-5 h-5 text-gray-600')
      span.append('span').attr('class', 'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse')
    }

    // AI 分层标记
    if (tierBadge) {
      const tierDiv = card.append('div').attr('class', `absolute top-3 left-3 z-10 ${tierBadge.class}`)
      renderIcon(tierDiv, 'layers', 'w-3 h-3')
      tierDiv.append('span').text(tierBadge.label)
    }

    // 封面图区域
    const coverDiv = card.append('div')
      .attr('class', 'relative h-36 bg-gradient-to-br from-brand-600 to-brand-600 overflow-hidden')

    if (course?.cover) {
      const imgClasses = [
        'w-full h-full object-cover transition-transform duration-300',
        ended ? 'grayscale' : 'group-hover:scale-105'
      ].join(' ')
      coverDiv.append('img')
        .attr('src', course.cover)
        .attr('alt', course.title || '')
        .attr('class', imgClasses)
    }
    coverDiv.append('div').attr('class', 'absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent')

    // 已结束水印
    if (ended) {
      const watermark = coverDiv.append('div').attr('class', 'absolute inset-0 flex items-center justify-center')
      watermark.append('span').attr('class', 'text-white/50 text-lg font-bold tracking-widest -rotate-12 select-none').text('已结束')
    }

    // 封面底部信息
    const bottomInfo = coverDiv.append('div').attr('class', 'absolute bottom-3 left-4 right-4')
    bottomInfo.append('h3').attr('class', 'text-white font-bold text-lg leading-tight truncate').text(course?.title || '')
    const badgeRow = bottomInfo.append('div').attr('class', 'flex items-center gap-2 mt-1')
    badgeRow.append('span').attr('class', 'text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full')
      .text(`${course?.credits || 0} 学分`)
    badgeRow.append('span').attr('class', 'text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full')
      .text(`${course?.duration || 0} 课时`)

    // 卡片内容区域
    const contentDiv = card.append('div').attr('class', 'p-4 space-y-3')

    // 课程大纲
    const descSection = contentDiv.append('div')
    descSection.append('p').attr('class', 'text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1').text('课程大纲')
    descSection.append('p').attr('class', 'text-sm text-gray-600 line-clamp-2 leading-relaxed')
      .text(course?.description || '暂无描述')

    // 老师信息
    const teacherName = course?.teacher || ''
    const teacherDiv = contentDiv.append('div').attr('class', 'flex items-center gap-3 py-2 border-t border-gray-50')
    teacherDiv.append('img')
      .attr('src', getTeacherAvatar(teacherName))
      .attr('alt', teacherName)
      .attr('class', 'w-8 h-8 rounded-full bg-gray-100 object-cover')
    const teacherInfo = teacherDiv.append('div').attr('class', 'flex-1 min-w-0')
    teacherInfo.append('p').attr('class', 'text-sm font-medium text-gray-900 truncate').text(teacherName)
    const teacherContact = getTeacherInfo(teacherName)
    if (teacherContact) {
      teacherInfo.append('p').attr('class', 'text-xs text-gray-400 truncate').text(teacherContact.email || '')
    }

    // 进度条
    const progressSection = contentDiv.append('div')
    const progressLabel = progressSection.append('div').attr('class', 'flex justify-between text-xs text-gray-500 mb-1')
    progressLabel.append('span').text('学习进度')
    progressLabel.append('span').text(`${enrollment.progress}%`)
    const barOuter = progressSection.append('div').attr('class', 'w-full h-2 bg-gray-100 rounded-full overflow-hidden')
    barOuter.append('div')
      .attr('class', `h-full rounded-full transition-all duration-300 ${progressBarColor(enrollment.progress)}`)
      .style('width', `${enrollment.progress}%`)

    // 底部状态 + 操作
    const footerDiv = contentDiv.append('div').attr('class', 'flex items-center justify-between pt-1')
    const badgeSpan = footerDiv.append('span')
      .attr('class', `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(enrollment.status)}`)
    renderIcon(badgeSpan, statusIconName(enrollment.status) as any, 'w-3.5 h-3.5')
    badgeSpan.append('span').text(statusLabel(enrollment.status))

    const actionLink = footerDiv.append('span')
      .attr('class', `inline-flex items-center gap-1 text-xs font-medium transition-colors ${ended ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-800'}`)
    actionLink.text(ended ? '查看记录' : '进入学习')
    renderIcon(actionLink, 'arrowRight', 'w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5')
  })
}

onMounted(() => {
  const root = document.getElementById('student-courses-root')
  if (root) renderCourses(root)
})

watch([enrolledCourses], () => {
  const root = document.getElementById('student-courses-root')
  if (root) renderCourses(root)
}, { deep: true })
</script>
