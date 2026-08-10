<template>
  <div class="space-y-6">
    <!-- ============ Level 0: 学院选择 ============ -->
    <template v-if="!currentDept">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">课程管理</h1>
          <p class="text-gray-500 mt-1">请选择一个学院进入课程管理</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="triggerDeptExcelImport" class="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Upload class="w-4 h-4" /> 导入Excel
          </button>
          <button @click="openAddDeptModal" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Plus class="w-4 h-4" /> 添加学院
          </button>
        </div>
      </div>

      <!-- 学院导入结果提示 -->
      <div v-if="deptImportMsg" :class="`text-sm p-3 rounded-lg ${deptImportMsg.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`">
        {{ deptImportMsg.text }}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="dept in store.departments"
          :key="dept.id"
          @click="selectDepartment(dept)"
          class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" :style="{ backgroundColor: dept.color }">
              {{ dept.name[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">{{ dept.name }}</h3>
              <p class="text-xs text-gray-400 mt-0.5">{{ getDeptCourseCount(dept.id) }} 门课程</p>
            </div>
            <ArrowRight class="w-5 h-5 text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
          </div>
        </div>
      </div>
    </template>

    <!-- ============ Level 1: 学院课程卡片 ============ -->
    <template v-else-if="!selectedCourse">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">课程管理</h1>
          <p class="text-gray-500 mt-1">
            当前学院：<span class="font-medium text-gray-700">{{ currentDeptName }}</span>
            — 查看学院课程，点击课程查看排课信息
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="triggerCourseImport" class="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Upload class="w-4 h-4" /> 导入Excel
          </button>
          <button @click="openCourseModal()" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Plus class="w-4 h-4" /> 新增课程
          </button>
          <button @click="switchDepartment" class="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw class="w-4 h-4" /> 切换学院
          </button>
        </div>
      </div>

      <!-- 课程导入结果提示 -->
      <div v-if="courseImportMsg" :class="`text-sm p-3 rounded-lg ${courseImportMsg.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`">
        {{ courseImportMsg.text }}
      </div>

      <!-- 课程卡片网格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="course in departmentCourses"
          :key="course.id"
          @click="selectCourse(course)"
          class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ backgroundColor: getCourseColor(course) }">
              <BookOpen class="w-5 h-5 text-white" />
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusClass(course.status)">
              {{ statusLabel(course.status) }}
            </span>
          </div>
          <h3 class="font-semibold text-gray-900">{{ course.title }}</h3>
          <p class="text-xs text-gray-400 mt-1">{{ getCourseScheduleCount(course) }} 条排课</p>
        </div>

        <div v-if="departmentCourses.length === 0" class="col-span-full text-center py-20 text-gray-400">
          <BookOpen class="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p class="mb-3">该学院暂无课程</p>
          <p class="text-xs text-gray-300">请先在教务系统中录入课程，或联系系统管理员</p>
        </div>
      </div>
    </template>

    <!-- ============ Level 2: 课程排课 ============ -->
    <template v-else>
      <!-- 返回 + 标题 -->
      <div class="flex items-center gap-3 mb-2">
        <button @click="selectedCourse = null" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft class="w-4 h-4" /> 返回课程列表
        </button>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ backgroundColor: getCourseColor(selectedCourse) }">
            <BookOpen class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ selectedCourse.title }}</h1>
            <p class="text-gray-500 mt-1">{{ courseSchedules.length }} 条排课记录</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="triggerImport" class="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Upload class="w-4 h-4" /> 导入Excel
          </button>
          <button @click="openAdd" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
            <Plus class="w-4 h-4" /> 新增排课
          </button>
        </div>
      </div>

      <!-- 搜索 -->
      <div class="relative max-w-md">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchText" type="text" placeholder="搜索教师或教室..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
      </div>

      <!-- 排课列表 -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">课程</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">教师</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">企业导师</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">教室</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">周几</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">时间段</th>
              <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="sch in courseSchedules" :key="sch.id" class="hover:bg-gray-50/50 transition-colors"
              :class="isConflicting(sch) ? 'bg-red-50/50' : ''">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 text-sm">{{ sch.title || selectedCourse.title }}</span>
                  <span v-if="isConflicting(sch)" class="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">冲突</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ sch.teacher }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ sch.mentor || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ sch.room }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ getDayLabel(sch) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ sch.timeSlot }}</td>
              <td class="px-4 py-3 text-right">
                <button @click="openEdit(sch)" class="text-xs px-2.5 py-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors">编辑</button>
                <button @click="confirmDelete(sch)" class="text-xs px-2.5 py-1.5 text-red-400 hover:bg-red-50 rounded transition-colors ml-1">删除</button>
              </td>
            </tr>
            <tr v-if="courseSchedules.length === 0">
              <td colspan="7" class="text-center py-12 text-gray-400 text-sm">
                <CalendarX class="w-8 h-8 mx-auto mb-2 text-gray-200" />
                {{ searchText ? '没有匹配的排课记录' : '该课程暂无排课记录' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 统计 -->
      <div class="text-xs text-gray-400">
        共 {{ allCourseSchedules.length }} 条排课记录
        <span v-if="courseConflictPairs.length > 0" class="text-red-500 ml-2 cursor-pointer hover:underline" @click="showConflictModal = true">{{ courseConflictPairs.length }} 组冲突，点击查看</span>
      </div>

      <!-- 隐藏的文件选择器 -->
      <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileChange" />

      <!-- 导入结果提示 -->
      <div v-if="importMsg" :class="`text-sm p-3 rounded-lg ${importMsg.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`">
        {{ importMsg.text }}
      </div>

      <!-- 新增/编辑排课弹窗 -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="closeModal">
        <div class="absolute inset-0 bg-black/30" @click="closeModal" />
        <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
          <h3 class="text-lg font-bold text-gray-900 mb-5 flex-shrink-0">{{ editingSchedule ? '编辑排课' : '新增排课' }}</h3>

          <div class="space-y-4 flex-1 overflow-y-auto pr-1 -mr-1">
            <!-- 课程名称（自动填为所选课程） -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">课程名称</label>
              <input :value="selectedCourse?.title" type="text" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 outline-none text-sm text-gray-500" readonly />
              <p class="text-[10px] text-gray-400 mt-0.5">自动使用所选课程名称</p>
            </div>

            <!-- 授课教师（必填） -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">授课教师</label>
              <input v-model="form.teacher" type="text" placeholder="输入教师姓名" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
            </div>

            <!-- 企业导师（手动输入） -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">企业导师（选填）</label>
              <input v-model="form.mentor" type="text" placeholder="输入企业导师姓名（选填）" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
              <p class="text-[10px] text-gray-400 mt-0.5">选填，将同步到课程的导师分配</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">开始时间</label>
                <input v-model="form.startDate" type="date" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">结束时间</label>
                <input v-model="form.endDate" type="date" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">总课时</label>
                <input v-model.number="form.duration" type="number" min="1" step="1" placeholder="填写总课时" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1.5">学分</label>
                <input v-model.number="form.credits" type="number" min="0.5" step="0.5" placeholder="填写学分" class="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
              </div>
            </div>

            <div v-if="dateRangeWarning" class="text-xs text-red-500">
              {{ dateRangeWarning }}
            </div>

            <!-- 周课表选时间 -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-2">
                选择上课时间（单击空格多选，地点选填，可填写在各格子内）
                <span v-if="selectedSlots.length" class="text-brand-600 ml-1">— 已选 {{ selectedSlots.length }} 个时段</span>
              </label>
              <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th class="p-2 text-left text-gray-400 font-medium w-[72px] border-r border-gray-200"></th>
                      <th v-for="d in dayLabels" :key="d" class="p-2 text-center text-gray-500 font-medium">{{ d }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="slot in timeSlots" :key="slot.label" class="border-b border-gray-100 last:border-b-0">
                      <td class="p-2 text-gray-400 border-r border-gray-100 text-[11px] text-center">{{ slot.label }}</td>
                      <td v-for="d in dayLabels" :key="d" class="p-1 border-r border-gray-100 last:border-r-0">
                        <div
                          v-if="getSelectedSlot(dayLabels.indexOf(d), slot.start, slot.end)"
                          class="relative rounded-md min-h-[36px] bg-brand-100 border-2 border-brand-400"
                        >
                          <input
                            v-model="getSelectedSlot(dayLabels.indexOf(d), slot.start, slot.end).room"
                            @click.stop
                            placeholder="地点（选填）"
                            class="w-full h-full min-h-[32px] bg-transparent text-center text-[11px] text-brand-700 outline-none placeholder:text-brand-300"
                          />
                        </div>
                        <div
                          v-else
                          @click="handleSlotClick(d, slot)"
                          class="relative rounded-md min-h-[36px] flex items-center justify-center text-center text-[11px] leading-tight cursor-pointer select-none transition-all duration-150 bg-gray-50 text-gray-300 hover:bg-brand-50 hover:text-brand-500 hover:border-brand-300 border border-dashed border-gray-200"
                        >
                          +
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- 已选时段列表 -->
              <div v-if="selectedSlots.length" class="mt-2 space-y-1">
                <div class="text-xs text-gray-400">已选时段：</div>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="(sel, i) in selectedSlots"
                    :key="i"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-brand-50 text-brand-700 border border-brand-200"
                  >
                    {{ sel.dayLabel }} {{ sel.start }}-{{ sel.end }}
                    <span v-if="sel.room" class="font-medium">{{ sel.room }}</span>
                    <button @click="selectedSlots.splice(i, 1)" class="text-brand-400 hover:text-brand-600">
                      <X class="w-3 h-3" />
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <!-- 冲突警告 -->
            <div v-if="conflictWarning" class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p class="font-medium mb-0.5">排课冲突</p>
                <p>{{ conflictWarning }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6 flex-shrink-0">
            <button @click="closeModal" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
            <button @click="handleSave" :disabled="!canSave" class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
              {{ editingSchedule ? '保存修改' : '确认添加' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 删除确认弹窗（排课） -->
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="deleteTarget = null">
        <div class="absolute inset-0 bg-black/30" @click="deleteTarget = null" />
        <div class="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
          <h3 class="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
          <p class="text-sm text-gray-500 mb-5">确定要删除「{{ deleteTarget.title || selectedCourse.title }}」在 {{ getDayLabel(deleteTarget) }} {{ deleteTarget.timeSlot }} 的排课吗？</p>
          <div class="flex justify-end gap-2">
            <button @click="deleteTarget = null" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
            <button @click="handleDelete" class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">确认删除</button>
          </div>
        </div>
      </div>

      <!-- 冲突弹窗 -->
      <div v-if="showConflictModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/30" @click="showConflictModal = false" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-bold text-gray-900">排课冲突（{{ courseConflictPairs.length }} 组）</h3>
            <button @click="showConflictModal = false" class="text-gray-400 hover:text-gray-600">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="px-6 py-4 overflow-y-auto space-y-3">
            <div v-if="courseConflictPairs.length === 0" class="text-center py-10 text-sm text-gray-400">所有冲突已解决</div>
            <div v-for="(pair, i) in courseConflictPairs" :key="i" class="border border-red-200 bg-red-50/50 rounded-lg p-3">
              <p class="text-xs font-medium text-red-600 mb-2">{{ pair.reasons.join('、') }}</p>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="rec in [pair.a, pair.b]" :key="rec.id" class="bg-white rounded-lg border border-gray-100 p-3">
                  <p class="text-sm font-medium text-gray-900">{{ rec.title || selectedCourse.title }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ rec.teacher }} · {{ getDayLabel(rec) }} {{ rec.timeSlot }}</p>
                  <p class="text-xs text-gray-500">{{ rec.room }}</p>
                  <div class="mt-2 flex items-center gap-2">
                    <template v-if="isCourseSchedule(rec)">
                      <button @click="editFromConflict(rec)" class="text-xs px-2.5 py-1 text-blue-500 hover:bg-blue-50 rounded transition-colors">修改</button>
                      <button @click="resolveDelete(rec)" class="text-xs px-2.5 py-1 text-red-500 hover:bg-red-50 rounded transition-colors">删除解决</button>
                    </template>
                    <span v-else class="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">其他课程</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end px-6 py-3 border-t border-gray-100">
            <button @click="showConflictModal = false" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">关闭</button>
          </div>
        </div>
      </div>
    </template>

    <!-- 隐藏的课程导入文件选择器 -->
    <input ref="courseFileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleCourseFileChange" />

    <!-- 隐藏的学院导入文件选择器 -->
    <input ref="deptFileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleDeptFileSelect" />

    <!-- 添加学院弹窗 -->
    <Teleport to="body">
      <div v-if="showDeptModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showDeptModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">添加学院</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">学院名称</label>
              <input v-model="deptForm.name" type="text" placeholder="如：计算机学院" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <div class="flex items-center gap-3">
                <input v-model="deptForm.color" type="color" class="w-10 h-10 rounded cursor-pointer border" />
                <span class="text-sm text-gray-500">{{ deptForm.color }}</span>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleSaveDept" :disabled="!deptForm.name.trim()" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">保存</button>
              <button @click="showDeptModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 学院 Excel 导入弹窗 -->
    <Teleport to="body">
      <div v-if="showDeptImportModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showDeptImportModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">从 Excel 导入学院</h3>
          <p class="text-sm text-gray-500 mb-4">Excel 文件需要包含"学院名称"列，可选"颜色"列。</p>

          <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p class="text-xs text-blue-600 mb-2">📋 没有模板？下载一个标准模板开始：</p>
            <button @click="downloadDeptTemplate" class="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">下载模板</button>
          </div>

          <div
            @click="deptFileInput?.click()"
            @dragover.prevent
            @drop.prevent="handleDeptDrop"
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors"
          >
            <Upload class="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p class="text-sm text-gray-600 mb-1">{{ deptImportFile?.name || '点击选择或拖拽 Excel 文件到此处' }}</p>
            <p class="text-xs text-gray-400">支持 .xlsx 和 .xls 格式</p>
          </div>

          <div class="flex gap-3 pt-4 mt-4 border-t">
            <button @click="showDeptImportModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
            <button @click="confirmDeptImport" :disabled="!deptImportFile" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">确认导入</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 新增课程弹窗 -->
    <Teleport to="body">
      <div v-if="showCourseModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="closeCourseModal" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">新增课程</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">课程名称<span class="text-red-500">*</span></label>
              <input v-model="courseForm.title" type="text" placeholder="如：数据结构" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">课程简介</label>
              <textarea v-model="courseForm.description" rows="3" placeholder="介绍课程内容、目标等" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm resize-none"></textarea>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleSaveCourse" :disabled="!canSaveCourse" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">保存</button>
              <button @click="closeCourseModal" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { Plus, Search, CalendarX, AlertTriangle, Upload, RefreshCw, BookOpen, ArrowLeft, ArrowRight, X } from 'lucide-vue-next'
import type { Schedule, Course, Department } from '@/types'
import { bulkImportSchedules, fetchSchedules, updateCourse as apiUpdateCourse, updateSchedule as apiUpdateSchedule, deleteSchedule as apiDeleteSchedule } from '@/api'
import * as XLSX from 'xlsx'

const store = useAppStore()

// ====== 当前学院 ======
const currentDept = computed(() => store.getSelectedDepartment())
const currentDeptName = computed(() => currentDept.value?.name || '')

// ====== 学院选择 ======
function selectDepartment(dept: Department) {
  store.setSelectedDepartment(dept.id)
}

function getDeptCourseCount(deptId: string): number {
  const deptCategoryIds = new Set(store.getDepartmentCategories(deptId).map((c) => c.id))
  return store.courses.filter((c) => c.departmentId === deptId || deptCategoryIds.has(c.categoryId)).length
}

// ====== 学院课程（属于该学院或分类属于该学院的课程）======
const departmentCourses = computed(() => {
  if (!store.selectedDepartmentId) return []
  const deptCategoryIds = new Set(
    store.getDepartmentCategories(store.selectedDepartmentId).map((c) => c.id)
  )
  return store.courses.filter(
    (c) => c.departmentId === store.selectedDepartmentId || deptCategoryIds.has(c.categoryId)
  )
})

function getCourseColor(course: Course): string {
  return store.categories.find((c) => c.id === course.categoryId)?.color || '#3b82f6'
}

function getCourseScheduleCount(course: Course): number {
  return allSchedules.value.filter(
    (s: any) => s.courseId === course.id || (s.title || '') === course.title
  ).length
}

// ====== 新增课程 ======
const showCourseModal = ref(false)
type CourseForm = {
  title: string
  description: string
}

function createCourseForm(): CourseForm {
  return {
    title: '',
    description: '',
  }
}

const courseForm = ref<CourseForm>(createCourseForm())

const canSaveCourse = computed(() => Boolean(courseForm.value.title.trim()))

function openCourseModal() {
  courseForm.value = createCourseForm()
  showCourseModal.value = true
}

function closeCourseModal() {
  showCourseModal.value = false
}

function handleSaveCourse() {
  if (!canSaveCourse.value) return
  if (store.courses.some((c) => c.title === courseForm.value.title.trim())) {
    courseImportMsg.value = { success: false, text: '课程名称已存在，请更换名称' }
    return
  }
  store.addCourse({
    id: `course-${Date.now()}`,
    title: courseForm.value.title.trim(),
    description: courseForm.value.description,
    categoryId: '',
    departmentId: store.selectedDepartmentId,
    teacher: '',
    cover: '',
    credits: 0,
    duration: 0,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  })
  closeCourseModal()
}

// ====== Excel 导入课程 ======
const courseFileInput = ref<HTMLInputElement>()
const courseImportMsg = ref<{ success: boolean; text: string } | null>(null)

function triggerCourseImport() {
  courseFileInput.value?.click()
}

async function handleCourseFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  courseImportMsg.value = null

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      courseImportMsg.value = { success: false, text: 'Excel 文件为空，请检查文件内容' }
      return
    }

    const existingTitles = new Set(store.courses.map((c) => c.title))
    const now = new Date().toISOString().split('T')[0]
    let added = 0
    let skipped = 0

    for (const row of rows) {
      const title = String(row['课程名称'] || row['title'] || row['课程'] || '').trim()
      if (!title || existingTitles.has(title)) {
        skipped++
        continue
      }
      const teacher = ''
      const credits = Number(row['学分'] || row['credits'] || 0) || 0
      const duration = Number(row['课时'] || row['duration'] || 0) || 0
      const status = String(row['状态'] || 'active').includes('结束') ? 'inactive' : 'active'
      store.addCourse({
        id: `course-${Date.now()}-${added}`,
        title,
        description: String(row['描述'] || row['description'] || row['课程描述'] || ''),
        categoryId: '',
        departmentId: store.selectedDepartmentId,
        teacher,
        cover: '',
        credits,
        duration,
        status: status as any,
        createdAt: now,
      })
      existingTitles.add(title)
      added++
    }

    if (added === 0) {
      courseImportMsg.value = {
        success: false,
        text: `未能导入课程（跳过 ${skipped} 行）：请确保包含"课程名称"列`,
      }
      return
    }
    courseImportMsg.value = { success: true, text: `成功导入 ${added} 门课程${skipped ? `，跳过 ${skipped} 行` : ''}` }
    setTimeout(() => { courseImportMsg.value = null }, 5000)
  } catch (err: any) {
    courseImportMsg.value = { success: false, text: '导入失败：' + (err.message || '未知错误') }
  }

  if (courseFileInput.value) courseFileInput.value.value = ''
}

const statusLabel = (status: string) => {
  if (status === 'active') return '进行中'
  if (status === 'inactive') return '已结束'
  return '草稿'
}

const statusClass = (status: string) => {
  if (status === 'active') return 'bg-green-50 text-green-600'
  if (status === 'inactive') return 'bg-gray-100 text-gray-500'
  return 'bg-yellow-50 text-yellow-600'
}

// ====== Level 切换 ======
const selectedCourse = ref<Course | null>(null)

function selectCourse(course: Course) {
  selectedCourse.value = course
  searchText.value = ''
}

function switchDepartment() {
  selectedCourse.value = null
  store.setSelectedDepartment(null)
}

// ====== 数据库加载 ======
const dbSchedules = ref<any[]>([])

onMounted(async () => {
  loadSchedules()
})

async function loadSchedules() {
  try {
    const res = await fetchSchedules()
    if (res.success && res.schedules?.length > 0) {
      dbSchedules.value = res.schedules
      return
    }
  } catch (e) {
    console.error('加载排课失败:', e)
  }
  // 后端无数据时使用本地 store（含管理端演示排课）
  dbSchedules.value = store.schedules
}

// ====== 搜索 ======
const searchText = ref('')

// 综合数据源：API + 本地store（去重）
const allSchedules = computed(() => {
  const ids = new Set<string>()
  const combined: any[] = []
  for (const s of [...dbSchedules.value, ...store.schedules]) {
    if (!ids.has((s as any).id)) {
      ids.add((s as any).id)
      combined.push(s)
    }
  }
  return combined
})

// 当前课程的全部排课（courseId 或 title 匹配）
const allCourseSchedules = computed(() => {
  if (!selectedCourse.value) return []
  const course = selectedCourse.value
  return allSchedules.value.filter(
    (s: any) => s.courseId === course.id || (s.title || '') === course.title
  )
})

// 搜索过滤后的排课
const courseSchedules = computed(() => {
  let result = allCourseSchedules.value
  const q = searchText.value.trim().toLowerCase()
  if (q) {
    result = result.filter((s: any) =>
      (s.teacher || '').toLowerCase().includes(q) ||
      (s.room || '').toLowerCase().includes(q) ||
      getDayLabel(s).includes(q)
    )
  }
  return result
})

// ====== 冲突检测 ======
function timesOverlap(a: string, b: string): boolean {
  const [aStart, aEnd] = a.split('-')
  const [bStart, bEnd] = b.split('-')
  if (!aStart || !aEnd || !bStart || !bEnd) return false
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  return toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd)
}

function normalizeScheduleOptionalValue(value?: string | null): string {
  const normalized = String(value ?? '').trim()
  return normalized === '未指定' ? '' : normalized
}

function isConflicting(sch: any): boolean {
  return dbSchedules.value.some((other: any) => {
    if (other.id === sch.id) return false
    if (getDayLabel(other) !== getDayLabel(sch)) return false
    const otherTeacher = normalizeScheduleOptionalValue(other.teacher)
    const currentTeacher = normalizeScheduleOptionalValue(sch.teacher)
    const otherRoom = normalizeScheduleOptionalValue(other.room)
    const currentRoom = normalizeScheduleOptionalValue(sch.room)
    const sameTeacher = !!otherTeacher && otherTeacher === currentTeacher && timesOverlap(other.timeSlot, sch.timeSlot)
    const sameRoom = !!otherRoom && otherRoom === currentRoom && timesOverlap(other.timeSlot, sch.timeSlot)
    return sameTeacher || sameRoom
  })
}

// ====== 冲突弹窗 ======
const showConflictModal = ref(false)

/** 判断排课是否属于当前课程 */
function isCourseSchedule(sch: any): boolean {
  return allCourseSchedules.value.some((s: any) => s.id === sch.id)
}

/** 与当前课程相关的冲突组：两两配对，冲突双方中至少一方属于当前课程 */
const courseConflictPairs = computed(() => {
  const pairs: { a: any; b: any; reasons: string[] }[] = []
  const list = dbSchedules.value
  for (let i = 0; i < list.length; i++) {
    const a = list[i]
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j]
      if (getDayLabel(a) !== getDayLabel(b)) continue
      const reasons: string[] = []
      const teacherA = normalizeScheduleOptionalValue(a.teacher)
      const teacherB = normalizeScheduleOptionalValue(b.teacher)
      const roomA = normalizeScheduleOptionalValue(a.room)
      const roomB = normalizeScheduleOptionalValue(b.room)
      if (teacherA && teacherA === teacherB && timesOverlap(a.timeSlot, b.timeSlot)) reasons.push('教师时间冲突')
      if (roomA && roomA === roomB && timesOverlap(a.timeSlot, b.timeSlot)) reasons.push('教室冲突')
      if (reasons.length && (isCourseSchedule(a) || isCourseSchedule(b))) {
        pairs.push({ a, b, reasons })
      }
    }
  }
  return pairs
})

