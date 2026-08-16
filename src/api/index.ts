import type { AssistantAgentRequest, AssistantAgentResponse } from '@/lib/assistantAgent'

const API_PROTOCOL = window.location.protocol === 'https:' ? 'https:' : 'http:'
const API_HOST = window.location.hostname || '127.0.0.1'
const API_PORT = (import.meta.env.VITE_API_PORT as string | undefined) ?? '3000'
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? `${API_PROTOCOL}//${API_HOST}:${API_PORT}/api`

// Java 后端（教师端联调模块，端口 8080），可通过 VITE_JAVA_API_PORT / VITE_JAVA_API_BASE 覆盖
const JAVA_API_PORT = (import.meta.env.VITE_JAVA_API_PORT as string | undefined) ?? '8080'
export const JAVA_API_BASE = (import.meta.env.VITE_JAVA_API_BASE as string | undefined) ?? `${API_PROTOCOL}//${API_HOST}:${JAVA_API_PORT}/api`

type RequestOptions = RequestInit & {
  timeoutMs?: number
}

type RequestError = Error & {
  code?: string
  status?: number
}

async function request(url: string, options: RequestOptions = {}) {
  const { timeoutMs = 3000, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) headers.Authorization = `Bearer ${token}`

  const config: RequestInit = {
    ...fetchOptions,
    headers: { ...headers, ...(fetchOptions.headers as Record<string, string> | undefined) },
    signal: controller.signal,
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, config)
    const data = await response.json().catch(() => ({}))

    if (!response.ok || data.success === false) {
      if (typeof data.code === 'string') {
        const error = new Error(data.message || `Request failed (${response.status})`) as RequestError
        error.code = data.code
        error.status = response.status
        throw error
      }
      throw new Error(data.message || `请求失败 (${response.status})`)
    }

    return data
  } finally {
    window.clearTimeout(timeoutId)
  }
}

/**
 * Java 后端请求：响应格式统一为 { code, msg, data }，成功(code=200)时返回业务数据 data
 * 联调期 Java 后端未启动时静默失败，不影响前端本地功能
 */
async function javaRequest(url: string, options: RequestOptions = {}) {
  const { timeoutMs = 5000, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) headers.Authorization = `Bearer ${token}`

  const config: RequestInit = {
    ...fetchOptions,
    headers: { ...headers, ...(fetchOptions.headers as Record<string, string> | undefined) },
    signal: controller.signal,
  }

  try {
    const response = await fetch(`${JAVA_API_BASE}${url}`, config)
    const data = await response.json().catch(() => ({}))

    if (!response.ok || data.code !== 200) {
      throw new Error(data.msg || `请求失败 (${response.status})`)
    }
    return data.data
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function unifiedLogin(account: string, password: string) {
  return request('/user/login', {
    method: 'POST',
    body: JSON.stringify({ account, password }),
  })
}

export async function studentLogin(studentId: string, password: string) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ studentId, password }),
  })
}

export async function studentRegister(data: any) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function verifyToken(token: string) {
  return request('/auth/verify', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function fetchStudents(params: Record<string, any> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => (value == null ? [] : [[key, String(value)]])),
  ).toString()
  return request(`/students${query ? `?${query}` : ''}`)
}

/** POST /api/teaching/students/bulk - 教师端批量导入学生（落库 course_db.student） */
export async function createStudents(students: any[]) {
  return request('/teaching/students/bulk', {
    method: 'POST',
    body: JSON.stringify({ students }),
  })
}

/** 从 localStorage 读取登录 token，返回鉴权请求头（供组件内散落 fetch 使用） */
export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchClasses() {
  return request('/students/classes')
}

export async function fetchCategories() {
  return request('/categories')
}

export async function fetchCourses() {
  return request('/categories/courses')
}

export async function syncCategoriesFromSchedules() {
  return request('/categories/sync', { method: 'POST' })
}

export async function bulkImportSchedules(schedules: any) {
  return request('/schedules/bulk', {
    method: 'POST',
    body: JSON.stringify({ schedules }),
  })
}

export async function fetchSchedules(params: Record<string, any> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => (value == null ? [] : [[key, String(value)]])),
  ).toString()
  return request(`/schedules${query ? `?${query}` : ''}`)
}

export async function fetchTeacherCourses(teacherName: string) {
  return request(`/courses/teacher/${encodeURIComponent(teacherName)}`)
}

