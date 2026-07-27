<template>
  <div class="min-h-screen bg-gradient-to-br from-brand-50 to-brand-50 flex items-center justify-center p-4">
    <div class="flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
      <!-- Left brand panel -->
      <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-brand-800 p-12 flex-col justify-between">
        <div>
          <div class="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <GraduationCap class="w-12 h-12 text-white" />
          </div>
          <h1 class="text-3xl font-bold text-white mb-3">EduManage</h1>
          <p class="text-white/70 text-lg">课程管理实施平台 · 高效协同管理</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <div class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm">管理员端</div>
          <div class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm">教师端</div>
          <div class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm">学生端</div>
        </div>
      </div>

      <!-- Right login form -->
      <div class="w-full lg:w-1/2 p-8">
        <div class="text-center mb-8 lg:hidden">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center mx-auto mb-4">
            <GraduationCap class="w-8 h-8 text-white" />
          </div>
          <h2 class="text-xl font-bold text-gray-900">EduManage</h2>
        </div>

        <h2 class="text-2xl font-bold text-gray-900 mb-2 hidden lg:block">欢迎登录</h2>
        <p class="text-gray-500 mb-8 hidden lg:block">输入账号密码，系统自动识别身份</p>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">账号</label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="account"
                type="text"
                placeholder="请输入账号"
                class="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none transition-all"
                @input="error = ''"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="请输入密码"
                class="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none transition-all"
                @input="error = ''"
              />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <component :is="showPassword ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            :class="['w-full py-3 font-medium rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2', loading ? 'bg-brand-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/25']"
          >
            <template v-if="loading">
              <LoaderCircle class="w-5 h-5 animate-spin" />
              登录中...
            </template>
            <template v-else>
              <LogIn class="w-5 h-5" />
              登录
            </template>
          </button>

          <div class="bg-brand-50 border border-brand-200 rounded-lg p-3 text-xs text-brand-700">
            <p class="font-medium mb-1">测试账号（密码统一：666666）</p>
            <p>管理员：admin</p>
            <p>教师：teacher-wang、teacher-li</p>
            <p>学生：S2024001（张明）、202511053250（李傲天）</p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { User, Lock, Eye, EyeOff, LogIn, GraduationCap, LoaderCircle } from 'lucide-vue-next'
import { unifiedLogin } from '@/api'

const router = useRouter()
const store = useAppStore()

const account = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

/** Mock 用户数据（与 seed-users.js 一致） */
const MOCK_USERS: Record<string, { password: string; name: string; role: string; sub_role?: string }> = {
  admin:            { password: '666666', name: '系统管理员', role: 'admin' },
  'teacher-wang':   { password: '666666', name: '王老师', role: 'teacher' },
  'teacher-li':     { password: '666666', name: '李老师', role: 'teacher' },
  'mentor-zhang':   { password: '666666', name: '张导师', role: 'teacher', sub_role: 'mentor' },
  'leader-liu':     { password: '666666', name: '刘院长', role: 'teacher', sub_role: 'leader' },
  'leader-zhou':    { password: '666666', name: '周院长', role: 'teacher', sub_role: 'leader' },
  'leader-wu':      { password: '666666', name: '吴院长', role: 'teacher', sub_role: 'leader' },
  'leader-zheng':   { password: '666666', name: '郑院长', role: 'teacher', sub_role: 'leader' },
  S2024001:         { password: '666666', name: '张明', role: 'student' },
  '202511053250':    { password: '666666', name: '李傲天', role: 'student' },
}

/** Mock 跳转地址 */
function mockPortal(role: string, subRole?: string): string {
  if (role === 'admin') return '/admin/categories'
  if (role === 'teacher') {
    if (subRole === 'mentor') return '/mentor/courses'
    if (subRole === 'leader') return '/leader/courses'
    return '/teacher/courses'
  }
  if (role === 'student') return '/student/courses'
  return '/'
}

const handleLogin = async () => {
  if (!account.value.trim() || !password.value.trim()) {
    error.value = '请输入账号和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 优先尝试后端登录
    const res = await unifiedLogin(account.value, password.value)
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.user))
    let role = res.user.role
    if (role === 'teacher' && res.user.sub_role) role = res.user.sub_role
    store.login(res.user.name, role)
    router.push(res.portal)
  } catch (_e: any) {
    // 后端不可用时，走 Mock 登录（演示模式）
    const mock = MOCK_USERS[account.value.trim()]
    if (!mock || mock.password !== password.value.trim()) {
      error.value = '账号或密码错误（演示模式）'
      loading.value = false
      return
    }
    localStorage.setItem('isDemoMode', 'true')
    let role = mock.role
    if (role === 'teacher' && mock.sub_role) role = mock.sub_role
    store.login(mock.name, role as any)
    router.push(mockPortal(mock.role, mock.sub_role))
  }

}
</script>