/** 删除某条排课（解决冲突） */
function resolveDelete(sch: any) {
  apiDeleteSchedule(sch.id)
    .then(() => loadSchedules())
    .catch(() => {
      store.deleteSchedule(sch.id)
      loadSchedules()
    })
}

/** 在冲突弹窗中修改某条排课 */
function editFromConflict(sch: any) {
  showConflictModal.value = false
  openEdit(sch)
}

// ====== 周课表（多选） ======

/** 周一到周日（getDay(): 0=周日, 1=周一...6=周六） */
const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/** 取排课的周几：优先记录里的 day 字段，旧数据从日期推导 */
function getDayLabel(sch: any): string {
  if (sch.day) return sch.day
  if (sch.startDate) {
    const d = new Date(sch.startDate)
    if (!isNaN(d.getTime())) return dayLabels[(d.getDay() + 6) % 7]
  }
  return '-'
}

/** 常用课时段 */
const timeSlots = [
  { label: '08:00-10:00', start: '08:00', end: '10:00' },
  { label: '10:15-12:15', start: '10:15', end: '12:15' },
  { label: '14:00-16:00', start: '14:00', end: '16:00' },
  { label: '16:15-18:15', start: '16:15', end: '18:15' },
  { label: '19:00-21:00', start: '19:00', end: '21:00' },
]

