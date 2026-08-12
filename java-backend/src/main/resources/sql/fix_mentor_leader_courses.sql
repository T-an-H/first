-- ============================================================
-- 修正：导师端/领导端课程数据对齐
-- 数据库: course_db (MySQL 8)
-- 1. course.mentor 按 mentor 表主导师对齐（每门课唯一主导师）
-- 2. leader 管辖分类调整，保证授课/导师课程在管辖内
-- 幂等：可重复执行
-- ============================================================
USE course_db;

-- ------------------------------------------------------------
-- 1. 导师端：course.mentor 对齐 mentor 表
-- ------------------------------------------------------------
UPDATE course SET mentor = 'mentor-zhang' WHERE id = 'course-1';
UPDATE course SET mentor = 'mentor-zhou'  WHERE id = 'course-2';
UPDATE course SET mentor = 'mentor-chen'  WHERE id = 'course-3';
UPDATE course SET mentor = 'mentor-li'    WHERE id = 'course-4';
UPDATE course SET mentor = 'mentor-zhang' WHERE id = 'course-5';
UPDATE course SET mentor = 'mentor-li'    WHERE id = 'course-6';
UPDATE course SET mentor = 'mentor-wu'    WHERE id = 'course-7';
UPDATE course SET mentor = 'mentor-sun'   WHERE id = 'course-8';
UPDATE course SET mentor = 'mentor-wang'  WHERE id = 'course-9';
UPDATE course SET mentor = 'mentor-chen'  WHERE id = 'course-10';

-- ------------------------------------------------------------
-- 2. 领导端：管辖分类调整（附加身份课程收进管辖）
-- ------------------------------------------------------------
UPDATE leader SET category_ids = '["cat-3"]'           WHERE id = 'l-4' AND name = '周院长';
UPDATE leader SET category_ids = '["cat-2","cat-3"]'   WHERE id = 'l-5' AND name = '吴院长';
UPDATE leader SET category_ids = '["cat-1","cat-2"]'   WHERE id = 'l-6' AND name = '郑院长';
UPDATE leader SET category_ids = '["cat-1","cat-2","cat-3"]' WHERE id = 'l-9' AND name = '张副院';
