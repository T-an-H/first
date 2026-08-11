-- ============================================================
-- 教师端测试数据（course_db）· 可重复执行版
-- 数据库：course_db（MySQL 8）· 执行前请确认已先执行 schema.sql
--
-- 说明：JSON 字段（member_ids / visible_to_class_names）
-- 以单引号包裹字符串，内部双引号为 JSON 标准写法，
-- 在 MySQL 单引号字符串中无需额外转义，Navicat 直接执行即可。
-- ============================================================

USE course_db;

-- ------------------------------------------------------------
-- 1. 选课记录 enrollment
-- ------------------------------------------------------------
TRUNCATE TABLE enrollment;
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-001', 'stu-1',  'course-1', 'sch-1', '2026-07-02', 60,  'in_progress'),
('enr-002', 'stu-2',  'course-1', 'sch-1', '2026-07-02', 100, 'completed'),
('enr-003', 'stu-3',  'course-1', 'sch-1', '2026-07-05', 30,  'enrolled'),
('enr-004', 'stu-4',  'course-1', 'sch-1', '2026-07-05', 80,  'in_progress'),
('enr-005', 'stu-5',  'course-1', 'sch-1', '2026-07-08', 10,  'enrolled'),
('enr-006', 'stu-6',  'course-2', 'sch-2', '2026-07-09', 45,  'in_progress'),
('enr-007', 'stu-7',  'course-2', 'sch-2', '2026-07-10', 0,   'dropped'),
('enr-008', 'stu-10', 'course-4', 'sch-4', '2026-07-12', 25,  'enrolled');

-- ------------------------------------------------------------
-- 2. 分组 student_group（member_ids 为 JSON 数组字符串）
-- ------------------------------------------------------------
TRUNCATE TABLE student_group;
INSERT INTO student_group (id, course_id, name, member_ids) VALUES
('grp-c1-a', 'course-1', '第1组',        '["stu-1","stu-2","stu-3"]'),
('grp-c1-b', 'course-1', '第2组',        '["stu-4","stu-5"]'),
('grp-c1-c', 'course-1', '第3组',        '["stu-6","stu-7"]'),
('grp-c2-a', 'course-2', 'Python基础组', '["stu-8","stu-9","stu-10"]'),
('grp-c4-a', 'course-4', 'TS进阶组',     '["stu-11","stu-12"]');

-- ------------------------------------------------------------
-- 3. 课程资源 course_file（visible_to_class_names 为 JSON 数组或 NULL）
-- ------------------------------------------------------------
TRUNCATE TABLE course_file;
INSERT INTO course_file (id, course_id, name, size, type, data_url, uploaded_at, uploaded_by, visibility_scope, visible_to_class_names) VALUES
('file-c1-1', 'course-1', 'React入门指南.pdf', 2048, 'application/pdf',
 'https://cdn.example.com/course-1/react-guide.pdf', '2026-07-03', 'teacher-wang', 'students', '["计算机2101班"]'),
('file-c1-2', 'course-1', '第1周课件.pptx', 5120,
 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
 'https://cdn.example.com/course-1/week1.pptx', '2026-07-06', 'teacher-wang', 'students', NULL),
('file-c1-3', 'course-1', '项目源码.zip', 10240, 'application/zip',
 'https://cdn.example.com/course-1/source.zip', '2026-07-10', 'teacher-wang', 'students', NULL),
('file-c2-1', 'course-2', 'Python环境配置.docx', 1024,
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'https://cdn.example.com/course-2/env-setup.docx', '2026-07-11', 'teacher-li', 'students', NULL),
('file-c2-2', 'course-2', 'Pandas速查表.pdf', 768, 'application/pdf',
 'https://cdn.example.com/course-2/pandas-cheatsheet.pdf', '2026-07-14', 'teacher-li', 'students', NULL);

-- ------------------------------------------------------------
-- 4. 成绩权重配置 grade_config
-- ------------------------------------------------------------
TRUNCATE TABLE grade_config;
INSERT INTO grade_config (course_id, regular_weight, midterm_weight, final_weight, self_eval_weight, peer_review_weight, inter_group_eval_weight, teacher_score_weight, mentor_score_weight, midterm_exam_weight, midterm_project_weight, final_exam_weight, final_project_weight, quality_eval_max_bonus) VALUES
('course-1', 30, 20, 50, 10, 20, 10, 30, 30, 50, 50, 50, 50, 10),
('course-2', 40, 0,  60, 10, 20, 10, 30, 30, 50, 50, 50, 50, 10),
('course-4', 20, 30, 50, 20, 20, 10, 30, 30, 50, 50, 50, 50, 10);

-- ------------------------------------------------------------
-- 5. 课程评价 evaluation
-- ------------------------------------------------------------
TRUNCATE TABLE evaluation;
INSERT INTO evaluation (id, course_id, student_id, session_number, type, score, evaluator_id, evaluator_name, comment) VALUES
('ev-001', 'course-1', 'stu-1', 1, 'self',         90.0, 'stu-1',        '张明',   '已完成项目基本功能，界面交互流畅'),
('ev-002', 'course-1', 'stu-2', 1, 'teacher',      85.0, 'teacher-wang', '王老师', '代码质量良好，建议加强单元测试'),
('ev-003', 'course-1', 'stu-3', 1, 'intra_group',  88.0, 'stu-1',        '张明',   '协作积极，文档完整'),
('ev-004', 'course-1', 'stu-1', 2, 'mentor',       92.0, 'mentor-zhang', '张导师', '项目落地能力强，答辩表现优秀'),
('ev-005', 'course-2', 'stu-8', 1, 'self',         75.0, 'stu-8',        '周杰',   '数据分析部分还需加强'),
('ev-006', 'course-2', 'stu-9', 1, 'inter_group',  82.0, 'stu-1',        '张明',   '成果展示清晰，数据图表美观');
