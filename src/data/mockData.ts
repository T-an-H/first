import type { Category, Course, Student, Schedule, Enrollment, Teacher, Grade, Evaluation, EvaluationConfig, StudentGroup, Mentor, Leader } from '@/types';

export const categories: Category[] = [
  { id: 'cat-1', name: '编程开发', color: '#3b82f6', courseCount: 8 },
  { id: 'cat-2', name: '数据科学', color: '#10b981', courseCount: 4 },
  { id: 'cat-3', name: '设计创意', color: '#f59e0b', courseCount: 3 },
  { id: 'cat-4', name: '商务管理', color: '#8b5cf6', courseCount: 4 },
  { id: 'cat-5', name: '语言学习', color: '#ec4899', courseCount: 3 },
];

export const courses: Course[] = [
  { id: 'course-1', title: 'React 前端开发实战', description: '从零到一掌握 React 18 核心特性，包括 Hooks、Context、Suspense 等高级用法，完成企业级项目开发。', categoryId: 'cat-1', cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop', credits: 6, duration: 48, status: 'active', createdAt: '2026-06-01', teacher: '王老师', mentor: '张导师' },
  { id: 'course-2', title: 'Python 数据分析入门', description: '学习 Python 数据处理、分析和可视化，掌握 Pandas、NumPy、Matplotlib 等核心库。', categoryId: 'cat-2', cover: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=300&fit=crop', credits: 5, duration: 36, status: 'active', createdAt: '2026-06-05', teacher: '李老师' },
  { id: 'course-3', title: 'UI/UX 设计思维', description: '系统学习用户体验设计流程，从用户研究到原型设计，打造令人惊艳的产品体验。', categoryId: 'cat-3', cover: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop', credits: 4, duration: 32, status: 'active', createdAt: '2026-06-10', teacher: '陈老师' },
  { id: 'course-4', title: 'TypeScript 高级编程', description: '深入 TypeScript 类型系统、泛型、装饰器、条件类型等高级特性，提升代码质量。', categoryId: 'cat-1', cover: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=300&fit=crop', credits: 5, duration: 40, status: 'active', createdAt: '2026-06-15', teacher: '王老师' },
  { id: 'course-5', title: '机器学习基础', description: '掌握机器学习核心算法，包括线性回归、决策树、SVM、神经网络等，理论与实践结合。', categoryId: 'cat-2', cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop', credits: 7, duration: 56, status: 'active', createdAt: '2026-06-20', teacher: '张老师' },
  { id: 'course-6', title: '项目管理实战', description: '学习敏捷开发、Scrum 框架、项目规划与风险管理，提升团队协作效率。', categoryId: 'cat-4', cover: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop', credits: 4, duration: 28, status: 'active', createdAt: '2026-07-01', teacher: '刘老师' },
  { id: 'course-7', title: 'Node.js 后端开发', description: '使用 Node.js + Express 构建 RESTful API，掌握数据库设计、认证授权、部署运维。', categoryId: 'cat-1', cover: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop', credits: 6, duration: 44, status: 'inactive', createdAt: '2026-07-05', teacher: '王老师' },
  { id: 'course-8', title: 'SQL 数据库设计', description: '从基础 SQL 到高级查询优化，掌握关系型数据库设计与性能调优。', categoryId: 'cat-2', cover: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=300&fit=crop', credits: 3, duration: 24, status: 'draft', createdAt: '2026-07-08', teacher: '李老师' },
  { id: 'course-9', title: 'Photoshop 图像处理', description: '从基础工具到高级合成技巧，掌握商业级图像处理技能。', categoryId: 'cat-3', cover: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop', credits: 3, duration: 20, status: 'active', createdAt: '2026-07-10', teacher: '陈老师' },
  { id: 'course-10', title: '商务英语沟通', description: '提升职场英语听说读写能力，涵盖商务会议、邮件写作、演讲表达等场景。', categoryId: 'cat-5', cover: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop', credits: 4, duration: 32, status: 'active', createdAt: '2026-07-12', teacher: '赵老师' },
  { id: 'course-11', title: 'Vue 3 组合式 API', description: '深入学习 Vue 3 Composition API、Pinia 状态管理、Vite 构建工具，构建现代化前端应用。', categoryId: 'cat-1', cover: 'https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=400&h=300&fit=crop', credits: 5, duration: 36, status: 'active', createdAt: '2026-07-15', teacher: '王老师' },
  { id: 'course-12', title: '日语初级入门', description: '从五十音图开始，系统学习日语语法、词汇和日常会话，达到N5水平。', categoryId: 'cat-5', cover: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=300&fit=crop', credits: 4, duration: 28, status: 'active', createdAt: '2026-07-16', teacher: '孙老师' },
  { id: 'course-13', title: '领导力与团队管理', description: '培养卓越领导力，学习团队激励、冲突处理、决策制定等管理技能。', categoryId: 'cat-4', cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', credits: 3, duration: 24, status: 'draft', createdAt: '2026-07-17', teacher: '刘老师' },
  { id: 'course-14', title: 'AI 生成式应用开发', description: '结合大模型与前端/后端能力，快速构建智能问答、内容生成与自动化助手。', categoryId: 'cat-1', cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop', credits: 5, duration: 40, status: 'active', createdAt: '2026-07-18', teacher: '周老师' },
  { id: 'course-15', title: '数据可视化与商业分析', description: '学习如何将复杂数据转化为直观报表和交互式可视化，提升决策表达能力。', categoryId: 'cat-2', cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop', credits: 4, duration: 32, status: 'active', createdAt: '2026-07-19', teacher: '钱老师' },
  { id: 'course-16', title: '高效沟通与表达训练', description: '提升会议汇报、演讲展示和跨部门沟通能力，适合职场与学习场景。', categoryId: 'cat-4', cover: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop', credits: 3, duration: 24, status: 'active', createdAt: '2026-07-20', teacher: '吴老师' },
  { id: 'course-17', title: '英语口语进阶训练', description: '从日常口语到商务场景表达，帮助学员建立更自信的英语交流习惯。', categoryId: 'cat-5', cover: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop', credits: 4, duration: 28, status: 'active', createdAt: '2026-07-21', teacher: '孙老师' },
  { id: 'course-18', title: 'Docker 容器化部署', description: '掌握 Docker 容器技术，包括镜像构建、容器编排、Docker Compose 和 Kubernetes 基础，实现高效的应用部署。', categoryId: 'cat-1', cover: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&h=300&fit=crop', credits: 4, duration: 32, status: 'active', createdAt: '2026-07-22', teacher: '周老师' },
  { id: 'course-19', title: '微服务架构设计', description: '学习微服务拆分原则、服务注册发现、API 网关、配置中心、分布式事务等微服务核心架构设计。', categoryId: 'cat-1', cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop', credits: 5, duration: 40, status: 'active', createdAt: '2026-07-23', teacher: '钱老师' },
  { id: 'course-20', title: '产品经理实战', description: '从需求分析到产品上线，系统学习产品经理工作流程，掌握用户调研、原型设计、数据分析等核心技能。', categoryId: 'cat-4', cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', credits: 4, duration: 28, status: 'active', createdAt: '2026-07-24', teacher: '吴老师' },
];

export const students: Student[] = [
  { id: 'stu-1', name: '张明', studentId: '2024001', className: '1班', phone: '138****1234', email: 'zhangming@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming', joinDate: '2026-06-01', status: 'active', enrollmentScore: 645 },
  { id: 'stu-2', name: '李华', studentId: '2024002', className: '1班', phone: '139****5678', email: 'lihua@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua', joinDate: '2026-06-03', status: 'active', enrollmentScore: 580 },
  { id: 'stu-3', name: '王芳', studentId: '2024003', className: '1班', phone: '137****9012', email: 'wangfang@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang', joinDate: '2026-06-05', status: 'active', enrollmentScore: 620 },
  { id: 'stu-4', name: '赵磊', studentId: '2024004', className: '1班', phone: '136****3456', email: 'zhaolei@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaolei', joinDate: '2026-06-08', status: 'active', enrollmentScore: 550 },
  { id: 'stu-5', name: '陈静', studentId: '2024005', className: '1班', phone: '135****7890', email: 'chenjing@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenjing', joinDate: '2026-06-10', status: 'active', enrollmentScore: 670 },
  { id: 'stu-6', name: '刘洋', studentId: '2024006', className: '1班', phone: '134****2345', email: 'liuyang@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyang', joinDate: '2026-06-12', status: 'active', enrollmentScore: 530 },
  { id: 'stu-7', name: '孙丽', studentId: '2024007', className: '1班', phone: '133****6789', email: 'sunli@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunli', joinDate: '2026-06-15', status: 'active', enrollmentScore: 600 },
  { id: 'stu-8', name: '周杰', studentId: '2024008', className: '1班', phone: '132****0123', email: 'zhoujie@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoujie', joinDate: '2026-06-18', status: 'inactive', enrollmentScore: 480 },
  { id: 'stu-9', name: '吴婷', studentId: '2024009', className: '2班', phone: '131****4567', email: 'wuting@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wuting', joinDate: '2026-06-20', status: 'active', enrollmentScore: 610 },
  { id: 'stu-10', name: '郑凯', studentId: '2024010', className: '2班', phone: '130****8901', email: 'zhengkai@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengkai', joinDate: '2026-06-22', status: 'active', enrollmentScore: 520 },
  { id: 'stu-11', name: '黄丽', studentId: '2024011', className: '2班', phone: '159****2345', email: 'huangli@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huangli', joinDate: '2026-06-25', status: 'active', enrollmentScore: 640 },
  { id: 'stu-12', name: '林伟', studentId: '2024012', className: '2班', phone: '158****6789', email: 'linwei@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linwei', joinDate: '2026-06-28', status: 'active', enrollmentScore: 500 },
  { id: 'stu-13', name: '何雪', studentId: '2024013', className: '2班', phone: '157****0123', email: 'hexue@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hexue', joinDate: '2026-07-01', status: 'active', enrollmentScore: 665 },
  { id: 'stu-14', name: '马强', studentId: '2024014', className: '2班', phone: '156****4567', email: 'maqiang@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maqiang', joinDate: '2026-07-03', status: 'inactive', enrollmentScore: 460 },
  { id: 'stu-15', name: '胡敏', studentId: '2024015', className: '2班', phone: '155****8901', email: 'humin@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=humin', joinDate: '2026-07-05', status: 'active', enrollmentScore: 590 },
  { id: 'stu-16', name: '高飞', studentId: '2024016', className: '2班', phone: '154****2345', email: 'gaofei@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gaofei', joinDate: '2026-07-08', status: 'active', enrollmentScore: 565 },
  { id: 'stu-17', name: '欧阳雪', studentId: '2024017', className: '3班', phone: '153****1234', email: 'ouyangxue@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ouyangxue', joinDate: '2026-07-10', status: 'active', enrollmentScore: 685 },
  { id: 'stu-18', name: '慕容枫', studentId: '2024018', className: '3班', phone: '152****5678', email: 'murongfeng@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=murongfeng', joinDate: '2026-07-12', status: 'active', enrollmentScore: 630 },
  { id: 'stu-19', name: '令狐冲', studentId: '2024019', className: '3班', phone: '151****9012', email: 'linghuchong@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linghuchong', joinDate: '2026-07-14', status: 'active', enrollmentScore: 590 },
  { id: 'stu-20', name: '杨过', studentId: '2024020', className: '3班', phone: '150****3456', email: 'yangguo@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yangguo', joinDate: '2026-07-16', status: 'active', enrollmentScore: 540 },
  { id: 'stu-21', name: '小龙女', studentId: '2024021', className: '3班', phone: '149****7890', email: 'xiaolongnv@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaolongnv', joinDate: '2026-07-18', status: 'active', enrollmentScore: 610 },
  { id: 'stu-22', name: '独孤求败', studentId: '2024022', className: '3班', phone: '148****0001', email: 'dugu@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dugu', joinDate: '2026-07-20', status: 'active', enrollmentScore: 720 },
  { id: 'stu-23', name: '韦小宝', studentId: '2024023', className: '3班', phone: '147****0002', email: 'weixb@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=weixiaobao', joinDate: '2026-07-20', status: 'active', enrollmentScore: 420 },
  { id: 'stu-24', name: '乔峰', studentId: '2024024', className: '3班', phone: '146****0003', email: 'qiaofeng@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qiaofeng', joinDate: '2026-07-20', status: 'active', enrollmentScore: 680 },
];

export const schedules: Schedule[] = [
  { id: 'sch-1', courseId: 'course-1', title: 'React 前端开发实战', startDate: '2026-06-25', endDate: '2026-06-25', timeSlot: '09:00-11:00', room: 'A101', teacher: '王老师' },
  { id: 'sch-2', courseId: 'course-2', title: 'Python 数据分析入门', startDate: '2026-06-26', endDate: '2026-06-26', timeSlot: '14:00-16:00', room: 'A102', teacher: '李老师' },
  { id: 'sch-3', courseId: 'course-3', title: 'UI/UX 设计思维', startDate: '2026-06-27', endDate: '2026-06-27', timeSlot: '09:00-12:00', room: 'B201', teacher: '陈老师' },
  { id: 'sch-4', courseId: 'course-4', title: 'TypeScript 高级编程', startDate: '2026-06-28', endDate: '2026-06-28', timeSlot: '14:00-17:00', room: 'A101', teacher: '王老师' },
  { id: 'sch-5', courseId: 'course-5', title: '机器学习基础', startDate: '2026-06-29', endDate: '2026-06-29', timeSlot: '09:00-12:00', room: 'C301', teacher: '张老师' },
  { id: 'sch-6', courseId: 'course-1', title: 'React 前端开发实战', startDate: '2026-06-29', endDate: '2026-06-29', timeSlot: '14:00-16:00', room: 'A101', teacher: '王老师' },
  { id: 'sch-7', courseId: 'course-6', title: '项目管理实战', startDate: '2026-06-30', endDate: '2026-06-30', timeSlot: '09:00-11:00', room: 'B202', teacher: '刘老师' },
  { id: 'sch-8', courseId: 'course-9', title: 'Photoshop 图像处理', startDate: '2026-06-30', endDate: '2026-06-30', timeSlot: '14:00-17:00', room: 'B201', teacher: '陈老师' },
  { id: 'sch-9', courseId: 'course-10', title: '商务英语沟通', startDate: '2026-07-01', endDate: '2026-07-01', timeSlot: '09:00-11:00', room: 'A102', teacher: '赵老师' },
  { id: 'sch-10', courseId: 'course-11', title: 'Vue 3 组合式 API', startDate: '2026-07-02', endDate: '2026-07-02', timeSlot: '14:00-16:00', room: 'A101', teacher: '王老师' },
  { id: 'sch-11', courseId: 'course-12', title: '日语初级入门', startDate: '2026-07-03', endDate: '2026-07-03', timeSlot: '09:00-11:00', room: 'A102', teacher: '孙老师' },
  { id: 'sch-12', courseId: 'course-5', title: '机器学习基础', startDate: '2026-07-03', endDate: '2026-07-03', timeSlot: '14:00-17:00', room: 'C301', teacher: '张老师' },
  { id: 'sch-13', courseId: 'course-2', title: 'Python 数据分析入门', startDate: '2026-07-04', endDate: '2026-07-04', timeSlot: '09:00-11:00', room: 'A102', teacher: '李老师' },
  { id: 'sch-14', courseId: 'course-3', title: 'UI/UX 设计思维', startDate: '2026-07-05', endDate: '2026-07-05', timeSlot: '14:00-17:00', room: 'B201', teacher: '陈老师' },
  { id: 'sch-15', courseId: 'course-4', title: 'TypeScript 高级编程', startDate: '2026-07-06', endDate: '2026-07-06', timeSlot: '09:00-12:00', room: 'A101', teacher: '王老师' },
  { id: 'sch-16', courseId: 'course-6', title: '项目管理实战', startDate: '2026-07-06', endDate: '2026-07-06', timeSlot: '14:00-16:00', room: 'B202', teacher: '刘老师' },
  { id: 'sch-17', courseId: 'course-1', title: 'React 前端开发实战', startDate: '2026-07-07', endDate: '2026-07-07', timeSlot: '09:00-11:00', room: 'A101', teacher: '王老师' },
  { id: 'sch-18', courseId: 'course-9', title: 'Photoshop 图像处理', startDate: '2026-07-08', endDate: '2026-07-08', timeSlot: '09:00-12:00', room: 'B201', teacher: '陈老师' },
  { id: 'sch-19', courseId: 'course-10', title: '商务英语沟通', startDate: '2026-07-09', endDate: '2026-07-09', timeSlot: '14:00-16:00', room: 'A102', teacher: '赵老师' },
  { id: 'sch-20', courseId: 'course-11', title: 'Vue 3 组合式 API', startDate: '2026-07-10', endDate: '2026-07-10', timeSlot: '09:00-11:00', room: 'A101', teacher: '王老师' },
  { id: 'sch-21', courseId: 'course-12', title: '日语初级入门', startDate: '2026-07-11', endDate: '2026-07-11', timeSlot: '14:00-16:00', room: 'A102', teacher: '孙老师' },
  { id: 'sch-22', courseId: 'course-5', title: '机器学习基础', startDate: '2026-07-12', endDate: '2026-07-12', timeSlot: '09:00-12:00', room: 'C301', teacher: '张老师' },
  { id: 'sch-23', courseId: 'course-14', title: 'AI 生成式应用开发', startDate: '2026-07-13', endDate: '2026-07-13', timeSlot: '09:00-11:00', room: 'D401', teacher: '郑老师' },
  { id: 'sch-24', courseId: 'course-15', title: '数据可视化与商业分析', startDate: '2026-07-14', endDate: '2026-07-14', timeSlot: '14:00-16:00', room: 'C302', teacher: '钱老师' },
  { id: 'sch-25', courseId: 'course-16', title: '高效沟通与表达训练', startDate: '2026-07-15', endDate: '2026-07-15', timeSlot: '09:00-10:30', room: 'B203', teacher: '吴老师' },
  { id: 'sch-26', courseId: 'course-17', title: '英语口语进阶训练', startDate: '2026-07-16', endDate: '2026-07-16', timeSlot: '13:30-15:00', room: 'A103', teacher: '孙老师' },
  { id: 'sch-27', courseId: 'course-18', title: 'Docker 容器化部署', startDate: '2026-07-17', endDate: '2026-07-17', timeSlot: '09:00-11:00', room: 'D401', teacher: '郑老师' },
  { id: 'sch-28', courseId: 'course-19', title: '微服务架构设计', startDate: '2026-07-18', endDate: '2026-07-18', timeSlot: '14:00-17:00', room: 'D402', teacher: '郑老师' },
  { id: 'sch-29', courseId: 'course-20', title: '产品经理实战', startDate: '2026-07-19', endDate: '2026-07-19', timeSlot: '09:00-11:00', room: 'B203', teacher: '吴老师' },
];

export const enrollments: Enrollment[] = [
  { id: 'enr-1', studentId: 'stu-1', courseId: 'course-1', scheduleId: 'sch-1', enrollDate: '2026-07-01', progress: 65, status: 'in_progress' },
  { id: 'enr-2', studentId: 'stu-2', courseId: 'course-1', scheduleId: 'sch-1', enrollDate: '2026-07-01', progress: 70, status: 'in_progress' },
  { id: 'enr-3', studentId: 'stu-3', courseId: 'course-2', scheduleId: 'sch-2', enrollDate: '2026-07-02', progress: 40, status: 'in_progress' },
  { id: 'enr-4', studentId: 'stu-4', courseId: 'course-2', scheduleId: 'sch-2', enrollDate: '2026-07-02', progress: 35, status: 'in_progress' },
  { id: 'enr-5', studentId: 'stu-5', courseId: 'course-3', scheduleId: 'sch-3', enrollDate: '2026-07-03', progress: 50, status: 'in_progress' },
  { id: 'enr-6', studentId: 'stu-1', courseId: 'course-4', scheduleId: 'sch-4', enrollDate: '2026-07-05', progress: 20, status: 'in_progress' },
  { id: 'enr-7', studentId: 'stu-6', courseId: 'course-4', scheduleId: 'sch-4', enrollDate: '2026-07-05', progress: 25, status: 'in_progress' },
  { id: 'enr-8', studentId: 'stu-7', courseId: 'course-5', scheduleId: 'sch-5', enrollDate: '2026-07-06', progress: 15, status: 'in_progress' },
  { id: 'enr-9', studentId: 'stu-8', courseId: 'course-5', scheduleId: 'sch-5', enrollDate: '2026-07-06', progress: 100, status: 'completed' },
  { id: 'enr-10', studentId: 'stu-9', courseId: 'course-6', scheduleId: 'sch-7', enrollDate: '2026-07-08', progress: 10, status: 'in_progress' },
  { id: 'enr-11', studentId: 'stu-10', courseId: 'course-9', scheduleId: 'sch-8', enrollDate: '2026-07-10', progress: 0, status: 'enrolled' },
  { id: 'enr-12', studentId: 'stu-11', courseId: 'course-10', scheduleId: 'sch-9', enrollDate: '2026-07-12', progress: 0, status: 'enrolled' },
  { id: 'enr-13', studentId: 'stu-12', courseId: 'course-11', scheduleId: 'sch-10', enrollDate: '2026-07-13', progress: 0, status: 'enrolled' },
  { id: 'enr-14', studentId: 'stu-13', courseId: 'course-12', scheduleId: 'sch-11', enrollDate: '2026-07-14', progress: 0, status: 'enrolled' },
  { id: 'enr-15', studentId: 'stu-14', courseId: 'course-3', scheduleId: 'sch-3', enrollDate: '2026-07-03', progress: 100, status: 'completed' },
  { id: 'enr-16', studentId: 'stu-15', courseId: 'course-1', scheduleId: 'sch-1', enrollDate: '2026-07-01', progress: 80, status: 'in_progress' },
  { id: 'enr-17', studentId: 'stu-16', courseId: 'course-2', scheduleId: 'sch-2', enrollDate: '2026-07-02', progress: 60, status: 'in_progress' },
  { id: 'enr-18', studentId: 'stu-2', courseId: 'course-5', scheduleId: 'sch-5', enrollDate: '2026-07-06', progress: 30, status: 'in_progress' },
  { id: 'enr-19', studentId: 'stu-4', courseId: 'course-6', scheduleId: 'sch-7', enrollDate: '2026-07-08', progress: 5, status: 'in_progress' },
  { id: 'enr-20', studentId: 'stu-7', courseId: 'course-10', scheduleId: 'sch-9', enrollDate: '2026-07-12', progress: 0, status: 'enrolled' },
  { id: 'enr-21', studentId: 'stu-1', courseId: 'course-14', scheduleId: 'sch-23', enrollDate: '2026-07-18', progress: 45, status: 'in_progress' },
  { id: 'enr-22', studentId: 'stu-1', courseId: 'course-15', scheduleId: 'sch-24', enrollDate: '2026-07-19', progress: 75, status: 'in_progress' },
  { id: 'enr-23', studentId: 'stu-1', courseId: 'course-16', scheduleId: 'sch-25', enrollDate: '2026-07-20', progress: 30, status: 'in_progress' },
  { id: 'enr-24', studentId: 'stu-2', courseId: 'course-17', scheduleId: 'sch-26', enrollDate: '2026-07-21', progress: 60, status: 'in_progress' },
  { id: 'enr-25', studentId: 'stu-17', courseId: 'course-14', scheduleId: 'sch-23', enrollDate: '2026-07-20', progress: 20, status: 'in_progress' },
  { id: 'enr-26', studentId: 'stu-17', courseId: 'course-18', scheduleId: 'sch-27', enrollDate: '2026-07-22', progress: 0, status: 'enrolled' },
  { id: 'enr-27', studentId: 'stu-17', courseId: 'course-1', scheduleId: 'sch-1', enrollDate: '2026-07-20', progress: 55, status: 'in_progress' },
  { id: 'enr-28', studentId: 'stu-18', courseId: 'course-15', scheduleId: 'sch-24', enrollDate: '2026-07-21', progress: 30, status: 'in_progress' },
  { id: 'enr-29', studentId: 'stu-18', courseId: 'course-19', scheduleId: 'sch-28', enrollDate: '2026-07-23', progress: 0, status: 'enrolled' },
  { id: 'enr-30', studentId: 'stu-19', courseId: 'course-3', scheduleId: 'sch-3', enrollDate: '2026-07-21', progress: 40, status: 'in_progress' },
  { id: 'enr-31', studentId: 'stu-19', courseId: 'course-16', scheduleId: 'sch-25', enrollDate: '2026-07-22', progress: 15, status: 'in_progress' },
  { id: 'enr-32', studentId: 'stu-19', courseId: 'course-10', scheduleId: 'sch-9', enrollDate: '2026-07-22', progress: 0, status: 'enrolled' },
  { id: 'enr-33', studentId: 'stu-20', courseId: 'course-5', scheduleId: 'sch-5', enrollDate: '2026-07-22', progress: 10, status: 'in_progress' },
  { id: 'enr-34', studentId: 'stu-20', courseId: 'course-20', scheduleId: 'sch-29', enrollDate: '2026-07-24', progress: 0, status: 'enrolled' },
  { id: 'enr-35', studentId: 'stu-21', courseId: 'course-12', scheduleId: 'sch-11', enrollDate: '2026-07-22', progress: 0, status: 'enrolled' },
  { id: 'enr-36', studentId: 'stu-21', courseId: 'course-17', scheduleId: 'sch-26', enrollDate: '2026-07-23', progress: 0, status: 'enrolled' },
  { id: 'enr-37', studentId: 'stu-22', courseId: 'course-1', scheduleId: 'sch-1', enrollDate: '2026-07-20', progress: 90, status: 'in_progress' },
  { id: 'enr-38', studentId: 'stu-22', courseId: 'course-4', scheduleId: 'sch-4', enrollDate: '2026-07-20', progress: 85, status: 'in_progress' },
  { id: 'enr-39', studentId: 'stu-22', courseId: 'course-14', scheduleId: 'sch-23', enrollDate: '2026-07-20', progress: 75, status: 'in_progress' },
  { id: 'enr-40', studentId: 'stu-22', courseId: 'course-15', scheduleId: 'sch-24', enrollDate: '2026-07-20', progress: 80, status: 'in_progress' },
  { id: 'enr-41', studentId: 'stu-23', courseId: 'course-2', scheduleId: 'sch-2', enrollDate: '2026-07-20', progress: 15, status: 'in_progress' },
  { id: 'enr-42', studentId: 'stu-23', courseId: 'course-10', scheduleId: 'sch-9', enrollDate: '2026-07-20', progress: 5, status: 'in_progress' },
  { id: 'enr-43', studentId: 'stu-23', courseId: 'course-16', scheduleId: 'sch-25', enrollDate: '2026-07-20', progress: 0, status: 'enrolled' },
  { id: 'enr-44', studentId: 'stu-24', courseId: 'course-1', scheduleId: 'sch-1', enrollDate: '2026-07-20', progress: 60, status: 'in_progress' },
  { id: 'enr-45', studentId: 'stu-24', courseId: 'course-5', scheduleId: 'sch-5', enrollDate: '2026-07-20', progress: 40, status: 'in_progress' },
  { id: 'enr-46', studentId: 'stu-24', courseId: 'course-11', scheduleId: 'sch-10', enrollDate: '2026-07-20', progress: 25, status: 'in_progress' },
  { id: 'enr-47', studentId: 'stu-24', courseId: 'course-18', scheduleId: 'sch-27', enrollDate: '2026-07-20', progress: 0, status: 'enrolled' },
];

export const teachers: Teacher[] = [
  { id: 't-1', name: '王老师', phone: '138****1001', email: 'wang@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', courseIds: ['course-1', 'course-4', 'course-7', 'course-11'] },
  { id: 't-2', name: '李老师', phone: '138****1002', email: 'li@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', courseIds: ['course-2', 'course-8'] },
  { id: 't-3', name: '陈老师', phone: '138****1003', email: 'chen@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen', courseIds: ['course-3', 'course-9'] },
  { id: 't-4', name: '张老师', phone: '138****1004', email: 'zhang@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', courseIds: ['course-5'] },
  { id: 't-5', name: '刘老师', phone: '138****1005', email: 'liu@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu', courseIds: ['course-6', 'course-13'] },
  { id: 't-6', name: '赵老师', phone: '138****1006', email: 'zhao@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao', courseIds: ['course-10'] },
  { id: 't-7', name: '孙老师', phone: '138****1007', email: 'sun@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun', courseIds: ['course-12', 'course-17'] },
  { id: 't-8', name: '周老师', phone: '138****1008', email: 'zhou@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou', courseIds: ['course-14', 'course-18'] },
  { id: 't-9', name: '钱老师', phone: '138****1009', email: 'qian@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qian', courseIds: ['course-15', 'course-19'] },
  { id: 't-10', name: '吴老师', phone: '138****1010', email: 'wu@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wu', courseIds: ['course-16', 'course-20'] },
  { id: 't-11', name: '郑老师', phone: '137****2011', email: 'zheng@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zheng', courseIds: ['course-14', 'course-18', 'course-19'] },
];

/** 企业导师 */
export const mentors: Mentor[] = [
  { id: 'm-1', name: '张导师', phone: '139****2001', email: 'zhangmentor@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmentor', courseIds: ['course-1', 'course-14'] },
  { id: 'm-2', name: '李导师', phone: '139****2002', email: 'limentor@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=limentor', courseIds: ['course-4', 'course-11'] },
  { id: 'm-3', name: '王导师', phone: '139****2003', email: 'wangmentor@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangmentor', courseIds: ['course-5', 'course-15'] },
  { id: 'm-4', name: '陈导师', phone: '139****2004', email: 'chenmentor@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenmentor', courseIds: ['course-3', 'course-20'] },
];

/** 学院领导 */
export const leaders: Leader[] = [
  { id: 'l-1', name: '刘院长', phone: '139****3001', email: 'liuhead@example.com', categoryIds: ['cat-1', 'cat-2'], asTeacher: true },
  { id: 'l-2', name: '陈院长', phone: '139****3002', email: 'chenhead@example.com', categoryIds: ['cat-3', 'cat-4', 'cat-5'], asMentor: false },
  { id: 'l-3', name: '张院长', phone: '139****3003', email: 'zhanghead@example.com', categoryIds: ['cat-1', 'cat-4'], asMentor: true },
  // 新增演示账号
  { id: 'l-4', name: '周院长', phone: '139****3004', email: 'zhouhead@example.com', categoryIds: ['cat-5'], asMentor: false },
  { id: 'l-5', name: '吴院长', phone: '139****3005', email: 'wuhead@example.com', categoryIds: ['cat-3'], asMentor: true },
  { id: 'l-6', name: '郑院长', phone: '139****3006', email: 'zhenghead@example.com', categoryIds: ['cat-1'], asTeacher: true },
];

export const grades: Grade[] = [
  { id: 'g-1', studentId: 'stu-1', courseId: 'course-1', score: 88, semester: '2026年', comment: '表现优秀', gradedAt: '2026-07-15' },
  { id: 'g-2', studentId: 'stu-2', courseId: 'course-1', score: 92, semester: '2026年', comment: '非常好', gradedAt: '2026-07-15' },
  { id: 'g-3', studentId: 'stu-3', courseId: 'course-2', score: 75, semester: '2026年', comment: '需要加强练习', gradedAt: '2026-07-16' },
  { id: 'g-4', studentId: 'stu-4', courseId: 'course-2', score: 80, semester: '2026年', comment: '良好', gradedAt: '2026-07-16' },
  { id: 'g-5', studentId: 'stu-5', courseId: 'course-3', score: 85, semester: '2026年', comment: '设计感不错', gradedAt: '2026-07-17' },
  { id: 'g-6', studentId: 'stu-8', courseId: 'course-5', score: 95, semester: '2026年', comment: '优秀学员', gradedAt: '2026-07-17' },
  { id: 'g-7', studentId: 'stu-14', courseId: 'course-3', score: 70, semester: '2026年', comment: '继续努力', gradedAt: '2026-07-15' },
  { id: 'g-8', studentId: 'stu-15', courseId: 'course-1', score: 90, semester: '2026年', comment: '很棒', gradedAt: '2026-07-16' },
  { id: 'g-9', studentId: 'stu-1', courseId: 'course-14', score: 86, semester: '2026年', comment: '具备较好的应用理解能力', gradedAt: '2026-07-22' },
  { id: 'g-10', studentId: 'stu-1', courseId: 'course-15', score: 91, semester: '2026年', comment: '数据分析能力突出', gradedAt: '2026-07-22' },
  { id: 'g-11', studentId: 'stu-1', courseId: 'course-16', score: 78, semester: '2026年', comment: '表达较清晰，继续加强节奏控制', gradedAt: '2026-07-23' },
  { id: 'g-12', studentId: 'stu-17', courseId: 'course-14', score: 82, semester: '2026年', comment: '应用能力较好，继续深入', gradedAt: '2026-07-25' },
  { id: 'g-13', studentId: 'stu-19', courseId: 'course-3', score: 76, semester: '2026年', comment: '设计基础扎实', gradedAt: '2026-07-24' },
  { id: 'g-14', studentId: 'stu-18', courseId: 'course-15', score: 88, semester: '2026年', comment: '数据分析能力出色', gradedAt: '2026-07-25' },
];

// ========== 评价系统 Mock 数据 ==========

export const evaluationConfigs: import('@/types').EvaluationConfig[] = [
  { courseId: 'course-1', template: 'all', frequency: 'biweekly', hasMentor: true, overdueRule: 'average' },
  { courseId: 'course-2', template: 'standard', frequency: 'per_unit', hasMentor: false, overdueRule: 'average' },
  { courseId: 'course-3', template: 'simple', frequency: 'biweekly', hasMentor: false, overdueRule: 'none' },
  { courseId: 'course-4', template: 'standard', frequency: 'biweekly', hasMentor: false, overdueRule: 'average' },
  { courseId: 'course-5', template: 'all', frequency: 'per_unit', hasMentor: true, overdueRule: 'average' },
  { courseId: 'course-6', template: 'simple', frequency: 'biweekly', hasMentor: false, overdueRule: 'none' },
  { courseId: 'course-9', template: 'standard', frequency: 'per_unit', hasMentor: false, overdueRule: 'average' },
  { courseId: 'course-10', template: 'simple', frequency: 'biweekly', hasMentor: false, overdueRule: 'none' },
  { courseId: 'course-11', template: 'standard', frequency: 'biweekly', hasMentor: false, overdueRule: 'average' },
  { courseId: 'course-12', template: 'simple', frequency: 'biweekly', hasMentor: false, overdueRule: 'none' },
  { courseId: 'course-14', template: 'project', frequency: 'project_milestone', hasMentor: true, overdueRule: 'average' },
  { courseId: 'course-15', template: 'standard', frequency: 'biweekly', hasMentor: false, overdueRule: 'average' },
  { courseId: 'course-16', template: 'simple', frequency: 'biweekly', hasMentor: false, overdueRule: 'none' },
  { courseId: 'course-17', template: 'standard', frequency: 'biweekly', hasMentor: false, overdueRule: 'average' },
  { courseId: 'course-18', template: 'project', frequency: 'project_milestone', hasMentor: true, overdueRule: 'average' },
  { courseId: 'course-19', template: 'project', frequency: 'project_milestone', hasMentor: true, overdueRule: 'average' },
  { courseId: 'course-20', template: 'standard', frequency: 'per_unit', hasMentor: false, overdueRule: 'average' },
];

export const studentGroups: import('@/types').StudentGroup[] = [
  { id: 'grp-1', courseId: 'course-1', name: '第一组', memberIds: ['stu-1', 'stu-2', 'stu-3', 'stu-4'] },
  { id: 'grp-2', courseId: 'course-1', name: '第二组', memberIds: ['stu-5', 'stu-6', 'stu-7', 'stu-8'] },
  { id: 'grp-3', courseId: 'course-1', name: '第三组', memberIds: ['stu-9', 'stu-10', 'stu-11', 'stu-12'] },
  { id: 'grp-4', courseId: 'course-1', name: '第四组', memberIds: ['stu-13', 'stu-15', 'stu-16'] },
  { id: 'grp-5', courseId: 'course-1', name: '第五组', memberIds: ['stu-17', 'stu-18', 'stu-19'] },
  { id: 'grp-6', courseId: 'course-2', name: 'A组', memberIds: ['stu-3', 'stu-4', 'stu-16'] },
  { id: 'grp-7', courseId: 'course-2', name: 'B组', memberIds: ['stu-6', 'stu-10', 'stu-12'] },
  { id: 'grp-8', courseId: 'course-3', name: '设计一组', memberIds: ['stu-5', 'stu-14', 'stu-19'] },
  { id: 'grp-9', courseId: 'course-4', name: 'TS学习小组', memberIds: ['stu-1', 'stu-6', 'stu-11'] },
  { id: 'grp-10', courseId: 'course-5', name: 'ML团队', memberIds: ['stu-7', 'stu-8', 'stu-20'] },
  { id: 'grp-11', courseId: 'course-14', name: 'A组', memberIds: ['stu-1', 'stu-17', 'stu-19'] },
  { id: 'grp-12', courseId: 'course-14', name: 'B组', memberIds: ['stu-2', 'stu-18', 'stu-20'] },
  { id: 'grp-13', courseId: 'course-14', name: 'C组', memberIds: ['stu-3', 'stu-5', 'stu-15'] },
  { id: 'grp-14', courseId: 'course-15', name: '数据分析组', memberIds: ['stu-1', 'stu-18', 'stu-21'] },
  { id: 'grp-15', courseId: 'course-16', name: '沟通训练组', memberIds: ['stu-1', 'stu-19'] },
  { id: 'grp-16', courseId: 'course-17', name: '英语学习组', memberIds: ['stu-2', 'stu-21'] },
  { id: 'grp-17', courseId: 'course-18', name: 'Docker实践组', memberIds: ['stu-17', 'stu-20'] },
  { id: 'grp-18', courseId: 'course-19', name: '架构设计组', memberIds: ['stu-1', 'stu-18'] },
  { id: 'grp-19', courseId: 'course-20', name: '产品组', memberIds: ['stu-20', 'stu-21'] },
];

export const evaluations: import('@/types').Evaluation[] = [
  // course-1（React）/ 第1次评价（1-2学时）/ 全评价模板
  { id: 'ev-1', courseId: 'course-1', studentId: 'stu-1', sessionNumber: 1, type: 'self', score: 85, evaluatorId: 'stu-1', evaluatorName: '张明', createdAt: '2026-07-10' },
  { id: 'ev-2', courseId: 'course-1', studentId: 'stu-1', sessionNumber: 1, type: 'intra_group', score: 80, evaluatorId: 'stu-2', evaluatorName: '李华', createdAt: '2026-07-10' },
  { id: 'ev-3', courseId: 'course-1', studentId: 'stu-1', sessionNumber: 1, type: 'inter_group', score: 78, evaluatorId: 'stu-5', evaluatorName: '王芳', createdAt: '2026-07-11' },
  { id: 'ev-4', courseId: 'course-1', studentId: 'stu-1', sessionNumber: 1, type: 'teacher', score: 82, evaluatorId: 't-1', evaluatorName: '王老师', comment: '基础知识掌握较好', createdAt: '2026-07-12' },
  { id: 'ev-5', courseId: 'course-1', studentId: 'stu-1', sessionNumber: 1, type: 'mentor', score: 80, evaluatorId: 'mentor-1', evaluatorName: '张总工', comment: '动手能力强', createdAt: '2026-07-13' },

  // course-1 / 第2次评价（3-4学时）
  { id: 'ev-6', courseId: 'course-1', studentId: 'stu-1', sessionNumber: 2, type: 'self', score: 90, evaluatorId: 'stu-1', evaluatorName: '张明', createdAt: '2026-07-14' },
  { id: 'ev-7', courseId: 'course-1', studentId: 'stu-1', sessionNumber: 2, type: 'teacher', score: 86, evaluatorId: 't-1', evaluatorName: '王老师', comment: '有进步', createdAt: '2026-07-15' },

  // course-2（Python）/ 标准评价（自评+教师+组间互评）
  { id: 'ev-8', courseId: 'course-2', studentId: 'stu-2', sessionNumber: 1, type: 'self', score: 70, evaluatorId: 'stu-2', evaluatorName: '李华', createdAt: '2026-07-12' },
  { id: 'ev-9', courseId: 'course-2', studentId: 'stu-2', sessionNumber: 1, type: 'teacher', score: 75, evaluatorId: 't-2', evaluatorName: '李老师', comment: '基础尚可，需加强练习', createdAt: '2026-07-13' },
  { id: 'ev-10', courseId: 'course-2', studentId: 'stu-2', sessionNumber: 1, type: 'inter_group', score: 68, evaluatorId: 'stu-5', evaluatorName: '王芳', createdAt: '2026-07-13' },

  // course-3（UI/UX）/ 简易评价（仅教师+自评）
  { id: 'ev-11', courseId: 'course-3', studentId: 'stu-3', sessionNumber: 1, type: 'self', score: 82, evaluatorId: 'stu-3', evaluatorName: '赵丽', createdAt: '2026-07-10' },
  { id: 'ev-12', courseId: 'course-3', studentId: 'stu-3', sessionNumber: 1, type: 'teacher', score: 75, evaluatorId: 't-3', evaluatorName: '陈老师', comment: '创意不错', createdAt: '2026-07-11' },

  // course-14（AI生成式）/ 项目制评价
  { id: 'ev-13', courseId: 'course-14', studentId: 'stu-1', sessionNumber: 1, type: 'self', score: 92, evaluatorId: 'stu-1', evaluatorName: '张明', createdAt: '2026-07-20' },
  { id: 'ev-14', courseId: 'course-14', studentId: 'stu-1', sessionNumber: 1, type: 'teacher', score: 86, evaluatorId: 't-8', evaluatorName: '周老师', comment: '理解深入', createdAt: '2026-07-21' },
  { id: 'ev-15', courseId: 'course-14', studentId: 'stu-1', sessionNumber: 1, type: 'mentor', score: 88, evaluatorId: 'mentor-2', evaluatorName: '李总监', comment: '项目实践优秀', createdAt: '2026-07-22' },

  // 自评与其他人差异过大的异常示例（course-1 / stu-5 第1次）
  { id: 'ev-16', courseId: 'course-1', studentId: 'stu-5', sessionNumber: 1, type: 'self', score: 98, evaluatorId: 'stu-5', evaluatorName: '王芳', createdAt: '2026-07-10' },
  { id: 'ev-17', courseId: 'course-1', studentId: 'stu-5', sessionNumber: 1, type: 'intra_group', score: 70, evaluatorId: 'stu-6', evaluatorName: '孙明', createdAt: '2026-07-10' },
  { id: 'ev-18', courseId: 'course-1', studentId: 'stu-5', sessionNumber: 1, type: 'inter_group', score: 65, evaluatorId: 'stu-1', evaluatorName: '张明', createdAt: '2026-07-11' },
  { id: 'ev-19', courseId: 'course-1', studentId: 'stu-5', sessionNumber: 1, type: 'teacher', score: 72, evaluatorId: 't-1', evaluatorName: '王老师', comment: '与自评差异较大', createdAt: '2026-07-12' },

  // 更多 course-1 学生评价（第2次）
  { id: 'ev-20', courseId: 'course-1', studentId: 'stu-2', sessionNumber: 2, type: 'self', score: 88, evaluatorId: 'stu-2', evaluatorName: '李华', createdAt: '2026-07-14' },
  { id: 'ev-21', courseId: 'course-1', studentId: 'stu-2', sessionNumber: 2, type: 'teacher', score: 90, evaluatorId: 't-1', evaluatorName: '王老师', comment: '保持良好表现', createdAt: '2026-07-15' },
  { id: 'ev-22', courseId: 'course-1', studentId: 'stu-3', sessionNumber: 2, type: 'self', score: 82, evaluatorId: 'stu-3', evaluatorName: '王芳', createdAt: '2026-07-14' },
  { id: 'ev-23', courseId: 'course-1', studentId: 'stu-3', sessionNumber: 2, type: 'intra_group', score: 80, evaluatorId: 'stu-4', evaluatorName: '赵磊', createdAt: '2026-07-14' },
  { id: 'ev-24', courseId: 'course-1', studentId: 'stu-3', sessionNumber: 2, type: 'teacher', score: 85, evaluatorId: 't-1', evaluatorName: '王老师', createdAt: '2026-07-15' },

  // course-15（数据可视化）评价
  { id: 'ev-25', courseId: 'course-15', studentId: 'stu-1', sessionNumber: 1, type: 'self', score: 90, evaluatorId: 'stu-1', evaluatorName: '张明', createdAt: '2026-07-20' },
  { id: 'ev-26', courseId: 'course-15', studentId: 'stu-1', sessionNumber: 1, type: 'teacher', score: 88, evaluatorId: 't-9', evaluatorName: '钱老师', comment: '可视化效果出色', createdAt: '2026-07-21' },
  { id: 'ev-27', courseId: 'course-15', studentId: 'stu-18', sessionNumber: 1, type: 'self', score: 85, evaluatorId: 'stu-18', evaluatorName: '慕容枫', createdAt: '2026-07-21' },
  { id: 'ev-28', courseId: 'course-15', studentId: 'stu-18', sessionNumber: 1, type: 'teacher', score: 82, evaluatorId: 't-9', evaluatorName: '钱老师', createdAt: '2026-07-22' },

  // course-16（高效沟通）评价
  { id: 'ev-29', courseId: 'course-16', studentId: 'stu-1', sessionNumber: 1, type: 'self', score: 80, evaluatorId: 'stu-1', evaluatorName: '张明', createdAt: '2026-07-22' },
  { id: 'ev-30', courseId: 'course-16', studentId: 'stu-1', sessionNumber: 1, type: 'teacher', score: 78, evaluatorId: 't-10', evaluatorName: '吴老师', comment: '表达还需加强', createdAt: '2026-07-23' },
  { id: 'ev-31', courseId: 'course-16', studentId: 'stu-19', sessionNumber: 1, type: 'self', score: 78, evaluatorId: 'stu-19', evaluatorName: '令狐冲', createdAt: '2026-07-22' },
  { id: 'ev-32', courseId: 'course-16', studentId: 'stu-19', sessionNumber: 1, type: 'teacher', score: 80, evaluatorId: 't-10', evaluatorName: '吴老师', createdAt: '2026-07-23' },

  // course-17（英语口语）评价
  { id: 'ev-33', courseId: 'course-17', studentId: 'stu-2', sessionNumber: 1, type: 'self', score: 82, evaluatorId: 'stu-2', evaluatorName: '李华', createdAt: '2026-07-21' },
  { id: 'ev-34', courseId: 'course-17', studentId: 'stu-2', sessionNumber: 1, type: 'teacher', score: 85, evaluatorId: 't-7', evaluatorName: '孙老师', comment: '口语进步明显', createdAt: '2026-07-22' },
  { id: 'ev-35', courseId: 'course-17', studentId: 'stu-21', sessionNumber: 1, type: 'self', score: 75, evaluatorId: 'stu-21', evaluatorName: '小龙女', createdAt: '2026-07-23' },
  { id: 'ev-36', courseId: 'course-17', studentId: 'stu-21', sessionNumber: 1, type: 'teacher', score: 78, evaluatorId: 't-7', evaluatorName: '孙老师', createdAt: '2026-07-24' },

  // course-5（机器学习）更多评价
  { id: 'ev-37', courseId: 'course-5', studentId: 'stu-7', sessionNumber: 1, type: 'self', score: 72, evaluatorId: 'stu-7', evaluatorName: '孙丽', createdAt: '2026-07-12' },
  { id: 'ev-38', courseId: 'course-5', studentId: 'stu-7', sessionNumber: 1, type: 'mentor', score: 75, evaluatorId: 'mentor-3', evaluatorName: '刘总工', comment: '基础扎实', createdAt: '2026-07-13' },
  { id: 'ev-39', courseId: 'course-5', studentId: 'stu-20', sessionNumber: 1, type: 'self', score: 70, evaluatorId: 'stu-20', evaluatorName: '杨过', createdAt: '2026-07-22' },
  { id: 'ev-40', courseId: 'course-5', studentId: 'stu-20', sessionNumber: 1, type: 'teacher', score: 72, evaluatorId: 't-4', evaluatorName: '张老师', createdAt: '2026-07-23' },
];

export const detailedGrades: import('@/types').DetailedGrade[] = [
  // 张明 (stu-1)
  { id: 'dg-1', studentId: 'stu-1', courseId: 'course-1', selfEvalScore: 88, peerReviewScore: 80, interGroupScore: 78, teacherScore: 84, mentorScore: 80, midtermExamScore: 85, midtermProjectScore: 82, finalExamScore: 90, finalProjectScore: 88, gradedAt: '2026-07-20' },
  { id: 'dg-2', studentId: 'stu-1', courseId: 'course-4', selfEvalScore: 78, peerReviewScore: 80, interGroupScore: 75, teacherScore: 82, mentorScore: null, gradedAt: '2026-07-18' },
  { id: 'dg-3', studentId: 'stu-1', courseId: 'course-14', selfEvalScore: 92, peerReviewScore: 88, interGroupScore: 85, teacherScore: 86, mentorScore: 88, finalExamScore: 80, finalProjectScore: 85, gradedAt: '2026-07-22' },
  { id: 'dg-4', studentId: 'stu-1', courseId: 'course-15', selfEvalScore: 90, peerReviewScore: 85, interGroupScore: 82, teacherScore: 88, mentorScore: null, finalExamScore: 92, finalProjectScore: 90, gradedAt: '2026-07-22' },
  { id: 'dg-5', studentId: 'stu-1', courseId: 'course-16', selfEvalScore: 75, peerReviewScore: 78, interGroupScore: null, teacherScore: 78, mentorScore: null, finalExamScore: 80, finalProjectScore: 76, gradedAt: '2026-07-23' },
  // 李华 (stu-2)
  { id: 'dg-6', studentId: 'stu-2', courseId: 'course-1', selfEvalScore: 85, peerReviewScore: 88, interGroupScore: 90, teacherScore: 92, mentorScore: 0, midtermExamScore: 88, midtermProjectScore: 90, finalExamScore: 94, finalProjectScore: 92, gradedAt: '2026-07-20' },
  { id: 'dg-7', studentId: 'stu-2', courseId: 'course-5', selfEvalScore: 75, peerReviewScore: 78, interGroupScore: 72, teacherScore: 80, mentorScore: null, gradedAt: '2026-07-17' },
  { id: 'dg-8', studentId: 'stu-2', courseId: 'course-17', selfEvalScore: 82, peerReviewScore: 80, interGroupScore: 78, teacherScore: 85, mentorScore: null, gradedAt: '2026-07-21' },
  // 王芳 (stu-3)
  { id: 'dg-9', studentId: 'stu-3', courseId: 'course-2', selfEvalScore: 70, peerReviewScore: 72, interGroupScore: 75, teacherScore: 75, mentorScore: null, finalExamScore: 78, finalProjectScore: 72, gradedAt: '2026-07-18' },
  // 赵磊 (stu-4)
  { id: 'dg-10', studentId: 'stu-4', courseId: 'course-2', selfEvalScore: 82, peerReviewScore: 78, interGroupScore: 80, teacherScore: 80, mentorScore: null, finalExamScore: 78, finalProjectScore: 82, gradedAt: '2026-07-18' },
  // 陈静 (stu-5)
  { id: 'dg-11', studentId: 'stu-5', courseId: 'course-3', selfEvalScore: 85, peerReviewScore: 85, interGroupScore: 88, teacherScore: 85, mentorScore: null, midtermExamScore: 88, midtermProjectScore: 82, finalExamScore: 86, finalProjectScore: 84, gradedAt: '2026-07-19' },
  // 刘洋 (stu-8)
  { id: 'dg-12', studentId: 'stu-8', courseId: 'course-5', selfEvalScore: 90, peerReviewScore: 92, interGroupScore: null, teacherScore: 95, mentorScore: null, finalExamScore: 96, finalProjectScore: 94, gradedAt: '2026-07-19' },
  // 胡敏 (stu-15)
  { id: 'dg-13', studentId: 'stu-15', courseId: 'course-1', selfEvalScore: 78, peerReviewScore: 85, interGroupScore: 88, teacherScore: 90, mentorScore: 0, midtermExamScore: 88, midtermProjectScore: 86, finalExamScore: 92, finalProjectScore: 90, gradedAt: '2026-07-18' },
  // 高飞 (stu-17)
  { id: 'dg-14', studentId: 'stu-17', courseId: 'course-14', selfEvalScore: 85, peerReviewScore: 82, interGroupScore: 80, teacherScore: 82, mentorScore: 85, finalExamScore: 82, finalProjectScore: 80, gradedAt: '2026-07-25' },
  { id: 'dg-15', studentId: 'stu-17', courseId: 'course-1', selfEvalScore: 80, peerReviewScore: 78, interGroupScore: 75, teacherScore: 82, mentorScore: 80, gradedAt: '2026-07-20' },
  // 周明 (stu-18)
  { id: 'dg-16', studentId: 'stu-18', courseId: 'course-15', selfEvalScore: 86, peerReviewScore: 82, interGroupScore: 80, teacherScore: 88, mentorScore: null, finalExamScore: 88, finalProjectScore: 90, gradedAt: '2026-07-25' },
  // 吴磊 (stu-19)
  { id: 'dg-17', studentId: 'stu-19', courseId: 'course-3', selfEvalScore: 78, peerReviewScore: 75, interGroupScore: 72, teacherScore: 76, mentorScore: null, finalExamScore: 78, finalProjectScore: 74, gradedAt: '2026-07-24' },
];

export const evalAnomalies: import('@/types').EvalAnomaly[] = [
  { id: 'anom-1', courseId: 'course-1', studentId: 'stu-5', studentName: '陈静', sessionNumber: 1, type: 'self', selfScore: 98, avgScore: 72, diff: 26, warning: '自评分数与平均分差异超过25分，请核实' },
  { id: 'anom-2', courseId: 'course-2', studentId: 'stu-3', studentName: '王芳', sessionNumber: 1, type: 'self', selfScore: 95, avgScore: 70, diff: 25, warning: '自评分数与平均分差异较大，请核实' },
  { id: 'anom-3', courseId: 'course-14', studentId: 'stu-17', studentName: '欧阳雪', sessionNumber: 1, type: 'self', selfScore: 88, avgScore: 85, diff: 3, warning: '自评与组间评价存在小幅差异' },
  { id: 'anom-4', courseId: 'course-1', studentId: 'stu-1', studentName: '张明', sessionNumber: 1, type: 'inter_group', selfScore: 85, avgScore: 80, diff: 5, warning: '自评分数略高于组间评价' },
];

// ========== 评价待办提醒数据 ==========

export const evalReminders: import('@/types').EvalReminder[] = [
  { id: 'rem-1', courseId: 'course-1', courseTitle: 'React 前端开发实战', studentId: 'stu-1', sessionNumber: 3, deadline: '2026-07-28', status: 'pending' },
  { id: 'rem-2', courseId: 'course-1', courseTitle: 'React 前端开发实战', studentId: 'stu-2', sessionNumber: 3, deadline: '2026-07-28', status: 'pending' },
  { id: 'rem-3', courseId: 'course-2', courseTitle: 'Python 数据分析入门', studentId: 'stu-3', sessionNumber: 2, deadline: '2026-07-26', status: 'pending' },
  { id: 'rem-4', courseId: 'course-14', courseTitle: 'AI 生成式应用开发', studentId: 'stu-1', sessionNumber: 2, deadline: '2026-07-30', status: 'pending' },
  { id: 'rem-5', courseId: 'course-3', courseTitle: 'UI/UX 设计思维', studentId: 'stu-5', sessionNumber: 1, deadline: '2026-07-20', status: 'overdue' },
  { id: 'rem-6', courseId: 'course-15', courseTitle: '数据可视化与商业分析', studentId: 'stu-18', sessionNumber: 1, deadline: '2026-07-25', status: 'pending' },
  { id: 'rem-7', courseId: 'course-16', courseTitle: '高效沟通与表达训练', studentId: 'stu-19', sessionNumber: 1, deadline: '2026-07-24', status: 'completed' },
];

// ========== 云盘文件数据 ==========

export const cloudFiles: import('@/types').CloudFile[] = [
  { id: 'file-1', name: '课程大纲.pdf', size: 2048576, type: 'application/pdf', dataUrl: 'https://example.com/files/syllabus.pdf', uploadedAt: '2026-07-01', uploadedBy: '王老师', courseId: 'course-1' },
  { id: 'file-2', name: '实验报告模板.docx', size: 512000, type: 'application/docx', dataUrl: 'https://example.com/files/template.docx', uploadedAt: '2026-07-05', uploadedBy: '李老师', courseId: 'course-2' },
  { id: 'file-3', name: '项目需求说明.pdf', size: 1536000, type: 'application/pdf', dataUrl: 'https://example.com/files/requirements.pdf', uploadedAt: '2026-07-10', uploadedBy: '张明', courseId: 'course-14' },
  { id: 'file-4', name: '数据分析代码.zip', size: 3072000, type: 'application/zip', dataUrl: 'https://example.com/files/analysis.zip', uploadedAt: '2026-07-12', uploadedBy: '李华', courseId: 'course-2' },
  { id: 'file-5', name: 'UI设计稿.fig', size: 5120000, type: 'application/fig', dataUrl: 'https://example.com/files/design.fig', uploadedAt: '2026-07-15', uploadedBy: '陈静', courseId: 'course-3' },
  { id: 'file-6', name: '学习笔记.md', size: 25600, type: 'text/markdown', dataUrl: 'https://example.com/files/notes.md', uploadedAt: '2026-07-18', uploadedBy: '张明', courseId: 'course-1' },
  { id: 'file-7', name: '期末复习资料.pdf', size: 4096000, type: 'application/pdf', dataUrl: 'https://example.com/files/review.pdf', uploadedAt: '2026-07-20', uploadedBy: '王老师', courseId: 'course-1' },
  { id: 'file-8', name: 'React入门课件.pdf', size: 3072000, type: 'application/pdf', dataUrl: 'https://example.com/files/react-intro.pdf', uploadedAt: '2026-07-01', uploadedBy: '王老师', courseId: 'course-1' },
  { id: 'file-9', name: 'Python基础代码示例.zip', size: 512000, type: 'application/zip', dataUrl: 'https://example.com/files/python-examples.zip', uploadedAt: '2026-07-05', uploadedBy: '李老师', courseId: 'course-2' },
  { id: 'file-10', name: 'TypeScript进阶指南.pdf', size: 2048000, type: 'application/pdf', dataUrl: 'https://example.com/files/ts-guide.pdf', uploadedAt: '2026-07-15', uploadedBy: '王老师', courseId: 'course-4' },
  { id: 'file-11', name: '机器学习数据集.csv', size: 1024000, type: 'text/csv', dataUrl: 'https://example.com/files/ml-dataset.csv', uploadedAt: '2026-07-18', uploadedBy: '张老师', courseId: 'course-5' },
  { id: 'file-12', name: 'AI项目示例代码.zip', size: 4096000, type: 'application/zip', dataUrl: 'https://example.com/files/ai-project.zip', uploadedAt: '2026-07-20', uploadedBy: '周老师', courseId: 'course-14' },
];

// ========== 待办事项数据 ==========

export const todoItems: import('@/types').TodoItem[] = [
  { id: 'todo-1', title: '完成React课程第三单元作业', completed: false, createdAt: '2026-07-20', dueDate: '2026-07-25', createdBy: '张明' },
  { id: 'todo-2', title: '提交Python数据分析报告', completed: true, createdAt: '2026-07-18', dueDate: '2026-07-22', createdBy: '李华' },
  { id: 'todo-3', title: '准备小组演讲PPT', completed: false, createdAt: '2026-07-21', dueDate: '2026-07-28', createdBy: '王芳' },
  { id: 'todo-4', title: '复习TypeScript高级类型', completed: false, createdAt: '2026-07-22', createdBy: '张明' },
  { id: 'todo-5', title: '完成AI项目第一阶段代码', completed: false, createdAt: '2026-07-23', dueDate: '2026-07-30', createdBy: '欧阳雪' },
  { id: 'todo-6', title: '整理学习笔记并分享', completed: true, createdAt: '2026-07-19', createdBy: '李华' },
  { id: 'todo-7', title: '预约导师面谈时间', completed: false, createdAt: '2026-07-24', dueDate: '2026-07-26', createdBy: '张明' },
];

// ========== 在线文档数据 ==========

export const onlineDocs: import('@/types').OnlineDoc[] = [
  { id: 'doc-1', title: 'React学习小组协作文档', content: '# React 学习计划\n\n## 第一周\n- 学习Hooks基础\n- 完成计数器案例\n\n## 第二周\n- 学习useContext\n- 完成主题切换功能', createdBy: '张明', createdAt: '2026-07-01', lastEditedAt: '2026-07-20', lastEditedBy: '李华' },
  { id: 'doc-2', title: 'Python数据分析项目文档', content: '# 项目概述\n\n## 目标\n分析销售数据并生成可视化报告\n\n## 数据集\n- 销售记录.xlsx\n- 产品信息.csv', createdBy: '李老师', createdAt: '2026-07-05', lastEditedAt: '2026-07-18', lastEditedBy: '王芳' },
  { id: 'doc-3', title: 'UI/UX设计规范', content: '# 设计规范\n\n## 颜色方案\n- 主色：#3b82f6\n- 辅色：#10b981\n\n## 字体\n- 标题：Inter\n- 正文：Roboto', createdBy: '陈老师', createdAt: '2026-07-10', lastEditedAt: '2026-07-15', lastEditedBy: '陈老师' },
  { id: 'doc-4', title: 'AI项目技术方案', content: '# 技术方案\n\n## 模型选择\n使用GPT-4进行文本生成\n\n## 架构设计\n- 前端：Vue3 + TypeScript\n- 后端：Node.js + Express', createdBy: '周老师', createdAt: '2026-07-18', lastEditedAt: '2026-07-23', lastEditedBy: '欧阳雪' },
];

// ========== 笔记数据 ==========

export const notes: import('@/types').Note[] = [
  { id: 'note-1', title: 'React Hooks学习笔记', content: 'useState用于管理组件内部状态\nuseEffect用于副作用处理\nuseContext用于跨组件数据传递', createdAt: '2026-07-10', updatedAt: '2026-07-15', createdBy: '张明' },
  { id: 'note-2', title: 'Python Pandas常用操作', content: 'df.read_csv() - 读取CSV文件\ndf.groupby() - 分组聚合\ndf.merge() - 数据合并', createdAt: '2026-07-12', updatedAt: '2026-07-18', createdBy: '李华' },
  { id: 'note-3', title: '设计思维方法论', content: '用户研究 → 定义问题 → 创意发散 → 原型设计 → 测试验证', createdAt: '2026-07-14', updatedAt: '2026-07-14', createdBy: '王芳' },
  { id: 'note-4', title: 'TypeScript泛型笔记', content: '泛型函数：function identity<T>(arg: T): T\n泛型接口：interface Container<T>\n泛型类：class GenericNumber<T>', createdAt: '2026-07-16', updatedAt: '2026-07-20', createdBy: '张明' },
  { id: 'note-5', title: '机器学习算法总结', content: '线性回归：预测连续值\n决策树：分类问题\nSVM：高维数据分类\n神经网络：复杂模式识别', createdAt: '2026-07-18', updatedAt: '2026-07-22', createdBy: '欧阳雪' },
];

// ========== 仪表盘统计数据 ==========

export const homework: import('@/types').Homework[] = [
  { id: 'hw-1', courseId: 'course-1', title: '第1章课后作业', description: '完成React基础概念的练习题，包括组件、props、state等基础知识点', dueDate: '2026-07-25', createdAt: '2026-07-10', createdBy: '王老师' },
  { id: 'hw-2', courseId: 'course-1', title: '第2章课后作业', description: '使用Hooks实现一个计数器应用，包含useState、useEffect', dueDate: '2026-07-30', createdAt: '2026-07-15', createdBy: '王老师' },
  { id: 'hw-3', courseId: 'course-1', title: '第3章课后作业', description: '实现Context跨组件数据传递案例', dueDate: '2026-08-05', createdAt: '2026-07-20', createdBy: '王老师' },
  { id: 'hw-4', courseId: 'course-2', title: 'Python数据分析作业一', description: '使用Pandas读取CSV文件并进行数据清洗', dueDate: '2026-07-26', createdAt: '2026-07-12', createdBy: '李老师' },
  { id: 'hw-5', courseId: 'course-2', title: 'Python数据分析作业二', description: '使用Matplotlib进行数据可视化', dueDate: '2026-08-02', createdAt: '2026-07-18', createdBy: '李老师' },
  { id: 'hw-6', courseId: 'course-3', title: 'UI设计作业', description: '设计一个移动端App的首页界面', dueDate: '2026-07-28', createdAt: '2026-07-14', createdBy: '陈老师' },
  { id: 'hw-7', courseId: 'course-4', title: 'TypeScript泛型作业', description: '实现泛型函数和泛型接口', dueDate: '2026-07-27', createdAt: '2026-07-16', createdBy: '王老师' },
  { id: 'hw-8', courseId: 'course-5', title: '机器学习作业', description: '使用线性回归预测房价', dueDate: '2026-08-03', createdAt: '2026-07-18', createdBy: '张老师' },
  { id: 'hw-9', courseId: 'course-14', title: 'AI项目阶段性作业', description: '完成AI应用的第一阶段开发', dueDate: '2026-07-31', createdAt: '2026-07-20', createdBy: '周老师' },
  { id: 'hw-10', courseId: 'course-15', title: '数据可视化作业', description: '创建交互式数据仪表盘', dueDate: '2026-08-01', createdAt: '2026-07-22', createdBy: '钱老师' },
];

export const homeworkSubmissions: import('@/types').HomeworkSubmission[] = [
  { id: 'sub-1', homeworkId: 'hw-1', courseId: 'course-1', studentId: 'stu-1', submittedAt: '2026-07-24', fileName: 'React第1章作业.docx', fileDataUrl: 'https://example.com/submissions/react-hw1.docx', fileSize: 512000, fileType: 'application/docx' },
  { id: 'sub-2', homeworkId: 'hw-1', courseId: 'course-1', studentId: 'stu-2', submittedAt: '2026-07-23', fileName: '第1章作业.pdf', fileDataUrl: 'https://example.com/submissions/hw1-stu2.pdf', fileSize: 1024000, fileType: 'application/pdf' },
  { id: 'sub-3', homeworkId: 'hw-4', courseId: 'course-2', studentId: 'stu-3', submittedAt: '2026-07-25', fileName: '数据分析作业一.ipynb', fileDataUrl: 'https://example.com/submissions/python-hw1.ipynb', fileSize: 256000, fileType: 'application/ipynb' },
  { id: 'sub-4', homeworkId: 'hw-6', courseId: 'course-3', studentId: 'stu-5', submittedAt: '2026-07-27', fileName: 'UI设计稿.fig', fileDataUrl: 'https://example.com/submissions/ui-design.fig', fileSize: 5120000, fileType: 'application/fig' },
  { id: 'sub-5', homeworkId: 'hw-7', courseId: 'course-4', studentId: 'stu-1', submittedAt: '2026-07-26', fileName: 'TypeScript泛型作业.ts', fileDataUrl: 'https://example.com/submissions/ts-generics.ts', fileSize: 10240, fileType: 'text/typescript' },
];

export const dashboardStats: import('@/types').DashboardStats = {
  totalCourses: 20,
  totalStudents: 21,
  activeCourses: 16,
  recentEnrollments: 15,
};
