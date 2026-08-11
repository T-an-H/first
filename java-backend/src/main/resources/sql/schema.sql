-- ============================================================
-- 课程管理平台 · 教师端后端模块 建表脚本
-- 数据库: course_db  (MySQL 8)
-- 执行方式: mysql -uroot -p070808 < schema.sql
--           或在 Navicat/Workbench 中打开本文件整段执行
-- ============================================================

CREATE DATABASE IF NOT EXISTS course_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE course_db;

-- ------------------------------------------------------------
-- 1. 选课记录 enrollment
-- ------------------------------------------------------------
DROP TABLE IF EXISTS enrollment;
CREATE TABLE enrollment (
    id          VARCHAR(64)  NOT NULL COMMENT '主键（前端生成，如 enr-xxx）',
    student_id  VARCHAR(64)  NOT NULL COMMENT '学生ID/学号',
    course_id   VARCHAR(64)  NOT NULL COMMENT '课程ID',
    schedule_id VARCHAR(64)  DEFAULT '' COMMENT '关联排课ID',
    enroll_date DATE         DEFAULT NULL COMMENT '选课日期',
    progress    INT          NOT NULL DEFAULT 0 COMMENT '学习进度 0-100',
    status      VARCHAR(32)  NOT NULL DEFAULT 'enrolled' COMMENT 'enrolled/in_progress/completed/dropped',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_course (course_id),
    KEY idx_student (student_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '选课记录';

-- ------------------------------------------------------------
-- 2. 分组 student_group（group 是 MySQL 保留字，故用 student_group）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS student_group;
CREATE TABLE student_group (
    id         VARCHAR(64)  NOT NULL COMMENT '主键（前端生成，如 grp-xxx）',
    course_id  VARCHAR(64)  NOT NULL COMMENT '课程ID',
    name       VARCHAR(128) NOT NULL COMMENT '组名',
    member_ids TEXT         NULL COMMENT '成员学生ID列表（JSON数组，如 ["s1","s2"]）',
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_course (course_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '学生分组';

-- ------------------------------------------------------------
-- 3. 课程资源 course_file
-- ------------------------------------------------------------
DROP TABLE IF EXISTS course_file;
CREATE TABLE course_file (
    id                     VARCHAR(64)  NOT NULL COMMENT '主键（前端生成，如 file-xxx）',
    course_id              VARCHAR(64)  NOT NULL COMMENT '课程ID',
    name                   VARCHAR(255) NOT NULL COMMENT '文件名',
    size                   BIGINT       NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
    type                   VARCHAR(128) DEFAULT '' COMMENT 'MIME类型',
    data_url               TEXT         NULL COMMENT '文件URL或Base64',
    uploaded_at            DATE         DEFAULT NULL COMMENT '上传日期',
    uploaded_by            VARCHAR(64)  DEFAULT '' COMMENT '上传人',
    visibility_scope       VARCHAR(32)  DEFAULT 'students' COMMENT '可见范围 private/students',
    visible_to_class_names TEXT         NULL COMMENT '可见班级列表（JSON数组）',
    created_at             DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_course (course_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '课程资源';

-- ------------------------------------------------------------
-- 4. 成绩权重配置 grade_config（一门课程一条，course_id 即主键）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS grade_config;
CREATE TABLE grade_config (
    course_id              VARCHAR(64) NOT NULL COMMENT '课程ID（主键）',
    regular_weight         INT NOT NULL DEFAULT 40 COMMENT '平时成绩占比%',
    midterm_weight         INT NOT NULL DEFAULT 0 COMMENT '期中占比%',
    final_weight           INT NOT NULL DEFAULT 60 COMMENT '期末占比%',
    self_eval_weight       INT NOT NULL DEFAULT 10 COMMENT '自评占比%',
    peer_review_weight     INT NOT NULL DEFAULT 20 COMMENT '组内互评占比%',
    inter_group_eval_weight INT NOT NULL DEFAULT 10 COMMENT '组间互评占比%',
    teacher_score_weight   INT NOT NULL DEFAULT 30 COMMENT '教师评分占比%',
    mentor_score_weight    INT NOT NULL DEFAULT 30 COMMENT '企业导师评分占比%',
    midterm_exam_weight    INT NOT NULL DEFAULT 50 COMMENT '期中考试占期中的比例%',
    midterm_project_weight INT NOT NULL DEFAULT 50 COMMENT '期中项目占期中的比例%',
    final_exam_weight      INT NOT NULL DEFAULT 50 COMMENT '期末考试占期末的比例%',
    final_project_weight   INT NOT NULL DEFAULT 50 COMMENT '期末项目占期末的比例%',
    quality_eval_max_bonus INT NOT NULL DEFAULT 10 COMMENT '素质评价加成上限（分）',
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '成绩权重配置';

-- ------------------------------------------------------------
-- 5. 课程评价 evaluation
-- ------------------------------------------------------------
DROP TABLE IF EXISTS evaluation;
CREATE TABLE evaluation (
    id             VARCHAR(64)  NOT NULL COMMENT '主键（前端生成）',
    course_id      VARCHAR(64)  NOT NULL COMMENT '课程ID',
    student_id     VARCHAR(64)  NOT NULL COMMENT '被评价学生ID',
    session_number INT          NOT NULL DEFAULT 1 COMMENT '第N次评价',
    type           VARCHAR(32)  NOT NULL DEFAULT 'self' COMMENT 'self/intra_group/inter_group/teacher/mentor',
    score          DECIMAL(5,1) NULL COMMENT '得分 0-100',
    evaluator_id   VARCHAR(64)  DEFAULT '' COMMENT '评价人ID',
    evaluator_name VARCHAR(64)  DEFAULT '' COMMENT '评价人姓名',
    comment        TEXT         NULL COMMENT '评语',
    created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_course (course_id),
    KEY idx_student (student_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '课程评价';
