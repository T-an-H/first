import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getNow } from '@/lib/date'
import { javaAddEnrollment, javaUpdateEnrollment, javaDeleteEnrollment, javaAddGroup, javaUpdateGroup, javaDeleteGroup, javaAddFile, javaDeleteFile, javaSaveGradeConfig, javaUpdateFile, javaDeleteCourse, javaAddCourse, javaUpdateCourse, javaAddSchedule, javaUpdateSchedule, javaDeleteSchedule, javaAddStudent, javaUpdateStudent, javaDeleteStudent, javaAddGrade, javaUpdateGrade, javaDeleteGrade, javaAddExamScore, javaUpdateExamScore, javaDeleteExamScore, javaAddTodo, javaUpdateTodo, javaDeleteTodo, javaAddNote, javaUpdateNote, javaDeleteNote, javaAddEvaluation, javaUpdateEvaluation, javaDeleteEvaluation, javaSaveEvalConfig, javaScoreQualityEvaluation, javaAddDetailedGrade, javaUpdateDetailedGrade, javaDeleteDetailedGrade } from '@/api'
import {
  javaListEnrollments, javaListGroups, javaListFiles, javaListEvaluations, javaGetGradeConfig,
  javaListCourses, javaListStudents, javaListSchedules, javaListGrades, javaListExamScores,
  javaListEvalConfigs, javaListDetailedGrades, javaListQualityEvaluations,
  javaListHomework, javaListHomeworkSubmissions, javaListTodos, javaListNotes,
  javaListStudentTiers, javaListCategories, javaListDepartments, javaListDepartmentClasses,
  javaListTeachers, javaListMentors, javaListLeaders,
  listTasks, listTaskSubmissions, listTaskEvals,
} from '@/api'
import type {
  Course, Category, Student, Schedule, Enrollment, Teacher, Grade,
  CloudFile, TodoItem, Note, Evaluation, EvaluationConfig,
  StudentGroup, GradeWeightConfig, DetailedGrade,
  Mentor, Leader, AITierQuestion, StudentTierRecord, EvalType,
  Homework, HomeworkSubmission, Department, QualityEvaluation, QualityEvalFile, QualityEvalSubmission
} from '@/types'
import { getDefaultGradeConfig } from '@/types'
import {
  MOCK_VERSION,
} from '@/data/mockData'

type UserRole = 'admin' | 'teacher' | 'student' | 'mentor' | 'leader' | null

const normalizeCloudFile = (file: CloudFile): CloudFile => ({
  ...file,
  visibilityScope: file.visibilityScope ?? (file.visibleToClassNames?.length ? 'students' : 'private'),
})

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    // 类型校验：如果 fallback 是数组，确保 parsed 也是数组（防止脏数据污染）
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback
    // 数组类型：如果 localStorage 存的是空数组，也用 fallback（防止 stale 空数组覆盖 mock 数据）
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback)) return fallback
    return parsed
  } catch {
    return fallback
  }
}

const saveToStorage = (key: string, data: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    // 存储空间不足（如大文件 base64 撑爆配额）时降级为内存态，避免应用崩溃
    console.warn(`[store] 保存 ${key} 失败（可能超出 localStorage 配额）:`, e)
  }
}

// ====== Mock 数据版本检查：版本变化时清除旧 localStorage ======
const MOCK_VERSION_KEY = 'mockDataVersion'
try {
  const savedVersion = localStorage.getItem(MOCK_VERSION_KEY)
  if (savedVersion !== MOCK_VERSION) {
    // 版本变化，清除所有可重置的旧数据，让下次加载走 mock fallback
    const resetKeys = [
      'departments', 'departmentClasses', 'categories', 'courses',
      'schedules', 'students', 'enrollments', 'teachers', 'grades',
      'cloudFiles', 'todos', 'notes',
      'evaluations', 'evalConfigs', 'studentGroups',
      'gradeConfigs', 'detailedGrades', 'homework', 'homeworkSubmissions',
      'examScores', 'examWeights',
      'studentTiers', 'qualityEvaluations', 'projectWeightLocks',
      'mentors',
      'isLoggedIn', 'currentUser', 'currentDisplayName', 'currentRole', 'secondaryRoles',
    ]
    resetKeys.forEach((k) => localStorage.removeItem(k))
    localStorage.setItem(MOCK_VERSION_KEY, MOCK_VERSION)
  }
} catch { /* ignore */ }

