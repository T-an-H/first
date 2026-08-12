-- ============================================================
-- 教师端课程班级种子数据：每门课程每个班级至少 10 名学生
-- 数据库: course_db (MySQL 8)
-- 说明: 新增 19 名学生补齐班级人数；每门课程覆盖 3 个班级 × 每班 10 人
-- ============================================================

USE course_db;

-- ---------- 1. 新增学生 19 名（补齐班级到 10 人） ----------
INSERT INTO student (id, name, student_id, class_name, phone, email, avatar, join_date, status, enrollment_score) VALUES
('stu-101', '孙磊雪', 'S2024101', '计算机2102班', '13800000101', 'stu101@stu.edu.cn', '', '2024-09-01', 'active', 83),
('stu-102', '朱敏颖', 'S2024102', '3班', '13800000102', 'stu102@stu.edu.cn', '', '2024-09-01', 'active', 90),
('stu-103', '郭霞林', 'S2024103', '3班', '13800000103', 'stu103@stu.edu.cn', '', '2024-09-01', 'active', 61),
('stu-104', '高娟建', 'S2024104', '4班', '13800000104', 'stu104@stu.edu.cn', '', '2024-09-01', 'active', 68),
('stu-105', '罗洋阳', 'S2024105', '4班', '13800000105', 'stu105@stu.edu.cn', '', '2024-09-01', 'active', 75),
('stu-106', '李丽坤', 'S2024106', '5班', '13800000106', 'stu106@stu.edu.cn', '', '2024-09-01', 'active', 82),
('stu-107', '刘芳平', 'S2024107', '5班', '13800000107', 'stu107@stu.edu.cn', '', '2024-09-01', 'active', 89),
('stu-108', '杨明晨', 'S2024108', '人工智能2101班', '13800000108', 'stu108@stu.edu.cn', '', '2024-09-01', 'active', 60),
('stu-109', '黄艳婷', 'S2024109', '人工智能2101班', '13800000109', 'stu109@stu.edu.cn', '', '2024-09-01', 'active', 67),
('stu-110', '吴磊博', 'S2024110', '数据科学2101班', '13800000110', 'stu110@stu.edu.cn', '', '2024-09-01', 'active', 74),
('stu-111', '孙敏雪', 'S2024111', '数据科学2101班', '13800000111', 'stu111@stu.edu.cn', '', '2024-09-01', 'active', 81),
('stu-112', '朱霞颖', 'S2024112', '物联网工程2101班', '13800000112', 'stu112@stu.edu.cn', '', '2024-09-01', 'active', 88),
('stu-113', '郭娟林', 'S2024113', '物联网工程2101班', '13800000113', 'stu113@stu.edu.cn', '', '2024-09-01', 'active', 95),
('stu-114', '高洋建', 'S2024114', '网络安全2101班', '13800000114', 'stu114@stu.edu.cn', '', '2024-09-01', 'active', 66),
('stu-115', '罗丽阳', 'S2024115', '网络安全2101班', '13800000115', 'stu115@stu.edu.cn', '', '2024-09-01', 'active', 73),
('stu-116', '李芳坤', 'S2024116', '软件工程2101班', '13800000116', 'stu116@stu.edu.cn', '', '2024-09-01', 'active', 80),
('stu-117', '刘明平', 'S2024117', '软件工程2101班', '13800000117', 'stu117@stu.edu.cn', '', '2024-09-01', 'active', 87),
('stu-118', '杨艳晨', 'S2024118', '软件工程2102班', '13800000118', 'stu118@stu.edu.cn', '', '2024-09-01', 'active', 94),
('stu-119', '黄磊婷', 'S2024119', '软件工程2102班', '13800000119', 'stu119@stu.edu.cn', '', '2024-09-01', 'active', 65);

-- ---------- 2. 清除 10 门课程的旧选课记录 ----------
DELETE FROM enrollment WHERE course_id IN ('course-1', 'course-2', 'course-3', 'course-4', 'course-5', 'course-6', 'course-7', 'course-8', 'course-9', 'course-10');

-- ---------- 3. 选课记录：每门课程 3 个班级 × 每班 10 名学生 ----------
-- course-1 / 计算机2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c1-s1', 'stu-1', 'course-1', 'sch-1', '2026-02-16', 21, 'enrolled'),
('enr-c1-s11', 'stu-11', 'course-1', 'sch-1', '2026-02-16', 60, 'in_progress'),
('enr-c1-s2', 'stu-2', 'course-1', 'sch-1', '2026-02-16', 99, 'completed'),
('enr-c1-s22', 'stu-22', 'course-1', 'sch-1', '2026-02-16', 37, 'enrolled'),
('enr-c1-s3', 'stu-3', 'course-1', 'sch-1', '2026-02-16', 76, 'in_progress'),
('enr-c1-s33', 'stu-33', 'course-1', 'sch-1', '2026-02-16', 14, 'enrolled'),
('enr-c1-s44', 'stu-44', 'course-1', 'sch-1', '2026-02-16', 53, 'in_progress'),
('enr-c1-s55', 'stu-55', 'course-1', 'sch-1', '2026-02-16', 92, 'completed'),
('enr-c1-s66', 'stu-66', 'course-1', 'sch-1', '2026-02-16', 30, 'enrolled'),
('enr-c1-s77', 'stu-77', 'course-1', 'sch-1', '2026-02-16', 69, 'in_progress');

