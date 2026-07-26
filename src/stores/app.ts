import { ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  Course, Category, Student, Schedule, Enrollment, Teacher, Grade,
  CloudFile, TodoItem, OnlineDoc, Note, Evaluation, EvaluationConfig,
  StudentGroup, EvalAnomaly, EvalReminder, GradeWeightConfig, DetailedGrade,
  Mentor, Leader, AITierQuestion, StudentTierRecord, EvalType,
  Homework, HomeworkSubmission
} from '@/types'
import { getDefaultGradeConfig, TEMPLATE_EVAL_TYPES } from '@/types'
import {
  courses as mockCourses,
  categories as mockCategories,
  students as mockStudents,
  schedules as mockSchedules,
  enrollments as mockEnrollments,
  teachers as mockTeachers,
  grades as mockGrades,
  evaluationConfigs as mockEvalConfigs,
  evaluations as mockEvaluations,
  studentGroups as mockStudentGroups,
  detailedGrades as mockDetailedGrades,
  mentors as mockMentors,
  leaders as mockLeaders,
  onlineDocs as mockOnlineDocs,
  notes as mockNotes,
  todoItems as mockTodos,
  cloudFiles as mockCloudFiles,
  homework as mockHomework,
  homeworkSubmissions as mockHomeworkSubmissions,
  examScores as mockExamScores,
  supplementaryGrades as mockSupplementaryGrades,
  supplementaryAll
} from '@/data/mockData'

type UserRole = 'admin' | 'teacher' | 'student' | 'mentor' | 'leader' | null

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    // 数组类型：如果 localStorage 存的是空数组，也用 fallback（防止 stale 空数组覆盖 mock 数据）
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback)) return fallback
    return parsed
  } catch {
    return fallback
  }
}

