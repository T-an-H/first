<template>
  <div id="d3-sidebar-root" class="flex-shrink-0"></div>
</template>
<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const adminNavItems = [
  { to: '/admin/categories', icon: 'calendar' as const, label: '课程管理' },
  { to: '/admin/students', icon: 'users' as const, label: '班级管理' },
]

const teacherNavItems = [
  { to: '/teacher/courses', icon: 'bookOpen' as const, label: '我的课程' },
  { to: '/teacher/schedule', icon: 'calendar' as const, label: '课程表' },
  { to: '/teacher/grades', icon: 'award' as const, label: '成绩查询' },
  { to: '/teacher/extra', icon: 'lightbulb' as const, label: '额外功能' },
]

const studentNavItems = [
  { to: '/student/profile', icon: 'user' as const, label: '个人画像' },
  { to: '/student/schedule', icon: 'calendar' as const, label: '我的课表' },
  { to: '/student/courses', icon: 'bookOpen' as const, label: '我的课程' },
  { to: '/student/grades', icon: 'award' as const, label: '成绩查询' },
  { to: '/student/extra', icon: 'lightbulb' as const, label: '额外功能' },
]

const mentorNavItems = [
  { to: '/mentor/courses', icon: 'bookOpen' as const, label: '我的课程' },
  { to: '/mentor/schedule', icon: 'calendar' as const, label: '课程表' },
  { to: '/mentor/grades', icon: 'award' as const, label: '成绩查询' },
  { to: '/mentor/extra', icon: 'lightbulb' as const, label: '额外功能' },
]

const leaderNavItems = [
  { to: '/leader/courses', icon: 'eye' as const, label: '课程总览' },
  { to: '/leader/students', icon: 'users' as const, label: '学员总览' },
]

const roleConfig: Record<string, { items: { to: string; icon: string; label: string }[]; color: string; label: string }> = {
  admin: { items: adminNavItems, color: 'bg-brand-600', label: '管理员端' },
  teacher: { items: teacherNavItems, color: 'bg-brand-600', label: '教师端' },
  student: { items: studentNavItems, color: 'bg-brand-600', label: '学生端' },
  mentor: { items: mentorNavItems, color: 'bg-brand-600', label: '企业导师端' },
  leader: { items: leaderNavItems, color: 'bg-brand-600', label: '学院领导端' },
}

const config = computed(() => roleConfig[store.currentRole || 'admin'])

const hasLeaderAccess = computed(() => {
  return store.currentRole === 'leader' || store.secondaryRoles.includes('leader')
})

const hasPendingEvalTodos = computed(() => {
  if (store.currentRole === 'student') {
    const student = store.students.find((s) => s.name === store.currentUser)
    if (!student) return false
    return store.evalReminders.some((r) => r.studentId === student.id && r.status !== 'completed')
  }
  if (store.currentRole === 'teacher' || store.currentRole === 'mentor') {
    return store.evalReminders.some((r) => r.studentId === store.currentUser && r.status !== 'completed')
  }
  return false
})

const showExtraBadge = (item: { to: string; label: string }) => {
  if (item.label !== '额外功能') return false
  if (hasPendingEvalTodos.value) return true
  if (store.currentRole === 'teacher' && store.getPendingConfigCourses().length > 0) return true
  // AI 分层测试待办红点（学生端）
  if (store.currentRole === 'student') {
    const student = store.students.find((s) => s.name === store.currentUser)
    if (student && store.getPendingAITierTests(student.id).length > 0) return true
  }
  return false
}

// ===== D3 渲染 =====

let rootEl: HTMLElement | null = null

/** 判断 item 是否 active */
function isActive(item: { to: string }) {
  // 对于 /mentor/courses 与 /teacher/courses 等，检查 startsWith
  const path = route.path
  return path.startsWith(item.to)
}

/** 判断是否是 nav items 数组中的任一 items 的活跃路径 */
function renderNavLink(
  container: d3.Selection<any, any, any, any>,
  item: { to: string; icon: string; label: string },
) {
  const active = isActive(item)
  const link = container.append('a')
    .attr('href', 'javascript:void(0)')
    .attr('class', `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${active ? 'bg-white/15 text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-black/10'}`)
    .on('click', () => router.push(item.to))

  renderIcon(link, item.icon as any, 'w-5 h-5 flex-shrink-0')

  const span = link.append('span').attr('class', 'relative')
    .text(item.label)

  if (showExtraBadge(item)) {
    span.append('span')
      .attr('class', 'absolute -top-2 -right-3 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white/50')
  }
}