-- course-1 / 计算机2102班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c1-s100', 'stu-100', 'course-1', 'sch-1', '2026-02-16', 21, 'enrolled'),
('enr-c1-s12', 'stu-12', 'course-1', 'sch-1', '2026-02-16', 60, 'in_progress'),
('enr-c1-s23', 'stu-23', 'course-1', 'sch-1', '2026-02-16', 99, 'completed'),
('enr-c1-s34', 'stu-34', 'course-1', 'sch-1', '2026-02-16', 37, 'enrolled'),
('enr-c1-s45', 'stu-45', 'course-1', 'sch-1', '2026-02-16', 76, 'in_progress'),
('enr-c1-s56', 'stu-56', 'course-1', 'sch-1', '2026-02-16', 14, 'enrolled'),
('enr-c1-s67', 'stu-67', 'course-1', 'sch-1', '2026-02-16', 53, 'in_progress'),
('enr-c1-s78', 'stu-78', 'course-1', 'sch-1', '2026-02-16', 92, 'completed'),
('enr-c1-s89', 'stu-89', 'course-1', 'sch-1', '2026-02-16', 30, 'enrolled'),
('enr-c1-s101', 'stu-101', 'course-1', 'sch-1', '2026-02-16', 69, 'in_progress');

-- course-1 / 3班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c1-s19', 'stu-19', 'course-1', 'sch-1', '2026-02-16', 21, 'enrolled'),
('enr-c1-s30', 'stu-30', 'course-1', 'sch-1', '2026-02-16', 60, 'in_progress'),
('enr-c1-s41', 'stu-41', 'course-1', 'sch-1', '2026-02-16', 99, 'completed'),
('enr-c1-s52', 'stu-52', 'course-1', 'sch-1', '2026-02-16', 37, 'enrolled'),
('enr-c1-s63', 'stu-63', 'course-1', 'sch-1', '2026-02-16', 76, 'in_progress'),
('enr-c1-s74', 'stu-74', 'course-1', 'sch-1', '2026-02-16', 14, 'enrolled'),
('enr-c1-s85', 'stu-85', 'course-1', 'sch-1', '2026-02-16', 53, 'in_progress'),
('enr-c1-s96', 'stu-96', 'course-1', 'sch-1', '2026-02-16', 92, 'completed'),
('enr-c1-s102', 'stu-102', 'course-1', 'sch-1', '2026-02-16', 30, 'enrolled'),
('enr-c1-s103', 'stu-103', 'course-1', 'sch-1', '2026-02-16', 69, 'in_progress');

-- course-2 / 4班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c2-s20', 'stu-20', 'course-2', 'sch-2', '2026-02-17', 42, 'in_progress'),
('enr-c2-s31', 'stu-31', 'course-2', 'sch-2', '2026-02-17', 81, 'in_progress'),
('enr-c2-s42', 'stu-42', 'course-2', 'sch-2', '2026-02-17', 19, 'enrolled'),
('enr-c2-s53', 'stu-53', 'course-2', 'sch-2', '2026-02-17', 58, 'in_progress'),
('enr-c2-s64', 'stu-64', 'course-2', 'sch-2', '2026-02-17', 97, 'completed'),
('enr-c2-s75', 'stu-75', 'course-2', 'sch-2', '2026-02-17', 35, 'enrolled'),
('enr-c2-s86', 'stu-86', 'course-2', 'sch-2', '2026-02-17', 74, 'in_progress'),
('enr-c2-s97', 'stu-97', 'course-2', 'sch-2', '2026-02-17', 12, 'enrolled'),
('enr-c2-s104', 'stu-104', 'course-2', 'sch-2', '2026-02-17', 51, 'in_progress'),
('enr-c2-s105', 'stu-105', 'course-2', 'sch-2', '2026-02-17', 90, 'completed');

-- course-2 / 5班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c2-s21', 'stu-21', 'course-2', 'sch-2', '2026-02-17', 42, 'in_progress'),
('enr-c2-s32', 'stu-32', 'course-2', 'sch-2', '2026-02-17', 81, 'in_progress'),
('enr-c2-s43', 'stu-43', 'course-2', 'sch-2', '2026-02-17', 19, 'enrolled'),
('enr-c2-s54', 'stu-54', 'course-2', 'sch-2', '2026-02-17', 58, 'in_progress'),
('enr-c2-s65', 'stu-65', 'course-2', 'sch-2', '2026-02-17', 97, 'completed'),
('enr-c2-s76', 'stu-76', 'course-2', 'sch-2', '2026-02-17', 35, 'enrolled'),
('enr-c2-s87', 'stu-87', 'course-2', 'sch-2', '2026-02-17', 74, 'in_progress'),
('enr-c2-s98', 'stu-98', 'course-2', 'sch-2', '2026-02-17', 12, 'enrolled'),
('enr-c2-s106', 'stu-106', 'course-2', 'sch-2', '2026-02-17', 51, 'in_progress'),
('enr-c2-s107', 'stu-107', 'course-2', 'sch-2', '2026-02-17', 90, 'completed');

