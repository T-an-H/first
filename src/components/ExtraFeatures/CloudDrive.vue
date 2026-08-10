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

      <span v-if="isFileManager" class="text-sm text-gray-400">
        上传后可设置哪些课程、哪些班级的学生可见
      </span>
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
              v-if="isFileManager"
              class="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="getVisibilityBadgeClass(file)"
            >
              {{ getVisibilityLabel(file) }}
            </span>
          </div>
          <p class="text-xs text-gray-400">
            {{ formatSize(file.size) }} · {{ file.uploadedBy }} · {{ formatDate(file.uploadedAt) }}
          </p>

          <!-- 教师/导师端：可见课程 / 可见班级 -->
          <div v-if="isFileManager" class="mt-1 space-y-0.5">
            <p v-if="getVisibleCourseTitles(file).length" class="text-xs text-brand-500">
              可见课程：{{ getVisibleCourseTitles(file).join('、') }}
            </p>
            <p v-else class="text-xs text-gray-400">仅自己可见</p>
            <p v-if="file.visibleToClassNames?.length" class="text-xs text-emerald-600">
              可见班级：{{ file.visibleToClassNames.join('、') }}
            </p>
            <p v-else-if="file.courseIds?.length || file.courseId" class="text-xs text-gray-400">
              全部班级可见
            </p>
          </div>
          <!-- 学生端：显示来源课程 -->
          <p v-else-if="getVisibleCourseTitles(file).length" class="mt-0.5 text-xs text-gray-400">
            来自课程：{{ getVisibleCourseTitles(file).join('、') }}
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
          v-if="canDelete(file) && isFileManager"
          class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-brand-600/10"
          title="设置可见范围"
          @click="openEdit(file)"
        >
          <Settings2 class="h-4 w-4" />
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

    <!-- ====== 设置可见范围弹窗（上传时 / 编辑已有文件） ====== -->
    <Teleport to="body">
      <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="closeModal" />
        <div class="relative flex max-h-[80vh] w-full max-w-md flex-col mx-4 rounded-xl bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h3 class="text-base font-semibold text-gray-800">{{ editTarget ? '编辑可见范围' : '设置可见范围' }}</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="closeModal">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <div>
              <p class="mb-1 text-sm font-medium text-gray-700">文件名</p>
              <p class="truncate rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                {{ pendingFile?.name || editTarget?.name }}
              </p>
            </div>

            <div>
              <p class="mb-2 text-sm font-medium text-gray-700">
                选择可见课程（多选，不选则仅自己可见）
              </p>
              <div class="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2">
                <label
                  v-for="course in teacherCourses"
                  :key="course.id"
                  class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
                >
                  <input
                    v-model="selectedCourseIds"
                    type="checkbox"
                    :value="course.id"
                    class="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span class="min-w-0">
                    <span class="block truncate text-gray-800">{{ course.title }}</span>
                    <span class="block text-xs text-gray-400">{{ getCourseClassNames(course.id).length }} 个班级</span>
                  </span>
                </label>
                <p v-if="teacherCourses.length === 0" class="py-3 text-center text-xs text-gray-400">
                  暂无课程，请先在课程管理中创建课程
                </p>
              </div>
            </div>

            <div v-if="allSelectedCourseClassNames.length">
              <p class="mb-2 text-sm font-medium text-gray-700">
                选择可见班级（多选，不选则所选课程全部班级可见）
              </p>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="className in allSelectedCourseClassNames"
                  :key="className"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                  :class="selectedClassNames.includes(className) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
                >
                  <input
                    v-model="selectedClassNames"
                    type="checkbox"
                    :value="className"
                    class="hidden"
                  />
                  {{ className }}
                </label>
              </div>
            </div>

            <p v-if="!selectedCourseIds.length" class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
              未选择任何课程时，文件将仅自己可见
            </p>
          </div>

          <div class="flex gap-3 border-t border-gray-200 px-5 py-4">
            <button
              class="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-200"
              @click="closeModal"
            >
              取消
            </button>
            <button
              class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-800"
              @click="confirmVisibility"
            >
              确认{{ selectedCourseIds.length ? `（${selectedCourseIds.length} 个课程）` : '（仅自己可见）' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Cloud,
  Download,
  File,
  FileArchive,
  FileSpreadsheet,
  Image,
  Settings2,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next'
import { getNow } from '@/lib/date'
import { useAppStore } from '@/stores/app'
import type { CloudFile } from '@/types'

const store = useAppStore()
const route = useRoute()
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingFile = ref<{ name: string; size: number; type: string; dataUrl: string } | null>(null)
const editTarget = ref<CloudFile | null>(null)
const modalOpen = ref(false)
const selectedCourseIds = ref<string[]>([])
const selectedClassNames = ref<string[]>([])

// ====== 教师/导师可见性判断 ======

/**
 * 是否可管理文件可见范围：教师、企业导师、以及学院领导在教师/导师部分（与对应角色一致）
 */
const isFileManager = computed(() => {
  const role = store.currentRole
  if (role === 'teacher' || role === 'mentor') return true
  if (role === 'leader') {
    return route.path.startsWith('/teacher') || route.path.startsWith('/mentor')
  }
  return false
})

/** 当前身份可见的课程：教师自己的授课课程 / 导师负责的课程 / 领导教师部分的专属授课课程 */
const teacherCourses = computed(() => {
  const currentUser = store.currentUser || ''
  const role = store.currentRole
  if (role === 'teacher') {
    return store.courses.filter((c) => c.teacher === currentUser)
  }
  if (role === 'mentor') {
    const ids = store.getMentorCourseIds(currentUser)
    return store.courses.filter((c) => ids.includes(c.id))
  }
  if (role === 'leader' && route.path.startsWith('/teacher')) {
    return store.getLeaderTeacherCourses(currentUser)
  }
  if (role === 'leader' && route.path.startsWith('/mentor')) {
    const ids = store.getMentorCourseIds(currentUser)
    return store.courses.filter((c) => ids.includes(c.id))
  }
  return []
})

/** 获取某课程选课学生所在的班级（去重） */
const getCourseClassNames = (courseId: string): string[] => {
  const enrolledIds = store.enrollments
    .filter((e) => e.courseId === courseId && e.status !== 'dropped')
    .map((e) => e.studentId)
  const names = new Set<string>()
  for (const sid of enrolledIds) {
    const student = store.students.find((s) => s.id === sid)
    if (student?.className) names.add(student.className)
  }
  return [...names]
}

/** 已选课程的班级并集 */
const allSelectedCourseClassNames = computed(() => {
  const names = new Set<string>()
  selectedCourseIds.value.forEach((cid) => {
    getCourseClassNames(cid).forEach((n) => names.add(n))
  })
  return [...names]
})

/** 课程 id → 标题 */
const getCourseTitle = (courseId: string): string =>
  store.courses.find((c) => c.id === courseId)?.title || courseId

/** 文件可见课程标题列表（兼容旧 courseId 字段） */
const getVisibleCourseTitles = (file: CloudFile): string[] => {
  const ids = file.courseIds?.length ? file.courseIds : file.courseId ? [file.courseId] : []
  return ids.map(getCourseTitle)
}

/** 学生可见性：需学生选修该文件可见课程，且所在班级在可见班级中（或无班级限制） */
const isVisibleToStudent = (file: CloudFile, studentId: string, className?: string): boolean => {
  const fileCourseIds = file.courseIds?.length ? file.courseIds : file.courseId ? [file.courseId] : []
  if (fileCourseIds.length) {
    const myCourseIds = new Set(
      store.enrollments.filter((e) => e.studentId === studentId).map((e) => e.courseId)
    )
    if (!fileCourseIds.some((cid) => myCourseIds.has(cid))) return false
  }
  if (file.visibleToClassNames?.length) {
    return Boolean(className && file.visibleToClassNames.includes(className))
  }
  return true
}

const fileList = computed(() => {
  const currentUser = store.currentUser
  if (!currentUser) return []

  if (store.currentRole === 'student') {
    const student = store.students.find((item) => item.name === currentUser)

    return store.cloudFiles.filter((file) => {
      if (file.uploadedBy === currentUser) return true
      return isVisibleToStudent(file, student?.id || '', student?.className)
    })
  }

  return store.cloudFiles.filter((file) => file.uploadedBy === currentUser)
})

// ====== 上传 ======

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
    editTarget.value = null
    selectedCourseIds.value = []
    selectedClassNames.value = []
    modalOpen.value = true
  }
  reader.readAsDataURL(file)

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// ====== 编辑已有文件可见范围 ======

const openEdit = (file: CloudFile) => {
  pendingFile.value = null
  editTarget.value = file
  selectedCourseIds.value = file.courseIds?.length
    ? [...file.courseIds]
    : file.courseId
      ? [file.courseId]
      : []
  selectedClassNames.value = file.visibleToClassNames?.length ? [...file.visibleToClassNames] : []
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
  pendingFile.value = null
  editTarget.value = null
  selectedCourseIds.value = []
  selectedClassNames.value = []
}

const confirmVisibility = () => {
  const courseIds = [...selectedCourseIds.value]
  const classNames = courseIds.length ? [...selectedClassNames.value] : []
  const payload = {
    courseIds,
    // 旧字段兼容：单课程时同步 courseId
    courseId: courseIds.length === 1 ? courseIds[0] : undefined,
    visibleToClassNames: classNames,
    visibilityScope: (courseIds.length ? 'students' : 'private') as 'students' | 'private',
  }

  if (pendingFile.value) {
    store.addCloudFile({
      id: Date.now().toString(),
      name: pendingFile.value.name,
      size: pendingFile.value.size,
      type: pendingFile.value.type,
      dataUrl: pendingFile.value.dataUrl,
      uploadedAt: getNow().toISOString(),
      uploadedBy: store.currentUser || '未知',
      ...payload,
    })
  } else if (editTarget.value) {
    store.updateCloudFile(editTarget.value.id, payload)
  }

  closeModal()
}

// ====== 展示辅助 ======

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
  const courseIds = file.courseIds?.length ? file.courseIds : file.courseId ? [file.courseId] : []
  if (courseIds.length === 0) return '仅自己可见'
  if (file.visibleToClassNames?.length) return '按班级公开'
  return '公开给学生'
}

const getVisibilityBadgeClass = (file: CloudFile) => {
  const courseIds = file.courseIds?.length ? file.courseIds : file.courseId ? [file.courseId] : []
  if (courseIds.length === 0) return 'bg-gray-100 text-gray-500'
  if (file.visibleToClassNames?.length) return 'bg-emerald-50 text-emerald-600'
  return 'bg-brand-50 text-brand-600'
}

const canDelete = (file: CloudFile) => file.uploadedBy === store.currentUser

const handleDownload = (file: CloudFile) => {
  const anchor = document.createElement('a')
  anchor.href = file.dataUrl
  anchor.download = file.name
  anchor.click()
}
</script>
