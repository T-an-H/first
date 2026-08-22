/**
 * 作业管理路由
 *
 * 教师端：
 *   POST   /api/homeworks/generate        — AI 出题
 *   GET    /api/homeworks/:courseId        — 查看课程所有作业
 *   GET    /api/homeworks/detail/:id       — 查看某个作业（含题目）
 *   PUT    /api/homeworks/:id/questions/:qid — 修改某道题
 *   POST   /api/homeworks/:id/publish      — 发布作业
 *   DELETE /api/homeworks/:id              — 删除作业
 *
 * 学生端：
 *   GET    /api/homeworks/student/:courseId   — 查看已发布的作业
 *   GET    /api/homeworks/student/view/:id    — 查看作业题目（作答用）
 *   POST   /api/homeworks/:id/submit          — 提交答案
 *   GET    /api/homeworks/:id/result/:studentId — 查看批改结果
 *
 * 章节管理：
 *   POST   /api/homeworks/chapter         — 新增章节
 *   GET    /api/homeworks/chapters/:courseId — 获取课程章节列表
 *   DELETE /api/homeworks/chapter/:id      — 删除章节
 */
import { Router } from 'express';
import pool from '../db.js';
import { generateQuestions, gradeSubmission } from '../deepseek.js';

const router = Router();
const HOMEWORK_TIERS = new Set(['basic', 'advanced', 'excellent']);
const HOMEWORK_GENERATE_MODES = new Set(['tiered', 'unified']);

function normalizeHomeworkTier(tier) {
  if (typeof tier !== 'string') return '';
  const normalizedTier = tier.trim().toLowerCase();
  return HOMEWORK_TIERS.has(normalizedTier) ? normalizedTier : '';
}

function normalizeGenerateMode(mode) {
  if (typeof mode !== 'string') return 'tiered';
  const normalizedMode = mode.trim().toLowerCase();
  return HOMEWORK_GENERATE_MODES.has(normalizedMode) ? normalizedMode : 'tiered';
}

// ==================== 章节管理 ====================

/** POST /api/homeworks/chapter — 新增章节 */
router.post('/chapter', async (req, res) => {
  try {
    const { courseId, title, orderIndex } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ success: false, message: '课程ID和章节名称为必填项' });
    }
    const id = `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const idx = orderIndex ?? 0;
    await pool.execute(
      'INSERT INTO chapters (id, course_id, title, order_index) VALUES (?, ?, ?, ?)',
      [id, courseId, title, idx]
    );
    res.json({ success: true, chapter: { id, courseId, title, orderIndex: idx } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** GET /api/homeworks/chapters/:courseId — 获取课程章节列表 */
router.get('/chapters/:courseId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, course_id, title, order_index, created_at FROM chapters WHERE course_id = ? ORDER BY order_index, created_at',
      [req.params.courseId]
    );
    const chapters = rows.map(r => ({
      id: r.id,
      courseId: r.course_id,
      title: r.title,
      orderIndex: r.order_index,
      createdAt: r.created_at,
    }));
    res.json({ success: true, chapters });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** DELETE /api/homeworks/chapter/:id — 删除章节 */
router.delete('/chapter/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM chapters WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

async function findOrCreateChapterByTitle(courseId, title) {
  const [rows] = await pool.execute(
    'SELECT id FROM chapters WHERE course_id = ? AND title = ? ORDER BY created_at LIMIT 1',
    [courseId, title]
  );
  if (rows.length > 0) return rows[0].id;

  const id = `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await pool.execute(
    'INSERT INTO chapters (id, course_id, title, order_index) VALUES (?, ?, ?, ?)',
    [id, courseId, title, 0]
  );
  return id;
}

// ==================== 教师端：作业管理 ====================

