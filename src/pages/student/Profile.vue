<template>
  <div id="student-profile-root"></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'
import { getNow } from '@/lib/date'
import { javaListStudents, javaListSchedules } from '@/api'
import { CAREERS } from '@/data/careers'

const store = useAppStore()
const student = computed(() => store.students.find((s) => s.name === store.currentUser || s.name === store.currentDisplayName))
const myEnrollments = computed(() => (student.value ? store.enrollments.filter((e) => e.studentId === student.value!.id) : []))
const myGrades = computed(() => (student.value ? store.grades.filter((g) => g.studentId === student.value!.id) : []))

const completed = computed(() => myEnrollments.value.filter((e) => e.status === 'completed').length)
const inProgress = computed(() => myEnrollments.value.filter((e) => e.status === 'in_progress').length)

const avgScore = computed(() => {
  if (myGrades.value.length === 0) return 0
  // 与成绩查询页面一致：优先用 calcTotalScore 计算加权总分，无详细成绩时回退
  const totals = myGrades.value.map((g) => {
    const d = store.detailedGrades.find((dg) => dg.studentId === g.studentId && dg.courseId === g.courseId)
    if (d) return store.calcTotalScore(g.courseId, d)
    const base = g.totalScore ?? g.score ?? 0
    return Math.min(100, base + store.getStudentQualityScore(g.courseId, g.studentId))
  })
  return Math.round(totals.reduce((s, t) => s + t, 0) / totals.length)
})

// 判断是否已录入期中及期末成绩（用于控制"平均成绩"的显示）
const hasMidtermAndFinal = computed(() => {
  if (!student.value) return false
  return store.detailedGrades.some((dg) => {
    if (dg.studentId !== student.value!.id) return false
    const hasMidterm = (dg.midtermExamScore != null && dg.midtermExamScore > 0) || (dg.midtermProjectScore != null && dg.midtermProjectScore > 0)
    const hasFinal = (dg.finalExamScore != null && dg.finalExamScore > 0) || (dg.finalProjectScore != null && dg.finalProjectScore > 0)
    return hasMidterm && hasFinal
  })
})

const totalCredits = computed(() => {
  return myEnrollments.value.reduce((sum, e) => {
    const course = store.courses.find((c) => c.id === e.courseId)
    return sum + (course ? Math.round(course.duration / 8) : 0)
  }, 0)
})

const avgProgress = computed(() => {
  if (myEnrollments.value.length === 0) return 0
  // 实时计算：基于已上课节数 / 总课节数
  const now = getNow()
  const progresses = myEnrollments.value.map((e) => {
    const courseSchedules = store.schedules.filter((s) => s.courseId === e.courseId)
    if (courseSchedules.length === 0) return 0
    const startedCount = courseSchedules.filter((s) => new Date(s.startDate) < now).length
    return Math.round((startedCount / courseSchedules.length) * 100)
  })
  return Math.round(progresses.reduce((s, p) => s + p, 0) / progresses.length)
})

const getCourse = (id: string) => store.courses.find((c) => c.id === id)

// ====== 今日学习轨迹（根据课表，按班级从数据库加载，与课表页面一致） ======
const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const dbSchedules = ref<any[]>([])

function getTodayLabel(): string {
  return dayLabels[(new Date().getDay() + 6) % 7]
}

function getScheduleDay(sch: any): string {
  if (sch.day) return sch.day
  if (sch.startDate) {
    const d = new Date(sch.startDate)
    if (!isNaN(d.getTime())) return dayLabels[(d.getDay() + 6) % 7]
  }
  return '-'
}

async function loadMySchedules() {
  try {
    const studentName = store.currentDisplayName || store.currentUser
    if (!studentName) return
    // 1. 查询学生信息获取班级（Java：GET /students?keyword= 返回裸数组）
    const students = await javaListStudents(studentName)
    const myInfo = students?.[0]
    if (!myInfo?.className) return
    // 2. 按班级加载排课（Java：GET /schedules 返回全部，按 className 前端过滤）
    const schedules = await javaListSchedules()
    if (schedules) {
      dbSchedules.value = schedules.filter((s: any) => s.className === myInfo.className)
    }
  } catch (e) {
    console.error('加载课表失败:', e)
  }
}

