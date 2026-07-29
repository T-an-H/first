<template>
  <div class="space-y-6">
    <!-- 返回按钮 + 课程信息栏 -->
    <div class="flex items-center gap-3">
      <button @click="$router.back()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-500" />
      </button>
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-900">{{ course?.title || '课程详情' }}</h1>
        <p class="text-gray-500 mt-1">{{ course?.id }} · {{ course?.duration }}课时</p>
      </div>
      <span :class="`text-xs px-2 py-0.5 rounded-full ${course?.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`">
        {{ course?.status === 'active' ? '进行中' : '已结束' }}
      </span>
    </div>

    <!-- 已结束只读提示 -->
    <div v-if="isReadOnly" class="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
      <Eye class="w-4 h-4 text-gray-400" />
      <span>该课程已结束，当前为<strong>只读查看</strong>模式，无法进行配置修改操作</span>
    </div>

    <!-- Tab 切换 -->
    <div class="flex gap-1 border-b border-gray-200">
      <button v-for="tab in tabList" :key="tab.key"
        @click="activeTab = tab.key"
        :class="`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${activeTab === tab.key ? 'bg-white text-blue-600 border border-b-0 border-gray-200 -mb-px' : 'text-gray-500 hover:text-gray-700'}`">
        <component :is="tab.icon" class="w-4 h-4 inline mr-1.5" />{{ tab.label }}
      </button>
    </div>

    <!-- Tab: 评论管理 -->
    <div v-if="activeTab === 'comments'" class="space-y-6">
      <!-- 评价方案配置 -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <button @click="(isReadOnly || evalConfigLocked || isMentor) ? null : (showSettings = !showSettings)" class="w-full flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Settings class="w-5 h-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">评价方案配置</h2>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="evalConfigLocked || isMentor" class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
              <Lock class="w-3 h-3 inline mr-0.5" />仅查看
            </span>
            <span class="text-xs text-gray-400">
              {{ selectedConfig ? EvalTemplateLabels[selectedConfig.template] : '默认方案' }} ·
              {{ selectedConfig ? EvalFrequencyLabels[selectedConfig.frequency] : '默认频率' }}
            </span>
            <span v-if="!isReadOnly && !evalConfigLocked && !isMentor" class="text-xs text-gray-400 hover:text-gray-600">{{ showSettings ? '收起 ▲' : '展开 ▼' }}</span>
            <span v-if="isReadOnly || evalConfigLocked || isMentor" class="text-xs text-gray-300">仅查看</span>
          </div>
        </button>

        <!-- 锁定提示 -->
        <div v-if="evalConfigLocked" class="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <Lock class="w-3.5 h-3.5 text-gray-400" />
          <span v-if="selectedConfig">评价方案已在第一节课开始前配置完成，已锁定不可修改。</span>
          <span v-else>第一节课已开始，评价方案未配置，现按默认方案实施，已锁定不可修改。</span>
        </div>

        <div class="flex flex-wrap gap-2 mt-3 mb-1">
          <template v-for="t in ALL_EVAL_TYPES" :key="t">
            <span v-if="!selectedConfig || !TEMPLATE_EVAL_TYPES[selectedConfig.template].includes(t)"
              class="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-300 border border-gray-200">
              {{ EvalTypeLabels[t] }} ✗
            </span>
            <span v-else-if="(t === 'intra_group' || t === 'inter_group') && !courseHasGroups || t === 'mentor' && selectedConfig && !selectedConfig.hasMentor"
              class="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
              <EyeOff class="w-3 h-3 inline mr-0.5" />
              {{ EvalTypeLabels[t] }}（自动隐藏）
            </span>
            <span v-else :class="`text-xs px-2.5 py-1 rounded-full border ${EvalTypeColors[t]}`">
              <Eye class="w-3 h-3 inline mr-0.5" />
              {{ EvalTypeLabels[t] }}
            </span>
          </template>
        </div>

        <template v-if="showSettings && !isReadOnly && !evalConfigLocked && !isMentor">
          <div class="border-t border-gray-100 mt-3 pt-4 space-y-4">
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">评价模板</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button v-for="tpl in EVAL_TEMPLATE_KEYS" :key="tpl"
                  @click="handleSetConfig({ template: tpl })"
                  :class="`text-left p-3 rounded-lg border transition-all ${selectedConfig?.template === tpl ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`">
                  <span class="text-sm font-medium text-gray-900">{{ EvalTemplateLabels[tpl] }}</span>
                  <p class="text-xs text-gray-400 mt-0.5">{{ EvalTemplateDescs[tpl] }}</p>
                  <div class="flex gap-1 mt-1">
                    <span v-for="et in TEMPLATE_EVAL_TYPES[tpl]" :key="et" class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{{ EvalTypeLabels[et] }}</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">评价频率</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button v-for="freq in EVAL_FREQUENCY_KEYS" :key="freq"
                  @click="handleSetConfig({ frequency: freq })"
                  :class="`text-left p-3 rounded-lg border transition-all ${selectedConfig?.frequency === freq ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200 bg-white hover:border-gray-300'}`">
                  <span class="text-sm font-medium text-gray-900">{{ EvalFrequencyLabels[freq] }}</span>
                  <p class="text-xs text-gray-400 mt-0.5">{{ EvalFrequencyDescs[freq] }}</p>
                  <span class="text-xs text-cyan-500 mt-0.5 block">共 {{ courseId ? store.getEvalSessions(courseId) : 0 }} 次评价</span>
                </button>
              </div>
              <div v-if="selectedConfig?.frequency === 'custom'" class="mt-2">
                <label class="text-xs text-gray-500">自定义评价次数：</label>
                <input type="number" min="1" max="20"
                  :value="selectedConfig?.customSessions || 3"
                  @change="(e) => handleSetConfig({ customSessions: parseInt((e.target as HTMLInputElement).value) || 3 })"
                  class="ml-2 w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>

            <div class="flex items-center gap-3">
              <label class="text-sm font-medium text-gray-700">企业导师参与评价</label>
              <button @click="handleSetConfig({ hasMentor: !selectedConfig?.hasMentor })"
                :class="`relative w-10 h-5 rounded-full transition-colors ${selectedConfig?.hasMentor ? 'bg-emerald-400' : 'bg-gray-300'}`">
                <span :class="`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${selectedConfig?.hasMentor ? 'left-5.5' : 'left-0.5'}`" />
              </button>
              <span class="text-xs text-gray-400">{{ selectedConfig?.hasMentor ? '已启用' : '已禁用' }}</span>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">逾期未评处理规则</p>
              <div class="flex gap-3">
                <button v-for="rule in OVERDUE_RULE_KEYS" :key="rule"
                  @click="handleSetConfig({ overdueRule: rule })"
                  :class="`px-4 py-2 rounded-lg border text-sm transition-all ${selectedConfig?.overdueRule === rule ? 'border-purple-300 bg-purple-50 text-purple-700 font-medium' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`">
                  {{ OverdueRuleLabels[rule] }}
                </button>
              </div>
            </div>
          </div>
        </template>
        <!-- 课程结束 / 锁定 readonly 展示 -->
        <template v-else-if="(isReadOnly || evalConfigLocked) && showSettings">
          <div class="border-t border-gray-100 mt-3 pt-4 text-sm text-gray-400 text-center py-4">
            <EyeOff class="w-5 h-5 inline mr-1" />
            {{ isReadOnly ? '已结束课程不可修改配置' : '第一节课已开始，评价方案已锁定不可修改' }}
          </div>
        </template>
      </div>

      <!-- 评价管理（合并批量评价 + 逐次评价） -->
      <div v-if="!isReadOnly" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <ClipboardCheck class="w-5 h-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">评价管理</h2>
            <span class="text-xs text-gray-400">{{ enrolledStudents.length }}名学生</span>
          </div>
          <button v-if="!isMentor" @click="handleProcessOverdue" class="text-xs flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100">
            <RefreshCw class="w-3 h-3" />
            处理逾期自评
          </button>
        </div>

        <!-- 轮次 + 类型选择器 -->
        <div class="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <span class="text-xs text-gray-500 font-medium">评价轮次：</span>
          <button v-for="s in totalSessions" :key="s"
            @click="handleSessionSelect(s)"
            :disabled="isSessionDisabled(s)"
            :title="getSessionTitle(s)"
            :class="`text-xs px-3 py-1.5 rounded-lg border transition-all ${selectedBatchSession === s ? 'bg-blue-50 text-blue-600 border-blue-300 font-medium' : isSessionDisabled(s) ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`">
            第{{ s }}次
            <span v-if="store.isSessionLocked(courseId || '', s)" class="ml-1">🔒</span>
            <span v-else-if="!isSessionTime(s)" class="ml-1 text-gray-300">⏳</span>
          </button>
        </div>

        <!-- 轮次状态提示 -->
        <div v-if="store.isSessionLocked(courseId || '', selectedBatchSession)" class="flex items-center gap-2 px-3 py-2 mb-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <EyeOff class="w-3.5 h-3.5 text-gray-400" />
          <span>该轮次已锁定，评价不可修改。上一轮次结束后自动锁定并处理逾期。</span>
        </div>
        <div v-else-if="!isSessionTime(selectedBatchSession)" class="flex items-center gap-2 px-3 py-2 mb-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-700">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{{ selectedBatchSession === 1 ? '第一节课已开始，评价已开启' : '该轮次尚未到开启时间' }}</span>
        </div>
        <div v-else-if="isFinalSessionExpired" class="flex items-center gap-2 px-3 py-2 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-500">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          <span>课程已结束，最终评价已截止。</span>
        </div>

        <!-- 搜索 + 过滤 + 弹窗查看 -->
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <div class="relative max-w-xs flex-1 min-w-[180px]">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input v-model="evalStudentSearch" type="text" placeholder="搜索学生姓名..."
              class="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
          <select v-model="evalFilterClass"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
            <option value="">全部班级</option>
            <option v-for="opt in evalClassOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <select v-model="evalFilterGroup"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
            <option value="">全部分组</option>
            <option v-for="opt in evalGroupOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <!-- 班级卡片列表 -->
        <div v-if="filteredEvalTableSections.length > 0">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="(classBlock, ci) in filteredEvalTableSections" :key="ci"
              @click="selectedEvalClass = classBlock.className; showEvalPopup = true"
              class="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-sm font-semibold text-gray-800">班级 {{ classBlock.className || '未分班' }}</span>
                  <span class="text-xs text-gray-400 ml-2">{{ classBlock.groups.reduce((a, g) => a + g.students.length, 0) }}人</span>
                </div>
                <ChevronRight class="w-4 h-4 text-gray-400" />
              </div>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="(group, gi) in classBlock.groups" :key="gi"
                  class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {{ group.groupName }} ({{ group.students.length }}人)
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-400">
          {{ evalStudentSearch ? '未找到匹配的学生' : '该课程暂无学生' }}
        </div>
      </div>

      <!-- 评价管理弹窗 -->
      <Teleport to="body">
        <div v-if="showEvalPopup" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="closeEvalPopup()" />
          <div class="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[85vh] flex flex-col">
            <!-- 头部 -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-800">班级 {{ selectedEvalClass }} - 评价管理</h3>
              <button @click="closeEvalPopup()" class="text-gray-400 hover:text-gray-600">
                <X class="w-5 h-5" />
              </button>
            </div>
            <!-- 内容 -->
            <div class="flex-1 overflow-auto px-6 py-4">
              <div v-if="!currentEvalClassSection" class="text-center py-8 text-gray-400">暂无数据</div>
              <template v-if="currentEvalClassSection">
                <div v-for="(group, gi) in currentEvalClassSection.groups" :key="gi" class="mb-4">
                  <div class="text-xs font-semibold text-gray-600 mb-2 px-1">{{ group.groupName }}（{{ group.students.length }}人）</div>
                  <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="w-10 py-2 px-2">
                          <input type="checkbox"
                            :checked="isGroupSelected(gi)"
                            @change="toggleGroup(gi)"
                            class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        </th>
                        <th class="text-left py-2 px-3 text-gray-500 font-medium text-xs">学生</th>
                        <th class="text-center py-2 px-2 text-gray-500 font-medium text-xs w-16">自评</th>
                        <th class="text-center py-2 px-2 text-gray-500 font-medium text-xs w-16">组内</th>
                        <th class="text-center py-2 px-2 text-gray-500 font-medium text-xs w-16">组间</th>
                        <th class="text-center py-2 px-2 text-gray-500 font-medium text-xs w-16">教师</th>
                        <th class="text-center py-2 px-2 text-gray-500 font-medium text-xs w-16">导师</th>
                        <th class="text-left py-2 px-3 text-gray-500 font-medium text-xs w-20">状态</th>
                        <th class="text-left py-2 px-3 text-gray-500 font-medium text-xs w-24">新评分</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="s in group.students" :key="s.student.id"
                        class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        :class="{ 'bg-blue-50/30': selectedStudentIds.includes(s.student.id), 'bg-emerald-50/20': s.submitted }">
                        <td class="py-2 px-2 text-center">
                          <input type="checkbox"
                            v-model="selectedStudentIds"
                            :value="s.student.id"
                            :disabled="s.submitted"
                            class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        </td>
                        <td class="py-2 px-3">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span class="text-xs font-medium text-blue-600">{{ s.student.name.charAt(0) }}</span>
                            </div>
                            <div>
                              <p class="font-medium text-gray-900 text-sm">{{ s.student.name }}</p>
                              <p class="text-xs text-gray-400">{{ s.student.id }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="py-2 px-2 text-center text-xs" :class="s.selfScore !== null ? 'text-blue-600 font-medium' : 'text-gray-300'">{{ s.selfScore !== null ? s.selfScore + '分' : '-' }}</td>
                        <td class="py-2 px-2 text-center text-xs" :class="s.intraScore !== null ? 'text-emerald-600 font-medium' : 'text-gray-300'">{{ s.intraScore !== null ? s.intraScore + '分' : '-' }}</td>
                        <td class="py-2 px-2 text-center text-xs" :class="s.interScore !== null ? 'text-purple-600 font-medium' : 'text-gray-300'">{{ s.interScore !== null ? s.interScore + '分' : '-' }}</td>
                        <td class="py-2 px-2 text-center text-xs" :class="s.teacherScore !== null ? 'text-brand-700 font-medium' : 'text-gray-300'">{{ s.teacherScore !== null ? s.teacherScore + '分' : '-' }}</td>
                        <td class="py-2 px-2 text-center text-xs" :class="s.mentorScore !== null ? 'text-rose-600 font-medium' : 'text-gray-300'">{{ s.mentorScore !== null ? s.mentorScore + '分' : '-' }}</td>
                        <td class="py-2 px-3">
                          <span v-if="s.submitted" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle class="w-3 h-3" />已提交
                          </span>
                          <span v-else-if="s.hasDraft" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                            <Save class="w-3 h-3" />已保存
                          </span>
                          <span v-else class="text-xs text-gray-300">-</span>
                        </td>
                        <td class="py-2 px-3">
                          <div v-if="!s.submitted" class="flex items-center gap-1">
                            <input type="number" min="0" max="100"
                              v-model.number="evalScoreInputs[s.student.id]"
                              placeholder="分数"
                              class="w-full max-w-[80px] px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                            <span class="text-xs text-gray-400">分</span>
                          </div>
                          <span v-else class="text-xs font-medium text-emerald-600">{{ s.finalScore }}分</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </div>
            <!-- 底部 -->
            <div class="px-6 py-4 border-t border-gray-200 flex flex-wrap items-start justify-between gap-4">
              <div class="flex flex-wrap items-center gap-2">
                <button @click="toggleAllClass"
                  :class="`text-xs px-3 py-1.5 rounded-lg border transition-all ${selectedUnsubmittedCount === 0 && !isAllClassSelected ? 'opacity-50 cursor-not-allowed' : ''} border-gray-300 text-gray-600 hover:bg-gray-100`">
                  {{ isAllClassSelected ? '取消全选' : '全选本班' }}
                </button>
                <span class="text-xs text-gray-500 font-medium">一键等级评价（选中 {{ selectedUnsubmittedCount }} 名学生）：</span>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="level in LEVEL_OPTIONS" :key="level.label"
                    @click="handleBatchEval(level.label)"
                    :class="`text-xs px-3 py-1.5 rounded-lg border transition-all ${level.color} hover:opacity-80 ${selectedUnsubmittedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`"
                    :disabled="selectedUnsubmittedCount === 0">
                    {{ level.label }} ({{ level.range[0] }}-{{ level.range[1] }}分)
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button @click="handleSaveEvalScores"
                  :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${hasEvalInputs ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`"
                  :disabled="!hasEvalInputs">
                  <Save class="w-4 h-4" />
                  保存评分
                </button>
                <button @click="handleSubmitAll"
                  :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${hasSubmittable ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`"
                  :disabled="!hasSubmittable">
                  <CheckCircle class="w-4 h-4" />
                  提交评价（{{ submittableCount }}人）
                </button>
                <button @click="closeEvalPopup()"
                  class="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">关闭</button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- Tab: 成绩配置（完整权重配置） -->
    <div v-if="activeTab === 'grade-config'" class="space-y-6">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Settings class="w-5 h-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">成绩配置</h2>
            <span class="text-xs text-gray-400">{{ enrolledStudents.length }}名学生</span>
          </div>
          <div v-if="!isMentor" class="flex items-center gap-2">
            <button @click="handleSaveGradeConfig" :disabled="isReadOnly || isWeightLocked || mainTotal !== 100 || regularTotal !== 100 || midtermSubTotal !== 100 || finalSubTotal !== 100"
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors">
              <Save class="w-3.5 h-3.5" />
              保存配置
            </button>
          </div>
        </div>

        <!-- 权重锁定提示 -->
        <div v-if="isWeightLocked" class="mb-4 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          <Lock class="w-3.5 h-3.5 text-gray-400" />
          <span>期末考试成绩已录入，权重已锁定，不可再修改。</span>
        </div>

        <!-- 完整权重配置区域 -->
        <div class="space-y-6">
          <Section title="总成绩权重" :hint="`合计：${mainTotal}%${mainTotal !== 100 ? '（须等于 100%）' : ''}`" :valid="mainTotal === 100">
            <Slider label="平时成绩" :val="gradeConfig.regularWeight" @change="(v) => updateGradeConfig('regularWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
            <Slider label="期中成绩" :val="gradeConfig.midtermWeight" @change="(v) => updateGradeConfig('midtermWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
            <Slider label="期末成绩" :val="gradeConfig.finalWeight" @change="(v) => updateGradeConfig('finalWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
          </Section>

          <Section title="平时成绩构成" :hint="`合计：${regularTotal}%${regularTotal !== 100 ? '（须等于 100%）' : ''}`" :valid="regularTotal === 100">
            <Slider label="自评" :val="gradeConfig.selfEvalWeight" @change="(v) => updateGradeConfig('selfEvalWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
            <Slider label="组内互评" :val="gradeConfig.peerReviewWeight" @change="(v) => updateGradeConfig('peerReviewWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
            <Slider label="组间互评" :val="gradeConfig.interGroupEvalWeight" @change="(v) => updateGradeConfig('interGroupEvalWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
            <Slider label="教师评价" :val="gradeConfig.teacherScoreWeight" @change="(v) => updateGradeConfig('teacherScoreWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
            <Slider label="企业导师评价" :val="gradeConfig.mentorScoreWeight" @change="(v) => updateGradeConfig('mentorScoreWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
          </Section>

          <Section title="期中成绩构成" :hint="`合计：${midtermSubTotal}%${midtermSubTotal !== 100 ? '（须等于 100%）' : ''}`" :valid="midtermSubTotal === 100">
            <Slider label="期中考试" :val="gradeConfig.midtermExamWeight" @change="(v) => updateGradeConfig('midtermExamWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
            <Slider label="项目成绩" :val="gradeConfig.midtermProjectWeight" @change="(v) => updateGradeConfig('midtermProjectWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
          </Section>

          <Section title="期末成绩构成" :hint="`合计：${finalSubTotal}%${finalSubTotal !== 100 ? '（须等于 100%）' : ''}`" :valid="finalSubTotal === 100">
            <Slider label="期末测试" :val="gradeConfig.finalExamWeight" @change="(v) => updateGradeConfig('finalExamWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
            <Slider label="项目成绩" :val="gradeConfig.finalProjectWeight" @change="(v) => updateGradeConfig('finalProjectWeight', v)" :disabled="isReadOnly || isWeightLocked || isMentor" />
          </Section>
        </div>
      </div>
    </div>

    <!-- Tab: 成绩录入（期中/期末分区） -->
    <div v-if="activeTab === 'grade-entry'" class="space-y-6">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">成绩录入</h2>
            <span class="text-xs text-gray-400">{{ enrolledStudents.length }}名学生</span>
          </div>
        </div>

        <!-- 搜索与过滤 -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div class="relative w-48">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input v-model="gradeSearch" type="text" placeholder="搜索学生姓名或学号..."
              class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
          </div>
          <select v-model="gradeFilterClass"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
            <option value="">全部班级</option>
            <option v-for="opt in gradeClassOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <select v-model="gradeFilterGroup"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
            <option value="">全部分组</option>
            <option v-for="opt in gradeGroupOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <!-- 期中 / 期末 列表（展开，含导入导出） -->
        <div class="mb-4 space-y-3">
          <!-- ====== 期中 ====== -->
          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <BookOpen class="w-4 h-4 text-blue-500" />
              <span class="text-sm font-semibold text-gray-800">期中</span>
            </div>
            <div class="space-y-2 p-2">
              <!-- ===== 项目子板块 ===== -->
              <div class="border border-blue-100 rounded-lg overflow-hidden bg-white">
                <div class="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-blue-100">
                  <div class="flex items-center gap-1.5">
                    <div class="w-1 h-4 rounded-full bg-blue-400"></div>
                    <span class="text-xs font-semibold text-blue-700">项目</span>
                  </div>
                  <button @click="showNewExamModal = true; newExamType = 'midterm_project'" :disabled="isReadOnly"
                    class="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-lg bg-white text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus class="w-3 h-3" /> 添加项目
                  </button>
                </div>
                <div class="divide-y divide-gray-50">
                  <div v-for="e in midtermProjects" :key="e.name" class="px-4 py-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <button @click="handleSelectExam(e.name)"
                          :class="`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${selectedExam === e.name ? 'bg-blue-50 text-blue-600 border-blue-300 font-medium' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`">
                          {{ e.name }}
                        </button>
                        <div v-if="midtermProjects.length > 1" class="flex items-center gap-1.5">
                          <span class="text-[10px] text-gray-400">占比</span>
                          <input type="number" min="0" max="100" :value="store.getExamWeight(courseId, e.name)"
                            @change="(ev) => { const v = parseInt((ev.target as HTMLInputElement).value); if (!isNaN(v)) store.setExamWeight(courseId, e.name, Math.min(100, Math.max(0, v))) }"
                            class="w-14 px-2 py-1 border border-gray-200 rounded text-[10px] text-center" :disabled="isReadOnly || isWeightLocked" />
                          <span class="text-[10px] text-gray-400">%</span>
                        </div>
                      </div>
                    </div>
                    <!-- 班级列表 - 选中时展开 -->
                    <div v-if="selectedExam === e.name && filteredGradeClassBlocks.length > 0" class="mt-2 ml-6 border border-gray-100 rounded-lg overflow-hidden">
                      <div v-for="(classBlock, ci) in filteredGradeClassBlocks" :key="ci"
                        @click="selectedGradeClass = classBlock.className; showGradePopup = true"
                        class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-semibold text-gray-700 min-w-[4rem]">班级 {{ classBlock.className || '未分班' }}</span>
                          <div class="flex flex-wrap gap-1">
                            <span v-for="(group, gi) in classBlock.groups" :key="gi"
                              class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {{ group.groupName }} ({{ group.items.length }}人)
                            </span>
                          </div>
                          <span class="text-[10px] text-gray-400">{{ classBlock.groups.reduce((a, g) => a + g.items.length, 0) }}人</span>
                        </div>
                        <ChevronRight class="w-3 h-3 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                    <div v-else-if="selectedExam === e.name && filteredGradeClassBlocks.length === 0" class="mt-2 ml-6 text-center py-3 text-[10px] text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      暂无学生数据
                    </div>
                  </div>
                  <div v-if="midtermProjects.length === 0" class="px-4 py-3 text-center text-[10px] text-gray-400">
                    暂无项目，点击上方"添加项目"按钮创建
                  </div>
                </div>
              </div>
              <!-- ===== 笔试成绩子板块 ===== -->
              <div class="border border-emerald-100 rounded-lg overflow-hidden bg-white">
                <div class="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border-b border-emerald-100">
                  <div class="w-1 h-4 rounded-full bg-emerald-400"></div>
                  <span class="text-xs font-semibold text-emerald-700">笔试成绩</span>
                  <span class="text-[10px] text-emerald-300 ml-1">(固定，仅1次)</span>
                </div>
                <div class="divide-y divide-gray-50">
                  <div v-for="e in midtermExams" :key="e.name" class="px-4 py-3">
                    <div class="flex items-center justify-between">
                      <button @click="handleSelectExam(e.name)"
                        :class="`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${selectedExam === e.name ? 'bg-emerald-50 text-emerald-600 border-emerald-300 font-medium' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`">
                        {{ e.name }}
                      </button>
                    </div>
                    <!-- 班级列表 - 选中时展开 -->
                    <div v-if="selectedExam === e.name && filteredGradeClassBlocks.length > 0" class="mt-2 ml-6 border border-gray-100 rounded-lg overflow-hidden">
                      <div v-for="(classBlock, ci) in filteredGradeClassBlocks" :key="ci"
                        @click="selectedGradeClass = classBlock.className; showGradePopup = true"
                        class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-semibold text-gray-700 min-w-[4rem]">班级 {{ classBlock.className || '未分班' }}</span>
                          <div class="flex flex-wrap gap-1">
                            <span v-for="(group, gi) in classBlock.groups" :key="gi"
                              class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {{ group.groupName }} ({{ group.items.length }}人)
                            </span>
                          </div>
                          <span class="text-[10px] text-gray-400">{{ classBlock.groups.reduce((a, g) => a + g.items.length, 0) }}人</span>
                        </div>
                        <ChevronRight class="w-3 h-3 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                    <div v-else-if="selectedExam === e.name && filteredGradeClassBlocks.length === 0" class="mt-2 ml-6 text-center py-3 text-[10px] text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      暂无学生数据
                    </div>
                  </div>
                  <div v-if="midtermExams.length === 0" class="px-4 py-3 text-center text-[10px] text-gray-400">
                    笔试成绩将自动创建，请等待加载完成后导入
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ====== 期末 ====== -->
          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <BookOpen class="w-4 h-4 text-amber-500" />
              <span class="text-sm font-semibold text-gray-800">期末</span>
            </div>
            <div class="space-y-2 p-2">
              <!-- ===== 项目子板块 ===== -->
              <div class="border border-blue-100 rounded-lg overflow-hidden bg-white">
                <div class="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-blue-100">
                  <div class="flex items-center gap-1.5">
                    <div class="w-1 h-4 rounded-full bg-blue-400"></div>
                    <span class="text-xs font-semibold text-blue-700">项目</span>
                  </div>
                  <button @click="showNewExamModal = true; newExamType = 'final_project'" :disabled="isReadOnly"
                    class="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-lg bg-white text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus class="w-3 h-3" /> 添加项目
                  </button>
                </div>
                <div class="divide-y divide-gray-50">
                  <div v-for="e in finalProjects" :key="e.name" class="px-4 py-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <button @click="handleSelectExam(e.name)"
                          :class="`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${selectedExam === e.name ? 'bg-blue-50 text-blue-600 border-blue-300 font-medium' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`">
                          {{ e.name }}
                        </button>
                        <div v-if="finalProjects.length > 1" class="flex items-center gap-1.5">
                          <span class="text-[10px] text-gray-400">占比</span>
                          <input type="number" min="0" max="100" :value="store.getExamWeight(courseId, e.name)"
                            @change="(ev) => { const v = parseInt((ev.target as HTMLInputElement).value); if (!isNaN(v)) store.setExamWeight(courseId, e.name, Math.min(100, Math.max(0, v))) }"
                            class="w-14 px-2 py-1 border border-gray-200 rounded text-[10px] text-center" :disabled="isReadOnly || isWeightLocked" />
                          <span class="text-[10px] text-gray-400">%</span>
                        </div>
                      </div>
                    </div>
                    <!-- 班级列表 - 选中时展开 -->
                    <div v-if="selectedExam === e.name && filteredGradeClassBlocks.length > 0" class="mt-2 ml-6 border border-gray-100 rounded-lg overflow-hidden">
                      <div v-for="(classBlock, ci) in filteredGradeClassBlocks" :key="ci"
                        @click="selectedGradeClass = classBlock.className; showGradePopup = true"
                        class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-semibold text-gray-700 min-w-[4rem]">班级 {{ classBlock.className || '未分班' }}</span>
                          <div class="flex flex-wrap gap-1">
                            <span v-for="(group, gi) in classBlock.groups" :key="gi"
                              class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {{ group.groupName }} ({{ group.items.length }}人)
                            </span>
                          </div>
                          <span class="text-[10px] text-gray-400">{{ classBlock.groups.reduce((a, g) => a + g.items.length, 0) }}人</span>
                        </div>
                        <ChevronRight class="w-3 h-3 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                    <div v-else-if="selectedExam === e.name && filteredGradeClassBlocks.length === 0" class="mt-2 ml-6 text-center py-3 text-[10px] text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      暂无学生数据
                    </div>
                  </div>
                  <div v-if="finalProjects.length === 0" class="px-4 py-3 text-center text-[10px] text-gray-400">
                    暂无项目，点击上方"添加项目"按钮创建
                  </div>
                </div>
              </div>
              <!-- ===== 笔试成绩子板块 ===== -->
              <div class="border border-emerald-100 rounded-lg overflow-hidden bg-white">
                <div class="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border-b border-emerald-100">
                  <div class="w-1 h-4 rounded-full bg-emerald-400"></div>
                  <span class="text-xs font-semibold text-emerald-700">笔试成绩</span>
                  <span class="text-[10px] text-emerald-300 ml-1">(固定，仅1次)</span>
                </div>
                <div class="divide-y divide-gray-50">
                  <div v-for="e in finalExams" :key="e.name" class="px-4 py-3">
                    <div class="flex items-center justify-between">
                      <button @click="handleSelectExam(e.name)"
                        :class="`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${selectedExam === e.name ? 'bg-emerald-50 text-emerald-600 border-emerald-300 font-medium' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`">
                        {{ e.name }}
                      </button>
                    </div>
                    <!-- 班级列表 - 选中时展开 -->
                    <div v-if="selectedExam === e.name && filteredGradeClassBlocks.length > 0" class="mt-2 ml-6 border border-gray-100 rounded-lg overflow-hidden">
                      <div v-for="(classBlock, ci) in filteredGradeClassBlocks" :key="ci"
                        @click="selectedGradeClass = classBlock.className; showGradePopup = true"
                        class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-semibold text-gray-700 min-w-[4rem]">班级 {{ classBlock.className || '未分班' }}</span>
                          <div class="flex flex-wrap gap-1">
                            <span v-for="(group, gi) in classBlock.groups" :key="gi"
                              class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {{ group.groupName }} ({{ group.items.length }}人)
                            </span>
                          </div>
                          <span class="text-[10px] text-gray-400">{{ classBlock.groups.reduce((a, g) => a + g.items.length, 0) }}人</span>
                        </div>
                        <ChevronRight class="w-3 h-3 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                    <div v-else-if="selectedExam === e.name && filteredGradeClassBlocks.length === 0" class="mt-2 ml-6 text-center py-3 text-[10px] text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      暂无学生数据
                    </div>
                  </div>
                  <div v-if="finalExams.length === 0" class="px-4 py-3 text-center text-[10px] text-gray-400">
                    笔试成绩将自动创建，请等待加载完成后导入
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索与过滤（影响各项目/考试下展开的班级列表） -->
        <div v-if="selectedExam" class="flex flex-wrap items-center gap-2 mb-3">
          <div class="relative w-48">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input v-model="gradeSearch" type="text" placeholder="搜索学生姓名或学号..."
              class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
          </div>
          <select v-model="gradeFilterClass"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
            <option value="">全部班级</option>
            <option v-for="opt in gradeClassOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <select v-model="gradeFilterGroup"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
            <option value="">全部分组</option>
            <option v-for="opt in gradeGroupOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>

      <!-- 成绩查询（置于成绩管理下方） -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <BarChart3 class="w-5 h-5 text-gray-400" />
            <h2 class="font-semibold text-gray-900">成绩查询</h2>
            <span class="text-xs text-gray-400">{{ enrolledStudents.length }}名学生</span>
          </div>
        </div>

        <!-- 搜索与过滤 -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div class="relative w-48">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input v-model="gradeSearch" type="text" placeholder="搜索学生姓名或学号..."
              class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
          </div>
          <select v-model="gradeFilterClass"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
            <option value="">全部班级</option>
            <option v-for="opt in gradeClassOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <select v-model="gradeFilterGroup"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
            <option value="">全部分组</option>
            <option v-for="opt in gradeGroupOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <!-- 成绩分布图表 -->
        <div v-if="hasGradeData" class="border-t border-gray-100 pt-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 class="text-xs font-semibold text-gray-700 mb-2">期中成绩分布</h4>
              <div ref="midtermChartRef" class="w-full h-64"></div>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-700 mb-2">期末成绩分布</h4>
              <div ref="finalChartRef" class="w-full h-64"></div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <BarChart3 class="w-12 h-12 text-gray-200 mx-auto mb-2" />
          <p class="text-sm text-gray-400">暂无成绩数据，请先录入期中/期末成绩</p>
        </div>
      </div>
    </div>

      <!-- 新建考试/项目弹窗 -->
      <Teleport to="body">
        <div v-if="showNewExamModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showNewExamModal = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">新建项目</h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-500 font-medium mb-1 block">名称</label>
                <input v-model="newExamName" type="text" placeholder="如：项目一、项目二"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label class="text-xs text-gray-500 font-medium mb-1 block">满分</label>
                <input v-model.number="newExamFullScore" type="number" min="1" max="200" value="100"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
              </div>
              <div>
                <label class="text-xs text-gray-500 font-medium mb-1 block">类型</label>
                <select v-model="newExamType"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none">
                    <option value="midterm_project">期中项目</option>
                    <option value="final_project">期末项目</option>
                  </select>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button @click="showNewExamModal = false"
                class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button @click="handleAddExam"
                :disabled="!newExamName.trim()"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                创建
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 成绩管理弹窗 -->
      <Teleport to="body">
        <div v-if="showGradePopup" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="closeGradePopup()" />
          <div class="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[85vh] flex flex-col">
            <!-- 头部 -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-semibold text-gray-800">班级 {{ selectedGradeClass }} - 成绩管理（{{ selectedExam }}）</h3>
                <div class="flex items-center gap-1">
                  <label class="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium rounded transition-colors cursor-pointer bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100">
                    <FileSpreadsheet class="w-3 h-3" /> 导入
                    <input type="file" accept=".xlsx,.xls" @change="handleExcelImport" class="hidden" :disabled="isReadOnly" />
                  </label>
                  <button @click="openDownloadTemplateModal()"
                    class="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
                    <FileSpreadsheet class="w-3 h-3" /> 模板
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="relative w-48">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input v-model="gradePopupSearch" type="text" placeholder="搜索学生姓名或学号..."
                    class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
                </div>
                <button @click="closeGradePopup()" class="text-gray-400 hover:text-gray-600">
                  <X class="w-5 h-5" />
                </button>
              </div>
            </div>
            <!-- 内容 -->
            <div class="flex-1 overflow-auto px-6 py-4">
              <div v-if="!currentGradeClassSection" class="text-center py-8 text-gray-400">暂无数据</div>
              <div v-else-if="filteredGradePopupGroups.length === 0" class="text-center py-8 text-gray-400">未找到匹配的学生</div>
              <template v-if="currentGradeClassSection">
                <div v-for="(group, gi) in filteredGradePopupGroups" :key="gi" class="mb-4">
                  <div class="text-xs font-semibold text-gray-600 mb-2 px-1">{{ group.groupName }}（{{ group.items.length }}人）</div>
                  <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="text-left py-2 px-3 text-gray-500 font-medium text-xs">学生</th>
                        <th class="text-left py-2 px-3 text-gray-500 font-medium text-xs w-20">满分</th>
                        <th class="text-left py-2 px-3 text-gray-500 font-medium text-xs w-32">成绩</th>
                        <th class="text-left py-2 px-3 text-gray-500 font-medium text-xs w-24">折合百分制</th>
                        <th class="text-left py-2 px-3 text-gray-500 font-medium text-xs w-20">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="{ student } in group.items" :key="student!.id"
                        class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        :class="{ 'bg-emerald-50/20': isExamSubmitted(student!.id) }">
                        <td class="py-2 px-3">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span class="text-xs font-medium text-blue-600">{{ student!.name.charAt(0) }}</span>
                            </div>
                            <div>
                              <p class="font-medium text-gray-900 text-sm">{{ student!.name }}</p>
                              <p class="text-xs text-gray-400">{{ student!.studentId || student!.id }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="py-2 px-3 text-xs text-gray-500">{{ currentExamFullScore }}</td>
                        <td class="py-2 px-3">
                          <div v-if="!isExamSubmitted(student!.id)" class="flex items-center gap-1">
                            <input type="number" min="0" :max="currentExamFullScore" step="0.5"
                              :value="examInputs[student!.id] ?? getStudentExamScore(student!.id)"
                              @input="(e) => { const v = parseFloat((e.target as HTMLInputElement).value); if (!isNaN(v)) examInputs[student!.id] = Math.min(currentExamFullScore, Math.max(0, v)); else delete examInputs[student!.id] }"
                              :placeholder="getStudentExamScore(student!.id) !== null ? String(getStudentExamScore(student!.id)) : '分数'"
                              class="w-full max-w-[100px] px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                            <span class="text-xs text-gray-400">/ {{ currentExamFullScore }}</span>
                          </div>
                          <span v-else class="text-xs font-medium text-emerald-600">{{ getStudentExamScore(student!.id) }}分</span>
                        </td>
                        <td class="py-2 px-3 text-xs text-blue-600 font-medium">{{ getStudentExamPercent(student!.id) }}</td>
                        <td class="py-2 px-3">
                          <span v-if="isExamSubmitted(student!.id)" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle class="w-3 h-3" />已提交
                          </span>
                          <span v-else-if="getStudentExamScore(student!.id) !== null" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                            <Save class="w-3 h-3" />已保存
                          </span>
                          <span v-else class="text-xs text-gray-300">-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </div>
            <!-- 底部 -->
            <div v-if="!isReadOnly && !isMentor" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">已提交 {{ submittedExamCount }} 人</span>
              </div>
              <div class="flex items-center gap-2">
                <button @click="handleSaveExamScores"
                  :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${hasExamInputs ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`"
                  :disabled="!hasExamInputs">
                  <Save class="w-4 h-4" />
                  保存成绩
                </button>
                <button @click="handleSubmitExamScores"
                  :class="`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pendingExamSubmits > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`"
                  :disabled="pendingExamSubmits === 0">
                  <CheckCircle class="w-4 h-4" />
                  全部提交（{{ pendingExamSubmits }}人）
                </button>
                <button @click="closeGradePopup()"
                  class="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">关闭</button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

    <!-- Tab: 学生管理（大改版：班级板块直展分组） -->
    <div v-if="activeTab === 'students'" class="space-y-6">
      <!-- 课程信息提示 -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <BookOpen class="w-5 h-5 text-blue-600" />
        <span class="text-sm font-medium text-blue-800">
          当前课程：<span class="font-bold">{{ course?.title }}</span>
        </span>
        <span class="text-xs text-blue-500 ml-auto">共 {{ enrolledStudents.length }} 名学生</span>
      </div>

      <!-- 顶部全局操作栏：只保留新建班级和导入班级 -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h2 class="font-semibold text-gray-900 text-lg">班级管理</h2>
        <div class="flex gap-2 flex-wrap">
          <button @click="showAddClass = true"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors shadow-sm">
            <Plus class="w-3.5 h-3.5" />
            新建班级
          </button>
          <button @click="handleImportClassDetail"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm">
            <Upload class="w-3.5 h-3.5" />
            导入班级
          </button>
        </div>
      </div>

      <!-- 班级横向等分板块 -->
      <div v-if="classBlocks.length > 0" class="flex flex-nowrap gap-5 overflow-x-auto pb-2" style="scrollbar-width: thin;">
        <div
          v-for="(classData, clsIdx) in classBlocks" :key="clsIdx"
          class="flex-1 min-w-[320px] bg-white rounded-xl border border-gray-100 shadow-sm p-5 group"
        >
          <!-- 班级标题 + 人数 + 操作 -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">班级</span>
              {{ classData.className || '未分班' }}
              <span class="text-xs text-gray-400 font-normal">（{{ classData.students.length }}人）</span>
            </h3>
            <div v-if="classData.className" class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="handleImportGroupsForClass(classData.className)" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="导入分组">
                <Upload class="w-3.5 h-3.5" />
              </button>
              <button @click.stop="openNewGroupForClass(classData.className)" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="新建分组">
                <Plus class="w-3.5 h-3.5" />
              </button>
              <button @click.stop="handleDeleteClass(classData.className)" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="删除班级">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 该班级的分组列表 -->
          <div v-if="getGroupsForClassBlock(classData.className).length > 0" class="space-y-3">
            <div
              v-for="group in getGroupsForClassBlock(classData.className)" :key="group.id"
              class="p-3 rounded-lg border border-gray-100 hover:border-gray-200 group/grp transition-all"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-md bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-700">
                    {{ group.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{{ group.name }}</p>
                    <p class="text-[11px] text-gray-400">{{ group.memberIds.length }} 名成员</p>
                  </div>
                </div>
                <div class="flex gap-1 opacity-0 group-hover/grp:opacity-100 transition-opacity">
                  <button @click.stop="openEditGroupModal(group)" class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="编辑分组">
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button @click.stop="handleDeleteGroup(group.id)" class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="删除分组">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                <span v-for="sid in group.memberIds" :key="sid"
                  class="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {{ getStudentName(sid) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="border border-dashed border-gray-200 rounded-lg p-6 text-center">
            <Users class="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p class="text-xs text-gray-400">该班级暂无分组</p>
            <button @click="openNewGroupForClass(classData.className)"
              class="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <Plus class="w-3 h-3" />新建分组
            </button>
          </div>

          <!-- 一键分组按钮（每个班级内部） -->
          <div v-if="classData.className && classData.students.length >= 2" class="mt-4 pt-3 border-t border-gray-100 flex gap-2 justify-end">
            <button @click.stop="showOneClickGroupForClass(classData.className)"
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
              <RefreshCw class="w-3.5 h-3.5" />一键分组
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
        <Users class="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>暂无班级数据，请先导入学生</p>
      </div>
      <!-- 隐藏的文件输入：用于每个班级内的导入分组 -->
      <input ref="groupClassExcelInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleImportGroupsExcel" />

      <!-- ====== 一键分组弹窗 ====== -->
      <Teleport to="body">
        <div v-if="showOneClickGroup" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showOneClickGroup = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div class="flex items-center justify-between mb-5">
              <h3 class="font-semibold text-gray-900 text-lg">一键随机分组</h3>
              <button @click="showOneClickGroup = false" class="text-gray-400 hover:text-gray-600"><X class="w-4 h-4" /></button>
            </div>
            <div class="space-y-4">
              <!-- 选择班级 -->
              <div>
                <label class="text-xs text-gray-500 block mb-1.5 font-medium">选择班级</label>
                <select
                  v-model="oneClickGroupData.className"
                  @change="oneClickGroupData.groupCount = Math.max(2, Math.ceil(getClassStudentCount(oneClickGroupData.className) / 3))"
                  class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                >
                  <option value="" disabled>请选择班级</option>
                  <option v-for="cb in classBlocks" :key="cb.className" :value="cb.className">
                    {{ cb.className || '未分班' }}（{{ cb.students.length }}人）
                  </option>
                </select>
              </div>

              <!-- 班级总人数 -->
              <div v-if="oneClickGroupData.className" class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <Users class="w-5 h-5 text-blue-600" />
                <div>
                  <p class="text-sm font-medium text-blue-800">
                    该班共 <span class="text-lg font-bold">{{ getClassStudentCount(oneClickGroupData.className) }}</span> 名学生
                  </p>
                  <p class="text-xs text-blue-500">请根据人数设置合适的总组数</p>
                </div>
              </div>

              <!-- 填写总组数 -->
              <div>
                <label class="text-xs text-gray-500 block mb-1.5 font-medium">设置总组数</label>
                <div class="flex items-center gap-3">
                  <button
                    @click="oneClickGroupData.groupCount = Math.max(2, (oneClickGroupData.groupCount || 2) - 1)"
                    class="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >−</button>
                  <input
                    v-model.number="oneClickGroupData.groupCount"
                    type="number" min="2"
                    :max="oneClickMaxGroups"
                    class="flex-1 text-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold focus:border-blue-400 outline-none"
                    :class="{ 'border-red-400 focus:border-red-500': groupCountExceedsStudents }"
                  />
                  <button
                    @click="oneClickGroupData.groupCount = Math.min(oneClickMaxGroups || 1, (oneClickGroupData.groupCount || 2) + 1)"
                    class="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >+</button>
                </div>
                <!-- 组数超过班级人数警告 -->
                <p v-if="groupCountExceedsStudents" class="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle class="w-3 h-3" />
                  总组数（{{ oneClickGroupData.groupCount }}）不能超过该班级人数（{{ oneClickMaxGroups }}）
                </p>
                <p v-else-if="oneClickGroupData.className" class="text-[11px] text-gray-400 mt-1.5">
                  每组约 {{ Math.ceil(oneClickMaxGroups / (oneClickGroupData.groupCount || 2)) }} 人
                </p>
              </div>

              <button
                @click="handleOneClickGroup"
                :disabled="!oneClickGroupData.className || !oneClickGroupData.groupCount || oneClickGroupData.groupCount < 2 || groupCountExceedsStudents"
                class="w-full py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw class="w-4 h-4" />
                开始随机分组
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ====== 新增班级弹窗 ====== -->
      <Teleport to="body">
        <div v-if="showAddClass" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showAddClass = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-900 text-lg">新增班级</h3>
              <button @click="showAddClass = false" class="text-gray-400 hover:text-gray-600"><X class="w-4 h-4" /></button>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-500 block mb-1">班级名称</label>
                <input v-model="addClassForm.className" placeholder="输入班级名称，如：软件工程一班"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" />
              </div>
              <div class="flex gap-2 pt-2">
                <button @click="showAddClass = false" class="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
                <button @click="saveAddClass" :disabled="!addClassForm.className.trim()"
                  class="flex-1 px-4 py-2 text-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg">保存</button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ====== 编辑班级弹窗 ====== -->
      <Teleport to="body">
        <div v-if="showEditClassModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showEditClassModal = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-900 text-lg">编辑班级</h3>
              <button @click="showEditClassModal = false" class="text-gray-400 hover:text-gray-600"><X class="w-4 h-4" /></button>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-500 block mb-1">班级名称</label>
                <input v-model="editClassName" placeholder="输入班级名称"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" />
              </div>
              <div class="flex gap-2 pt-2">
                <button @click="showEditClassModal = false" class="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
                <button @click="handleSaveEditClass" :disabled="!editClassName.trim()"
                  class="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg">保存</button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ====== 新建/编辑分组弹窗（选班级 + 选成员） ====== -->
      <Teleport to="body">
        <div v-if="showGroupModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showGroupModal = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">新建分组</h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-500 block mb-1">所属班级</label>
                <select v-model="groupFormClassName"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-blue-400 outline-none">
                  <option value="" disabled>请选择班级</option>
                  <option v-for="cb in classBlocks" :key="cb.className" :value="cb.className">
                    {{ cb.className || '未分班' }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">组名</label>
                <input v-model="groupFormName" placeholder="请输入组名" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">选择成员（仅显示该班学生）</label>
                <div class="max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-1">
                  <div v-for="stu in getClassStudents(groupFormClassName)" :key="stu.id"
                    @click="toggleGroupFormMember(stu.id)"
                    class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm"
                    :class="groupFormMembers.includes(stu.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'">
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      :class="groupFormMembers.includes(stu.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'">
                      <span v-if="groupFormMembers.includes(stu.id)" class="text-white text-[10px]">✓</span>
                    </div>
                    <span>{{ stu.name }}</span>
                    <span class="text-xs text-gray-400 ml-auto">{{ stu.id }}</span>
                  </div>
                </div>
              </div>
              <div class="flex gap-2 pt-2">
                <button @click="showGroupModal = false; editingGroup = null" class="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
                <button @click="handleSaveGroup" class="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  {{ editingGroup ? '保存' : '保存' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ====== 编辑学生弹窗 ====== -->
      <Teleport to="body">
        <div v-if="showEditStudentModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showEditStudentModal = false" />
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">编辑学生信息</h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-500 block mb-1">姓名</label>
                <input v-model="editStudentName" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">学号</label>
                <input v-model="editStudentIdField" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">班级</label>
                <input v-model="editStudentClass" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="输入班级名称" />
              </div>
              <div class="flex gap-2 pt-2">
                <button @click="showEditStudentModal = false" class="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
                <button @click="handleSaveEditStudent" class="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">保存</button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>

  <!-- GradeConfig 权重配置弹窗 -->
  <GradeConfig
    :course-id="courseId || ''"
    :open="showGradeConfig"
    :on-close="() => { showGradeConfig = false }"
  />

  <!-- 下载模板弹窗 -->
  <Teleport to="body">
    <div v-if="showDownloadTemplateModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showDownloadTemplateModal = false" />
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 text-lg">下载成绩模板</h3>
          <button @click="showDownloadTemplateModal = false" class="text-gray-400 hover:text-gray-600"><X class="w-4 h-4" /></button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="text-xs text-gray-500 block mb-2 font-medium">选择班级</label>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <label class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
                :class="downloadTemplateClass === '__all__' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'">
                <input type="radio" v-model="downloadTemplateClass" value="__all__"
                  class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <p class="text-sm font-medium text-gray-900">全部班级</p>
                  <p class="text-xs text-gray-400">所有已分班或未分班的学生</p>
                </div>
              </label>
              <label v-for="cb in classBlocks" :key="cb.className"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
                :class="downloadTemplateClass === cb.className ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'">
                <input type="radio" v-model="downloadTemplateClass" :value="cb.className"
                  class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ cb.className || '未分班' }}</p>
                  <p class="text-xs text-gray-400">{{ cb.students.length }} 名学生</p>
                </div>
              </label>
            </div>
          </div>
          <div class="flex gap-2 pt-2">
            <button @click="showDownloadTemplateModal = false"
              class="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
            <button @click="handleDownloadTemplate"
              class="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
              下载模板
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import GradeConfig from '@/components/GradeConfig.vue'
import Slider from '@/components/GradeConfig/Slider.vue'
import Section from '@/components/GradeConfig/Section.vue'
import {
  EvalTemplateLabels, EvalTemplateDescs, TEMPLATE_EVAL_TYPES,
  EvalTypeLabels, EvalTypeColors, EvalFrequencyLabels,
  EvalFrequencyDescs, OverdueRuleLabels, getDefaultGradeConfig
} from '@/types'
import type { EvalTemplate, EvalType, Evaluation, EvalFrequency, OverdueRule, Schedule, GradeWeightConfig } from '@/types'
import { AlertTriangle, ChevronRight, Plus, Search, X, Pencil, Trash2, Calendar, Clock, ClipboardCheck, TrendingUp, Users, Upload, RefreshCw, Settings, ArrowLeft, Eye, Lock, EyeOff, CheckCircle, Save, FileSpreadsheet, BookOpen, BarChart3 } from 'lucide-vue-next'
import { getNow } from '@/lib/date'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const courseId = computed(() => route.params.id as string)
const course = computed(() => store.courses.find((c) => c.id === courseId.value))
const isReadOnly = computed(() => course.value?.status !== 'active')
const isMentor = computed(() => store.currentRole === 'mentor')

// 从数据库加载课程学员
onMounted(async () => {
  try {
    const res = await fetch(`http://localhost:3000/api/courses/${courseId.value}/students`)
    const data = await res.json()
    if (data.success && data.students.length > 0) {
      // 更新 store.students 为数据库数据
      for (const s of data.students) {
        const existing = store.students.findIndex((x) => x.studentId === s.studentId)
        if (existing >= 0) {
          store.students[existing] = { ...store.students[existing], ...s }
        } else {
          store.students.push({ ...s, avatar: '', joinDate: '', enrollmentScore: 0 })
        }
      }
      // 同步 enrollments（避免重复）
      const existingIds = new Set(store.enrollments.map((e) => e.studentId))
      for (const s of data.students) {
        if (!existingIds.has(s.id)) {
          store.enrollments.push({
            id: `enr-db-${s.id}-${courseId.value}`,
            studentId: s.id,
            courseId: courseId.value,
            scheduleId: '',
            enrollDate: '',
            progress: 0,
            status: 'enrolled',
          })
        }
      }
    }
  } catch (e) {
    console.error('加载课程学员失败:', e)
  }
  ensureWrittenExams()
})

const courseSchedules = computed(() =>
  store.schedules.filter((s) => s.courseId === courseId.value)
)

const sortedCourseSchedules = computed(() =>
  [...courseSchedules.value].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
)

const schedulesWithStatus = computed(() => {
  const sorted = [...courseSchedules.value].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
  // 以第一节课开课时间作为参考基准，学期前所有课程均显示为"待上课"
  const referenceDate = getNow()
  referenceDate.setHours(0, 0, 0, 0)
  const completed: (Schedule & { isCompleted: boolean; originalIndex: number })[] = []
  const upcoming: (Schedule & { isCompleted: boolean; originalIndex: number })[] = []
  sorted.forEach((sch, i) => {
    if (new Date(sch.endDate) < referenceDate) {
      completed.push({ ...sch, isCompleted: true, originalIndex: i })
    } else {
      upcoming.push({ ...sch, isCompleted: false, originalIndex: i })
    }
  })
  return [...upcoming, ...completed]
})

const completedCount = computed(() =>
  schedulesWithStatus.value.filter((s) => s.isCompleted).length
)

// ---- Tab 配置 ----
const tabList = [
  { key: 'comments',     label: '评论管理', icon: ClipboardCheck },
  { key: 'grade-config', label: '成绩配置', icon: Settings },
  { key: 'grade-entry',  label: '成绩管理', icon: TrendingUp },
  { key: 'students',     label: '学生管理', icon: Users },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// ---- 常量 ----
const LEVEL_OPTIONS = [
  { label: 'A (优秀)', range: [90, 100], color: 'bg-brand-600/15 text-gray-800 border-brand-600' },
  { label: 'B (良好)', range: [80, 89],  color: 'bg-brand-600/15 text-gray-800 border-brand-600' },
  { label: 'C (中等)', range: [70, 79],  color: 'bg-brand-600/15 text-gray-800 border-brand-600' },
  { label: 'D (及格)', range: [60, 69],  color: 'bg-brand-600/15 text-gray-800 border-brand-600' },
]
const ALL_EVAL_TYPES: EvalType[] = ['self', 'intra_group', 'inter_group', 'teacher', 'mentor']
const EVAL_TEMPLATE_KEYS = Object.keys(EvalTemplateLabels) as EvalTemplate[]
const EVAL_FREQUENCY_KEYS = Object.keys(EvalFrequencyLabels) as EvalFrequency[]
const OVERDUE_RULE_KEYS = Object.keys(OverdueRuleLabels) as OverdueRule[]
const ExamTypeLabels: Record<string, string> = {
  midterm_exam: '期中考试',
  midterm_project: '期中项目',
  final_exam: '期末考试',
  final_project: '期末项目',
}

// ---- 配置锁定状态 ----
const evalConfigLocked = computed(() => {
  if (!courseId.value) return true
  return !store.isEvalConfigEditable(courseId.value)
})
const isWeightLocked = computed(() => {
  if (!courseId.value) return true
  return !store.isWeightConfigEditable(courseId.value)
})

// ---- 状态 ----
const activeTab = ref<string>('comments')
const showSettings = ref(false)
const studentSearch = ref('')

// ---- 学生管理 ----
const selectedGroupId = ref<string | null>(null)
// 分组管理（新建/编辑）
const showGroupModal = ref(false)
const editingGroup = ref<import('@/types').StudentGroup | null>(null)
const groupFormName = ref('')
const groupFormMembers = ref<string[]>([])
const groupFormClassName = ref('')
// 编辑学生
const showEditStudentModal = ref(false)
const editingStudent = ref<import('@/types').Student | null>(null)
const editStudentName = ref('')
const editStudentIdField = ref('')
const editStudentClass = ref('')
const editStudentGroupId = ref('')
// 新增班级
const showAddClass = ref(false)
const addClassForm = ref({ className: '', studentIds: [] as string[] })
function toggleAddClassStudent(studentId: string) {
  const idx = addClassForm.value.studentIds.indexOf(studentId)
  if (idx >= 0) {
    addClassForm.value.studentIds.splice(idx, 1)
  } else {
    addClassForm.value.studentIds.push(studentId)
  }
}
function saveAddClass() {
  const className = addClassForm.value.className.trim()
  if (!className) return
  addClassForm.value = { className: '', studentIds: [] }
  showAddClass.value = false
  alert(`已创建班级"${className}"`)
}
// 编辑班级
const showEditClassModal = ref(false)
const editingOldClassName = ref('')
const editClassName = ref('')
function openEditClassModal(className: string) {
  editingOldClassName.value = className
  editClassName.value = className
  showEditClassModal.value = true
}
function handleSaveEditClass() {
  if (!editingOldClassName.value || !editClassName.value.trim()) return
  const newName = editClassName.value.trim()
  // 更新该班级所有学生的 className
  for (const stu of store.students) {
    if (stu.className === editingOldClassName.value) {
      store.updateStudent(stu.id, { className: newName })
    }
  }
  showEditClassModal.value = false
  alert(`班级"${editingOldClassName.value}"已重命名为"${newName}"`)
}
function handleDeleteClass(className: string) {
  if (!confirm(`确定删除班级"${className}"？该操作只会清空学生的班级信息，不会删除学生。`)) return
  for (const stu of store.students) {
    if (stu.className === className) {
      store.updateStudent(stu.id, { className: '' })
    }
  }
}
/** Excel 导入班级信息 */
async function handleImportClassDetail() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls,.csv'
  input.onchange = async (e: any) => {
    const file = e.target?.files?.[0]
    if (!file || !courseId.value) return
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet)
    let classCount = 0, assignedCount = 0
    const addedClasses = new Set<string>()
    for (const row of rows) {
      const className = (row['班级名称'] || row['className'] || '').toString().trim()
      if (!className) continue
      classCount++
      const stuName = (row['学生姓名'] || row['name'] || '').toString().trim()
      const stuId = (row['学生学号'] || row['studentId'] || '').toString().trim()
      if (stuName || stuId) {
        const match = store.students.find(s =>
          (stuId && (s.studentId === stuId || s.id === stuId)) ||
          (stuName && s.name === stuName)
        )
        if (match) {
          store.updateStudent(match.id, { className })
          try { await fetch(`http://localhost:3000/api/teaching/students/${match.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ className }) }) } catch {}
          assignedCount++
        }
      }
      addedClasses.add(className)
    }
    // 同步到课程管理：为每个班级创建排课记录
    const course = store.courses.find((c: any) => c.id === courseId.value)
    if (course) {
      const schedules: any[] = []
      for (const cn of addedClasses) {
        schedules.push({
          courseId: courseId.value,
          title: course.title,
          teacher: course.teacher || '',
          className: cn,
          room: '待定',
          startDate: new Date().toISOString().split('T')[0],
          timeSlot: '09:00-11:00',
        })
      }
      if (schedules.length > 0) {
        try { await fetch('http://localhost:3000/api/schedules/bulk', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ schedules }) }) } catch {}
      }
    }
    alert(`导入完成：共 ${classCount} 个班级，已分配 ${assignedCount} 名学生（已同步到课程管理）`)
  }
  input.click()
}
// 一键分组
const showOneClickGroup = ref(false)
const oneClickGroupData = ref({ className: '', groupCount: 2 })

/** 当前选中班级的学生人数（也是最大组数） */
const oneClickMaxGroups = computed(() => {
  if (!oneClickGroupData.value.className) return 0
  return getClassStudentCount(oneClickGroupData.value.className)
})

/** 组数是否超过班级人数 */
const groupCountExceedsStudents = computed(() => {
  return oneClickMaxGroups.value > 0 && (oneClickGroupData.value.groupCount || 0) > oneClickMaxGroups.value
})

// 导入分组 ref + 目标班级
const groupClassExcelInput = ref<HTMLInputElement | null>(null)
const classNameForImport = ref('')

/** 在指定班级内导入分组（触发表格文件选择） */
function handleImportGroupsForClass(className: string) {
  classNameForImport.value = className
  groupClassExcelInput.value?.click()
}

// ---- 成绩管理 ----
const showNewExamModal = ref(false)
const showGradeConfig = ref(false)
/** 成绩配置——完整权重编辑器（直接展示在标签页内） */
const gradeConfig = ref<GradeWeightConfig>(getDefaultGradeConfig(courseId.value))
watch(() => courseId.value, (id) => {
  gradeConfig.value = store.getGradeConfig(id)
}, { immediate: true })
const updateGradeConfig = (key: keyof GradeWeightConfig, val: number) => {
  gradeConfig.value = { ...gradeConfig.value, [key]: Math.max(0, Math.min(100, val || 0)) }
}
const mainTotal = computed(() => gradeConfig.value.regularWeight + gradeConfig.value.midtermWeight + gradeConfig.value.finalWeight)
const regularTotal = computed(() => gradeConfig.value.selfEvalWeight + gradeConfig.value.peerReviewWeight + gradeConfig.value.interGroupEvalWeight + gradeConfig.value.teacherScoreWeight + gradeConfig.value.mentorScoreWeight)
const midtermSubTotal = computed(() => gradeConfig.value.midtermExamWeight + gradeConfig.value.midtermProjectWeight)
const finalSubTotal = computed(() => gradeConfig.value.finalExamWeight + gradeConfig.value.finalProjectWeight)
function handleSaveGradeConfig() {
  if (!courseId.value) return
  store.saveGradeConfig({ ...gradeConfig.value, courseId: courseId.value })
  store.markConfigCompleted(courseId.value, 'weights')
}
const newExamName = ref('')
const newExamFullScore = ref(100)
const newExamType = ref<'midterm_project' | 'final_project'>('midterm_project')
const selectedExam = ref('')
const gradeSearch = ref('')
/** 下载模板弹窗 */
const showDownloadTemplateModal = ref(false)
const downloadTemplateClass = ref('__all__')
function openDownloadTemplateModal() {
  if (!courseId.value || !selectedExam.value) {
    alert('请先选择一个考试/项目')
    return
  }
  downloadTemplateClass.value = '__all__'
  showDownloadTemplateModal.value = true
}
const examInputs = ref<Record<string, number>>({})
const selectedStudentIds = ref<string[]>([])
const evalScoreInputs = ref<Record<string, number>>({})
const evalStudentSearch = ref('')
const selectedBatchSession = ref(1)

// 评价管理过滤
const evalFilterClass = ref('')
const evalFilterGroup = ref('')
const showEvalPopup = ref(false)
const selectedEvalClass = ref('')

// 成绩管理过滤
const gradeFilterClass = ref('')
const gradeFilterGroup = ref('')
const showGradePopup = ref(false)
const selectedGradeClass = ref('')
const gradePopupSearch = ref('')

// 成绩查询图表引用
const midtermChartRef = ref<HTMLDivElement | null>(null)
const finalChartRef = ref<HTMLDivElement | null>(null)
let midtermChart: echarts.ECharts | null = null
let finalChart: echarts.ECharts | null = null

const hasGradeData = computed(() => {
  if (!courseId.value) return false
  const scores = store.getExamScoresForCourse(courseId.value)
  return scores.some((s) => s.score !== undefined && s.score !== null && s.score > 0)
})

const selectedConfig = computed(() => courseId.value ? store.evalConfigs.find((c) => c.courseId === courseId.value) : null)
const baseEnabledTypes = computed<EvalType[]>(() => selectedConfig.value ? TEMPLATE_EVAL_TYPES[selectedConfig.value.template] : [])
const totalSessions = computed(() => courseId.value ? store.getEvalSessions(courseId.value) : 1)
const courseHasGroups = computed(() => courseId.value ? store.hasGroups(courseId.value) : false)

// ---- 评价管理 ----
const evalTableSections = computed(() => {
  if (!courseId.value) return []
  const session = selectedBatchSession.value
  const search = evalStudentSearch.value.trim().toLowerCase()

  const enrolled = store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => store.students.find((s) => s.id === e.studentId))
    .filter(Boolean) as NonNullable<ReturnType<typeof store.students.find>>[]

  const filtered = search
    ? enrolled.filter((s) => s.name.toLowerCase().includes(search))
    : enrolled

  const groups = store.studentGroups.filter((g) => g.courseId === courseId.value)
  const memberToGroup = new Map<string, string>()
  for (const g of groups) {
    for (const mid of g.memberIds) {
      memberToGroup.set(mid, g.name)
    }
  }

  function buildRow(student: typeof filtered[number]) {
    const evals = store.evaluations.filter(
      (e) => e.courseId === courseId.value && e.studentId === student.id && e.sessionNumber === session
    )
    const getScore = (type: EvalType) => {
      const found = evals.filter((e) => e.type === type)
      if (found.length === 0) return null
      return Math.round(found.reduce((a, e) => a + e.score, 0) / found.length)
    }
    const evalTypeForMentor: EvalType = 'mentor'
    const submitted = store.isSessionLocked(courseId.value || '', session) ||
      store.isTeacherEvalSubmitted(courseId.value || '', student.id, session, isMentor.value ? evalTypeForMentor : 'teacher')
    const draftEvals = evals.filter((e) => e.type === (isMentor.value ? evalTypeForMentor : 'teacher'))
    return {
      student,
      selfScore: getScore('self'),
      intraScore: getScore('intra_group'),
      interScore: getScore('inter_group'),
      teacherScore: getScore('teacher'),
      mentorScore: getScore('mentor'),
      submitted,
      hasDraft: !submitted && draftEvals.length > 0,
      finalScore: store.getSubmittedTeacherScore(courseId.value || '', student.id, session, isMentor.value ? evalTypeForMentor : 'teacher') ?? '-',
    }
  }

  // 先按班级分组，再按分组组织
  const classMap = new Map<string, typeof filtered>()
  for (const s of filtered) {
    const cn = s.className || '未分班'
    if (!classMap.has(cn)) classMap.set(cn, [])
    classMap.get(cn)!.push(s)
  }

  const sections: { className: string; groups: { groupName: string; students: ReturnType<typeof buildRow>[] }[] }[] = []
  for (const [className, students] of classMap) {
    const groupedMap = new Map<string, typeof filtered>()
    const ungrouped: typeof filtered = []
    for (const s of students) {
      const groupName = memberToGroup.get(s.id)
      if (groupName) {
        if (!groupedMap.has(groupName)) groupedMap.set(groupName, [])
        groupedMap.get(groupName)!.push(s)
      } else {
        ungrouped.push(s)
      }
    }
    const groupsArr: { groupName: string; students: ReturnType<typeof buildRow>[] }[] = []
    for (const [name, members] of groupedMap) {
      groupsArr.push({ groupName: name, students: members.map(buildRow) })
    }
    if (ungrouped.length > 0) {
      groupsArr.push({ groupName: '未分组', students: ungrouped.map(buildRow) })
    }
    sections.push({ className, groups: groupsArr })
  }
  return sections
})

/** 当前选中的评价班级数据（用于弹窗）— 使用 filteredEvalTableSections 保持过滤一致性 */
const currentEvalClassSection = computed(() => {
  if (!selectedEvalClass.value) return null
  return filteredEvalTableSections.value.find(cb => cb.className === selectedEvalClass.value) || null
})

/** 评价管理 - 班级选项 */
const evalClassOptions = computed(() => {
  const names = new Set(evalTableSections.value.map(s => s.className))
  return Array.from(names).map(n => ({ label: n, value: n }))
})

/** 评价管理 - 分组选项（基于当前选中的班级） */
const evalGroupOptions = computed(() => {
  if (!evalFilterClass.value) return []
  const section = evalTableSections.value.find(s => s.className === evalFilterClass.value)
  if (!section) return []
  return section.groups.map(g => ({ label: g.groupName, value: g.groupName }))
})

/** 评价管理 - 过滤后的数据 */
const filteredEvalTableSections = computed(() => {
  let sections = evalTableSections.value
  if (evalFilterClass.value) {
    sections = sections.filter(s => s.className === evalFilterClass.value)
  }
  if (evalFilterGroup.value) {
    sections = sections.map(s => ({
      ...s,
      groups: s.groups.filter(g => g.groupName === evalFilterGroup.value)
    })).filter(s => s.groups.length > 0)
  }
  return sections
})

const hasEvalInputs = computed(() => Object.keys(evalScoreInputs.value).length > 0)

function isGroupSelected(gi: number): boolean {
  const group = currentEvalClassSection.value?.groups[gi]
  if (!group) return false
  const all = group.students.filter(s => !s.submitted).map(s => s.student.id)
  return all.length > 0 && all.every(id => selectedStudentIds.value.includes(id))
}

const isAllClassSelected = computed(() => {
  const all = currentEvalClassSection.value
    ? currentEvalClassSection.value.groups.flatMap(g => g.students).filter(s => !s.submitted).map(s => s.student.id)
    : []
  return all.length > 0 && all.every(id => selectedStudentIds.value.includes(id))
})

// ---- 成绩管理 computed ----
const examNames = computed(() => {
  if (!courseId.value) return []
  return store.getExamNames(courseId.value)
})

/** 成绩录入 - 按类型分组的考试/项目 */
const examsWithTypes = computed(() => {
  if (!courseId.value) return [] as { name: string; type: string }[]
  const scores = store.getExamScoresForCourse(courseId.value)
  const map = new Map<string, { name: string; type: string }>()
  for (const s of scores) {
    if (!map.has(s.examName)) {
      map.set(s.examName, { name: s.examName, type: s.type })
    }
  }
  return Array.from(map.values())
})
const midtermProjects = computed(() => examsWithTypes.value.filter(e => e.type === 'midterm_project'))
const midtermExams = computed(() => examsWithTypes.value.filter(e => e.type === 'midterm_exam'))
const finalProjects = computed(() => examsWithTypes.value.filter(e => e.type === 'final_project'))
const finalExams = computed(() => examsWithTypes.value.filter(e => e.type === 'final_exam'))

function getTypeWeightLabel(type: string): string {
  if (!courseId.value) return '-'
  const cfg = store.getGradeConfig(courseId.value)
  if (type === 'midterm_exam' || type === 'midterm_project') {
    return `${cfg.midtermWeight}%`
  }
  if (type === 'final_exam' || type === 'final_project') {
    return `${cfg.finalWeight}%`
  }
  return `${cfg.regularWeight}%`
}

const currentExamFullScore = computed(() => {
  if (!courseId.value || !selectedExam.value) return 100
  const scores = store.getExamScoresForCourse(courseId.value, selectedExam.value)
  return scores.length > 0 ? scores[0].fullScore : 100
})

const currentExamWeight = computed(() => {
  if (!courseId.value || !selectedExam.value) return 0
  return store.getExamWeight(courseId.value, selectedExam.value)
})

const filteredGradeStudents = computed(() => {
  if (!selectedExam.value) return []
  let list = enrolledStudents.value
  if (gradeSearch.value.trim()) {
    const q = gradeSearch.value.trim().toLowerCase()
    list = list.filter(({ student }) =>
      student && (student.name.toLowerCase().includes(q) || student.id.toLowerCase().includes(q))
    )
  }
  return list
})

const gradeClassBlocks = computed(() => {
  if (!courseId.value || !selectedExam.value) return []
  const search = gradeSearch.value.trim().toLowerCase()
  let list = enrolledStudents.value
  if (search) {
    list = list.filter(({ student }) =>
      student && (student.name.toLowerCase().includes(search) || student.id.toLowerCase().includes(search))
    )
  }

  // 按班级分组
  const classMap = new Map<string, typeof list>()
  for (const item of list) {
    if (!item.student) continue
    const cn = item.student.className || '未分班'
    if (!classMap.has(cn)) classMap.set(cn, [])
    classMap.get(cn)!.push(item)
  }

  // 按分组组织
  const result: { className: string; groups: { groupName: string; items: typeof list }[] }[] = []
  const groups = store.studentGroups.filter(g => g.courseId === courseId.value)

  for (const [className, data] of classMap) {
    const memberToGroup = new Map<string, string>()
    for (const g of groups) {
      for (const mid of g.memberIds) {
        const student = store.students.find(s => s.id === mid)
        if (student && (student.className || '未分班') === className) {
          memberToGroup.set(mid, g.name)
        }
      }
    }
    
    const groupedMap = new Map<string, typeof list>()
    const ungrouped: typeof list = []
    for (const item of data) {
      const groupName = memberToGroup.get(item.student!.id)
      if (groupName) {
        if (!groupedMap.has(groupName)) groupedMap.set(groupName, [])
        groupedMap.get(groupName)!.push(item)
      } else {
        ungrouped.push(item)
      }
    }
    
    const groupsArr: { groupName: string; items: typeof list }[] = []
    for (const [name, members] of groupedMap) {
      groupsArr.push({ groupName: name, items: members })
    }
    if (ungrouped.length > 0) {
      groupsArr.push({ groupName: '未分组', items: ungrouped })
    }
    
    result.push({ className, groups: groupsArr })
  }
  return result
})

/** 成绩管理 - 班级选项 */
const gradeClassOptions = computed(() => {
  const names = new Set(gradeClassBlocks.value.map(s => s.className))
  return Array.from(names).map(n => ({ label: n, value: n }))
})

/** 成绩管理 - 分组选项（基于当前选中的班级） */
const gradeGroupOptions = computed(() => {
  if (!gradeFilterClass.value) return []
  const block = gradeClassBlocks.value.find(s => s.className === gradeFilterClass.value)
  if (!block) return []
  return block.groups.map(g => ({ label: g.groupName, value: g.groupName }))
})

/** 成绩管理 - 过滤后的数据 */
const filteredGradeClassBlocks = computed(() => {
  let blocks = gradeClassBlocks.value
  if (gradeFilterClass.value) {
    blocks = blocks.filter(s => s.className === gradeFilterClass.value)
  }
  if (gradeFilterGroup.value) {
    blocks = blocks.map(s => ({
      ...s,
      groups: s.groups.filter(g => g.groupName === gradeFilterGroup.value)
    })).filter(s => s.groups.length > 0)
  }
  return blocks
})

/** 当前选中的成绩班级数据（用于弹窗）— 使用 filteredGradeClassBlocks 保持过滤一致性 */
const currentGradeClassSection = computed(() => {
  if (!selectedGradeClass.value) return null
  return filteredGradeClassBlocks.value.find(cb => cb.className === selectedGradeClass.value) || null
})

/** 弹窗内按搜索过滤后的分组数据 */
const filteredGradePopupGroups = computed(() => {
  const section = currentGradeClassSection.value
  if (!section) return []
  const search = gradePopupSearch.value.trim().toLowerCase()
  if (!search) return section.groups
  return section.groups.map(g => ({
    ...g,
    items: g.items.filter(({ student }) =>
      student && (student.name.toLowerCase().includes(search) || student.id.toLowerCase().includes(search) || (student.studentId && student.studentId.toLowerCase().includes(search)))
    )
  })).filter(g => g.items.length > 0)
})

/** 弹窗内当前班级的所有学生 ID */
const currentGradeClassStudentIds = computed(() => {
  const section = currentGradeClassSection.value
  if (!section) return new Set<string>()
  const ids = new Set<string>()
  for (const group of section.groups) {
    for (const item of group.items) {
      if (item.student) ids.add(item.student.id)
    }
  }
  return ids
})

const hasExamInputs = computed(() => {
  // 弹窗打开时只检查当前班级的输入
  if (selectedGradeClass.value) {
    const ids = currentGradeClassStudentIds.value
    return Object.keys(examInputs.value).some(id => ids.has(id))
  }
  return Object.keys(examInputs.value).length > 0
})

const submittedExamCount = computed(() => {
  if (!courseId.value || !selectedExam.value) return 0
  const all = store.getExamScoresForCourse(courseId.value, selectedExam.value).filter((s) => s.status === 'submitted')
  // 弹窗打开时只统计当前班级
  if (selectedGradeClass.value) {
    const ids = currentGradeClassStudentIds.value
    return all.filter(s => ids.has(s.studentId)).length
  }
  return all.length
})

const pendingExamSubmits = computed(() => {
  if (!courseId.value || !selectedExam.value) return 0
  const target = selectedGradeClass.value
    ? filteredGradeStudents.value.filter(({ student }) => student && currentGradeClassStudentIds.value.has(student.id))
    : filteredGradeStudents.value
  return target.filter(({ student }) => {
    if (!student) return false
    const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
      .find((s) => s.studentId === student.id)
    return score && score.status === 'draft'
  }).length
})

function getStudentExamScore(studentId: string): number | null {
  if (!courseId.value || !selectedExam.value) return null
  const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .find((s) => s.studentId === studentId)
  return score?.score ?? null
}

function isExamSubmitted(studentId: string): boolean {
  if (!courseId.value || !selectedExam.value) return false
  const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .find((s) => s.studentId === studentId)
  return score?.status === 'submitted'
}

function getStudentExamPercent(studentId: string): string {
  if (!courseId.value || !selectedExam.value) return '-'
  const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .find((s) => s.studentId === studentId)
  if (!score) return '-'
  return `${Math.round((score.score / score.fullScore) * 100)}分`
}

function getExamWeightFromConfig(examName: string): number {
  if (!courseId.value) return 0
  return store.getExamWeight(courseId.value, examName)
}

function handleSelectExam(name: string) {
  if (!courseId.value) return
  selectedExam.value = name
}

// ---- 成绩分布图表逻辑 ----
function getGradeDistribution(type: 'midterm' | 'final'): { ranges: string[]; counts: number[] } {
  if (!courseId.value) return { ranges: [], counts: [] }
  const scores = store.getExamScoresForCourse(courseId.value)
  const typePrefix = type === 'midterm' ? 'midterm' : 'final'
  const typeScores = scores
    .filter((s) => s.type && s.type.startsWith(typePrefix) && s.score !== undefined && s.score !== null && s.score > 0)
    .map((s) => s.score as number)
  if (typeScores.length === 0) return { ranges: [], counts: [] }

  const ranges = ['0-59', '60-69', '70-79', '80-89', '90-100']
  const counts = [0, 0, 0, 0, 0]
  typeScores.forEach((score) => {
    const pct = Math.min(100, Math.max(0, score))
    if (pct < 60) counts[0]++
    else if (pct < 70) counts[1]++
    else if (pct < 80) counts[2]++
    else if (pct < 90) counts[3]++
    else counts[4]++
  })
  return { ranges, counts }
}

function renderMidtermChart() {
  if (!midtermChartRef.value) return
  if (!midtermChart) {
    midtermChart = echarts.init(midtermChartRef.value)
  }
  const { ranges, counts } = getGradeDistribution('midterm')
  if (counts.length === 0) { midtermChart?.clear(); return }
  midtermChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: ranges, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: counts,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#6366f1' },
          { offset: 1, color: '#818cf8' }
        ])
      },
      barWidth: '50%',
      label: { show: true, position: 'top', fontSize: 11, color: '#6b7280' }
    }]
  })
}

function renderFinalChart() {
  if (!finalChartRef.value) return
  if (!finalChart) {
    finalChart = echarts.init(finalChartRef.value)
  }
  const { ranges, counts } = getGradeDistribution('final')
  if (counts.length === 0) { finalChart?.clear(); return }
  finalChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: ranges, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: counts,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#f59e0b' },
          { offset: 1, color: '#fbbf24' }
        ])
      },
      barWidth: '50%',
      label: { show: true, position: 'top', fontSize: 11, color: '#6b7280' }
    }]
  })
}

function renderGradeCharts() {
  nextTick(() => {
    renderMidtermChart()
    renderFinalChart()
  })
}

// 监听成绩数据变化，刷新图表
watch(() => store.getExamScoresForCourse(courseId.value || ''), () => {
  renderGradeCharts()
}, { deep: true })

watch(activeTab, (tab) => {
  if (tab === 'grade-entry') {
    renderGradeCharts()
  }
})

watch(midtermChartRef, (el) => {
  if (el && activeTab.value === 'grade-entry') renderGradeCharts()
})
watch(finalChartRef, (el) => {
  if (el && activeTab.value === 'grade-entry') renderGradeCharts()
})

function handleAddExam() {
  if (!courseId.value || !newExamName.value.trim()) return
  const name = newExamName.value.trim()
  const type = newExamType.value

  for (const { student } of enrolledStudents.value) {
    if (!student) continue
    const id = `exam-${courseId.value}-${student.id}-${name}-${Date.now()}`
    store.addExamScore({
      id,
      courseId: courseId.value,
      studentId: student.id,
      examName: name,
      score: 0,
      fullScore: newExamFullScore.value,
      weight: 0,
      type,
      status: 'draft',
      createdAt: getNow().toISOString().split('T')[0],
      gradedAt: '',
    })
  }

  if (type === 'midterm_project' || type === 'final_project') {
    const sameTypeExams = store.getExamScoresForCourse(courseId.value)
      .filter((s) => s.type === type)
    const uniqueNames = Array.from(new Set(sameTypeExams.map((s) => s.examName)))
    const typeWeight = type === 'midterm_project'
      ? store.getGradeConfig(courseId.value).midtermWeight
      : store.getGradeConfig(courseId.value).finalWeight
    if (uniqueNames.length > 0 && typeWeight > 0) {
      const eachWeight = Math.floor(typeWeight / uniqueNames.length)
      uniqueNames.forEach((examName) => store.setExamWeight(courseId.value!, examName, eachWeight))
    }
  }

  showNewExamModal.value = false
  selectedExam.value = name
  newExamName.value = ''

}

/** 确保期中和期末的笔试成绩默认存在（自动创建，无需手动添加） */
function ensureWrittenExams() {
  if (!courseId.value) return
  const students = enrolledStudents.value
  if (students.length === 0) return

  // 先清理重复数据，再将非标准笔试名称统一
  store.deduplicateExamScores(courseId.value)
  store.normalizeWrittenExamNames(courseId.value)

  const existingScores = store.getExamScoresForCourse(courseId.value)
  const now = getNow().toISOString().split('T')[0]

  // 期中考试（按类型检查，已有则不再创建）
  const hasMidterm = existingScores.some((s) => s.type === 'midterm_exam')
  if (!hasMidterm) {
    for (const { student } of students) {
      if (!student) continue
      const id = `exam-${courseId.value}-${student.id}-期中考试-${Date.now()}`
      store.addExamScore({
        id,
        courseId: courseId.value,
        studentId: student.id,
        examName: '期中考试',
        score: 0,
        fullScore: 100,
        weight: 0,
        type: 'midterm_exam',
        status: 'draft',
        createdAt: now,
        gradedAt: '',
      })
    }
  }

  // 期末考试（按类型检查，已有则不再创建）
  const hasFinal = existingScores.some((s) => s.type === 'final_exam')
  if (!hasFinal) {
    for (const { student } of students) {
      if (!student) continue
      const id = `exam-${courseId.value}-${student.id}-期末考试-${Date.now()}`
      store.addExamScore({
        id,
        courseId: courseId.value,
        studentId: student.id,
        examName: '期末考试',
        score: 0,
        fullScore: 100,
        weight: 0,
        type: 'final_exam',
        status: 'draft',
        createdAt: now,
        gradedAt: '',
      })
    }
  }
}

function handleSaveExamScores() {
  if (!courseId.value || !selectedExam.value) return
  const existingScores = store.getExamScoresForCourse(courseId.value, selectedExam.value)
  const examType = existingScores.length > 0
    ? existingScores[0].type
    : 'midterm_exam'
  const examWeight = store.getExamWeight(courseId.value, selectedExam.value)
  // 弹窗打开时只保存当前班级的输入
  let inputsToSave = Object.entries(examInputs.value)
  if (selectedGradeClass.value) {
    const ids = currentGradeClassStudentIds.value
    inputsToSave = inputsToSave.filter(([sid]) => ids.has(sid))
  }
  inputsToSave.forEach(([studentId, score]) => {
    const existing = existingScores.find((s) => s.studentId === studentId)
    if (existing && existing.status !== 'submitted') {
      store.updateExamScore(existing.id, { score, gradedAt: getNow().toISOString().split('T')[0] })
    } else if (!existing) {
      const id = `exam-${courseId.value}-${studentId}-${selectedExam.value}-${Date.now()}`
      store.addExamScore({
        id,
        courseId: courseId.value,
        studentId,
        examName: selectedExam.value,
        score,
        fullScore: currentExamFullScore.value,
        weight: examWeight,
        type: examType,
        status: 'draft',
        createdAt: getNow().toISOString().split('T')[0],
        gradedAt: '',
      })
    }
  })
  // 只清除已保存的学生输入
  const savedIds = new Set(inputsToSave.map(([sid]) => sid))
  for (const sid of savedIds) {
    delete examInputs.value[sid]
  }

}

function handleSubmitExamScores() {
  if (!courseId.value || !selectedExam.value) return
  handleSaveExamScores()
  if (selectedGradeClass.value) {
    const ids = Array.from(currentGradeClassStudentIds.value)
    store.submitExamScores(courseId.value, selectedExam.value, ids.length > 0 ? ids : undefined)
  } else {
    store.submitExamScores(courseId.value, selectedExam.value)
  }

}

function getStudentTotalScore(studentId: string): string | number {
  if (!courseId.value) return '-'
  const scores = store.getExamScoresForCourse(courseId.value)
    .filter((s) => s.studentId === studentId && s.status === 'submitted')
  if (scores.length === 0) return '-'
  const gradeConfig = store.getGradeConfig(courseId.value)
  let weightedSum = 0
  let totalWeight = 0
  const typeGroups = new Map<string, { count: number; sumPercent: number }>()
  for (const s of scores) {
    const w = store.getExamWeight(courseId.value, s.examName)
    const percent = (s.score / s.fullScore) * 100
    if (w > 0) {
      weightedSum += percent * w
      totalWeight += w
    } else {
      if (!typeGroups.has(s.type)) typeGroups.set(s.type, { count: 0, sumPercent: 0 })
      const g = typeGroups.get(s.type)!
      g.count++
      g.sumPercent += percent
    }
  }
  for (const [type, g] of typeGroups) {
    let typeWeight = 0
    if (type === 'midterm_exam' || type === 'midterm_project') typeWeight = gradeConfig.midtermWeight
    else if (type === 'final_exam' || type === 'final_project') typeWeight = gradeConfig.finalWeight
    else typeWeight = gradeConfig.regularWeight
    if (typeWeight > 0 && g.count > 0) {
      const avgPercent = g.sumPercent / g.count
      weightedSum += avgPercent * typeWeight
      totalWeight += typeWeight
    }
  }
  if (totalWeight === 0) return '0'
  return Math.round(weightedSum / totalWeight)
}

function getStudentExamCount(studentId: string): number {
  if (!courseId.value) return 0
  return store.getExamScoresForCourse(courseId.value)
    .filter((s) => s.studentId === studentId).length
}

function getStudentAvgScore(studentId: string): string | number {
  if (!courseId.value) return '-'
  const allEvals = store.evaluations.filter(
    (e) => e.courseId === courseId.value && e.studentId === studentId
  )
  if (allEvals.length === 0) return '-'
  const maxSession = Math.max(...allEvals.map((e) => e.sessionNumber))
  const relevantEvals = allEvals.filter((e) => e.sessionNumber <= maxSession)
  const sum = relevantEvals.reduce((a, e) => a + e.score, 0)
  return Math.round(sum / relevantEvals.length)
}

function getStudentScoreForExam(studentId: string, examName: string): string | number {
  if (!courseId.value) return '-'
  const score = store.getExamScoresForCourse(courseId.value, examName)
    .find((s) => s.studentId === studentId && s.status === 'submitted')
  return score?.score ?? '-'
}

async function handleExcelImport(event: Event) {
  if (!courseId.value || !selectedExam.value) return
  const existingScores = store.getExamScoresForCourse(courseId.value, selectedExam.value)
  const examType = existingScores.length > 0
    ? existingScores[0].type
    : 'midterm_exam'
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  try {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws)
    const keys = Object.keys(data[0] || {})
    if (keys.length < 2) {
      alert('Excel 格式不正确，请确保第一列为学生姓名/学号，第二列为成绩')
      return
    }
    const nameKey = keys[0]
    const scoreKey = keys[1]
    let imported = 0
    const scores: any[] = []
    for (const row of data) {
      const name = String(row[nameKey] || '').trim().toLowerCase()
      const rawScore = parseFloat(String(row[scoreKey] || '').trim())
      if (isNaN(rawScore) || !name) continue
      const student = store.students.find(
        (s) => s.name.toLowerCase() === name || s.id.toLowerCase() === name
      )
      if (!student) continue
      const existing = existingScores.find((s) => s.studentId === student.id)
      const score = Math.min(currentExamFullScore.value, Math.max(0, rawScore))
      if (existing && existing.status !== 'submitted') {
        store.updateExamScore(existing.id, { score, gradedAt: getNow().toISOString().split('T')[0] })
      } else if (!existing) {
        const sid = `exam-${courseId.value}-${student.id}-${selectedExam.value}-${Date.now()}`
        store.addExamScore({
          id: sid,
          courseId: courseId.value,
          studentId: student.id,
          examName: selectedExam.value,
          score,
          fullScore: currentExamFullScore.value,
          weight: currentExamWeight.value,
          type: examType,
          status: 'draft',
          createdAt: getNow().toISOString().split('T')[0],
          gradedAt: '',
        })
        scores.push({ id: sid, courseId: courseId.value, studentId: student.id, examName: selectedExam.value, score, fullScore: currentExamFullScore.value, weight: currentExamWeight.value, type: examType })
      }
      imported++
    }
    // 同步到 MySQL
    if (scores.length > 0) {
      try { await fetch('http://localhost:3000/api/teaching/scores/bulk', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ scores }) }) } catch {}
    }
    alert(`导入成功！共导入 ${imported} 名学生的成绩`)
    input.value = ''
  } catch (err) {
    console.error('Excel 导入失败:', err)
    alert('Excel 导入失败，请检查文件格式')
    input.value = ''
  }
}

async function handleDownloadTemplate() {
  if (!courseId.value || !selectedExam.value) return
  const targetClass = downloadTemplateClass.value
  try {
    const XLSX = await import('xlsx')
    const data = enrolledStudents.value
      .filter(({ student }) => {
        if (targetClass === '__all__') return true
        return (student!.className || '') === targetClass
      })
      .map(({ student }) => {
        const row: Record<string, string | number> = {
          '学生姓名': student!.name,
          '学生学号': student!.id,
          '班级': student!.className || '',
          [selectedExam.value]: '',
        }
        return row
      })
    if (data.length === 0) {
      alert('所选班级暂无学生')
      return
    }
    const suffix = targetClass === '__all__' ? '全部班级' : targetClass
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedExam.value}-${suffix}-成绩模板.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    showDownloadTemplateModal.value = false
  } catch (err) {
    console.error('下载模板失败:', err)
    alert('下载模板失败')
  }
}

const enabledTypes = computed(() => baseEnabledTypes.value.filter((t) => {
  if ((t === 'intra_group' || t === 'inter_group') && !courseHasGroups.value) return false
  if (t === 'mentor' && !selectedConfig.value?.hasMentor) return false
  return true
}))

const filteredEvalTypes = computed(() => enabledTypes.value)

const displaySessions = computed(() => {
  const count = Math.min(totalSessions.value, 3)
  return Array.from({ length: count }, (_, i) => i + 1)
})

const enrolledStudents = computed(() => {
  if (!courseId.value) return []
  return store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => ({
      enrollmentId: e.id,
      student: store.students.find((s) => s.id === e.studentId),
    }))
    .filter((e) => e.student)
})

const studentSections = computed(() => {
  if (!courseId.value) return []
  const search = studentSearch.value.trim().toLowerCase()

  const enrolled = store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => ({
      enrollmentId: e.id,
      student: store.students.find((s) => s.id === e.studentId),
    }))
    .filter((e) => e.student) as { enrollmentId: string; student: NonNullable<ReturnType<typeof store.students.find>> }[]

  const filtered = search
    ? enrolled.filter(({ student }) => student.name.toLowerCase().includes(search) || student.id.includes(search))
    : enrolled

  const groups = store.studentGroups.filter((g) => g.courseId === courseId.value)
  const memberToGroup = new Map<string, string>()
  const groupIdMap = new Map<string, string>()
  for (const g of groups) {
    for (const mid of g.memberIds) {
      memberToGroup.set(mid, g.name)
      groupIdMap.set(mid, g.id)
    }
  }

  const groupedMap = new Map<string, { groupId: string; students: typeof filtered }>()
  const ungrouped: typeof filtered = []
  for (const item of filtered) {
    const groupName = memberToGroup.get(item.student.id)
    const groupId = groupIdMap.get(item.student.id) || ''
    if (groupName && groupId) {
      if (!groupedMap.has(groupName)) groupedMap.set(groupName, { groupId, students: [] })
      groupedMap.get(groupName)!.students.push(item)
    } else {
      ungrouped.push(item)
    }
  }

  const sections: { groupId: string; groupName: string; students: typeof filtered }[] = []
  for (const g of groups) {
    const entry = groupedMap.get(g.name)
    if (entry) {
      sections.push({ groupId: g.id, groupName: g.name, students: entry.students })
      groupedMap.delete(g.name)
    } else {
      sections.push({ groupId: g.id, groupName: g.name, students: [] })
    }
  }
  if (ungrouped.length > 0) {
    sections.push({ groupId: '', groupName: '未分组', students: ungrouped })
  }
  return sections
})

/** 当前课程的班级列表 */
const courseGroups = computed(() => {
  if (!courseId.value) return []
  return store.studentGroups.filter((g) => g.courseId === courseId.value)
})

// ====== 新版学生管理：班级板块 computed ======

/** 班级板块：按学生 className 分组 */
const classBlocks = computed(() => {
  if (!courseId.value) return []
  const classMap = new Map<string, typeof enrolledStudents.value>()
  for (const item of enrolledStudents.value) {
    if (!item.student) continue
    const cn = item.student.className || ''
    if (!classMap.has(cn)) classMap.set(cn, [])
    classMap.get(cn)!.push(item)
  }
  return Array.from(classMap.entries())
    .map(([className, items]) => ({
      className,
      students: items.map(i => i.student!).filter(Boolean),
    }))
    .sort((a, b) => a.className.localeCompare(b.className, 'zh-CN'))
})

/** 获取某班级的分组（检查组内所有学生 className 是否匹配） */
function getGroupsForClassBlock(className: string) {
  if (!courseId.value) return []
  const allGroups = store.studentGroups.filter((g) => g.courseId === courseId.value)
  return allGroups.filter((g) => {
    if (g.memberIds.length === 0) return false
    // 检查组中所有成员是否都属于该班级
    return g.memberIds.every((sid) => {
      const student = store.students.find((s) => s.id === sid)
      return student && (student.className || '') === className
    })
  })
}

/** 获取某班级的学生人数 */
function getClassStudentCount(className: string) {
  return getClassStudents(className).length
}

/** 获取某班级的学生列表 */
function getClassStudents(className: string) {
  return store.students.filter((s) => (s.className || '') === className && store.enrollments.some((e) => e.courseId === courseId.value && e.studentId === s.id && e.status !== 'dropped'))
}

/** 点击班级内的"新建分组" */
function openNewGroupForClass(className: string) {
  groupFormClassName.value = className
  // 自动建议该班级的下一个组号
  const existingGroups = getGroupsForClassBlock(className)
  const nextNum = existingGroups.length + 1
  groupFormName.value = `第${nextNum}组`
  groupFormMembers.value = []
  editingGroup.value = null
  showGroupModal.value = true
}

/** 从班级内部打开一键分组弹窗 */
function showOneClickGroupForClass(className: string) {
  oneClickGroupData.value = {
    className,
    groupCount: Math.max(2, Math.ceil(getClassStudentCount(className) / 3)),
  }
  showOneClickGroup.value = true
}

/** 切换分组表单中成员勾选 */
function toggleGroupFormMember(studentId: string) {
  const idx = groupFormMembers.value.indexOf(studentId)
  if (idx >= 0) {
    groupFormMembers.value.splice(idx, 1)
  } else {
    groupFormMembers.value.push(studentId)
  }
}

/** 一键随机分组 */
function handleOneClickGroup() {
  const className = oneClickGroupData.value.className
  const groupCount = oneClickGroupData.value.groupCount
  if (!className || !groupCount || groupCount < 2) return
  const students = getClassStudents(className)
  if (students.length === 0) { alert('该班级暂无学生'); return }
  if (groupCount > students.length) {
    alert(`总组数（${groupCount}）不能超过该班级人数（${students.length}）`)
    return
  }

  // 打乱学生数组（Fisher-Yates）
  const shuffled = [...students]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 先删除该班级现有的所有分组
  const existingGroups = getGroupsForClassBlock(className)
  for (const g of existingGroups) {
    store.deleteStudentGroup(g.id)
  }

  // 按组数平均分配
  const perGroup = Math.ceil(shuffled.length / groupCount)
  let created = 0
  for (let g = 0; g < groupCount; g++) {
    const chunk = shuffled.slice(g * perGroup, (g + 1) * perGroup)
    if (chunk.length === 0) continue
    store.addStudentGroup({
      id: `group-${courseId.value}-${Date.now()}-${g}`,
      courseId: courseId.value!,
      name: `第${g + 1}组`,
      memberIds: chunk.map((s) => s.id),
    })
    created++
  }
  showOneClickGroup.value = false
  oneClickGroupData.value = { className: '', groupCount: 2 }
  alert(`已成功分为 ${created} 组（共 ${shuffled.length} 名学生）`)
}

/** 未分班的学生 */
const ungroupedStudents = computed(() => {
  const allGroupMemberIds = new Set<string>()
  for (const g of courseGroups.value) {
    for (const mid of g.memberIds) allGroupMemberIds.add(mid)
  }
  return enrolledStudents.value.filter(({ student }) => student && !allGroupMemberIds.has(student.id))
})

/** 选中的班级名称 */
const selectedGroupName = computed(() => {
  if (selectedGroupId.value === '__ungrouped__') return '未分班学生'
  const group = store.studentGroups.find((g) => g.id === selectedGroupId.value)
  return group?.name || ''
})

/** 选中班级的学生列表 */
const selectedGroupStudents = computed(() => {
  if (selectedGroupId.value === '__ungrouped__') return ungroupedStudents.value
  const group = store.studentGroups.find((g) => g.id === selectedGroupId.value)
  if (!group) return []
  const memberSet = new Set(group.memberIds)
  return enrolledStudents.value.filter(({ student }) => student && memberSet.has(student.id))
})

/** 搜索过滤后的选中班级学生 */
const filteredSelectedGroupStudents = computed(() => {
  const search = studentSearch.value.trim().toLowerCase()
  if (!search) return selectedGroupStudents.value
  return selectedGroupStudents.value.filter(({ student }) =>
    student && (student.name.toLowerCase().includes(search) || student.id.toLowerCase().includes(search))
  )
})

// ---- 评价数据 ----
function getStudentEvals(studentId: string, sessionNumber?: number, type?: EvalType): Evaluation[] {
  return store.evaluations.filter((e) => {
    if (e.courseId !== courseId.value || e.studentId !== studentId) return false
    if (sessionNumber && e.sessionNumber !== sessionNumber) return false
    if (type && e.type !== type) return false
    return true
  })
}

function getStudentEvalCount(studentId: string): number {
  return store.evaluations.filter((e) => e.courseId === courseId.value && e.studentId === studentId && e.type === 'self').length
}

function getAvgScore(studentId: string, sessionNumber: number, type: EvalType): number | null {
  const evals = getStudentEvals(studentId, sessionNumber, type)
  if (evals.length === 0) return null
  return Math.round(evals.reduce((a, e) => a + e.score, 0) / evals.length)
}

function getScoreDisplay(studentId: string, sessionNumber: number, type: EvalType): string {
  const v = getAvgScore(studentId, sessionNumber, type)
  return v !== null ? `${v}分` : '-'
}

function scoreCellClass(studentId: string, sessionNumber: number, type: EvalType): string {
  const v = getAvgScore(studentId, sessionNumber, type)
  if (v === null) return 'text-gray-400/60'
  if (v >= 85) return 'text-emerald-600 font-medium'
  if (v >= 60) return 'text-blue-600'
  return 'text-red-500'
}

function getStudentTotalAvg(studentId: string): string {
  let total = 0; let count = 0
  displaySessions.value.forEach((s) => {
    filteredEvalTypes.value.forEach((t) => {
      const v = getAvgScore(studentId, s, t)
      if (v !== null) { total += v; count++ }
    })
  })
  return count > 0 ? `${Math.round(total / count)}分` : '-'
}

function totalScoreColor(val: string | number): string {
  if (val === '-') return '#9ca3af'
  const n = parseInt(String(val))
  if (n >= 85) return '#22c55e'
  if (n >= 60) return '#3b82f6'
  return '#ef4444'
}

function getEnrollStatus(studentId: string): { label: string; color: string; progress: number } {
  const enr = store.enrollments.find((e) => e.courseId === courseId.value && e.studentId === studentId)
  if (!enr) return { label: '未知', color: 'bg-brand-400/10 text-gray-400', progress: 0 }
  const map: Record<string, { label: string; color: string }> = {
    enrolled:     { label: '已报名',    color: 'bg-brand-600/10 text-gray-600' },
    in_progress:  { label: '学习中',    color: 'bg-brand-400/10 text-gray-600' },
    completed:    { label: '已完成',    color: 'bg-brand-400/10 text-gray-600' },
    dropped:      { label: '已退课',    color: 'bg-brand-600/10 text-gray-600' },
  }
  return { ...map[enr.status] || { label: '未知', color: 'bg-brand-400/10 text-gray-400' }, progress: enr.progress || 0 }
}

const handleSetConfig = (updates: Partial<import('@/types').EvaluationConfig>) => {
  if (!courseId.value) return
  const existing = store.evalConfigs.find((c) => c.courseId === courseId.value)
  const config = {
    courseId: courseId.value,
    template: existing?.template || 'standard',
    frequency: existing?.frequency || 'biweekly',
    hasMentor: existing?.hasMentor ?? false,
    overdueRule: existing?.overdueRule || 'average',
    ...existing,
    ...updates,
  }
  store.setEvalConfig(config)
  store.markConfigCompleted(courseId.value, 'evalConfig')
}

const handleBatchEval = (level: string) => {
  if (!courseId.value) return
  const range = LEVEL_OPTIONS.find((o) => o.label === level)?.range
  if (!range) return
  const score = Math.round((range[0] + range[1]) / 2)
  const session = selectedBatchSession.value
  const type: EvalType = isMentor.value ? 'mentor' : 'teacher'

  selectedStudentIds.value.forEach((studentId) => {
    if (store.isSessionLocked(courseId.value || '', session) ||
        store.isTeacherEvalSubmitted(courseId.value || '', studentId, session, type)) return
    const existing = store.evaluations.find(
      (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === type && e.sessionNumber === session
    )
    const ev: Evaluation = {
      id: existing ? existing.id : `ev-batch-${Date.now()}-${studentId}-${type}`,
      courseId: courseId.value,
      studentId,
      sessionNumber: session,
      type,
      score,
      evaluatorId: store.currentUser || '',
      evaluatorName: store.currentUser || (isMentor.value ? '企业导师' : '教师'),
      comment: level,
      createdAt: getNow().toISOString().split('T')[0],
    }
    if (existing) {
      store.updateEvaluation(ev.id, { score, comment: level, createdAt: ev.createdAt })
    } else {
      store.addEvaluation(ev)
    }
  })
  evalScoreInputs.value = {}
  store.markSessionEvalRemindersCompleted(courseId.value, session)
  // 保存后同步评价到详细成绩（实时更新总分）
  store.syncEvalToDetailedGrade(courseId.value)
}

function handleSaveEvalScores() {
  if (!courseId.value) return
  const session = selectedBatchSession.value
  const type: EvalType = isMentor.value ? 'mentor' : 'teacher'
  Object.entries(evalScoreInputs.value).forEach(([studentId, score]) => {
    if (store.isSessionLocked(courseId.value || '', session) ||
        store.isTeacherEvalSubmitted(courseId.value || '', studentId, session, type)) return
    const existing = store.evaluations.find(
      (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === type && e.sessionNumber === session
    )
    const ev: Evaluation = {
      id: existing ? existing.id : `ev-manual-${Date.now()}-${studentId}-${type}`,
      courseId: courseId.value,
      studentId,
      sessionNumber: session,
      type,
      score,
      evaluatorId: store.currentUser || '',
      evaluatorName: store.currentUser || (isMentor.value ? '企业导师' : '教师'),
      createdAt: getNow().toISOString().split('T')[0],
    }
    if (existing) {
      store.updateEvaluation(ev.id, { score, createdAt: ev.createdAt })
    } else {
      store.addEvaluation(ev)
    }
  })
  evalScoreInputs.value = {}
  // 保存后同步评价到详细成绩（实时更新总分）
  if (courseId.value) {
    store.syncEvalToDetailedGrade(courseId.value)
  }
}

function handleSubmitAll() {
  if (!courseId.value) return
  const session = selectedBatchSession.value
  const type: EvalType = isMentor.value ? 'mentor' : 'teacher'

  // 1. 先保存所有待处理的输入
  handleSaveEvalScores()

  // 2. 只提交当前弹窗班级中有草稿评价的学生
  const section = currentEvalClassSection.value
  if (!section) return

  let count = 0
  for (const group of section.groups) {
    for (const s of group.students) {
      if (s.submitted) continue
      const hasEval = store.evaluations.some(
        (e) => e.courseId === courseId.value && e.studentId === s.student.id && e.type === type && e.sessionNumber === session
      )
      if (hasEval) {
        store.submitTeacherEval(courseId.value, s.student.id, session, type)
        count++
      }
    }
  }

  store.markSessionEvalRemindersCompleted(courseId.value, session)
  // 提交后同步评价到详细成绩
  store.syncEvalToDetailedGrade(courseId.value)
}

function toggleGroup(gi: number) {
  const group = currentEvalClassSection.value?.groups[gi]
  if (!group) return
  const all = group.students.filter(s => !s.submitted).map(s => s.student.id)
  if (isGroupSelected(gi)) {
    selectedStudentIds.value = selectedStudentIds.value.filter(id => !all.includes(id))
  } else {
    for (const id of all) {
      if (!selectedStudentIds.value.includes(id)) {
        selectedStudentIds.value = [...selectedStudentIds.value, id]
      }
    }
  }
}

function toggleAllClass() {
  const all = currentEvalClassSection.value
    ? currentEvalClassSection.value.groups.flatMap(g => g.students).filter(s => !s.submitted).map(s => s.student.id)
    : []
  if (isAllClassSelected.value) {
    selectedStudentIds.value = selectedStudentIds.value.filter(id => !all.includes(id))
  } else {
    for (const id of all) {
      if (!selectedStudentIds.value.includes(id)) {
        selectedStudentIds.value = [...selectedStudentIds.value, id]
      }
    }
  }
}

function closeEvalPopup() {
  showEvalPopup.value = false
  selectedEvalClass.value = ''
  selectedStudentIds.value = []
  evalScoreInputs.value = {}
}

function closeGradePopup() {
  showGradePopup.value = false
  selectedGradeClass.value = ''
  gradePopupSearch.value = ''
}

const selectedUnsubmittedCount = computed(() => {
  const selected = selectedStudentIds.value
  if (selectedEvalClass.value) {
    const section = currentEvalClassSection.value
    if (!section) return 0
    const allUnsubmitted = section.groups.flatMap(g => g.students).filter(s => !s.submitted).map(s => s.student.id)
    return selected.filter(id => allUnsubmitted.includes(id)).length
  }
  return selected.filter(id => {
    const found = evalTableSections.value.some(cb => cb.groups.some(g => g.students.some(s => s.student.id === id && !s.submitted)))
    return found
  }).length
})

function handleSessionSelect(session: number) {
  if (!courseId.value) return
  store.autoLockPreviousSession(courseId.value, session)
  selectedBatchSession.value = session

}

function isSessionDisabled(session: number): boolean {
  if (!courseId.value) return true
  if (store.isSessionLocked(courseId.value, session)) return true
  if (!store.isSessionTime(courseId.value, session)) return true
  if (session === totalSessions.value && isFinalSessionExpired.value) return true
  return false
}

function isSessionTime(session: number): boolean {
  if (!courseId.value) return true
  return store.isSessionTime(courseId.value, session)
}

const isFinalSessionExpired = computed(() => {
  if (!courseId.value) return false
  return store.isFinalSessionDeadlinePassed(courseId.value, totalSessions.value)
})

// 过滤下拉联动：切换班级时重置分组选择
watch(evalFilterClass, () => { evalFilterGroup.value = '' })
watch(gradeFilterClass, () => { gradeFilterGroup.value = '' })

// 弹窗打开时，从已保存评价预填评分输入框，方便修改
watch(showEvalPopup, (show) => {
  if (show && courseId.value && selectedEvalClass.value) {
    prefillEvalInputs()
  }
  if (!show) {
    evalScoreInputs.value = {}
  }
})

function prefillEvalInputs() {
  const section = currentEvalClassSection.value
  if (!section || !courseId.value) return
  const session = selectedBatchSession.value
  const type: EvalType = isMentor.value ? 'mentor' : 'teacher'
  const inputs: Record<string, number> = {}
  for (const group of section.groups) {
    for (const s of group.students) {
      const ev = store.evaluations.find(
        (e) => e.courseId === courseId.value && e.studentId === s.student.id &&
              e.type === type && e.sessionNumber === session
      )
      if (ev) {
        inputs[s.student.id] = ev.score
      }
    }
  }
  evalScoreInputs.value = inputs
}

function getSessionTitle(session: number): string {
  if (!courseId.value) return ''
  if (store.isSessionLocked(courseId.value, session)) return '该轮次已锁定，不可修改'
  if (!store.isSessionTime(courseId.value, session)) return session === 1 ? '第一节课尚未开始' : '该轮次尚未到开启时间'
  if (session === totalSessions.value && isFinalSessionExpired.value) return '课程已结束，最终评价已截止'
  return ''
}

const hasSubmittable = computed(() => submittableCount.value > 0)

const submittableCount = computed(() => {
  // 当前弹窗班级中，有草稿（已保存但未提交）或未提交输入的未提交学生数量
  if (selectedEvalClass.value) {
    const section = currentEvalClassSection.value
    if (!section) return 0
    return section.groups.reduce((a, g) => a + g.students.filter(s => {
      if (s.submitted) return false
      if (evalScoreInputs.value[s.student.id] !== undefined) return true
      return s.hasDraft
    }).length, 0)
  }
  return evalTableSections.value.reduce((a, cb) => a + cb.groups.reduce((b, g) => b + g.students.filter(s => {
    if (s.submitted) return false
    if (evalScoreInputs.value[s.student.id] !== undefined) return true
    return s.hasDraft
  }).length, 0), 0)
})

const handleProcessOverdue = () => {
  if (!courseId.value) return
  for (let s = 1; s <= totalSessions.value; s++) {
    store.processSessionOverdue(courseId.value, s)
  }
  const students = enrolledStudents.value.map(({ student }) => student).filter(Boolean)
  for (const s of students) {
    for (let sn = 1; sn <= totalSessions.value; sn++) {
      store.markEvalReminderCompleted(courseId.value, s!.id, sn)
    }
  }

}

function getStudentName(studentId: string): string {
  const student = store.students.find((s) => s.id === studentId)
  return student?.name || studentId
}

function getStudentGroupId(studentId: string): string | null {
  for (const g of store.studentGroups) {
    if (g.memberIds.includes(studentId)) return g.id
  }
  return null
}

function handleRemoveStudentFromGroup(studentId: string) {
  for (const g of store.studentGroups) {
    if (g.memberIds.includes(studentId)) {
      store.updateStudentGroup(g.id, {
        memberIds: g.memberIds.filter((id) => id !== studentId),
      })
      break
    }
  }

}

function handleEditStudent(student: import('@/types').Student) {
  editingStudent.value = student
  editStudentName.value = student.name
  editStudentIdField.value = student.id
  editStudentClass.value = student.className || ''
  const group = store.studentGroups.find(g => g.courseId === courseId.value && g.memberIds.includes(student.id))
  editStudentGroupId.value = group?.id || ''
  showEditStudentModal.value = true

}

function handleSaveEditStudent() {
  if (!editingStudent.value || !editStudentName.value.trim()) return
  const student = editingStudent.value
  const newId = editStudentIdField.value.trim() || student.id
  if (newId !== student.id && store.students.some((s) => s.id === newId)) {
    alert('该学号已被其他学生使用')
    return
  }
  const oldId = student.id
  store.updateStudent(oldId, { name: editStudentName.value.trim(), id: newId, className: editStudentClass.value || '' })

  if (newId !== oldId) {
    store.enrollments.forEach((e) => {
      if (e.studentId === oldId) {
        store.updateEnrollment(e.id, { studentId: newId })
      }
    })
    store.evaluations.forEach((ev) => {
      if (ev.studentId === oldId) {
        store.updateEvaluation(ev.id, { studentId: newId })
      }
      if (ev.evaluatorId === oldId) {
        store.updateEvaluation(ev.id, { evaluatorId: newId })
      }
    })
    const examScores = (store as any).examScores?.value || []
    examScores.forEach((s: any) => {
      if (s.studentId === oldId) {
        ;(store as any).examScores.value = examScores.map((es: any) =>
          es.id === s.id ? { ...es, studentId: newId } : es
        )
      }
    })
    const evalReminders = (store as any).evalReminders?.value || []
    ;(store as any).evalReminders.value = evalReminders.map((r: any) => {
      if (r.studentId === oldId) return { ...r, studentId: newId }
      return r
    })
    store.studentGroups.forEach((g) => {
      if (g.memberIds.includes(oldId)) {
        store.updateStudentGroup(g.id, {
          memberIds: g.memberIds.map((id) => (id === oldId ? newId : id)),
        })
      }
    })
    try {
      localStorage.setItem('examScores', JSON.stringify((store as any).examScores?.value || []))
      localStorage.setItem('evalReminders', JSON.stringify((store as any).evalReminders?.value || []))
    } catch {}
  }

  const currentGroup = store.studentGroups.find(g => g.courseId === courseId.value && g.memberIds.includes(newId))
  const currentGroupId = currentGroup?.id || ''
  if (currentGroupId !== editStudentGroupId.value) {
    if (currentGroupId) {
      store.updateStudentGroup(currentGroupId, {
        memberIds: currentGroup!.memberIds.filter((id) => id !== newId),
      })
    }
    if (editStudentGroupId.value) {
      const newGroup = store.studentGroups.find((g) => g.id === editStudentGroupId.value)
      if (newGroup) {
        store.updateStudentGroup(newGroup.id, {
          memberIds: [...newGroup.memberIds, newId],
        })
      }
    }
  }

  showEditStudentModal.value = false
  editingStudent.value = null
  editStudentName.value = ''
  editStudentIdField.value = ''
  editStudentGroupId.value = ''

}

function handleRemoveStudent(studentId: string) {
  if (!courseId.value) return
  if (!confirm('确定将该学生删除并从课程中移除？')) return
  handleRemoveStudentFromGroup(studentId)
  const enrollment = store.enrollments.find(
    (e) => e.courseId === courseId.value && e.studentId === studentId && e.status !== 'dropped'
  )
  if (enrollment) {
    store.deleteEnrollment(enrollment.id)
  }

}

async function handleImportStudentsExcel(event: Event) {
  if (!courseId.value) return
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  try {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws)
    const keys = Object.keys(data[0] || {})
    if (keys.length < 1) {
      alert('Excel 格式不正确，请确保第一列为学生姓名')
      return
    }
    const nameKey = keys[0]
    const idKey = keys.length >= 2 ? keys[1] : null
    let imported = 0
    const enrollments: any[] = []
    for (const row of data) {
      const name = String(row[nameKey] || '').trim()
      if (!name) continue
      const rawId = idKey ? String(row[idKey] || '').trim() : ''
      let student = rawId
        ? store.students.find((s) => s.id === rawId || s.name === name)
        : store.students.find((s) => s.name === name)
      if (!student) {
        const id = rawId || `stu-${Date.now()}-${imported}`
        store.addStudent({ id, name, phone: '', email: '', avatar: '', joinDate: getNow().toISOString().split('T')[0], status: 'active' })
        student = store.students.find((s) => s.id === id)!
      }
      const exists = store.enrollments.some(
        (e) => e.courseId === courseId.value && e.studentId === student!.id && e.status !== 'dropped'
      )
      if (exists) continue
      const enrId = `enr-${courseId.value}-${student!.id}-${Date.now()}-${imported}`
      store.addEnrollment({
        id: enrId,
        courseId: courseId.value,
        studentId: student!.id,
        scheduleId: '',
        status: 'enrolled',
        progress: 0,
        enrollDate: getNow().toISOString().split('T')[0],
      })
      enrollments.push({ id: enrId, studentId: student!.id, courseId: courseId.value })
      imported++
    }
    // 同步到 MySQL
    if (enrollments.length > 0) {
      try { await fetch('http://localhost:3000/api/teaching/enrollments/bulk', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ enrollments }) }) } catch {}
    }
    alert(`导入成功！共导入 ${imported} 名学生`)
  } catch (err) {
    console.error('Excel 导入失败:', err)
    alert('Excel 导入失败，请检查文件格式')
  }
  input.value = ''
}

function openNewGroupModal() {
  editingGroup.value = null
  groupFormName.value = ''
  groupFormMembers.value = []
  groupFormClassName.value = ''
  showGroupModal.value = true
}

function openEditGroupModal(group: import('@/types').StudentGroup) {
  editingGroup.value = group
  groupFormName.value = group.name
  groupFormMembers.value = [...group.memberIds]
  // 从成员推断所属班级
  if (group.memberIds.length > 0) {
    const firstMember = store.students.find(s => s.id === group.memberIds[0])
    groupFormClassName.value = firstMember?.className || ''
  } else {
    groupFormClassName.value = ''
  }
  showGroupModal.value = true
}

function handleSaveGroup() {
  if (!courseId.value || !groupFormName.value.trim()) {
    alert('请输入组名')
    return
  }
  const name = groupFormName.value.trim()
  if (editingGroup.value) {
    store.updateStudentGroup(editingGroup.value.id, {
      name,
      memberIds: groupFormMembers.value,
    })
  } else {
    store.addStudentGroup({
      id: `group-${courseId.value}-${Date.now()}`,
      courseId: courseId.value,
      name,
      memberIds: groupFormMembers.value,
    })
  }
  showGroupModal.value = false
  editingGroup.value = null
  groupFormName.value = ''
  groupFormMembers.value = []

}

function handleDeleteGroup(groupId: string) {
  if (!confirm('确定删除该分组？')) return
  store.deleteStudentGroup(groupId)

}

async function handleImportGroupsExcel(event: Event) {
  if (!courseId.value) return
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  try {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws)
    const keys = Object.keys(data[0] || {})
    if (keys.length < 2) {
      alert('Excel 格式不正确，请确保第一列为组名，第二列及之后为学生姓名/学号')
      return
    }
    const groupNameKey = keys[0]
    const groupMap = new Map<string, string[]>()

    // 如果是从班级内导入，只允许该班级的学生入组
    const targetClassName = classNameForImport.value
    const classStudentIds = targetClassName ? new Set(
      enrolledStudents.value
        .filter(e => e.student!.className === targetClassName)
        .map(e => e.student!.id)
    ) : null

    for (const row of data) {
      const groupName = String(row[groupNameKey] || '').trim()
      if (!groupName) continue
      for (let i = 1; i < keys.length; i++) {
        const studentRef = String(row[keys[i]] || '').trim()
        if (!studentRef) continue
        if (!groupMap.has(groupName)) groupMap.set(groupName, [])
        const student = store.students.find(
          (s) => s.name === studentRef || s.id === studentRef
        )
        if (student) {
          // 如果指定了目标班级，只导入该班级的学生
          if (classStudentIds && !classStudentIds.has(student.id)) continue
          groupMap.get(groupName)!.push(student.id)
        }
      }
    }
    let imported = 0
    const groups: any[] = []
    for (const [name, memberIds] of groupMap) {
      const existing = store.studentGroups.find(
        (g) => g.courseId === courseId.value && g.name === name
      )
      if (existing) {
        const merged = Array.from(new Set([...existing.memberIds, ...memberIds]))
        store.updateStudentGroup(existing.id, { memberIds: merged })
      } else {
        const gid = `group-${courseId.value}-${Date.now()}-${imported}`
        store.addStudentGroup({
          id: gid,
          courseId: courseId.value,
          name,
          memberIds: Array.from(new Set(memberIds)),
        })
        groups.push({ id: gid, courseId: courseId.value, name, memberIds: Array.from(new Set(memberIds)) })
      }
      imported++
    }
    // 同步到 MySQL
    if (groups.length > 0) {
      try { await fetch('http://localhost:3000/api/teaching/groups/bulk', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ groups }) }) } catch {}
    }
    alert(`导入成功！共导入 ${imported} 个分组`)
  } catch (err) {
    console.error('Excel 导入失败:', err)
    alert('Excel 导入失败，请检查文件格式')
  }
  input.value = ''
}

</script>
