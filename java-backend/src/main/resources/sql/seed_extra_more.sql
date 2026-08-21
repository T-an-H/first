-- ============================================================
-- 导师端 / 领导端 额外功能数据补充（待办/笔记/在线文档/云盘）
-- 数据库: course_db (MySQL 8)
-- 幂等：INSERT IGNORE，可重复执行
-- ============================================================
USE course_db;

-- ------------------------------------------------------------
-- 待办 todo：新增 5 条（导师 mentor-zhang / 领导 leader-liu）
-- ------------------------------------------------------------
INSERT IGNORE INTO todo (id, title, completed, due_date, created_by) VALUES
('todo-6',  '导师-验收前端工程化项目节点',     0, '2026-08-19 18:00:00', 'mentor-zhang'),
('todo-7',  '导师-补充企业案例到课程资源',     0, '2026-08-22 12:00:00', 'mentor-zhang'),
('todo-8',  '领导-审核学院课程分类配置',       0, '2026-08-21 15:00:00', 'leader-liu'),
('todo-9',  '领导-抽查学生选课与学习进度',     0, '2026-08-26 10:00:00', 'leader-liu'),
('todo-10', '导师-录入项目组评分结果',         1, '2026-08-14 18:00:00', 'mentor-zhang');

-- ------------------------------------------------------------
-- 笔记 note：新增 5 条
-- ------------------------------------------------------------
INSERT IGNORE INTO note (id, title, content, created_by, attachments) VALUES
('note-6',  '企业评审反馈记录',   '第 2 组项目界面交互流畅，建议补充异常处理与性能优化说明。', 'mentor-zhang', NULL),
('note-7',  '导师例会纪要',       '确定下月进企业观摩时间，与课程组对接实训环节安排。',       'mentor-zhang', NULL),
('note-8',  '学院课程建设计划',   '下学年新增"智能前端工程"方向，需配套实训基地 2 个。',       'leader-liu',   NULL),
('note-9',  '教学督导听课记录',   '本周抽查 3 门课程，出勤率 92%，课堂互动良好。',            'leader-liu',   NULL),
('note-10', '项目答辩评分要点',   '功能完整性 30 分、代码质量 30 分、答辩表现 40 分。',        'mentor-zhang', NULL);

-- ------------------------------------------------------------
-- 云盘 course_file：新增 5 条（上传人导师/领导，关联真实课程 course-1/2/5）
-- ------------------------------------------------------------
INSERT IGNORE INTO course_file (id, course_id, name, size, type, data_url, uploaded_at, uploaded_by, visibility_scope, visible_to_class_names) VALUES
('file-11', 'course-1', '企业项目案例库.pdf',     2097152, 'application/pdf', 'data:application/pdf;base64,UEZERjAwMTE=', '2026-08-12', 'mentor-zhang', 'students', NULL),
('file-12', 'course-5', '实习基地介绍.pdf',       1048576, 'application/pdf', 'data:application/pdf;base64,UEZERjAwMTI=', '2026-08-13', 'mentor-zhang', 'students', NULL),
('file-13', 'course-1', '教学督导检查表.docx',    524288,  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'data:application/vnd.ms-word;base64,RE9DMDExMw==', '2026-08-14', 'leader-liu', 'private', NULL),
('file-14', 'course-2', '课程建设规划.xlsx',       307200,  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'data:application/vnd.ms-excel;base64,WEZYUzAxNA==', '2026-08-15', 'leader-liu', 'private', NULL),
('file-15', 'course-1', '学生项目验收标准.pdf',    1572864, 'application/pdf', 'data:application/pdf;base64,UEZERjAwMTU=', '2026-08-16', 'mentor-zhang', 'students', NULL);