-- course-2 / 人工智能2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c2-s17', 'stu-17', 'course-2', 'sch-2', '2026-02-17', 42, 'in_progress'),
('enr-c2-s28', 'stu-28', 'course-2', 'sch-2', '2026-02-17', 81, 'in_progress'),
('enr-c2-s39', 'stu-39', 'course-2', 'sch-2', '2026-02-17', 19, 'enrolled'),
('enr-c2-s50', 'stu-50', 'course-2', 'sch-2', '2026-02-17', 58, 'in_progress'),
('enr-c2-s61', 'stu-61', 'course-2', 'sch-2', '2026-02-17', 97, 'completed'),
('enr-c2-s72', 'stu-72', 'course-2', 'sch-2', '2026-02-17', 35, 'enrolled'),
('enr-c2-s83', 'stu-83', 'course-2', 'sch-2', '2026-02-17', 74, 'in_progress'),
('enr-c2-s94', 'stu-94', 'course-2', 'sch-2', '2026-02-17', 12, 'enrolled'),
('enr-c2-s108', 'stu-108', 'course-2', 'sch-2', '2026-02-17', 51, 'in_progress'),
('enr-c2-s109', 'stu-109', 'course-2', 'sch-2', '2026-02-17', 90, 'completed');

-- course-3 / 数据科学2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c3-s16', 'stu-16', 'course-3', 'sch-3', '2026-02-18', 63, 'in_progress'),
('enr-c3-s27', 'stu-27', 'course-3', 'sch-3', '2026-02-18', 1, 'enrolled'),
('enr-c3-s38', 'stu-38', 'course-3', 'sch-3', '2026-02-18', 40, 'in_progress'),
('enr-c3-s49', 'stu-49', 'course-3', 'sch-3', '2026-02-18', 79, 'in_progress'),
('enr-c3-s60', 'stu-60', 'course-3', 'sch-3', '2026-02-18', 17, 'enrolled'),
('enr-c3-s71', 'stu-71', 'course-3', 'sch-3', '2026-02-18', 56, 'in_progress'),
('enr-c3-s82', 'stu-82', 'course-3', 'sch-3', '2026-02-18', 95, 'completed'),
('enr-c3-s93', 'stu-93', 'course-3', 'sch-3', '2026-02-18', 33, 'enrolled'),
('enr-c3-s110', 'stu-110', 'course-3', 'sch-3', '2026-02-18', 72, 'in_progress'),
('enr-c3-s111', 'stu-111', 'course-3', 'sch-3', '2026-02-18', 10, 'enrolled');

-- course-3 / 物联网工程2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c3-s13', 'stu-13', 'course-3', 'sch-3', '2026-02-18', 63, 'in_progress'),
('enr-c3-s24', 'stu-24', 'course-3', 'sch-3', '2026-02-18', 1, 'enrolled'),
('enr-c3-s35', 'stu-35', 'course-3', 'sch-3', '2026-02-18', 40, 'in_progress'),
('enr-c3-s46', 'stu-46', 'course-3', 'sch-3', '2026-02-18', 79, 'in_progress'),
('enr-c3-s57', 'stu-57', 'course-3', 'sch-3', '2026-02-18', 17, 'enrolled'),
('enr-c3-s68', 'stu-68', 'course-3', 'sch-3', '2026-02-18', 56, 'in_progress'),
('enr-c3-s79', 'stu-79', 'course-3', 'sch-3', '2026-02-18', 95, 'completed'),
('enr-c3-s90', 'stu-90', 'course-3', 'sch-3', '2026-02-18', 33, 'enrolled'),
('enr-c3-s112', 'stu-112', 'course-3', 'sch-3', '2026-02-18', 72, 'in_progress'),
('enr-c3-s113', 'stu-113', 'course-3', 'sch-3', '2026-02-18', 10, 'enrolled');

-- course-3 / 网络安全2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c3-s18', 'stu-18', 'course-3', 'sch-3', '2026-02-18', 63, 'in_progress'),
('enr-c3-s29', 'stu-29', 'course-3', 'sch-3', '2026-02-18', 1, 'enrolled'),
('enr-c3-s40', 'stu-40', 'course-3', 'sch-3', '2026-02-18', 40, 'in_progress'),
('enr-c3-s51', 'stu-51', 'course-3', 'sch-3', '2026-02-18', 79, 'in_progress'),
('enr-c3-s62', 'stu-62', 'course-3', 'sch-3', '2026-02-18', 17, 'enrolled'),
('enr-c3-s73', 'stu-73', 'course-3', 'sch-3', '2026-02-18', 56, 'in_progress'),
('enr-c3-s84', 'stu-84', 'course-3', 'sch-3', '2026-02-18', 95, 'completed'),
('enr-c3-s95', 'stu-95', 'course-3', 'sch-3', '2026-02-18', 33, 'enrolled'),
('enr-c3-s114', 'stu-114', 'course-3', 'sch-3', '2026-02-18', 72, 'in_progress'),
('enr-c3-s115', 'stu-115', 'course-3', 'sch-3', '2026-02-18', 10, 'enrolled');

