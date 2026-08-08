<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-3">
        <input ref="fileInputRef" type="file" class="hidden" @change="onFileSelected" />
        <button
          class="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          @click="triggerUpload"
        >
          <Upload class="h-4 w-4" />
          <span>上传文件</span>
        </button>
        <span class="text-sm text-gray-400">已用 {{ fileList.length }} 个文件</span>
      </div>

      <div
        v-if="store.currentRole === 'teacher'"
        class="flex flex-wrap items-center gap-3 lg:justify-end"
      >
        <span class="text-sm text-gray-500">上传后可见范围</span>
        <div class="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
            :class="uploadVisibility === 'private' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'"
            @click="uploadVisibility = 'private'"
          >
            <Lock class="h-4 w-4" />
            <span>仅自己可见</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
            :class="uploadVisibility === 'students' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'"
            @click="uploadVisibility = 'students'"
          >
            <Users class="h-4 w-4" />
            <span>公开给学生可见</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="fileList.length === 0" class="py-12 text-center text-gray-400">
      <Cloud class="mx-auto mb-3 h-12 w-12 opacity-50" />
      <p>暂无文件，点击上方按钮上传</p>
    </div>

    <div class="space-y-2">
      <div
        v-for="file in fileList"
        :key="file.id"
        class="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow"
      >
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
          <component :is="getFileIcon(file.type)" class="h-5 w-5 text-gray-500" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="truncate text-sm font-medium text-gray-900">{{ file.name }}</p>
            <span
              v-if="store.currentRole === 'teacher'"
              class="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="getVisibilityBadgeClass(file)"
            >
              {{ getVisibilityLabel(file) }}
            </span>
          </div>
          <p class="text-xs text-gray-400">
            {{ formatSize(file.size) }} · {{ file.uploadedBy }} · {{ formatDate(file.uploadedAt) }}
          </p>
          <p
            v-if="file.visibleToClassNames?.length && store.currentRole === 'teacher'"
            class="mt-0.5 text-xs text-brand-500"
          >
            可见班级：{{ file.visibleToClassNames.join('、') }}
          </p>
        </div>

        <button
          class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-brand-600/10"
          title="下载"
          @click="handleDownload(file)"
        >
          <Download class="h-4 w-4" />
        </button>
        <button
          v-if="canDelete(file)"
          class="rounded-lg p-2 text-red-400 transition-colors hover:bg-brand-600/10"
          title="删除"
          @click="store.deleteCloudFile(file.id)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Cloud,
  Download,
  File,
  FileArchive,
  FileSpreadsheet,
  Image,
  Lock,
  Trash2,
  Upload,
  Users,
} from 'lucide-vue-next'
import { getNow } from '@/lib/date'
import { useAppStore } from '@/stores/app'
import type { CloudFile } from '@/types'

const store = useAppStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadVisibility = ref<'private' | 'students'>('private')
const pendingFile = ref<{ name: string; size: number; type: string; dataUrl: string } | null>(null)

const isVisibleToStudents = (file: CloudFile, className?: string) => {
  if (file.visibilityScope === 'students') return true
  return Boolean(className && file.visibleToClassNames?.includes(className))
}

const fileList = computed(() => {
  const currentUser = store.currentUser
  if (!currentUser) return []

  if (store.currentRole === 'student') {
    const student = store.students.find((item) => item.name === currentUser)
    const myClassName = student?.className

    return store.cloudFiles.filter((file) => {
      if (file.uploadedBy === currentUser) return true
      return isVisibleToStudents(file, myClassName)
    })
  }

  return store.cloudFiles.filter((file) => file.uploadedBy === currentUser)
})

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    pendingFile.value = {
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: reader.result as string,
    }
    doUpload()
  }
  reader.readAsDataURL(file)

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const doUpload = () => {
  if (!pendingFile.value) return

  store.addCloudFile({
    id: Date.now().toString(),
    name: pendingFile.value.name,
    size: pendingFile.value.size,
    type: pendingFile.value.type,
    dataUrl: pendingFile.value.dataUrl,
    uploadedAt: getNow().toISOString(),
    uploadedBy: store.currentUser || '未知',
    visibilityScope: store.currentRole === 'teacher' ? uploadVisibility.value : 'private',
  })

  pendingFile.value = null
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return FileArchive
  return File
}

const getVisibilityLabel = (file: CloudFile) => {
  if (file.visibilityScope === 'students') return '公开给学生'
  if (file.visibleToClassNames?.length) return '按班级公开'
  return '仅自己可见'
}

const getVisibilityBadgeClass = (file: CloudFile) => {
  if (file.visibilityScope === 'students') return 'bg-emerald-50 text-emerald-600'
  if (file.visibleToClassNames?.length) return 'bg-brand-50 text-brand-600'
  return 'bg-gray-100 text-gray-500'
}

const canDelete = (file: CloudFile) => file.uploadedBy === store.currentUser

const handleDownload = (file: CloudFile) => {
  const anchor = document.createElement('a')
  anchor.href = file.dataUrl
  anchor.download = file.name
  anchor.click()
}
</script>
