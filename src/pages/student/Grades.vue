<template>
  <div class="space-y-6">
    <div id="student-grades-root"></div>

    <!-- 成绩分布图 (ECharts 垂直柱状图) -->
    <div class="bg-white rounded-xl border border-brand-400/20 shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-800">成绩分布</h3>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm" style="background:#10b981"></span>
            <span>≥90 优秀</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm" style="background:#3b82f6"></span>
            <span>≥80 良好</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm" style="background:#60a5fa"></span>
            <span>≥60 及格</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm" style="background:#ef4444"></span>
            <span><60 不及格</span>
          </div>
          <div class="flex items-center gap-1.5 ml-2">
            <span class="w-0.5 h-3 bg-red-500"></span>
            <span>平均分 {{ avgScore }}</span>
          </div>
        </div>
      </div>
      <div ref="chartRef" style="width:100%;height:320px"></div>
    </div>

    <!-- 成绩明细弹窗 (保留子组件) -->
    <Modal :isOpen="modalOpen" :onClose="closeModal" :title="modalTitle" maxWidth="max-w-xl">
      <div v-if="modalEntry" class="space-y-4">
        <div v-if="!modalEntry.detail" class="text-center py-6 text-gray-400 text-sm">
          暂无该课程的详细成绩明细数据
        </div>

        <div v-if="modalEntry.detail" class="space-y-3">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <component :is="ClipboardList" class="w-3.5 h-3.5" /> 平时成绩构成
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="item in regularItems(modalEntry)" :key="item.label"
              class="flex items-center gap-2 p-2.5 rounded-lg bg-white border" :class="item.border">
              <component :is="item.icon" class="w-4 h-4" :class="item.iconColor" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-gray-800">{{ item.label }}</span>
                  <span class="text-xs font-bold" :class="item.color">{{ item.score }}<span class="font-normal text-gray-400">/100</span></span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :class="item.bar" :style="{ width: item.score + '%' }" />
                  </div>
                  <span class="text-[10px] text-gray-400">权重{{ item.weight }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="modalEntry.detail" class="space-y-3">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <component :is="BarChart3" class="w-3.5 h-3.5" /> 大考成绩
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <template v-for="item in examItems(modalEntry)" :key="item.label">
              <div v-if="item.score !== undefined" class="flex items-center justify-between p-2.5 rounded-lg bg-white border border-brand-400/20">
                <div class="flex items-center gap-2">
                  <component :is="FileText" class="w-4 h-4 text-gray-400" />
                  <span class="text-xs text-gray-800">{{ item.label }}</span>
                  <span class="text-[10px] text-gray-400">（权重{{ item.weight }}%）</span>
                </div>
                <span class="text-sm font-bold" :class="getGradeColor(item.score)">{{ item.score }}</span>
              </div>
            </template>
          </div>
        </div>

        <div class="bg-blue-50/80 border border-brand-400 rounded-lg p-3 space-y-2">
          <h4 class="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
            <component :is="Calculator" class="w-3.5 h-3.5" /> 最终成绩计算
          </h4>
          <p class="text-xs text-brand-600 leading-relaxed">
            <span class="font-medium">总成绩</span> =
            平时成绩(×<span class="font-medium">{{ cfgMap[modalEntry.grade.courseId]?.regularWeight ?? 40 }}%</span>)
            <template v-if="(cfgMap[modalEntry.grade.courseId]?.midtermWeight ?? 0) > 0">
              + 期中成绩(×<span class="font-medium">{{ cfgMap[modalEntry.grade.courseId]?.midtermWeight }}%</span>)
            </template>
            + 期末成绩(×<span class="font-medium">{{ cfgMap[modalEntry.grade.courseId]?.finalWeight ?? 60 }}%</span>)
          </p>
          <p v-if="modalEntry.detail" class="text-xs text-brand-600 leading-relaxed">
            <span class="font-medium">平时成绩</span> =
            <template v-for="(item, idx) in regularItems(modalEntry)" :key="item.label">
              {{ item.score }}×{{ item.weight }}%{{ idx < regularItems(modalEntry).length - 1 ? ' + ' : '' }}
            </template>
            = <span class="font-bold">{{ calcRegular(modalEntry) }}</span>
          </p>
          <div class="flex items-center gap-2 pt-1 border-t border-brand-400">
            <span class="text-xs font-bold text-gray-800">最终得分：</span>
            <span class="text-base font-bold" :class="getGradeColor(modalEntry.totalScore)">{{ modalEntry.totalScore }}</span>
          </div>
        </div>

        <div v-if="modalEntry.grade.comment" class="flex items-start gap-2 text-xs text-gray-500">
          <component :is="MessageSquare" class="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
          <span class="italic">"{{ modalEntry.grade.comment }}"</span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h, nextTick } from 'vue'
