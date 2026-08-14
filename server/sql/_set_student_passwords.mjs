/**
 * 一次性脚本：为学生表初始化 bcryptjs 密码（空密码的学生统一设为 123456）
 * 仅用于端到端联调，验证学生登录/提交/评分链路
 */
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const PASSWORD = '123456';
const salt = await bcrypt.genSalt(10);
const hashed = await bcrypt.hash(PASSWORD, salt);

const [rows] = await pool.execute(
  'SELECT id, student_id, name FROM student WHERE password IS NULL OR password = \'\''
);
console.log(`待初始化密码学生数: ${rows.length}`);
for (const r of rows) {
  await pool.execute('UPDATE student SET password = ? WHERE id = ?', [hashed, r.id]);
  console.log(`  - ${r.student_id} ${r.name} -> ${PASSWORD}`);
}
await pool.end();
console.log('完成');
