/**
 * 学生管理路由
 *
 * 供管理员查看和管理学生名单
 */
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/** 格式化 MySQL 日期，避免 toISOString 时区偏移 */
function fmtDate(d) {
  if (!d) return '';
  if (typeof d === 'string') return d;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * GET /api/students/classes - 获取所有班级及人数
 * 返回: { success, classes: [{ name, count }] }
 */
router.get('/classes', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT class_name AS name, COUNT(*) AS count FROM students WHERE class_name IS NOT NULL AND class_name != "" GROUP BY class_name ORDER BY class_name'
    );
    res.json({ success: true, classes: rows });
  } catch (error) {
    console.error('获取班级列表失败:', error);
    res.status(500).json({ success: false, message: '获取班级列表失败' });
  }
});

/**
 * GET /api/students - 获取所有学生
 * 支持 ?class=xxx 按班级筛选，支持 ?search=xxx 搜索
 * 返回: { success, students, total }
 */
router.get('/', async (req, res) => {
  try {
    const { search, class: className, page = 1, pageSize = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(name LIKE ? OR student_id LIKE ? OR class_name LIKE ?)');
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
    }

    if (className) {
      conditions.push('class_name = ?');
      params.push(className);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // 查总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM students ${whereClause}`,
      params
    );

    // 查列表
    const [rows] = await pool.execute(
      `SELECT id, student_id, name, phone, email, class_name, department, status, created_at
       FROM students ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    // 字段名映射：student_id → studentId, class_name → className
    const students = rows.map((s) => ({
      id: String(s.id),
      name: s.name,
      studentId: s.student_id,
      phone: s.phone,
      email: s.email,
      className: s.class_name,
      department: s.department || '',
      status: s.status,
      joinDate: fmtDate(s.created_at),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
    }));

    res.json({
      success: true,
      total: countRows[0].total,
      students,
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({ success: false, message: '获取学生列表失败' });
  }
});

/**
 * GET /api/students/:id - 获取单个学生详情
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, student_id, name, phone, email, class_name, department, status, created_at FROM students WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '学生不存在' });
    }

    const s = rows[0];
    const student = {
      id: String(s.id),
      name: s.name,
      studentId: s.student_id,
      phone: s.phone,
      email: s.email,
      className: s.class_name,
      status: s.status,
      joinDate: fmtDate(s.created_at),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
    };

    res.json({ success: true, student });
  } catch (error) {
    console.error('获取学生详情失败:', error);
    res.status(500).json({ success: false, message: '获取学生详情失败' });
  }
});

/** GET /api/students/department/:dept - 获取某院系所有学生 */
router.get('/department/:dept', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, student_id, name, phone, email, class_name, department, status, created_at FROM students WHERE department = ? ORDER BY class_name, name',
      [req.params.dept]
    );
    const students = rows.map((s) => ({
      id: String(s.id),
      name: s.name,
      studentId: s.student_id,
      phone: s.phone,
      email: s.email,
      className: s.class_name,
      department: s.department || '',
      status: s.status,
      joinDate: fmtDate(s.created_at),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
    }));
    res.json({ success: true, students });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
