<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">学员管理</h1>
        <p class="text-gray-500 mt-1">管理所有学员信息</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-green-500">
        <span class="w-2 h-2 rounded-full bg-green-500"></span>
        共 {{ store.students.length }} 名学员
      </div>
    </div>

    <div class="flex gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchText" type="text" placeholder="搜索学员姓名或学号..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" @input="onSearch" />
      </div>
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
          <tr v-if="filteredStudents.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-gray-400">暂无学员数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Search } from 'lucide-vue-next'

const store = useAppStore()
const searchText = ref('')

const filteredStudents = computed(() => {
  if (!searchText.value.trim()) return store.students
  const q = searchText.value.trim().toLowerCase()
  return store.students.filter((s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q))
})

function onSearch() {
  // computed 自动响应，无需额外逻辑
}
</script>
