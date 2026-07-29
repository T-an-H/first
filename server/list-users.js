/**
 * 临时脚本：列出所有账号
 */
import pool from './db.js';

async function main() {
  try {
    const [rows] = await pool.execute(
      "SELECT id, account, name, role, sub_role FROM users ORDER BY FIELD(role, 'admin', 'teacher', 'student'), id"
    );
    console.table(rows);
  } catch (e) {
    console.error('查询失败:', e.message);
  }
  await pool.end();
  process.exit(0);
}

main();