-- course-4 / 软件工程2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c4-s14', 'stu-14', 'course-4', 'sch-4', '2026-02-19', 84, 'in_progress'),
('enr-c4-s25', 'stu-25', 'course-4', 'sch-4', '2026-02-19', 22, 'enrolled'),
('enr-c4-s36', 'stu-36', 'course-4', 'sch-4', '2026-02-19', 61, 'in_progress'),
('enr-c4-s47', 'stu-47', 'course-4', 'sch-4', '2026-02-19', 100, 'completed'),
('enr-c4-s58', 'stu-58', 'course-4', 'sch-4', '2026-02-19', 38, 'enrolled'),
('enr-c4-s69', 'stu-69', 'course-4', 'sch-4', '2026-02-19', 77, 'in_progress'),
('enr-c4-s80', 'stu-80', 'course-4', 'sch-4', '2026-02-19', 15, 'enrolled'),
('enr-c4-s91', 'stu-91', 'course-4', 'sch-4', '2026-02-19', 54, 'in_progress'),
('enr-c4-s116', 'stu-116', 'course-4', 'sch-4', '2026-02-19', 93, 'completed'),
('enr-c4-s117', 'stu-117', 'course-4', 'sch-4', '2026-02-19', 31, 'enrolled');

-- course-4 / 软件工程2102班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c4-s15', 'stu-15', 'course-4', 'sch-4', '2026-02-19', 84, 'in_progress'),
('enr-c4-s26', 'stu-26', 'course-4', 'sch-4', '2026-02-19', 22, 'enrolled'),
('enr-c4-s37', 'stu-37', 'course-4', 'sch-4', '2026-02-19', 61, 'in_progress'),
('enr-c4-s48', 'stu-48', 'course-4', 'sch-4', '2026-02-19', 100, 'completed'),
('enr-c4-s59', 'stu-59', 'course-4', 'sch-4', '2026-02-19', 38, 'enrolled'),
('enr-c4-s70', 'stu-70', 'course-4', 'sch-4', '2026-02-19', 77, 'in_progress'),
('enr-c4-s81', 'stu-81', 'course-4', 'sch-4', '2026-02-19', 15, 'enrolled'),
('enr-c4-s92', 'stu-92', 'course-4', 'sch-4', '2026-02-19', 54, 'in_progress'),
('enr-c4-s118', 'stu-118', 'course-4', 'sch-4', '2026-02-19', 93, 'completed'),
('enr-c4-s119', 'stu-119', 'course-4', 'sch-4', '2026-02-19', 31, 'enrolled');

-- course-4 / 计算机2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c4-s1', 'stu-1', 'course-4', 'sch-4', '2026-02-19', 84, 'in_progress'),
('enr-c4-s11', 'stu-11', 'course-4', 'sch-4', '2026-02-19', 22, 'enrolled'),
('enr-c4-s2', 'stu-2', 'course-4', 'sch-4', '2026-02-19', 61, 'in_progress'),
('enr-c4-s22', 'stu-22', 'course-4', 'sch-4', '2026-02-19', 100, 'completed'),
('enr-c4-s3', 'stu-3', 'course-4', 'sch-4', '2026-02-19', 38, 'enrolled'),
('enr-c4-s33', 'stu-33', 'course-4', 'sch-4', '2026-02-19', 77, 'in_progress'),
('enr-c4-s44', 'stu-44', 'course-4', 'sch-4', '2026-02-19', 15, 'enrolled'),
('enr-c4-s55', 'stu-55', 'course-4', 'sch-4', '2026-02-19', 54, 'in_progress'),
('enr-c4-s66', 'stu-66', 'course-4', 'sch-4', '2026-02-19', 93, 'completed'),
('enr-c4-s77', 'stu-77', 'course-4', 'sch-4', '2026-02-19', 31, 'enrolled');

-- course-5 / 计算机2102班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c5-s100', 'stu-100', 'course-5', 'sch-5', '2026-02-20', 4, 'enrolled'),
('enr-c5-s12', 'stu-12', 'course-5', 'sch-5', '2026-02-20', 43, 'in_progress'),
('enr-c5-s23', 'stu-23', 'course-5', 'sch-5', '2026-02-20', 82, 'in_progress'),
('enr-c5-s34', 'stu-34', 'course-5', 'sch-5', '2026-02-20', 20, 'enrolled'),
('enr-c5-s45', 'stu-45', 'course-5', 'sch-5', '2026-02-20', 59, 'in_progress'),
('enr-c5-s56', 'stu-56', 'course-5', 'sch-5', '2026-02-20', 98, 'completed'),
('enr-c5-s67', 'stu-67', 'course-5', 'sch-5', '2026-02-20', 36, 'enrolled'),
('enr-c5-s78', 'stu-78', 'course-5', 'sch-5', '2026-02-20', 75, 'in_progress'),
('enr-c5-s89', 'stu-89', 'course-5', 'sch-5', '2026-02-20', 13, 'enrolled'),
('enr-c5-s101', 'stu-101', 'course-5', 'sch-5', '2026-02-20', 52, 'in_progress');

