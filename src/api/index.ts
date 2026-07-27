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