/** 用户多选的时间段列表 */
interface SlotSelection {
  dayIdx: number
  dayLabel: string
  dateStr: string
  start: string
  end: string
  room: string
}
const selectedSlots = ref<SlotSelection[]>([])

/** 计算最近某周几的日期 */
function getNextWeekday(dayIndex: number): string {
  const dayMap = [1, 2, 3, 4, 5, 6, 0]
  const targetDay = dayMap[dayIndex]
  const now = new Date()
  const currentDay = now.getDay()
  let diff = targetDay - currentDay
  if (diff <= 0) diff += 7
  const d = new Date(now)
  d.setDate(d.getDate() + diff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 获取选中格子对应的时段对象（未选中返回 undefined） */
function getSelectedSlot(dayIdx: number, start: string, end: string): SlotSelection | undefined {
  return selectedSlots.value.find(
    (sel) => sel.dayIdx === dayIdx && sel.start === start && sel.end === end
  )
}

/** 单击格子 → 切换多选（后选的格子默认沿用首个已选格子的地点） */
function handleSlotClick(day: string, slot: { start: string; end: string; label: string }) {
  const dayIdx = dayLabels.indexOf(day)
  // 切换选中状态
  const idx = selectedSlots.value.findIndex(
    (sel) => sel.dayIdx === dayIdx && sel.start === slot.start && sel.end === slot.end
  )
  if (idx >= 0) {
    selectedSlots.value.splice(idx, 1)
  } else {
    const defaultRoom = selectedSlots.value[0]?.room || ''
    selectedSlots.value.push({
      dayIdx,
      dayLabel: day,
      dateStr: getNextWeekday(dayIdx),
      start: slot.start,
      end: slot.end,
      room: defaultRoom,
    })
  }
}

// ====== 新增/编辑弹窗 ======
const showModal = ref(false)
const editingSchedule = ref<Schedule | null>(null)
type ScheduleForm = {
  teacher: string
  mentor: string
  startDate: string
  endDate: string
  duration: number | ''
  credits: number | ''
}

function toFormNumber(value?: number | null): number | '' {
  return typeof value === 'number' && value > 0 ? value : ''
}

function createFormState(course: Course | null, schedule?: Schedule | null): ScheduleForm {
  return {
    teacher: schedule?.teacher || course?.teacher || '',
    mentor: schedule?.mentor || course?.mentor || '',
    startDate: schedule?.startDate || '',
    endDate: schedule?.endDate || '',
    duration: toFormNumber(course?.duration),
    credits: toFormNumber(course?.credits),
  }
}

const form = ref<ScheduleForm>(createFormState(null))

const conflictWarning = computed(() => {
  const teacherName = normalizeScheduleOptionalValue(form.value.teacher)
  if (!selectedCourse.value || !teacherName || selectedSlots.value.length === 0) return ''

  // 检查每个已选时段是否有教师时间冲突
  for (const sel of selectedSlots.value) {
    const timeSlot = `${sel.start}-${sel.end}`
    const conflict = dbSchedules.value.some((s: any) => {
      if (editingSchedule.value && s.id === editingSchedule.value.id) return false
      if (getDayLabel(s) !== sel.dayLabel) return false
      if (normalizeScheduleOptionalValue(s.teacher) !== teacherName) return false
      return timesOverlap(s.timeSlot, timeSlot)
    })
    if (conflict) {
      return `「${teacherName}」在 ${sel.dayLabel} ${timeSlot} 已有排课`
    }
  }
  return ''
})

const dateRangeWarning = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return ''
  return form.value.endDate < form.value.startDate ? '结束时间不能早于开始时间' : ''
})