const todaySchedules = computed(() => {
  const today = getTodayLabel()
  return dbSchedules.value
    .filter((s: any) => getScheduleDay(s) === today)
    .sort((a: any, b: any) => (a.timeSlot || '').localeCompare(b.timeSlot || ''))
})

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

// ====== 素质评价雷达图数据（取素质评价分最高的 5 门课程） ======
const qualityRadarData = computed(() => {
  if (!student.value) return []
  const result: { label: string; value: number }[] = []
  for (const enr of myEnrollments.value) {
    const course = getCourse(enr.courseId)
    if (!course) continue
    const qe = store.getStudentQualityEvaluation(enr.courseId, student.value.id)
    if (!qe || qe.submissions.length === 0) continue
    const graded = qe.submissions.filter((s) => s.score !== undefined)
    if (graded.length === 0) continue
    const latest = graded[graded.length - 1]
    result.push({ label: course.title, value: Math.round(latest.score ?? 0) })
  }
  // 按分数降序，取前 5 门
  return result.sort((a, b) => b.value - a.value).slice(0, 5)
})

// ====== 增值评价数据 ======
const selectedTrendCourseIndex = ref(0)

const evalTrendData = computed(() => {
  if (!student.value) return []
  const studentId = student.value.id
  
  // 获取该学生的所有评价记录
  const studentEvals = store.evaluations
    .filter(ev => ev.studentId === studentId && ev.score > 0)
    .sort((a, b) => {
      // 先按课程分组，再按 sessionNumber 排序
      if (a.courseId !== b.courseId) return a.courseId.localeCompare(b.courseId)
      return a.sessionNumber - b.sessionNumber
    })
  
  if (studentEvals.length === 0) return []
  
  // 按课程分组
  const courseMap = new Map<string, { courseTitle: string; sessions: { session: number; score: number; date: string }[] }>()
  
  for (const ev of studentEvals) {
    const course = getCourse(ev.courseId)
    if (!course) continue
    
    if (!courseMap.has(ev.courseId)) {
      courseMap.set(ev.courseId, {
        courseTitle: course.title,
        sessions: []
      })
    }
    
    const courseData = courseMap.get(ev.courseId)!
    courseData.sessions.push({
      session: ev.sessionNumber,
      score: ev.score,
      date: ev.createdAt
    })
  }
  
  // 转换为图表数据格式
  const result: { courseId: string; courseTitle: string; points: { x: number; y: number; label: string }[] }[] = []
  
  courseMap.forEach((value, key) => {
    if (value.sessions.length < 1) return // 至少需要1次评价才能显示趋势
    const points = value.sessions.map(s => ({
      x: s.session,
      y: s.score,
      label: `第${s.session}次`
    }))
    result.push({
      courseId: key,
      courseTitle: value.courseTitle,
      points
    })
  })
  
  return result
})

// 获取增值评价统计信息
const evalTrendStats = computed(() => {
  if (evalTrendData.value.length === 0) return null
  
  const stats = evalTrendData.value.map(course => {
    const points = course.points
    const currentScore = points[points.length - 1].y
    const previousScore = points.length > 1 ? points[points.length - 2].y : null
    const change = previousScore !== null ? currentScore - previousScore : null
    
    return {
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      currentScore,
      previousScore,
      change,
      hasTrend: points.length > 1
    }
  })
  
  return stats
})

