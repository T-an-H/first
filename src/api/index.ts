import type { AssistantAgentRequest, AssistantAgentResponse } from '@/lib/assistantAgent'

const API_PROTOCOL = window.location.protocol === 'https:' ? 'https:' : 'http:'
const API_HOST = window.location.hostname || '127.0.0.1'
const API_PORT = (import.meta.env.VITE_API_PORT as string | undefined) ?? '3002'
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? `${API_PROTOCOL}//${API_HOST}:${API_PORT}/api`

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

  const config: RequestInit = {
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    ...fetchOptions,
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

export async function fetchEvalConfig(courseId: string) {
  return request(`/eval/config/${courseId}`)
}

export async function saveEvalConfig(config: any) {
  return request('/eval/config', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function saveEvaluation(ev: any) {
  return request('/eval/save', {
    method: 'POST',
    body: JSON.stringify(ev),
  })
}

export async function batchSaveEvaluations(evaluations: any) {
  return request('/eval/batch', {
    method: 'POST',
    body: JSON.stringify({ evaluations }),
  })
}

export async function deleteEvaluation(id: string) {
  return request(`/eval/${id}`, { method: 'DELETE' })
}

export async function submitTeacherEval(data: any) {
  return request('/eval/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function saveEvalReminders(reminders: any) {
  return request('/eval/reminders', {
    method: 'POST',
    body: JSON.stringify({ reminders }),
  })
}

export async function updateEvalReminder(id: string, status: string) {
  return request(`/eval/reminders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
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