-- course-5 / 3班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c5-s19', 'stu-19', 'course-5', 'sch-5', '2026-02-20', 4, 'enrolled'),
('enr-c5-s30', 'stu-30', 'course-5', 'sch-5', '2026-02-20', 43, 'in_progress'),
('enr-c5-s41', 'stu-41', 'course-5', 'sch-5', '2026-02-20', 82, 'in_progress'),
('enr-c5-s52', 'stu-52', 'course-5', 'sch-5', '2026-02-20', 20, 'enrolled'),
('enr-c5-s63', 'stu-63', 'course-5', 'sch-5', '2026-02-20', 59, 'in_progress'),
('enr-c5-s74', 'stu-74', 'course-5', 'sch-5', '2026-02-20', 98, 'completed'),
('enr-c5-s85', 'stu-85', 'course-5', 'sch-5', '2026-02-20', 36, 'enrolled'),
('enr-c5-s96', 'stu-96', 'course-5', 'sch-5', '2026-02-20', 75, 'in_progress'),
('enr-c5-s102', 'stu-102', 'course-5', 'sch-5', '2026-02-20', 13, 'enrolled'),
('enr-c5-s103', 'stu-103', 'course-5', 'sch-5', '2026-02-20', 52, 'in_progress');

-- course-5 / 4班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c5-s20', 'stu-20', 'course-5', 'sch-5', '2026-02-20', 4, 'enrolled'),
('enr-c5-s31', 'stu-31', 'course-5', 'sch-5', '2026-02-20', 43, 'in_progress'),
('enr-c5-s42', 'stu-42', 'course-5', 'sch-5', '2026-02-20', 82, 'in_progress'),
('enr-c5-s53', 'stu-53', 'course-5', 'sch-5', '2026-02-20', 20, 'enrolled'),
('enr-c5-s64', 'stu-64', 'course-5', 'sch-5', '2026-02-20', 59, 'in_progress'),
('enr-c5-s75', 'stu-75', 'course-5', 'sch-5', '2026-02-20', 98, 'completed'),
('enr-c5-s86', 'stu-86', 'course-5', 'sch-5', '2026-02-20', 36, 'enrolled'),
('enr-c5-s97', 'stu-97', 'course-5', 'sch-5', '2026-02-20', 75, 'in_progress'),
('enr-c5-s104', 'stu-104', 'course-5', 'sch-5', '2026-02-20', 13, 'enrolled'),
('enr-c5-s105', 'stu-105', 'course-5', 'sch-5', '2026-02-20', 52, 'in_progress');

-- course-6 / 5班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c6-s21', 'stu-21', 'course-6', 'sch-6', '2026-02-21', 25, 'enrolled'),
('enr-c6-s32', 'stu-32', 'course-6', 'sch-6', '2026-02-21', 64, 'in_progress'),
('enr-c6-s43', 'stu-43', 'course-6', 'sch-6', '2026-02-21', 2, 'enrolled'),
('enr-c6-s54', 'stu-54', 'course-6', 'sch-6', '2026-02-21', 41, 'in_progress'),
('enr-c6-s65', 'stu-65', 'course-6', 'sch-6', '2026-02-21', 80, 'in_progress'),
('enr-c6-s76', 'stu-76', 'course-6', 'sch-6', '2026-02-21', 18, 'enrolled'),
('enr-c6-s87', 'stu-87', 'course-6', 'sch-6', '2026-02-21', 57, 'in_progress'),
('enr-c6-s98', 'stu-98', 'course-6', 'sch-6', '2026-02-21', 96, 'completed'),
('enr-c6-s106', 'stu-106', 'course-6', 'sch-6', '2026-02-21', 34, 'enrolled'),
('enr-c6-s107', 'stu-107', 'course-6', 'sch-6', '2026-02-21', 73, 'in_progress');

-- course-6 / 人工智能2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c6-s17', 'stu-17', 'course-6', 'sch-6', '2026-02-21', 25, 'enrolled'),
('enr-c6-s28', 'stu-28', 'course-6', 'sch-6', '2026-02-21', 64, 'in_progress'),
('enr-c6-s39', 'stu-39', 'course-6', 'sch-6', '2026-02-21', 2, 'enrolled'),
('enr-c6-s50', 'stu-50', 'course-6', 'sch-6', '2026-02-21', 41, 'in_progress'),
('enr-c6-s61', 'stu-61', 'course-6', 'sch-6', '2026-02-21', 80, 'in_progress'),
('enr-c6-s72', 'stu-72', 'course-6', 'sch-6', '2026-02-21', 18, 'enrolled'),
('enr-c6-s83', 'stu-83', 'course-6', 'sch-6', '2026-02-21', 57, 'in_progress'),
('enr-c6-s94', 'stu-94', 'course-6', 'sch-6', '2026-02-21', 96, 'completed'),
('enr-c6-s108', 'stu-108', 'course-6', 'sch-6', '2026-02-21', 34, 'enrolled'),
('enr-c6-s109', 'stu-109', 'course-6', 'sch-6', '2026-02-21', 73, 'in_progress');

-- course-6 / 数据科学2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c6-s16', 'stu-16', 'course-6', 'sch-6', '2026-02-21', 25, 'enrolled'),
('enr-c6-s27', 'stu-27', 'course-6', 'sch-6', '2026-02-21', 64, 'in_progress'),
('enr-c6-s38', 'stu-38', 'course-6', 'sch-6', '2026-02-21', 2, 'enrolled'),
('enr-c6-s49', 'stu-49', 'course-6', 'sch-6', '2026-02-21', 41, 'in_progress'),
('enr-c6-s60', 'stu-60', 'course-6', 'sch-6', '2026-02-21', 80, 'in_progress'),
('enr-c6-s71', 'stu-71', 'course-6', 'sch-6', '2026-02-21', 18, 'enrolled'),
('enr-c6-s82', 'stu-82', 'course-6', 'sch-6', '2026-02-21', 57, 'in_progress'),
('enr-c6-s93', 'stu-93', 'course-6', 'sch-6', '2026-02-21', 96, 'completed'),
('enr-c6-s110', 'stu-110', 'course-6', 'sch-6', '2026-02-21', 34, 'enrolled'),
('enr-c6-s111', 'stu-111', 'course-6', 'sch-6', '2026-02-21', 73, 'in_progress');

