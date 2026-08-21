-- ============================================================
-- 教师端后端种子数据 v6：6~10 号表 各 10 条
-- 表: course / student / schedule / grade / exam_score
-- 数据库: course_db (MySQL 8)
-- 幂等：每表 TRUNCATE 后重新插入，可重复执行
-- 执行方式: 在 Navicat/Workbench 打开整段执行，或 mysql -uroot -p070808 < seed_v6.sql
-- ============================================================

USE course_db;

-- ------------------------------------------------------------
-- 6. course 课程（10 条）
-- ------------------------------------------------------------
TRUNCATE TABLE course;
INSERT INTO course (id, title, description, category_id, department_id, cover, start_date, end_date, credits, duration, status, teacher, mentor) VALUES
('course-1', 'React前端开发实战', '组件化开发、Hooks、Redux 状态管理，配套项目实训。', 'cat-1', 'dep-1', '', '2026-03-02', '2026-06-30', 3, 48, 'active', 'teacher-wang', 'mentor-zhang'),
('course-2', 'Vue3组件化开发', 'Composition API、组件通信、工程化实践。', 'cat-1', 'dep-1', '', '2026-03-02', '2026-06-30', 3, 48, 'active', 'teacher-wang', 'mentor-zhang'),
('course-3', 'Python数据分析', 'pandas 数据处理、matplotlib 可视化、期末项目。', 'cat-2', 'dep-2', '', '2026-03-02', '2026-06-30', 3, 48, 'active', 'teacher-li', ''),
('course-4', 'Java企业级应用', 'Spring Boot、MyBatis、微服务基础。', 'cat-2', 'dep-2', '', '2026-03-02', '2026-06-30', 4, 64, 'active', 'teacher-li', 'mentor-zhang'),
('course-5', '数据结构与算法', '线性表、树、图、排序与查找算法。', 'cat-3', 'dep-3', '', '2026-03-02', '2026-06-30', 4, 64, 'active', 'teacher-wang', ''),
('course-6', '前端工程化', 'Webpack、Vite、CI/CD 与代码规范。', 'cat-1', 'dep-1', '', '2026-03-02', '2026-06-30', 2, 32, 'active', 'teacher-wang', ''),
('course-7', 'TypeScript进阶', '泛型、装饰器、类型体操与工程实践。', 'cat-1', 'dep-1', '', '2026-03-02', '2026-06-30', 2, 32, 'draft', 'teacher-li', ''),
('course-8', '移动端开发', 'React Native 跨端开发与发布。', 'cat-1', 'dep-1', '', '2026-09-01', '2026-12-31', 3, 48, 'inactive', 'teacher-wang', ''),
('course-9', '微服务架构', 'Spring Cloud、服务注册、网关与容错。', 'cat-2', 'dep-2', '', '2026-09-01', '2026-12-31', 4, 64, 'inactive', 'teacher-li', 'mentor-zhang'),
('course-10', '数据库原理与应用', 'SQL、索引、事务与 MySQL 实战。', 'cat-3', 'dep-3', '', '2026-09-01', '2026-12-31', 3, 48, 'inactive', 'teacher-wang', '');

-- ------------------------------------------------------------
-- 7. student 学生（10 条）
-- ------------------------------------------------------------
TRUNCATE TABLE student;
INSERT INTO student (id, name, student_id, class_name, phone, email, avatar, join_date, status, enrollment_score) VALUES
('stu-1', '张明', 'S2024001', '软件2401', '13800000001', 'zhangming@example.com', '', '2024-09-01', 'active', 520),
('stu-2', '李傲天', '202511053250', '软件2401', '13800000002', 'liaotian@example.com', '', '2024-09-01', 'active', 510),
('stu-3', '王芳', 'S2024003', '软件2401', '13800000003', 'wangfang@example.com', '', '2024-09-01', 'active', 535),
('stu-4', '刘洋', 'S2024004', '软件2402', '13800000004', 'liuyang@example.com', '', '2024-09-01', 'active', 498),
('stu-5', '陈静', 'S2024005', '软件2402', '13800000005', 'chenjing@example.com', '', '2024-09-01', 'active', 505),
('stu-6', '赵磊', 'S2024006', '软件2402', '13800000006', 'zhaolei@example.com', '', '2024-09-01', 'active', 528),
('stu-7', '孙悦', 'S2024007', '大数据2401', '13800000007', 'sunyue@example.com', '', '2024-09-01', 'active', 542),
('stu-8', '周杰', 'S2024008', '大数据2401', '13800000008', 'zhoujie@example.com', '', '2024-09-01', 'active', 515),
('stu-9', '吴婷', 'S2024009', '大数据2402', '13800000009', 'wuting@example.com', '', '2024-09-01', 'active', 488),
('stu-10', '郑浩', 'S2024010', '大数据2402', '13800000010', 'zhenghao@example.com', '', '2024-09-01', 'inactive', 496);

