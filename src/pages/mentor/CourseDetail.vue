<template>
  <div id="mentor-course-detail-root"></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import type { Schedule } from '@/types'
import { EvalTemplateLabels, EvalFrequencyLabels, EvalTypeLabels, EvalTypeColors, TEMPLATE_EVAL_TYPES } from '@/types'
import type { EvalType } from '@/types'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'
import { getNow } from '@/lib/date'

const route = useRoute()
const store = useAppStore()

const courseId = computed(() => route.params.id as string)
const course = computed(() => store.courses.find((c) => c.id === courseId.value))

const scoreInputs = ref<Record<string, number>>({})

const courseSchedules = computed(() =>
  store.schedules.filter((s) => s.courseId === courseId.value)
)

const sortedCourseSchedules = computed(() =>
  [...courseSchedules.value].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
)

const ALL_EVAL_TYPES: EvalType[] = ['self', 'intra_group', 'inter_group', 'teacher', 'mentor']

const activeTab = ref<string>('schedule')

const schedulesWithStatus = computed(() => {
  const sorted = [...courseSchedules.value].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
  // 以第一节课开课时间作为参考基准，学期前所有课程均显示为"待上课"
  const referenceDate = getNow()
  referenceDate.setHours(0, 0, 0, 0)
  const completed: (Schedule & { isCompleted: boolean; originalIndex: number })[] = []
  const upcoming: (Schedule & { isCompleted: boolean; originalIndex: number })[] = []
  sorted.forEach((sch, i) => {
    if (new Date(sch.endDate) < referenceDate) {
      completed.push({ ...sch, isCompleted: true, originalIndex: i })
    } else {
      upcoming.push({ ...sch, isCompleted: false, originalIndex: i })
    }
  })
  return [...upcoming, ...completed]
})

const completedCount = computed(() =>
  schedulesWithStatus.value.filter((s) => s.isCompleted).length
)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const enrolledStudents = computed(() => {
  if (!courseId.value) return []
  return store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => ({
      enrollmentId: e.id,
      student: store.students.find((s) => s.id === e.studentId),
    }))
    .filter((e) => e.student)
})

function isSubmitted(studentId: string): boolean {
  return store.isTeacherEvalSubmitted(courseId.value || '', studentId, 1, 'mentor')
}

function getSubmittedScore(studentId: string): number | string {
  const score = store.getSubmittedTeacherScore(courseId.value || '', studentId, 1, 'mentor')
  return score !== null ? score : '-'
}