-- course-7 / 物联网工程2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c7-s13', 'stu-13', 'course-7', 'sch-7', '2026-02-22', 46, 'in_progress'),
('enr-c7-s24', 'stu-24', 'course-7', 'sch-7', '2026-02-22', 85, 'in_progress'),
('enr-c7-s35', 'stu-35', 'course-7', 'sch-7', '2026-02-22', 23, 'enrolled'),
('enr-c7-s46', 'stu-46', 'course-7', 'sch-7', '2026-02-22', 62, 'in_progress'),
('enr-c7-s57', 'stu-57', 'course-7', 'sch-7', '2026-02-22', 0, 'enrolled'),
('enr-c7-s68', 'stu-68', 'course-7', 'sch-7', '2026-02-22', 39, 'enrolled'),
('enr-c7-s79', 'stu-79', 'course-7', 'sch-7', '2026-02-22', 78, 'in_progress'),
('enr-c7-s90', 'stu-90', 'course-7', 'sch-7', '2026-02-22', 16, 'enrolled'),
('enr-c7-s112', 'stu-112', 'course-7', 'sch-7', '2026-02-22', 55, 'in_progress'),
('enr-c7-s113', 'stu-113', 'course-7', 'sch-7', '2026-02-22', 94, 'completed');

-- course-7 / 网络安全2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c7-s18', 'stu-18', 'course-7', 'sch-7', '2026-02-22', 46, 'in_progress'),
('enr-c7-s29', 'stu-29', 'course-7', 'sch-7', '2026-02-22', 85, 'in_progress'),
('enr-c7-s40', 'stu-40', 'course-7', 'sch-7', '2026-02-22', 23, 'enrolled'),
('enr-c7-s51', 'stu-51', 'course-7', 'sch-7', '2026-02-22', 62, 'in_progress'),
('enr-c7-s62', 'stu-62', 'course-7', 'sch-7', '2026-02-22', 0, 'enrolled'),
('enr-c7-s73', 'stu-73', 'course-7', 'sch-7', '2026-02-22', 39, 'enrolled'),
('enr-c7-s84', 'stu-84', 'course-7', 'sch-7', '2026-02-22', 78, 'in_progress'),
('enr-c7-s95', 'stu-95', 'course-7', 'sch-7', '2026-02-22', 16, 'enrolled'),
('enr-c7-s114', 'stu-114', 'course-7', 'sch-7', '2026-02-22', 55, 'in_progress'),
('enr-c7-s115', 'stu-115', 'course-7', 'sch-7', '2026-02-22', 94, 'completed');

-- course-7 / 软件工程2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c7-s14', 'stu-14', 'course-7', 'sch-7', '2026-02-22', 46, 'in_progress'),
('enr-c7-s25', 'stu-25', 'course-7', 'sch-7', '2026-02-22', 85, 'in_progress'),
('enr-c7-s36', 'stu-36', 'course-7', 'sch-7', '2026-02-22', 23, 'enrolled'),
('enr-c7-s47', 'stu-47', 'course-7', 'sch-7', '2026-02-22', 62, 'in_progress'),
('enr-c7-s58', 'stu-58', 'course-7', 'sch-7', '2026-02-22', 0, 'enrolled'),
('enr-c7-s69', 'stu-69', 'course-7', 'sch-7', '2026-02-22', 39, 'enrolled'),
('enr-c7-s80', 'stu-80', 'course-7', 'sch-7', '2026-02-22', 78, 'in_progress'),
('enr-c7-s91', 'stu-91', 'course-7', 'sch-7', '2026-02-22', 16, 'enrolled'),
('enr-c7-s116', 'stu-116', 'course-7', 'sch-7', '2026-02-22', 55, 'in_progress'),
('enr-c7-s117', 'stu-117', 'course-7', 'sch-7', '2026-02-22', 94, 'completed');

-- course-8 / 软件工程2102班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c8-s15', 'stu-15', 'course-8', 'sch-8', '2026-02-23', 67, 'in_progress'),
('enr-c8-s26', 'stu-26', 'course-8', 'sch-8', '2026-02-23', 5, 'enrolled'),
('enr-c8-s37', 'stu-37', 'course-8', 'sch-8', '2026-02-23', 44, 'in_progress'),
('enr-c8-s48', 'stu-48', 'course-8', 'sch-8', '2026-02-23', 83, 'in_progress'),
('enr-c8-s59', 'stu-59', 'course-8', 'sch-8', '2026-02-23', 21, 'enrolled'),
('enr-c8-s70', 'stu-70', 'course-8', 'sch-8', '2026-02-23', 60, 'in_progress'),
('enr-c8-s81', 'stu-81', 'course-8', 'sch-8', '2026-02-23', 99, 'completed'),
('enr-c8-s92', 'stu-92', 'course-8', 'sch-8', '2026-02-23', 37, 'enrolled'),
('enr-c8-s118', 'stu-118', 'course-8', 'sch-8', '2026-02-23', 76, 'in_progress'),
('enr-c8-s119', 'stu-119', 'course-8', 'sch-8', '2026-02-23', 14, 'enrolled');

