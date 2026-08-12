-- ============================================================
-- 导师端 / 领导端补充数据
-- 数据库: course_db (MySQL 8)
-- 幂等：INSERT IGNORE + UPDATE，可重复执行
-- 新增 5 位企业导师、3 位学院领导，并修正原记录中不存在的课程引用
-- ============================================================
USE course_db;

-- ------------------------------------------------------------
-- 25. 企业导师：新增 m-5 ~ m-9
-- ------------------------------------------------------------
INSERT IGNORE INTO mentor (id, name, phone, email, avatar, course_ids) VALUES
('m-5', '赵导师', '13900002005', 'zhaomentor@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaomentor', '["course-3","course-5"]'),
('m-6', '孙导师', '13900002006', 'sunmentor@example.com',  'https://api.dicebear.com/7.x/avataaars/svg?seed=sunmentor',  '["course-6","course-8"]'),
('m-7', '周导师', '13900002007', 'zhoumentor@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoumentor', '["course-2","course-10"]'),
('m-8', '吴导师', '13900002008', 'wumentor@example.com',   'https://api.dicebear.com/7.x/avataaars/svg?seed=wumentor',   '["course-4","course-7"]'),
('m-9', '郑导师', '13900002009', 'zhengmentor@example.com','https://api.dicebear.com/7.x/avataaars/svg?seed=zhengmentor','["course-9"]');

-- 修正原有导师记录中不存在的课程引用（course 表仅 course-1 ~ course-10）
UPDATE mentor SET course_ids = '["course-1","course-5"]' WHERE id = 'm-1' AND name = '张导师';
UPDATE mentor SET course_ids = '["course-4","course-6"]' WHERE id = 'm-2' AND name = '李导师';
UPDATE mentor SET course_ids = '["course-5","course-9"]' WHERE id = 'm-3' AND name = '王导师';
UPDATE mentor SET course_ids = '["course-3","course-10"]' WHERE id = 'm-4' AND name = '陈导师';

-- ------------------------------------------------------------
-- 26. 学院领导：新增 l-7 ~ l-9
-- ------------------------------------------------------------
INSERT IGNORE INTO leader (id, name, phone, email, category_ids, as_teacher, teacher_course_ids, as_mentor, mentor_course_ids) VALUES
('l-7', '王院长', '13900003007', 'wanghead@example.com',  '["cat-2","cat-3"]', 0, NULL, 0, NULL),
('l-8', '李院长', '13900003008', 'lihead@example.com',    '["cat-1"]',         1, '["course-6","course-8"]', 0, NULL),
('l-9', '张副院', '13900003009', 'zhangfuhead@example.com','["cat-1","cat-2"]', 0, NULL, 1, '["course-5","course-10"]');

-- 修正原领导记录中不存在的课程引用
UPDATE leader SET teacher_course_ids = '["course-1","course-2"]' WHERE id = 'l-1' AND name = '刘院长';
UPDATE leader SET mentor_course_ids = '["course-6","course-8"]' WHERE id = 'l-3' AND name = '张院长';
