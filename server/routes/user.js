/**
 * 统一登录路由
 *
 * 根据 account 查询 users 表，自动判断角色并返回跳转地址
 * 前端收到后直接跳转，不需要再自己判断角色
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();

const JWT_SECRET = 'course-platform-secret-key-2026';
const JWT_EXPIRES = '7d';

/**
 * 根据角色和子角色获取跳转地址
 */
function getPortal(role, subRole) {
  if (role === 'admin') return '/admin/schedules';
  if (role === 'teacher') {
    if (subRole === 'mentor') return '/mentor/courses';
    if (subRole === 'leader') return '/leader/courses';
    return '/teacher/courses';
  }
  if (role === 'student') return '/student/courses';
  if (role === 'leader') return '/leader/courses';
  return '/';
}

/**
 * POST /api/user/login - 统一登录
 * 接收: { account, password }
 * 返回: { success, token, user, portal }
 */
router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({ success: false, message: '请输入账号和密码' });
    }

    // 查 users 表（要查 password 用于比对）
    const [rows] = await pool.execute(
      'SELECT id, account, name, department, role, sub_role, status, password FROM users WHERE account = ?',
      [account]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
    }

    const user = rows[0];

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: '该账号已被禁用' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
    }

    // 生成 JWT
    const token = jwt.sign(
      { id: user.id, account: user.account, name: user.name, role: user.role, sub_role: user.sub_role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const portal = getPortal(user.role, user.sub_role);

    // 判断是否有教师身份：角色为 teacher 的都有教师权限
    const hasTeacherAccess = user.role === 'teacher';

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        account: user.account,
        name: user.name,
        department: user.department || '',
        role: user.role,
        sub_role: user.sub_role,
        isTeacher: hasTeacherAccess,
      },
      portal,
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