/** 绘制雷达图（坐标以 viewBox="-120 -120 440 440"、中心 (100,100)、最外层半径 150 为基准） */
function drawRadarChart(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: { label: string; value: number }[]
) {
  if (data.length === 0) return
  const angleOf = (i: number): number => ((360 / data.length) * i - 90) * Math.PI / 180

  // 网格多边形（5 层）
  for (let level = 1; level <= 5; level++) {
    const r = level * 30
    const points = data.map((_, i) => {
      const angle = angleOf(i)
      return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
    }).join(' ')
    svg.append('polygon')
      .attr('points', points)
      .attr('fill', 'none')
      .attr('stroke', '#5eb6b9')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.3)
  }

  // 轴线
  data.forEach((_, i) => {
    const angle = angleOf(i)
    svg.append('line')
      .attr('x1', 100).attr('y1', 100)
      .attr('x2', 100 + 150 * Math.cos(angle)).attr('y2', 100 + 150 * Math.sin(angle))
      .attr('stroke', '#5eb6b9')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.3)
  })

  // 数据多边形
  const polyPoints = data.map((d, i) => {
    const angle = angleOf(i)
    const r = d.value * 1.5
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
  }).join(' ')
  svg.append('polygon')
    .attr('points', polyPoints)
    .attr('fill', 'rgba(65, 90, 119, 0.2)')
    .attr('stroke', '#429fc4')
    .attr('stroke-width', 2)

  // 数据点 + 标签
  data.forEach((d, i) => {
    const angle = angleOf(i)
    const r = d.value * 1.5
    const x = 100 + r * Math.cos(angle)
    const y = 100 + r * Math.sin(angle)
    const lx = 100 + Math.min(r + 25, 170) * Math.cos(angle)
    const ly = 100 + Math.min(r + 25, 170) * Math.sin(angle)
    const anchor = x > 100 ? 'start' : 'end'

    svg.append('circle')
      .attr('cx', x).attr('cy', y)
      .attr('r', 4).attr('fill', '#429fc4')

    svg.append('text')
      .attr('x', lx).attr('y', ly)
      .attr('text-anchor', anchor)
      .attr('font-size', 9).attr('fill', '#5eb6b9')
      .text(d.label)

    svg.append('text')
      .attr('x', lx).attr('y', ly + 12)
      .attr('text-anchor', anchor)
      .attr('font-size', 9).attr('fill', '#429fc4').attr('font-weight', 'bold')
      .text(`${d.value}分`)
  })
}

const showDetailModal = ref(false)

// ====== 职业分析：期末成绩取最高的 6 门课程，与 1000 职业对照表比对，取重叠最大的 3 个职业 ======

/** 系统课程名 → 职业表课程名 映射（将系统课程与职业要求课程对齐） */
const COURSE_NAME_MAP: Record<string, string[]> = {
  'React前端开发实战': ['React', 'HTML', 'CSS', 'JavaScript', 'Web前端开发', '前端开发'],
  'Vue3组件化开发': ['Vue框架', 'Web前端开发', '前端开发', 'JavaScript'],
  'Python数据分析': ['Python数据分析', 'Python', '数据分析', '统计学', '数据可视化基础'],
  'Java企业级应用': ['Java程序设计', '微服务架构', '数据库原理', '软件工程'],
  '数据结构与算法': ['数据结构', '算法分析', '算法设计'],
  '前端工程化': ['Web前端开发', 'JavaScript', '前端开发', '软件工程'],
  'TypeScript进阶': ['程序设计基础', '编程基础'],
  '移动端开发': ['移动软件开发', '移动应用开发'],
  '微服务架构': ['微服务架构', '软件工程', '分布式系统'],
  '数据库原理与应用': ['数据库原理', '数据库系统', '数据库应用', '数据库基础', '数据库'],
}

/** 将系统课程标题映射为职业表中的课程名（显式映射优先，无映射时按名称包含关系兜底） */
function mapCourseToCareerNames(title: string): string[] {
  if (COURSE_NAME_MAP[title]) return COURSE_NAME_MAP[title]
  const matched: string[] = []
  for (const c of CAREERS) {
    for (const cn of c.courses) {
      if (cn.length >= 2 && (title.includes(cn) || cn.includes(title))) {
        if (!matched.includes(cn)) matched.push(cn)
      }
    }
  }
  return matched
}

