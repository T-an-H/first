import { Router } from 'express';
import pool from '../db.js';
import {
  countDepartmentRelations,
  ensureDepartment,
  getDepartmentById,
  handleRouteError,
  httpError,
  mapDepartmentRow,
  normalizeColor,
  normalizeText,
  pickColor,
} from '../lib/admin.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         dept.id,
         dept.name,
         dept.color,
         dept.created_at,
         (SELECT COUNT(*) FROM categories WHERE department_id = dept.id) AS category_count,
         (SELECT COUNT(*) FROM courses WHERE department_id = dept.id) AS course_count,
         (SELECT COUNT(*) FROM classes WHERE department_id = dept.id) AS class_count,
         (
           SELECT COUNT(*)
           FROM students AS stu
           JOIN classes AS cls ON cls.id = stu.class_id
           WHERE cls.department_id = dept.id
         ) AS student_count,
         (SELECT COUNT(*) FROM teachers WHERE department_id = dept.id) AS teacher_count
       FROM departments AS dept
       ORDER BY dept.name`
    );

    res.json({
      success: true,
      departments: rows.map(mapDepartmentRow),
    });
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const name = normalizeText(req.body?.name);
    if (!name) {
      throw httpError(400, '学院名称不能为空', 'DEPARTMENT_NAME_REQUIRED');
    }

    const existing = await ensureDepartment(connection, {
      departmentName: name,
      createIfMissing: false,
    }).catch((error) => {
      if (error?.code === 'DEPARTMENT_NOT_FOUND') return null;
      throw error;
    });

    if (existing) {
      throw httpError(409, '学院名称已存在', 'DEPARTMENT_EXISTS');
    }

    const color = normalizeColor(req.body?.color, pickColor(name));
    const [result] = await connection.query(
      'INSERT INTO departments (name, color) VALUES (?, ?)',
      [name, color]
    );

    const department = await getDepartmentById(connection, result.insertId);
    res.status(201).json({
      success: true,
      department: mapDepartmentRow({
        ...department,
        category_count: 0,
        course_count: 0,
        class_count: 0,
        student_count: 0,
        teacher_count: 0,
      }),
    });
  } catch (error) {
    handleRouteError(res, error);
  } finally {
    connection.release();
  }
});

router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const department = await getDepartmentById(connection, req.params.id);
    if (!department) {
      throw httpError(404, '学院不存在', 'DEPARTMENT_NOT_FOUND');
    }

    const name = normalizeText(req.body?.name) || department.name;
    const color = normalizeColor(req.body?.color, department.color || pickColor(name));

    const [duplicateRows] = await connection.query(
      'SELECT id FROM departments WHERE name = ? AND id <> ? LIMIT 1',
      [name, req.params.id]
    );
    if (duplicateRows.length > 0) {
      throw httpError(409, '学院名称已存在', 'DEPARTMENT_EXISTS');
    }

    await connection.query(
      'UPDATE departments SET name = ?, color = ? WHERE id = ?',
      [name, color, req.params.id]
    );

    await connection.query(
      'UPDATE courses SET department = ? WHERE department_id = ?',
      [name, req.params.id]
    );
    await connection.query(
      `UPDATE students
       SET department = ?
       WHERE class_id IN (SELECT id FROM classes WHERE department_id = ?)`,
      [name, req.params.id]
    );

    const updated = await getDepartmentById(connection, req.params.id);
    const counts = await countDepartmentRelations(connection, req.params.id);

    res.json({
      success: true,
      department: mapDepartmentRow({
        ...updated,
        category_count: counts.categoryCount,
        course_count: counts.courseCount,
        class_count: counts.classCount,
        student_count: counts.studentCount,
        teacher_count: counts.teacherCount,
      }),
    });
  } catch (error) {
    handleRouteError(res, error);
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const department = await getDepartmentById(connection, req.params.id);
    if (!department) {
      throw httpError(404, '学院不存在', 'DEPARTMENT_NOT_FOUND');
    }

    const counts = await countDepartmentRelations(connection, req.params.id);
    const total =
      counts.categoryCount +
      counts.courseCount +
      counts.classCount +
      counts.studentCount +
      counts.teacherCount;
    if (total > 0) {
      throw httpError(
        409,
        '该学院下还有课程分类、课程、班级、学生或教师数据，不能直接删除',
        'DEPARTMENT_HAS_DATA'
      );
    }

    await connection.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    handleRouteError(res, error);
  } finally {
    connection.release();
  }
});

export default router;
