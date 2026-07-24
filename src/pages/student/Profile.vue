<template>
  <div id="student-profile-root"></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const store = useAppStore()
const student = computed(() => store.students.find((s) => s.name === store.currentUser))
const myEnrollments = computed(() => (student.value ? store.enrollments.filter((e) => e.studentId === student.value!.id) : []))
const myGrades = computed(() => (student.value ? store.grades.filter((g) => g.studentId === student.value!.id) : []))

const completed = computed(() => myEnrollments.value.filter((e) => e.status === 'completed').length)
const inProgress = computed(() => myEnrollments.value.filter((e) => e.status === 'in_progress').length)

const avgScore = computed(() => {
  if (myGrades.value.length === 0) return 0
  return Math.round(myGrades.value.reduce((s, g) => s + g.score, 0) / myGrades.value.length)
})

const totalCredits = computed(() => {
  return myEnrollments.value.reduce((sum, e) => {
    const course = store.courses.find((c) => c.id === e.courseId)
    return sum + (course ? Math.round(course.duration / 8) : 0)
  }, 0)
})

const avgProgress = computed(() => {
  if (myEnrollments.value.length === 0) return 0
  return Math.round(myEnrollments.value.reduce((s, e) => s + e.progress, 0) / myEnrollments.value.length)
})

const getCourse = (id: string) => store.courses.find((c) => c.id === id)

const radarData = computed(() => {
  const result: { label: string; value: number }[] = []
  for (const enr of myEnrollments.value) {
    const course = getCourse(enr.courseId)
    if (!course) continue
    const detailedGrade = store.detailedGrades.find(
      (dg) => dg.studentId === student.value!.id && dg.courseId === enr.courseId
    )
    if (!detailedGrade) continue
    const cfg = store.getGradeConfig(enr.courseId)
    const selfEval = detailedGrade.selfEvalScore ?? 0
    const peerReview = detailedGrade.peerReviewScore ?? 0
    const interGroup = detailedGrade.interGroupScore ?? 0
    const teacherScore = detailedGrade.teacherScore ?? 0
    const mentorScore = detailedGrade.mentorScore ?? 0
    const hasRegularScore = selfEval > 0 || peerReview > 0 || interGroup > 0 || teacherScore > 0 || mentorScore > 0
    if (!hasRegularScore) continue
    const regularScore =
      (selfEval * cfg.selfEvalWeight +
        peerReview * cfg.peerReviewWeight +
        interGroup * cfg.interGroupEvalWeight +
        teacherScore * cfg.teacherScoreWeight +
        mentorScore * cfg.mentorScoreWeight) /
      100
    result.push({
      label: course.title,
      value: Math.round(regularScore),
    })
  }
  return result
})

function getAngle(i: number): number {
  const total = radarData.value.length || 6
  return ((360 / total) * i - 90) * Math.PI / 180
}

function gridPoints(level: number): string {
  const r = level * 30
  return radarData.value.map((_, i) => {
    const angle = getAngle(i)
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
  }).join(' ')
}

function axisEndX(i: number): number {
  const angle = getAngle(i)
  return 100 + 150 * Math.cos(angle)
}

function axisEndY(i: number): number {
  const angle = getAngle(i)
  return 100 + 150 * Math.sin(angle)
}

function dataPointX(i: number): number {
  const angle = getAngle(i)
  const r = radarData.value[i].value * 1.5
  return 100 + r * Math.cos(angle)
}

function dataPointY(i: number): number {
  const angle = getAngle(i)
  const r = radarData.value[i].value * 1.5
  return 100 + r * Math.sin(angle)
}

function dataLabelX(i: number): number {
  const angle = getAngle(i)
  const r = Math.min(radarData.value[i].value * 1.5 + 25, 170)
  return 100 + r * Math.cos(angle)
}

function dataLabelY(i: number): number {
  const angle = getAngle(i)
  const r = Math.min(radarData.value[i].value * 1.5 + 25, 170)
  return 100 + r * Math.sin(angle)
}

function dataLabelAnchor(i: number): string {
  const angle = getAngle(i)
  const r = radarData.value[i].value * 1.5
  const x = 100 + r * Math.cos(angle)
  return x > 100 ? 'start' : 'end'
}

const dataPolygonPoints = computed(() => {
  return radarData.value.map((d, i) => {
    const angle = getAngle(i)
    const r = d.value * 1.5
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
  }).join(' ')
})

const showDetailModal = ref(false)