const saveToStorage = (key: string, data: unknown) => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const useAppStore = defineStore('app', () => {
  // ====== State ======
  const courses = ref<Course[]>(loadFromStorage('courses', mockCourses))
  const categories = ref<Category[]>(loadFromStorage('categories', mockCategories))
  const students = ref<Student[]>(loadFromStorage('students', mockStudents))
  const schedules = ref<Schedule[]>(loadFromStorage('schedules', [...mockSchedules, ...supplementaryAll.supplementarySchedules]))
  const enrollments = ref<Enrollment[]>(loadFromStorage('enrollments', [...mockEnrollments, ...supplementaryAll.supplementaryEnrollments]))
  const teachers = ref<Teacher[]>(loadFromStorage('teachers', mockTeachers))
  const grades = ref<Grade[]>(loadFromStorage('grades', [...mockGrades, ...mockSupplementaryGrades]))
  const cloudFiles = ref<CloudFile[]>(loadFromStorage<CloudFile[]>('cloudFiles', [...mockCloudFiles, ...supplementaryAll.supplementaryCloudFiles]))
  const todos = ref<TodoItem[]>(loadFromStorage<TodoItem[]>('todos', [...mockTodos, ...supplementaryAll.supplementaryTodos]))
  const onlineDocs = ref<OnlineDoc[]>(loadFromStorage<OnlineDoc[]>('onlineDocs', [...mockOnlineDocs, ...supplementaryAll.supplementaryOnlineDocs]))
  const notes = ref<Note[]>(loadFromStorage<Note[]>('notes', [...mockNotes, ...supplementaryAll.supplementaryNotes]))
  const evaluations = ref<Evaluation[]>(loadFromStorage<Evaluation[]>('evaluations', [...mockEvaluations, ...supplementaryAll.supplementaryEvaluations]))
  const evalConfigs = ref<EvaluationConfig[]>(loadFromStorage<EvaluationConfig[]>('evalConfigs', mockEvalConfigs))
  const studentGroups = ref<StudentGroup[]>(loadFromStorage<StudentGroup[]>('studentGroups', [...mockStudentGroups, ...supplementaryAll.supplementaryStudentGroups]))
  const evalReminders = ref<EvalReminder[]>(loadFromStorage<EvalReminder[]>('evalReminders', supplementaryAll.supplementaryEvalReminders))
  const gradeConfigs = ref<Record<string, GradeWeightConfig>>(loadFromStorage<Record<string, GradeWeightConfig>>('gradeConfigs', {}))
  const detailedGrades = ref<DetailedGrade[]>(loadFromStorage<DetailedGrade[]>('detailedGrades', [...mockDetailedGrades, ...supplementaryAll.supplementaryDetailedGrades]))
  const homework = ref<Homework[]>(loadFromStorage<Homework[]>('homework', [...mockHomework, ...supplementaryAll.supplementaryHomework]))
  const homeworkSubmissions = ref<HomeworkSubmission[]>(loadFromStorage<HomeworkSubmission[]>('homeworkSubmissions', [...mockHomeworkSubmissions, ...supplementaryAll.supplementaryHomeworkSubmissions]))
  const isLoggedIn = ref<boolean>(loadFromStorage<boolean>('isLoggedIn', false))
  const currentUser = ref<string | null>(loadFromStorage<string | null>('currentUser', null))
  const currentRole = ref<UserRole>(loadFromStorage<UserRole>('currentRole', null))
  const hasEvalReminders = ref<boolean>(false)

  // 企业导师数据
  const mentors = ref<Mentor[]>(loadFromStorage<Mentor[]>('mentors', mockMentors))
  // 学院领导数据（只读演示数据，不从 localStorage 缓存，确保新数据及时生效）
  const leaders = ref<Leader[]>([...mockLeaders])
  // 次要角色（用于 leader+teacher/mentor 双重身份）
  const secondaryRoles = ref<UserRole[]>(loadFromStorage<UserRole[]>('secondaryRoles', []))

  // 教师已提交的评价记录（string[]，key: `${courseId}||${studentId}||${session}||${type}`）
  const teacherSubmittedEvals = ref<string[]>(
    loadFromStorage<string[]>('teacherSubmittedEvals', [])
  )

  // 考试/项目成绩
  const examScores = ref<import('@/types').ExamScore[]>(
    loadFromStorage<import('@/types').ExamScore[]>('examScores', mockExamScores)
  )

  // 考试/项目权重配置 (courseId → examName → weight)
  const examWeights = ref<Record<string, Record<string, number>>>(
    loadFromStorage<Record<string, Record<string, number>>>('examWeights', {})
  )

  // 配置完成标记（权重配置 / 评价方案配置）
  const configCompleted = ref<Record<string, { weights: boolean; evalConfig: boolean }>>(
    loadFromStorage<Record<string, { weights: boolean; evalConfig: boolean }>>('configCompleted', {})
  )

  // 已锁定的评价轮次（key: `${courseId}||${sessionNumber}`）
  // 锁定后该轮次无法再修改评价
  const lockedSessions = ref<string[]>(
    loadFromStorage<string[]>('lockedSessions', [])
  )

  // AI 分层记录（key: `${courseId}||${studentId}`）
  const studentTiers = ref<Record<string, StudentTierRecord>>(
    loadFromStorage<Record<string, StudentTierRecord>>('studentTiers', {})
  )

  // 全局模拟参考日期（用于前端时间模拟，为空时按课程课表第一节课开课时间计算）
  const effectiveReferenceDate = ref<string>(
    loadFromStorage<string>('effectiveReferenceDate', '2026-06-24')
  )

  // ====== Actions ======

  function login(username: string, role: UserRole) {
    localStorage.setItem('isLoggedIn', JSON.stringify(true))
    localStorage.setItem('currentUser', JSON.stringify(username))
    localStorage.setItem('currentRole', JSON.stringify(role))
    isLoggedIn.value = true
    currentUser.value = username
    currentRole.value = role

    // 检测双重身份：如果以 mentor/leader 登录，检测是否同时有其他角色
    const detected: UserRole[] = []
    if (role === 'leader') {
      // 检测 leader 是否同时也是教师或导师
      const leaderData = leaders.value.find((l) => l.name === username)
      if (leaderData) {
        if (leaderData.asTeacher && teachers.value.some((t) => t.name === username)) {
          detected.push('teacher')
        }
        if (leaderData.asMentor && mentors.value.some((m) => m.name === username)) {
          detected.push('mentor')
        }
      }
    }
    secondaryRoles.value = detected
    localStorage.setItem('secondaryRoles', JSON.stringify(detected))
  }

  function logout() {
    localStorage.setItem('isLoggedIn', JSON.stringify(false))
    localStorage.setItem('currentUser', JSON.stringify(null))
    localStorage.setItem('currentRole', JSON.stringify(null))
    localStorage.setItem('secondaryRoles', JSON.stringify([]))
    isLoggedIn.value = false
    currentUser.value = null
    currentRole.value = null
    secondaryRoles.value = []
  }

  function addCourse(course: Course) {
    courses.value = [...courses.value, course]
    saveToStorage('courses', courses.value)
    // 同步分类课程数量
    categories.value = categories.value.map((cat) =>
      cat.id === course.categoryId ? { ...cat, courseCount: cat.courseCount + 1 } : cat
    )
    saveToStorage('categories', categories.value)
    // 同步教师 courseIds
    teachers.value = teachers.value.map((t) =>
      t.name === course.teacher && !t.courseIds.includes(course.id)
        ? { ...t, courseIds: [...t.courseIds, course.id] }
        : t
    )
    saveToStorage('teachers', teachers.value)
  }

  function updateCourse(id: string, data: Partial<Course>) {
    const old = courses.value.find((c) => c.id === id)
    courses.value = courses.value.map((c) => (c.id === id ? { ...c, ...data } : c))
    saveToStorage('courses', courses.value)
    // 如果分类发生变化，同步分类课程数量
    if (old && data.categoryId && data.categoryId !== old.categoryId) {
      categories.value = categories.value.map((cat) => {
        if (cat.id === old.categoryId) return { ...cat, courseCount: Math.max(0, cat.courseCount - 1) }
        if (cat.id === data.categoryId) return { ...cat, courseCount: cat.courseCount + 1 }
        return cat
      })
      saveToStorage('categories', categories.value)
    }
    // 如果教师发生变化，同步教师 courseIds
    if (old && data.teacher && data.teacher !== old.teacher) {
      // 从旧教师中移除
      teachers.value = teachers.value.map((t) =>
        t.name === old.teacher ? { ...t, courseIds: t.courseIds.filter((cid) => cid !== id) } : t
      )
      // 添加到新教师
      teachers.value = teachers.value.map((t) =>
        t.name === data.teacher && !t.courseIds.includes(id)
          ? { ...t, courseIds: [...t.courseIds, id] }
          : t
      )
      saveToStorage('teachers', teachers.value)
    }
  }

  function deleteCourse(id: string) {
    const old = courses.value.find((c) => c.id === id)
    courses.value = courses.value.filter((c) => c.id !== id)
    saveToStorage('courses', courses.value)
    if (old) {
      // 同步分类课程数量
      categories.value = categories.value.map((cat) =>
        cat.id === old.categoryId ? { ...cat, courseCount: Math.max(0, cat.courseCount - 1) } : cat
      )
      saveToStorage('categories', categories.value)
      // 同步教师 courseIds
      teachers.value = teachers.value.map((t) =>
        t.name === old.teacher ? { ...t, courseIds: t.courseIds.filter((cid) => cid !== id) } : t
      )
      saveToStorage('teachers', teachers.value)
    }
  }

  function addCategory(category: Category) {
    categories.value = [...categories.value, category]
    saveToStorage('categories', categories.value)
  }

  function updateCategory(id: string, data: Partial<Category>) {
    categories.value = categories.value.map((c) => (c.id === id ? { ...c, ...data } : c))
    saveToStorage('categories', categories.value)
  }

  function deleteCategory(id: string) {
    categories.value = categories.value.filter((c) => c.id !== id)
    saveToStorage('categories', categories.value)
  }

  function addSchedule(schedule: Schedule) {
    schedules.value = [...schedules.value, schedule]
    saveToStorage('schedules', schedules.value)
    recalculateProgress(schedule.courseId)
  }

  function updateSchedule(id: string, data: Partial<Schedule>) {
    const old = schedules.value.find((s) => s.id === id)
    schedules.value = schedules.value.map((s) => (s.id === id ? { ...s, ...data } : s))
    saveToStorage('schedules', schedules.value)
    if (old) recalculateProgress(old.courseId)
  }

  function deleteSchedule(id: string) {
    const old = schedules.value.find((s) => s.id === id)
    schedules.value = schedules.value.filter((s) => s.id !== id)
    saveToStorage('schedules', schedules.value)
    if (old) recalculateProgress(old.courseId)
  }

  function addEnrollment(enrollment: Enrollment) {
    enrollments.value = [...enrollments.value, enrollment]
    saveToStorage('enrollments', enrollments.value)
  }

  function updateEnrollment(id: string, data: Partial<Enrollment>) {
    enrollments.value = enrollments.value.map((e) => (e.id === id ? { ...e, ...data } : e))
    saveToStorage('enrollments', enrollments.value)
  }

  function deleteEnrollment(id: string) {
    enrollments.value = enrollments.value.filter((e) => e.id !== id)
    saveToStorage('enrollments', enrollments.value)
  }

  function addGrade(grade: Grade) {
    const course = courses.value.find(c => c.id === grade.courseId)
    if (course && course.status === 'inactive') {
      console.warn('Cannot modify ended course')
      return
    }
    grades.value = [...grades.value, grade]
    saveToStorage('grades', grades.value)
  }

  function updateGrade(id: string, data: Partial<Grade>) {
    const grade = grades.value.find(g => g.id === id)
    if (grade) {
      const course = courses.value.find(c => c.id === grade.courseId)
      if (course && course.status === 'inactive') {
        console.warn('Cannot modify ended course')
        return
      }
    }
    grades.value = grades.value.map((g) => (g.id === id ? { ...g, ...data } : g))
    saveToStorage('grades', grades.value)
  }

  function deleteGrade(id: string) {
    grades.value = grades.value.filter((g) => g.id !== id)
    saveToStorage('grades', grades.value)
  }

  function addCloudFile(file: CloudFile) {
    cloudFiles.value = [...cloudFiles.value, file]
    saveToStorage('cloudFiles', cloudFiles.value)
  }

  function deleteCloudFile(id: string) {
    cloudFiles.value = cloudFiles.value.filter((f) => f.id !== id)
    saveToStorage('cloudFiles', cloudFiles.value)
  }

  function addTodo(todo: TodoItem) {
    todos.value = [...todos.value, { ...todo, createdBy: currentUser.value || '未知' }]
    saveToStorage('todos', todos.value)
  }

  function updateTodo(id: string, data: Partial<TodoItem>) {
    todos.value = todos.value.map((t) => (t.id === id ? { ...t, ...data } : t))
    saveToStorage('todos', todos.value)
  }

  function deleteTodo(id: string) {
    todos.value = todos.value.filter((t) => t.id !== id)
    saveToStorage('todos', todos.value)
  }

  function addOnlineDoc(doc: OnlineDoc) {
    onlineDocs.value = [...onlineDocs.value, doc]
    saveToStorage('onlineDocs', onlineDocs.value)
  }

  function updateOnlineDoc(id: string, data: Partial<OnlineDoc>) {
    onlineDocs.value = onlineDocs.value.map((d) => (d.id === id ? { ...d, ...data } : d))
    saveToStorage('onlineDocs', onlineDocs.value)
  }

  function deleteOnlineDoc(id: string) {
    onlineDocs.value = onlineDocs.value.filter((d) => d.id !== id)
    saveToStorage('onlineDocs', onlineDocs.value)
  }

  function addNote(note: Note) {
    notes.value = [...notes.value, { ...note, createdBy: currentUser.value || '未知' }]
    saveToStorage('notes', notes.value)
  }

  function updateNote(id: string, data: Partial<Note>) {
    notes.value = notes.value.map((n) => (n.id === id ? { ...n, ...data } : n))
    saveToStorage('notes', notes.value)
  }

  function deleteNote(id: string) {
    notes.value = notes.value.filter((n) => n.id !== id)
    saveToStorage('notes', notes.value)
  }

  // ====== 作业系统 ======

  function addHomework(hw: Homework) {
    homework.value = [...homework.value, hw]
    saveToStorage('homework', homework.value)
  }

  function updateHomework(id: string, data: Partial<Homework>) {
    homework.value = homework.value.map((h) => (h.id === id ? { ...h, ...data } : h))
    saveToStorage('homework', homework.value)
  }

  function deleteHomework(id: string) {
    homework.value = homework.value.filter((h) => h.id !== id)
    saveToStorage('homework', homework.value)
  }

  function getCourseHomework(courseId: string): Homework[] {
    return homework.value.filter((h) => h.courseId === courseId)
  }

  function getCourseCloudFiles(courseId: string): CloudFile[] {
    return cloudFiles.value.filter((f) => f.courseId === courseId)
  }

  function submitHomework(submission: HomeworkSubmission) {
    homeworkSubmissions.value = [...homeworkSubmissions.value, submission]
    saveToStorage('homeworkSubmissions', homeworkSubmissions.value)
  }

  function getHomeworkSubmission(homeworkId: string, studentId: string): HomeworkSubmission | undefined {
    return homeworkSubmissions.value.find(
      (s) => s.homeworkId === homeworkId && s.studentId === studentId
    )
  }

  // ====== 评价系统 ======

  function addEvaluation(ev: Evaluation) {
    const course = courses.value.find(c => c.id === ev.courseId)
    if (course && course.status === 'inactive') {
      console.warn('Cannot modify ended course')
      return
    }
    evaluations.value = [...evaluations.value, ev]
    saveToStorage('evaluations', evaluations.value)
  }

  function updateEvaluation(id: string, data: Partial<Evaluation>) {
    const ev = evaluations.value.find(e => e.id === id)
    if (ev) {
      const course = courses.value.find(c => c.id === ev.courseId)
      if (course && course.status === 'inactive') {
        console.warn('Cannot modify ended course')
        return
      }
    }
    evaluations.value = evaluations.value.map((e) => (e.id === id ? { ...e, ...data } : e))
    saveToStorage('evaluations', evaluations.value)
  }

  function deleteEvaluation(id: string) {
    evaluations.value = evaluations.value.filter((e) => e.id !== id)
    saveToStorage('evaluations', evaluations.value)
  }

  function setEvalConfig(config: EvaluationConfig) {
    const existing = evalConfigs.value.findIndex((c) => c.courseId === config.courseId)
    if (existing >= 0) {
      evalConfigs.value = evalConfigs.value.map((c) => (c.courseId === config.courseId ? config : c))
    } else {
      evalConfigs.value = [...evalConfigs.value, config]
    }
    saveToStorage('evalConfigs', evalConfigs.value)
  }

  function addStudentGroup(group: StudentGroup) {
    studentGroups.value = [...studentGroups.value, group]
    saveToStorage('studentGroups', studentGroups.value)
  }

  function addStudent(student: Student) {
    students.value = [...students.value, student]
    saveToStorage('students', students.value)
  }

  function updateStudent(id: string, data: Partial<Student>) {
    students.value = students.value.map((s) => (s.id === id ? { ...s, ...data } : s))
    saveToStorage('students', students.value)
  }

  function updateStudentGroup(id: string, data: Partial<StudentGroup>) {
    studentGroups.value = studentGroups.value.map((g) => (g.id === id ? { ...g, ...data } : g))
    saveToStorage('studentGroups', studentGroups.value)
  }

  function deleteStudentGroup(id: string) {
    studentGroups.value = studentGroups.value.filter((g) => g.id !== id)
    saveToStorage('studentGroups', studentGroups.value)
  }

  /** 获取某课程的分组列表 */
  function getCourseGroups(courseId: string): StudentGroup[] {
    return studentGroups.value.filter((g) => g.courseId === courseId)
  }

  /** 清空某课程所有分组 */
  function clearCourseGroups(courseId: string) {
    studentGroups.value = studentGroups.value.filter((g) => g.courseId !== courseId)
    saveToStorage('studentGroups', studentGroups.value)
  }

  /** 批量设置某课程的分组 */
  function setCourseGroups(courseId: string, groups: { name: string; memberIds: string[] }[]) {
    // 先清空旧分组
    studentGroups.value = studentGroups.value.filter((g) => g.courseId !== courseId)
    // 添加新分组
    groups.forEach((g, i) => {
      studentGroups.value.push({
        id: `grp-${courseId}-${Date.now()}-${i}`,
        courseId,
        name: g.name,
        memberIds: g.memberIds,
      })
    })
    saveToStorage('studentGroups', studentGroups.value)
  }

  /** 随机分组：将某课程的学生随机分成 n 组 */
  function randomGroup(courseId: string, groupCount: number) {
    // 获取该课程所有未退课学生
    const members = enrollments.value
      .filter((e) => e.courseId === courseId && e.status !== 'dropped')
      .map((e) => e.studentId)
    // 洗牌算法
    const shuffled = [...members]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    // 均分到各组
    const groups: { name: string; memberIds: string[] }[] = []
    const perGroup = Math.ceil(shuffled.length / groupCount)
    for (let g = 0; g < groupCount; g++) {
      const start = g * perGroup
      const end = start + perGroup
      if (start >= shuffled.length) break
      groups.push({
        name: `第${'一二三四五六七八九十'[g] || g + 1}组`,
        memberIds: shuffled.slice(start, end),
      })
    }
    setCourseGroups(courseId, groups)
    return groups
  }

  function detectAnomalies(courseId: string, sessionNumber: number): EvalAnomaly[] {
    const course = courses.value.find((c) => c.id === courseId)
    if (!course) return []
    const anomalies: EvalAnomaly[] = []
    // 找出该课程此轮的所有自评
    const selfEvals = evaluations.value.filter(
      (e) => e.courseId === courseId && e.sessionNumber === sessionNumber && e.type === 'self'
    )
    // 找出所有非自评的评价
    const otherEvals = evaluations.value.filter(
      (e) => e.courseId === courseId && e.sessionNumber === sessionNumber && e.type !== 'self'
    )
    for (const self of selfEvals) {
      // 计算其他评价的平均分
      const related = otherEvals.filter((e) => e.studentId === self.studentId)
      if (related.length === 0) continue
      const avgScore = Math.round(related.reduce((s, e) => s + e.score, 0) / related.length)
      const diff = Math.abs(self.score - avgScore)
      if (diff > 20) {
        const student = students.value.find((s) => s.id === self.studentId)
        anomalies.push({
          id: `anomaly-${courseId}-${self.studentId}-${sessionNumber}`,
          courseId,
          studentId: self.studentId,
          studentName: student?.name || '未知',
          sessionNumber,
          type: 'self',
          selfScore: self.score,
          avgScore,
          diff,
          warning: `自评(${self.score}分)与其他评价平均分(${avgScore}分)相差${diff}分，差异过大！`,
        })
      }
    }
    return anomalies
  }

  /** 教师提交评价（提交后锁定，学生端可见） */
  function submitTeacherEval(courseId: string, studentId: string, session: number, type: string) {
    const key = `${courseId}||${studentId}||${session}||${type}`
    if (!teacherSubmittedEvals.value.includes(key)) {
      teacherSubmittedEvals.value = [...teacherSubmittedEvals.value, key]
      saveToStorage('teacherSubmittedEvals', teacherSubmittedEvals.value)
    }
  }

  /** 检查某条教师评价是否已提交 */
  function isTeacherEvalSubmitted(courseId: string, studentId: string, session: number, type: string): boolean {
    const key = `${courseId}||${studentId}||${session}||${type}`
    return teacherSubmittedEvals.value.includes(key)
  }

  /** 获取某学生当前可查看的教师最终评分 */
  function getSubmittedTeacherScore(courseId: string, studentId: string, session: number, type: string): number | null {
    if (!isTeacherEvalSubmitted(courseId, studentId, session, type)) return null
    const ev = evaluations.value.find(
      (e) => e.courseId === courseId && e.studentId === studentId && e.sessionNumber === session && e.type === type
    )
    return ev?.score ?? null
  }

  /** 考试/项目成绩操作 */
  function addExamScore(score: import('@/types').ExamScore) {
    examScores.value.push(score)
    saveToStorage('examScores', examScores.value)
  }

  function updateExamScore(id: string, updates: Partial<import('@/types').ExamScore>) {
    const idx = examScores.value.findIndex((s) => s.id === id)
    if (idx !== -1) {
      examScores.value[idx] = { ...examScores.value[idx], ...updates }
      saveToStorage('examScores', examScores.value)
    }
  }

  function submitExamScores(courseId: string, examName: string, studentIds?: string[]) {
    examScores.value = examScores.value.map((s) => {
      if (s.courseId === courseId && s.examName === examName && s.status === 'draft'
          && (!studentIds || studentIds.includes(s.studentId))) {
        return { ...s, status: 'submitted' as const, gradedAt: new Date().toISOString().split('T')[0] }
      }
      return s
    })
    saveToStorage('examScores', examScores.value)
  }

  function getExamScoresForCourse(courseId: string, examName?: string): import('@/types').ExamScore[] {
    let result = examScores.value.filter((s) => s.courseId === courseId)
    if (examName) result = result.filter((s) => s.examName === examName)
    return result
  }

  /** 获取课程已定义的考试/项目名称列表 */
  function getExamNames(courseId: string): string[] {
    const names = new Set(examScores.value.filter((s) => s.courseId === courseId).map((s) => s.examName))
    return Array.from(names).sort()
  }

  // ====== 考试/项目权重配置 ======

  /** 设置某个考试/项目的权重 */
  function setExamWeight(courseId: string, examName: string, weight: number) {
    const courseWeights = { ...(examWeights.value[courseId] || {}) }
    courseWeights[examName] = Math.min(100, Math.max(0, weight))
    examWeights.value = { ...examWeights.value, [courseId]: courseWeights }
    saveToStorage('examWeights', examWeights.value)
  }

  /** 获取某个考试/项目的权重 */
  function getExamWeight(courseId: string, examName: string): number {
    return examWeights.value[courseId]?.[examName] ?? 0
  }

  /** 获取课程所有考试/项目的权重配置 */
  function getExamWeightsForCourse(courseId: string): Record<string, number> {
    return examWeights.value[courseId] || {}
  }

  /** 检查课程是否有已提交的期末考试成绩（期末考试/期末项目） */
  function hasFinalExamSubmitted(courseId: string): boolean {
    return examScores.value.some(
      (s) => s.courseId === courseId &&
        (s.type === 'final_exam' || s.type === 'final_project') &&
        s.status === 'submitted'
    )
  }

  /** 评价方案是否可编辑（第一节课开始前可编辑，开始后锁定） */
  function isEvalConfigEditable(courseId: string): boolean {
    return !isFirstClassStarted(courseId)
  }

  /** 成绩权重是否可编辑（期末考试成绩录入前可编辑，录入后锁定） */
  function isWeightConfigEditable(courseId: string): boolean {
    return !hasFinalExamSubmitted(courseId)
  }

  // ====== 评价轮次锁定与时机 ======

  /** 锁定某评价轮次（锁定后不可再修改评价） */
  function lockSession(courseId: string, sessionNumber: number) {
    const key = `${courseId}||${sessionNumber}`
    if (!lockedSessions.value.includes(key)) {
      lockedSessions.value = [...lockedSessions.value, key]
      saveToStorage('lockedSessions', lockedSessions.value)
    }
  }

  /** 检查某评价轮次是否已锁定 */
  function isSessionLocked(courseId: string, sessionNumber: number): boolean {
    return lockedSessions.value.includes(`${courseId}||${sessionNumber}`)
  }

  /**
   * 获取某评价轮次对应的课次索引范围
   * 将课程所有课次按总评价次数均分
   */
  function getSessionScheduleRangeIndex(courseId: string, sessionNumber: number, totalSessions: number): { startIdx: number; endIdx: number } | null {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    if (courseSchedules.length === 0) return null

    const perSession = Math.ceil(courseSchedules.length / totalSessions)
    const startIdx = (sessionNumber - 1) * perSession
    const endIdx = Math.min(sessionNumber * perSession - 1, courseSchedules.length - 1)

    if (startIdx >= courseSchedules.length) return null

    return { startIdx, endIdx }
  }

  /**
   * 获取某评价轮次对应的课次结束日期
   * 将课程的所有课次按总评价次数均分后，取对应轮次的最后一节课结束时间
   */
  function getSessionEndDate(courseId: string, sessionNumber: number): Date | null {
    const totalSessions = getEvalSessions(courseId)
    const range = getSessionScheduleRangeIndex(courseId, sessionNumber, totalSessions)
    if (!range) return null

    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    return new Date(courseSchedules[range.endIdx].endDate)
  }

  /**
   * 判断某评价轮次是否已到开启时间
   * 第1次评价从第一节课上课后开启
   * 第k次评价从该轮次对应第一节课上课后开启
   */
  function isSessionTime(courseId: string, sessionNumber: number): boolean {
    const totalSessions = getEvalSessions(courseId)

    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    if (courseSchedules.length === 0) return true

    const ref = getCourseReferenceDate(courseId)

    // 第1次评价从第一节课上课后开启
    if (sessionNumber === 1) {
      return ref > new Date(courseSchedules[0].startDate)
    }

    // 其他轮次：从对应轮次第一节课上课后开始
    const range = getSessionScheduleRangeIndex(courseId, sessionNumber, totalSessions)
    if (!range) return true
    return ref > new Date(courseSchedules[range.startIdx].startDate)
  }

  /**
   * 判断最终评价轮次是否已过截止期
   * 最终评价截止时间为最后一节课结束时间后第三天
   */
  function isFinalSessionDeadlinePassed(courseId: string, totalSessions: number): boolean {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    if (courseSchedules.length === 0) return false

    const ref = getCourseReferenceDate(courseId)

    // 最终评价截止时间：最后一节课结束时间 + 3天
    const lastEndDate = new Date(courseSchedules[courseSchedules.length - 1].endDate)
    lastEndDate.setDate(lastEndDate.getDate() + 3)
    return ref > lastEndDate
  }

  /**
   * 自动锁定所有历史轮次并处理逾期
   * 当第 N 次评价开启时，第 1 ~ N-1 次及之前的评价自动锁定
   */
  function autoLockPreviousSession(courseId: string, currentSession: number) {
    for (let s = 1; s < currentSession; s++) {
      if (!isSessionLocked(courseId, s)) {
        processSessionOverdue(courseId, s)
        markSessionEvalRemindersCompleted(courseId, s)
        lockSession(courseId, s)
      }
    }
  }

  /**
   * 自动锁定所有已到期的评价轮次
   * 当第 N+1 轮次已到开启时间时，锁定第 N 轮次
   * 当课程结束时，锁定最终轮次
   * 按课程逐一检查
   */
  function autoLockExpiredSessions() {
    const activeCourses = courses.value.filter((c) => c.status === 'active')
    for (const course of activeCourses) {
      const total = getEvalSessions(course.id)
      // 检查各轮次：如果下一轮已到开启时间，锁定当前轮
      for (let s = 1; s < total; s++) {
        if (isSessionTime(course.id, s + 1) && !isSessionLocked(course.id, s)) {
          processSessionOverdue(course.id, s)
          markSessionEvalRemindersCompleted(course.id, s)
          lockSession(course.id, s)
        }
      }
      // 课程已结束，锁定最终轮次
      if (isFinalSessionDeadlinePassed(course.id, total) && !isSessionLocked(course.id, total)) {
        processSessionOverdue(course.id, total)
        markSessionEvalRemindersCompleted(course.id, total)
        lockSession(course.id, total)
      }
    }
  }

  // ====== 评价待办提醒生成 ======

  /**
   * 计算某评价轮次的截止日期
   * - 最终轮次：最后一节课结束时间
   * - 非最终轮次：该轮次对应最后一节课结束时间
   */
  function getSessionDeadline(courseId: string, sessionNumber: number, totalSessions: number): string {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    if (courseSchedules.length === 0) return ''

    if (sessionNumber >= totalSessions) {
      // 最终轮次：最后一节课结束时间后第三天
      const lastEnd = new Date(courseSchedules[courseSchedules.length - 1].endDate)
      lastEnd.setDate(lastEnd.getDate() + 3)
      return lastEnd.toISOString().split('T')[0]
    }
    // 非最终轮次：该轮次最后一节课结束时间
    const end = getSessionEndDate(courseId, sessionNumber)
    if (end) return end.toISOString().split('T')[0]
    return ''
  }

  /** 
   * 当某评价轮次可开始评价时，生成待办提醒（教师端和学生端）
   * 含截止日期计算
   */
  function generateSessionReminders(courseId: string, sessionNumber: number) {
    const course = courses.value.find((c) => c.id === courseId)
    const config = evalConfigs.value.find((c) => c.courseId === courseId)
    if (!course || !config) return

    const totalSessions = getEvalSessions(courseId)
    const deadline = getSessionDeadline(courseId, sessionNumber, totalSessions)
    const enabledTypes = TEMPLATE_EVAL_TYPES[config.template] || ['self', 'teacher']
    const courseEnrollments = enrollments.value.filter(
      (e) => e.courseId === courseId && e.status !== 'dropped'
    )
    let newEvalReminders: EvalReminder[] = []

    for (const enr of courseEnrollments) {
      for (const type of enabledTypes) {
        const targetIsTeacher = type === 'teacher' || type === 'mentor'
        // 教师/导师评价 → 提醒对象是教师，自评/互评 → 提醒对象是学生
        const targetId = targetIsTeacher ? course.teacher : enr.studentId
        const reminderId = `session-reminder-${courseId}-${targetId}-${type}-${sessionNumber}`

        // 已存在提醒则跳过
        if (evalReminders.value.some((r) => r.id === reminderId)) continue

        newEvalReminders.push({
          id: reminderId,
          courseId,
          courseTitle: course.title,
          studentId: targetId,
          sessionNumber,
          deadline,
          status: 'pending',
        })
      }
    }

    if (newEvalReminders.length > 0) {
      evalReminders.value = [...evalReminders.value, ...newEvalReminders]
      saveToStorage('evalReminders', evalReminders.value)
    }
  }

  /**
   * 检查并自动标记逾期的评价提醒
   * 当截止日期已过且仍为 pending 状态时，标记为 overdue
   */
  function checkAndMarkOverdueReminders() {
    const now = new Date()
    let changed = false
    evalReminders.value = evalReminders.value.map((r) => {
      if (r.status !== 'pending') return r
      if (!r.deadline) return r
      const deadline = new Date(r.deadline)
      if (now > deadline) {
        changed = true
        return { ...r, status: 'overdue' as const }
      }
      return r
    })
    if (changed) {
      saveToStorage('evalReminders', evalReminders.value)
    }
  }

  /**
   * 扫描所有活跃课程，为已到上课时间的轮次生成待办提醒
   * 同时自动锁定已到期的轮次，并检查逾期
   */
  function checkAndGenerateSessionReminders() {
    // 先处理自动锁定
    autoLockExpiredSessions()

    const activeCourses = courses.value.filter((c) => c.status === 'active')
    for (const course of activeCourses) {
      const totalSessions = getEvalSessions(course.id)
      for (let s = 1; s <= totalSessions; s++) {
        if (isSessionTime(course.id, s) && !isSessionLocked(course.id, s)) {
          generateSessionReminders(course.id, s)
        }
      }
    }
    // 同步检查逾期提醒
    checkAndMarkOverdueReminders()
  }

  function getEvalSessions(courseId: string): number {
    const course = courses.value.find((c) => c.id === courseId)
    if (!course) return 1
    const config = evalConfigs.value.find((c) => c.courseId === courseId)
    if (!config) return Math.max(1, Math.floor(course.duration / 2))
    switch (config.frequency) {
      case 'biweekly':
        return Math.max(1, Math.ceil(course.duration / 4))
      case 'per_unit':
        return 3
      case 'project_milestone':
        return 3
      case 'custom':
        return config.customSessions || 3
      default:
        return Math.max(1, Math.floor(course.duration / 2))
    }
  }

  function hasGroups(courseId: string): boolean {
    return studentGroups.value.some((g) => g.courseId === courseId)
  }

  function generateEvalReminders(courseId: string) {
    const course = courses.value.find((c) => c.id === courseId)
    const config = evalConfigs.value.find((c) => c.courseId === courseId)
    if (!course || !config) return
    const totalSessions = getEvalSessions(courseId)
    const courseEnrollments = enrollments.value.filter(
      (e) => e.courseId === courseId && e.status !== 'dropped'
    )
    const startDate = new Date(course.createdAt || new Date())
    const reminders: EvalReminder[] = []

    const enabledTypes = TEMPLATE_EVAL_TYPES[config.template] || ['self', 'teacher']

    for (const enr of courseEnrollments) {
      for (let s = 1; s <= totalSessions; s++) {
        for (const type of enabledTypes) {
          // 教师/导师评价的提醒对象是课程教师，自评/互评的提醒对象是学生
          const targetIsTeacher = type === 'teacher' || type === 'mentor'
          const hasEval = evaluations.value.some(
            (e) => e.courseId === courseId && e.studentId === enr.studentId && e.sessionNumber === s && e.type === type
          )
          if (hasEval) continue

          const weekOffset = s * 2
          const deadline = new Date(startDate)
          deadline.setDate(deadline.getDate() + weekOffset * 7)
          const deadlineStr = deadline.toISOString().split('T')[0]

          const targetId = targetIsTeacher ? course.teacher : enr.studentId
          const reminderId = `reminder-${courseId}-${targetId}-${type}-${s}`
          const exists = evalReminders.value.some((r) => r.id === reminderId)
          if (exists) continue

          reminders.push({
            id: reminderId,
            courseId,
            courseTitle: course.title,
            studentId: targetId,
            sessionNumber: s,
            deadline: deadlineStr,
            status: new Date(deadlineStr) < new Date() ? 'overdue' : 'pending',
          })
        }
      }
    }
    if (reminders.length > 0) {
      evalReminders.value = [...evalReminders.value, ...reminders]
      saveToStorage('evalReminders', evalReminders.value)
    }
  }

  function pushNearDeadlineEvalReminders() {
    const now = new Date()
    const oneWeekLater = new Date(now)
    oneWeekLater.setDate(oneWeekLater.getDate() + 7)

    const isTeacher = currentRole.value === 'teacher'
    const isStudent = currentRole.value === 'student'

    const pendingReminders = evalReminders.value.filter((r) => {
      if (r.status === 'completed') return false
      if (isTeacher && r.studentId === currentUser.value) {
        const deadline = new Date(r.deadline)
        return deadline >= now && deadline <= oneWeekLater
      }
      if (isStudent) {
        const student = students.value.find((s) => s.name === currentUser.value)
        if (student && r.studentId === student.id) {
          const deadline = new Date(r.deadline)
          return deadline >= now && deadline <= oneWeekLater
        }
      }
      return false
    })

    const existingTodoKeys = new Set(todos.value.map((t) => t.title))
    let newCount = 0

    for (const r of pendingReminders) {
      const todoTitle = `📋 评价提醒：${r.courseTitle} 第${r.sessionNumber}次评价即将截止（${r.deadline}）`
      if (existingTodoKeys.has(todoTitle)) continue
      todos.value.push({
        id: `todo-eval-${Date.now()}-${r.id}`,
        title: todoTitle,
        completed: false,
        createdAt: now.toISOString().split('T')[0],
        dueDate: r.deadline,
        createdBy: currentUser.value || 'system',
      })
      existingTodoKeys.add(todoTitle)
      newCount++
    }

    if (newCount > 0) {
      saveToStorage('todos', todos.value)
      todos.value = [...todos.value]
    }
  }

  /**
   * 逾期处理：对某课程某轮次中未提交的评价，按配置规则自动处理
   * 适用于所有评价类型（自评/教师评/导师评/组内互评/组间互评）
   * 规则：
   *   average - 取该学生该类型的历史平均分
   *   zero    - 记 0 分
   *   full    - 记 100 分
   *   none    - 不处理，跳过
   */
  function processSessionOverdue(courseId: string, sessionNumber: number) {
    const config = evalConfigs.value.find((c) => c.courseId === courseId)
    if (!config || config.overdueRule === 'none') return

    const course = courses.value.find((c) => c.id === courseId)
    if (!course) return

    const enabledTypes = TEMPLATE_EVAL_TYPES[config.template] || ['self', 'teacher']
    const courseEnrollments = enrollments.value.filter(
      (e) => e.courseId === courseId && e.status !== 'dropped'
    )
    const newEvals: Evaluation[] = []

    for (const enr of courseEnrollments) {
      for (const type of enabledTypes) {
        // 已有该类型评价则跳过
        if (evaluations.value.some(
          (e) => e.courseId === courseId && e.studentId === enr.studentId && e.sessionNumber === sessionNumber && e.type === type
        )) continue

        let score: number | null = null
        let comment = ''

        switch (config.overdueRule) {
          case 'average': {
            // 取同一学生同一评价类型的历史轮次平均分
            const historyEvals = evaluations.value.filter(
              (e) => e.courseId === courseId && e.studentId === enr.studentId && e.type === type && e.sessionNumber < sessionNumber
            )
            if (historyEvals.length === 0) continue // 无历史记录则跳过
            score = Math.round(historyEvals.reduce((s, e) => s + e.score, 0) / historyEvals.length)
            comment = `自动取历史平均分（逾期未评，${score}分）`
            break
          }
          case 'zero':
            score = 0
            comment = '逾期未评，记0分'
            break
          case 'full':
            score = 100
            comment = '逾期未评，记满分'
            break
        }

        if (score === null) continue

        // 确定评价人和评价名
        const targetIsTeacher = type === 'teacher' || type === 'mentor'
        const evaluatorId = targetIsTeacher ? course.teacher : enr.studentId
        const evaluatorName = targetIsTeacher
          ? course.teacher
          : (students.value.find((s) => s.id === enr.studentId)?.name || '未知')

        newEvals.push({
          id: `auto-${courseId}-${enr.studentId}-${sessionNumber}-${type}-${Date.now()}`,
          courseId,
          studentId: enr.studentId,
          sessionNumber,
          type: type as EvalType,
          score,
          evaluatorId,
          evaluatorName,
          comment,
          createdAt: new Date().toISOString().split('T')[0],
        })
      }
    }

    if (newEvals.length > 0) {
      evaluations.value = [...evaluations.value, ...newEvals]
      saveToStorage('evaluations', evaluations.value)
    }
  }

  function markEvalReminderCompleted(courseId: string, studentId: string, sessionNumber: number) {
    evalReminders.value = evalReminders.value.map((r) => {
      if (r.courseId === courseId && r.studentId === studentId && r.sessionNumber === sessionNumber) {
        return { ...r, status: 'completed' as const }
      }
      return r
    })
    saveToStorage('evalReminders', evalReminders.value)
  }

  /** 标记某课程某轮次所有评价提醒为已完成 */
  function markSessionEvalRemindersCompleted(courseId: string, sessionNumber: number) {
    evalReminders.value = evalReminders.value.map((r) => {
      if (r.courseId === courseId && r.sessionNumber === sessionNumber && r.status !== 'completed') {
        return { ...r, status: 'completed' as const }
      }
      return r
    })
    saveToStorage('evalReminders', evalReminders.value)
  }

  function checkEvalReminders() {
    const now = new Date()
    const hasUpcoming = evalReminders.value.some((r) => {
      if (r.status === 'completed') return false
      const deadline = new Date(r.deadline)
      return deadline >= now
    })
    hasEvalReminders.value = hasUpcoming
  }

  function recalculateProgress(courseId: string) {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    const totalSchedules = courseSchedules.length
    if (totalSchedules === 0) return

    // 以统一参考日期计算已上课数
    const ref = getCourseReferenceDate(courseId)
    // 已开始的课程数（startDate < ref）
    const startedSchedules = courseSchedules.filter((s) => new Date(s.startDate) < ref).length
    // 进度 = 已上课数 / 总课数（百分比）
    const newProgress = Math.round((startedSchedules / totalSchedules) * 100)

    // 统一更新该课程所有学生的进度
    enrollments.value = enrollments.value.map((e) => {
      if (e.courseId === courseId) {
        return { ...e, progress: newProgress }
      }
      return e
    })
    saveToStorage('enrollments', enrollments.value)
  }

  // ====== 成绩权重配置 ======

  function saveGradeConfig(config: GradeWeightConfig) {
    gradeConfigs.value = { ...gradeConfigs.value, [config.courseId]: config }
    saveToStorage('gradeConfigs', gradeConfigs.value)
  }

  function getGradeConfig(courseId: string): GradeWeightConfig {
    return gradeConfigs.value[courseId] || getDefaultGradeConfig(courseId)
  }

  function addDetailedGrade(dg: DetailedGrade) {
    detailedGrades.value = [...detailedGrades.value, dg]
    saveToStorage('detailedGrades', detailedGrades.value)
  }

  function updateDetailedGrade(id: string, data: Partial<DetailedGrade>) {
    detailedGrades.value = detailedGrades.value.map((d) => (d.id === id ? { ...d, ...data } : d))
    saveToStorage('detailedGrades', detailedGrades.value)
  }

  function getDetailedGrades(courseId: string): DetailedGrade[] {
    return detailedGrades.value.filter((d) => d.courseId === courseId)
  }

  function calcTotalScore(courseId: string, dg: DetailedGrade): number {
    const cfg = gradeConfigs.value[courseId] || getDefaultGradeConfig(courseId)
    const regular =
      (dg.selfEvalScore ?? 0) * cfg.selfEvalWeight / 100 +
      (dg.peerReviewScore ?? 0) * cfg.peerReviewWeight / 100 +
      (dg.interGroupScore ?? 0) * cfg.interGroupEvalWeight / 100 +
      (dg.teacherScore ?? 0) * cfg.teacherScoreWeight / 100 +
      (dg.mentorScore ?? 0) * cfg.mentorScoreWeight / 100
    const midterm = ((dg.midtermExamScore ?? 0) * cfg.midtermExamWeight + (dg.midtermProjectScore ?? 0) * cfg.midtermProjectWeight) / 100
    const final = ((dg.finalExamScore ?? 0) * cfg.finalExamWeight + (dg.finalProjectScore ?? 0) * cfg.finalProjectWeight) / 100
    return Math.round(regular * cfg.regularWeight / 100 + midterm * cfg.midtermWeight / 100 + final * cfg.finalWeight / 100)
  }

  // ====== 配置提醒 ======

  /** 第一节课是否已经开始（配置锁定期） */
  /**
   * 获取课程时间参考基准（以第一节课开课时间作为参考点）
   * 使所有时间判定与"学期前第一节课开始前"视图一致
   */
  function getCourseReferenceDate(courseId: string): Date {
    // 优先使用全局模拟参考日期
    if (effectiveReferenceDate.value) {
      const ref = new Date(effectiveReferenceDate.value)
      ref.setHours(0, 0, 0, 0)
      return ref
    }
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    const ref = courseSchedules.length > 0 ? new Date(courseSchedules[0].startDate) : new Date()
    ref.setHours(0, 0, 0, 0)
    return ref
  }

  /** 设置全局模拟参考日期 */
  function setEffectiveReferenceDate(dateStr: string) {
    effectiveReferenceDate.value = dateStr
    saveToStorage('effectiveReferenceDate', dateStr)
  }

  function isFirstClassStarted(courseId: string): boolean {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    if (courseSchedules.length === 0) return false
    const ref = getCourseReferenceDate(courseId)
    return ref >= new Date(courseSchedules[0].endDate)
  }

  /** 第二节课是否已经开始（AI 分层测试截止点） */
  function isSecondClassStarted(courseId: string): boolean {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    // 有至少两节课才判定第二节课开始
    if (courseSchedules.length < 2) return false
    const ref = getCourseReferenceDate(courseId)
    return ref >= new Date(courseSchedules[1].startDate)
  }

  /** 获取某学生所有未完成的 AI 分层测试（测试窗口已开但未超时） */
  function getPendingAITierTests(studentId: string): { courseId: string; courseTitle: string; deadline: string }[] {
    const result: { courseId: string; courseTitle: string; deadline: string }[] = []
    const myEnrollments = enrollments.value.filter((e) => e.studentId === studentId)
    for (const enr of myEnrollments) {
      const course = courses.value.find((c) => c.id === enr.courseId)
      if (!course || course.status !== 'active') continue
      const tierKey = `${enr.courseId}||${studentId}`
      if (studentTiers.value[tierKey]) continue // 已测试
      if (!isFirstClassStarted(enr.courseId)) continue // 第一节课未结束
      if (isSecondClassStarted(enr.courseId)) continue // 第二节课已开始（已超时）
      // 计算截止日：第二节的 endDate
      const courseSchedules = schedules.value
        .filter((s) => s.courseId === enr.courseId)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      const deadline = courseSchedules.length >= 2 ? courseSchedules[1].startDate : ''
      result.push({ courseId: enr.courseId, courseTitle: course.title, deadline })
    }
    return result
  }

  /** 逾期未测自动分配到基础层 */
  function autoAssignOverdueBasicTier(courseId: string, studentId: string) {
    const key = `${courseId}||${studentId}`
    if (studentTiers.value[key]) return // 已有记录，跳过
    if (!isFirstClassStarted(courseId)) return // 第一节课未结束
    if (!isSecondClassStarted(courseId)) return // 第二节课还未开始，未逾期
    const record: StudentTierRecord = {
      courseId,
      studentId,
      tier: 'basic',
      score: 0,
      createdAt: new Date().toISOString().split('T')[0],
    }
    studentTiers.value = { ...studentTiers.value, [key]: record }
    saveToStorage('studentTiers', studentTiers.value)
  }

  /** 标记某课程的某项配置已完成 */
  function markConfigCompleted(courseId: string, type: 'weights' | 'evalConfig') {
    configCompleted.value = {
      ...configCompleted.value,
      [courseId]: {
        ...(configCompleted.value[courseId] || { weights: false, evalConfig: false }),
        [type]: true,
      },
    }
    saveToStorage('configCompleted', configCompleted.value)
  }

  /** 获取有未完成配置的课程列表（排除已锁定课程，仅当前教师自己的课程） */
  function getPendingConfigCourses(): { courseId: string; courseTitle: string; missing: string[] }[] {
    const activeCourses = courses.value.filter(
      (c) => c.status === 'active' && c.teacher === currentUser.value
    )
    const result: { courseId: string; courseTitle: string; missing: string[] }[] = []
    for (const course of activeCourses) {
      if (isFirstClassStarted(course.id)) continue // 已锁定，不需要提醒
      const done = configCompleted.value[course.id]
      const missing: string[] = []
      if (!done?.weights) missing.push('成绩权重')
      if (!done?.evalConfig) missing.push('评价方案')
      if (missing.length > 0) {
        result.push({ courseId: course.id, courseTitle: course.title, missing })
      }
    }
    return result
  }

  // ====== 企业导师相关 ======

  /** 获取某导师负责的所有课程ID */
  function getMentorCourseIds(mentorName: string): string[] {
    const mentor = mentors.value.find((m) => m.name === mentorName)
    if (mentor) return mentor.courseIds
    // 也检查课程 mentor 字段
    const byMentorField = courses.value.filter((c) => c.mentor === mentorName).map((c) => c.id)
    if (byMentorField.length > 0) return byMentorField
    // 如果是领导以 asMentor 身份访问，按分类获取课程
    const leader = leaders.value.find((l) => l.name === mentorName)
    if (leader?.asMentor) {
      return courses.value.filter((c) => leader.categoryIds.includes(c.categoryId)).map((c) => c.id)
    }
    return []
  }

  // ====== 学院领导相关 ======

  /** 获取某领导管辖的所有课程 */
  function getLeaderCourses(leaderName: string): Course[] {
    const leader = leaders.value.find((l) => l.name === leaderName)
    if (!leader) return []
    return courses.value.filter((c) => leader.categoryIds.includes(c.categoryId))
  }

  /** 获取某领导管辖的所有学生（去重） */
  function getLeaderStudents(leaderName: string): Student[] {
    const leader = leaders.value.find((l) => l.name === leaderName)
    if (!leader) return []
    const courseIds = courses.value
      .filter((c) => leader.categoryIds.includes(c.categoryId))
      .map((c) => c.id)
    const studentIds = new Set(
      enrollments.value
        .filter((e) => courseIds.includes(e.courseId))
        .map((e) => e.studentId)
    )
    return students.value.filter((s) => studentIds.has(s.id))
  }

  // ====== AI 分层 ======

  /** 获取某学生某课程的 AI 分层记录 */
  function getStudentTier(courseId: string, studentId: string): StudentTierRecord | null {
    const key = `${courseId}||${studentId}`
    return studentTiers.value[key] ?? null
  }

  /** 根据分数判定层级 */
  function determineTier(score: number): 'basic' | 'advanced' | 'excellent' {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'advanced'
    return 'basic'
  }

  /** 提交 AI 分层测试结果 */
  function submitAITierTest(courseId: string, studentId: string, score: number) {
    const resultKey = `${courseId}||${studentId}`
    const tier = determineTier(score)
    const record: StudentTierRecord = {
      courseId,
      studentId,
      tier,
      score,
      createdAt: new Date().toISOString().split('T')[0],
    }
    studentTiers.value = { ...studentTiers.value, [resultKey]: record }
    saveToStorage('studentTiers', studentTiers.value)
    return record
  }

  // 初始化：根据排课自动重算所有课程的进度
  const courseIds = [...new Set(schedules.value.map((s) => s.courseId))]
  courseIds.forEach((cid) => recalculateProgress(cid))

  return {
    // state
    courses, categories, students, schedules, enrollments, teachers, grades,
    cloudFiles, todos, onlineDocs, notes,
    evaluations, evalConfigs, studentGroups, evalReminders,
    gradeConfigs, detailedGrades,
    homework, homeworkSubmissions,
    isLoggedIn, currentUser, currentRole,
    hasEvalReminders,
    mentors, leaders, secondaryRoles,
    examScores,
    examWeights,
    lockedSessions,
    studentTiers,
    // actions
    login, logout,
    addCourse, updateCourse, deleteCourse,
    addCategory, updateCategory, deleteCategory,
    addSchedule, updateSchedule, deleteSchedule,
    addEnrollment, updateEnrollment, deleteEnrollment,
    addGrade, updateGrade, deleteGrade,
    addCloudFile, deleteCloudFile,
    addTodo, updateTodo, deleteTodo,
    addOnlineDoc, updateOnlineDoc, deleteOnlineDoc,
    addNote, updateNote, deleteNote,
    addHomework, updateHomework, deleteHomework,
    getCourseHomework, getCourseCloudFiles,
    submitHomework, getHomeworkSubmission,
    addEvaluation, updateEvaluation, deleteEvaluation,
    setEvalConfig, addStudentGroup, addStudent, updateStudent, updateStudentGroup, deleteStudentGroup,
    getCourseGroups, clearCourseGroups, setCourseGroups, randomGroup,
    detectAnomalies, getEvalSessions, hasGroups,
    submitTeacherEval, isTeacherEvalSubmitted, getSubmittedTeacherScore,
    addExamScore, updateExamScore, submitExamScores, getExamScoresForCourse, getExamNames,
    setExamWeight, getExamWeight, getExamWeightsForCourse,
    hasFinalExamSubmitted, isEvalConfigEditable, isWeightConfigEditable,
    lockSession, isSessionLocked, getSessionScheduleRangeIndex, getSessionEndDate, isSessionTime, isFinalSessionDeadlinePassed, autoLockPreviousSession, autoLockExpiredSessions,
    generateSessionReminders, checkAndGenerateSessionReminders, getSessionDeadline, checkAndMarkOverdueReminders,
    generateEvalReminders, pushNearDeadlineEvalReminders, processSessionOverdue,
    markEvalReminderCompleted, markSessionEvalRemindersCompleted,
    isFirstClassStarted, markConfigCompleted, getPendingConfigCourses,
    setEffectiveReferenceDate,
    checkEvalReminders,
    recalculateProgress,
    saveGradeConfig, getGradeConfig,
    addDetailedGrade, updateDetailedGrade, getDetailedGrades,
    calcTotalScore,
    getMentorCourseIds, getLeaderCourses, getLeaderStudents,
    getStudentTier, determineTier, submitAITierTest,
    isSecondClassStarted, getPendingAITierTests, autoAssignOverdueBasicTier,
  }
})