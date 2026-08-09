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
  { to: '/teacher/schedule', icon: 'calendar' as const, label: '课程表' },
  { to: '/teacher/courses', icon: 'bookOpen' as const, label: '我的课程' },
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

function getNavBadgeCount(item: { to: string; label: string }): number {
  if (!store.currentUser) return 0
  if (item.label === '额外功能') {
    return store.todos.filter((t) => t.createdBy === store.currentUser && !t.completed).length
  }
  if (item.label === '我的课程') {
    if (item.to.startsWith('/teacher')) return store.getMyPendingCourseIds('teacher').length
    if (item.to.startsWith('/mentor')) return store.getMyPendingCourseIds('mentor').length
    if (item.to.startsWith('/student')) return store.getMyPendingCourseIds('student').length
  }
  if (item.to === '/leader/courses') return store.getMyPendingCourseIds('leader').length
  return 0
}

/** 待处理事务的汇总签名（用于驱动侧边栏红点重渲染） */
const pendingSig = computed(() => {
  const user = store.currentUser || ''
  if (!user) return ''
  return [
    store.getMyPendingCourseIds('teacher').length,
    store.getMyPendingCourseIds('mentor').length,
    store.getMyPendingCourseIds('student').length,
    store.getMyPendingCourseIds('leader').length,
    store.todos.filter((t) => t.createdBy === user && !t.completed).length,
  ].join('|')
})

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
  const badgeCount = getNavBadgeCount(item)
  const link = container.append('a')
    .attr('href', 'javascript:void(0)')
    .attr('class', `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${active ? 'bg-white/15 text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-black/10'}`)
    .attr('title', badgeCount > 0 ? `有 ${badgeCount} 项待处理事务，点击进入` : null)
    .on('click', () => router.push(item.to))

  renderIcon(link, item.icon as any, 'w-5 h-5 flex-shrink-0')

  const span = link.append('span').attr('class', 'relative')
    .text(item.label)

  if (badgeCount > 0) {
    span.append('span')
      .attr('class', 'absolute -top-0.5 -right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white/50')
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

// 路由变化或状态变化时重新渲染（含待处理事务红点）
watch(
  () => [route.path, store.currentRole, store.secondaryRoles, pendingSig.value],
  () => { renderSidebar() },
  { flush: 'post' },
)
</script>
