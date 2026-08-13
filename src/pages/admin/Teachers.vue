<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">教师管理</h1>
        <p class="mt-1 text-sm text-gray-500">
          教师账号来自数据库，以下信息与数据库同步。
        </p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">教师总数</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">{{ teacherRows.length }}</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <UserCheck class="h-5 w-5" />
          </div>
        </div>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已标注学院</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">{{ assignedDepartmentCount }}</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Building2 class="h-5 w-5" />
          </div>
        </div>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">授课课程数</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">{{ totalCourseCount }}</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <BookOpen class="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-1 flex-col gap-3 sm:flex-row">
          <div class="relative flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="keyword"
              type="text"
              placeholder="搜索教师姓名、邮箱、电话或学院"
              class="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            v-model="departmentFilter"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-56"
          >
            <option value="all">全部学院</option>
            <option
              v-for="department in departmentOptions"
              :key="department.id"
              :value="department.id"
            >
              {{ department.name }}
            </option>
          </select>
        </div>
        <div class="text-sm text-gray-500">
          共 {{ filteredTeachers.length }} 位教师
        </div>
      </div>

      <div class="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        已关联课程的教师暂不能直接删除，如需删除请先调整课程授课教师。
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">教师姓名</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">所属学院</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">电话</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">邮箱</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">课程数</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="teacher in filteredTeachers"
              :key="teacher.id"
              class="border-b border-gray-50 transition-colors hover:bg-gray-50"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                    {{ teacher.name.slice(0, 1) }}
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ teacher.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2 text-sm text-gray-700">
                  <span
                    class="h-2.5 w-2.5 rounded-full"
                    :style="{ backgroundColor: teacher.departmentColor }"
                  />
                  <span>{{ teacher.departmentName }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ teacher.phone || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ teacher.email || '-' }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {{ teacher.courseCount }} 门
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditTeacher(teacher)"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    title="编辑教师"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    @click="promptDeleteTeacher(teacher)"
                    :disabled="teacher.courseCount > 0"
                    :title="teacher.courseCount > 0 ? '该教师仍有关联课程，暂不能删除' : '删除教师'"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredTeachers.length === 0">
              <td colspan="6" class="px-4 py-14 text-center text-sm text-gray-400">
                暂无符合条件的教师
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showTeacherModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="closeTeacherModal" />
        <div class="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">编辑教师</h3>
            <button @click="closeTeacherModal" class="text-gray-400 transition-colors hover:text-gray-600">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-500">
                教师姓名 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="teacherForm.name"
                type="text"
                placeholder="请输入教师姓名"
                class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-500">
                所属学院 <span class="text-red-500">*</span>
              </label>
              <select
                v-model="teacherForm.departmentId"
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">请选择所属学院</option>
                <option
                  v-for="department in departmentOptions"
                  :key="department.id"
                  :value="department.id"
                >
                  {{ department.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-500">联系电话</label>
              <input
                v-model="teacherForm.phone"
                type="text"
                placeholder="请输入联系电话"
                class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-500">邮箱</label>
              <input
                v-model="teacherForm.email"
                type="email"
                placeholder="请输入邮箱"
                class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>

            <div class="flex gap-3 pt-2">
              <button
                @click="closeTeacherModal"
                class="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-200"
              >
                取消
              </button>
              <button
                @click="saveTeacher"
                class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white transition-colors hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="closeDeleteModal" />
        <div class="relative mx-4 w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle class="h-6 w-6 text-red-600" />
          </div>
          <h3 class="text-base font-semibold text-gray-800">确认删除</h3>
          <p class="mt-2 text-sm text-gray-500">
            确定要删除教师
            <span class="font-medium text-gray-800">{{ deletingTeacher?.name }}</span>
            吗？此操作不可恢复。
          </p>
          <div class="mt-5 flex gap-3">
            <button
              @click="closeDeleteModal"
              class="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200"
            >
              取消
            </button>
            <button
              @click="confirmDeleteTeacher"
              class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Pencil,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-vue-next'
import { deleteTeacher as apiDeleteTeacher, fetchDepartments, fetchTeachers, updateTeacher as apiUpdateTeacher } from '@/api'
import { useAppStore } from '@/stores/app'
import type { Department, Teacher } from '@/types'

type TeacherRow = Teacher & {
  departmentName: string
  departmentColor: string
  resolvedDepartmentId: string
  courseCount: number
}

const store = useAppStore()
const departments = ref<Department[]>([])
const teachers = ref<any[]>([])

const keyword = ref('')
const departmentFilter = ref('all')
const showTeacherModal = ref(false)
const showDeleteModal = ref(false)
const editingTeacherId = ref('')
const deletingTeacher = ref<TeacherRow | null>(null)
const formError = ref('')

const teacherForm = ref({
  name: '',
  departmentId: '',
  phone: '',
  email: '',
})

onMounted(() => {
  void loadPageData()
})

async function loadPageData() {
  try {
    const [departmentRes, teacherRes] = await Promise.all([
      fetchDepartments(),
      fetchTeachers(),
    ])

    if (departmentRes.success) {
      departments.value = departmentRes.departments
      store.departments = departmentRes.departments
    }

    if (teacherRes.success) {
      teachers.value = teacherRes.teachers
    }
  } catch (error) {
    console.error('加载教师数据失败:', error)
  }
}

const departmentOptions = computed(() =>
  [...departments.value].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
)

const departmentMap = computed(
  () => new Map<string, Department>(departments.value.map((department) => [department.id, department])),
)

const teacherRows = computed<TeacherRow[]>(() =>
  [...teachers.value]
    .map((teacher) => {
      const departmentId = teacher.departmentId || ''
      const department = departmentMap.value.get(departmentId)
      return {
        ...teacher,
        resolvedDepartmentId: departmentId,
        departmentName: teacher.departmentName || department?.name || '未设置',
        departmentColor: department?.color || '#d1d5db',
        courseCount: Number(teacher.courseCount || 0),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
)

const filteredTeachers = computed(() => {
  const search = keyword.value.trim().toLowerCase()

  return teacherRows.value.filter((teacher) => {
    const matchesDepartment =
      departmentFilter.value === 'all' || teacher.resolvedDepartmentId === departmentFilter.value

    if (!matchesDepartment) return false
    if (!search) return true

    return [
      teacher.name,
      teacher.phone,
      teacher.email,
      teacher.departmentName,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search))
  })
})

const assignedDepartmentCount = computed(
  () => teacherRows.value.filter((teacher) => teacher.resolvedDepartmentId).length,
)

const totalCourseCount = computed(
  () => teacherRows.value.reduce((sum, teacher) => sum + teacher.courseCount, 0),
)

function resetTeacherForm() {
  teacherForm.value = {
    name: '',
    departmentId: departmentFilter.value !== 'all' ? departmentFilter.value : '',
    phone: '',
    email: '',
  }
  editingTeacherId.value = ''
  formError.value = ''
}

function openEditTeacher(teacher: TeacherRow) {
  editingTeacherId.value = teacher.id
  teacherForm.value = {
    name: teacher.name,
    departmentId: teacher.resolvedDepartmentId,
    phone: teacher.phone || '',
    email: teacher.email || '',
  }
  formError.value = ''
  showTeacherModal.value = true
}

function closeTeacherModal() {
  showTeacherModal.value = false
  resetTeacherForm()
}

async function saveTeacher() {
  const name = teacherForm.value.name.trim()
  const departmentId = teacherForm.value.departmentId
  const phone = teacherForm.value.phone.trim()
  const email = teacherForm.value.email.trim()

  if (!name) {
    formError.value = '请先填写教师姓名。'
    return
  }

  if (!departmentId) {
    formError.value = '请选择所属学院后再提交。'
    return
  }

  const duplicateTeacher = teachers.value.find(
    (teacher) => teacher.name === name && teacher.id !== editingTeacherId.value,
  )
  if (duplicateTeacher) {
    formError.value = '教师姓名已存在，请换一个名称。'
    return
  }

  if (!editingTeacherId.value) {
    formError.value = '未找到要编辑的教师。'
    return
  }

  try {
    await apiUpdateTeacher(editingTeacherId.value, {
      name,
      departmentId,
      phone,
      email,
    })

    await loadPageData()
    closeTeacherModal()
  } catch (error: any) {
    formError.value = error?.message || '保存教师失败'
  }
}

function promptDeleteTeacher(teacher: TeacherRow) {
  if (teacher.courseCount > 0) return
  deletingTeacher.value = teacher
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingTeacher.value = null
}

async function confirmDeleteTeacher() {
  if (!deletingTeacher.value) return

  try {
    await apiDeleteTeacher(deletingTeacher.value.id)
    await loadPageData()
    closeDeleteModal()
  } catch (error: any) {
    window.alert(error?.message || '删除教师失败')
  }
}
</script>
