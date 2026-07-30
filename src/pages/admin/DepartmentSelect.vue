<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
    <div class="w-full max-w-4xl">
      <!-- Header -->
      <div class="text-center mb-10">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center mx-auto mb-4">
          <GraduationCap class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">选择管理学院</h1>
        <p class="text-gray-500">请选择一个学院进入管理后台</p>
      </div>

      <!-- Department Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <div
          v-for="dept in store.departments"
          :key="dept.id"
          @click="selectDepartment(dept)"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
              :style="{ backgroundColor: dept.color }"
            >
              {{ dept.name[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-900 text-lg group-hover:text-brand-600 transition-colors truncate">{{ dept.name }}</h3>
              <p class="text-sm text-gray-400 mt-0.5">
                {{ store.getDepartmentCategories(dept.id).length }} 个课程分类
              </p>
            </div>
            <ArrowRight class="w-5 h-5 text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
          </div>
        </div>

        <!-- Add Department Card -->
        <div
          @click="openAddModal"
          class="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[88px]"
        >
          <Plus class="w-8 h-8 text-gray-300 mb-1" />
          <span class="text-sm text-gray-400">添加学院</span>
        </div>

        <!-- Excel Import Card -->
        <div
          @click="triggerImport"
          class="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 hover:border-green-400 hover:bg-green-50/30 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[88px]"
        >
          <Upload class="w-8 h-8 text-gray-300 mb-1" />
          <span class="text-sm text-gray-400">Excel 导入</span>
        </div>
      </div>

      <!-- 隐藏的文件选择器 -->
      <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileChange" />

      <!-- 导入结果提示 -->
      <div v-if="importMsg" class="mt-6 text-sm text-center" :class="importMsg.success ? 'text-green-600' : 'text-red-500'">
        {{ importMsg.text }}
      </div>

      <!-- Footer -->
      <div class="text-center">
        <button @click="handleLogout" class="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1">
          <LogOut class="w-4 h-4" /> 退出登录
        </button>
      </div>
    </div>

    <!-- Add/Edit Department Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingDept ? '编辑学院' : '添加学院' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">学院名称</label>
              <input v-model="form.name" type="text" placeholder="如：计算机学院" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <div class="flex items-center gap-3">
                <input v-model="form.color" type="color" class="w-10 h-10 rounded cursor-pointer border" />
                <span class="text-sm text-gray-500">{{ form.color }}</span>
              </div>
            </div>
            <div v-if="editingDept" class="border-t pt-4">
              <button
                @click="confirmDeleteDept"
                class="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
              >
                <Trash2 class="w-4 h-4" /> 删除此学院
              </button>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleSave" :disabled="!form.name.trim()" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
                保存
              </button>
              <button @click="showModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showDeleteConfirm = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
          <p class="text-sm text-gray-500 mb-5">确定要删除「{{ deleteTarget?.name }}」吗？该学院下的课程分类和班级关联将被一并清理。</p>
          <div class="flex gap-3">
            <button @click="handleDelete" class="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">确认删除</button>
            <button @click="showDeleteConfirm = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { GraduationCap, Plus, ArrowRight, LogOut, Trash2, Upload } from 'lucide-vue-next'
import type { Department } from '@/types'
import * as XLSX from 'xlsx'

const store = useAppStore()
const router = useRouter()

const showModal = ref(false)
const editingDept = ref<Department | null>(null)
const form = ref({ name: '', color: '#3b82f6' })

const showDeleteConfirm = ref(false)
const deleteTarget = ref<Department | null>(null)

// ====== Excel 导入 ======
const fileInput = ref<HTMLInputElement>()
const importMsg = ref<{ success: boolean; text: string } | null>(null)

function triggerImport() {
  fileInput.value?.click()
}

async function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  importMsg.value = null

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      importMsg.value = { success: false, text: 'Excel 文件为空' }
      return
    }

    let imported = 0
    for (const row of rows) {
      const name = (row['学院名称'] || row['name'] || row['学院'] || '').trim()
      const color = (row['颜色'] || row['color'] || '#3b82f6').trim()
      if (!name) continue
      store.addDepartment({ id: `dept-${Date.now()}-${imported}`, name, color })
      imported++
    }

    if (imported === 0) {
      importMsg.value = { success: false, text: '未能从 Excel 解析到有效学院数据，请确认列名包含"学院名称"' }
    } else {
      importMsg.value = { success: true, text: `成功导入 ${imported} 个学院` }
    }
  } catch (e: any) {
    importMsg.value = { success: false, text: '导入失败：' + (e.message || '未知错误') }
  }

  if (fileInput.value) fileInput.value.value = ''
}

function selectDepartment(dept: Department) {
  store.setSelectedDepartment(dept.id)
  router.push('/admin/categories')
}

function openAddModal() {
  editingDept.value = null
  form.value = { name: '', color: '#3b82f6' }
  showModal.value = true
}

function handleSave() {
  if (!form.value.name.trim()) return
  if (editingDept.value) {
    store.updateDepartment(editingDept.value.id, {
      name: form.value.name.trim(),
      color: form.value.color,
    })
  } else {
    store.addDepartment({
      id: `dept-${Date.now()}`,
      name: form.value.name.trim(),
      color: form.value.color,
    })
  }
  showModal.value = false
}

function confirmDeleteDept() {
  if (editingDept.value) {
    deleteTarget.value = editingDept.value
    showDeleteConfirm.value = true
  }
}

function handleDelete() {
  if (deleteTarget.value) {
    store.deleteDepartment(deleteTarget.value.id)
    showDeleteConfirm.value = false
    deleteTarget.value = null
    showModal.value = false
  }
}

function handleLogout() {
  store.logout()
  router.replace('/login')
}
</script>
