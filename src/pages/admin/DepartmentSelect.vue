<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
    <div class="w-full max-w-4xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center mx-auto mb-4">
          <GraduationCap class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">选择管理学院</h1>
        <p class="text-gray-500">请选择一个学院进入管理后台</p>
      </div>

      <!-- 操作栏 -->
      <div class="flex items-center justify-between mb-4">
        <div class="text-sm text-gray-400">共 {{ store.departments.length }} 个学院</div>
        <div class="flex items-center gap-2">
          <button @click="triggerExcelImport" class="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Upload class="w-4 h-4" /> 导入Excel
          </button>
          <button @click="openAddModal" class="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Plus class="w-4 h-4" /> 添加学院
          </button>
        </div>
      </div>

      <!-- 导入结果提示 -->
      <div v-if="importMsg" :class="`text-sm p-3 rounded-lg mb-4 ${importMsg.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`">
        {{ importMsg.text }}
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
      </div>

      <!-- Footer -->
      <div class="text-center">
        <button @click="handleLogout" class="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1">
          <LogOut class="w-4 h-4" /> 退出登录
        </button>
      </div>
    </div>

    <!-- Excel 导入弹窗 -->
    <Teleport to="body">
      <div v-if="showImportModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showImportModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">从 Excel 导入学院</h3>
          <p class="text-sm text-gray-500 mb-4">Excel 文件需要包含"学院名称"列，可选"颜色"列（十六进制如 #3b82f6）。</p>

          <!-- 模板下载 -->
          <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p class="text-xs text-blue-600 mb-2">📋 没有模板？下载一个标准模板开始：</p>
            <button @click="downloadTemplate" class="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">下载模板</button>
          </div>

          <!-- 文件上传区域 -->
          <div
            @click="fileInput?.click()"
            @dragover.prevent
            @drop.prevent="handleDrop"
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors"
          >
            <Upload class="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p class="text-sm text-gray-600 mb-1">{{ importFile?.name || '点击选择或拖拽 Excel 文件到此处' }}</p>
            <p class="text-xs text-gray-400">支持 .xlsx 和 .xls 格式</p>
          </div>

          <div class="flex gap-3 pt-4 mt-4 border-t">
            <button @click="showImportModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
            <button @click="confirmImport" :disabled="!importFile" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">确认导入</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 隐藏的文件选择器 -->
    <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileSelect" />

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
import * as XLSX from 'xlsx'
import type { Department } from '@/types'

const store = useAppStore()
const router = useRouter()

// ====== 添加/编辑学院 ======
const showModal = ref(false)
const editingDept = ref<Department | null>(null)
const form = ref({ name: '', color: '#3b82f6' })

const showDeleteConfirm = ref(false)
const deleteTarget = ref<Department | null>(null)

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

// ====== Excel 导入学院 ======
const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const importMsg = ref<{ success: boolean; text: string } | null>(null)
const fileInput = ref<HTMLInputElement>()

const presetColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#ef4444', '#14b8a6', '#6366f1', '#84cc16']

function triggerExcelImport() {
  importFile.value = null
  importMsg.value = null
  showImportModal.value = true
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) importFile.value = file
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file) importFile.value = file
}

async function confirmImport() {
  if (!importFile.value) return
  importMsg.value = null

  try {
    const data = await importFile.value.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      importMsg.value = { success: false, text: 'Excel 文件为空，请检查文件内容' }
      return
    }

    const existingNames = new Set(store.departments.map((d) => d.name))
    let added = 0
    let skipped = 0

    for (const row of rows) {
      const name = String(row['学院名称'] || row['院系'] || row['系'] || row['name'] || '').trim()
      if (!name || existingNames.has(name)) {
        skipped++
        continue
      }
      const color = String(row['颜色'] || row['color'] || '').trim() || presetColors[store.departments.length % presetColors.length]
      store.addDepartment({
        id: `dept-${Date.now()}-${added}`,
        name,
        color: color.startsWith('#') ? color : `#${color}`,
      })
      existingNames.add(name)
      added++
    }

    if (added === 0) {
      importMsg.value = { success: false, text: `未能导入学院（跳过 ${skipped} 行）：请确保包含"学院名称"列` }
      return
    }

    importMsg.value = { success: true, text: `成功导入 ${added} 个学院${skipped ? `，跳过 ${skipped} 行（已存在或无名称）` : ''}` }
    setTimeout(() => { importMsg.value = null; showImportModal.value = false }, 2000)
  } catch (err: any) {
    importMsg.value = { success: false, text: '导入失败：' + (err.message || '未知错误') }
  }
}

function downloadTemplate() {
  const data = [
    { '学院名称': '计算机学院', '颜色': '#3b82f6' },
    { '学院名称': '信息工程学院', '颜色': '#10b981' },
    { '学院名称': '外国语学院', '颜色': '#f59e0b' },
  ]
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 20 }, { wch: 15 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '学院')
  XLSX.writeFile(wb, '学院导入模板.xlsx')
}
</script>
