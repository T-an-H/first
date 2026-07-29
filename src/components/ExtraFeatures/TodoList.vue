<template>
  <div class="space-y-4">
    <!-- 手动添加待办 -->
    <div class="flex items-center gap-3">
      <input type="text" v-model="title" @keydown.enter="handleAdd" placeholder="添加待办事项..." class="flex-1 px-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none text-sm" />
      <input type="date" v-model="dueDate" class="px-3 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm" />
      <button @click="handleAdd" class="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 添加
      </button>
    </div>

    <div v-if="activeTodos.length > 0" class="space-y-1.5">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">待完成</p>
      <div v-for="t in activeTodos" :key="t.id" class="flex items-center gap-3 p-3 bg-white rounded-lg border border-brand-400/20 shadow-sm group">
        <button @click="store.updateTodo(t.id, { completed: true })" class="flex-shrink-0">
          <Circle class="w-5 h-5 text-gray-400/60 hover:text-gray-600 transition-colors" />
        </button>
        <span class="flex-1 text-sm text-gray-900">{{ t.title }}</span>
        <span v-if="t.dueDate" class="text-xs text-gray-400">{{ t.dueDate }}</span>
        <button @click="store.deleteTodo(t.id)" class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-brand-600/10 text-red-400 transition-all">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="doneTodos.length > 0" class="space-y-1.5">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">已完成</p>
      <div v-for="t in doneTodos" :key="t.id" class="flex items-center gap-3 p-3 bg-brand-400/10 rounded-lg border border-brand-400/20">
        <button @click="store.updateTodo(t.id, { completed: false })" class="flex-shrink-0">
          <CheckCircle class="w-5 h-5 text-gray-600" />
        </button>
        <span class="flex-1 text-sm text-gray-400 line-through">{{ t.title }}</span>
        <button @click="store.deleteTodo(t.id)" class="p-1 rounded hover:bg-brand-600/10 text-red-400 transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="myTodos.length === 0" class="text-center py-12 text-gray-400">
      <CheckCircle class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>暂无待办事项</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Circle, CheckCircle, X } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { getNow } from '@/lib/date'

const store = useAppStore()
const title = ref('')
const dueDate = ref('')

const myTodos = computed(() => store.todos.filter((t) => t.createdBy === store.currentUser))
const activeTodos = computed(() => myTodos.value.filter((t) => !t.completed))
const doneTodos = computed(() => myTodos.value.filter((t) => t.completed))

onMounted(() => {
  store.generateAutoTodos()
})

/** 待配置的课程（仅教师端） */
const pendingConfigCourses = computed(() => store.getPendingConfigCourses())

/** 当前用户的待办评价提醒（未完成的） */
const pendingEvalReminders = computed(() => {
  if (!store.currentUser) return []
  if (store.currentRole === 'teacher') {
    return store.evalReminders.filter(
      (r) => r.studentId === store.currentUser && r.status !== 'completed'
    )
  }
  if (store.currentRole === 'student') {
    const student = store.students.find((s) => s.name === store.currentUser)
    if (!student) return []
    return store.evalReminders.filter(
      (r) => r.studentId === student.id && r.status !== 'completed'
    )
  }
  return []
})

/** 当前学生待完成的 AI 分层测试 */
const pendingAITierTests = computed(() => {
  if (store.currentRole !== 'student' || !store.currentUser) return []
  const student = store.students.find((s) => s.name === store.currentUser)
  if (!student) return []
  return store.getPendingAITierTests(student.id)
})

/** 当前用户各评价提醒的分组 */
const evalReminderGroups = computed(() => {
  const groups = new Map<string, { courseTitle: string; session: number; types: string[]; key: string }>()
  for (const r of pendingEvalReminders.value) {
    const key = `${r.courseId}||${r.sessionNumber}`
    if (!groups.has(key)) {
      groups.set(key, { courseTitle: r.courseTitle, session: r.sessionNumber, types: [], key })
    }
    // 从 reminderId 中提取 type: session-reminder-{courseId}-{targetId}-{type}-{session}
    const parts = r.id.split('-')
    const type = parts[parts.length - 2]
    if (type && !groups.get(key)!.types.includes(type)) {
      groups.get(key)!.types.push(type)
    }
  }
  return Array.from(groups.values()).map((g) => ({
    ...g,
    label: `第${g.session}次评价 · ${g.types.map((t) => EvalTypeLabels[t as keyof typeof EvalTypeLabels] || t).join('、')}`,
    link: store.currentRole === 'teacher'
      ? `/teacher/courses/${g.key.split('||')[0]}`
      : `/student/courses/${g.key.split('||')[0]}`,
  }))
})

const handleAdd = () => {
  if (!title.value.trim()) return
  store.addTodo({
    id: Date.now().toString(),
    title: title.value.trim(),
    completed: false,
    createdAt: getNow().toISOString(),
    dueDate: dueDate.value || undefined,
    createdBy: store.currentUser || '未知',
  })
  title.value = ''
  dueDate.value = ''
}
</script>