-- course-8 / 计算机2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c8-s1', 'stu-1', 'course-8', 'sch-8', '2026-02-23', 67, 'in_progress'),
('enr-c8-s11', 'stu-11', 'course-8', 'sch-8', '2026-02-23', 5, 'enrolled'),
('enr-c8-s2', 'stu-2', 'course-8', 'sch-8', '2026-02-23', 44, 'in_progress'),
('enr-c8-s22', 'stu-22', 'course-8', 'sch-8', '2026-02-23', 83, 'in_progress'),
('enr-c8-s3', 'stu-3', 'course-8', 'sch-8', '2026-02-23', 21, 'enrolled'),
('enr-c8-s33', 'stu-33', 'course-8', 'sch-8', '2026-02-23', 60, 'in_progress'),
('enr-c8-s44', 'stu-44', 'course-8', 'sch-8', '2026-02-23', 99, 'completed'),
('enr-c8-s55', 'stu-55', 'course-8', 'sch-8', '2026-02-23', 37, 'enrolled'),
('enr-c8-s66', 'stu-66', 'course-8', 'sch-8', '2026-02-23', 76, 'in_progress'),
('enr-c8-s77', 'stu-77', 'course-8', 'sch-8', '2026-02-23', 14, 'enrolled');

-- course-8 / 计算机2102班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c8-s100', 'stu-100', 'course-8', 'sch-8', '2026-02-23', 67, 'in_progress'),
('enr-c8-s12', 'stu-12', 'course-8', 'sch-8', '2026-02-23', 5, 'enrolled'),
('enr-c8-s23', 'stu-23', 'course-8', 'sch-8', '2026-02-23', 44, 'in_progress'),
('enr-c8-s34', 'stu-34', 'course-8', 'sch-8', '2026-02-23', 83, 'in_progress'),
('enr-c8-s45', 'stu-45', 'course-8', 'sch-8', '2026-02-23', 21, 'enrolled'),
('enr-c8-s56', 'stu-56', 'course-8', 'sch-8', '2026-02-23', 60, 'in_progress'),
('enr-c8-s67', 'stu-67', 'course-8', 'sch-8', '2026-02-23', 99, 'completed'),
('enr-c8-s78', 'stu-78', 'course-8', 'sch-8', '2026-02-23', 37, 'enrolled'),
('enr-c8-s89', 'stu-89', 'course-8', 'sch-8', '2026-02-23', 76, 'in_progress'),
('enr-c8-s101', 'stu-101', 'course-8', 'sch-8', '2026-02-23', 14, 'enrolled');

-- course-9 / 3班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c9-s19', 'stu-19', 'course-9', 'sch-9', '2026-02-24', 88, 'in_progress'),
('enr-c9-s30', 'stu-30', 'course-9', 'sch-9', '2026-02-24', 26, 'enrolled'),
('enr-c9-s41', 'stu-41', 'course-9', 'sch-9', '2026-02-24', 65, 'in_progress'),
('enr-c9-s52', 'stu-52', 'course-9', 'sch-9', '2026-02-24', 3, 'enrolled'),
('enr-c9-s63', 'stu-63', 'course-9', 'sch-9', '2026-02-24', 42, 'in_progress'),
('enr-c9-s74', 'stu-74', 'course-9', 'sch-9', '2026-02-24', 81, 'in_progress'),
('enr-c9-s85', 'stu-85', 'course-9', 'sch-9', '2026-02-24', 19, 'enrolled'),
('enr-c9-s96', 'stu-96', 'course-9', 'sch-9', '2026-02-24', 58, 'in_progress'),
('enr-c9-s102', 'stu-102', 'course-9', 'sch-9', '2026-02-24', 97, 'completed'),
('enr-c9-s103', 'stu-103', 'course-9', 'sch-9', '2026-02-24', 35, 'enrolled');

-- course-9 / 4班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c9-s20', 'stu-20', 'course-9', 'sch-9', '2026-02-24', 88, 'in_progress'),
('enr-c9-s31', 'stu-31', 'course-9', 'sch-9', '2026-02-24', 26, 'enrolled'),
('enr-c9-s42', 'stu-42', 'course-9', 'sch-9', '2026-02-24', 65, 'in_progress'),
('enr-c9-s53', 'stu-53', 'course-9', 'sch-9', '2026-02-24', 3, 'enrolled'),
('enr-c9-s64', 'stu-64', 'course-9', 'sch-9', '2026-02-24', 42, 'in_progress'),
('enr-c9-s75', 'stu-75', 'course-9', 'sch-9', '2026-02-24', 81, 'in_progress'),
('enr-c9-s86', 'stu-86', 'course-9', 'sch-9', '2026-02-24', 19, 'enrolled'),
('enr-c9-s97', 'stu-97', 'course-9', 'sch-9', '2026-02-24', 58, 'in_progress'),
('enr-c9-s104', 'stu-104', 'course-9', 'sch-9', '2026-02-24', 97, 'completed'),
('enr-c9-s105', 'stu-105', 'course-9', 'sch-9', '2026-02-24', 35, 'enrolled');

