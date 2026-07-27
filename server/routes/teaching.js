/**
 * 教学数据路由：选课 / 成绩 / 分组
 */
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// ==================== 选课 (Enrollments) ====================

/** POST /api/teaching/enrollments/bulk - 批量导入选课 */
router.post('/enrollments/bulk', async (req, res) => {
  try {
    const { enrollments } = req.body;
    if (!enrollments?.length) return res.json({ success: true, inserted: 0 });

    let inserted = 0, skipped = 0;
    for (const e of enrollments) {
      if (!e.studentId || !e.courseId) { skipped++; continue; }
      const [exist] = await pool.execute(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [e.studentId, e.courseId]
      );
      if (exist.length > 0) { skipped++; continue; }
      await pool.execute(
        'INSERT INTO enrollments (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [e.id || `enr-${Date.now()}-${inserted}`, e.studentId, e.courseId, e.scheduleId || '', e.enrollDate || '', e.progress || 0, e.status || 'enrolled']
      );
      inserted++;
    }
    res.json({ success: true, message: `导入 ${inserted} 条选课${skipped ? `，跳过 ${skipped} 条` : ''}`, inserted, skipped });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/** PUT /api/teaching/students/:id - 更新学生信息（如设置班级） */
router.put('/students/:id', async (req, res) => {
  try {
    const { className, name, phone, email } = req.body;
    const sets = []; const params = [];
    if (className !== undefined) { sets.push('class_name = ?'); params.push(className); }
    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (phone !== undefined) { sets.push('phone = ?'); params.push(phone); }
    if (email !== undefined) { sets.push('email = ?'); params.push(email); }
    if (sets.length === 0) return res.json({ success: true });
    params.push(req.params.id);
    await pool.execute(`UPDATE students SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: '更新成功' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ==================== 成绩 (Exam Scores) ====================

/** POST /api/teaching/scores/bulk - 批量导入成绩 */
router.post('/scores/bulk', async (req, res) => {
  try {
    const { scores } = req.body;
    if (!scores?.length) return res.json({ success: true, inserted: 0 });

    let inserted = 0, updated = 0;
    for (const s of scores) {
      if (!s.courseId || !s.studentId || !s.examName) continue;
      const [exist] = await pool.execute(
        'SELECT id FROM exam_scores WHERE course_id = ? AND student_id = ? AND exam_name = ?',
        [s.courseId, s.studentId, s.examName]
      );
      if (exist.length > 0) {
        await pool.execute(
          'UPDATE exam_scores SET score = ?, full_score = ?, weight = ?, graded_at = ?, status = ? WHERE id = ?',
          [s.score, s.fullScore || 100, s.weight || 50, s.gradedAt || '', s.status || 'draft', exist[0].id]
        );
        updated++;
      } else {
        await pool.execute(
          'INSERT INTO exam_scores (id, course_id, student_id, exam_name, score, full_score, weight, type, status, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [s.id || `score-${Date.now()}-${inserted}`, s.courseId, s.studentId, s.examName, s.score, s.fullScore || 100, s.weight || 50, s.type || 'midterm_exam', s.status || 'draft', s.gradedAt || '']
        );
        inserted++;
      }
    }
    res.json({ success: true, message: `导入 ${inserted} 条，更新 ${updated} 条`, inserted, updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ==================== 分组 (Student Groups) ====================

/** POST /api/teaching/groups/bulk - 批量导入分组 */
router.post('/groups/bulk', async (req, res) => {
  try {
    const { groups } = req.body;
    if (!groups?.length) return res.json({ success: true, inserted: 0 });

    let inserted = 0;
    for (const g of groups) {
      if (!g.courseId || !g.name) continue;
      const [exist] = await pool.execute(
        'SELECT id FROM student_groups WHERE course_id = ? AND name = ?',
        [g.courseId, g.name]
      );
      if (exist.length > 0) {
        await pool.execute('UPDATE student_groups SET member_ids = ? WHERE id = ?',
          [JSON.stringify(g.memberIds || []), exist[0].id]);
        continue;
      }
      await pool.execute(
        'INSERT INTO student_groups (id, course_id, name, member_ids) VALUES (?, ?, ?, ?)',
        [g.id || `group-${Date.now()}-${inserted}`, g.courseId, g.name, JSON.stringify(g.memberIds || [])]
      );
      inserted++;
    }
    res.json({ success: true, message: `导入 ${inserted} 个分组`, inserted });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
