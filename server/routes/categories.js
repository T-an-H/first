/**
 * 分类管理路由
 */
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/** 获取所有分类 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT cat.*, (SELECT COUNT(*) FROM courses WHERE category_id = cat.id) AS course_count FROM categories AS cat ORDER BY cat.name'
    );
    const cats = rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      color: r.color,
      courseCount: r.course_count,
    }));
    res.json({ success: true, categories: cats });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** 获取所有课程 */
router.get('/courses', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, title, teacher, category_id, category_name, credits, duration FROM courses ORDER BY title'
    );
    const courses = rows.map((r) => ({
      id: String(r.id),
      title: r.title,
      teacher: r.teacher,
      categoryId: r.category_id ? String(r.category_id) : '',
      categoryName: r.category_name || '',
      credits: r.credits || 0,
      duration: r.duration || 0,
    }));
    res.json({ success: true, courses });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/categories/sync - 从排课数据同步分类和课程
 */
router.post('/sync', async (req, res) => {
  try {
    // 1. 从 schedules 表提取所有不同的课程
    const [schedules] = await pool.execute(
      'SELECT DISTINCT course_id, title, teacher, class_name FROM schedules'
    );

    let added = 0, updated = 0, failed = 0;

    // 2. 从 class_name 提取分类名
    const classToCat = new Map();

    for (const s of schedules) {
      if (!s.class_name) continue;
      // 从班级名提取分类：如 "计算机2101班" → "计算机类"
      const match = s.class_name.match(/^(.+?)\d/);
      const catName = match ? match[1] + '类' : s.class_name;
      classToCat.set(s.class_name, catName);
    }

    // 3. 创建/获取分类
    const catMap = new Map();

    for (const catName of classToCat.values()) {
      const [existing] = await pool.execute('SELECT id FROM categories WHERE name = ?', [catName]);
      if (existing.length > 0) {
        catMap.set(catName, existing[0].id);
      } else {
        const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
        const color = colors[catMap.size % colors.length];
        const [res2] = await pool.execute('INSERT INTO categories (name, color) VALUES (?, ?)', [catName, color]);
        catMap.set(catName, res2.insertId);
        added++;
      }
    }

    // 4. 从排课创建课程记录
    const seen = new Set();
    for (const s of schedules) {
      if (seen.has(s.title)) continue;
      seen.add(s.title);

      const catName = classToCat.get(s.class_name) || '未分类';
      const catId = catMap.get(catName) || null;

      const [existing] = await pool.execute('SELECT id FROM courses WHERE title = ?', [s.title]);
      if (existing.length > 0) {
        if (catId) {
          await pool.execute('UPDATE courses SET teacher = ?, category_id = ?, category_name = ? WHERE id = ?',
            [s.teacher, catId, catName, existing[0].id]);
          updated++;
        }
      } else {
        await pool.execute(
          'INSERT INTO courses (title, teacher, category_id, category_name) VALUES (?, ?, ?, ?)',
          [s.title, s.teacher, catId, catName]
        );
        added++;
      }
    }

    res.json({
      success: true,
      message: `同步完成：新增 ${added} 项，更新 ${updated} 项${failed > 0 ? `，失败 ${failed} 项` : ''}`,
      added, updated, failed,
    });
  } catch (e) {
    console.error('同步失败:', e);
    res.status(500).json({ success: false, message: '同步失败：' + e.message });
  }
});

export default router;