-- course-9 / 5班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c9-s21', 'stu-21', 'course-9', 'sch-9', '2026-02-24', 88, 'in_progress'),
('enr-c9-s32', 'stu-32', 'course-9', 'sch-9', '2026-02-24', 26, 'enrolled'),
('enr-c9-s43', 'stu-43', 'course-9', 'sch-9', '2026-02-24', 65, 'in_progress'),
('enr-c9-s54', 'stu-54', 'course-9', 'sch-9', '2026-02-24', 3, 'enrolled'),
('enr-c9-s65', 'stu-65', 'course-9', 'sch-9', '2026-02-24', 42, 'in_progress'),
('enr-c9-s76', 'stu-76', 'course-9', 'sch-9', '2026-02-24', 81, 'in_progress'),
('enr-c9-s87', 'stu-87', 'course-9', 'sch-9', '2026-02-24', 19, 'enrolled'),
('enr-c9-s98', 'stu-98', 'course-9', 'sch-9', '2026-02-24', 58, 'in_progress'),
('enr-c9-s106', 'stu-106', 'course-9', 'sch-9', '2026-02-24', 97, 'completed'),
('enr-c9-s107', 'stu-107', 'course-9', 'sch-9', '2026-02-24', 35, 'enrolled');

-- course-10 / 人工智能2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c10-s17', 'stu-17', 'course-10', 'sch-10', '2026-02-25', 8, 'enrolled'),
('enr-c10-s28', 'stu-28', 'course-10', 'sch-10', '2026-02-25', 47, 'in_progress'),
('enr-c10-s39', 'stu-39', 'course-10', 'sch-10', '2026-02-25', 86, 'in_progress'),
('enr-c10-s50', 'stu-50', 'course-10', 'sch-10', '2026-02-25', 24, 'enrolled'),
('enr-c10-s61', 'stu-61', 'course-10', 'sch-10', '2026-02-25', 63, 'in_progress'),
('enr-c10-s72', 'stu-72', 'course-10', 'sch-10', '2026-02-25', 1, 'enrolled'),
('enr-c10-s83', 'stu-83', 'course-10', 'sch-10', '2026-02-25', 40, 'in_progress'),
('enr-c10-s94', 'stu-94', 'course-10', 'sch-10', '2026-02-25', 79, 'in_progress'),
('enr-c10-s108', 'stu-108', 'course-10', 'sch-10', '2026-02-25', 17, 'enrolled'),
('enr-c10-s109', 'stu-109', 'course-10', 'sch-10', '2026-02-25', 56, 'in_progress');

-- course-10 / 数据科学2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c10-s16', 'stu-16', 'course-10', 'sch-10', '2026-02-25', 8, 'enrolled'),
('enr-c10-s27', 'stu-27', 'course-10', 'sch-10', '2026-02-25', 47, 'in_progress'),
('enr-c10-s38', 'stu-38', 'course-10', 'sch-10', '2026-02-25', 86, 'in_progress'),
('enr-c10-s49', 'stu-49', 'course-10', 'sch-10', '2026-02-25', 24, 'enrolled'),
('enr-c10-s60', 'stu-60', 'course-10', 'sch-10', '2026-02-25', 63, 'in_progress'),
('enr-c10-s71', 'stu-71', 'course-10', 'sch-10', '2026-02-25', 1, 'enrolled'),
('enr-c10-s82', 'stu-82', 'course-10', 'sch-10', '2026-02-25', 40, 'in_progress'),
('enr-c10-s93', 'stu-93', 'course-10', 'sch-10', '2026-02-25', 79, 'in_progress'),
('enr-c10-s110', 'stu-110', 'course-10', 'sch-10', '2026-02-25', 17, 'enrolled'),
('enr-c10-s111', 'stu-111', 'course-10', 'sch-10', '2026-02-25', 56, 'in_progress');

-- course-10 / 物联网工程2101班（10 人）
INSERT INTO enrollment (id, student_id, course_id, schedule_id, enroll_date, progress, status) VALUES
('enr-c10-s13', 'stu-13', 'course-10', 'sch-10', '2026-02-25', 8, 'enrolled'),
('enr-c10-s24', 'stu-24', 'course-10', 'sch-10', '2026-02-25', 47, 'in_progress'),
('enr-c10-s35', 'stu-35', 'course-10', 'sch-10', '2026-02-25', 86, 'in_progress'),
('enr-c10-s46', 'stu-46', 'course-10', 'sch-10', '2026-02-25', 24, 'enrolled'),
('enr-c10-s57', 'stu-57', 'course-10', 'sch-10', '2026-02-25', 63, 'in_progress'),
('enr-c10-s68', 'stu-68', 'course-10', 'sch-10', '2026-02-25', 1, 'enrolled'),
('enr-c10-s79', 'stu-79', 'course-10', 'sch-10', '2026-02-25', 40, 'in_progress'),
('enr-c10-s90', 'stu-90', 'course-10', 'sch-10', '2026-02-25', 79, 'in_progress'),
('enr-c10-s112', 'stu-112', 'course-10', 'sch-10', '2026-02-25', 17, 'enrolled'),
('enr-c10-s113', 'stu-113', 'course-10', 'sch-10', '2026-02-25', 56, 'in_progress');
