/**
 * 课程任务路由：教师布置任务，学生上传资料提交，教师/导师评分
 *
 * 权限说明（/api 已全局挂 authMiddleware，写接口需登录）：
 * - POST/PUT/DELETE /api/tasks        → requireManager（教师/领导可布置/编辑/删除，导师不可）
 * - POST /api/tasks/:id/submissions   → 登录用户（学生提交/更新自己的提交）
 * - PUT  /api/tasks/submissions/:id   → 教师/领导直接评；导师需该课程开启导师参与（eval_config.has_mentor=1）
 */
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

function parseJson(s) {
  if (!s) return [];
  try { return typeof s === 'string' ? JSON.parse(s) : s; } catch { return []; }
}
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

/** 当前用户能否管理（布置/编辑/删除）任务：教师/领导/管理员可，导师不可 */
function isManager(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && user.sub_role !== 'mentor') return true;
  return false;
}

/** 当前用户能否评该任务：教师/领导/admin 直接可评；导师需课程开启导师参与 */
async function canGradeTask(user, taskId) {
  if (!user) return false;
  if (isManager(user)) return true;
  if (user.role === 'teacher' && user.sub_role === 'mentor') {
    const [task] = await pool.execute('SELECT course_id FROM course_task WHERE id = ?', [taskId]);
    if (task.length === 0) return false;
    const [cfg] = await pool.execute('SELECT has_mentor FROM eval_config WHERE course_id = ?', [task[0].course_id]);
    return cfg.length > 0 && Number(cfg[0].has_mentor) === 1;
  }
  return false;
}

function requireManager(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: '未登录或登录已过期' });
  if (isManager(req.user)) return next();
  return res.status(403).json({ success: false, message: '仅教师可布置/编辑/删除任务' });
}

/** GET /api/tasks?courseId=xxx - 任务列表（含已评人数与平均分） */
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;
    if (!courseId) return res.json({ success: true, tasks: [] });
    const [rows] = await pool.execute(
      'SELECT * FROM course_task WHERE course_id = ? ORDER BY created_at DESC',
      [courseId]
    );
    const tasks = [];
    for (const r of rows) {
      const [subs] = await pool.execute(
        'SELECT COUNT(*) AS cnt, AVG(score) AS avg_score FROM course_task_submission WHERE task_id = ? AND score IS NOT NULL',
        [r.id]
      );
      tasks.push({
        id: r.id,
        courseId: r.course_id,
        title: r.title,
        description: r.description || '',
        attachments: parseJson(r.attachments),
        createdBy: r.created_by || '',
        createdAt: r.created_at || '',
        submittedCount: Number(subs[0].cnt || 0),
        avgScore: subs[0].avg_score != null ? Math.round(Number(subs[0].avg_score)) : undefined,
      });
    }
    res.json({ success: true, tasks });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/** POST /api/tasks - 新增任务（教师/领导，导师不可） */
