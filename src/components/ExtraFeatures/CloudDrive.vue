<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <input ref="fileInputRef" type="file" @change="handleUpload" class="hidden" />
      <button @click="triggerUpload" class="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg transition-colors text-sm font-medium">
        <Upload class="w-4 h-4" /> 上传文件
      </button>
      <span class="text-sm text-gray-400">已用 {{ myCloudFiles.length }} 个文件</span>
    </div>

    <div v-if="myCloudFiles.length === 0" class="text-center py-12 text-gray-400">
      <Cloud class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>暂无文件，点击上方按钮上传</p>
    </div>

    <div class="space-y-2">
      <div v-for="f in myCloudFiles" :key="f.id" class="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow">
        <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
          <component :is="getFileIcon(f.type)" class="w-5 h-5 text-gray-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ f.name }}</p>
          <p class="text-xs text-gray-400">{{ formatSize(f.size) }} · {{ f.uploadedBy }} · {{ formatDate(f.uploadedAt) }}</p>
        </div>
        <button @click="handleDownload(f)" class="p-2 rounded-lg hover:bg-brand-600/10 text-gray-600 transition-colors" title="下载">
          <Download class="w-4 h-4" />
        </button>
        <button @click="store.deleteCloudFile(f.id)" class="p-2 rounded-lg hover:bg-brand-600/10 text-red-400 transition-colors" title="删除">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cloud, Upload, Download, Trash2, File, Image, FileSpreadsheet, FileArchive } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { CloudFile } from '@/types'
import { getNow } from '@/lib/date'

const store = useAppStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

const myCloudFiles = computed(() => store.cloudFiles.filter((f) => f.uploadedBy === store.currentUser))

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return FileArchive
  return File
}

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const handleUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    store.addCloudFile({
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: reader.result as string,
      uploadedAt: getNow().toISOString(),
      uploadedBy: store.currentUser || '未知',
    })
  }
  reader.readAsDataURL(file)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const handleDownload = (f: CloudFile) => {
  const a = document.createElement('a')
  a.href = f.dataUrl
  a.download = f.name
  a.click()
}
</script>