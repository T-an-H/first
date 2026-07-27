<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <input type="text" v-model="newTitle" @keydown.enter="handleCreate" placeholder="新建文档标题..." class="flex-1 px-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none text-sm" />
      <button @click="handleCreate" class="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 新建
      </button>
      <label class="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium cursor-pointer">
        <Upload class="w-4 h-4" /> 导入文档
        <input type="file" accept=".txt,.md,.json,.csv" @change="handleImport" class="hidden" />
      </label>
    </div>

    <div v-if="myDocs.length === 0" class="text-center py-12 text-gray-400">
      <FileText class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>暂无文档，点击上方按钮新建</p>
    </div>

    <div v-for="doc in myDocs" :key="doc.id" class="bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden">
      <div v-if="editingId === doc.id" class="p-4 space-y-3">
        <input type="text" v-model="editTitle" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm font-medium" />
        <textarea v-model="editContent" rows="6" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm resize-y" placeholder="在此输入文档内容..."></textarea>
        <div class="flex gap-2">
          <button @click="handleSave(doc.id)" class="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-800 text-white rounded-lg transition-colors text-sm">
            <Save class="w-4 h-4" /> 保存
          </button>
          <button @click="editingId = null" class="px-4 py-2 bg-brand-400/10 hover:bg-brand-400/10 text-gray-600 rounded-lg transition-colors text-sm">取消</button>
        </div>
      </div>
      <div v-else class="p-4">
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-medium text-gray-900">{{ doc.title }}</h4>
          <div class="flex gap-1">
            <button @click="startEdit(doc)" class="p-1.5 rounded-lg hover:bg-brand-400/10 text-purple-500 transition-colors" title="编辑">
              <Edit3 class="w-4 h-4" />
            </button>
            <button @click="store.deleteOnlineDoc(doc.id)" class="p-1.5 rounded-lg hover:bg-brand-600/10 text-red-400 transition-colors" title="删除">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p v-if="doc.content" class="text-sm text-gray-600 whitespace-pre-wrap mb-3 line-clamp-3">{{ doc.content }}</p>
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <span>{{ doc.createdBy }}</span>
          <span>创建于 {{ formatDate(doc.createdAt) }}</span>
          <span>最后编辑 {{ formatDate(doc.lastEditedAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, FileText, Edit3, Save, Trash2, Upload } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { OnlineDoc } from '@/types'

const store = useAppStore()
const editingId = ref<string | null>(null)
const newTitle = ref('')
const editTitle = ref('')
const editContent = ref('')

const myDocs = computed(() => store.onlineDocs.filter((d) => d.createdBy === store.currentUser))

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const handleCreate = () => {
  if (!newTitle.value.trim()) return
  store.addOnlineDoc({
    id: Date.now().toString(),
    title: newTitle.value.trim(),
    content: '',
    createdBy: store.currentUser || '未知',
    createdAt: new Date().toISOString(),
    lastEditedAt: new Date().toISOString(),
    lastEditedBy: store.currentUser || '未知',
  })
  newTitle.value = ''
}

const handleImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    store.addOnlineDoc({
      id: Date.now().toString(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      content: content,
      createdBy: store.currentUser || '未知',
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: store.currentUser || '未知',
    })
    alert(`文档 "${file.name}" 导入成功！`)
  }
  reader.onerror = () => {
    alert('文件读取失败，请重试')
  }
  reader.readAsText(file)
  
  target.value = ''
}

const handleSave = (id: string) => {
  store.updateOnlineDoc(id, {
    title: editTitle.value,
    content: editContent.value,
    lastEditedAt: new Date().toISOString(),
    lastEditedBy: store.currentUser || '未知',
  })
  editingId.value = null
}

const startEdit = (doc: OnlineDoc) => {
  editingId.value = doc.id
  editTitle.value = doc.title
  editContent.value = doc.content
}
</script>