export async function bulkImportEnrollments(enrollments: any) {
  return request('/teaching/enrollments/bulk', {
    method: 'POST',
    body: JSON.stringify({ enrollments }),
  })
}

export async function updateStudent(studentId: string, data: any) {
  return request(`/teaching/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function bulkImportScores(scores: any) {
  return request('/teaching/scores/bulk', {
    method: 'POST',
    body: JSON.stringify({ scores }),
  })
}

export async function bulkImportGroups(groups: any) {
  return request('/teaching/groups/bulk', {
    method: 'POST',
    body: JSON.stringify({ groups }),
  })
}

// ============================================================
// 课程任务（教师布置 / 学生提交 / 教师导师评分）
// ============================================================

/** GET /api/tasks?courseId=xxx - 任务列表（含已评人数与平均分） */
export async function listTasks(courseId: string) {
  return request(`/tasks?courseId=${encodeURIComponent(courseId)}`)
}

/** POST /api/tasks - 新增任务（教师） */
export async function createTask(data: any) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** PUT /api/tasks/:id - 更新任务（教师） */
export async function updateTask(id: string, data: any) {
  return request(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/** DELETE /api/tasks/:id - 删除任务（教师，级联删除提交记录） */
export async function deleteTask(id: string) {
  return request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** GET /api/tasks/:id/submissions - 某任务全部提交 */
export async function listTaskSubmissions(taskId: string) {
  return request(`/tasks/${encodeURIComponent(taskId)}/submissions`)
}

/** POST /api/tasks/:id/submissions - 学生提交/更新提交 */
export async function submitTask(taskId: string, data: any) {
  return request(`/tasks/${encodeURIComponent(taskId)}/submissions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** PUT /api/tasks/submissions/:id - 评分（教师 或 导师且课程开启导师参与） */
export async function gradeTaskSubmission(submissionId: string, score: number) {
  return request(`/tasks/submissions/${encodeURIComponent(submissionId)}`, {
    method: 'PUT',
    body: JSON.stringify({ score }),
  })
}

/** POST /api/tasks/:id/evals - 任务评价（教师 teacher / 导师 mentor / 学生 self·intra_group·inter_group，按模板校验） */
export async function submitTaskEval(taskId: string, data: { studentId: string; type: string; score: number; comment?: string }) {
  return request(`/tasks/${encodeURIComponent(taskId)}/evals`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** GET /api/tasks/:id/evals - 某任务全部评价记录（含评价者） */
export async function listTaskEvals(taskId: string) {
  return request(`/tasks/${encodeURIComponent(taskId)}/evals`)
}

export async function fetchCourseScores(courseId: string) {
  return request(`/teaching/scores/${courseId}`)
}

export async function fetchStudentScores(studentId: string) {
  return request(`/teaching/scores/student/${studentId}`)
}

export async function fetchDepartmentCourses(department: string) {
  return request(`/courses/department/${encodeURIComponent(department)}`)
}

export async function fetchDepartmentStudents(department: string) {
  return request(`/students/department/${encodeURIComponent(department)}`)
}

export async function updateCourse(id: string, data: any) {
  return request(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function updateSchedule(id: string, data: any) {
  return request(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteSchedule(id: string) {
  return request(`/schedules/${id}`, {
    method: 'DELETE',
  })
}

export async function invokeAssistant(payload: AssistantAgentRequest): Promise<AssistantAgentResponse> {
  return request('/assistant/navigate', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 30000,
  })
}

// ============================================================
// Java 后端接口（教师端联调：选课 / 分组 / 课程资源 / 成绩配置 / 评价 / 统计）
// 路径与 Java 后端完全一致，响应格式 { code, msg, data }
// ============================================================

export async function javaListEnrollments(courseId?: string) {
  return javaRequest(`/teaching/enrollments${courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''}`)
}

/** GET /teaching/enrollments/students?courseId= 返回课程下全部学生 */
export async function javaListEnrollmentStudents(courseId: string) {
  return javaRequest(`/teaching/enrollments/students?courseId=${encodeURIComponent(courseId)}`)
}

/** POST /teaching/enrollments/bulk 批量选课（body 为裸数组） */
export async function javaBulkEnrollments(enrollments: any[]) {
  return javaRequest('/teaching/enrollments/bulk', {
    method: 'POST',
    body: JSON.stringify(enrollments),
  })
}

export async function javaAddEnrollment(enrollment: any) {
  return javaRequest('/teaching/enrollments', {
    method: 'POST',
    body: JSON.stringify(enrollment),
  })
}

export async function javaUpdateEnrollment(id: string, data: any) {
  return javaRequest(`/teaching/enrollments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function javaDeleteEnrollment(id: string) {
  return javaRequest(`/teaching/enrollments/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function javaListGroups(courseId?: string) {
  return javaRequest(`/teaching/groups${courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''}`)
}

export async function javaAddGroup(group: any) {
  return javaRequest('/teaching/groups', {
    method: 'POST',
    body: JSON.stringify(group),
  })
}

export async function javaUpdateGroup(id: string, data: any) {
  return javaRequest(`/teaching/groups/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function javaDeleteGroup(id: string) {
  return javaRequest(`/teaching/groups/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** POST /teaching/groups/bulk 批量分组（body 为裸数组） */
export async function javaBulkGroups(groups: any[]) {
  return javaRequest('/teaching/groups/bulk', {
    method: 'POST',
    body: JSON.stringify(groups),
  })
}

export async function javaListFiles(courseId?: string) {
  return javaRequest(`/teaching/files${courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''}`)
}

export async function javaAddFile(file: any) {
  return javaRequest('/teaching/files', {
    method: 'POST',
    body: JSON.stringify(file),
  })
}

export async function javaDeleteFile(id: string) {
  return javaRequest(`/teaching/files/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function javaGetGradeConfig(courseId: string) {
  return javaRequest(`/teaching/grade-config?courseId=${encodeURIComponent(courseId)}`)
}

export async function javaSaveGradeConfig(config: any) {
  return javaRequest('/teaching/grade-config', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function javaListEvaluations(courseId?: string) {
  return javaRequest(`/teaching/evaluations${courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''}`)
}

export async function javaCourseStats(courseId: string) {
  return javaRequest(`/courses/${encodeURIComponent(courseId)}/stats`)
}

// ============================================================
// Java 后端全量拉取接口（教师端数据库启用，不带参数拉取整表数据）
// ============================================================

export async function javaListCourses() {
  return javaRequest('/courses')
}

export async function javaListStudents(keyword?: string) {
  return javaRequest(`/students${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`)
}

export async function javaListSchedules() {
  return javaRequest('/schedules')
}

export async function javaListGrades() {
  return javaRequest('/teaching/grades')
}

export async function javaListExamScores() {
  return javaRequest('/teaching/exam-scores')
}

export async function javaListEvalConfigs() {
  return javaRequest('/teaching/eval-configs')
}

export async function javaListDetailedGrades() {
  return javaRequest('/teaching/detailed-grades')
}

export async function javaListQualityEvaluations() {
  return javaRequest('/teaching/quality-evaluations')
}

export async function javaListHomework() {
  return javaRequest('/teaching/homeworks')
}

export async function javaListHomeworkSubmissions() {
  return javaRequest('/teaching/homework-submissions')
}

export async function javaListTodos() {
  return javaRequest('/teaching/todos')
}

export async function javaListNotes() {
  return javaRequest('/teaching/notes')
}

export async function javaListStudentTiers() {
  return javaRequest('/teaching/student-tiers')
}

// ============================================================
// Java 后端基础数据接口（分类/学院/班级/教师/导师/领导，course_db）
// ============================================================

export async function javaListCategories() {
  return javaRequest('/base-data/categories')
}

export async function javaListDepartments() {
  return javaRequest('/base-data/departments')
}

export async function javaListDepartmentClasses() {
  return javaRequest('/base-data/department-classes')
}

export async function javaListTeachers() {
  return javaRequest('/base-data/teachers')
}

export async function javaListMentors() {
  return javaRequest('/base-data/mentors')
}

export async function javaListLeaders() {
  return javaRequest('/base-data/leaders')
}

// ============================================================
// Java 后端写接口封装（教师端操作落库，无作业模块）
// ============================================================

// 待办
export async function javaAddTodo(todo: any) {
  return javaRequest('/teaching/todos', { method: 'POST', body: JSON.stringify(todo) })
}
export async function javaUpdateTodo(id: string, data: any) {
  return javaRequest(`/teaching/todos/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteTodo(id: string) {
  return javaRequest(`/teaching/todos/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// 笔记
export async function javaAddNote(note: any) {
  return javaRequest('/teaching/notes', { method: 'POST', body: JSON.stringify(note) })
}
export async function javaUpdateNote(id: string, data: any) {
  return javaRequest(`/teaching/notes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteNote(id: string) {
  return javaRequest(`/teaching/notes/${encodeURIComponent(id)}`, { method: 'DELETE' })
}


// 课程评价（互评/教师评价）
export async function javaAddEvaluation(ev: any) {
  return javaRequest('/teaching/evaluations', { method: 'POST', body: JSON.stringify(ev) })
}
export async function javaUpdateEvaluation(id: string, data: any) {
  return javaRequest(`/teaching/evaluations/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteEvaluation(id: string) {
  return javaRequest(`/teaching/evaluations/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// 评价方案配置
export async function javaSaveEvalConfig(config: any) {
  return javaRequest('/teaching/eval-configs', { method: 'POST', body: JSON.stringify(config) })
}

// 素质评价（打分）
export async function javaScoreQualityEvaluation(id: string, data: any) {
  return javaRequest(`/teaching/quality-evaluations/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}

// 成绩明细/总评
export async function javaAddDetailedGrade(dg: any) {
  return javaRequest('/teaching/detailed-grades', { method: 'POST', body: JSON.stringify(dg) })
}
export async function javaUpdateDetailedGrade(id: string, data: any) {
  return javaRequest(`/teaching/detailed-grades/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteDetailedGrade(id: string) {
  return javaRequest(`/teaching/detailed-grades/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// 综合成绩
export async function javaAddGrade(grade: any) {
  return javaRequest('/teaching/grades', { method: 'POST', body: JSON.stringify(grade) })
}
export async function javaUpdateGrade(id: string, data: any) {
  return javaRequest(`/teaching/grades/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteGrade(id: string) {
  return javaRequest(`/teaching/grades/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// 考试/项目成绩
export async function javaAddExamScore(exam: any) {
  return javaRequest('/teaching/exam-scores', { method: 'POST', body: JSON.stringify(exam) })
}
export async function javaUpdateExamScore(id: string, data: any) {
  return javaRequest(`/teaching/exam-scores/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteExamScore(id: string) {
  return javaRequest(`/teaching/exam-scores/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
/** POST /teaching/scores/bulk 批量成绩（body 为裸数组） */
export async function javaBulkScores(scores: any[]) {
  return javaRequest('/teaching/scores/bulk', {
    method: 'POST',
    body: JSON.stringify(scores),
  })
}

/** GET /teaching/scores/student/{studentId} 按学生查成绩（返回 Grade 裸数组） */
export async function javaFetchStudentScores(studentId: string) {
  return javaRequest(`/teaching/scores/student/${encodeURIComponent(studentId)}`)
}

// 课程
export async function javaAddCourse(course: any) {
  return javaRequest('/courses', { method: 'POST', body: JSON.stringify(course) })
}
export async function javaUpdateCourse(id: string, data: any) {
  return javaRequest(`/courses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteCourse(id: string) {
  return javaRequest(`/courses/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// 排课
export async function javaAddSchedule(schedule: any) {
  return javaRequest('/schedules', { method: 'POST', body: JSON.stringify(schedule) })
}
export async function javaUpdateSchedule(id: string, data: any) {
  return javaRequest(`/schedules/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteSchedule(id: string) {
  return javaRequest(`/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
/** POST /schedules/bulk 批量排课 */
export async function javaBulkSchedules(schedules: any[]) {
  return javaRequest('/schedules/bulk', {
    method: 'POST',
    body: JSON.stringify({ schedules }),
  })
}

// 学生
export async function javaAddStudent(student: any) {
  return javaRequest('/students', { method: 'POST', body: JSON.stringify(student) })
}
export async function javaUpdateStudent(id: string, data: any) {
  return javaRequest(`/students/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteStudent(id: string) {
  return javaRequest(`/students/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// 学生分层
export async function javaAddStudentTier(tier: any) {
  return javaRequest('/teaching/student-tiers', { method: 'POST', body: JSON.stringify(tier) })
}
export async function javaUpdateStudentTier(id: string, data: any) {
  return javaRequest(`/teaching/student-tiers/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function javaDeleteStudentTier(id: string) {
  return javaRequest(`/teaching/student-tiers/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// 云盘文件更新（重命名等）
export async function javaUpdateFile(id: string, data: any) {
  return javaRequest(`/teaching/files/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) })
}