router.post('/', requireManager, async (req, res) => {
  try {
    const { courseId, title, description, attachments } = req.body;
    if (!courseId || !title?.trim()) return res.status(400).json({ success: false, message: '课程与标题必填' });
    const id = req.body.id || `task-${Date.now()}`;
    const t = now();
    await pool.execute(
      'INSERT INTO course_task (id, course_id, title, description, attachments, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, courseId, title.trim(), description || '', JSON.stringify(attachments || []), req.user.name || req.user.id || '', t, t]
    );
    res.json({ success: true, id });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/** PUT /api/tasks/submissions/:id - 评分（教师 或 导师且课程开启导师参与）
 *  注意：必须定义在 PUT /:id 之前，否则会被 /:id 抢占
 *  评分同时写入 evaluation 表（session_number=0 表示任务评价），
 *  与课程评价合并取平均，按成绩配置占比计入平时成绩/最终成绩 */
router.put('/submissions/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: '未登录' });
    const { score } = req.body;
    if (score == null || Number(score) < 0 || Number(score) > 100) {
      return res.status(400).json({ success: false, message: '评分须在 0-100 之间' });
    }
    const [rows] = await pool.execute('SELECT task_id, student_id FROM course_task_submission WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: '提交记录不存在' });
    if (!(await canGradeTask(req.user, rows[0].task_id))) {
      return res.status(403).json({ success: false, message: '导师仅可在课程开启导师参与时评分' });
    }
    const [taskRows] = await pool.execute('SELECT course_id FROM course_task WHERE id = ?', [rows[0].task_id]);
    if (taskRows.length === 0) return res.status(404).json({ success: false, message: '任务不存在' });
    const t = now();
    await pool.execute(
      'UPDATE course_task_submission SET score = ?, graded_by = ?, status = ?, updated_at = ? WHERE id = ?',
      [Number(score), req.user.name || req.user.id || '', 'graded', t, req.params.id]
    );
    // 同步写入课程评价表：任务评分作为 teacher/mentor 类型评价（session=0），参与平时成绩计算
    const evalType = req.user.sub_role === 'mentor' ? 'mentor' : 'teacher';
    const evId = `ev-task-${rows[0].task_id}-${rows[0].student_id}-${evalType}`;
    await pool.execute(
      'REPLACE INTO evaluation (id, course_id, student_id, session_number, type, score, evaluator_id, evaluator_name, comment, created_at) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?)',
      [evId, taskRows[0].course_id, rows[0].student_id, evalType, Number(score),
       req.user.account || req.user.id || '', req.user.name || '', '任务评分', t]
    );
    res.json({ success: true, message: '评分成功' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/** PUT /api/tasks/:id - 更新任务（教师/领导，导师不可） */
router.put('/:id', requireManager, async (req, res) => {
  try {
    const { title, description, attachments } = req.body;
    const t = now();
    await pool.execute(
      'UPDATE course_task SET title = ?, description = ?, attachments = ?, updated_at = ? WHERE id = ?',
      [title?.trim() ?? '', description || '', JSON.stringify(attachments || []), t, req.params.id]
    );
    res.json({ success: true, message: '更新成功' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/** DELETE /api/tasks/:id - 删除任务（教师/领导，导师不可，级联删除提交记录与任务评价） */
router.delete('/:id', requireManager, async (req, res) => {
  try {
    await pool.execute('DELETE FROM course_task_submission WHERE task_id = ?', [req.params.id]);
    // 清理该任务的评价记录（id 前缀 ev-task-{taskId}-）
    await pool.execute("DELETE FROM evaluation WHERE id LIKE ?", [`ev-task-${req.params.id}-%`]);
    await pool.execute('DELETE FROM course_task WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/** GET /api/tasks/:id/submissions - 某任务全部提交（教师/导师评分用） */
router.get('/:id/submissions', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM course_task_submission WHERE task_id = ? ORDER BY created_at',
      [req.params.id]
    );
    const submissions = rows.map((r) => ({
      id: r.id,
      taskId: r.task_id,
      studentId: r.student_id,
      attachments: parseJson(r.attachments),
      score: r.score != null ? Number(r.score) : null,
      gradedBy: r.graded_by || '',
      status: r.status,
      createdAt: r.created_at || '',
    }));
    res.json({ success: true, submissions });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/** POST /api/tasks/:id/submissions - 学生提交/更新提交（登录用户） */
router.post('/:id/submissions', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: '未登录' });
    const { studentId, attachments } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId 必填' });
    const t = now();
    const [exist] = await pool.execute(
      'SELECT id FROM course_task_submission WHERE task_id = ? AND student_id = ?',
      [req.params.id, studentId]
    );
    if (exist.length > 0) {
      await pool.execute(
        'UPDATE course_task_submission SET attachments = ?, status = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(attachments || []), 'submitted', t, exist[0].id]
      );
      return res.json({ success: true, id: exist[0].id, message: '提交已更新' });
    }
    const id = `sub-${Date.now()}`;
    await pool.execute(
      'INSERT INTO course_task_submission (id, task_id, student_id, attachments, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.params.id, studentId, JSON.stringify(attachments || []), 'submitted', t, t]
    );
    res.json({ success: true, id, message: '提交成功' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
