<template>
  <div class="space-y-6">
    <!-- ====== 班级列表 ====== -->
    <template v-if="!selectedClass">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">班级管理</h1>
          <p class="text-gray-500 mt-1">管理所有班级，点击班级查看学生名单（数据来源：MySQL）</p>
        </div>
        <div class="flex items-center gap-2 text-xs" :class="loading ? 'text-amber-500' : 'text-green-500'">
          <span class="w-2 h-2 rounded-full" :class="loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'"></span>
          {{ loading ? '加载中...' : `已连接 · ${classes.length} 个班级` }}
        </div>
      </div>

      <!-- 搜索班级 -->
      <div class="relative max-w-md">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="classSearch" type="text" placeholder="搜索班级名称..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
      </div>

      <!-- 班级卡片 -->
      <div v-if="loading" class="text-center py-12 text-gray-400">
        <LoaderCircle class="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
        <span>正在从数据库加载...</span>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="c in filteredClasses"
          :key="c.name"
          @click="selectClass(c.name)"
          class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{{ c.name }}</h3>
                <p class="text-xs text-gray-400 mt-0.5">{{ c.count }} 名学生</p>
              </div>
            </div>
            <ArrowRight class="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
        <div v-if="filteredClasses.length === 0" class="col-span-full text-center py-20 text-gray-400">
          <Users class="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{{ classSearch ? '没有匹配的班级' : '暂无班级数据' }}</p>
        </div>
      </div>
    </template>

    <!-- ====== 班级内学生名单 ====== -->
    <template v-else>
      <div class="flex items-center gap-3 mb-1">
        <button @click="selectedClass = null" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft class="w-4 h-4" /> 返回班级列表
        </button>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ selectedClass }}</h1>
          <p class="text-gray-500 mt-1">{{ filteredStudents.length }} 名学生</p>
        </div>
        <button @click="loadClassStudents" class="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
          <RefreshCw class="w-4 h-4" />
          刷新
        </button>
      </div>

      <!-- 搜索学生 -->
      <div class="relative max-w-md">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="studentSearch" type="text" placeholder="搜索学生姓名或学号..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
      </div>

      <div v-if="loadingStudents" class="text-center py-12 text-gray-400">
        <LoaderCircle class="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
        <span>加载中...</span>
      </div>
      <div v-else class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">姓名</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">学号</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filteredStudents" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="s.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'">
                    <span class="text-xs font-bold" :class="s.status === 'active' ? 'text-blue-600' : 'text-gray-400'">{{ s.name[0] }}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ s.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ s.studentId }}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'">
                  {{ s.status === 'active' ? '正常' : '禁用' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <router-link :to="`/admin/students/${s.id}`" class="text-xs text-blue-500 hover:underline">查看详情</router-link>
              </td>
            </tr>
            <tr v-if="filteredStudents.length === 0">
              <td colspan="4" class="px-4 py-12 text-center text-gray-400">{{ studentSearch ? '没有匹配的学生' : '该班级暂无学生' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Users, ArrowLeft, ArrowRight, RefreshCw, LoaderCircle, Search } from 'lucide-vue-next'
import { fetchClasses, fetchStudents } from '@/api'

const classes = ref<any[]>([])
const loading = ref(false)
const selectedClass = ref('')
const students = ref<any[]>([])
const loadingStudents = ref(false)
const classSearch = ref('')
const studentSearch = ref('')

// 班级搜索过滤
const filteredClasses = computed(() => {
  const q = classSearch.value.trim().toLowerCase()
  if (!q) return classes.value
  return classes.value.filter((c) => c.name.toLowerCase().includes(q))
})

// 学生搜索过滤
const filteredStudents = computed(() => {
  const q = studentSearch.value.trim().toLowerCase()
  if (!q) return students.value
  return students.value.filter(
    (s) => s.name.toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q)
  )
})

async function loadClasses() {
  loading.value = true
  try {
    const res = await fetchClasses()
    if (res.success) classes.value = res.classes
  } catch (e) {
    console.error('加载班级失败:', e)
  } finally {
    loading.value = false
  }
}

function selectClass(name: string) {
  selectedClass.value = name
  studentSearch.value = ''
  loadClassStudents()
}

async function loadClassStudents() {
  loadingStudents.value = true
  try {
    const res = await fetchStudents({ class: selectedClass.value, pageSize: '200' })
    if (res.success) students.value = res.students
  } catch (e) {
    console.error('加载学生失败:', e)
  } finally {
    loadingStudents.value = false
  }
}

onMounted(loadClasses)
</script>
