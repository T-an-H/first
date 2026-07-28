<template>
  <div class="space-y-4">
    <!-- 上传按钮 -->
    <div class="flex items-center gap-3">
      <input ref="fileInputRef" type="file" @change="onFileSelected" class="hidden" />
      <button @click="triggerUpload" class="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg transition-colors text-sm font-medium">
        <Upload class="w-4 h-4" /> 上传文件
      </button>
      <span class="text-sm text-gray-400">已用 {{ fileList.length }} 个文件</span>
    </div>

    <!-- 空状态 -->
    <div v-if="fileList.length === 0" class="text-center py-12 text-gray-400">
      <Cloud class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>暂无文件，点击上方按钮上传</p>
    </div>

    <!-- 文件列表 -->
    <div class="space-y-2">
      <div v-for="f in fileList" :key="f.id" class="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow">
        <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
          <component :is="getFileIcon(f.type)" class="w-5 h-5 text-gray-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ f.name }}</p>
          <p class="text-xs text-gray-400">{{ formatSize(f.size) }} · {{ f.uploadedBy }} · {{ formatDate(f.uploadedAt) }}</p>
          <!-- 显示可见班级 -->
          <p v-if="f.visibleToClassNames && f.visibleToClassNames.length > 0 && store.currentRole === 'teacher'" class="text-xs text-brand-500 mt-0.5">
            可见班级：{{ f.visibleToClassNames.join('、') }}
          </p>
        </div>
        <button @click="handleDownload(f)" class="p-2 rounded-lg hover:bg-brand-600/10 text-gray-600 transition-colors" title="下载">
          <Download class="w-4 h-4" />
        </button>
        <button @click="store.deleteCloudFile(f.id)" class="p-2 rounded-lg hover:bg-brand-600/10 text-red-400 transition-colors" title="删除">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 班级选择弹窗 -->
    <Teleport to="body">
      <div v-if="showClassPicker" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="cancelUpload" />
        <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
          <div class="px-5 py-4 border-b border-gray-200">
            <h3 class="text-base font-semibold text-gray-800">选择可见班级</h3>
            <p class="text-xs text-gray-400 mt-1">选择哪些班级可以查看该文件（支持多选）</p>
          </div>
          <div class="px-5 py-4 max-h-64 overflow-auto">
            <div v-if="availableClasses.length === 0" class="text-center py-6 text-gray-400 text-sm">
              暂无可选班级，当前课程下没有学生
            </div>
            <label v-for="cls in availableClasses" :key="cls"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="checkbox" :value="cls" v-model="selectedClasses"
                class="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer" />
              <span class="text-sm text-gray-700">{{ cls }}</span>
            </label>
          </div>
          <div class="px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button @click="cancelUpload" class="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">取消</button>
            <button @click="confirmUpload" class="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors">
              确认上传
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

/** 当前用户的文件列表（教师看到自己的文件，学生看到自己上传+教师分享给本班的） */
const fileList = computed(() => {
  const currentUser = store.currentUser
  if (!currentUser) return []
  if (store.currentRole === 'student') {
    const student = store.students.find((s) => s.name === currentUser)
    const myClassName = student?.className
    return store.cloudFiles.filter((f) => {
      // 自己上传的
      if (f.uploadedBy === currentUser) return true
      // 教师分享给本班的
      if (myClassName && f.visibleToClassNames?.includes(myClassName)) return true
      return false
    })
  }
  // 教师/管理员等：只看到自己上传的
  return store.cloudFiles.filter((f) => f.uploadedBy === currentUser)
})

/** 教师课程相关的班级列表 */
const availableClasses = computed<string[]>(() => {
  if (store.currentRole !== 'teacher') return []
  const myCourses = store.courses.filter((c) => c.teacher === store.currentUser)
  const myCourseIds = new Set(myCourses.map((c) => c.id))
  const classNames = new Set<string>()
  for (const enrollment of store.enrollments) {
    if (!myCourseIds.has(enrollment.courseId)) continue
    const student = store.students.find((s) => s.id === enrollment.studentId)
    if (student?.className) classNames.add(student.className)
  }
  return Array.from(classNames).sort()
})

// ---- 上传流程 ----
const showClassPicker = ref(false)
/** 待上传的原始文件（选择文件后暂存） */
const pendingFile = ref<{ name: string; size: number; type: string; dataUrl: string } | null>(null)
/** 弹窗中选中的班级 */
const selectedClasses = ref<string[]>([])

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const onFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement
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
    // 如果是教师，弹出班级选择框
    if (store.currentRole === 'teacher') {
      selectedClasses.value = []
      showClassPicker.value = true
    } else {
      // 非教师直接上传
      doUpload([])
    }
  }
  reader.readAsDataURL(file)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const confirmUpload = () => {
  showClassPicker.value = false
  doUpload(selectedClasses.value)
}

const cancelUpload = () => {
  showClassPicker.value = false
  pendingFile.value = null
}

function doUpload(classNames: string[]) {
  if (!pendingFile.value) return
  store.addCloudFile({
    id: Date.now().toString(),
    name: pendingFile.value.name,
    size: pendingFile.value.size,
    type: pendingFile.value.type,
    dataUrl: pendingFile.value.dataUrl,
    uploadedAt: getNow().toISOString(),
    uploadedBy: store.currentUser || '未知',
    visibleToClassNames: classNames.length > 0 ? classNames : undefined,
  })
  pendingFile.value = null
}

// ---- 工具函数 ----
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

const handleDownload = (f: CloudFile) => {
  const a = document.createElement('a')
  a.href = f.dataUrl
  a.download = f.name
  a.click()
}
</script>