const canSave = computed(() => Boolean(
  selectedCourse.value &&
  form.value.teacher.trim() &&
  form.value.startDate &&
  form.value.endDate &&
  !dateRangeWarning.value &&
  typeof form.value.duration === 'number' &&
  form.value.duration > 0 &&
  typeof form.value.credits === 'number' &&
  form.value.credits > 0 &&
  selectedSlots.value.length > 0
))

function openAdd() {
  editingSchedule.value = null
  form.value = createFormState(selectedCourse.value)
  selectedSlots.value = []
  showModal.value = true
}

function openEdit(sch: Schedule) {
  editingSchedule.value = sch
  form.value = createFormState(selectedCourse.value, sch)
  // 预填该排课的时段与地点，编辑时可直接调整
  const dayLabel = getDayLabel(sch as any)
  const dayIdx = dayLabels.indexOf(dayLabel)
  const [start, end] = sch.timeSlot.split('-')
  selectedSlots.value = []
  if (dayIdx >= 0 && start && end) {
    selectedSlots.value.push({
      dayIdx,
      dayLabel,
      dateStr: sch.startDate || getNextWeekday(dayIdx),
      start,
      end,
      room: sch.room,
    })
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingSchedule.value = null
  selectedSlots.value = []
}

function syncSelectedCourseMeta(data: Pick<Course, 'duration' | 'credits'>) {
  if (!selectedCourse.value) return
  selectedCourse.value = { ...selectedCourse.value, ...data }
}

function persistCourseMeta(courseId: string, data: Pick<Course, 'duration' | 'credits'>) {
  apiUpdateCourse(courseId, data).catch(() => null)
  store.updateCourse(courseId, data)
  syncSelectedCourseMeta(data)
}

function handleSave() {
  if (!selectedCourse.value || !canSave.value) return
  const course = selectedCourse.value
  const teacher = form.value.teacher.trim()
  const mentor = form.value.mentor.trim()
  const courseUpdates = {
    duration: Number(form.value.duration),
    credits: Number(form.value.credits),
  }

  persistCourseMeta(course.id, courseUpdates)
  // 企业导师同步到课程（导师记录 + 课程 mentor 字段）
  if (mentor) {
    store.assignMentorToCourse(course.id, mentor)
  }

  // 编辑：更新单条排课
  if (editingSchedule.value) {
    const slot = selectedSlots.value[0]
    const updated = {
      courseId: course.id,
      title: course.title,
      day: slot.dayLabel,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      timeSlot: `${slot.start}-${slot.end}`,
      room: slot.room.trim(),
      teacher,
      mentor,
    }
    const id = editingSchedule.value.id
    apiUpdateSchedule(id, updated)
      .then(() => loadSchedules())
      .catch(() => {
        store.updateSchedule(id, updated)
        loadSchedules()
      })
    closeModal()
    return
  }

  // 新增：为每个选中的时间段创建一条排课
  const newSchedules: any[] = selectedSlots.value.map((slot, i) => ({
    courseId: course.id,
    title: course.title,
    day: slot.dayLabel,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    timeSlot: `${slot.start}-${slot.end}`,
    room: slot.room.trim(),
    teacher,
    mentor,
  }))

  // 发送到后端
  const doSave = bulkImportSchedules(newSchedules)

  doSave
    .then(() => {
      // 成功后刷新
      loadSchedules()
    })
    .catch(() => {
      // 后端不可用时，保存到本地 store
      newSchedules.forEach((s, i) => {
        store.addSchedule({
          id: `local-${Date.now()}-${i}`,
          courseId: s.courseId,
          title: s.title,
          day: s.day,
          startDate: s.startDate,
          endDate: s.endDate,
          timeSlot: s.timeSlot,
          room: s.room,
          teacher: s.teacher,
          mentor: s.mentor,
        })
      })
      // 重新加载（从 store 取数据）
      loadSchedules()
    })

  closeModal()
}

// ====== 删除排课 ======
const deleteTarget = ref<Schedule | null>(null)

function confirmDelete(sch: Schedule) {
  deleteTarget.value = sch
}

function handleDelete() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  apiDeleteSchedule(id)
    .then(() => loadSchedules())
    .catch(() => {
      // 后端不可用时，从本地 store 删除
      store.deleteSchedule(id)
      loadSchedules()
    })
  deleteTarget.value = null
}

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
      importMsg.value = { success: false, text: 'Excel 文件为空，请检查文件内容' }
      return
    }

    const schedules: any[] = []
    for (const row of rows) {
      const courseId = row['课程ID'] || row['courseId'] || row['课程编号'] || ''
      const title = row['课程名称'] || row['title'] || row['课程'] || ''
      const teacher = row['教师'] || row['teacher'] || row['授课教师'] || row['教师姓名'] || row['教师账号'] || ''
      const room = row['教室'] || row['room'] || ''
      const startDate = fmtExcelDate(row['日期'] || row['date'] || row['上课日期'] || row['startDate'] || '')
      const endDate = fmtExcelDate(row['结束日期'] || row['endDate'] || row['end_date'] || '') || startDate
      const timeSlot = row['时间段'] || row['timeSlot'] || row['time_slot'] || row['时间'] || ''
      const day = String(row['周几'] || row['星期'] || row['星期几'] || row['day'] || '').trim()

      if (!title || !timeSlot) continue

      schedules.push({
        courseId: courseId || selectedCourse.value?.id || title,
        title,
        teacher: teacher || '未指定',
        room: room || '未指定',
        day,
        startDate,
        endDate,
        timeSlot,
      })
    }

    if (schedules.length === 0) {
      importMsg.value = { success: false, text: '未能从 Excel 中解析到有效排课数据，请检查列名是否正确' }
      return
    }

    const res = await bulkImportSchedules(schedules)
    await loadSchedules()
    importMsg.value = { success: true, text: res.message || `成功导入 ${schedules.length} 条排课记录` }
    setTimeout(() => { importMsg.value = null }, 5000)
  } catch (e: any) {
    importMsg.value = { success: false, text: '导入失败：' + (e.message || '未知错误') }
  }

  if (fileInput.value) fileInput.value.value = ''
}

