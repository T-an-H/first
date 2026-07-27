/**
 * API 工具模块
 *
 * 封装与后端的 HTTP 通信
 */

// 后端地址（开发时 Express 运行在 3000 端口）
const API_BASE = 'http://localhost:3000/api';

/** 通用请求封装 */
async function request(url, options = {}) {
  // 3 秒超时 —— 避免后端未启动时用户卡在"登录中..."
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  const config = {
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    const data = await response.json();

    if (!response.ok && !data.success) {
      throw new Error(data.message || `请求失败 (${response.status})`);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 统一登录（所有角色：管理员/教师/学生） */
export async function unifiedLogin(account, password) {
  return request('/user/login', {
    method: 'POST',
    body: JSON.stringify({ account, password }),
  });
}

/** 学生登录（旧的，暂时保留） */
export async function studentLogin(studentId, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ studentId, password }),
  });
}

/** 学生注册 */
export async function studentRegister(data) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 验证 token 是否有效 */
export async function verifyToken(token) {
  return request('/auth/verify', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

/** 获取学生列表（管理员用） */
export async function fetchStudents(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/students${query ? '?' + query : ''}`);
}

/** 获取班级列表 */
export async function fetchClasses() {
  return request('/students/classes');
}

/** 获取分类列表 */
export async function fetchCategories() {
  return request('/categories');
}

/** 获取课程列表 */
export async function fetchCourses() {
  return request('/categories/courses');
}

/** 从排课同步分类和课程 */
export async function syncCategoriesFromSchedules() {
  return request('/categories/sync', { method: 'POST' });
}

/** 批量导入排课 */
export async function bulkImportSchedules(schedules) {
  return request('/schedules/bulk', {
    method: 'POST',
    body: JSON.stringify({ schedules }),
  });
}

/** 获取排课列表 */
export async function fetchSchedules() {
  return request('/schedules');
}

/** 获取某教师的课程列表 */
export async function fetchTeacherCourses(teacherName) {
  return request(`/courses/teacher/${encodeURIComponent(teacherName)}`);
}

/** 批量导入选课 */
export async function bulkImportEnrollments(enrollments) {
  return request('/teaching/enrollments/bulk', {
    method: 'POST',
    body: JSON.stringify({ enrollments }),
  });
}

/** 更新学生信息（如设置班级） */
export async function updateStudent(studentId, data) {
  return request(`/teaching/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** 批量导入成绩 */
export async function bulkImportScores(scores) {
  return request('/teaching/scores/bulk', {
    method: 'POST',
    body: JSON.stringify({ scores }),
  });
}

/** 批量导入分组 */
export async function bulkImportGroups(groups) {
  return request('/teaching/groups/bulk', {
    method: 'POST',
    body: JSON.stringify({ groups }),
  });
}

/** 更新一条排课 */
export async function updateSchedule(id, data) {
  return request(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** 删除一条排课 */
export async function deleteSchedule(id) {
  return request(`/schedules/${id}`, {
    method: 'DELETE',
  });
}
