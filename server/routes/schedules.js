/**
 * 排课管理路由
 *
 * 支持单条添加、批量导入（Excel 解析后数据）
 */
import { Router } from 'express';
import pool from '../db.js';

/** 格式化 MySQL 日期，避免 toISOString 时区偏移 */
function fmtDate(d) {
  if (!d) return '';
  if (typeof d === 'string') return d;
  // d 是 Date 对象 → 按本地时间格式化 yyyy-mm-dd
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const router = Router();

/**
 * GET /api/schedules - 获取所有排课
 * 支持 ?class=xxx 按班级筛选
 */
router.get('/', async (req, res) => {
  try {
    const { class: className } = req.query;
    let sql = 'SELECT id, course_id, title, teacher, room, class_name, start_date, end_date, time_slot FROM schedules';
    const params = [];

    if (className) {
      sql += ' WHERE class_name = ?';
      params.push(className);
    }

    sql += ' ORDER BY start_date DESC, time_slot';

    const [rows] = await pool.execute(sql, params);

    const schedules = rows.map((s) => ({
      id: String(s.id),
      courseId: s.course_id,
      title: s.title,
      teacher: s.teacher,
      room: s.room,
      className: s.class_name || '',
      startDate: fmtDate(s.start_date),
      endDate: fmtDate(s.end_date),
      timeSlot: s.time_slot,
    }));

    res.json({ success: true, schedules });
  } catch (error) {
    console.error('获取排课列表失败:', error);
    res.status(500).json({ success: false, message: '获取排课列表失败' });
  }
});

/**
 * POST /api/schedules/bulk - 批量导入排课
 * 接收: { schedules: [ { courseId, title, startDate, endDate, timeSlot, room, teacher }, ... ] }
 */
router.post('/bulk', async (req, res) => {
  try {
    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ success: false, message: '没有有效的排课数据' });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const s of schedules) {
      // 跳过无效行（只需要 title、日期、时段、教室）
      if (!s.title || !s.startDate || !s.timeSlot || !s.room) {
        skipped++;
        continue;
      }

      // 检查是否重复（同课程名称+同日期+同时段+同教室）
      const lookupId = s.courseId || s.title;
      const [existing] = await pool.execute(
        'SELECT id FROM schedules WHERE (course_id = ? AND start_date = ? AND time_slot = ? AND room = ?)',
        [lookupId, s.startDate, s.timeSlot, s.room]
      );

      if (existing.length > 0) {
        // 重复则更新信息（教师、班级等可能变化）
        await pool.execute(
          'UPDATE schedules SET teacher = ?, class_name = ?, end_date = ? WHERE id = ?',
          [s.teacher || '', s.className || null, s.endDate || s.startDate, existing[0].id]
        );
        updated++;
        continue;
      }

      await pool.execute(
        'INSERT INTO schedules (course_id, title, teacher, room, class_name, start_date, end_date, time_slot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          lookupId,
          s.title,
          s.teacher || '',
          s.room,
          s.className || null,
          s.startDate,
          s.endDate || s.startDate,
          s.timeSlot,
        ]
      );

      // 自动创建课程（如果不存在）
      try {
        const [courseExist] = await pool.execute('SELECT id FROM courses WHERE id = ? OR title = ?', [lookupId, s.title]);
        if (courseExist.length === 0) {
          await pool.execute(
            'INSERT INTO courses (id, title, teacher, department, status) VALUES (?, ?, ?, ?, ?)',
            [lookupId, s.title, s.teacher || '', s.department || null, 'active']
          );
        }
      } catch (e) {
        console.error('自动创建课程失败:', e.message);
      }
      inserted++;
    }

    res.json({
      success: true,
      message: `成功导入 ${inserted} 条${updated > 0 ? `，更新 ${updated} 条` : ''}${skipped > 0 ? `，跳过 ${skipped} 条` : ''}`,
      inserted, updated, skipped,
    });
  } catch (error) {
    console.error('批量导入排课失败:', error);
    res.status(500).json({ success: false, message: '导入失败：' + error.message });
  }
});

/**
 * PUT /api/schedules/:id - 更新一条排课
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, teacher, room, className, startDate, endDate, timeSlot } = req.body;
    await pool.execute(
      'UPDATE schedules SET title = ?, teacher = ?, room = ?, class_name = ?, start_date = ?, end_date = ?, time_slot = ? WHERE id = ?',
      [title, teacher, room, className || null, startDate, endDate || startDate, timeSlot, id]
    );
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('更新排课失败:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

/**
 * DELETE /api/schedules/:id - 删除一条排课
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM schedules WHERE id = ?', [id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除排课失败:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

export default router;
