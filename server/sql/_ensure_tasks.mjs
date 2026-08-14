// 临时脚本：在 course_db 创建任务相关表（幂等）
import mysql from 'mysql2/promise';

const pool = await mysql.createPool({ host: 'localhost', port: 3306, user: 'root', password: '123456', database: 'course_db' });

const sql1 = `
CREATE TABLE IF NOT EXISTS course_task (
  id          VARCHAR(64)  NOT NULL COMMENT '主键（前端生成，如 task-xxx）',
  course_id   VARCHAR(64)  NOT NULL COMMENT '课程ID',
  title       VARCHAR(255) NOT NULL COMMENT '任务标题',
  description TEXT         NULL COMMENT '简单介绍',
  attachments TEXT         NULL COMMENT '教师附件（JSON数组 [{name,size}]）',
  created_by  VARCHAR(64)  DEFAULT '' COMMENT '创建人',
  created_at  VARCHAR(64)  DEFAULT '' COMMENT '创建时间',
  updated_at  VARCHAR(64)  DEFAULT '' COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_task_course (course_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '课程任务'`;

const sql2 = `
CREATE TABLE IF NOT EXISTS course_task_submission (
  id          VARCHAR(64)  NOT NULL COMMENT '主键（前端生成，如 sub-xxx）',
  task_id     VARCHAR(64)  NOT NULL COMMENT '任务ID',
  student_id  VARCHAR(64)  NOT NULL COMMENT '学生ID（内部id）',
  attachments TEXT         NULL COMMENT '学生上传资料（JSON数组 [{name,size}]）',
  score       DECIMAL(5,1) NULL COMMENT '评分 0-100',
  graded_by   VARCHAR(64)  DEFAULT '' COMMENT '评分人（教师/导师名称）',
  status      VARCHAR(16)  NOT NULL DEFAULT 'submitted' COMMENT 'submitted/graded',
  created_at  VARCHAR(64)  DEFAULT '' COMMENT '提交时间',
  updated_at  VARCHAR(64)  DEFAULT '' COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_sub_task (task_id),
  KEY idx_sub_student (student_id),
  UNIQUE KEY uk_task_student (task_id, student_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '任务提交'`;

await pool.query(sql1);
await pool.query(sql2);
const [tables] = await pool.query("SHOW TABLES LIKE 'course_task%'");
console.log('Tables:', tables.map((r) => Object.values(r)[0]).join(', '));
await pool.end();
