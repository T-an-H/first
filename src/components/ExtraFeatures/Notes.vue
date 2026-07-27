<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <input type="text" v-model="newTitle" @keydown.enter="handleCreate" placeholder="新建笔记标题..." class="flex-1 px-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-emerald-500 focus:ring-2 focus:ring-brand-600/20 outline-none text-sm" />
      <button @click="handleCreate" class="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 新建
      </button>
      <label class="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium cursor-pointer">
        <Upload class="w-4 h-4" /> 上传文件
        <input type="file" accept=".txt,.md,.csv,.pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg,.gif" @change="handleUpload" class="hidden" />
      </label>
    </div>

    <div v-if="myNotes.length === 0" class="text-center py-12 text-gray-400">
      <Edit3 class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>暂无笔记，点击上方按钮新建</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="note in myNotes" :key="note.id" class="bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden">
        <div v-if="editingId === note.id" class="p-4 space-y-3">
          <input type="text" v-model="editTitle" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-medium" />
          <textarea v-model="editContent" rows="5" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm resize-y" placeholder="在此输入笔记内容..."></textarea>
          <div v-if="editAttachments.length > 0" class="flex flex-wrap gap-2">
            <span v-for="(att, idx) in editAttachments" :key="idx" class="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
              <FileText class="w-3 h-3" />
              {{ att.fileName }}
              <button @click="editAttachments.splice(idx, 1)" class="hover:text-red-500">
                <X class="w-3 h-3" />
              </button>
            </span>
          </div>
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
              <Paperclip class="w-4 h-4" /> 添加附件
              <input type="file" @change="handleAddAttachment" class="hidden" />
            </label>
            <div class="flex gap-2">
              <button @click="handleSave(note.id)" class="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm">
                <Save class="w-4 h-4" /> 保存
              </button>
              <button @click="editingId = null" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors text-sm">取消</button>
            </div>
          </div>
        </div>
        <div v-else class="p-4 cursor-pointer hover:bg-brand-400/10 transition-colors h-full" @click="startEdit(note)">
          <div class="flex items-start justify-between mb-2">
            <h4 class="font-medium text-gray-900">{{ note.title }}</h4>
            <button @click.stop="store.deleteNote(note.id)" class="p-1 rounded hover:bg-brand-600/10 text-red-400 transition-colors flex-shrink-0" title="删除">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          <p v-if="note.content" class="text-sm text-gray-500 whitespace-pre-wrap line-clamp-3 mb-2">{{ note.content }}</p>
          <div v-if="note.attachments && note.attachments.length > 0" class="flex flex-wrap gap-2 mb-2">
            <span v-for="(att, idx) in note.attachments" :key="idx" class="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
              <Paperclip class="w-3 h-3" />
              {{ att.fileName }}
            </span>
          </div>
          <p class="text-xs text-gray-400">更新于 {{ formatDate(note.updatedAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Edit3, Save, Trash2, Upload, FileText, X, Paperclip } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { Note } from '@/types'

const store = useAppStore()
const editingId = ref<string | null>(null)
const newTitle = ref('')
const editTitle = ref('')
const editContent = ref('')
const editAttachments = ref<Note['attachments']>([])

const myNotes = computed(() => store.notes.filter((n) => n.createdBy === store.currentUser))

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const handleCreate = () => {
  if (!newTitle.value.trim()) return
  store.addNote({
    id: Date.now().toString(),
    title: newTitle.value.trim(),
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: store.currentUser || '未知',
    attachments: [],
  })
  newTitle.value = ''
}

const handleUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|csv)$/i)) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      store.addNote({
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: store.currentUser || '未知',
        attachments: [],
      })
      alert(`笔记 "${file.name}" 上传成功！`)
    }
    reader.onerror = () => {
      alert('文件读取失败，请重试')
    }
    reader.readAsText(file)
  } else {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      store.addNote({
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: store.currentUser || '未知',
        attachments: [{
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          dataUrl: dataUrl,
        }],
      })
      alert(`笔记 "${file.name}" 上传成功！`)
    }
    reader.onerror = () => {
      alert('文件读取失败，请重试')
    }
    reader.readAsDataURL(file)
  }
  
  target.value = ''
}

const handleAddAttachment = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    editAttachments.value.push({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      dataUrl: dataUrl,
    })
  }
  reader.onerror = () => {
    alert('文件读取失败，请重试')
  }
  reader.readAsDataURL(file)
  
  target.value = ''
}

const handleSave = (id: string) => {
  store.updateNote(id, {
    title: editTitle.value,
    content: editContent.value,
    updatedAt: new Date().toISOString(),
    attachments: editAttachments.value,
  })
  editingId.value = null
}

const startEdit = (note: Note) => {
  editingId.value = note.id
  editTitle.value = note.title
  editContent.value = note.content
  editAttachments.value = note.attachments ? [...note.attachments] : []
}
</script>