/** 学生期末成绩最高的 6 门课程（期末笔试/期末项目取最高分，未出分的课程不计入） */
const finalTopCourses = computed(() => {
  if (!student.value) return []
  const courseScores: { title: string; score: number }[] = []
  for (const enr of myEnrollments.value) {
    const course = getCourse(enr.courseId)
    if (!course) continue
    const dg = store.detailedGrades.find((d) => d.studentId === student.value!.id && d.courseId === enr.courseId)
    if (!dg) continue
    const finalScore = Math.max(dg.finalExamScore ?? 0, dg.finalProjectScore ?? 0)
    if (finalScore <= 0) continue
    courseScores.push({ title: course.title, score: Math.round(finalScore) })
  }
  return courseScores.sort((a, b) => b.score - a.score).slice(0, 6)
})

/** 课程成绩雷达图数据：期末成绩最高的 6 门课程（label 过长截断，避免雷达图标签重叠） */
const careerRadarData = computed(() =>
  finalTopCourses.value.map((t) => ({
    label: t.title.length > 8 ? t.title.slice(0, 8) + '…' : t.title,
    value: t.score,
  }))
)

const careerRecommendations = computed(() => {
  const top6 = finalTopCourses.value
  if (top6.length === 0) return []

  // 将最高的 6 门系统课程映射为职业表课程名集合
  const owned: Set<string> = new Set()
  const courseOwnedMap: { courseTitle: string; matched: string[] }[] = []
  for (const cs of top6) {
    const matched = mapCourseToCareerNames(cs.title)
    matched.forEach((m) => owned.add(m))
    courseOwnedMap.push({ courseTitle: cs.title, matched })
  }

  // 逐职业计算重叠度（命中课程数），按重叠度降序、覆盖率降序取前 3
  const scored = CAREERS.map((c, idx) => {
    const overlap = c.courses.filter((cn) => owned.has(cn)).length
    return { career: c, overlap, coverage: c.courses.length > 0 ? overlap / c.courses.length : 0, idx }
  })
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.coverage - a.coverage || a.idx - b.idx)
    .slice(0, 3)

  return scored.map((s) => {
    const hitCourses = s.career.courses.filter((cn) => owned.has(cn))
    const hitCourseTitles = courseOwnedMap
      .filter((cm) => cm.matched.some((m) => hitCourses.includes(m)))
      .map((cm) => cm.courseTitle)
    return {
      title: s.career.name,
      description: `属于「${s.career.category}」，与您的${hitCourseTitles.join('、')}课程高度匹配。`,
      tags: hitCourses,
      matchScore: Math.round((s.overlap / 6) * 100),
      icon: 'briefcase',
    }
  })
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
  // 课程成绩雷达图数据源：优先取期末成绩最高的 6 门课程（职业分析），无期末成绩时回退平时评价能力雷达图
  const rd = careerRadarData.value.length > 0 ? careerRadarData.value : radarData.value
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
  infoContent.append('h2').attr('class', 'text-xl font-bold text-gray-900').text(s?.name || store.currentDisplayName || store.currentUser || '未知用户')
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
      .on('click', () => {
        const scrollY = window.scrollY
        showDetailModal.value = true
        reRender()
        window.scrollTo(0, scrollY)
      })

    const svg = svgWrap.append('svg').attr('viewBox', '-120 -120 440 440').attr('class', 'w-full h-full')
    drawRadarChart(svg, rd)

    // hover提示
    const hoverOverlay = svgWrap.append('div')
      .attr('class', 'absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity')
    hoverOverlay.append('span').attr('class', 'text-white font-medium text-sm bg-brand-600 px-3 py-1 rounded-full shadow-lg').text('点击查看详情')
  } else {
    radarCard.append('p').attr('class', 'text-gray-400 text-center py-12')
      .html('暂无期末成绩与平时评价数据<br />期末成绩发布后，系统将自动取成绩最高的 6 门课程生成课程成绩雷达图')
  }

  // 素质评价雷达图（取素质评价分最高的 5 门课程，与课程成绩雷达图并排）
  const qrd = qualityRadarData.value
  const qualityRadarCard = twoCol.append('div').attr('class', 'bg-white rounded-xl p-6 border border-emerald-400/20 shadow-sm')
  const qualityRadarTitle = qualityRadarCard.append('h3').attr('class', 'text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2')
  renderIcon(qualityRadarTitle, 'award').attr('class', 'w-5 h-5 text-emerald-600')
  qualityRadarTitle.append('span').text('素质评价雷达图')

  if (qrd.length > 0) {
    const svgWrap = qualityRadarCard.append('div').attr('class', 'relative w-72 h-72 mx-auto')
    const svg = svgWrap.append('svg').attr('viewBox', '-120 -120 440 440').attr('class', 'w-full h-full')
    drawRadarChart(svg, qrd)

    // 各课程素质评价分一览（按分数从高到低排序）
    const scoreList = qualityRadarCard.append('div').attr('class', 'mt-4 grid grid-cols-1 gap-1.5')
    qrd.forEach((d) => {
      const row = scoreList.append('div').attr('class', 'flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-400/10')
      row.append('span').attr('class', 'text-xs text-gray-600 truncate').text(d.label)
      row.append('span').attr('class', 'text-sm font-bold text-emerald-600 flex-shrink-0').text(`${d.value}分`)
    })
  } else {
    qualityRadarCard.append('div').attr('class', 'text-center py-8')
      .append('p').attr('class', 'text-gray-400').text('暂无素质评价数据')
    qualityRadarCard.append('p').attr('class', 'text-center text-sm text-gray-300 mt-1').text('完成素质评价打分后将生成雷达图')
  }

  // 增值评价板块
  const trendData = evalTrendData.value
  const trendStats = evalTrendStats.value
  const trendCard = container.append('div').attr('class', 'bg-white rounded-xl p-6 border border-brand-400/20 shadow-sm')
  const trendTitle = trendCard.append('h3').attr('class', 'text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2')
  renderIcon(trendTitle, 'trendingUp').attr('class', 'w-5 h-5 text-brand-600')
  trendTitle.append('span').text('增值评价')

  if (trendData.length > 0) {
    // 课程切换标签（放在折线图上方）
    const courseTabs = trendCard.append('div').attr('class', 'flex flex-wrap gap-2 mb-4')
    
    trendData.forEach((course, index) => {
      const isActive = selectedTrendCourseIndex.value === index
      const tab = courseTabs.append('button')
        .attr('class', `px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${isActive ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`)
        .text(course.courseTitle)
      
      tab.on('click', () => {
        selectedTrendCourseIndex.value = index
        const scrollY = window.scrollY
        reRender()
        window.scrollTo(0, scrollY)
      })
    })
    
    // 当前选中的课程
    const currentCourse = trendData[selectedTrendCourseIndex.value]
    const currentStat = trendStats?.[selectedTrendCourseIndex.value]
    
    // 绘制当前课程折线图
    const chartWidth = 400
    const chartHeight = 120
    const padding = { top: 20, right: 20, bottom: 30, left: 40 }
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom
    
    const courseSection = trendCard.append('div').attr('class', 'border border-brand-400/10 rounded-lg p-4')
    const courseHeader = courseSection.append('div').attr('class', 'flex items-center justify-between mb-3')
    courseHeader.append('h4').attr('class', 'font-semibold text-gray-900').text(currentCourse.courseTitle)
    
    // 统计信息
    if (currentStat && currentStat.hasTrend) {
      const change = currentStat.change!
      // 分数无变化时不显示统计文字（原为"保持不变"）
      if (change !== 0) {
        const changeColor = change > 0 ? 'text-emerald-600' : 'text-red-500'
        const changeText = change > 0 ? `进步 ${change.toFixed(1)} 分` : `退步 ${Math.abs(change).toFixed(1)} 分`
        courseHeader.append('span').attr('class', `text-sm font-medium ${changeColor}`).text(changeText)
      }
    } else {
      courseHeader.append('span').attr('class', 'text-xs text-gray-400').text('首次评价，暂无对比')
    }
    
    const svgContainer = courseSection.append('div').attr('class', 'flex justify-center')
    const svg = svgContainer.append('svg')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('viewBox', `0 0 ${chartWidth} ${chartHeight}`)
    
    const points = currentCourse.points
    const maxY = 100
    const xStep = points.length > 1 ? innerWidth / (points.length - 1) : 0
    
    // Y轴
    svg.append('line')
      .attr('x1', padding.left).attr('y1', padding.top)
      .attr('x2', padding.left).attr('y2', padding.top + innerHeight)
      .attr('stroke', '#e5e7eb').attr('stroke-width', 1)
    
    // X轴
    svg.append('line')
      .attr('x1', padding.left).attr('y1', padding.top + innerHeight)
      .attr('x2', padding.left + innerWidth).attr('y2', padding.top + innerHeight)
      .attr('stroke', '#e5e7eb').attr('stroke-width', 1)
    
    // Y轴刻度
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + innerHeight * (1 - i / 4)
      const val = maxY * (i / 4)
      svg.append('line')
        .attr('x1', padding.left - 5).attr('y1', y)
        .attr('x2', padding.left).attr('y2', y)
        .attr('stroke', '#9ca3af').attr('stroke-width', 1)
      svg.append('text')
        .attr('x', padding.left - 8).attr('y', y + 3)
        .attr('text-anchor', 'end').attr('font-size', '9').attr('fill', '#9ca3af')
        .text(val.toString())
    }
    
    // 折线路径
    const linePoints: string[] = []
    points.forEach((point, i) => {
      const x = padding.left + (points.length > 1 ? i * xStep : innerWidth / 2)
      const y = padding.top + innerHeight * (1 - point.y / 100)
      linePoints.push(`${x},${y}`)
    })
    
    // 折线
    if (linePoints.length > 1) {
      svg.append('polyline')
        .attr('points', linePoints.join(' '))
        .attr('fill', 'none')
        .attr('stroke', '#429fc4')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
    }
    
    // 数据点
    points.forEach((point, i) => {
      const x = padding.left + (points.length > 1 ? i * xStep : innerWidth / 2)
      const y = padding.top + innerHeight * (1 - point.y / 100)
      
      svg.append('circle')
        .attr('cx', x).attr('cy', y)
        .attr('r', 4)
        .attr('fill', '#429fc4')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
      
      svg.append('text')
        .attr('x', x).attr('y', y - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10').attr('fill', '#429fc4').attr('font-weight', 'bold')
        .text(`${point.y}分`)
      
      svg.append('text')
        .attr('x', x).attr('y', padding.top + innerHeight + 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9').attr('fill', '#6b7280')
        .text(point.label)
    })
  } else {
    // 无评价数据
    trendCard.append('div').attr('class', 'text-center py-8')
      .append('p').attr('class', 'text-gray-400').text('暂无评价数据')
    trendCard.append('p').attr('class', 'text-center text-sm text-gray-300 mt-1').text('完成课程评价后将生成增值评价趋势图')
  }

  // 学习统计
  const statCard = container.append('div').attr('class', 'bg-white rounded-xl p-6 border border-gray-100 shadow-sm')
  const statTitle = statCard.append('h3').attr('class', 'text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2')
  renderIcon(statTitle, 'trendingUp').attr('class', 'w-5 h-5 text-brand-600')
  statTitle.append('span').text('学习统计')

  const statItems = [
    { label: '学习中课程', value: `${inProgress.value} 门`, color: 'text-gray-900' },
    { label: '已完成课程', value: `${completed.value} 门`, color: 'text-emerald-600' },
    { label: '总学分', value: `${totalCredits.value} 学分`, color: 'text-brand-600' },
    ...(hasMidtermAndFinal.value ? [{ label: '平均成绩', value: `${avgScore.value} 分`, color: 'text-brand-700' }] : []),
    { label: '平均进度', value: `${avgProgress.value}%`, color: 'text-gray-900' },
  ]
  const statBody = statCard.append('div').attr('class', 'grid grid-cols-2 md:grid-cols-5 gap-3')
  statItems.forEach((item) => {
    const cell = statBody.append('div').attr('class', 'p-4 bg-gray-50 rounded-lg')
    cell.append('p').attr('class', 'text-sm text-gray-600').text(item.label)
    cell.append('p').attr('class', `text-2xl font-bold mt-1 ${item.color}`).text(item.value)
  })

  // 今日学习轨迹
  const todaySchs = todaySchedules.value
  const trackCard = container.append('div').attr('class', 'bg-white rounded-xl p-6 border border-brand-400/20 shadow-sm')
  const trackTitle = trackCard.append('h3').attr('class', 'text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2')
  renderIcon(trackTitle, 'bookOpen').attr('class', 'w-5 h-5 text-brand-600')
  trackTitle.append('span').text('今日学习轨迹')

  if (todaySchs.length > 0) {
    const trackList = trackCard.append('div').attr('class', 'relative')
    todaySchs.forEach((sch, index) => {
      const item = trackList.append('div').attr('class', 'flex gap-4 pb-6 relative')

      if (index < todaySchs.length - 1) {
        item.append('div').attr('class', 'absolute left-[7px] top-4 bottom-0 w-0.5 bg-blue-200')
      }

      item.append('div').attr('class', 'w-4 h-4 rounded-full mt-1 flex-shrink-0 bg-brand-600')

      const content = item.append('div').attr('class', 'flex-1')
      content.append('p').attr('class', 'font-medium text-gray-900').text(sch.title || getCourse(sch.courseId)?.title || '未知课程')
      content.append('p').attr('class', 'text-sm text-gray-400').text(sch.timeSlot || '')
    })
  } else {
    trackCard.append('p').attr('class', 'text-gray-400 text-center py-4').text('今日暂无课程安排')
  }

  // 详情弹窗 (showDetailModal)
  if (showDetailModal.value) {
    const modalOverlay = container.append('div').attr('class', 'fixed inset-0 z-50 flex items-center justify-center p-4')
    modalOverlay.append('div').attr('class', 'absolute inset-0 bg-black/50').on('click', () => {
      const scrollY = window.scrollY
      showDetailModal.value = false
      reRender()
      window.scrollTo(0, scrollY)
    })

    const modalBox = modalOverlay.append('div').attr('class', 'relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden')

    // modal header
    const modalHeader = modalBox.append('div').attr('class', 'flex items-center justify-between p-6 border-b border-brand-400/20')
    const modalHeaderTitle = modalHeader.append('h3').attr('class', 'text-xl font-bold text-gray-900 flex items-center gap-2')
    renderIcon(modalHeaderTitle, 'barChart3').attr('class', 'w-6 h-6 text-brand-600')
    modalHeaderTitle.append('span').text('能力分析详情')

    const closeBtn = modalHeader.append('button')
      .attr('class', 'p-2 hover:bg-brand-400/10 rounded-lg transition-colors')
      .on('click', () => {
        const scrollY = window.scrollY
        showDetailModal.value = false
        reRender()
        window.scrollTo(0, scrollY)
      })
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
    courseAnalysisTitle.append('span').text(careerRadarData.value.length > 0 ? `期末成绩最高的 ${finalTopCourses.value.length} 门课程` : '课程分析')

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
      careerList.append('div').attr('class', 'text-gray-400 text-center py-8').text('暂无期末成绩，发布后系统将自动生成职业推荐')
    }
  }
}

function reRender() {
  const el = document.getElementById('student-profile-root')
  if (el) renderProfile(el)
}

onMounted(async () => {
  await loadMySchedules()
  const el = document.getElementById('student-profile-root')
  if (el) renderProfile(el)
})

watch([myEnrollments, myGrades, todaySchedules, hasMidtermAndFinal, avgProgress, store.evaluations, store.courses], () => {
  const el = document.getElementById('student-profile-root')
  if (el) renderProfile(el)
}, { deep: true })
</script>
