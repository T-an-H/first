/**
 * 基础数据版本号 — 修改后自动清除 localStorage 旧数据
 *
 * 学院/班级/分类/教师/导师/领导 等基础数据已建表迁移至 course_db（Java 后端 8080），
 * 由 store 的 initFromDatabase() 从数据库拉取，此处不再提供 mock 数据。
 */
export const MOCK_VERSION = '4.2';
