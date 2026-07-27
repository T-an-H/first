/**
 * 课程数据路由
 * 提供课程列表、详情等 API，供教师端和学生端使用
 */
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/** GET /api/courses - 获取所有课程 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM courses ORDER BY status DESC, title');
    res.json({ success: true, courses: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** GET /api/courses/teacher/:name - 获取某教师的所有课程 */
router.get('/teacher/:name', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM courses WHERE teacher = ? OR mentor = ? ORDER BY status DESC, title',
      [req.params.name, req.params.name]
    );
    res.json({ success: true, courses: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** GET /api/courses/:id/students - 获取某课程的学生（通过排课班级关联） */
router.get('/:id/students', async (req, res) => {
  try {
    // 1. 找该课程的所有排课，提取班级名
    const [schedules] = await pool.execute(
      'SELECT DISTINCT class_name FROM schedules WHERE course_id = ? AND class_name IS NOT NULL',
      [req.params.id]
    );

    const classNames = schedules.map((s) => s.class_name).filter(Boolean);

    if (classNames.length === 0) {
      return res.json({ success: true, students: [] });
    }

    // 2. 找这些班级的学生
    const placeholders = classNames.map(() => '?').join(',');
    const [students] = await pool.execute(
      `SELECT id, student_id, name, phone, email, class_name, status FROM students WHERE class_name IN (${placeholders}) ORDER BY name`,
      classNames
    );

    const result = students.map((s) => ({
      id: String(s.id),
      studentId: s.student_id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      className: s.class_name,
      status: s.status,
    }));

    res.json({ success: true, students: result });
  } catch (e) {
    console.error('获取课程学生失败:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
