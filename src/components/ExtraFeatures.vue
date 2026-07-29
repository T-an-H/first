<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">额外功能</h1>
      <p class="text-gray-400 mt-1">云盘 · 待办 · 在线文档 · 笔记</p>
    </div>

    <div class="flex gap-1 bg-brand-400/10 p-1 rounded-xl">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-800'}`"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span class="relative">
          {{ tab.label }}
          <span v-if="tab.id === 'todos' && hasPendingReminders"
            class="absolute -top-2 -right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </span>
      </button>
    </div>

    <div class="bg-white rounded-xl p-6 border border-brand-400/30 shadow-sm">
      <CloudDrive v-if="activeTab === 'cloud'" />
      <TodoList v-else-if="activeTab === 'todos'" />
      <OnlineDocs v-else-if="activeTab === 'docs'" />
      <Notes v-else-if="activeTab === 'notes'" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Cloud, CheckCircle, FileText, Edit3 } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import CloudDrive from './ExtraFeatures/CloudDrive.vue'
import TodoList from './ExtraFeatures/TodoList.vue'
import OnlineDocs from './ExtraFeatures/OnlineDocs.vue'
import Notes from './ExtraFeatures/Notes.vue'

const store = useAppStore()

/** 是否有未完成的自动待办（显示红点） */
const hasPendingReminders = computed(() => {
  if (!store.currentUser) return false
  return store.todos.some((t) => t.createdBy === store.currentUser && !t.completed)
})

const tabs = [
  { id: 'cloud', label: '云盘', icon: Cloud },
  { id: 'todos', label: '待办', icon: CheckCircle },
  { id: 'docs', label: '在线文档', icon: FileText },
  { id: 'notes', label: '笔记', icon: Edit3 },
]

const activeTab = ref('cloud')

onMounted(() => {
  // 扫描所有课程，为已到时间的评价轮次生成待办提醒
  store.checkAndGenerateSessionReminders()
  // 全自动待办生成
  store.generateAutoTodos()
  // 如果有未完成的待办，默认切换到待办 tab
  if (store.currentUser && store.todos.some((t) => t.createdBy === store.currentUser && !t.completed)) {
    activeTab.value = 'todos'
  }
})
</script>