import { useAppStore } from '@/stores/app'
import type { DetailedGrade, Grade } from '@/types'
import { getDefaultGradeConfig } from '@/types'
import { Icons, renderIcon } from '@/utils/d3-renderer'
import * as d3 from 'd3'
import * as echarts from 'echarts'
import StatCard from '@/components/StatCard.vue'
import Modal from '@/components/Modal.vue'
import { javaFetchStudentScores, javaListCourses } from '@/api'

// 使用 Icons 映射创建 Vue 组件，替代 lucide-vue-next
function iconView(name: keyof typeof Icons) {
  const svgHtml = Icons[name]
  if (!svgHtml) return undefined as any
  return { render() { return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', innerHTML: svgHtml }) } }
}

const Award = iconView('award')
const TrendingUp = iconView('trendingUp')
const TrendingDown = iconView('trendingDown')
const BookOpen = iconView('bookOpen')
const ChevronRight = iconView('chevronRight')
const ClipboardList = iconView('clipboardList')
const BarChart3 = iconView('barChart3')
const Calculator = iconView('calculator')
const MessageSquare = iconView('messageSquare')
const FileText = iconView('fileText')
const User = iconView('user')
const Users = iconView('users')
const Building2 = iconView('building2')
const GraduationCap = iconView('graduationCap')
const Briefcase = iconView('briefcase')

const store = useAppStore()
const semester = ref('')
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function getBarColor(score: number): string {
  if (score >= 90) return '#10b981'
  if (score >= 80) return '#3b82f6'
  if (score >= 60) return '#60a5fa'
  return '#ef4444'
}

function initChart() {
  if (!chartRef.value || sortedGradeEntries.value.length === 0) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance || sortedGradeEntries.value.length === 0) return
  const data = sortedGradeEntries.value.map(item => ({
    value: item.totalScore,
    itemStyle: { color: getBarColor(item.totalScore) }
  }))
  const option: echarts.EChartsOption = {
    grid: { left: 50, right: 20, top: 30, bottom: 70 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        const score = p.value
        const level = score >= 90 ? '优秀' : score >= 80 ? '良好' : score >= 60 ? '及格' : '不及格'
        return `${p.name}<br/>分数：<b>${score}</b> 分<br/>等级：<b>${level}</b>`
      }
    },
    xAxis: {
      type: 'category',
      data: sortedGradeEntries.value.map(i => i.courseName),
      axisLabel: {
        fontSize: 11,
        color: '#64748b',
        interval: 0,
        rotate: sortedGradeEntries.value.length > 3 ? 20 : 0
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 20,
      axisLabel: { fontSize: 11, color: '#64748b' },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [{
      type: 'bar',
      data,
      barWidth: '45%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      },
      label: {
        show: true,
        position: 'top',
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
        formatter: '{c}'
      },
      markLine: avgScore.value > 0 ? {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
        data: [{ yAxis: avgScore.value, label: { show: false } }]
      } : undefined,
      markPoint: avgScore.value > 0 ? {
        silent: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#ef4444' },
        data: [{ name: '平均分', coord: [sortedGradeEntries.value.length - 1, avgScore.value] }]
      } : undefined
    }]
  }
  chartInstance.setOption(option)
}

onMounted(async () => {
  // 先确保课程数据已加载（让课程名称可以正确显示）
  try {
    const courses = await javaListCourses()
    if (courses && courses.length > 0) store.courses = courses
  } catch { /* ignore */ }

  const s = store.students.find((x) => x.name === store.currentUser || x.name === store.currentDisplayName)
  if (s?.id) {
    try {
      const scores = await javaFetchStudentScores(s.id)
      if (scores && scores.length > 0) {
        // 清除该学生的旧 mock 成绩
        store.grades = store.grades.filter((g) => g.studentId !== s.id)

        // 将数据库成绩转换为 Grade 格式
        const byCourse = new Map<string, { scores: any[]; totalScore: number }>()
        for (const sc of scores) {
          if (!byCourse.has(sc.courseId)) byCourse.set(sc.courseId, { scores: [], totalScore: 0 })
          byCourse.get(sc.courseId)!.scores.push(sc)
        }
        for (const [courseId, data] of byCourse) {
          const avg = data.scores.reduce((a: number, s: any) => a + Number(s.score), 0) / data.scores.length
          store.grades.push({
            id: `db-grade-${courseId}-${s.id}`,
            studentId: s.id,
            courseId,
            score: Math.round(avg),
            semester: '',
            comment: '',
            gradedAt: data.scores[0].gradedAt || '',
            totalScore: Math.round(avg),
          })
        }
      }
    } catch { /* ignore */ }
  }

  // 数据加载完成后，等待 DOM 更新再初始化图表
  await nextTick()
  initChart()

  // 初始化成绩列表
  const el = document.getElementById('student-grades-root')
  if (el) renderGrades(el)
})

// 弹窗状态
const modalOpen = ref(false)
const modalEntry = ref<GradeEntry | null>(null)
const modalTitle = computed(() => modalEntry.value ? `${modalEntry.value.courseName} - 成绩明细` : '成绩明细')

function openModal(entry: GradeEntry) {
  modalEntry.value = entry
  modalOpen.value = true
}
function closeModal() {
  modalOpen.value = false
  modalEntry.value = null
}

const student = computed(() => store.students.find((s) => s.name === store.currentUser || s.name === store.currentDisplayName) ?? store.students[0])

const myGrades = computed(() => store.grades.filter((g) => g.studentId === student.value?.id))
const semesters = computed(() => [...new Set(store.grades.map((g) => g.semester))])

const filteredGrades = computed(() => {
  if (!semester.value) return myGrades.value
  return myGrades.value.filter((g) => g.semester === semester.value)
})

const cfgMap = computed(() => store.gradeConfigs)

interface GradeEntry {
  grade: Grade & { semester?: string; totalScore?: number }
  courseName: string
  teacher: string
  semester: string
  totalScore: number
  gradient: string
  detail?: DetailedGrade
}

function getDetail(courseId: string): DetailedGrade | undefined {
  if (!student.value) return undefined
  return store.detailedGrades.find((d) => d.studentId === student.value!.id && d.courseId === courseId)
}

function calcRegular(entry: GradeEntry): number {
  if (!entry.detail) return 0
  const d = entry.detail
  const cfg = cfgMap.value[entry.grade.courseId] || getDefaultGradeConfig(entry.grade.courseId)
  return Math.round(
    (d.selfEvalScore ?? 0) * cfg.selfEvalWeight / 100 +
    (d.peerReviewScore ?? 0) * cfg.peerReviewWeight / 100 +
    (d.interGroupScore ?? 0) * cfg.interGroupEvalWeight / 100 +
    (d.teacherScore ?? 0) * cfg.teacherScoreWeight / 100 +
    (d.mentorScore ?? 0) * cfg.mentorScoreWeight / 100
  )
}

const gradeEntries = computed<GradeEntry[]>(() => {
  const gradients = ['from-emerald-500 to-teal-600', 'from-blue-500 to-indigo-600', 'from-brand-600 to-brand-700', 'from-rose-500 to-red-600', 'from-purple-500 to-violet-600', 'from-cyan-500 to-blue-600']
  return filteredGrades.value.map((g, i) => {
    const course = store.courses.find((c) => c.id === g.courseId)
    const d = getDetail(g.courseId)
    let total = g.totalScore ?? g.score ?? 0
    if (d) {
      total = store.calcTotalScore(g.courseId, d)
    } else {
      // 无分项成绩时，素质评价加成直接叠加在已存总分上
      total = Math.min(100, total + store.getStudentQualityScore(g.courseId, g.studentId))
    }
    const sem = g.semester ?? (course?.createdAt ? `${course.createdAt.slice(0, 4)}年` : '2026年')
    return {
      grade: { ...g, semester: sem, totalScore: total },
      courseName: course?.title || '未知课程',
      teacher: course?.teacher || '未知',
      semester: sem,
      totalScore: total,
      gradient: gradients[i % gradients.length],
      detail: d,
    }
  })
})

// 平时成绩子项
const regularItems = (entry: GradeEntry) => {
  const d = entry.detail
  const cfg = cfgMap.value[entry.grade.courseId] || getDefaultGradeConfig(entry.grade.courseId)
  const items: { label: string; score: number; weight: number; icon: any; iconColor: string; bar: string; border: string; color: string }[] = []

  if (d?.selfEvalScore !== undefined) {
    items.push({
      label: '自评', score: d.selfEvalScore, weight: cfg.selfEvalWeight,
      icon: User, iconColor: 'text-brand-600', bar: 'bg-brand-600', border: 'border-brand-400', color: 'text-brand-600',
    })
  }
  if (d?.peerReviewScore !== undefined) {
    items.push({
      label: '互评', score: d.peerReviewScore, weight: cfg.peerReviewWeight,
      icon: Users, iconColor: 'text-brand-600', bar: 'bg-brand-400/10', border: 'border-emerald-100', color: 'text-brand-600',
    })
  }
  if (d?.interGroupScore !== undefined) {
    items.push({
      label: '组间评', score: d.interGroupScore, weight: cfg.interGroupEvalWeight,
      icon: Building2, iconColor: 'text-brand-600', bar: 'bg-brand-600', border: 'border-brand-400/20', color: 'text-brand-600',
    })
  }
  if (d?.teacherScore !== undefined) {
    items.push({
      label: '教师评', score: d.teacherScore, weight: cfg.teacherScoreWeight,
      icon: GraduationCap, iconColor: 'text-brand-600', bar: 'bg-brand-600', border: 'border-brand-50', color: 'text-brand-600',
    })
  }
  if (d?.mentorScore !== undefined) {
    items.push({
      label: '导师评', score: d.mentorScore, weight: cfg.mentorScoreWeight,
      icon: Briefcase, iconColor: 'text-rose-500', bar: 'bg-rose-500', border: 'border-rose-100', color: 'text-rose-600',
    })
  }
  return items
}

// 大考成绩子项
const examItems = (entry: GradeEntry) => {
  const d = entry.detail
  const cfg = cfgMap.value[entry.grade.courseId] || getDefaultGradeConfig(entry.grade.courseId)
  const items: { label: string; score?: number; weight: number }[] = [
    { label: '期中笔试', score: d?.midtermExamScore, weight: cfg.midtermExamWeight },
    { label: '期中项目', score: d?.midtermProjectScore, weight: cfg.midtermProjectWeight },
    { label: '期末笔试', score: d?.finalExamScore, weight: cfg.finalExamWeight },
    { label: '期末项目', score: d?.finalProjectScore, weight: cfg.finalProjectWeight },
  ]
  return items.filter((i) => i.score !== undefined)
}

const getGradeColor = (score: number) => {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-brand-700'
  if (score >= 60) return 'text-brand-700'
  return 'text-red-500'
}

const getGradeLevel = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '不及格'
}

const getGradeBadge = (score: number) => {
  if (score >= 90) return 'bg-emerald-50 text-emerald-600'
  if (score >= 80) return 'bg-blue-50 text-blue-600'
  if (score >= 70) return 'bg-brand-50 text-brand-700'
  if (score >= 60) return 'bg-brand-50 text-brand-700'
  return 'bg-red-50 text-red-500'
}

const avgScore = computed(() => {
  if (gradeEntries.value.length === 0) return 0
  return Math.round(gradeEntries.value.reduce((s, g) => s + g.totalScore, 0) / gradeEntries.value.length)
})

const maxScore = computed(() => {
  if (gradeEntries.value.length === 0) return 0
  return Math.max(...gradeEntries.value.map((g) => g.totalScore))
})

const minScore = computed(() => {
  if (gradeEntries.value.length === 0) return 0
  return Math.min(...gradeEntries.value.map((g) => g.totalScore))
})

const sortedGradeEntries = computed(() => {
  return [...gradeEntries.value].sort((a, b) => b.totalScore - a.totalScore)
})

const gradedCourses = computed(() => gradeEntries.value.length)

function renderGrades(root: HTMLElement) {
  const container = d3.select(root)
  container.selectAll('*').remove()

  // 头部：标题 + 学期筛选
  const headerDiv = container.append('div').attr('class', 'flex items-center justify-between')
  const titleDiv = headerDiv.append('div')
  titleDiv.append('h1').attr('class', 'text-2xl font-bold text-gray-900').text('成绩管理')
  titleDiv.append('p').attr('class', 'text-gray-500 mt-1').text('查看各课程成绩明细及最终成绩构成')

  const select = headerDiv.append('select')
    .attr('class', 'px-3 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm')
    .on('change', (event) => {
      semester.value = (event.target as HTMLSelectElement).value
    })
  select.append('option').attr('value', '').text('全部学期')
  semesters.value.forEach((s) => {
    select.append('option').attr('value', s).text(s)
  })
  select.property('value', semester.value)

  // 课程成绩列表
  const listDiv = container.append('div').attr('class', 'space-y-3')

  if (gradeEntries.value.length === 0) {
    listDiv.append('div')
      .attr('class', 'text-center py-12 text-gray-400 bg-white rounded-xl border border-brand-400/20')
      .text('暂无成绩数据')
    return
  }

  gradeEntries.value.forEach((entry) => {
    const card = listDiv.append('div')
      .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden')

    const btn = card.append('button')
      .attr('class', 'w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors')
      .on('click', () => openModal(entry))

    const leftDiv = btn.append('div').attr('class', 'flex items-center gap-3 min-w-0')
    const iconWrap = leftDiv.append('div')
      .attr('class', `w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center ${entry.gradient}`)
    renderIcon(iconWrap, 'bookOpen').attr('class', 'w-5 h-5 text-white')

    const textDiv = leftDiv.append('div').attr('class', 'text-left min-w-0')
    textDiv.append('p').attr('class', 'text-sm font-semibold text-gray-900 truncate').text(entry.courseName)
    textDiv.append('p').attr('class', 'text-xs text-gray-400').text(`${entry.teacher} · ${entry.semester}`)

    const rightDiv = btn.append('div').attr('class', 'flex items-center gap-3 flex-shrink-0')
    const scoreWrap = rightDiv.append('div').attr('class', 'text-right')
    const scoreSpan = scoreWrap.append('span')
      .attr('class', `text-lg font-bold ${getGradeColor(entry.totalScore)}`)
      .text(String(entry.totalScore))
    scoreWrap.append('span').attr('class', 'text-xs text-gray-400').text('分')
    const badgeP = scoreWrap.append('p').attr('class', 'text-[10px]')
    badgeP.append('span')
      .attr('class', `px-1.5 py-0.5 rounded ${getGradeBadge(entry.totalScore)}`)
      .text(getGradeLevel(entry.totalScore))

    renderIcon(rightDiv, 'chevronRight').attr('class', 'w-4 h-4 text-gray-400')
  })
}

watch(gradeEntries, async () => {
  await nextTick()
  updateChart()
  const el = document.getElementById('student-grades-root')
  if (el) renderGrades(el)
}, { deep: true })

watch(semester, async () => {
  await nextTick()
  updateChart()
  const el = document.getElementById('student-grades-root')
  if (el) renderGrades(el)
})
</script>