function renderSidebar() {
  if (!rootEl) return
  rootEl.innerHTML = ''
  const root = d3.select(rootEl)
  const cfg = config.value

  // ---- aside ----
  const aside = root.append('aside')
    .attr('class', 'w-64 bg-brand-750 text-white flex flex-col h-screen sticky top-0')

  // ---- header ----
  const header = aside.append('div')
    .attr('class', 'p-6 border-b border-white/10')

  const headerFlex = header.append('div')
    .attr('class', 'flex items-center gap-3')

  const logoBox = headerFlex.append('div')
    .attr('class', `w-10 h-10 rounded-lg ${cfg.color} flex items-center justify-center`)
  renderIcon(logoBox, 'graduationCap', 'w-6 h-6 text-white')

  const headerText = headerFlex.append('div')
  headerText.append('h1').attr('class', 'font-bold text-lg').text('课程管理')
  headerText.append('p').attr('class', 'text-xs text-white/50').text(cfg.label)

  // 管理员显示当前学院
  if (store.currentRole === 'admin') {
    const deptName = store.getSelectedDepartment()?.name
    if (deptName) {
      const deptBar = header.append('div')
        .attr('class', 'mt-3 pt-3 border-t border-white/10')

      const deptRow = deptBar.append('div')
        .attr('class', 'flex items-center justify-between')

      deptRow.append('span')
        .attr('class', 'text-xs text-white/60')
        .text('当前学院')

      const deptInfo = deptRow.append('div')
        .attr('class', 'flex items-center gap-1')

      deptInfo.append('span')
        .attr('class', 'text-sm font-medium text-white')
        .text(deptName)

      // 切换学院按钮
      deptBar.append('button')
        .attr('class', 'mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200')
        .on('click', () => {
          store.setSelectedDepartment(null)
          router.push('/admin')
        })
        .call((sel) => {
          renderIcon(sel, 'refreshCw', 'w-3.5 h-3.5')
          sel.append('span').text('切换学院')
        })
    }
  }

  // ---- nav ----
  const nav = aside.append('nav')
    .attr('class', 'flex-1 p-4 space-y-1')

  // 构建合并后的菜单项列表，保持各自原有顺序
  let fullItems: any[]

  if (store.currentRole === 'leader') {
    // 以 leader 身份登入：先加 teacher/mentor 菜单，最后加 leader 菜单
    fullItems = []
    const leader = store.leaders.find((l) => l.name === store.currentUser)
    if (leader?.asTeacher) {
      fullItems.push({ separator: true, label: '教学管理' } as any)
      teacherNavItems.forEach((item) => fullItems.push(item))
    }
    if (leader?.asMentor) {
      fullItems.push({ separator: true, label: '企业导师管理' } as any)
      mentorNavItems.forEach((item) => fullItems.push(item))
    }
    cfg.items.forEach((item) => fullItems.push(item))
  } else {
    fullItems = [...cfg.items]
    // 非 leader 主角色但有 leader 副角色时，追加 leader 菜单
    if (hasLeaderAccess.value) {
      fullItems.push({ separator: true, label: '学院管理' } as any)
      leaderNavItems.forEach((item) => fullItems.push(item))
    }
  }

  fullItems.forEach((item: any) => {
    if (item.separator) {
      nav.append('div').attr('class', 'pt-3 pb-1 mt-3')
      nav.append('p').attr('class', 'px-4 text-[10px] text-gray-400 uppercase tracking-wider').text(item.label)
      return
    }
    renderNavLink(nav, item)
  })

  // ---- footer ----
  const footer = aside.append('div')
    .attr('class', 'p-4 border-t border-white/10')

  footer.append('button')
    .attr('class', 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-black/10 transition-all duration-200 w-full')
    .on('click', () => {
      store.logout()
      router.replace('/login')
    })
    .call((sel) => {
      renderIcon(sel, 'logOut', 'w-5 h-5 flex-shrink-0')
      sel.append('span').text('退出登录')
    })
}

onMounted(() => {
  rootEl = document.getElementById('d3-sidebar-root')
  if (rootEl) {
    renderSidebar()
  }
})

// 路由变化或状态变化时重新渲染
watch(
  () => [route.path, store.currentRole, store.secondaryRoles, store.evalReminders.length],
  () => { renderSidebar() },
  { flush: 'post' },
)
</script>
