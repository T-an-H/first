<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
    <div class="flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
      <!-- Left brand panel -->
      <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 to-amber-700 p-12 flex-col justify-between">
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
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-4">
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
                class="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
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
                class="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
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
            :class="['w-full py-3 font-medium rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2', loading ? 'bg-amber-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25']"
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

          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-600">
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

const handleLogin = async () => {
  if (!account.value.trim() || !password.value.trim()) {
    error.value = '请输入账号和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await unifiedLogin(account.value, password.value)

    // 保存 token
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.user))

    // 确定角色（处理教师子角色：授课导师/企业导师/学院领导）
    let role = res.user.role
    if (role === 'teacher' && res.user.sub_role) {
      role = res.user.sub_role
    }

    // 调用 store.login 让应用状态同步
    store.login(res.user.name, role)

    // 跳转到对应页面
    router.push(res.portal)
  } catch (e: any) {
    error.value = e.message || '登录失败，请检查账号和密码'
  }

  loading.value = false
}
</script>
