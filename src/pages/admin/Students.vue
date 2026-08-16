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
        <div class="flex items-center gap-2">
          <button @click="loadClassStudents" class="px-4 py-2.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors flex items-center gap-2">
            <RefreshCw class="w-4 h-4" />
            刷新
          </button>
        </div>
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
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">电话</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
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
              <td class="px-4 py-3 text-sm text-gray-600">{{ s.phone || '-' }}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'">
                  {{ s.status === 'active' ? '正常' : '禁用' }}
                </span>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Users, ArrowLeft, ArrowRight, RefreshCw, LoaderCircle, Search } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { javaListDepartmentClasses } from '@/api'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

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
  // 班级主数据 = 后端班级表 department_class（教师端/管理员端新增的班级都会同步进来）
  // 学生数从 store.students（student 表 className）聚合
  const classMap = new Map<string, number>()
  for (const s of store.students) {
    if (s.className) {
      classMap.set(s.className, (classMap.get(s.className) || 0) + 1)
    }
  }
  let dcClassNames: string[] = []
  try {
    const dcList: any[] = await javaListDepartmentClasses()
    dcClassNames = (dcList || []).map((c: any) => c.className).filter(Boolean)
  } catch {}
  // 合并：后端班级表为主，student 聚合（如历史遗留未入班级表的班级）兜底
  const names = new Set([...dcClassNames, ...classMap.keys()])
  classes.value = Array.from(names)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map((name) => ({ name, count: classMap.get(name) || 0 }))
  loading.value = false
}

function selectClass(name: string) {
  selectedClass.value = name
}

async function loadClassStudents() {
  if (!selectedClass.value) {
    students.value = []
    return
  }

  loadingStudents.value = true
  // 学生数据由 store.initFromDatabase() 从数据库(course_db)拉取，此处按班级过滤
  students.value = store.students
    .filter((s) => s.className === selectedClass.value)
    .map((s) => ({
      id: s.id,
      name: s.name,
      studentId: s.studentId,
      className: s.className,
      phone: s.phone,
      email: s.email,
      status: s.status,
    }))
  loadingStudents.value = false
}

// URL className 双向同步：支持通过 ?className=xxx 直达班级
watch(() => route.query.className, (className) => {
  const nextClassName = typeof className === 'string' ? className : ''
  if (selectedClass.value === nextClassName) return

  selectedClass.value = nextClassName
  studentSearch.value = ''
}, { immediate: true })

watch(selectedClass, (className, previousClassName) => {
  const currentClassName = typeof route.query.className === 'string' ? route.query.className : ''
  if (currentClassName !== className) {
    const nextQuery = { ...route.query }
    if (className) {
      nextQuery.className = className
    } else {
      delete nextQuery.className
    }
    void router.replace({ query: nextQuery })
  }

  if (!className) {
    students.value = []
    return
  }

  if (className !== previousClassName) {
    studentSearch.value = ''
    void loadClassStudents()
  }
})

onMounted(loadClasses)
</script>

<style scoped>
</style>