const careerRecommendations = computed(() => {
  if (radarData.value.length === 0) return []

  const scores: Record<string, number> = {}
  radarData.value.forEach((d) => {
    scores[d.label] = d.value
  })

  const aiScore = scores['AI 生成式应用开发'] || 0
  const vizScore = scores['数据可视化与商业分析'] || 0
  const frontendScore = scores['React 前端开发实战'] || 0
  const tsScore = scores['TypeScript 高级编程'] || 0
  const commScore = scores['高效沟通与表达训练'] || 0

  const recommendations: { title: string; description: string; tags: string[]; matchScore: number; icon: string }[] = []

  if (aiScore >= 80) {
    recommendations.push({
      title: 'AI 应用开发工程师',
      description: '利用AI技术构建智能化应用，将大语言模型能力融入产品，是当前最热门的职业方向之一。',
      tags: ['AI', '大模型', '应用开发', '创新'],
      matchScore: Math.round((aiScore * 0.6 + frontendScore * 0.2 + tsScore * 0.2)),
      icon: 'sparkles'
    })
  }

  if (vizScore >= 75) {
    recommendations.push({
      title: '数据可视化工程师',
      description: '将复杂数据转化为直观的可视化图表，帮助企业洞察业务趋势，支持数据驱动决策。',
      tags: ['数据可视化', '图表', 'BI', '分析'],
      matchScore: Math.round((vizScore * 0.5 + frontendScore * 0.3 + commScore * 0.2)),
      icon: 'lineChart'
    })
  }

  if (frontendScore >= 75) {
    recommendations.push({
      title: '前端开发工程师',
      description: '负责构建用户界面和交互体验，结合React、TypeScript等现代技术栈打造高质量Web应用。',
      tags: ['React', 'TypeScript', 'UI', '交互'],
      matchScore: Math.round((frontendScore * 0.5 + tsScore * 0.3 + vizScore * 0.2)),
      icon: 'cpu'
    })
  }

  if (aiScore >= 70 && frontendScore >= 70) {
    recommendations.push({
      title: '全栈AI开发工程师',
      description: '兼具前端开发与AI技术能力，能够独立完成从界面到智能功能的完整项目开发。',
      tags: ['全栈', 'AI', '前端', '后端'],
      matchScore: Math.round((aiScore * 0.35 + frontendScore * 0.35 + tsScore * 0.3)),
      icon: 'sparkles'
    })
  }

  return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
})

const abilityAnalysis = computed(() => {
  if (radarData.value.length === 0) return '暂无能力数据'

  const scores = radarData.value.map((d) => d.value)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  const maxLabel = radarData.value.find((d) => d.value === maxScore)?.label || ''
  const minLabel = radarData.value.find((d) => d.value === minScore)?.label || ''

  let analysis = `您的平均能力得分为 ${Math.round(avg)} 分，整体表现`

  if (avg >= 85) analysis += '优秀'
  else if (avg >= 75) analysis += '良好'
  else if (avg >= 65) analysis += '中等'
  else analysis += '有待提升'

  analysis += `。您的优势课程是「${maxLabel}」，建议继续深耕；`

  if (minScore < 75) {
    analysis += `「${minLabel}」相对薄弱，建议加强学习。`
  } else {
    analysis += '各课程均衡发展，可尝试拓展更多领域。'
  }

  return analysis
})

function getScoreClass(score: number): string {
  if (score >= 90) return 'bg-emerald-100 text-emerald-700'
  if (score >= 80) return 'bg-blue-100 text-blue-700'
  if (score >= 70) return 'bg-brand-50 text-gray-800'
  if (score >= 60) return 'bg-brand-600/15 text-brand-800'
  return 'bg-brand-600/15 text-red-700'
}

function getScoreText(score: number): string {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '需提升'
}

function getCourseDetail(title: string): string {
  const detailMap: Record<string, string> = {
    'AI 生成式应用开发': 'AI技术方向',
    '数据可视化与商业分析': '数据分析方向',
    'React 前端开发实战': '前端开发方向',
    'TypeScript 高级编程': '编程语言方向',
    '高效沟通与表达训练': '软技能方向'
  }
  return detailMap[title] || '综合能力'
}

