<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">学员管理</h1>
        <p class="text-gray-500 mt-1">管理所有学员信息（数据来源：MySQL 数据库）</p>
      </div>
      <div class="flex items-center gap-2 text-xs" :class="loading ? 'text-brand-600' : 'text-green-500'">
        <span class="w-2 h-2 rounded-full" :class="loading ? 'bg-brand-600 animate-pulse' : 'bg-green-500'"></span>
        {{ loading ? '加载中...' : `已连接 · ${total} 名学员` }}
      </div>
    </div>

    <div class="flex gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchText" type="text" placeholder="搜索学员姓名或学号..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" @input="onSearch" />
      </div>
      <button @click="loadStudents" class="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
        <RefreshCw class="w-4 h-4" />
        刷新
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">姓名</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">学号</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">班级</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in students" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="s.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'">
                  <span class="text-xs font-bold" :class="s.status === 'active' ? 'text-blue-600' : 'text-gray-400'">{{ s.name[0] }}</span>
                </div>
                <span class="text-sm font-medium text-gray-900">{{ s.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ s.studentId }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ s.className }}</td>
            <td class="px-4 py-3">
              <span class="text-xs px-2 py-0.5 rounded-full" :class="s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'">
                {{ s.status === 'active' ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <router-link :to="`/admin/students/${s.id}`" class="text-xs text-blue-500 hover:underline">查看详情</router-link>
            </td>
          </tr>
          <tr v-if="students.length === 0 && !loading">
            <td colspan="5" class="px-4 py-12 text-center text-gray-400">暂无学员数据</td>
          </tr>
          <tr v-if="loading">
            <td colspan="5" class="px-4 py-12 text-center text-gray-400">
              <div class="flex items-center justify-center gap-2">
                <LoaderCircle class="w-5 h-5 animate-spin text-blue-500" />
                <span>正在从数据库加载...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <span class="text-sm text-gray-500">共 {{ total }} 名学员</span>
      <div class="flex gap-1">
        <button v-for="p in totalPages" :key="p" @click="goPage(p)" :class="`px-3 py-1.5 rounded-lg text-sm ${currentPage === p ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`">
          {{ p }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, RefreshCw, LoaderCircle } from 'lucide-vue-next'
import { fetchStudents } from '@/api'

const students = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const searchText = ref('')
const currentPage = ref(1)
const pageSize = 15
const totalPages = ref(1)

let searchTimer: any = null

async function loadStudents() {
  loading.value = true
  try {
    const params: Record<string, string> = {
      page: String(currentPage.value),
      pageSize: String(pageSize),
    }
    if (searchText.value.trim()) {
      params.search = searchText.value.trim()
    }
    const res = await fetchStudents(params)
    if (res.success) {
      students.value = res.students
      total.value = res.total
      totalPages.value = Math.ceil(res.total / pageSize)
    }
  } catch (e) {
    console.error('加载学生列表失败:', e)
    students.value = []
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadStudents()
  }, 300)
}

function goPage(p: number) {
  currentPage.value = p
  loadStudents()
}

onMounted(loadStudents)
</script>