/** POST /api/homeworks/generate — AI 出题（支持分层3套 / 统一1套） */
router.post('/generate', async (req, res) => {
  try {
    const { courseId, chapterId, courseTitle, chapterTitle, requirement, teacherName } = req.body;
    const generateMode = normalizeGenerateMode(req.body.generateMode);

    if (!courseId || !requirement) {
      return res.status(400).json({ success: false, message: '课程ID和作业要求为必填项' });
    }

    const title = requirement.length > 50 ? requirement.slice(0, 50) + '...' : requirement;
    const groupId = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const tierConfigs = generateMode === 'unified'
      ? [{ tier: 'all', label: '统一题', promptTier: undefined }]
      : [
          { tier: 'basic', label: '基础层', promptTier: 'basic' },
          { tier: 'advanced', label: '进阶层', promptTier: 'advanced' },
          { tier: 'excellent', label: '卓越层', promptTier: 'excellent' },
        ];

    const result = { groupId, homeworks: [] };
    let effectiveChapterId = chapterId || null;
    if (!effectiveChapterId && chapterTitle && chapterTitle !== '全部章节') {
      effectiveChapterId = await findOrCreateChapterByTitle(courseId, chapterTitle.trim());
    }

    // 根据模式出题：分层三套 or 统一一套
    for (const { tier, label, promptTier } of tierConfigs) {
      const questions = await generateQuestions({
        courseTitle: courseTitle || '未知课程',
        chapterTitle: chapterTitle || '全部章节',
        requirement,
        tier: promptTier,
      });

      if (!questions || questions.length === 0) {
        return res.status(500).json({ success: false, message: `${label} AI 出题失败，请重试` });
      }

      const homeworkId = `hw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${tier}`;
      const homeworkTitle = generateMode === 'unified' ? `${title}【统一题】` : `${title}【${label}】`;

      await pool.execute(
        'INSERT INTO homeworks (id, course_id, chapter_id, title, description, status, created_by, tier, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [homeworkId, courseId, effectiveChapterId, homeworkTitle, requirement, 'draft', teacherName || 'teacher', tier, groupId]
      );

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qId = `hq-${homeworkId}-${i}`;
        await pool.execute(
          'INSERT INTO homework_questions (id, homework_id, question_type, question_text, options, answer, score, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [qId, homeworkId, q.question_type, q.question_text,
            q.options ? JSON.stringify(q.options) : null,
            String(q.answer), q.score || 10, i]
        );
        q.id = qId;
      }

      result.homeworks.push({ id: homeworkId, tier, title: homeworkTitle, status: 'draft', questions });
    }

    res.json({ success: true, groupId, homeworks: result.homeworks });
  } catch (e) {
    console.error('AI 出题失败:', e);
    res.status(500).json({ success: false, message: `AI 出题失败: ${e.message}` });
  }
});