function fmtExcelDate(val: string | number): string {
  if (!val) return ''
  if (typeof val === 'number') {
    try {
      const date = XLSX.SSF.parse_date_code(val)
      const m = String(date.m).padStart(2, '0')
      const d = String(date.d).padStart(2, '0')
      return `${date.y}-${m}-${d}`
    } catch {
      return String(val)
    }
  }
  const s = String(val).trim()
  let m = s.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/)
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  }
  m = s.match(/^(\d{1,2})[\/\.](\d{1,2})$/)
  if (m) {
    const year = new Date().getFullYear()
    return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  }
  return s
}

// ====== 添加学院 ======
const showDeptModal = ref(false)
const deptForm = ref({ name: '', color: '#3b82f6' })

function openAddDeptModal() {
  deptForm.value = { name: '', color: '#3b82f6' }
  showDeptModal.value = true
}

function handleSaveDept() {
  if (!deptForm.value.name.trim()) return
  store.addDepartment({
    id: `dept-${Date.now()}`,
    name: deptForm.value.name.trim(),
    color: deptForm.value.color,
  })
  showDeptModal.value = false
}

// ====== Excel 导入学院 ======
const showDeptImportModal = ref(false)
const deptImportFile = ref<File | null>(null)
const deptImportMsg = ref<{ success: boolean; text: string } | null>(null)
const deptFileInput = ref<HTMLInputElement>()

const presetColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#ef4444', '#14b8a6', '#6366f1', '#84cc16']

function triggerDeptExcelImport() {
  deptImportFile.value = null
  deptImportMsg.value = null
  showDeptImportModal.value = true
}

function handleDeptFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) deptImportFile.value = file
}

function handleDeptDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file) deptImportFile.value = file
}

async function confirmDeptImport() {
  if (!deptImportFile.value) return
  deptImportMsg.value = null

  try {
    const data = await deptImportFile.value.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      deptImportMsg.value = { success: false, text: 'Excel 文件为空，请检查文件内容' }
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
      deptImportMsg.value = { success: false, text: `未能导入学院（跳过 ${skipped} 行）：请确保包含"学院名称"列` }
      return
    }

    deptImportMsg.value = { success: true, text: `成功导入 ${added} 个学院${skipped ? `，跳过 ${skipped} 行（已存在或无名称）` : ''}` }
    setTimeout(() => { deptImportMsg.value = null; showDeptImportModal.value = false }, 2000)
  } catch (err: any) {
    deptImportMsg.value = { success: false, text: '导入失败：' + (err.message || '未知错误') }
  }
}

function downloadDeptTemplate() {
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
