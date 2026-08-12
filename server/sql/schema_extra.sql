-- ============================================================
-- Express 后端(course_platform) 教师端扩展数据表
-- 新增表：todos / notes / online_docs / student_tiers
-- 补充：eval_reminders（eval.js 已引用，确保存在）
-- 执行方式: mysql -uroot -p < schema_extra.sql 或 Navicat 整段执行
-- 幂等：IF NOT EXISTS，可重复执行
-- ============================================================

USE course_platform;

-- ------------------------------------------------------------
-- 待办事项 todos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS todos (
  id         VARCHAR(64)  NOT NULL COMMENT '主键（前端生成，如 todo-xxx）',
  title      VARCHAR(255) NOT NULL COMMENT '待办标题',
  completed  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否完成 0/1',
  created_at VARCHAR(64)  DEFAULT '' COMMENT '创建时间',
  due_date   VARCHAR(64)  DEFAULT '' COMMENT '截止时间',
  created_by VARCHAR(64)  DEFAULT '' COMMENT '创建人',
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '待办事项';

-- ------------------------------------------------------------
-- 笔记 notes（attachments 为 JSON 数组）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id          VARCHAR(64)  NOT NULL COMMENT '主键（前端生成，如 note-xxx）',
  title       VARCHAR(255) NOT NULL COMMENT '笔记标题',
  content     TEXT         NULL COMMENT '正文',
  created_at  VARCHAR(64)  DEFAULT '' COMMENT '创建时间',
  updated_at  VARCHAR(64)  DEFAULT '' COMMENT '更新时间',
  created_by  VARCHAR(64)  DEFAULT '' COMMENT '创建人',
  attachments TEXT         NULL COMMENT '附件列表（JSON数组）',
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '笔记';

-- ------------------------------------------------------------
-- 在线文档 online_docs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS online_docs (
  id             VARCHAR(64)  NOT NULL COMMENT '主键（前端生成，如 doc-xxx）',
  title          VARCHAR(255) NOT NULL COMMENT '文档标题',
  content        LONGTEXT     NULL COMMENT '文档内容',
  created_by     VARCHAR(64)  DEFAULT '' COMMENT '创建人',
  created_at     VARCHAR(64)  DEFAULT '' COMMENT '创建时间',
  last_edited_at VARCHAR(64)  DEFAULT '' COMMENT '最后编辑时间',
  last_edited_by VARCHAR(64)  DEFAULT '' COMMENT '最后编辑人',
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '在线文档';

-- ------------------------------------------------------------
-- AI 分层记录 student_tiers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_tiers (
  id         VARCHAR(64)  NOT NULL COMMENT '主键（前端生成，如 tier-xxx）',
  course_id  VARCHAR(64)  NOT NULL COMMENT '课程ID',
  student_id VARCHAR(64)  NOT NULL COMMENT '学生ID',
  tier       VARCHAR(16)  NOT NULL DEFAULT 'basic' COMMENT 'basic/advanced/excellent',
  score      DECIMAL(5,1) NOT NULL DEFAULT 0 COMMENT '分层得分',
  created_at VARCHAR(64)  DEFAULT '' COMMENT '分层时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_course_student (course_id, student_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = 'AI分层记录';

-- ------------------------------------------------------------
-- 评价提醒 eval_reminders（保证存在）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eval_reminders (
  id             VARCHAR(64)  NOT NULL COMMENT '主键',
  course_id      VARCHAR(64)  NOT NULL COMMENT '课程ID',
  course_title   VARCHAR(200) DEFAULT '' COMMENT '课程标题',
  student_id     VARCHAR(64)  NOT NULL COMMENT '学生ID',
  session_number INT          NOT NULL DEFAULT 1 COMMENT '第N次评价',
  deadline       VARCHAR(64)  DEFAULT '' COMMENT '截止时间',
  status         VARCHAR(16)  NOT NULL DEFAULT 'pending' COMMENT 'pending/completed/overdue',
  PRIMARY KEY (id),
  KEY idx_course (course_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '评价提醒';
