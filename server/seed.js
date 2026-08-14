/**
 * 种子脚本：向数据库插入测试学生数据
 *
 * 运行方式: cd server && node seed.js
 */
import bcrypt from 'bcryptjs';
import pool from './db.js';

async function seed() {
  try {
    console.log('🌱 开始插入测试数据...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const classes = [
      { name: '计算机2101班', department: '计算机学院', count: 12 },
      { name: '计算机2102班', department: '计算机学院', count: 10 },
      { name: '软件工程2101班', department: '软件学院', count: 11 },
      { name: '软件工程2102班', department: '软件学院', count: 9 },
      { name: '数据科学2101班', department: '数据科学学院', count: 10 },
      { name: '人工智能2101班', department: '人工智能学院', count: 12 },
      { name: '网络安全2101班', department: '网络空间安全学院', count: 8 },
      { name: '物联网工程2101班', department: '计算机学院', count: 9 },
    ];

    const surnames = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗'];
    const givenNames = [
      '明', '华', '芳', '磊', '静', '洋', '丽', '杰', '婷', '凯',
      '伟', '雪', '强', '敏', '飞', '阳', '雪', '枫', '冲', '过',
      '小龙', '求败', '韦小宝', '乔峰', '语嫣', '承志', '无忌', '芷若', '语嫣',
      '浩然', '子轩', '梓涵', '欣怡', '雨桐', '思远', '天佑', '可昕', '佳琪',
      '梦瑶', '婉婷', '俊熙', '皓轩', '博文', '雅婷', '若曦', '子墨', '梓萱',
      '宇航', '思琪', '雨泽', '致远', '晨曦', '皓宇', '紫涵', '诗涵', '天佑',
    ];

    const testStudents = [];
    let idCounter = 1;

    for (const cls of classes) {
      for (let i = 0; i < cls.count; i++) {
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
        const fullName = surname + givenName;

        const studentId = `S2024${String(idCounter).padStart(3, '0')}`;
        const phone = `138${String(Math.floor(10000000 + Math.random() * 89999999)).slice(0, 4)}${String(Math.floor(10000000 + Math.random() * 89999999)).slice(0, 4)}`;
        const email = `${studentId.toLowerCase()}@example.com`;

        testStudents.push({
          student_id: studentId,
          name: fullName,
          password: hashedPassword,
          phone,
          email,
          class_name: cls.name,
          department: cls.department,
          status: Math.random() > 0.05 ? 'active' : 'inactive',
        });

        idCounter++;
      }
    }

    // 清空现有学生数据后重新插入
    console.log('🗑️ 清空现有学生数据...');
    await pool.execute('DELETE FROM students');

    let inserted = 0;
    for (const s of testStudents) {
      try {
        await pool.execute(
          `INSERT INTO students (id, student_id, name, password, phone, email, class_name, department, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.student_id, s.student_id, s.name, s.password, s.phone, s.email, s.class_name, s.department, s.status]
        );
        inserted++;
      } catch (err) {
        console.warn(`  ⚠️  跳过 ${s.student_id} (${s.name}): ${err.message}`);
      }
    }

    console.log(`✅ 成功插入 ${inserted} 个测试学生`);
    console.log(`📌 所有测试账号密码均为: 123456`);
    console.log(`📌 班级列表:`);
    for (const cls of classes) {
      console.log(`   · ${cls.name} (${cls.department}) - ${cls.count} 人`);
    }

    // 统计班级人数
    const [rows] = await pool.execute(
      'SELECT class_name AS name, COUNT(*) AS count FROM students GROUP BY class_name ORDER BY class_name'
    );
    console.log('\n📊 班级人数统计:');
    for (const r of rows) {
      console.log(`   ${r.name}: ${r.count} 人`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 种子数据插入失败:', error);
    process.exit(1);
  }
}

seed();
