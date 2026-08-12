-- ============================================================
-- 基础数据迁移：分类/学院/班级/教师/导师/领导
-- 数据库: course_db (MySQL 8)
-- 幂等：CREATE TABLE IF NOT EXISTS + INSERT IGNORE，可重复执行
-- ============================================================
USE course_db;

-- 21. 课程分类
CREATE TABLE IF NOT EXISTS category (
    id            VARCHAR(64)  NOT NULL,
    name          VARCHAR(128) NOT NULL,
    color         VARCHAR(32)  DEFAULT '#3b82f6',
    course_count  INT          NOT NULL DEFAULT 0,
    department_id VARCHAR(64)  DEFAULT '',
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT IGNORE INTO category (id, name, color, course_count, department_id) VALUES
('cat-1',  '编程开发', '#3b82f6', 7, 'dept-1'),
('cat-3',  '设计创意', '#f59e0b', 2, 'dept-1'),
('cat-4',  '商务管理', '#8b5cf6', 4, 'dept-1'),
('cat-8',  '前端设计', '#a855f7', 0, 'dept-1'),
('cat-9',  '后端架构', '#84cc16', 0, 'dept-1'),
('cat-2',  '数据科学', '#10b981', 4, 'dept-2'),
('cat-6',  '高等数学', '#ef4444', 0, 'dept-2'),
('cat-7',  '大学物理', '#06b6d4', 0, 'dept-2'),
('cat-5',  '语言学习', '#ec4899', 3, 'dept-3'),
('cat-10', '商务翻译', '#f97316', 0, 'dept-3');

-- 22. 学院
CREATE TABLE IF NOT EXISTS department (
    id         VARCHAR(64)  NOT NULL,
    name       VARCHAR(128) NOT NULL,
    color      VARCHAR(32)  DEFAULT '#3b82f6',
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT IGNORE INTO department (id, name, color) VALUES
('dept-1', '计算机学院', '#3b82f6'),
('dept-2', '数理学院', '#10b981'),
('dept-3', '外国语学院', '#f59e0b'),
('dept-4', '软件学院', '#8b5cf6'),
('dept-5', '数据科学学院', '#06b6d4'),
('dept-6', '人工智能学院', '#ec4899'),
('dept-7', '网络空间安全学院', '#ef4444');

-- 23. 学院班级映射
CREATE TABLE IF NOT EXISTS department_class (
    id            VARCHAR(64)  NOT NULL,
    department_id VARCHAR(64)  NOT NULL,
    class_name    VARCHAR(128) NOT NULL,
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_department (department_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT IGNORE INTO department_class (id, department_id, class_name) VALUES
('dc-1',  'dept-1', '计算机2101班'),
('dc-2',  'dept-1', '计算机2102班'),
('dc-3',  'dept-1', '物联网工程2101班'),
('dc-4',  'dept-2', '3班'),
('dc-5',  'dept-2', '4班'),
('dc-6',  'dept-3', '5班'),
('dc-7',  'dept-4', '软件工程2101班'),
('dc-8',  'dept-4', '软件工程2102班'),
('dc-9',  'dept-5', '数据科学2101班'),
('dc-10', 'dept-6', '人工智能2101班'),
('dc-11', 'dept-7', '网络安全2101班');

-- 24. 教师
CREATE TABLE IF NOT EXISTS teacher (
    id         VARCHAR(64)  NOT NULL,
    name       VARCHAR(64)  NOT NULL,
    phone      VARCHAR(32)  DEFAULT '',
    email      VARCHAR(128) DEFAULT '',
    avatar     VARCHAR(500) DEFAULT '',
    course_ids TEXT         NULL,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT IGNORE INTO teacher (id, name, phone, email, avatar, course_ids) VALUES
('t-1',  '王老师', '13800001001', 'wang@example.com',   'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',    '["course-1","course-4","course-7","course-11"]'),
('t-2',  '李老师', '13800001002', 'li@example.com',     'https://api.dicebear.com/7.x/avataaars/svg?seed=li',      '["course-2","course-8"]'),
('t-3',  '陈老师', '13800001003', 'chen@example.com',   'https://api.dicebear.com/7.x/avataaars/svg?seed=chen',    '["course-3","course-9"]'),
('t-4',  '张老师', '13800001004', 'zhang@example.com',  'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',   '["course-5"]'),
('t-5',  '刘老师', '13800001005', 'liu@example.com',    'https://api.dicebear.com/7.x/avataaars/svg?seed=liu',     '["course-6","course-13"]'),
('t-6',  '赵老师', '13800001006', 'zhao@example.com',   'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',    '["course-10"]'),
('t-7',  '孙老师', '13800001007', 'sun@example.com',    'https://api.dicebear.com/7.x/avataaars/svg?seed=sun',     '["course-12","course-17"]'),
('t-8',  '周老师', '13800001008', 'zhou@example.com',   'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou',    '["course-14","course-18"]'),
('t-9',  '钱老师', '13800001009', 'qian@example.com',   'https://api.dicebear.com/7.x/avataaars/svg?seed=qian',    '["course-15","course-19"]'),
('t-10', '吴老师', '13800001010', 'wu@example.com',     'https://api.dicebear.com/7.x/avataaars/svg?seed=wu',      '["course-16","course-20"]'),
('t-11', '郑老师', '13700002011', 'zheng@example.com',  'https://api.dicebear.com/7.x/avataaars/svg?seed=zheng',   '[]'),
('t-12', '刘院长', '13900003001', 'liuhead@example.com','https://api.dicebear.com/7.x/avataaars/svg?seed=liuhead', '["course-22"]');

-- 25. 企业导师
CREATE TABLE IF NOT EXISTS mentor (
    id         VARCHAR(64)  NOT NULL,
    name       VARCHAR(64)  NOT NULL,
    phone      VARCHAR(32)  DEFAULT '',
    email      VARCHAR(128) DEFAULT '',
    avatar     VARCHAR(500) DEFAULT '',
    course_ids TEXT         NULL,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT IGNORE INTO mentor (id, name, phone, email, avatar, course_ids) VALUES
('m-1', '张导师', '13900002001', 'zhangmentor@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmentor', '["course-1","course-14"]'),
('m-2', '李导师', '13900002002', 'limentor@example.com',   'https://api.dicebear.com/7.x/avataaars/svg?seed=limentor',   '["course-4","course-11"]'),
('m-3', '王导师', '13900002003', 'wangmentor@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangmentor', '["course-5","course-15"]'),
('m-4', '陈导师', '13900002004', 'chenmentor@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenmentor', '["course-3","course-20"]');

-- 26. 学院领导
CREATE TABLE IF NOT EXISTS leader (
    id                 VARCHAR(64)  NOT NULL,
    name               VARCHAR(64)  NOT NULL,
    phone              VARCHAR(32)  DEFAULT '',
    email              VARCHAR(128) DEFAULT '',
    category_ids       TEXT         NULL,
    as_teacher         TINYINT(1)   NOT NULL DEFAULT 0,
    teacher_course_ids TEXT         NULL,
    as_mentor          TINYINT(1)   NOT NULL DEFAULT 0,
    mentor_course_ids  TEXT         NULL,
    created_at         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT IGNORE INTO leader (id, name, phone, email, category_ids, as_teacher, teacher_course_ids, as_mentor, mentor_course_ids) VALUES
('l-1', '刘院长', '13900003001', 'liuhead@example.com',    '["cat-1","cat-2"]',   1, '["course-1","course-11"]', 0, NULL),
('l-2', '陈院长', '13900003002', 'chenhead@example.com',   '["cat-3","cat-4","cat-5"]', 0, NULL, 0, NULL),
('l-3', '张院长', '13900003003', 'zhanghead@example.com',  '["cat-1","cat-4"]',   0, NULL, 1, '["course-6","course-16"]'),
('l-4', '周院长', '13900003004', 'zhouhead@example.com',   '["cat-5"]',           0, NULL, 0, NULL),
('l-5', '吴院长', '13900003005', 'wuhead@example.com',     '["cat-3"]',           0, NULL, 1, '["course-3","course-9"]'),
('l-6', '郑院长', '13900003006', 'zhenghead@example.com',  '["cat-1"]',           1, '["course-4","course-7"]', 0, NULL);