function handleSubmitEval(studentId: string) {
  if (!courseId.value) return
  const score = scoreInputs.value[studentId]
  if (score === undefined || score === null || score < 0 || score > 100) return

  const existing = store.evaluations.find(
    (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === 'mentor' && e.sessionNumber === 1
  )

  const ev = {
    id: existing ? existing.id : `ev-mentor-${Date.now()}-${studentId}`,
    courseId: courseId.value,
    studentId,
    sessionNumber: 1,
    type: 'mentor' as const,
    score,
    evaluatorId: store.currentUser || '',
    evaluatorName: store.currentUser || '企业导师',
    createdAt: getNow().toISOString().split('T')[0],
  }

  if (existing) {
    store.updateEvaluation(ev.id, { score, createdAt: ev.createdAt })
  } else {
    store.addEvaluation(ev)
  }

  store.submitTeacherEval(courseId.value, studentId, 1, 'mentor')
  delete scoreInputs.value[studentId]

  const el = document.getElementById('mentor-course-detail-root')
  if (el) renderCourseDetail(el)
}

function renderCourseDetail(root: HTMLElement) {
  const container = d3.select(root)
  container.selectAll('*').remove()

  const c = course.value
  const students = enrolledStudents.value

  // 返回按钮 + 课程信息
  const headerDiv = container.append('div').attr('class', 'flex items-center gap-3')

  const backBtn = headerDiv.append('button')
    .attr('class', 'p-2 rounded-lg hover:bg-brand-400/10 transition-colors')
    .on('click', () => history.back())
  renderIcon(backBtn, 'arrowLeft').attr('class', 'w-5 h-5 text-gray-400')

  const infoDiv = headerDiv.append('div').attr('class', 'flex-1')
  infoDiv.append('h1').attr('class', 'text-2xl font-bold text-gray-900').text(c?.title || '课程详情')
  infoDiv.append('p').attr('class', 'text-gray-400 mt-1').text(`${c?.duration || ''}课时 · 授课导师：${c?.teacher || '未知'}`)

  const statusSpan = headerDiv.append('span')
    .attr('class', `text-xs px-2 py-0.5 rounded-full ${c?.status === 'active' ? 'bg-brand-600/10 text-gray-600' : 'bg-brand-400/10 text-gray-400'}`)
    .text(c?.status === 'active' ? '进行中' : '已结束')

  // 当前选中 tab
  const tab = activeTab.value

  // 课程描述
  const descDiv = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-5')
  descDiv.append('h2').attr('class', 'font-semibold text-gray-900 mb-2').text('课程简介')
  descDiv.append('p').attr('class', 'text-sm text-gray-600 leading-relaxed').text(c?.description || '暂无描述')

  // Tab 切换
  const tabBar = container.append('div').attr('class', 'flex gap-1 border-b border-brand-400/20')
  const tabs = [
    { key: 'schedule', label: '课程管理', icon: 'calendar' },
    { key: 'comments', label: '评论管理', icon: 'clipboardCheck' },
  ] as const
  tabs.forEach((t) => {
    tabBar.append('button')
      .attr('class', `px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${tab === t.key ? 'bg-white text-blue-600 border border-b-0 border-brand-400/20 -mb-px' : 'text-gray-500 hover:text-gray-700'}`)
      .on('click', () => { activeTab.value = t.key; renderCourseDetail(root) })
      .call((sel) => { renderIcon(sel, t.icon).attr('class', 'w-4 h-4 inline mr-1.5'); sel.append('span').text(t.label) })
  })

  // Tab: 课程管理
  if (tab === 'schedule') {
    const schedules = schedulesWithStatus.value
    const scheduleDiv = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-5')
    const scheduleHeader = scheduleDiv.append('div').attr('class', 'flex items-center gap-2 mb-4')
    renderIcon(scheduleHeader, 'calendar').attr('class', 'w-5 h-5 text-gray-400')
    scheduleHeader.append('span').attr('class', 'text-sm font-medium text-gray-700').text('课程时间')
    const headerInfo = scheduleHeader.append('span').attr('class', 'text-xs text-gray-400')
    headerInfo.text(`共 ${sortedCourseSchedules.value.length} 次课`)
    if (completedCount.value > 0) {
      headerInfo.append('span').text(` · ${completedCount.value} 次已完成`)
    }

    if (schedules.length > 0) {
      schedules.forEach((sch) => {
        const row = scheduleDiv.append('div')
          .attr('class', `flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${sch.isCompleted ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-brand-400/5 border-brand-400/20'}`)
          .style('margin-top', '8px')

        const leftDiv = row.append('div').attr('class', 'flex items-center gap-3')
        leftDiv.append('span')
          .attr('class', `text-xs font-medium min-w-[2rem] ${sch.isCompleted ? 'text-gray-400 line-through' : 'text-gray-600'}`)
          .text(`第${sch.originalIndex + 1}次`)

        const startSpan = leftDiv.append('span')
          .attr('class', `text-xs px-2 py-0.5 rounded border ${sch.isCompleted ? 'bg-gray-100 border-gray-300 text-gray-400 line-through' : 'bg-white border-brand-400/30 text-gray-600'}`)
          .text(sch.startDate)
        leftDiv.append('span').attr('class', 'text-xs text-gray-400').text('~')
        const endSpan = leftDiv.append('span')
          .attr('class', `text-xs px-2 py-0.5 rounded border ${sch.isCompleted ? 'bg-gray-100 border-gray-300 text-gray-400 line-through' : 'bg-white border-brand-400/30 text-gray-600'}`)
          .text(sch.endDate)
        leftDiv.append('span').attr('class', `text-xs ${sch.isCompleted ? 'text-gray-400 line-through' : 'text-gray-500'}`).text(sch.timeSlot)
        if (sch.room) {
          leftDiv.append('span').attr('class', `text-xs ${sch.isCompleted ? 'text-gray-400 line-through' : 'text-gray-400'}`).text(sch.room)
        }

        if (sch.isCompleted) {
          row.append('span').attr('class', 'text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200').text('已结课')
        } else {
          row.append('span').attr('class', 'text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200').text('待上课')
        }
      })
    } else {
      const emptyDiv = scheduleDiv.append('div').attr('class', 'text-center py-4 text-sm text-gray-400')
      renderIcon(emptyDiv, 'calendar').attr('class', 'w-4 h-4 inline mr-1')
      emptyDiv.append('span').text('暂无课程时间安排')
    }
  }

  // Tab: 评论管理（企业导师评价）
  if (tab === 'comments') {
    const evalDiv = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-5')
    const evalHeader = evalDiv.append('div').attr('class', 'flex items-center gap-2 mb-4')
    renderIcon(evalHeader, 'clipboardCheck').attr('class', 'w-5 h-5 text-gray-400')
    evalHeader.append('h2').attr('class', 'font-semibold text-gray-900').text('企业导师评价')
    evalHeader.append('span').attr('class', 'text-xs text-gray-400').text(`${students.length}名学生`)

    // 展示当前评价方案（只读）
    const evalConfig = store.evalConfigs.find((c) => c.courseId === courseId.value)
    if (evalConfig) {
      const schemeDiv = evalDiv.append('div').attr('class', 'mb-4 p-3 rounded-lg bg-brand-400/5 border border-brand-400/15')
      const schemeHeader = schemeDiv.append('div').attr('class', 'flex items-center justify-between mb-2')
      const left = schemeHeader.append('div').attr('class', 'flex items-center gap-2')
      renderIcon(left, 'eye').attr('class', 'w-4 h-4 text-brand-600')
      left.append('span').attr('class', 'text-xs font-medium text-brand-700').text('当前评价方案')
      schemeHeader.append('span').attr('class', 'text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200')
        .text(`${EvalTemplateLabels[evalConfig.template]} · ${EvalFrequencyLabels[evalConfig.frequency]}`)

      const tagsDiv = schemeDiv.append('div').attr('class', 'flex flex-wrap gap-1.5')
      ALL_EVAL_TYPES.forEach((t: EvalType) => {
        const enabled = TEMPLATE_EVAL_TYPES[evalConfig.template].includes(t)
        const hidden = (t === 'intra_group' || t === 'inter_group') && !(evalConfig as any).courseHasGroups || t === 'mentor' && !evalConfig.hasMentor
        const tag = tagsDiv.append('span')
          .attr('class', `text-xs px-2 py-0.5 rounded-full border ${!enabled ? 'bg-gray-100 text-gray-300 border-gray-200' : hidden ? 'bg-brand-50 text-brand-600 border-brand-200' : EvalTypeColors[t]}`)
        tag.text(`${EvalTypeLabels[t]}${!enabled ? ' ✗' : ''}`)
      })
    }

    if (students.length === 0) {
      evalDiv.append('div').attr('class', 'text-center py-8 text-gray-400').text('该课程暂无学生')
    } else {
      const tableWrapper = evalDiv.append('div').attr('class', 'overflow-x-auto')
      const table = tableWrapper.append('table').attr('class', 'w-full text-sm')

      // thead
      const thead = table.append('thead')
      const headerRow = thead.append('tr').attr('class', 'border-b border-brand-400/20')
      headerRow.append('th').attr('class', 'text-left py-2.5 px-3 text-gray-400 font-medium').text('学生')
      headerRow.append('th').attr('class', 'text-left py-2.5 px-3 text-gray-400 font-medium').text('学号')
      headerRow.append('th').attr('class', 'text-center py-2.5 px-3 w-28 text-gray-400 font-medium').text('评分 (0-100)')
      headerRow.append('th').attr('class', 'text-center py-2.5 px-3 w-28 text-gray-400 font-medium').text('状态')
      headerRow.append('th').attr('class', 'text-center py-2.5 px-3 w-24 text-gray-400 font-medium').text('操作')

      // tbody
      const tbody = table.append('tbody')
      students.forEach((item) => {
        if (!item.student) return
        const sId = item.student.id
        const submitted = isSubmitted(sId)

        const row = tbody.append('tr')
          .attr('class', `border-b border-gray-50 hover:bg-brand-400/10 transition-colors ${submitted ? 'bg-brand-400/5' : ''}`)

        // 学生姓名
        const td1 = row.append('td').attr('class', 'py-2.5 px-3')
        const nameDiv = td1.append('div').attr('class', 'flex items-center gap-3')
        const avatar = nameDiv.append('div').attr('class', 'w-8 h-8 rounded-full bg-brand-600/15 flex items-center justify-center flex-shrink-0')
        avatar.append('span').attr('class', 'text-xs font-medium text-gray-600').text(item.student.name.charAt(0))
        nameDiv.append('span').attr('class', 'font-medium text-gray-900').text(item.student.name)

        // 学号
        row.append('td').attr('class', 'py-2.5 px-3 text-gray-400').text(item.student.id)

        // 评分
        const td3 = row.append('td').attr('class', 'py-2.5 px-3')
        const scoreDiv = td3.append('div').attr('class', 'flex items-center justify-center gap-2')

        if (!submitted) {
          const input = scoreDiv.append('input')
            .attr('type', 'number')
            .attr('min', '0')
            .attr('max', '100')
            .attr('placeholder', '0-100')
            .attr('class', 'w-20 px-2 py-1.5 border border-brand-400/30 rounded-lg text-xs text-center focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none')
            .property('value', scoreInputs.value[sId] !== undefined ? scoreInputs.value[sId] : '')
            .on('input', (event) => {
              const val = (event.target as HTMLInputElement).value
              scoreInputs.value[sId] = val ? Number(val) : undefined as any
            })
          // dispatchEvent for reactivity
        } else {
          scoreDiv.append('span').attr('class', 'text-sm font-semibold text-brand-600').text(`${getSubmittedScore(sId)}分`)
        }

        // 状态
        const td4 = row.append('td').attr('class', 'py-2.5 px-3 text-center')
        if (submitted) {
          const badge = td4.append('span')
            .attr('class', 'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-400/10 text-brand-600 border border-brand-400')
          renderIcon(badge, 'checkCircle').attr('class', 'w-3 h-3')
          badge.append('span').text('已评分')
        } else {
          const badge = td4.append('span')
            .attr('class', 'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-400/10 text-gray-400 border border-brand-400/30')
          renderIcon(badge, 'clock').attr('class', 'w-3 h-3')
          badge.append('span').text('待评价')
        }

        // 操作
        const td5 = row.append('td').attr('class', 'py-2.5 px-3 text-center')
        if (!submitted) {
          const submitBtn = td5.append('button')
            .attr('class', 'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors mx-auto bg-brand-400/10 text-gray-400 cursor-not-allowed')
            .on('click', () => handleSubmitEval(sId))

          const hasScore = scoreInputs.value[sId] !== undefined && scoreInputs.value[sId] !== null
          if (hasScore) {
            submitBtn
              .attr('class', 'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors mx-auto bg-brand-600 text-white hover:bg-brand-800')
          }
          renderIcon(submitBtn, 'checkCircle').attr('class', 'w-3.5 h-3.5')
          submitBtn.append('span').text('提交评分')
        } else {
          td5.append('span').attr('class', 'text-xs text-gray-400').text('已提交')
        }
      })
    }
  }
}

onMounted(() => {
  const el = document.getElementById('mentor-course-detail-root')
  if (el) renderCourseDetail(el)
})

watch([courseId, enrolledStudents, activeTab], () => {
  const el = document.getElementById('mentor-course-detail-root')
  if (el) renderCourseDetail(el)
}, { deep: true })
</script>