export const useAppStore = defineStore('app', () => {
  // ====== State ======
  // 业务数据初始为空数组，启动后由 initFromDatabase() 从数据库(course_db)拉取
  const courses = ref<Course[]>(loadFromStorage('courses', []))
  const categories = ref<Category[]>(loadFromStorage('categories', []))
  const students = ref<Student[]>(loadFromStorage('students', []))
  const schedules = ref<Schedule[]>(loadFromStorage('schedules', []))
  const enrollments = ref<Enrollment[]>(loadFromStorage('enrollments', []))
  const teachers = ref<Teacher[]>(loadFromStorage('teachers', []))
  const grades = ref<Grade[]>(loadFromStorage('grades', []))
  const loadedCloudFiles = loadFromStorage<CloudFile[]>('cloudFiles', [])
  const hasLegacyCloudFiles = loadedCloudFiles.some((file) => !file.visibilityScope)
  const cloudFiles = ref<CloudFile[]>(loadedCloudFiles.map(normalizeCloudFile))
  const todos = ref<TodoItem[]>(loadFromStorage<TodoItem[]>('todos', []))
  const notes = ref<Note[]>(loadFromStorage<Note[]>('notes', []))
  const evaluations = ref<Evaluation[]>(loadFromStorage<Evaluation[]>('evaluations', []))
  const evalConfigs = ref<EvaluationConfig[]>(loadFromStorage<EvaluationConfig[]>('evalConfigs', []))
  const studentGroups = ref<StudentGroup[]>(loadFromStorage<StudentGroup[]>('studentGroups', []))

  // 素质评价提交（学生上传文件，教师打分）
  const qualityEvaluations = ref<import('@/types').QualityEvaluation[]>(
    loadFromStorage<import('@/types').QualityEvaluation[]>('qualityEvaluations', [])
  )
  // 迁移旧格式（单次提交，顶层直接存放文件/评分）→ 新格式（submissions 数组支持多次提交）
  qualityEvaluations.value = qualityEvaluations.value.map((q) => {
    if ((q as any).submissions) return q
    const old = q as any
    return {
      id: old.id,
      courseId: old.courseId,
      studentId: old.studentId,
      submissions: old.files ? [{
        id: old.id,
        description: old.description,
        files: old.files,
        submittedAt: old.submittedAt,
        score: old.score,
        teacherComment: old.teacherComment,
        gradedAt: old.gradedAt,
      }] : [],
    }
  })
  const gradeConfigs = ref<Record<string, GradeWeightConfig>>(
    Object.fromEntries(
      Object.entries(loadFromStorage<Record<string, GradeWeightConfig>>('gradeConfigs', {})).map(([courseId, config]) => [
        courseId,
        { ...getDefaultGradeConfig(courseId), ...config },
      ]),
    ),
  )
  const detailedGrades = ref<DetailedGrade[]>(loadFromStorage<DetailedGrade[]>('detailedGrades', []))
  const homework = ref<Homework[]>(loadFromStorage<Homework[]>('homework', []))
  const homeworkSubmissions = ref<HomeworkSubmission[]>(loadFromStorage<HomeworkSubmission[]>('homeworkSubmissions', []))
  const isLoggedIn = ref<boolean>(loadFromStorage<boolean>('isLoggedIn', false))
  // currentUser 存登录账号（与数据库 course_db 的 owner 字段一致，如 teacher-wang / S2024001）
  const currentUser = ref<string | null>(loadFromStorage<string | null>('currentUser', null))
  // 显示名（如 王老师 / 张明），用于界面展示与基础数据匹配
  const currentDisplayName = ref<string | null>(loadFromStorage<string | null>('currentDisplayName', null))
  const currentRole = ref<UserRole>(loadFromStorage<UserRole>('currentRole', null))

  // 企业导师数据
  const mentors = ref<Mentor[]>(loadFromStorage<Mentor[]>('mentors', []))
  // 学院领导数据（启动后由 initFromDatabase() 从数据库拉取）
  const leaders = ref<Leader[]>([])
  // 次要角色（用于 leader+teacher/mentor 双重身份）
  const secondaryRoles = ref<UserRole[]>(loadFromStorage<UserRole[]>('secondaryRoles', []))

  // ====== 学院系统 ======
  const departments = ref<Department[]>(loadFromStorage<Department[]>('departments', []))
  const departmentClasses = ref<Record<string, string[]>>(
    loadFromStorage<Record<string, string[]>>('departmentClasses', {})
  )
  const selectedDepartmentId = ref<string | null>(
    loadFromStorage<string | null>('selectedDepartmentId', null)
  )

  // 考试/项目成绩
  const examScores = ref<import('@/types').ExamScore[]>(
    loadFromStorage<import('@/types').ExamScore[]>('examScores', [])
  )

  // 考试/项目权重配置 (courseId → examName → weight)
  const examWeights = ref<Record<string, Record<string, number>>>(
    loadFromStorage<Record<string, Record<string, number>>>('examWeights', {})
  )

  // 期中/期末项目占比锁定状态 (courseId → { midterm, final })，持久化，刷新/重进不丢失
  const projectWeightLocks = ref<Record<string, { midterm: boolean; final: boolean }>>(
    loadFromStorage<Record<string, { midterm: boolean; final: boolean }>>('projectWeightLocks', {})
  )

  // 配置完成标记（权重配置 / 评价方案配置）
  const configCompleted = ref<Record<string, { weights: boolean; evalConfig: boolean }>>(
    loadFromStorage<Record<string, { weights: boolean; evalConfig: boolean }>>('configCompleted', {})
  )

  // 任务评价快照（仅任务评价模型）：courseId → taskId → 提交/评价状态
  // 由 refreshTaskEvalInfo() 从 Express(3000) 的任务接口拉取，驱动"待评价"红点与待办
  const taskEvalSnapshot = ref<Record<string, Record<string, { submitted: string[]; ungraded: string[]; selfDone: Record<string, boolean> }>>>({})

  if (hasLegacyCloudFiles) {
    saveToStorage('cloudFiles', cloudFiles.value)
  }

  // AI 分层记录（key: `${courseId}||${studentId}`）
  const studentTiers = ref<Record<string, StudentTierRecord>>(
    loadFromStorage<Record<string, StudentTierRecord>>('studentTiers', {})
  )

  // ====== Actions ======

  // ====== 数据库初始化：从 Java 后端(course_db, 8080)拉取教师端全量业务数据 ======
  async function initFromDatabase() {
    try {
      const [
        dbCourses, dbStudents, dbSchedules, dbEnrollments, dbGrades, dbExamScores,
        dbEvaluations, dbEvalConfigs, dbGroups, dbFiles, dbDetailedGrades,
        dbQualityEvals, dbHomework, dbHomeworkSubmissions, dbTodos, dbNotes,
        dbStudentTiers, dbCategories, dbDepartments, dbDepartmentClasses, dbTeachers,
        dbMentors, dbLeaders,
      ] = await Promise.all([
        javaListCourses(), javaListStudents(), javaListSchedules(), javaListEnrollments(),
        javaListGrades(), javaListExamScores(), javaListEvaluations(), javaListEvalConfigs(),
        javaListGroups(), javaListFiles(), javaListDetailedGrades(),
        javaListQualityEvaluations(), javaListHomework(), javaListHomeworkSubmissions(),
        javaListTodos(), javaListNotes(), javaListStudentTiers(),
        javaListCategories(), javaListDepartments(), javaListDepartmentClasses(),
        javaListTeachers(), javaListMentors(), javaListLeaders(),
      ])

      if (Array.isArray(dbCourses)) { courses.value = dbCourses; saveToStorage('courses', dbCourses) }
      if (Array.isArray(dbStudents)) { students.value = dbStudents; saveToStorage('students', dbStudents) }
      if (Array.isArray(dbSchedules)) { schedules.value = dbSchedules; saveToStorage('schedules', dbSchedules) }
      if (Array.isArray(dbEnrollments)) { enrollments.value = dbEnrollments; saveToStorage('enrollments', dbEnrollments) }
      if (Array.isArray(dbGrades)) { grades.value = dbGrades; saveToStorage('grades', dbGrades) }
      if (Array.isArray(dbExamScores)) { examScores.value = dbExamScores; saveToStorage('examScores', dbExamScores) }
      if (Array.isArray(dbEvaluations)) { evaluations.value = dbEvaluations; saveToStorage('evaluations', dbEvaluations) }
      if (Array.isArray(dbEvalConfigs)) { evalConfigs.value = dbEvalConfigs; saveToStorage('evalConfigs', dbEvalConfigs) }
      if (Array.isArray(dbGroups)) { studentGroups.value = dbGroups; saveToStorage('studentGroups', dbGroups) }
      if (Array.isArray(dbFiles)) { cloudFiles.value = dbFiles.map(normalizeCloudFile); saveToStorage('cloudFiles', cloudFiles.value) }
      if (Array.isArray(dbDetailedGrades)) { detailedGrades.value = dbDetailedGrades; saveToStorage('detailedGrades', dbDetailedGrades) }
      if (Array.isArray(dbQualityEvals)) { qualityEvaluations.value = dbQualityEvals; saveToStorage('qualityEvaluations', dbQualityEvals) }
      if (Array.isArray(dbHomework)) { homework.value = dbHomework; saveToStorage('homework', dbHomework) }
      if (Array.isArray(dbHomeworkSubmissions)) { homeworkSubmissions.value = dbHomeworkSubmissions; saveToStorage('homeworkSubmissions', dbHomeworkSubmissions) }
      if (Array.isArray(dbTodos)) { todos.value = dbTodos; saveToStorage('todos', dbTodos) }
      if (Array.isArray(dbNotes)) { notes.value = dbNotes; saveToStorage('notes', dbNotes) }
      if (Array.isArray(dbStudentTiers)) {
        const tierMap: Record<string, StudentTierRecord> = {}
        dbStudentTiers.forEach((t: any) => {
          tierMap[`${t.courseId}||${t.studentId}`] = {
            courseId: t.courseId,
            studentId: t.studentId,
            tier: t.tier,
            score: Number(t.score) || 0,
            createdAt: t.createdAt || '',
          }
        })
        studentTiers.value = tierMap
        saveToStorage('studentTiers', tierMap)
      }

      // 基础数据（分类/学院/班级/教师/导师/领导）全部来自 course_db，不再使用 mock
      if (Array.isArray(dbCategories)) { categories.value = dbCategories; saveToStorage('categories', dbCategories) }
      if (Array.isArray(dbDepartments)) { departments.value = dbDepartments; saveToStorage('departments', dbDepartments) }
      if (Array.isArray(dbTeachers)) { teachers.value = dbTeachers; saveToStorage('teachers', dbTeachers) }
      if (Array.isArray(dbMentors)) { mentors.value = dbMentors; saveToStorage('mentors', dbMentors) }
      if (Array.isArray(dbLeaders)) { leaders.value = dbLeaders }
      if (Array.isArray(dbDepartmentClasses)) {
        const classMap: Record<string, string[]> = {}
        dbDepartmentClasses.forEach((dc: any) => {
          if (!dc.departmentId || !dc.className) return
          if (!classMap[dc.departmentId]) classMap[dc.departmentId] = []
          if (!classMap[dc.departmentId].includes(dc.className)) classMap[dc.departmentId].push(dc.className)
        })
        departmentClasses.value = classMap
        saveToStorage('departmentClasses', classMap)
      }

      // 成绩权重配置：按课程逐个拉取（grade-config 需 courseId 参数），失败则保留默认值
      if (courses.value.length > 0) {
        const configs: Record<string, GradeWeightConfig> = { ...gradeConfigs.value }
        await Promise.all(courses.value.map(async (c) => {
          try {
            const cfg = await javaGetGradeConfig(c.id)
            if (cfg?.courseId) configs[c.id] = { ...getDefaultGradeConfig(c.id), ...cfg }
          } catch { /* 单课程配置拉取失败则跳过 */ }
        }))
        gradeConfigs.value = configs
        saveToStorage('gradeConfigs', configs)
      }

      // 数据库数据就绪后刷新自动待办
      await refreshTaskEvalInfo()
      generateAutoTodos()
    } catch (e) {
      // Java 后端未启动时静默失败，保留 localStorage 已有缓存
      console.warn('[store] 数据库数据拉取失败（Java 后端未启动？）:', e)
    }
  }

  /**
   * 刷新任务评价快照：从 Express(3000) 拉取各课程任务、提交与任务评价，
   * 用于任务评价模型下的"待评价"红点/待办判定（旧版"按次数评价"提醒已废弃）。
   * 可在评分/提交/互评后按需调用（courseIds 为空则刷新全部课程）。
   */
  async function refreshTaskEvalInfo(courseIds?: string[]) {
    const targets = courseIds ?? courses.value.map((c) => c.id)
    if (targets.length === 0) return
    await Promise.all(targets.map(async (courseId) => {
      try {
        const res = await listTasks(courseId)
        const snapshot: Record<string, { submitted: string[]; ungraded: string[]; selfDone: Record<string, boolean> }> = {}
        await Promise.all((res.tasks || []).map(async (t: any) => {
          const [sres, eres] = await Promise.all([listTaskSubmissions(t.id), listTaskEvals(t.id)])
          const subs = (sres.submissions || []) as any[]
          const evals = (eres.evals || []) as any[]
          const selfDone: Record<string, boolean> = {}
          for (const e of evals) {
            if (e.type === 'self') selfDone[e.studentId] = true
          }
          snapshot[t.id] = {
            submitted: subs.map((s) => s.studentId),
            ungraded: subs.filter((s) => s.score == null).map((s) => s.studentId),
            selfDone,
          }
        }))
        taskEvalSnapshot.value = { ...taskEvalSnapshot.value, [courseId]: snapshot }
      } catch (e) {
        console.warn(`[store] 刷新课程 ${courseId} 任务评价快照失败:`, e)
      }
    }))
    generateAutoTodos()
  }

  function login(username: string, role: UserRole, isTeacherFromDb?: boolean, isMentorFromDb?: boolean, displayName?: string | null) {
    localStorage.setItem('isLoggedIn', JSON.stringify(true))
    localStorage.setItem('currentUser', JSON.stringify(username))
    localStorage.setItem('currentDisplayName', JSON.stringify(displayName ?? username))
    localStorage.setItem('currentRole', JSON.stringify(role))
    isLoggedIn.value = true
    currentUser.value = username
    currentDisplayName.value = displayName ?? username
    currentRole.value = role

    // 检测双重身份：如果以 mentor/leader 登录，检测是否同时有其他角色
    const detected: UserRole[] = []
    if (role === 'leader') {
      if (isTeacherFromDb) detected.push('teacher')
      if (isMentorFromDb) detected.push('mentor')
    }
    if (role === 'mentor' && isTeacherFromDb) {
      detected.push('teacher')
    }
    if (role === 'teacher' && isMentorFromDb) {
      detected.push('mentor')
    }
    secondaryRoles.value = detected
    localStorage.setItem('secondaryRoles', JSON.stringify(detected))
    // 登录后立即生成自动待办
    generateAutoTodos()
  }

  function logout() {
    localStorage.setItem('isLoggedIn', JSON.stringify(false))
    localStorage.setItem('currentUser', JSON.stringify(null))
    localStorage.setItem('currentDisplayName', JSON.stringify(null))
    localStorage.setItem('currentRole', JSON.stringify(null))
    localStorage.setItem('secondaryRoles', JSON.stringify([]))
    isLoggedIn.value = false
    currentUser.value = null
    currentDisplayName.value = null
    currentRole.value = null
    secondaryRoles.value = []
  }

  // ====== 学院操作 ======

  function setSelectedDepartment(id: string | null) {
    selectedDepartmentId.value = id
    saveToStorage('selectedDepartmentId', id)
  }

  function getSelectedDepartment(): Department | null {
    if (!selectedDepartmentId.value) return null
    return departments.value.find((d) => d.id === selectedDepartmentId.value) || null
  }

  function addDepartment(dept: Department) {
    departments.value = [...departments.value, dept]
    departmentClasses.value = { ...departmentClasses.value, [dept.id]: [] }
    saveToStorage('departments', departments.value)
    saveToStorage('departmentClasses', departmentClasses.value)
  }

  function updateDepartment(id: string, data: Partial<Department>) {
    departments.value = departments.value.map((d) => (d.id === id ? { ...d, ...data } : d))
    saveToStorage('departments', departments.value)
  }

  function deleteDepartment(id: string) {
    departments.value = departments.value.filter((d) => d.id !== id)
    // 同时清理关联的分类和班级映射
    categories.value = categories.value.filter((c) => c.departmentId !== id)
    const classes = { ...departmentClasses.value }
    delete classes[id]
    departmentClasses.value = classes
    saveToStorage('departments', departments.value)
    saveToStorage('categories', categories.value)
    saveToStorage('departmentClasses', departmentClasses.value)
    if (selectedDepartmentId.value === id) {
      selectedDepartmentId.value = null
      saveToStorage('selectedDepartmentId', null)
    }
  }

  /** 获取某学院的课程分类 */
  function getDepartmentCategories(deptId: string): Category[] {
    return categories.value.filter((c) => c.departmentId === deptId)
  }

  /** 获取某学院的班级列表 */
  function getDepartmentClasses(deptId: string): string[] {
    return departmentClasses.value[deptId] || []
  }

  /** 为某学院添加班级 */
  function addDepartmentClass(deptId: string, className: string) {
    const current = departmentClasses.value[deptId] || []
    if (!current.includes(className)) {
      departmentClasses.value = { ...departmentClasses.value, [deptId]: [...current, className] }
      saveToStorage('departmentClasses', departmentClasses.value)
    }
  }

  /** 为某学院移除班级 */
  function removeDepartmentClass(deptId: string, className: string) {
    const current = departmentClasses.value[deptId] || []
    departmentClasses.value = {
      ...departmentClasses.value,
      [deptId]: current.filter((c) => c !== className),
    }
    saveToStorage('departmentClasses', departmentClasses.value)
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

  /** 为课程分配企业导师：更新课程 mentor 字段，并同步导师记录的 courseIds */
  function assignMentorToCourse(courseId: string, mentorName: string) {
    if (!mentorName) return
    const course = courses.value.find((c) => c.id === courseId)
    if (course && course.mentor !== mentorName) {
      courses.value = courses.value.map((c) =>
        c.id === courseId ? { ...c, mentor: mentorName } : c
      )
      saveToStorage('courses', courses.value)
    }
    // 同步导师记录 courseIds（与 addCourse 的教师同步逻辑一致）
    const mentor = mentors.value.find((m) => m.name === mentorName)
    if (mentor && !mentor.courseIds.includes(courseId)) {
      mentors.value = mentors.value.map((m) =>
        m.name === mentorName ? { ...m, courseIds: [...m.courseIds, courseId] } : m
      )
      saveToStorage('mentors', mentors.value)
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
    // 同步到数据库
    javaDeleteCourse(id).catch(() => {})
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
    javaAddSchedule(schedule).catch(() => {})
  }

  function updateSchedule(id: string, data: Partial<Schedule>) {
    const old = schedules.value.find((s) => s.id === id)
    schedules.value = schedules.value.map((s) => (s.id === id ? { ...s, ...data } : s))
    saveToStorage('schedules', schedules.value)
    if (old) recalculateProgress(old.courseId)
    javaUpdateSchedule(id, data).catch(() => {})
  }

  function deleteSchedule(id: string) {
    const old = schedules.value.find((s) => s.id === id)
    schedules.value = schedules.value.filter((s) => s.id !== id)
    saveToStorage('schedules', schedules.value)
    if (old) recalculateProgress(old.courseId)
    javaDeleteSchedule(id).catch(() => {})
  }

  /** 用后端全量数据覆盖排课（管理员端删除/修改/新增后实时刷新） */
  function replaceSchedules(list: Schedule[]) {
    schedules.value = list
    saveToStorage('schedules', list)
    const ids = new Set(list.map((s) => s.courseId).filter(Boolean))
    ids.forEach((id) => recalculateProgress(id))
  }

  function addEnrollment(enrollment: Enrollment) {
    enrollments.value = [...enrollments.value, enrollment]
    saveToStorage('enrollments', enrollments.value)
    javaAddEnrollment(enrollment).catch(() => {})
  }

  function updateEnrollment(id: string, data: Partial<Enrollment>) {
    enrollments.value = enrollments.value.map((e) => (e.id === id ? { ...e, ...data } : e))
    saveToStorage('enrollments', enrollments.value)
    javaUpdateEnrollment(id, data).catch(() => {})
  }

  function deleteEnrollment(id: string) {
    enrollments.value = enrollments.value.filter((e) => e.id !== id)
    saveToStorage('enrollments', enrollments.value)
    javaDeleteEnrollment(id).catch(() => {})
  }

  function addGrade(grade: Grade) {
    const course = courses.value.find(c => c.id === grade.courseId)
    if (course && course.status === 'inactive') {
      console.warn('Cannot modify ended course')
      return
    }
    grades.value = [...grades.value, grade]
    saveToStorage('grades', grades.value)
    javaAddGrade(grade).catch(() => {})
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
    javaUpdateGrade(id, data).catch(() => {})
  }

  function deleteGrade(id: string) {
    grades.value = grades.value.filter((g) => g.id !== id)
    saveToStorage('grades', grades.value)
    javaDeleteGrade(id).catch(() => {})
  }

  function addCloudFile(file: CloudFile) {
    cloudFiles.value = [...cloudFiles.value, normalizeCloudFile(file)]
    saveToStorage('cloudFiles', cloudFiles.value)
    javaAddFile(file).catch(() => {})
  }

  /** 更新云盘文件（用于编辑可见课程/班级范围） */
  function updateCloudFile(id: string, data: Partial<CloudFile>) {
    cloudFiles.value = cloudFiles.value.map((f) =>
      f.id === id ? normalizeCloudFile({ ...f, ...data }) : f
    )
    saveToStorage('cloudFiles', cloudFiles.value)
    javaUpdateFile(id, data).catch(() => {})
  }

  function deleteCloudFile(id: string) {
    cloudFiles.value = cloudFiles.value.filter((f) => f.id !== id)
    saveToStorage('cloudFiles', cloudFiles.value)
    javaDeleteFile(id).catch(() => {})
  }

  function addTodo(todo: TodoItem) {
    todos.value = [...todos.value, { ...todo, createdBy: currentUser.value || '未知' }]
    saveToStorage('todos', todos.value)
    javaAddTodo({ ...todo, createdBy: currentUser.value || '未知' }).catch(() => {})
  }

  function updateTodo(id: string, data: Partial<TodoItem>) {
    todos.value = todos.value.map((t) => (t.id === id ? { ...t, ...data } : t))
    saveToStorage('todos', todos.value)
    generateAutoTodos()
    javaUpdateTodo(id, data).catch(() => {})
  }

  function deleteTodo(id: string) {
    todos.value = todos.value.filter((t) => t.id !== id)
    saveToStorage('todos', todos.value)
    javaDeleteTodo(id).catch(() => {})
  }

  function addNote(note: Note) {
    notes.value = [...notes.value, { ...note, createdBy: currentUser.value || '未知' }]
    saveToStorage('notes', notes.value)
    javaAddNote({ ...note, createdBy: currentUser.value || '未知' }).catch(() => {})
  }

  function updateNote(id: string, data: Partial<Note>) {
    notes.value = notes.value.map((n) => (n.id === id ? { ...n, ...data } : n))
    saveToStorage('notes', notes.value)
    javaUpdateNote(id, data).catch(() => {})
  }

  function deleteNote(id: string) {
    notes.value = notes.value.filter((n) => n.id !== id)
    saveToStorage('notes', notes.value)
    javaDeleteNote(id).catch(() => {})
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
    // 当前学生身份（仅学生端调用，需结合班级可见性过滤）
    const student = students.value.find((s) => s.name === currentDisplayName.value)
    const myClassName = student?.className

    return cloudFiles.value.filter((f) => {
      // 课程匹配（优先新字段 courseIds，兼容旧字段 courseId）
      const courseMatched = f.courseIds
        ? f.courseIds.includes(courseId)
        : f.courseId === courseId
      if (!courseMatched) return false

      // 未限制班级：该课程学生全部可见（含旧数据与公开给学生）
      if (!f.visibleToClassNames?.length) return true
      // 按班级可见：需当前学生所在班级在可见班级列表中
      return Boolean(myClassName && f.visibleToClassNames.includes(myClassName))
    })
  }

  function submitHomework(submission: HomeworkSubmission) {
    homeworkSubmissions.value = [...homeworkSubmissions.value, submission]
    saveToStorage('homeworkSubmissions', homeworkSubmissions.value)
    generateAutoTodos()
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
    javaAddEvaluation(ev).catch(() => {})
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
    if (ev) javaUpdateEvaluation(id, data).catch(() => {})
  }

  function deleteEvaluation(id: string) {
    evaluations.value = evaluations.value.filter((e) => e.id !== id)
    saveToStorage('evaluations', evaluations.value)
    javaDeleteEvaluation(id).catch(() => {})
  }

  function setEvalConfig(config: EvaluationConfig) {
    const existing = evalConfigs.value.findIndex((c) => c.courseId === config.courseId)
    if (existing >= 0) {
      evalConfigs.value = evalConfigs.value.map((c) => (c.courseId === config.courseId ? config : c))
    } else {
      evalConfigs.value = [...evalConfigs.value, config]
    }
    saveToStorage('evalConfigs', evalConfigs.value)
    javaSaveEvalConfig(config).catch(() => {})
  }

  function addStudentGroup(group: StudentGroup) {
    studentGroups.value = [...studentGroups.value, group]
    saveToStorage('studentGroups', studentGroups.value)
    javaAddGroup(group).catch(() => {})
  }

  function addStudent(student: Student) {
    students.value = [...students.value, student]
    saveToStorage('students', students.value)
    javaAddStudent(student).catch(() => {})
  }

  function updateStudent(id: string, data: Partial<Student>) {
    students.value = students.value.map((s) => (s.id === id ? { ...s, ...data } : s))
    saveToStorage('students', students.value)
    javaUpdateStudent(id, data).catch(() => {})
  }

  function deleteStudent(id: string) {
    students.value = students.value.filter((s) => s.id !== id)
    saveToStorage('students', students.value)
    javaDeleteStudent(id).catch(() => {})
  }

  function updateStudentGroup(id: string, data: Partial<StudentGroup>) {
    studentGroups.value = studentGroups.value.map((g) => (g.id === id ? { ...g, ...data } : g))
    saveToStorage('studentGroups', studentGroups.value)
    javaUpdateGroup(id, data).catch(() => {})
  }

  function deleteStudentGroup(id: string) {
    studentGroups.value = studentGroups.value.filter((g) => g.id !== id)
    saveToStorage('studentGroups', studentGroups.value)
    javaDeleteGroup(id).catch(() => {})
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

  /** 考试/项目成绩操作 */
  function addExamScore(score: import('@/types').ExamScore) {
    examScores.value.push(score)
    saveToStorage('examScores', examScores.value)
    javaAddExamScore(score).catch(() => {})
  }

  function updateExamScore(id: string, updates: Partial<import('@/types').ExamScore>) {
    const idx = examScores.value.findIndex((s) => s.id === id)
    if (idx !== -1) {
      examScores.value[idx] = { ...examScores.value[idx], ...updates }
      saveToStorage('examScores', examScores.value)
      javaUpdateExamScore(id, updates).catch(() => {})
    }
  }

  function submitExamScores(courseId: string, examName: string, studentIds?: string[]) {
    examScores.value = examScores.value.map((s) => {
      if (s.courseId === courseId && s.examName === examName && s.status === 'draft'
          && (!studentIds || studentIds.includes(s.studentId))) {
        return { ...s, status: 'submitted' as const, gradedAt: getNow().toISOString().split('T')[0] }
      }
      return s
    })
    saveToStorage('examScores', examScores.value)
    for (const s of examScores.value) {
      if (s.courseId === courseId && s.examName === examName && s.status === 'submitted') {
        javaUpdateExamScore(s.id, { status: 'submitted', gradedAt: s.gradedAt }).catch(() => {})
      }
    }
  }

  function getExamScoresForCourse(courseId: string, examName?: string): import('@/types').ExamScore[] {
    let result = examScores.value.filter((s) => s.courseId === courseId)
    if (examName) result = result.filter((s) => s.examName === examName)
    return result
  }

  /** 清理指定课程中同 studentId+同 examName+同 type 的重复成绩记录，仅保留第一条 */
  function deduplicateExamScores(courseId: string) {
    const courseScores = examScores.value.filter((s) => s.courseId === courseId)
    const seen = new Set<string>()
    const deduped: import('@/types').ExamScore[] = []
    for (const s of courseScores) {
      // 使用 学生+考试名+类型 作为唯一键，避免误删跨类型同名（如期中项目/期末项目同名）记录
      const key = `${s.studentId}|${s.examName}|${s.type}`
      if (!seen.has(key)) {
        seen.add(key)
        deduped.push(s)
      }
    }
    if (deduped.length < courseScores.length) {
      const otherScores = examScores.value.filter((s) => s.courseId !== courseId)
      examScores.value = [...otherScores, ...deduped]
      saveToStorage('examScores', examScores.value)
    }
  }

  /** 将指定课程中非标准名称的笔试成绩统一为标准名称（期末测试→期末考试等） */
  function normalizeWrittenExamNames(courseId: string) {
    const nameMap: Record<string, string | undefined> = {
      '期末测试': '期末考试',
      '期末笔试': '期末考试',
      '期中笔试': '期中考试',
    }
    let changed = false
    examScores.value = examScores.value.map((s) => {
      if (s.courseId === courseId) {
        const targetName = nameMap[s.examName]
        if (targetName && s.examName !== targetName) {
          changed = true
          return { ...s, examName: targetName }
        }
      }
      return s
    })
    if (changed) saveToStorage('examScores', examScores.value)
  }

  /** 获取课程已定义的考试/项目名称列表 */
  function getExamNames(courseId: string): string[] {
    const names = new Set(examScores.value.filter((s) => s.courseId === courseId).map((s) => s.examName))
    return Array.from(names).sort()
  }

  // ====== 考试/项目权重配置 ======

  /** 设置某个考试/项目的权重（type 可选，传入后按 类型::名称 复合键存储，避免跨类型同名冲突） */
  function setExamWeight(courseId: string, examName: string, weight: number, type?: string) {
    const courseWeights = { ...(examWeights.value[courseId] || {}) }
    const key = type ? `${type}::${examName}` : examName
    courseWeights[key] = Math.min(100, Math.max(0, weight))
    examWeights.value = { ...examWeights.value, [courseId]: courseWeights }
    saveToStorage('examWeights', examWeights.value)
  }

  /** 获取某个考试/项目的权重（type 可选，优先读取 类型::名称 复合键，回退到旧版纯名称键以兼容历史数据） */
  function getExamWeight(courseId: string, examName: string, type?: string): number {
    const courseWeights = examWeights.value[courseId]
    if (!courseWeights) return 0
    if (type) {
      const compositeKey = `${type}::${examName}`
      if (compositeKey in courseWeights) return courseWeights[compositeKey]
    }
    return courseWeights[examName] ?? 0
  }

  /** 获取课程所有考试/项目的权重配置 */
  function getExamWeightsForCourse(courseId: string): Record<string, number> {
    return examWeights.value[courseId] || {}
  }

  /** 获取某课程期中/期末项目占比的锁定状态 */
  function getProjectWeightLock(courseId: string, section: 'midterm' | 'final'): boolean {
    return projectWeightLocks.value[courseId]?.[section] ?? false
  }

  /** 持久化某课程期中/期末项目占比的锁定状态 */
  function setProjectWeightLock(courseId: string, section: 'midterm' | 'final', locked: boolean) {
    projectWeightLocks.value = {
      ...projectWeightLocks.value,
      [courseId]: { midterm: false, final: false, ...(projectWeightLocks.value[courseId] || {}), [section]: locked },
    }
    saveToStorage('projectWeightLocks', projectWeightLocks.value)
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

  function recalculateProgress(courseId: string) {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    const now = getNow()
    const totalSchedules = courseSchedules.length
    if (totalSchedules === 0) return

    // 已开始的课程数（startDate < now）
    const startedSchedules = courseSchedules.filter((s) => new Date(s.startDate) < now).length
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
    javaSaveGradeConfig(config).catch(() => {})
  }

  function getGradeConfig(courseId: string): GradeWeightConfig {
    return { ...getDefaultGradeConfig(courseId), ...(gradeConfigs.value[courseId] || {}) }
  }

  function addDetailedGrade(dg: DetailedGrade) {
    detailedGrades.value = [...detailedGrades.value, dg]
    saveToStorage('detailedGrades', detailedGrades.value)
    javaAddDetailedGrade(dg).catch(() => {})
  }

  function updateDetailedGrade(id: string, data: Partial<DetailedGrade>) {
    detailedGrades.value = detailedGrades.value.map((d) => (d.id === id ? { ...d, ...data } : d))
    saveToStorage('detailedGrades', detailedGrades.value)
    javaUpdateDetailedGrade(id, data).catch(() => {})
  }

  /** 互评类（组内/组间）评分：去掉最高分与最低分后取平均；不足 3 个评分则直接取平均 */
  function avgEvalScores(scores: number[]): number {
    if (scores.length === 0) return 0
    if (scores.length < 3) {
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }
    const sorted = [...scores].sort((a, b) => a - b).slice(1, -1)
    return Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
  }

  /** 将各类评价同步到详细成绩表，实现实时成绩更新。
   *  teacher/mentor/self 取普通平均；intra_group/inter_group 取去极值平均（不足3个直接平均） */
  function syncEvalToDetailedGrade(courseId: string) {
    const typeMap: Record<string, { field: keyof DetailedGrade; trimExtremes: boolean }> = {
      self: { field: 'selfEvalScore', trimExtremes: false },
      intra_group: { field: 'peerReviewScore', trimExtremes: true },
      inter_group: { field: 'interGroupScore', trimExtremes: true },
      teacher: { field: 'teacherScore', trimExtremes: false },
      mentor: { field: 'mentorScore', trimExtremes: false },
    }
    for (const [evalType, { field, trimExtremes }] of Object.entries(typeMap)) {
      const studentScores = new Map<string, number[]>()
      // 仅聚合任务评价（session_number=0）：旧版"按次数"评价已废弃，不参与成绩计算
      for (const ev of evaluations.value) {
        if (ev.courseId !== courseId || ev.type !== evalType || ev.sessionNumber !== 0) continue
        if (!studentScores.has(ev.studentId)) studentScores.set(ev.studentId, [])
        studentScores.get(ev.studentId)!.push(ev.score)
      }
      detailedGrades.value = detailedGrades.value.map((dg) => {
        if (dg.courseId !== courseId) return dg
        const scores = studentScores.get(dg.studentId)
        if (!scores || scores.length === 0) return dg
        const avg = trimExtremes ? avgEvalScores(scores) : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        return { ...dg, [field]: avg }
      })
    }
    saveToStorage('detailedGrades', detailedGrades.value)
    for (const dg of detailedGrades.value) {
      if (dg.courseId === courseId) {
        javaUpdateDetailedGrade(dg.id, dg).catch(() => {})
      }
    }
  }

  function getDetailedGrades(courseId: string): DetailedGrade[] {
    return detailedGrades.value.filter((d) => d.courseId === courseId)
  }

  /** 从 Java 后端刷新评价记录（任务评分后调用，使任务评分进入平时成绩计算） */
  async function refreshEvaluations(courseId?: string) {
    const dbEvaluations = await javaListEvaluations(courseId)
    if (Array.isArray(dbEvaluations)) {
      evaluations.value = dbEvaluations
      saveToStorage('evaluations', dbEvaluations)
    }
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
    const base = regular * cfg.regularWeight / 100 + midterm * cfg.midtermWeight / 100 + final * cfg.finalWeight / 100
    // 素质评价分数直接加在总成绩上（满分100，封顶 +10）
    const bonus = getStudentQualityScore(courseId, dg.studentId)
    return Math.round(Math.min(100, base + bonus))
  }

  // ====== 素质评价操作 ======

  /** 学生提交素质评价（追加一条提交记录，保留历史提交） */
  function submitQualityEvaluation(data: { courseId: string; studentId: string; files: QualityEvalFile[]; description?: string }) {
    const submission: QualityEvalSubmission = {
      id: `qes-${Date.now()}`,
      files: data.files,
      description: data.description,
      submittedAt: getNow().toISOString().split('T')[0],
    }
    const existing = qualityEvaluations.value.find(
      (q) => q.courseId === data.courseId && q.studentId === data.studentId
    )
    if (existing) {
      qualityEvaluations.value = qualityEvaluations.value.map((q) =>
        q.id === existing.id ? { ...q, submissions: [...q.submissions, submission] } : q
      )
    } else {
      qualityEvaluations.value = [
        ...qualityEvaluations.value,
        { id: `qe-${Date.now()}`, courseId: data.courseId, studentId: data.studentId, submissions: [submission] },
      ]
    }
    saveToStorage('qualityEvaluations', qualityEvaluations.value)
  }

  /** 教师对某次提交评分 */
  function scoreQualityEvaluation(id: string, submissionId: string, score: number, comment?: string) {
    qualityEvaluations.value = qualityEvaluations.value.map((q) =>
      q.id === id
        ? {
            ...q,
            submissions: q.submissions.map((s) =>
              s.id === submissionId
                ? { ...s, score, teacherComment: comment || s.teacherComment, gradedAt: getNow().toISOString().split('T')[0] }
                : s
            ),
          }
        : q
    )
    saveToStorage('qualityEvaluations', qualityEvaluations.value)
    const updated = qualityEvaluations.value.find((q) => q.id === id)
    if (updated) javaScoreQualityEvaluation(id, updated).catch(() => {})
  }

  /** 获取某课程所有素质评价 */
  function getQualityEvaluationsForCourse(courseId: string): QualityEvaluation[] {
    return qualityEvaluations.value.filter((q) => q.courseId === courseId)
  }

  /** 获取某学生在某课程的素质评价记录 */
  function getStudentQualityEvaluation(courseId: string, studentId: string): QualityEvaluation | undefined {
    return qualityEvaluations.value.find((q) => q.courseId === courseId && q.studentId === studentId)
  }

  /** 统计某课程中「最新一次提交尚未批改」的学生人数（用于教师端待批改提示） */
  function countPendingQualitySubmissions(courseId: string): number {
    return qualityEvaluations.value.filter((q) => {
      if (q.courseId !== courseId || q.submissions.length === 0) return false
      const latest = q.submissions[q.submissions.length - 1]
      return latest.score === undefined
    }).length
  }

  /** 获取某学生素质评价加成分数（取最新一次被评分的提交分数，封顶为配置的加成上限） */
  function getStudentQualityScore(courseId: string, studentId: string): number {
    const qe = getStudentQualityEvaluation(courseId, studentId)
    if (!qe) return 0
    const graded = qe.submissions.filter((s) => s.score !== undefined)
    if (graded.length === 0) return 0
    const latest = graded[graded.length - 1]
    // 加成上限可配置（成绩配置-素质评价），默认10分
    const maxBonus = gradeConfigs.value[courseId]?.qualityEvalMaxBonus ?? 10
    return Math.min(latest.score ?? 0, maxBonus)
  }

  // ====== 配置提醒 ======

  /** 第一节课是否已经开始（配置锁定期） */
  function isFirstClassStarted(courseId: string): boolean {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    if (courseSchedules.length === 0) return false
    return getNow() >= new Date(courseSchedules[0].endDate)
  }

  /** 第二节课是否已经开始（AI 分层测试截止点） */
  function isSecondClassStarted(courseId: string): boolean {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    // 有至少两节课才判定第二节课开始
    if (courseSchedules.length < 2) return false
    return getNow() >= new Date(courseSchedules[1].startDate)
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
      createdAt: getNow().toISOString().split('T')[0],
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
    generateAutoTodos()
  }

  /** 获取当前用户的授课课程（普通教师=自己教的课；领导 asTeacher=专属授课课程，与教师端"我的课程"一致） */
  function getTeacherCoursesForUser(user: string): Course[] {
    const leader = leaders.value.find((l) => l.name === user || l.name === currentDisplayName.value)
    if (leader?.asTeacher) {
      return courses.value.filter((c) => leader.teacherCourseIds?.includes(c.id) || c.teacher === user)
    }
    return courses.value.filter((c) => c.teacher === user)
  }

  /** 获取有未完成配置的课程列表（排除已锁定课程，仅当前教师自己的课程） */
  function getPendingConfigCourses(): { courseId: string; courseTitle: string; missing: string[] }[] {
    const activeCourses = getTeacherCoursesForUser(currentUser.value || '').filter(
      (c) => c.status === 'active'
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
    const mentor = mentors.value.find((m) => m.name === mentorName || m.name === currentDisplayName.value)
    if (mentor) return mentor.courseIds
    // 也检查课程 mentor 字段
    const byMentorField = courses.value.filter((c) => c.mentor === mentorName).map((c) => c.id)
    if (byMentorField.length > 0) return byMentorField
    // 领导以 asMentor 身份访问：优先用其专属导师课程（与普通导师一致），未配置时退回按管辖分类
    const leader = leaders.value.find((l) => l.name === mentorName || l.name === currentDisplayName.value)
    if (leader?.asMentor) {
      if (leader.mentorCourseIds?.length) return leader.mentorCourseIds
      return courses.value.filter((c) => leader.categoryIds.includes(c.categoryId)).map((c) => c.id)
    }
    return []
  }

  // ====== 学院领导相关 ======

  /** 获取某领导管辖的所有课程 */
  function getLeaderCourses(leaderName: string): Course[] {
    const leader = leaders.value.find((l) => l.name === leaderName || l.name === currentDisplayName.value)
    if (!leader) return []
    return courses.value.filter((c) => leader.categoryIds.includes(c.categoryId))
  }

  /** 获取某领导作为教师授课的专属课程（与教师端"我的课程"逻辑一致） */
  function getLeaderTeacherCourses(leaderName: string): Course[] {
    const leader = leaders.value.find((l) => l.name === leaderName || l.name === currentDisplayName.value)
    if (!leader?.asTeacher) return []
    return courses.value.filter(
      (c) => leader.teacherCourseIds?.includes(c.id) || c.teacher === leaderName
    )
  }

  /** 判断某课程是否为该领导作为教师的授课课程（可完整管理） */
  function isLeaderTeacherCourse(leaderName: string, courseId: string): boolean {
    return getLeaderTeacherCourses(leaderName).some((c) => c.id === courseId)
  }

  // ====== 待处理事务统计（用于侧边栏红点提醒与一路溯源） ======

  /** 当前用户在该课程是否有待完成的评价（任务评价模型）
   *  学生：已提交任务的尚未完成自评；教师/导师/领导：存在尚未批改的任务提交 */
  function hasPendingEvalForCourse(courseId: string): boolean {
    const user = currentUser.value
    if (!user) return false
    const tasks = taskEvalSnapshot.value[courseId]
    if (!tasks) return false
    if (currentRole.value === 'student') {
      const myId = students.value.find((s) => s.name === user || s.name === currentDisplayName.value)?.id ?? ''
      if (!myId) return false
      return Object.values(tasks).some((t) => t.submitted.includes(myId) && !t.selfDone[myId])
    }
    return Object.values(tasks).some((t) => t.ungraded.length > 0)
  }

  /** 某课程待批改任务数（教师/导师端"任务管理"红点） */
  function getPendingTaskEvalCount(courseId: string): number {
    const tasks = taskEvalSnapshot.value[courseId]
    if (!tasks) return 0
    return Object.values(tasks).filter((t) => t.ungraded.length > 0).length
  }

  /** 该课程是否仍有未完成的配置（成绩权重/评价方案） */
  function isCourseConfigPending(courseId: string): boolean {
    if (isFirstClassStarted(courseId)) return false // 第一节课已结束，配置已锁定，不再提醒
    const done = configCompleted.value[courseId]
    return !(done?.weights && done?.evalConfig)
  }

  /**
   * 获取当前用户在某范围内有未处理事务的课程 ID
   * scope: 'teacher'（教师端我的课程）/ 'mentor'（导师端我的课程）/ 'student'（学生端我的课程）/ 'leader'（领导端课程总览）
   */
  function getMyPendingCourseIds(scope: 'teacher' | 'mentor' | 'student' | 'leader'): string[] {
    const user = currentUser.value
    if (!user) return []
    const result = new Set<string>()

    if (scope === 'teacher') {
      for (const c of getTeacherCoursesForUser(user)) {
        if (hasPendingEvalForCourse(c.id) || isCourseConfigPending(c.id) || countPendingQualitySubmissions(c.id) > 0) {
          result.add(c.id)
        }
      }
    } else if (scope === 'mentor') {
      for (const courseId of getMentorCourseIds(user)) {
        if (hasPendingEvalForCourse(courseId)) result.add(courseId)
      }
    } else if (scope === 'student') {
      const student = students.value.find((s) => s.name === user || s.name === currentDisplayName.value)
      if (student) {
        const enrolled = enrollments.value.filter((e) => e.studentId === student.id && e.status !== 'dropped')
        const aiTierPending = new Set(getPendingAITierTests(student.id).map((t) => t.courseId))
        for (const enr of enrolled) {
          const courseId = enr.courseId
          const hasEval = hasPendingEvalForCourse(courseId)
          const hasHomework = homework.value.some(
            (h) => h.courseId === courseId && !homeworkSubmissions.value.some((s) => s.homeworkId === h.id && s.studentId === student.id)
          )
          if (hasEval || aiTierPending.has(courseId) || hasHomework) result.add(courseId)
        }
      }
    } else if (scope === 'leader') {
      // 领导段：仅统计教师/导师类待评（hasPendingEvalForCourse 对非学生角色按"未批改提交"判定）
      for (const c of getLeaderCourses(user)) {
        const hasPendingEval = hasPendingEvalForCourse(c.id)
        if (hasPendingEval || countPendingQualitySubmissions(c.id) > 0) result.add(c.id)
      }
    }
    return [...result]
  }

  /** 获取某领导管辖的所有学生（去重） */
  function getLeaderStudents(leaderName: string): Student[] {
    const leader = leaders.value.find((l) => l.name === leaderName || l.name === currentDisplayName.value)
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
      createdAt: getNow().toISOString().split('T')[0],
    }
    studentTiers.value = { ...studentTiers.value, [resultKey]: record }
    saveToStorage('studentTiers', studentTiers.value)
    generateAutoTodos()
    return record
  }

  /**
   * 全自动待办生成：扫描所有源（评价提醒/配置任务/素质评价/AI分层测试/作业），
   * 自动创建或清理对应的待办事项；底层源完成后待办自动消失。
   * 教师端/领导教师部分：评价待办 + 配置待办 + 素质评价批改待办
   * 学生端：评价待办 + AI分层测试待办 + 作业待办
   * 企业导师端/领导导师部分：评价待办
   */
  function generateAutoTodos() {
    const now = getNow()
    const currentStudentId = (() => {
      if (currentRole.value !== 'student' || !currentUser.value) return null
      return students.value.find((s) => s.name === currentDisplayName.value)?.id ?? null
    })()
    // 是否教师身份（普通教师 或 领导 asTeacher 在教师部分有专属授课课程）
    const isTeacherLike = !!currentUser.value && (
      currentRole.value === 'teacher' ||
      (currentRole.value === 'leader' && getTeacherCoursesForUser(currentUser.value).length > 0)
    )
    // 收集当前所有的 auto- 前缀待办 ID（用于去重）
    const autoTodoIds = new Set(todos.value.map((t) => t.id))
    const newTodos: TodoItem[] = []
    let changed = false

    // ── 辅助函数：检查 auto 待办是否已存在 ──
    const hasAutoTodo = (id: string) => autoTodoIds.has(id) || newTodos.some((t) => t.id === id)

    // ── 1. 评价待办（任务评价模型：评价均来自任务提交） ──
    // 学生：已提交任务但未完成自评；教师/导师/领导：存在尚未批改的任务提交
    const evalTodoCourses = currentRole.value === 'student'
      ? enrollments.value
          .filter((e) => e.studentId === currentStudentId && e.status !== 'dropped')
          .map((e) => e.courseId)
      : Array.from(new Set([
          ...(currentUser.value ? getTeacherCoursesForUser(currentUser.value).map((c) => c.id) : []),
          ...(currentUser.value ? getMentorCourseIds(currentUser.value) : []),
        ]))
    for (const courseId of evalTodoCourses) {
      const course = courses.value.find((c) => c.id === courseId)
      const tasks = taskEvalSnapshot.value[courseId]
      if (!course || !tasks) continue
      let pendingTitle = ''
      if (currentRole.value === 'student') {
        if (currentStudentId && Object.values(tasks).some((t) => t.submitted.includes(currentStudentId) && !t.selfDone[currentStudentId])) {
          pendingTitle = `[评价] ${course.title} 有待完成的评价`
        }
      } else if (Object.values(tasks).some((t) => t.ungraded.length > 0)) {
        pendingTitle = `[评价] ${course.title} 有待批改的任务提交`
      }
      if (!pendingTitle) continue
      const todoId = `auto-eval-${courseId}`
      if (hasAutoTodo(todoId)) continue
      newTodos.push({
        id: todoId,
        title: pendingTitle,
        completed: false,
        createdAt: now.toISOString().split('T')[0],
        createdBy: currentUser.value || 'system',
      })
      changed = true
    }

    // ── 2. 配置待办（教师/领导教师） ──
    if (isTeacherLike) {
      const pendingConfigs = getPendingConfigCourses()
      for (const cfg of pendingConfigs) {
        const todoId = `auto-config-${cfg.courseId}`
        if (hasAutoTodo(todoId)) continue
        newTodos.push({
          id: todoId,
          title: `[配置] ${cfg.courseTitle} - 未配置：${cfg.missing.join('、')}`,
          completed: false,
          createdAt: now.toISOString().split('T')[0],
          createdBy: currentUser.value || 'system',
        })
        changed = true
      }
    }

    // ── 2.5 素质评价批改待办（教师/领导教师） ──
    if (isTeacherLike) {
      for (const c of getTeacherCoursesForUser(currentUser.value || '')) {
        const pending = countPendingQualitySubmissions(c.id)
        if (pending <= 0) continue
        const todoId = `auto-quality-${c.id}`
        if (hasAutoTodo(todoId)) continue
        newTodos.push({
          id: todoId,
          title: `[素质评价] ${c.title} - ${pending}份待批改`,
          completed: false,
          createdAt: now.toISOString().split('T')[0],
          createdBy: currentUser.value || 'system',
        })
        changed = true
      }
    }

    // ── 3. AI 分层测试待办（仅学生） ──
    if (currentRole.value === 'student' && currentStudentId) {
      const pendingAITests = getPendingAITierTests(currentStudentId)
      for (const test of pendingAITests) {
        const todoId = `auto-ai-tier-${test.courseId}-${currentStudentId}`
        if (hasAutoTodo(todoId)) continue
        newTodos.push({
          id: todoId,
          title: `[AI分层] ${test.courseTitle} - 请在第二节课前完成分层测试`,
          completed: false,
          createdAt: now.toISOString().split('T')[0],
          dueDate: test.deadline,
          createdBy: currentUser.value || 'system',
        })
        changed = true
      }
    }

    // ── 4. 作业待办（仅学生） ──
    if (currentRole.value === 'student' && currentStudentId) {
      const pendingHomework = homework.value.filter((h) => {
        const submission = homeworkSubmissions.value.find(
          (s) => s.homeworkId === h.id && s.studentId === currentStudentId
        )
        return !submission
      })
      for (const hw of pendingHomework) {
        const todoId = `auto-homework-${hw.id}-${currentStudentId}`
        if (hasAutoTodo(todoId)) continue
        newTodos.push({
          id: todoId,
          title: `[作业] ${hw.title}`,
          completed: false,
          createdAt: hw.createdAt || now.toISOString().split('T')[0],
          dueDate: hw.dueDate,
          createdBy: currentUser.value || 'system',
        })
        changed = true
      }
    }

    // ── 5. 清理：当底层源已完成时，标记对应 auto-todo 为已完成（自动消失） ──
    todos.value = todos.value.map((t) => {
      if (t.completed) return t

      // 评价待办清理（任务评价模型：不再有待批改/待完成评价时自动消失）
      if (t.id.startsWith('auto-eval-')) {
        const courseId = t.id.replace('auto-eval-', '')
        const course = courses.value.find((c) => c.id === courseId)
        const tasks = taskEvalSnapshot.value[courseId]
        const stillPending = !!course && !!tasks && (
          currentRole.value === 'student'
            ? (currentStudentId ? Object.values(tasks).some((tt) => tt.submitted.includes(currentStudentId) && !tt.selfDone[currentStudentId]) : false)
            : Object.values(tasks).some((tt) => tt.ungraded.length > 0)
        )
        if (!stillPending) {
          changed = true
          return { ...t, completed: true }
        }
      }

      // 配置待办清理
      if (t.id.startsWith('auto-config-')) {
        const courseId = t.id.replace('auto-config-', '')
        const pending = getPendingConfigCourses()
        if (!pending.some((c) => c.courseId === courseId)) {
          changed = true
          return { ...t, completed: true }
        }
      }

      // 素质评价待办清理
      if (t.id.startsWith('auto-quality-')) {
        const courseId = t.id.replace('auto-quality-', '')
        if (countPendingQualitySubmissions(courseId) === 0) {
          changed = true
          return { ...t, completed: true }
        }
      }

      // AI 分层待办清理
      if (t.id.startsWith('auto-ai-tier-')) {
        const key = t.id.replace('auto-ai-tier-', '')
        if (studentTiers.value[key]) {
          changed = true
          return { ...t, completed: true }
        }
      }

      // 作业待办清理
      if (t.id.startsWith('auto-homework-')) {
        const key = t.id.replace('auto-homework-', '') // homeworkId-studentId
        const sepIdx = key.lastIndexOf('-')
        if (sepIdx > 0) {
          const hwId = key.substring(0, sepIdx)
          const stuId = key.substring(sepIdx + 1)
          const submission = homeworkSubmissions.value.find(
            (s) => s.homeworkId === hwId && s.studentId === stuId
          )
          if (submission) {
            changed = true
            return { ...t, completed: true }
          }
        }
      }

      return t
    })

    // ── 写入新待办并保存 ──
    if (newTodos.length > 0) {
      todos.value = [...todos.value, ...newTodos]
      changed = true
    }
    if (changed) {
      saveToStorage('todos', todos.value)
    }
  }

  // 初始化：根据排课自动重算所有课程的进度
  const courseIds = [...new Set(schedules.value.map((s) => s.courseId))]
  courseIds.forEach((cid) => recalculateProgress(cid))

  return {
    // state
    courses, categories, students, schedules, enrollments, teachers, grades,
    cloudFiles, todos, notes,
    evaluations, evalConfigs, studentGroups,
    gradeConfigs, detailedGrades,
    homework, homeworkSubmissions,
    isLoggedIn, currentUser, currentDisplayName, currentRole,
    mentors, leaders, secondaryRoles,
    departments, departmentClasses, selectedDepartmentId,
    examScores,
    examWeights,
    studentTiers,
    initFromDatabase,
    // actions
    login, logout,
    addCourse, updateCourse, deleteCourse, assignMentorToCourse,
    addCategory, updateCategory, deleteCategory,
    addSchedule, updateSchedule, deleteSchedule, replaceSchedules,
    addEnrollment, updateEnrollment, deleteEnrollment,
    addGrade, updateGrade, deleteGrade,
    addCloudFile, updateCloudFile, deleteCloudFile,
    addTodo, updateTodo, deleteTodo,
    addNote, updateNote, deleteNote,
    addHomework, updateHomework, deleteHomework,
    getCourseHomework, getCourseCloudFiles,
    submitHomework, getHomeworkSubmission,
    addEvaluation, updateEvaluation, deleteEvaluation,
    setEvalConfig, addStudentGroup, addStudent, updateStudent, deleteStudent, updateStudentGroup, deleteStudentGroup,
    getCourseGroups, clearCourseGroups, setCourseGroups, randomGroup,
    addExamScore, updateExamScore, submitExamScores, getExamScoresForCourse, getExamNames, deduplicateExamScores, normalizeWrittenExamNames,
    setExamWeight, getExamWeight, getExamWeightsForCourse,
    getProjectWeightLock, setProjectWeightLock,
    hasFinalExamSubmitted, isEvalConfigEditable, isWeightConfigEditable,
    generateAutoTodos,
    isFirstClassStarted, markConfigCompleted, getPendingConfigCourses,
    recalculateProgress,
    saveGradeConfig, getGradeConfig,
    addDetailedGrade, updateDetailedGrade, getDetailedGrades, syncEvalToDetailedGrade, refreshEvaluations,
    calcTotalScore,
    // 素质评价
    qualityEvaluations, submitQualityEvaluation, scoreQualityEvaluation,
    getQualityEvaluationsForCourse, getStudentQualityEvaluation, getStudentQualityScore, countPendingQualitySubmissions,
    getMentorCourseIds, getLeaderCourses, getLeaderStudents,
    getLeaderTeacherCourses, isLeaderTeacherCourse,
    getTeacherCoursesForUser,
    // 任务评价快照（任务评价模型的红点/待办判定）
    refreshTaskEvalInfo, getPendingTaskEvalCount,
    // 待处理事务统计（红点提醒）
    hasPendingEvalForCourse, isCourseConfigPending, getMyPendingCourseIds,
    getStudentTier, determineTier, submitAITierTest,
    isSecondClassStarted, getPendingAITierTests, autoAssignOverdueBasicTier,
    // department actions
    setSelectedDepartment, getSelectedDepartment,
    addDepartment, updateDepartment, deleteDepartment,
    getDepartmentCategories, getDepartmentClasses,
    addDepartmentClass, removeDepartmentClass,
  }
})