/** GET /api/homeworks/detail/:id — 查看作业详情（含题目） */
router.get('/detail/:id', async (req, res) => {
  try {
    const [hrows] = await pool.execute(
      `SELECT h.*, c.title as chapter_title
       FROM homeworks h
       LEFT JOIN chapters c ON h.chapter_id = c.id
       WHERE h.id = ?`,
      [req.params.id]
    );
    if (hrows.length === 0) {
      return res.status(404).json({ success: false, message: '作业不存在' });
    }

    const [qrows] = await pool.execute(
      'SELECT * FROM homework_questions WHERE homework_id = ? ORDER BY order_index',
      [req.params.id]
    );

    const h = hrows[0];
    const questions = qrows.map(q => ({
      id: q.id,
      questionType: q.question_type,
      questionText: q.question_text,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
      answer: q.answer,
      score: q.score,
      orderIndex: q.order_index,
    }));

    res.json({
      success: true,
      homework: {
        id: h.id,
        courseId: h.course_id,
        chapterId: h.chapter_id,
        chapterTitle: h.chapter_title,
        title: h.title,
        description: h.description,
        status: h.status,
        createdBy: h.created_by,
        publishedAt: h.published_at,
        createdAt: h.created_at,
        questions,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** GET /api/homeworks/:courseId — 获取课程所有作业 */
router.get('/:courseId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT h.*, c.title as chapter_title
       FROM homeworks h
       LEFT JOIN chapters c ON h.chapter_id = c.id
       WHERE h.course_id = ?
       ORDER BY h.created_at DESC`,
      [req.params.courseId]
    );

    const homeworks = rows.map(r => ({
      id: r.id,
      courseId: r.course_id,
      chapterId: r.chapter_id,
      chapterTitle: r.chapter_title,
      title: r.title,
      description: r.description,
      status: r.status,
      tier: r.tier || 'all',
      groupId: r.group_id,
      createdBy: r.created_by,
      publishedAt: r.published_at,
      createdAt: r.created_at,
    }));

    res.json({ success: true, homeworks });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** PUT /api/homeworks/:id/questions/:qid — 修改某道题 */
router.put('/:id/questions/:qid', async (req, res) => {
  try {
    const { questionText, options, answer, score } = req.body;
    const sets = [];
    const params = [];

    if (questionText !== undefined) { sets.push('question_text = ?'); params.push(questionText); }
    if (options !== undefined) { sets.push('options = ?'); params.push(JSON.stringify(options)); }
    if (answer !== undefined) { sets.push('answer = ?'); params.push(String(answer)); }
    if (score !== undefined) { sets.push('score = ?'); params.push(score); }

    if (sets.length === 0) {
      return res.json({ success: true, message: '无需修改' });
    }

    params.push(req.params.qid);
    await pool.execute(
      `UPDATE homework_questions SET ${sets.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: '更新成功' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** POST /api/homeworks/:id/publish — 发布作业（支持按 group_id 一键发布3套） */
router.post('/:id/publish', async (req, res) => {
  try {
    const { publishAll } = req.body; // publishAll=true 时发布同组所有作业

    if (publishAll) {
      // 查出这个作业的 group_id
      const [hw] = await pool.execute('SELECT group_id FROM homeworks WHERE id = ?', [req.params.id]);
      if (hw.length > 0 && hw[0].group_id) {
        await pool.execute(
          "UPDATE homeworks SET status = 'published', published_at = NOW() WHERE group_id = ?",
          [hw[0].group_id]
        );
        return res.json({ success: true, message: '3套作业已全部发布' });
      }
    }

    await pool.execute(
      "UPDATE homeworks SET status = 'published', published_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: '发布成功' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** DELETE /api/homeworks/:id — 删除作业 */
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM homeworks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==================== 学生端：作业作答 ====================

/** GET /api/homeworks/student/:courseId — 学生查看已发布的作业列表（按层级过滤） */
router.get('/student/:courseId', async (req, res) => {
  try {
    const { studentId, tier: tierFromQuery } = req.query;
    let effectiveTier = '';
    if (studentId) {
      const [tierRows] = await pool.execute(
        'SELECT tier FROM tier_test_results WHERE course_id = ? AND student_id = ? LIMIT 1',
        [req.params.courseId, studentId]
      );
      if (tierRows.length > 0) {
        effectiveTier = normalizeHomeworkTier(tierRows[0].tier);
      }
    }

    if (!effectiveTier) {
      effectiveTier = studentId ? 'basic' : normalizeHomeworkTier(tierFromQuery);
    }
    // tier 由前端传入（从 MySQL 分层结果获取）

    // 查已发布作业：tier='all' 全部学生可见；tier匹配的层级可见
    let whereClause = `h.course_id = ? AND h.status = 'published'`;
    const params = [req.params.courseId];

    if (effectiveTier) {
      whereClause += ` AND (COALESCE(h.tier, 'all') = 'all' OR h.tier = ?)`;
      params.push(effectiveTier);
    } else {
      whereClause += ` AND COALESCE(h.tier, 'all') = 'all'`;
    }

    const [rows] = await pool.execute(
      `SELECT h.*, c.title as chapter_title
       FROM homeworks h
       LEFT JOIN chapters c ON h.chapter_id = c.id
       WHERE ${whereClause}
       ORDER BY h.published_at DESC`,
      params
    );

    // 查询该学生是否已提交
    const homeworks = [];
    for (const r of rows) {
      const [subs] = await pool.execute(
        `SELECT id, status, total_score, submitted_at
         FROM homework_submissions
         WHERE homework_id = ? AND student_id = ?
         ORDER BY (status = 'graded') DESC, submitted_at DESC
         LIMIT 1`,
        [r.id, studentId || '']
      );

      homeworks.push({
        id: r.id,
        chapterTitle: r.chapter_title,
        title: r.title,
        description: r.description,
        publishedAt: r.published_at,
        submission: subs.length > 0 ? {
          id: subs[0].id,
          status: subs[0].status,
          totalScore: subs[0].total_score,
          submittedAt: subs[0].submitted_at,
        } : null,
      });
    }

    res.json({ success: true, homeworks });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** GET /api/homeworks/student/view/:id — 学生查看作业题目（不含答案） */
router.get('/student/view/:id', async (req, res) => {
  try {
    const [hrows] = await pool.execute(
      `SELECT h.*, c.title as chapter_title
       FROM homeworks h
       LEFT JOIN chapters c ON h.chapter_id = c.id
       WHERE h.id = ? AND h.status = 'published'`,
      [req.params.id]
    );
    if (hrows.length === 0) {
      return res.status(404).json({ success: false, message: '作业不存在或未发布' });
    }

    const [qrows] = await pool.execute(
      'SELECT id, question_type, question_text, options, score, order_index FROM homework_questions WHERE homework_id = ? ORDER BY order_index',
      [req.params.id]
    );

    const questions = qrows.map(q => ({
      id: q.id,
      questionType: q.question_type,
      questionText: q.question_text,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
      score: q.score,
      orderIndex: q.order_index,
      // 不返回 answer 字段，防止学生看到答案
    }));

    const h = hrows[0];
    res.json({
      success: true,
      homework: {
        id: h.id,
        chapterTitle: h.chapter_title,
        title: h.title,
        description: h.description,
        questions,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** POST /api/homeworks/:id/submit — 提交作业答案 */
router.post('/:id/submit', async (req, res) => {
  try {
    const { studentId, answers } = req.body;
    if (!studentId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: '学生ID和答案列表为必填项' });
    }

    // 1. 检查是否已经提交过
    const [existing] = await pool.execute(
      `SELECT id, status
       FROM homework_submissions
       WHERE homework_id = ? AND student_id = ?
       ORDER BY (status = 'graded') DESC, submitted_at DESC`,
      [req.params.id, studentId]
    );
    if (existing.some(item => item.status === 'graded')) {
      return res.status(400).json({ success: false, message: '该作业已批改完成，不能重复提交' });
    }

    if (existing.length > 0) {
      const staleSubmissionIds = existing.map(item => item.id);
      await pool.execute(
        `DELETE FROM homework_submissions WHERE id IN (${staleSubmissionIds.map(() => '?').join(', ')})`,
        staleSubmissionIds
      );
    }

    // 2. 获取作业题目（含答案，用于批改）
    const [qrows] = await pool.execute(
      'SELECT * FROM homework_questions WHERE homework_id = ? ORDER BY order_index',
      [req.params.id]
    );
    if (qrows.length === 0) {
      return res.status(400).json({ success: false, message: '该作业暂无题目，无法提交' });
    }

    // 3. 创建提交记录
    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await pool.execute(
      "INSERT INTO homework_submissions (id, homework_id, student_id, status) VALUES (?, ?, ?, 'grading')",
      [submissionId, req.params.id, studentId]
    );

    // 4. 保存原始答案
    for (const a of answers) {
      const aid = `ans-${submissionId}-${a.questionId}`;
      await pool.execute(
        'INSERT INTO homework_answers (id, submission_id, question_id, answer_text) VALUES (?, ?, ?, ?)',
        [aid, submissionId, a.questionId, a.answerText || '']
      );
    }

    // 5. 调用 AI 批改
    try {
      const gradingResults = await gradeSubmission({
        questions: qrows,
        answers,
      });

      // 6. 更新批改结果
      let totalScore = 0;
      for (let i = 0; i < qrows.length; i++) {
        const q = qrows[i];
        const result = gradingResults[i] || { is_correct: false, score: 0, feedback: '批改异常' };

        const aid = `ans-${submissionId}-${q.id}`;
        await pool.execute(
          'UPDATE homework_answers SET is_correct = ?, score = ?, ai_feedback = ? WHERE id = ?',
          [result.is_correct ? 1 : 0, result.score || 0, result.feedback || '', aid]
        );

        totalScore += Number(result.score || 0);
      }

      // 7. 更新提交记录状态
      await pool.execute(
        "UPDATE homework_submissions SET status = 'graded', total_score = ? WHERE id = ?",
        [totalScore, submissionId]
      );

      res.json({
        success: true,
        submission: {
          id: submissionId,
          status: 'graded',
          totalScore,
        },
      });
    } catch (aiError) {
      // AI 批改失败，标记为 submitted 等待重试
      console.error('AI 批改失败:', aiError);
      await pool.execute(
        "UPDATE homework_submissions SET status = 'submitted' WHERE id = ?",
        [submissionId]
      );
      res.status(500).json({
        success: false,
        message: `AI 批改失败: ${aiError.message}，请稍后重试`,
      });
    }
  } catch (e) {
    console.error('提交作业失败:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/** GET /api/homeworks/:id/result/:studentId — 查看批改结果 */
router.get('/:id/result/:studentId', async (req, res) => {
  try {
    const [subs] = await pool.execute(
      `SELECT *
       FROM homework_submissions
       WHERE homework_id = ? AND student_id = ?
       ORDER BY (status = 'graded') DESC, submitted_at DESC
       LIMIT 1`,
      [req.params.id, req.params.studentId]
    );
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: '未找到提交记录' });
    }

    const sub = subs[0];

    // 获取题目
    const [qrows] = await pool.execute(
      'SELECT * FROM homework_questions WHERE homework_id = ? ORDER BY order_index',
      [req.params.id]
    );

    // 获取学生答案
    const [arows] = await pool.execute(
      'SELECT * FROM homework_answers WHERE submission_id = ?',
      [sub.id]
    );

    const answerMap = {};
    for (const a of arows) {
      answerMap[a.question_id] = a;
    }

    const questions = qrows.map(q => ({
      id: q.id,
      questionType: q.question_type,
      questionText: q.question_text,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
      answer: q.answer,
      score: q.score,
      studentAnswer: answerMap[q.id]?.answer_text || '',
      isCorrect: answerMap[q.id]?.is_correct === 1,
      studentScore: answerMap[q.id]?.score || 0,
      aiFeedback: answerMap[q.id]?.ai_feedback || '',
    }));

    const maxScore = qrows.reduce((sum, q) => sum + q.score, 0);

    res.json({
      success: true,
      result: {
        submissionId: sub.id,
        status: sub.status,
        totalScore: sub.total_score,
        maxScore,
        submittedAt: sub.submitted_at,
        questions,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
