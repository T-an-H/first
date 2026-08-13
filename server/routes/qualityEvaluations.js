import { Router } from 'express';
import pool from '../db.js';

const router = Router();

function formatDateValue(value) {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function parseFiles(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || value.trim() === '') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapSubmissionRow(row) {
  return {
    id: String(row.submission_id),
    description: row.description || undefined,
    files: parseFiles(row.files),
    submittedAt: formatDateValue(row.submitted_at) || '',
    score: row.score == null ? undefined : Number(row.score),
    teacherComment: row.teacher_comment || undefined,
    gradedAt: formatDateValue(row.graded_at),
  };
}

function mapEvaluationRows(rows) {
  const evaluations = new Map();

  for (const row of rows) {
    const evaluationId = String(row.evaluation_id);
    let evaluation = evaluations.get(evaluationId);
    if (!evaluation) {
      evaluation = {
        id: evaluationId,
        courseId: String(row.course_id),
        studentId: String(row.student_id),
        submissions: [],
      };
      evaluations.set(evaluationId, evaluation);
    }

    if (row.submission_id != null) {
      evaluation.submissions.push(mapSubmissionRow(row));
    }
  }

  return [...evaluations.values()];
}

async function getEvaluationRows(connection, courseId, studentId) {
  const params = [courseId];
  let studentFilter = '';
  if (studentId) {
    studentFilter = ' AND evaluation.student_id = ?';
    params.push(studentId);
  }

  const [rows] = await connection.execute(
    `SELECT
       evaluation.id AS evaluation_id,
       evaluation.course_id,
       evaluation.student_id,
       submission.id AS submission_id,
       submission.description,
       submission.files,
       submission.submitted_at,
       submission.score,
       submission.teacher_comment,
       submission.graded_at
     FROM quality_evaluations AS evaluation
     LEFT JOIN quality_eval_submissions AS submission
       ON submission.evaluation_id = evaluation.id
     WHERE evaluation.course_id = ?${studentFilter}
     ORDER BY evaluation.student_id, submission.submitted_at, submission.id`,
    params
  );

  return rows;
}

router.get('/course/:courseId', async (req, res) => {
  try {
    const rows = await getEvaluationRows(pool, req.params.courseId);
    res.json({
      success: true,
      evaluations: mapEvaluationRows(rows),
    });
  } catch (error) {
    console.error('获取素质评价失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/student/:courseId/:studentId', async (req, res) => {
  try {
    const rows = await getEvaluationRows(pool, req.params.courseId, req.params.studentId);
    res.json({
      success: true,
      evaluation: mapEvaluationRows(rows)[0] || null,
    });
  } catch (error) {
    console.error('获取学生素质评价失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/submit', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const courseId = String(req.body?.courseId || '').trim();
    const studentId = String(req.body?.studentId || '').trim();
    const description = typeof req.body?.description === 'string'
      ? req.body.description.trim()
      : '';
    const files = Array.isArray(req.body?.files) ? req.body.files : [];

    if (!courseId || !studentId) {
      return res.status(400).json({
        success: false,
        message: '课程和学生信息不能为空',
      });
    }
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请至少上传一份文件',
      });
    }

    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `SELECT id
       FROM quality_evaluations
       WHERE course_id = ? AND student_id = ?
       FOR UPDATE`,
      [courseId, studentId]
    );

    let evaluationId = existingRows[0]?.id;
    if (!evaluationId) {
      evaluationId = `qe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await connection.execute(
        `INSERT INTO quality_evaluations (id, course_id, student_id)
         VALUES (?, ?, ?)`,
        [evaluationId, courseId, studentId]
      );
    }

    const submissionId = `qes-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await connection.execute(
      `INSERT INTO quality_eval_submissions
        (id, evaluation_id, course_id, student_id, description, files, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        submissionId,
        evaluationId,
        courseId,
        studentId,
        description || null,
        JSON.stringify(files),
      ]
    );

    await connection.commit();

    const rows = await getEvaluationRows(connection, courseId, studentId);
    res.status(201).json({
      success: true,
      evaluation: mapEvaluationRows(rows)[0] || null,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // no-op
    }
    console.error('提交素质评价失败:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

router.put('/:evaluationId/submissions/:submissionId/score', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const score = Number(req.body?.score);
    const comment = typeof req.body?.teacherComment === 'string'
      ? req.body.teacherComment.trim()
      : '';

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: '分数必须在 0-100 之间',
      });
    }

    const [updated] = await connection.execute(
      `UPDATE quality_eval_submissions
       SET score = ?, teacher_comment = ?, graded_at = NOW()
       WHERE id = ? AND evaluation_id = ? AND score IS NULL`,
      [score, comment || null, req.params.submissionId, req.params.evaluationId]
    );

    if (updated.affectedRows === 0) {
      const [existing] = await connection.execute(
        `SELECT score
         FROM quality_eval_submissions
         WHERE id = ? AND evaluation_id = ?
         LIMIT 1`,
        [req.params.submissionId, req.params.evaluationId]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: '素质评价提交记录不存在',
        });
      }

      return res.status(409).json({
        success: false,
        message: '该次提交已经批改，不能重复修改',
      });
    }

    const [evaluationRows] = await connection.execute(
      `SELECT course_id
       FROM quality_evaluations
       WHERE id = ?
       LIMIT 1`,
      [req.params.evaluationId]
    );
    if (evaluationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '素质评价记录不存在',
      });
    }

    const rows = await getEvaluationRows(
      connection,
      evaluationRows[0].course_id,
      undefined
    );
    const evaluation = mapEvaluationRows(rows).find(
      (item) => item.id === req.params.evaluationId
    );

    res.json({
      success: true,
      evaluation: evaluation || null,
    });
  } catch (error) {
    console.error('保存素质评价评分失败:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

export default router;