function renderProfile(root: HTMLElement) {
  const container = d3.select(root)
  container.selectAll('*').remove()

  const s = student.value
  const enrs = myEnrollments.value
  const rd = radarData.value
  const recs = careerRecommendations.value

  // 页面标题
  const titleDiv = container.append('div')
  titleDiv.append('h1').attr('class', 'text-2xl font-bold text-gray-900').text('个人画像')
  titleDiv.append('p').attr('class', 'text-gray-400 mt-1').text('查看个人信息与学习能力分析')

  // 个人信息卡片
  const infoCard = container.append('div').attr('class', 'bg-white rounded-xl p-6 border border-gray-100 shadow-sm')
  const infoRow = infoCard.append('div').attr('class', 'flex items-start gap-6')

  // 头像
  const avatar = infoRow.append('div').attr('class', 'w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0')
  avatar.append('span').attr('class', 'text-2xl font-bold text-brand-600').text(s?.name?.charAt(0) || '?')

  // 信息
  const infoContent = infoRow.append('div').attr('class', 'flex-1')
  infoContent.append('h2').attr('class', 'text-xl font-bold text-gray-900').text(s?.name || store.currentUser || '未知用户')
  const infoGrid = infoContent.append('div').attr('class', 'grid grid-cols-2 gap-x-8 gap-y-2 mt-3')

  const infoItems = [
    { icon: 'mail' as const, text: s?.email || '未设置' },
    { icon: 'phone' as const, text: s?.phone || '未设置' },
    { icon: 'calendar' as const, text: `入学时间：${s?.joinDate || '未知'}` },
    { icon: 'user' as const, text: `学号：${s?.id || '未知'}` },
  ]
  infoItems.forEach((item) => {
    const span = infoGrid.append('span').attr('class', 'flex items-center gap-2 text-sm text-gray-400')
    renderIcon(span, item.icon).attr('class', 'w-4 h-4')
    span.append('span').text(item.text)
  })

  // 统计数字
  const statsRow = infoRow.append('div').attr('class', 'flex gap-6')
  const stats = [
    { value: enrs.length, label: '已报名', bg: 'bg-blue-50', text: 'text-brand-600' },
    { value: completed.value, label: '已完成', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { value: avgScore.value, label: '平均分', bg: 'bg-brand-400/10', text: 'text-brand-700' },
  ]
  stats.forEach((st) => {
    const box = statsRow.append('div').attr('class', `text-center px-4 py-3 ${st.bg} rounded-lg`)
    box.append('p').attr('class', `text-2xl font-bold ${st.text}`).text(String(st.value))
    box.append('p').attr('class', 'text-xs text-gray-400 mt-1').text(st.label)
  })

  // 能力雷达图 + 学习统计 两列布局
  const twoCol = container.append('div').attr('class', 'grid grid-cols-1 lg:grid-cols-2 gap-6')

  // 雷达图卡片
  const radarCard = twoCol.append('div').attr('class', 'bg-white rounded-xl p-6 border border-gray-100 shadow-sm')
  const radarTitle = radarCard.append('h3').attr('class', 'text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2')
  renderIcon(radarTitle, 'barChart3').attr('class', 'w-5 h-5 text-brand-600')
  radarTitle.append('span').text('课程成绩雷达图')

  if (rd.length > 0) {
    const svgWrap = radarCard.append('div')
      .attr('class', 'relative w-80 h-80 mx-auto cursor-pointer')
      .on('click', () => { showDetailModal.value = true; reRender() })

    const svg = svgWrap.append('svg').attr('viewBox', '-120 -120 440 440').attr('class', 'w-full h-full')

    // 网格多边形
    for (let level = 1; level <= 5; level++) {
      svg.append('polygon')
        .attr('points', gridPoints(level))
        .attr('fill', 'none')
        .attr('stroke', '#5eb6b9')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3)
    }

    // 轴线
    rd.forEach((_, i) => {
      svg.append('line')
        .attr('x1', 100).attr('y1', 100)
        .attr('x2', axisEndX(i)).attr('y2', axisEndY(i))
        .attr('stroke', '#5eb6b9')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3)
    })

    // 数据多边形
    svg.append('polygon')
      .attr('points', dataPolygonPoints.value)
      .attr('fill', 'rgba(65, 90, 119, 0.2)')
      .attr('stroke', '#429fc4')
      .attr('stroke-width', 2)

    // 数据点 + 标签
    rd.forEach((d, i) => {
      svg.append('circle')
        .attr('cx', dataPointX(i)).attr('cy', dataPointY(i))
        .attr('r', 4).attr('fill', '#429fc4')

      svg.append('text')
        .attr('x', dataLabelX(i)).attr('y', dataLabelY(i))
        .attr('text-anchor', dataLabelAnchor(i))
        .attr('font-size', 9).attr('fill', '#5eb6b9')
        .text(d.label)

      svg.append('text')
        .attr('x', dataLabelX(i)).attr('y', dataLabelY(i) + 12)
        .attr('text-anchor', dataLabelAnchor(i))
        .attr('font-size', 9).attr('fill', '#429fc4').attr('font-weight', 'bold')
        .text(`${d.value}分`)
    })

    // hover提示
    const hoverOverlay = svgWrap.append('div')
      .attr('class', 'absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity')
    hoverOverlay.append('span').attr('class', 'text-white font-medium text-sm bg-brand-600 px-3 py-1 rounded-full shadow-lg').text('点击查看详情')
  } else {
    radarCard.append('p').attr('class', 'text-gray-400 text-center py-12')
      .html('暂无平时成绩数据<br />完成课程评价后将生成能力雷达图')
  }

  // 学习统计
  const statCard = twoCol.append('div').attr('class', 'bg-white rounded-xl p-6 border border-gray-100 shadow-sm')
  const statTitle = statCard.append('h3').attr('class', 'text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2')
  renderIcon(statTitle, 'trendingUp').attr('class', 'w-5 h-5 text-brand-600')
  statTitle.append('span').text('学习统计')

  const statItems = [
    { label: '学习中课程', value: `${inProgress.value} 门`, color: 'text-gray-900' },
    { label: '已完成课程', value: `${completed.value} 门`, color: 'text-emerald-600' },
    { label: '总学分', value: `${totalCredits.value} 学分`, color: 'text-brand-600' },
    { label: '平均成绩', value: `${avgScore.value} 分`, color: 'text-brand-700' },
    { label: '平均进度', value: `${avgProgress.value}%`, color: 'text-gray-900' },
  ]
  const statBody = statCard.append('div').attr('class', 'space-y-4')
  statItems.forEach((item) => {
    const row = statBody.append('div').attr('class', 'flex items-center justify-between p-3 bg-gray-50 rounded-lg')
    row.append('span').attr('class', 'text-sm text-gray-600').text(item.label)
    row.append('span').attr('class', `font-semibold ${item.color}`).text(item.value)
  })

  // 学习轨迹
  const trackCard = container.append('div').attr('class', 'bg-white rounded-xl p-6 border border-brand-400/20 shadow-sm')
  const trackTitle = trackCard.append('h3').attr('class', 'text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2')
  renderIcon(trackTitle, 'bookOpen').attr('class', 'w-5 h-5 text-brand-600')
  trackTitle.append('span').text('学习轨迹')

  if (enrs.length > 0) {
    const trackList = trackCard.append('div').attr('class', 'relative')
    enrs.forEach((enr, index) => {
      const item = trackList.append('div').attr('class', 'flex gap-4 pb-6 relative')

      if (index < enrs.length - 1) {
        item.append('div').attr('class', 'absolute left-[7px] top-4 bottom-0 w-0.5 bg-blue-200')
      }

      const dotClass = enr.status === 'completed' ? 'bg-brand-600' :
        enr.status === 'in_progress' ? 'bg-brand-600' : 'bg-blue-500'
      item.append('div').attr('class', `w-4 h-4 rounded-full mt-1 flex-shrink-0 ${dotClass}`)

      const content = item.append('div').attr('class', 'flex-1')
      content.append('p').attr('class', 'font-medium text-gray-900').text(getCourse(enr.courseId)?.title || '未知课程')

      const statusText = enr.status === 'completed' ? '已完成' : enr.status === 'in_progress' ? '学习中' : '已报名'
      content.append('p').attr('class', 'text-sm text-gray-400')
        .text(`${enr.enrollDate} · 进度 ${enr.progress}% · ${statusText}`)
    })
  } else {
    trackCard.append('p').attr('class', 'text-gray-400 text-center py-4').text('暂无学习记录')
  }

  // 详情弹窗 (showDetailModal)
  if (showDetailModal.value) {
    const modalOverlay = container.append('div').attr('class', 'fixed inset-0 z-50 flex items-center justify-center p-4')
    modalOverlay.append('div').attr('class', 'absolute inset-0 bg-black/50').on('click', () => { showDetailModal.value = false; reRender() })

    const modalBox = modalOverlay.append('div').attr('class', 'relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden')

    // modal header
    const modalHeader = modalBox.append('div').attr('class', 'flex items-center justify-between p-6 border-b border-brand-400/20')
    const modalHeaderTitle = modalHeader.append('h3').attr('class', 'text-xl font-bold text-gray-900 flex items-center gap-2')
    renderIcon(modalHeaderTitle, 'barChart3').attr('class', 'w-6 h-6 text-brand-600')
    modalHeaderTitle.append('span').text('能力分析详情')

    const closeBtn = modalHeader.append('button')
      .attr('class', 'p-2 hover:bg-brand-400/10 rounded-lg transition-colors')
      .on('click', () => { showDetailModal.value = false; reRender() })
    const closeSvg = closeBtn.append('svg').attr('class', 'w-6 h-6 text-gray-400')
      .attr('fill', 'none').attr('stroke', 'currentColor').attr('viewBox', '0 0 24 24')
    closeSvg.append('path').attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round')
      .attr('stroke-width', '2').attr('d', 'M6 18L18 6M6 6l12 12')

    const modalBody = modalBox.append('div').attr('class', 'p-6 overflow-y-auto max-h-[calc(90vh-80px)]')

    // 能力综合分析
    const analysisBanner = modalBody.append('div').attr('class', 'mb-6 p-5 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-xl')
    const bannerRow = analysisBanner.append('div').attr('class', 'flex items-start gap-4')
    const bannerIcon = bannerRow.append('div').attr('class', 'w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0')
    renderIcon(bannerIcon, 'sparkles').attr('class', 'w-5 h-5 text-white')
    const bannerText = bannerRow.append('div').attr('class', 'flex-1')
    bannerText.append('h5').attr('class', 'font-semibold text-white mb-2').text('能力综合分析')
    bannerText.append('p').attr('class', 'text-white/90 text-sm leading-relaxed').text(abilityAnalysis.value)

    // 课程分析 + 职业推荐 两列
    const modalGrid = modalBody.append('div').attr('class', 'grid grid-cols-1 lg:grid-cols-2 gap-6')

    // 课程分析
    const courseAnalysisCol = modalGrid.append('div')
    const courseAnalysisTitle = courseAnalysisCol.append('h4').attr('class', 'text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2')
    renderIcon(courseAnalysisTitle, 'bookOpen').attr('class', 'w-5 h-5 text-brand-600')
    courseAnalysisTitle.append('span').text('课程分析')

    const courseList = courseAnalysisCol.append('div').attr('class', 'space-y-4')
    rd.forEach((data) => {
      const item = courseList.append('div').attr('class', 'p-4 bg-brand-400/10 rounded-lg')
      const header = item.append('div').attr('class', 'flex items-center justify-between mb-2')
      header.append('span').attr('class', 'font-medium text-gray-900').text(data.label)
      header.append('span').attr('class', 'text-lg font-bold text-brand-600').text(`${data.value}分`)

      const barBg = item.append('div').attr('class', 'w-full bg-brand-400/10 rounded-full h-2')
      barBg.append('div').attr('class', 'bg-brand-600 h-2 rounded-full').style('width', `${data.value}%`)

      const tags = item.append('div').attr('class', 'mt-3 flex flex-wrap gap-2')
      tags.append('span').attr('class', `px-2 py-1 text-xs rounded-full ${getScoreClass(data.value)}`)
        .text(getScoreText(data.value))
      tags.append('span').attr('class', 'px-2 py-1 text-xs bg-brand-400/10 text-brand-600 rounded-full')
        .text(getCourseDetail(data.label))
    })

    // 职业推荐
    const careerCol = modalGrid.append('div')
    const careerTitle = careerCol.append('h4').attr('class', 'text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2')
    renderIcon(careerTitle, 'sparkles').attr('class', 'w-5 h-5 text-indigo-500')
    careerTitle.append('span').text('职业推荐')

    const careerList = careerCol.append('div').attr('class', 'space-y-4')
    if (recs.length > 0) {
      recs.forEach((rec) => {
        const card = careerList.append('div').attr('class', 'p-4 bg-gradient-to-br from-brand-400/5 to-brand-400/5 rounded-lg')
        const cardHeader = card.append('div').attr('class', 'flex items-center gap-2 mb-2')
        renderIcon(cardHeader, rec.icon as any).attr('class', 'w-5 h-5 text-brand-600')
        cardHeader.append('span').attr('class', 'font-semibold text-gray-900').text(rec.title)
        cardHeader.append('span').attr('class', 'ml-auto text-sm font-bold text-brand-600').text(`${rec.matchScore}%`)

        card.append('p').attr('class', 'text-sm text-gray-600 mb-3').text(rec.description)

        const tagRow = card.append('div').attr('class', 'flex flex-wrap gap-1')
        rec.tags.forEach((tag) => {
          tagRow.append('span').attr('class', 'px-2 py-1 text-xs bg-brand-600/15 text-gray-800 rounded-full').text(tag)
        })
      })
    } else {
      careerList.append('div').attr('class', 'text-gray-400 text-center py-8').text('完成课程评价后，系统将生成职业推荐')
    }
  }
}

function reRender() {
  const el = document.getElementById('student-profile-root')
  if (el) renderProfile(el)
}

onMounted(() => {
  const el = document.getElementById('student-profile-root')
  if (el) renderProfile(el)
})

watch([myEnrollments, myGrades], () => {
  const el = document.getElementById('student-profile-root')
  if (el) renderProfile(el)
}, { deep: true })
</script>