-- ------------------------------------------------------------
-- 8. schedule 排课（10 条）
-- ------------------------------------------------------------
TRUNCATE TABLE schedule;
INSERT INTO schedule (id, course_id, title, day, class_name, start_date, end_date, time_slot, room, teacher, mentor) VALUES
('sch-1', 'course-1', 'React组件基础', '周一', '软件2401', '2026-03-02', '2026-06-30', '8:00-9:40', 'A101', 'teacher-wang', 'mentor-zhang'),
('sch-2', 'course-1', 'React状态管理', '周三', '软件2401', '2026-03-02', '2026-06-30', '10:00-11:40', 'A101', 'teacher-wang', 'mentor-zhang'),
('sch-3', 'course-2', 'Vue基础', '周二', '软件2402', '2026-03-02', '2026-06-30', '8:00-9:40', 'A102', 'teacher-wang', 'mentor-zhang'),
('sch-4', 'course-3', 'pandas实战', '周四', '大数据2401', '2026-03-02', '2026-06-30', '14:00-15:40', 'B201', 'teacher-li', ''),
('sch-5', 'course-3', '数据可视化', '周五', '大数据2401', '2026-03-02', '2026-06-30', '10:00-11:40', 'B201', 'teacher-li', ''),
('sch-6', 'course-4', 'Spring Boot入门', '周三', '大数据2402', '2026-03-02', '2026-06-30', '14:00-15:40', 'B203', 'teacher-li', 'mentor-zhang'),
('sch-7', 'course-5', '线性表与栈', '周一', '软件2402', '2026-03-02', '2026-06-30', '16:00-17:40', 'C301', 'teacher-wang', ''),
('sch-8', 'course-5', '树与图', '周四', '软件2402', '2026-03-02', '2026-06-30', '8:00-9:40', 'C301', 'teacher-wang', ''),
('sch-9', 'course-6', 'Vite工程化', '周二', '软件2401', '2026-03-02', '2026-06-30', '14:00-15:40', 'A103', 'teacher-wang', ''),
('sch-10', 'course-7', '泛型与类型体操', '周五', '大数据2402', '2026-03-02', '2026-06-30', '16:00-17:40', 'B204', 'teacher-li', '');

-- ------------------------------------------------------------
-- 9. grade 综合成绩（10 条）
-- ------------------------------------------------------------
TRUNCATE TABLE grade;
INSERT INTO grade (id, student_id, course_id, score, semester, comment, total_score, graded_at) VALUES
('grd-1', 'stu-1', 'course-1', 91.5, '2025-2026-2', '表现优秀，项目完成度高', 92.0, '2026-06-30 10:00:00'),
('grd-2', 'stu-2', 'course-1', 88.0, '2025-2026-2', '成绩良好', 87.5, '2026-06-30 10:00:00'),
('grd-3', 'stu-3', 'course-1', 76.5, '2025-2026-2', '中等，需加强实践', 75.0, '2026-06-30 10:00:00'),
('grd-4', 'stu-4', 'course-2', 82.0, '2025-2026-2', '良好', 83.0, '2026-06-30 10:00:00'),
('grd-5', 'stu-5', 'course-2', 67.5, '2025-2026-2', '基础薄弱，建议补课', 65.0, '2026-06-30 10:00:00'),
('grd-6', 'stu-6', 'course-3', 94.0, '2025-2026-2', '数据分析能力突出', 95.0, '2026-06-30 10:00:00'),
('grd-7', 'stu-7', 'course-3', 85.5, '2025-2026-2', '表现优秀', 86.0, '2026-06-30 10:00:00'),
('grd-8', 'stu-8', 'course-4', 79.0, '2025-2026-2', '中等偏上', 80.0, '2026-06-30 10:00:00'),
('grd-9', 'stu-9', 'course-5', 72.5, '2025-2026-2', '算法基础一般', 70.0, '2026-06-30 10:00:00'),
('grd-10', 'stu-10', 'course-5', 90.0, '2025-2026-2', '算法理解深刻', 91.0, '2026-06-30 10:00:00');

-- ------------------------------------------------------------
-- 10. exam_score 考试/项目成绩（10 条）
-- ------------------------------------------------------------
TRUNCATE TABLE exam_score;
INSERT INTO exam_score (id, course_id, student_id, exam_name, score, full_score, weight, type, status, graded_at) VALUES
('es-1', 'course-1', 'stu-1', '期中考试', 90.0, 100, 50, 'midterm_exam', 'submitted', '2026-04-30 10:00:00'),
('es-2', 'course-1', 'stu-2', '期中考试', 85.0, 100, 50, 'midterm_exam', 'submitted', '2026-04-30 10:00:00'),
('es-3', 'course-1', 'stu-1', '期末项目', 95.0, 100, 50, 'final_project', 'submitted', '2026-06-25 10:00:00'),
('es-4', 'course-1', 'stu-3', '期末考试', 78.0, 100, 50, 'final_exam', 'submitted', '2026-06-26 10:00:00'),
('es-5', 'course-2', 'stu-4', '期中项目', 88.0, 100, 50, 'midterm_project', 'submitted', '2026-05-15 10:00:00'),
('es-6', 'course-3', 'stu-6', '期末项目', 96.0, 100, 50, 'final_project', 'submitted', '2026-06-27 10:00:00'),
('es-7', 'course-3', 'stu-7', '期中考试', 82.0, 100, 50, 'midterm_exam', 'submitted', '2026-04-28 10:00:00'),
('es-8', 'course-4', 'stu-8', '平时测验1', 75.0, 100, 30, 'quiz', 'submitted', '2026-03-20 10:00:00'),
('es-9', 'course-5', 'stu-9', '期末项目', 70.0, 100, 50, 'final_project', 'submitted', '2026-06-28 10:00:00'),
('es-10', 'course-5', 'stu-10', '期中考试', 92.0, 100, 50, 'midterm_exam', 'submitted', '2026-04-29 10:00:00');
