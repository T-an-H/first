<template>
  <div id="student-course-learn-root"></div>


    <!-- 已结束只读提示 -->
    <div v-if="isReadOnly" class="flex items-center gap-2 px-4 py-3 bg-brand-400/5 border border-brand-400/30 rounded-xl text-sm text-gray-400">
      <Eye class="w-4 h-4 text-gray-400" />
      <span>该课程已结束，当前为<strong>只读查看</strong>模式</span>
    </div>

    <div class="flex gap-1 bg-brand-400/10 p-1 rounded-xl overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-800'}`">
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3">
        <div class="bg-white rounded-xl border border-brand-400/20 shadow-sm p-6">
          <!-- ===== AI 分层 ===== -->
          <div v-if="activeTab === 'ai_tier'" class="space-y-6">
            <!-- 未到开始条件 -->
            <div v-if="!firstClassEnded" class="bg-brand-50 border border-brand-200 rounded-xl p-8 text-center">
              <Layers class="w-12 h-12 mx-auto mb-3 text-brand-400" />
              <h3 class="text-lg font-semibold text-brand-800 mb-2">AI 分层测试</h3>
              <p class="text-sm text-brand-700">第一节课尚未结束，AI 分层测试将在第一节课结束后开启</p>
              <p class="text-xs text-brand-400 mt-1">届时将根据第一节课内容生成 10 道测试题，依据得分判定学习层级</p>
            </div>

            <!-- 测试窗口期（第一节课后～第二节课前） -->
            <div v-else-if="firstClassEnded && !secondClassStarted && !tierFinalized" class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 text-center">
              <Sparkles class="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <h3 class="text-lg font-semibold text-blue-800 mb-2">AI 分层测试已开放</h3>
              <p class="text-sm text-blue-600 mb-2">完成 10 道测试题（单选+判断），系统将根据得分判定你的学习层级</p>
              <p class="text-xs text-brand-600 mb-6">⚠ 测试窗口：第一节课结束后 ~ 第二节课开始前，逾期将自动分配到基础层</p>
              <button @click="openAITest"
                class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/25 inline-flex items-center gap-2">
                <HelpCircle class="w-5 h-5" />
                开始 AI 分层测试
              </button>
            </div>

            <!-- 已分层 / 逾期自动分配 → 永久锁定展示 -->
            <div v-else>
              <!-- 当前层级 -->
              <div>
                <h3 class="text-sm font-semibold text-gray-800 mb-3">AI 学习层级评估</h3>
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <p class="text-xs text-gray-400 mb-1">当前学习层级</p>
                      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                        :class="tierBadgeClass">
                        <Layers class="w-4 h-4" />
                        {{ tierLabel }}
                        <span v-if="isAutoAssigned" class="text-[10px] opacity-75">(自动分配)</span>
                      </span>
                      <span class="ml-2 text-[10px] text-gray-400">已锁定 · 该学期不可修改</span>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-gray-400">分层测试得分</p>
                      <p class="text-2xl font-bold text-blue-600">{{ isAutoAssigned ? '—' : myTierScore }}</p>
                      <p class="text-xs text-gray-400">{{ isAutoAssigned ? '未参加测试' : `/ ${totalQuestions * 10}分` }}</p>
                    </div>
                  </div>

                  <!-- 锁定提示 -->
                  <div class="mt-3 flex items-center gap-2 px-3 py-2 bg-brand-400/10/80 rounded-lg text-xs text-gray-400">
                    <Lock class="w-3.5 h-3.5" />
                    <span v-if="isAutoAssigned">AI 分层测试窗口已关闭，未完成测试，系统已自动分配层级。本学期不可更改，后续任务、资源、作业将根据 {{ tierLabel }} 进行适配</span>
                    <span v-else>AI 分层结果已锁定，本学期不可更改。后续任务、资源、作业将根据 {{ tierLabel }} 进行适配</span>
                  </div>
                </div>
              </div>

              <!-- AI 学习建议 -->
              <div>
                <h3 class="text-sm font-semibold text-gray-800 mb-3">AI 学习建议</h3>
                <div class="space-y-3">
                  <div v-for="(tip, i) in aiTips" :key="i"
                    class="flex items-start gap-3 p-3 rounded-lg border border-brand-400/20 bg-brand-400/5">
                    <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-xs font-bold text-blue-600">{{ i + 1 }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ tip.title }}</p>
                      <p class="text-xs text-gray-400 mt-0.5">{{ tip.desc }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI 分层测试弹窗 -->
          <Modal :is-open="aiTestOpen" :on-close="closeAITest"
            title="AI 分层测试" max-width="max-w-2xl">
            <template v-if="!testSubmitted">
              <div class="space-y-6">
                <!-- 进度 -->
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-400">已答 {{ answeredCount }}/{{ totalQuestions }} 题</span>
                  <span class="text-xs text-gray-400">每题 10 分，满分 {{ totalQuestions * 10 }} 分</span>
                </div>
                <div class="w-full h-1.5 bg-brand-400/10 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full transition-all"
                    :style="{ width: (answeredCount / totalQuestions * 100) + '%' }" />
                </div>

                <!-- 题目列表 -->
                <div v-for="(q, i) in testQuestions" :key="q.id"
                  class="p-4 rounded-lg border"
                  :class="testAnswers[q.id] !== undefined ? 'border-blue-200 bg-blue-50/30' : 'border-brand-400/20'">
                  <p class="text-sm font-medium text-gray-900 mb-3">
                    <span class="text-blue-600 font-bold">{{ i + 1 }}.</span>
                    {{ q.question }}
                    <span class="ml-1 text-[10px] text-gray-400">({{ q.type === 'true_false' ? '判断题' : '单选题' }})</span>
                  </p>
                  <div class="space-y-1.5">
                    <button v-for="(opt, oi) in q.options" :key="oi"
                      @click="selectAnswer(q.id, q.type === 'true_false' ? (oi === 0) : oi)"
                      class="w-full text-left px-3 py-2 rounded-lg text-sm border transition-all"
                      :class="testAnswers[q.id] === (q.type === 'true_false' ? (oi === 0) : oi)
                        ? 'border-blue-400 bg-blue-100 text-blue-700 font-medium'
                        : 'border-brand-400/30 hover:border-brand-400/60 text-gray-800'">
                      {{ opt }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between mt-6 pt-4 border-t border-brand-400/20">
                <span v-if="!allAnswered" class="text-xs text-brand-600">请完成所有题目后再提交</span>
                <span v-else class="text-xs text-emerald-500">所有题目已作答</span>
                <button @click="submitAITest" :disabled="!allAnswered"
                  class="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="allAnswered ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-brand-400/10 text-gray-400 cursor-not-allowed'">
                  提交并判定层级
                </button>
              </div>
            </template>

            <!-- 结果展示 -->
            <template v-else>
              <div class="text-center py-6 space-y-4">
                <div class="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                  :class="testScore >= 80 ? 'bg-emerald-100' : testScore >= 60 ? 'bg-blue-100' : 'bg-brand-50'">
                  <Award class="w-10 h-10" :class="testScore >= 80 ? 'text-emerald-500' : testScore >= 60 ? 'text-blue-500' : 'text-brand-600'" />
                </div>
                <div>
                  <p class="text-4xl font-bold text-gray-900">{{ testScore }}<span class="text-lg text-gray-400">/{{ totalQuestions * 10 }}</span></p>
                  <p class="text-sm text-gray-400 mt-1">得分</p>
                </div>
                <div>
                  <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-bold"
                    :class="tierBadgeClass">
                    <Layers class="w-5 h-5" />
                    {{ store.determineTier(testScore) === 'excellent' ? '卓越层' : store.determineTier(testScore) === 'advanced' ? '进阶层' : '基础层' }}
                  </span>
                </div>
                <p class="text-xs text-gray-400">本次分层结果已在系统中锁定，本学期不可修改</p>
                <button @click="closeAITest"
                  class="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2">
                  <CheckCircle class="w-4 h-4" />
                  确认并查看
                </button>
              </div>
            </template>
          </Modal>

          <!-- ===== 任务 ===== -->
          <div v-if="activeTab === 'tasks'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-800">课程任务</h3>
              <span class="text-xs text-gray-400">完成教师布置的任务并上传成果，教师/导师评分</span>
            </div>
            <div class="space-y-2">
              <div v-for="task in courseTasks" :key="task.id" @click="openStudentTask(task)"
                class="flex items-center justify-between p-3 rounded-lg border border-brand-400/20 hover:bg-brand-400/5 cursor-pointer transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <CheckCircle v-if="myTaskScore(task.id) !== undefined" class="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <Circle v-else class="w-5 h-5 text-gray-400/60 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ task.title }}</p>
                    <p v-if="task.description" class="text-xs text-gray-400 mt-0.5 truncate">{{ task.description }}</p>
                    <p v-else class="text-xs text-gray-300 mt-0.5">暂无介绍</p>
                  </div>
                </div>
                <span v-if="myTaskScore(task.id) !== undefined" class="text-sm font-bold text-blue-600 flex-shrink-0">{{ myTaskScore(task.id) }}分</span>
                <span v-else-if="hasSubmittedTask(task.id)" class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex-shrink-0">已提交 · 待评分</span>
                <span v-else class="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200 flex-shrink-0">未提交</span>
              </div>
              <div v-if="courseTasks.length === 0" class="text-center py-8 text-gray-400">教师暂未布置任务</div>
            </div>
          </div>

          <!-- ===== 任务详情弹窗：学生提交资料 + 查看评分 ===== -->
          <Teleport to="body">
            <div v-if="showStudentTaskModal && selectedStudentTask" class="fixed inset-0 z-50 flex items-center justify-center">
              <div class="absolute inset-0 bg-black/40" @click="closeStudentTask" />
              <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto p-6">
                <!-- 头部：任务信息 + 我的得分（合并，简化） -->
                <div class="flex items-start justify-between gap-4 mb-3">
                  <div class="min-w-0">
                    <h3 class="text-lg font-semibold text-gray-900 leading-tight">{{ selectedStudentTask.title }}</h3>
                    <p class="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{{ selectedStudentTask.description || '暂无介绍' }}</p>
                  </div>
                  <button @click="closeStudentTask" class="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <X class="w-5 h-5" />
                  </button>
                </div>

                <!-- 我的得分（一条横幅） -->
                <div class="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2 mb-4">
                  <p class="text-xs font-medium text-gray-500 flex-shrink-0">我的得分</p>
                  <div class="flex items-center gap-2 flex-wrap justify-end">
                    <template v-if="myTaskEvalScores.length">
                      <span v-for="s in myTaskEvalScores" :key="s.type"
                        class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                        {{ s.label }} <b class="text-gray-900">{{ s.score }}分</b>
                      </span>
                    </template>
                    <span v-else class="text-xs text-gray-400">尚未评分</span>
                    <span v-if="myTaskScore(selectedStudentTask.id) !== undefined"
                      class="px-2.5 py-0.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      {{ myTaskScore(selectedStudentTask.id) }} 分
                    </span>
                  </div>
                </div>

                <!-- 弹窗内部 tab：提交成果 / 互评他人 -->
                <div class="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
                  <button @click="studentTaskTab = 'submit'"
                    :class="`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${studentTaskTab === 'submit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`">
                    提交成果
                  </button>
                  <button v-if="peerEvalEnabled" @click="studentTaskTab = 'peer'"
                    :class="`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${studentTaskTab === 'peer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`">
                    互评他人
                    <span v-if="taskEvalPeerTargets.length" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full"
                      :class="studentTaskTab === 'peer' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'">{{ taskEvalPeerTargets.length }}</span>
                  </button>
                </div>

                <!-- Tab：提交成果 -->
                <div v-if="studentTaskTab === 'submit'">
                  <!-- 教师提供的文档资料（只读） -->
                  <div v-if="selectedStudentTask.attachments?.length" class="mb-3">
                    <p class="text-xs font-medium text-gray-500 mb-1.5">教师提供的文档资料</p>
                    <ul class="space-y-1.5">
                      <li v-for="(f, i) in selectedStudentTask.attachments" :key="i"
                        class="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <FileText class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span v-if="f.dataUrl" @click="openFileDetail(f.dataUrl)" :title="`点击查看 ${f.name}`"
                          class="flex-1 min-w-0 truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">{{ f.name }}</span>
                        <span v-else class="flex-1 min-w-0 truncate">{{ f.name }}</span>
                        <span class="text-gray-400 flex-shrink-0">{{ formatFileSize(f.size) }}</span>
                      </li>
                    </ul>
                  </div>

                  <!-- 提交资料区：编辑语句 + 上传资料 -->
                  <div>
                    <p class="text-xs font-medium text-gray-500 mb-1.5">提交我的成果（可编辑语句说明，也可上传资料）</p>
                    <textarea v-model="studentTaskDescription" rows="3" maxlength="2000"
                      placeholder="输入你的成果说明 / 完成情况 / 学习心得..."
                      class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/30 resize-none mb-3" />
                    <div
                      class="border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-brand-400/60 hover:bg-brand-400/5 transition-colors"
                      @click="studentTaskFileInput?.click()" @dragover.prevent @drop.prevent="onStudentTaskDrop">
                      <Upload class="w-5 h-5 mx-auto text-gray-400 mb-1" />
                      <p class="text-xs text-gray-500">点击或拖拽文件到此处上传</p>
                      <p class="text-[10px] text-gray-400 mt-0.5">支持 PDF / Word / PPT / Excel / 文本 / 压缩包 · 多次上传提交后为追加</p>
                    </div>
                    <input ref="studentTaskFileInput" type="file" class="hidden" multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.zip,.rar,.7z" @change="onStudentTaskChange" />
                    <ul v-if="studentTaskAttachments.length" class="mt-2 space-y-1.5">
                      <li v-for="(f, i) in studentTaskAttachments" :key="i"
                        class="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <FileText class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span v-if="f.dataUrl" @click="openFileDetail(f.dataUrl)" :title="`点击查看 ${f.name}`"
                          class="flex-1 min-w-0 truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">{{ f.name }}</span>
                        <span v-else class="flex-1 min-w-0 truncate">{{ f.name }}</span>
                        <span class="text-gray-400 flex-shrink-0">{{ formatFileSize(f.size) }}</span>
                        <button @click="removeStudentTaskFile(i)" class="text-gray-400 hover:text-red-500 flex-shrink-0" title="移除">
                          <X class="w-3.5 h-3.5" />
                        </button>
                      </li>
                    </ul>
                    <div class="flex items-center justify-end gap-2 mt-4">
                      <button @click="closeStudentTask" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">关闭</button>
                      <button @click="submitStudentTask"
                        :disabled="studentTaskAttachments.length === 0 && !studentTaskDescription.trim()"
                        class="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50">
                        提交
                      </button>
                    </div>
                  </div>

                  <!-- 自评（简化）：评价方案含自评时展示，直接置于提交成果下方 -->
                  <div v-if="selfEvalTarget" class="border-t border-gray-100 mt-4 pt-4">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-[10px] px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">自评</span>
                      <p class="text-sm font-medium text-gray-800">我的自评</p>
                      <span v-if="selfEvalTarget.avgScore !== null" class="ml-auto text-[11px] text-gray-400">当前均分 {{ selfEvalTarget.avgScore }}</span>
                    </div>
                    <p class="text-xs text-gray-400 mb-2">对照任务要求，给本次提交的成果评分</p>
                    <div class="flex items-center gap-2">
                      <input v-model.number="taskEvalDrafts[`${selectedStudentTask.id}|self|${selfEvalTarget.studentId}`]"
                        type="number" min="0" max="100" placeholder="0-100 分"
                        class="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                      <span v-if="selfEvalTarget.myScore !== null" class="text-xs text-emerald-600">我已评 {{ selfEvalTarget.myScore }} 分（可修改）</span>
                      <span v-else class="text-xs text-gray-400">尚未评分</span>
                    </div>
                    <div class="flex justify-end mt-3">
                      <button @click="submitTaskEvals('self')"
                        class="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg">
                        提交自评
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Tab：互评他人（查看他人提交资料 + 编辑评分，预留互评空间） -->
                <div v-else>
                  <div class="flex items-center gap-2 mb-1">
                    <ClipboardCheck class="w-5 h-5 text-gray-400" />
                    <h4 class="font-semibold text-gray-900">互评他人</h4>
                    <span class="text-xs text-gray-400">查看对方提交的资料后进行评分</span>
                  </div>
                  <p class="text-xs text-gray-400 mb-3">评分将按教师设定的成绩占比计入对方平时成绩</p>
                  <div v-if="taskEvalPeerTargets.length" class="space-y-3">
                    <div v-for="(t, ti) in taskEvalPeerTargets" :key="ti"
                      class="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div class="flex items-center gap-2 mb-1.5">
                        <span class="text-[10px] px-2 py-0.5 rounded-full border"
                          :class="t.type === 'self' ? 'bg-blue-50 text-blue-600 border-blue-200' : t.type === 'intra_group' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-purple-50 text-purple-600 border-purple-200'">
                          {{ EvalTypeLabels[t.type] }}
                        </span>
                        <span class="text-sm font-medium text-gray-800">{{ t.name }}</span>
                        <span v-if="t.studentNo" class="text-xs text-gray-400">{{ t.studentNo }}</span>
                        <span v-if="t.avgScore !== null" class="ml-auto text-[11px] text-gray-400">当前均分 {{ t.avgScore }}</span>
                      </div>
                      <!-- 被评者提交的资料 -->
                      <p v-if="t.description" class="text-xs text-gray-600 bg-white rounded-lg px-2.5 py-1.5 mb-1.5 whitespace-pre-wrap">{{ t.description }}</p>
                      <ul v-if="t.attachments.length" class="flex flex-wrap gap-1.5 mb-1.5">
                        <li v-for="(f, fi) in t.attachments" :key="fi"
                          :class="`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border ${f.dataUrl ? 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100 cursor-pointer' : 'text-gray-500 bg-white border-gray-200'}`"
                          :title="f.dataUrl ? `点击查看 ${f.name}` : ''" @click="f.dataUrl && openFileDetail(f.dataUrl)">
                          <FileText class="w-3 h-3 text-gray-400" />{{ f.name }}
                        </li>
                      </ul>
                      <!-- 评分 -->
                      <div class="flex items-center gap-2">
                        <input v-model.number="taskEvalDrafts[`${selectedStudentTask.id}|${t.type}|${t.studentId}`]"
                          type="number" min="0" max="100" placeholder="0-100 分"
                          class="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-brand-400/30" />
                        <span v-if="t.myScore !== null" class="text-xs text-emerald-600">我已评 {{ t.myScore }} 分（可修改）</span>
                        <span v-else class="text-xs text-gray-400">尚未评分</span>
                      </div>
                    </div>
                  </div>
                  <!-- 空状态：评价方案启用了互评，但暂无可评对象（其他同学未提交该任务） -->
                  <div v-else class="text-center py-8 bg-gray-50 rounded-xl">
                    <Users class="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p class="text-sm text-gray-500">暂无待互评的同学</p>
                    <p class="text-xs text-gray-400 mt-1">同组/其他组同学提交该任务成果后，即可在此查看资料并评分</p>
                  </div>
                  <div class="flex justify-end mt-3">
                    <button @click="submitTaskEvals()" :disabled="taskEvalPeerTargets.length === 0"
                      class="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg disabled:opacity-50">
                      提交评价
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Teleport>

          <!-- ===== 资源 ===== -->
          <div v-if="activeTab === 'resources'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-800">课程资源</h3>
              <span class="text-xs text-gray-400">教师上传的资源，可下载学习</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="res in courseResources" :key="res.id" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                    <FileText class="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ res.name }}</p>
                    <p class="text-xs text-gray-400">{{ getFileTypeName(res.type) }} · {{ formatFileSize(res.size) }} · 上传者：{{ res.uploadedBy }}</p>
                  </div>
                </div>
                <button @click="downloadFile(res)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="下载文件">
                  <Download class="w-4 h-4" />
                </button>
              </div>
              <div v-if="courseResources.length === 0" class="col-span-full text-center py-8 text-gray-400">暂无课程资源</div>
            </div>
          </div>

          <!-- ===== 作业 ===== -->
          <div v-if="activeTab === 'homework'" class="space-y-4">
            <StudentHomework
              :course-id="courseId"
              :student-id="myStudent?.id || ''"
              :tier="tierFinalized ? myTier : undefined"
            />
          </div>
          <!-- ===== 评价填写 ===== -->
          <div v-if="activeTab === 'evaluations'" class="space-y-6">
            <!-- ===== 任务评价引导板块（评价统一在"任务"中完成） ===== -->
            <div class="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 space-y-4">
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                <div class="flex items-center gap-2 mb-2">
                  <ClipboardCheck class="w-5 h-5 text-blue-600" />
                  <h3 class="text-base font-semibold text-blue-800">任务评价</h3>
                </div>
                <p class="text-sm text-blue-700 leading-relaxed">
                  自评、组内互评、组间互评统一在课程"任务"中完成：进入任务后查看他人提交的资料进行评分，教师/导师也会依据你提交的资料评分。所有评价均计入课程平时成绩。
                </p>
              </div>
              <div class="flex justify-end">
                <button @click="activeTab = 'tasks'"
                  class="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors">
                  <ClipboardCheck class="w-4 h-4" /> 去任务评价
                </button>
              </div>
            </div>

            <!-- ===== 素质评价板块 ===== -->
            <div class="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 space-y-4">
              <div class="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-5 border border-emerald-100">
                <div class="flex items-center gap-2 mb-2">
                  <UserCheck class="w-5 h-5 text-emerald-600" />
                  <h3 class="text-base font-semibold text-emerald-800">素质评价</h3>
                </div>
                <p class="text-sm text-emerald-700">
                  上传与本课程相关的实践成果、项目文档、证书等资料，教师将根据提交内容进行评分。素质评价分数会直接加成到你的课程总分中。
                </p>
              </div>

              <div v-if="isReadOnly" class="bg-brand-400/5 border border-brand-400/30 rounded-xl p-6 text-center text-sm text-gray-400">
                <Eye class="w-8 h-8 mx-auto mb-2 text-gray-400/60" />
                <p>课程已结束，无法提交素质评价</p>
                <p class="text-xs mt-1">如需查看已提交内容，请联系教师</p>
              </div>

              <div v-else class="space-y-4">
                <!-- 描述 -->
                <div class="bg-white rounded-xl p-4 border border-brand-400/20">
                  <label class="text-sm font-medium text-gray-700 mb-2 block">成果说明</label>
                  <textarea v-model="qualityDesc" rows="3"
                    placeholder="简要说明你提交的成果、收获或实践内容..."
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>

                <!-- 文件上传 -->
                <div class="bg-white rounded-xl p-4 border border-brand-400/20">
                  <label class="text-sm font-medium text-gray-700 mb-2 block">上传资料（图片/文档，单个文件 ≤ 2MB）</label>
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer"
                    @click="qualityFileInputRef?.click()">
                    <Upload class="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p class="text-sm text-gray-500">点击选择文件上传</p>
                    <p class="text-xs text-gray-400 mt-1">支持图片、PDF、Word、Excel 等格式</p>
                    <input type="file" ref="qualityFileInputRef" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
                      class="hidden" @change="handleQualityFileSelect" />
                  </div>

                  <!-- 已选文件列表 -->
                  <div v-if="qualityPendingFiles.length > 0" class="mt-3 space-y-2">
                    <div v-for="(f, i) in qualityPendingFiles" :key="i"
                      class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded border">
                      <div class="flex items-center gap-2 min-w-0">
                        <FileText class="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span class="text-sm text-gray-700 truncate">{{ f.fileName }}</span>
                        <span class="text-xs text-gray-400 flex-shrink-0">{{ formatSize(f.fileSize) }}</span>
                      </div>
                      <button @click="qualityPendingFiles.splice(i, 1)" class="text-gray-400 hover:text-red-500">
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 历史提交列表 -->
                <div v-if="myQualitySubmissions.length > 0" class="space-y-3">
                  <div v-for="(sub, si) in myQualitySubmissions" :key="sub.id"
                    class="bg-white rounded-xl p-4 border border-brand-400/20">
                    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <p class="text-sm font-medium text-gray-800">第 {{ myQualitySubmissions.length - si }} 次提交</p>
                        <p class="text-xs text-gray-400 mt-0.5">提交时间：{{ sub.submittedAt }}</p>
                      </div>
                      <div v-if="sub.score !== undefined"
                        class="px-3 py-1 rounded-full text-sm font-bold"
                        :class="sub.score >= 60 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'">
                        教师评分：{{ sub.score }} 分
                      </div>
                      <div v-else class="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">
                        待教师批改
                      </div>
                    </div>
                    <p v-if="sub.description" class="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{{ sub.description }}</p>
                    <div v-if="sub.files.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <a v-for="(f, i) in sub.files" :key="i" :href="f.dataUrl"
                        :download="f.fileName" target="_blank"
                        class="flex items-center gap-2 px-3 py-2 bg-brand-400/5 border border-brand-400/20 rounded text-sm text-brand-700 hover:bg-brand-400/10 transition-colors truncate">
                        <FileText class="w-4 h-4 flex-shrink-0" />
                        <span class="truncate">{{ f.fileName }}</span>
                      </a>
                    </div>
                    <p v-if="sub.teacherComment" class="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      教师评语：{{ sub.teacherComment }}
                    </p>
                  </div>
                </div>

                <!-- 提交按钮 -->
                <div class="flex items-center gap-3 pt-2">
                  <div v-if="qualitySubmitError" class="flex-1 text-xs text-red-500 flex items-center gap-1">
                    <XCircle class="w-3 h-3" />{{ qualitySubmitError }}
                  </div>
                  <button @click="submitQuality"
                    :disabled="qualityPendingFiles.length === 0"
                    class="ml-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors">
                    提交素质评价（第 {{ myQualitySubmissions.length + 1 }} 次）
                  </button>
                </div>
              </div>
            </div>
            </div>
            </div>
          </div>

        <div class="lg:col-span-4">
          <!-- ===== 综合评价 ===== -->
          <div v-if="activeTab === 'eval_overview'">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 左列：最终综合评价 -->
            <div class="space-y-6">
              <!-- 最终综合评价卡片 -->
              <div class="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/10 border border-blue-500/20">
                <div class="flex items-center justify-between mb-5">
                  <div>
                    <p class="text-blue-100/80 text-xs mb-2 tracking-wide">
                      任务评价综合评分
                    </p>
                    <p class="text-4xl font-bold leading-none drop-shadow-sm">
                      {{ currentComprehensiveScore ?? '-' }}<span class="text-lg text-blue-200/80 ml-1 font-medium">分</span>
                    </p>
                    <p class="text-blue-100/60 text-xs mt-2">作为平时分计入总成绩</p>
                  </div>
                  <div class="text-right bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm border border-white/10">
                    <p class="text-blue-100/70 text-xs mb-1">班级平均</p>
                    <p class="text-2xl font-semibold">{{ classAvgScore }}<span class="text-xs text-blue-200/80 ml-0.5">分</span></p>
                  </div>
                </div>
                <!-- 分数条对比 -->
                <div class="relative h-2.5 bg-white/15 rounded-full overflow-hidden">
                  <div class="absolute top-0 h-full w-0.5 bg-white/80 z-10" :style="{ left: classAvgScore + '%' }" />
                  <div v-if="currentComprehensiveScore !== null" class="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400 transition-all"
                    :style="{ width: Math.min(currentComprehensiveScore, 100) + '%' }" />
                </div>
                <div class="flex justify-between text-blue-100/60 text-xs mt-1.5">
                  <span>0</span>
                  <span class="text-white/80 font-medium">▼ 平均 {{ classAvgScore }}</span>
                  <span>100</span>
                </div>
              </div>

            <!-- 评价维度细分 -->
            <div class="bg-white rounded-2xl p-5 border border-brand-400/20 shadow-sm">
              <h3 class="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
                <BarChart3 class="w-4 h-4 text-blue-500" /> 评价维度细分
                <span class="text-xs font-normal text-gray-400 ml-1">· 基于任务评价</span>
              </h3>
              <div class="space-y-3.5">
                <div v-for="dim in evalDimensions" :key="dim.label"
                  class="flex items-center gap-3 p-3 rounded-xl border border-brand-400/15 bg-brand-400/[0.02] hover:border-brand-400/30 transition-colors">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    :class="dim.iconBg">
                    <component :is="dim.icon" class="w-4 h-4" :class="dim.iconColor" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">{{ dim.label }}</p>
                    <div class="flex items-center gap-2 mt-1.5">
                      <div class="flex-1 bg-brand-400/10 rounded-full h-2 overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500" :class="dim.barColor"
                          :style="{ width: (dim.score / (dim.maxScore || 100) * 100) + '%' }" />
                      </div>
                      <span class="text-xs font-bold text-brand-600 w-12 text-right">
                        {{ dim.score }}<span class="text-gray-400 font-normal">/{{ dim.maxScore || 100 }}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="evalDimensions.length === 0" class="text-center py-6 text-gray-400">暂无评价数据</div>
              </div>
            </div>

            <!-- 成绩权重说明 -->
            <div v-if="currentCfg" class="bg-gradient-to-br from-brand-50 to-blue-50 rounded-2xl p-5 border border-brand-200 text-sm text-brand-800 shadow-sm">
              <p class="font-semibold mb-2 flex items-center gap-1.5">
                <PieChart class="w-4 h-4 text-brand-600" /> 成绩构成
              </p>
              <p>总成绩 = 平时成绩({{ currentCfg.regularWeight }}%) + 期中成绩({{ currentCfg.midtermWeight }}%) + 期末成绩({{ currentCfg.finalWeight }}%)</p>
              <p class="text-xs text-brand-700 mt-1.5 leading-relaxed">
                平时成绩构成：<template v-for="(et, i) in studentEvalTypes" :key="et">{{ i > 0 ? ' + ' : '' }}{{ EvalTypeLabels[et] }}({{ currentCfg[gradeWeightKeyMap[et]] }}%)</template>
              </p>
            </div>
            </div>

            <!-- ===== 右列：增值评价 ===== -->
            <div class="space-y-6">
          <!-- 说明 -->
          <div class="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-5 border border-blue-500/20 text-white shadow-lg shadow-blue-600/10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 border border-white/10">
                <TrendingUp class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">增值评价</h3>
                <p class="text-blue-100/70 text-xs mt-0.5">学业成长趋势分析</p>
              </div>
            </div>
            <p class="text-blue-100/80 text-sm mt-3 leading-relaxed">
              基于本课程各任务评价数据，分析你的任务得分成长趋势，直观展示学业成长轨迹。
            </p>
          </div>

          <!-- 有数据时显示折线图 -->
          <div v-if="valueAddedData.length > 0" class="space-y-6">
            <!-- 统计卡片 -->
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-white rounded-2xl p-4 border border-brand-400/20 shadow-sm">
                <p class="text-xs text-gray-400 mb-1.5">当前得分</p>
                <p class="text-2xl font-bold text-gray-900">{{ valueAddedData[valueAddedData.length - 1].score }}</p>
                <p class="text-xs text-gray-400 mt-1">第{{ valueAddedData.length }}项任务</p>
              </div>
              <div v-if="valueAddedStats" class="bg-white rounded-2xl p-4 border border-brand-400/20 shadow-sm">
                <p class="text-xs text-gray-400 mb-1.5">相比上次</p>
                <p class="text-2xl font-bold" :class="valueAddedStats.change > 0 ? 'text-emerald-600' : valueAddedStats.change < 0 ? 'text-red-500' : 'text-gray-500'">
                  {{ valueAddedStats.change > 0 ? '+' : '' }}{{ valueAddedStats.change.toFixed(1) }}
                </p>
                <p class="text-xs text-gray-400 mt-1">{{ valueAddedStats.change > 0 ? '进步' : valueAddedStats.change < 0 ? '退步' : '保持不变' }}</p>
              </div>
              <div v-if="valueAddedImprovement" class="bg-white rounded-2xl p-4 border border-brand-400/20 shadow-sm">
                <p class="text-xs text-gray-400 mb-1.5">累计变化</p>
                <p class="text-2xl font-bold" :class="valueAddedImprovement.totalChange > 0 ? 'text-emerald-600' : valueAddedImprovement.totalChange < 0 ? 'text-red-500' : 'text-gray-500'">
                  {{ valueAddedImprovement.totalChange > 0 ? '+' : '' }}{{ valueAddedImprovement.totalChange.toFixed(1) }}
                </p>
                <p class="text-xs text-gray-400 mt-1">共{{ valueAddedData.length }}项任务</p>
              </div>
            </div>

            <!-- 折线图 -->
            <div class="bg-white rounded-2xl p-6 border border-brand-400/20 shadow-sm">
              <h3 class="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
                <TrendingUp class="w-4 h-4 text-blue-500" /> 成绩趋势图
              </h3>
              <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-full" style="min-height: 200px">
                <!-- 背景网格 -->
                <defs>
                  <pattern id="valueAddedGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#valueAddedGrid)" />
                
                <!-- Y轴 -->
                <line 
                  :x1="padding.left" :y1="padding.top" 
                  :x2="padding.left" :y2="padding.top + innerHeight" 
                  stroke="#e5e7eb" stroke-width="1" />
                
                <!-- X轴 -->
                <line 
                  :x1="padding.left" :y1="padding.top + innerHeight" 
                  :x2="padding.left + innerWidth" :y2="padding.top + innerHeight" 
                  stroke="#e5e7eb" stroke-width="1" />
                
                <!-- Y轴刻度 -->
                <g v-for="i in 5" :key="'y-tick-' + i">
                  <line 
                    :x1="padding.left - 5" 
                    :y1="padding.top + innerHeight * (1 - (i - 1) / 4)"
                    :x2="padding.left" 
                    :y2="padding.top + innerHeight * (1 - (i - 1) / 4)"
                    stroke="#9ca3af" stroke-width="1" />
                  <text 
                    :x="padding.left - 8" 
                    :y="padding.top + innerHeight * (1 - (i - 1) / 4) + 3"
                    text-anchor="end" 
                    font-size="10" 
                    fill="#9ca3af">
                    {{ 100 - (i - 1) * 25 }}
                  </text>
                </g>
                
                <!-- 折线 -->
                <polyline
                  :points="linePoints"
                  fill="none"
                  stroke="#2563eb"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                
                <!-- 渐变填充 -->
                <defs>
                  <linearGradient id="valueAddedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#2563eb" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  :points="areaPoints"
                  fill="url(#valueAddedGradient)"
                />
                
                <!-- 数据点 -->
                <g v-for="(point, i) in valueAddedData" :key="'point-' + i">
                  <circle
                    :cx="padding.left + (valueAddedData.length > 1 ? i * xStep : innerWidth / 2)"
                    :cy="padding.top + innerHeight * (1 - point.score / 100)"
                    r="5"
                    fill="#2563eb"
                    stroke="white"
                    stroke-width="2"
                    class="cursor-pointer"
                  >
                    <title>{{ point.label }}: {{ point.score }}分</title>
                  </circle>
                  <text
                    :x="padding.left + (valueAddedData.length > 1 ? i * xStep : innerWidth / 2)"
                    :y="padding.top + innerHeight * (1 - point.score / 100) - 12"
                    text-anchor="middle"
                    font-size="10"
                    font-weight="bold"
                    fill="#2563eb">
                    {{ point.score }}
                  </text>
                  <text
                    :x="padding.left + (valueAddedData.length > 1 ? i * xStep : innerWidth / 2)"
                    :y="padding.top + innerHeight + 20"
                    text-anchor="middle"
                    font-size="10"
                    fill="#6b7280">
                    {{ point.label }}
                  </text>
                </g>
              </svg>
            </div>

            <!-- 进步建议 -->
            <div v-if="valueAddedImprovement" class="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-5 border border-emerald-100 text-white shadow-lg shadow-emerald-500/10">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/20">
                  <TrendingUp class="w-5 h-5 text-white" />
                </div>
                <div>
                  <p class="text-base font-semibold text-white">
                    {{ valueAddedImprovement.totalChange > 0 ? '学习状态良好' : valueAddedImprovement.totalChange < 0 ? '需要加强学习' : '保持稳定' }}
                  </p>
                  <p class="text-white/80 text-sm mt-1 leading-relaxed">
                    {{ valueAddedImprovement.totalChange > 0 
                      ? `平均每次进步 ${valueAddedImprovement.avgChangePerSession.toFixed(1)} 分，继续保持！` 
                      : valueAddedImprovement.totalChange < 0 
                        ? `平均每次退步 ${Math.abs(valueAddedImprovement.avgChangePerSession).toFixed(1)} 分，建议加强复习。` 
                        : '成绩保持稳定，继续努力提升！' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 无数据时显示空状态 -->
          <div v-else class="bg-white rounded-2xl p-12 border border-brand-400/20 text-center shadow-sm">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <TrendingUp class="w-8 h-8 text-blue-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">暂无增值评价数据</h3>
            <p class="text-sm text-gray-500">完成至少一次任务评价后，系统将自动生成你的增值评价趋势图</p>
            <button 
              v-if="(activeTab as string) !== 'tasks'"
              @click="activeTab = 'tasks'"
              class="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-sm font-medium rounded-full shadow-md shadow-blue-600/20 transition-colors">
              去任务评价
            </button>
          </div>
          </div>
          </div>
        </div>
        </div>

      <!-- ===== 右侧栏（D3 渲染） ===== -->
      <div class="lg:col-span-1" id="course-learn-sidebar"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  ArrowLeft, BookOpen, FileText, ClipboardCheck, Edit3,
  CheckCircle, Circle, Layers, Award, Sparkles, UserCheck, Users, MessageSquare, Eye, HelpCircle, Lock, XCircle,
  Download, Upload, TrendingUp, X, BarChart3, PieChart
} from 'lucide-vue-next'
import StudentHomework from '@/components/Homework/StudentHomework.vue'
import { listTasks, listTaskSubmissions, submitTask, listTaskEvals, submitTaskEval } from '@/api'
import type { AITierQuestion, LearningTier, CloudFile, QualityEvalFile } from '@/types'
import { TEMPLATE_EVAL_TYPES, EvalTypeLabels } from '@/types'
import Modal from '@/components/Modal.vue'
import { getNow } from '@/lib/date'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const courseId = route.params.id as string
const myStudent = computed(() => store.students.find((s) => s.name === store.currentUser || s.name === store.currentDisplayName))

// 支持 ?tab=xxx 直达对应模块（用于红点溯源跳转）
const VALID_TABS = ['ai_tier', 'tasks', 'resources', 'homework', 'evaluations', 'eval_overview']
const activeTab = ref<string>(
  VALID_TABS.includes(route.query.tab as string) ? (route.query.tab as string) : 'tasks'
)
const selectedFiles = ref<Record<string, File>>({})

onMounted(() => {
  // 任务评价模型：刷新本课程任务评价快照（旧版"按次数评价"提醒已废弃）
  store.refreshTaskEvalInfo([courseId])
  if (myStudent.value) {
    store.autoAssignOverdueBasicTier(courseId, myStudent.value.id)
  }
  loadCourseTasks()
})

// 路由 query 变化时切换 tab（红点溯源：同一页面内二次跳转）
watch(() => route.query.tab, (val) => {
  if (val && VALID_TABS.includes(val as string)) {
    activeTab.value = val as string
  }
})

const tabs = [
  { id: 'ai_tier', label: 'AI分层', icon: Layers },
  { id: 'tasks', label: '任务', icon: Edit3 },
  { id: 'resources', label: '资源', icon: FileText },
  { id: 'homework', label: '作业', icon: BookOpen },
  { id: 'evaluations', label: '评价填写', icon: ClipboardCheck },
  { id: 'eval_overview', label: '综合评价', icon: Award },
]

const course = computed(() => store.courses.find((c) => c.id === courseId))
const isReadOnly = computed(() => course.value?.status !== 'active')
const myEnrollment = computed(() =>
  store.enrollments.find((e) => e.courseId === courseId && e.studentId === myStudent.value?.id)
)
const myGrade = computed(() =>
  store.grades.find((g) => g.courseId === courseId && g.studentId === myStudent.value?.id)
)

// ===== 任务（教师布置，学生上传资料/编辑语句，教师/导师/学生按模板评价） =====
const courseTasks = ref<any[]>([])
/** 我的得分缓存：taskId → score（教师/导师评分，即 submission.score） */
const taskScoresByTask = ref<Record<string, number>>({})
/** 我的已提交附件：taskId → 附件列表 */
const myTaskSubmittedFiles = ref<Record<string, { name: string; size: number; dataUrl?: string }[]>>({})
/** 我的已提交文字描述：taskId → description */
const myTaskDescription = ref<Record<string, string>>({})
/** 某任务全部提交：taskId → 提交列表（评价他人时查看资料用） */
const taskSubmissionsByTask = ref<Record<string, any[]>>({})
/** 某任务全部评价记录：taskId → 评价列表 */
const taskEvalsByTask = ref<Record<string, any[]>>({})
/** 任务评价草稿：`${taskId}|${type}|${studentId}` → 分数 */
const taskEvalDrafts = ref<Record<string, number>>({})

/** 课程当前评价模板（未配置默认 all 全评价） */
const courseEvalTemplate = computed(() =>
  (store.evalConfigs || []).find((c) => c.courseId === courseId)?.template || 'all'
)
/** 模板允许的学生评价类型 */
const studentEvalTypes = computed(() => TEMPLATE_EVAL_TYPES[courseEvalTemplate.value] || TEMPLATE_EVAL_TYPES.all)
/** 我的分组（用于组内互评） */
const myStudentGroup = computed(() =>
  (store.studentGroups || []).find((g) => g.courseId === courseId && myStudent.value && g.memberIds.includes(myStudent.value.id))
)
const myGroupMemberIds = computed(() => myStudentGroup.value?.memberIds || [])

async function loadCourseTasks() {
  if (!myStudent.value) return
  try {
    const res = await listTasks(courseId)
    courseTasks.value = (res.tasks || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      attachments: t.attachments || [],
    }))
    // 逐个任务读取提交、评分与评价记录
    for (const t of courseTasks.value) {
      try {
        const [sres, eres] = await Promise.all([listTaskSubmissions(t.id), listTaskEvals(t.id)])
        const subs: any[] = sres.submissions || []
        taskSubmissionsByTask.value[t.id] = subs
        taskEvalsByTask.value[t.id] = eres.evals || []
        const my = subs.find((s) => s.studentId === myStudent.value!.id)
        if (my) {
          if (my.score != null) taskScoresByTask.value[t.id] = Number(my.score)
          if (Array.isArray(my.attachments) && my.attachments.length > 0) {
            myTaskSubmittedFiles.value[t.id] = my.attachments
          }
          if (my.description) myTaskDescription.value[t.id] = my.description
        }
      } catch {}
    }
  } catch (e) {
    console.error('加载课程任务失败:', e)
  }
}

function myTaskScore(taskId: string): number | undefined {
  return taskScoresByTask.value[taskId]
}

/** 是否已提交（未评分）：用于任务行展示"已提交·待评分"状态 */
function hasSubmittedTask(taskId: string): boolean {
  const files = myTaskSubmittedFiles.value[taskId]
  const desc = myTaskDescription.value[taskId]
  return (Array.isArray(files) && files.length > 0) || !!desc
}

/** 任务评价目标列表：自评（自己）/ 组内互评（同组已提交成员）/ 组间互评（其他组已提交成员），并附带对方提交资料 */
const taskEvalTargets = computed(() => {
  const task = selectedStudentTask.value
  if (!task || !myStudent.value) return []
  const subs = taskSubmissionsByTask.value[task.id] || []
  const hasSub = (sid: string) => subs.some((s) => s.studentId === sid)
  const targets: { type: string; studentId: string; name: string; studentNo: string; description: string; attachments: any[]; myScore: number | null; avgScore: number | null }[] = []
  const push = (type: string, sid: string) => {
    if (!hasSub(sid)) return
    const stu = store.students.find((s) => s.id === sid)
    const sub = subs.find((s) => s.studentId === sid)
    const evals = (taskEvalsByTask.value[task.id] || []).filter((e) => e.studentId === sid && e.type === type)
    const myEval = evals.find((e) => e.evaluatorId === myStudent.value!.id)
    const myScore = myEval ? Number(myEval.score) : null
    const avg = evals.length ? Math.round(evals.reduce((a, b) => a + Number(b.score), 0) / evals.length) : null
    targets.push({
      type, studentId: sid,
      name: stu?.name || sid,
      studentNo: (stu as any)?.studentId || '',
      description: sub?.description || '',
      attachments: sub?.attachments || [],
      myScore, avgScore: avg,
    })
  }
  if (studentEvalTypes.value.includes('self')) push('self', myStudent.value.id)
  if (studentEvalTypes.value.includes('intra_group')) {
    for (const sid of myGroupMemberIds.value) if (sid !== myStudent.value.id) push('intra_group', sid)
  }
  if (studentEvalTypes.value.includes('inter_group')) {
    const enrolled = store.enrollments
      .filter((e) => e.courseId === courseId && e.status !== 'dropped')
      .map((e) => e.studentId)
    for (const sid of enrolled) {
      if (sid === myStudent.value.id || myGroupMemberIds.value.includes(sid)) continue
      push('inter_group', sid)
    }
  }
  return targets
})

/** 我的任务各类得分（仅展示当前评价模板启用的类型，含去极值平均展示） */
const myTaskEvalScores = computed(() => {
  const task = selectedStudentTask.value
  if (!task || !myStudent.value) return [] as { type: string; label: string; score: number | null }[]
  const evals = (taskEvalsByTask.value[task.id] || []).filter((e) => e.studentId === myStudent.value!.id)
  const out: { type: string; label: string; score: number | null }[] = []
  // 跟随教师设定的评价模板：只展示模板启用的类型
  for (const type of studentEvalTypes.value) {
    const list = evals.filter((e) => e.type === type).map((e) => Number(e.score))
    if (list.length === 0) continue
    let avg: number
    if ((type === 'intra_group' || type === 'inter_group') && list.length >= 3) {
      const sorted = [...list].sort((a, b) => a - b).slice(1, -1)
      avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
    } else {
      avg = Math.round(list.reduce((a, b) => a + b, 0) / list.length)
    }
    out.push({ type, label: EvalTypeLabels[type], score: avg })
  }
  const teacherScore = myTaskScore(task.id)
  if (teacherScore !== undefined) {
    if (studentEvalTypes.value.includes('teacher') && !out.some((o) => o.type === 'teacher')) {
      out.push({ type: 'teacher', label: EvalTypeLabels.teacher, score: teacherScore })
    }
    if (studentEvalTypes.value.includes('mentor') && !out.some((o) => o.type === 'mentor')) {
      out.push({ type: 'mentor', label: EvalTypeLabels.mentor, score: teacherScore })
    }
  }
  return out
})

/** 自评目标（简化，直接展示在"提交成果"下方，不需查看他人资料） */
const selfEvalTarget = computed(() => taskEvalTargets.value.find((t) => t.type === 'self') ?? null)

/** 互评他人目标：仅组内/组间互评（评价他人/其他组），不含自评 */
const taskEvalPeerTargets = computed(() => taskEvalTargets.value.filter((t) => t.type !== 'self'))

/** 评价方案是否启用互评（组内/组间）→ 决定"互评他人"入口是否展示（跟随教师设定的评价模板） */
const peerEvalEnabled = computed(() =>
  studentEvalTypes.value.includes('intra_group') || studentEvalTypes.value.includes('inter_group')
)

/** 提交任务评价（自评/互评）：typeFilter 传 'self' 只提交自评，不传则提交互评他人 */
async function submitTaskEvals(typeFilter?: string) {
  const task = selectedStudentTask.value
  if (!task) return
  const entries = Object.entries(taskEvalDrafts.value)
    .filter(([k, v]) => {
      const [, type] = k.split('|')
      if (!k.startsWith(`${task.id}|`) || typeof v !== 'number' || v < 0) return false
      return typeFilter ? type === typeFilter : type !== 'self'
    })
  if (entries.length === 0) return
  try {
    for (const [k, score] of entries) {
      const [, type, studentId] = k.split('|')
      await submitTaskEval(task.id, { studentId, type, score })
    }
    const eres = await listTaskEvals(task.id)
    taskEvalsByTask.value[task.id] = eres.evals || []
    // 刷新评价数据并重新聚合平时成绩（互评结果按成绩配置占比计入总成绩）
    await store.refreshEvaluations(courseId)
    store.syncEvalToDetailedGrade(courseId)
    // 任务评价模型：刷新快照驱动"待评价"红点/待办
    store.refreshTaskEvalInfo([courseId])
    alert('评价已提交！')
  } catch (e: any) {
    alert(`评价提交失败：${e.message || e}`)
  }
}

// ---- 学生任务详情弹窗 ----
const showStudentTaskModal = ref(false)
const selectedStudentTask = ref<any>(null)
/** 任务弹窗内部 tab：提交成果 / 互评他人 */
const studentTaskTab = ref<'submit' | 'peer'>('submit')
const studentTaskFileInput = ref<HTMLInputElement | null>(null)
const studentTaskAttachments = ref<{ name: string; size: number; dataUrl?: string }[]>([])
/** 提交的文字描述（编辑语句） */
const studentTaskDescription = ref('')

async function openStudentTask(task: any) {
  selectedStudentTask.value = task
  // 文件集合 = 已提交文件 + 本次追加（删除/上传均作用于该集合，提交时整体写入）
  studentTaskAttachments.value = [...(myTaskSubmittedFiles.value[task.id] || [])]
  studentTaskDescription.value = myTaskDescription.value[task.id] || ''
  studentTaskTab.value = 'submit'
  // 预填我的评价草稿
  const evals = taskEvalsByTask.value[task.id] || []
  for (const e of evals) {
    if (e.evaluatorId === myStudent.value?.id) {
      taskEvalDrafts.value[`${task.id}|${e.type}|${e.studentId}`] = Number(e.score)
    }
  }
  showStudentTaskModal.value = true
}

function closeStudentTask() {
  showStudentTaskModal.value = false
  selectedStudentTask.value = null
  studentTaskAttachments.value = []
  studentTaskDescription.value = ''
}

/** 将文件读取为 dataUrl（便于教师/同学点击查看详情） */
function readFilesAsDataUrl(files: File[]): Promise<{ name: string; size: number; dataUrl: string }[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<{ name: string; size: number; dataUrl: string }>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve({ name: file.name, size: file.size, dataUrl: reader.result as string })
          reader.onerror = () => reject(new Error('文件读取失败'))
          reader.readAsDataURL(file)
        })
    )
  )
}

async function onStudentTaskChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    try {
      const files = await readFilesAsDataUrl(Array.from(input.files))
      studentTaskAttachments.value.push(...files)
    } catch (err: any) {
      alert(`文件读取失败：${err.message || err}`)
    }
  }
  input.value = ''
}

async function onStudentTaskDrop(e: DragEvent) {
  if (e.dataTransfer?.files) {
    try {
      const files = await readFilesAsDataUrl(Array.from(e.dataTransfer.files))
      studentTaskAttachments.value.push(...files)
    } catch (err: any) {
      alert(`文件读取失败：${err.message || err}`)
    }
  }
}

function removeStudentTaskFile(i: number) {
  studentTaskAttachments.value.splice(i, 1)
}

/** 点击打开附件详情（dataUrl 新窗口查看/下载） */
function openFileDetail(dataUrl: string) {
  if (!dataUrl) return
  window.open(dataUrl, '_blank')
}

async function submitStudentTask() {
  if (!selectedStudentTask.value || !myStudent.value) return
  if (studentTaskAttachments.value.length === 0 && !studentTaskDescription.value.trim()) {
    alert('请输入文字说明或选择要提交的文件')
    return
  }
  try {
    // 追加语义：提交当前完整文件集合（已提交文件 + 本次新上传 - 已删除），服务端覆盖更新
    await submitTask(selectedStudentTask.value.id, {
      studentId: myStudent.value.id,
      attachments: studentTaskAttachments.value,
      description: studentTaskDescription.value.trim(),
    })
    myTaskSubmittedFiles.value[selectedStudentTask.value.id] = [...studentTaskAttachments.value]
    if (studentTaskDescription.value.trim()) {
      myTaskDescription.value[selectedStudentTask.value.id] = studentTaskDescription.value.trim()
    }
    // 任务评价模型：刷新快照驱动"待评价"红点/待办
    store.refreshTaskEvalInfo([courseId])
    alert('提交成功！等待教师/导师/同学评分')
    closeStudentTask()
  } catch (e: any) {
    alert(`提交失败：${e.message || e}`)
  }
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`
}

// ===== 资源（从store获取课程关联资源） =====
const courseResources = computed(() => store.getCourseCloudFiles(courseId))

// ===== 作业（从store获取课程作业） =====
const courseHomework = computed(() => store.getCourseHomework(courseId))
const submittedCount = computed(() => courseHomework.value.filter(hw => isHomeworkSubmitted(hw.id)).length)

// ===== AI 分层 =====
const tierRecord = computed(() =>
  myStudent.value ? store.getStudentTier(courseId, myStudent.value.id) : null
)
const myTier = computed<LearningTier>(() => tierRecord.value?.tier ?? 'basic')
const myTierScore = computed(() => tierRecord.value?.score ?? 0)
const tierFinalized = computed(() => tierRecord.value !== null)
const firstClassEnded = computed(() => store.isFirstClassStarted(courseId))
const secondClassStarted = computed(() => store.isSecondClassStarted(courseId))
// 是否逾期自动分配（第二节课已开始且得分为 0 = 未参加测试）
const isAutoAssigned = computed(() =>
  secondClassStarted.value && myTierScore.value === 0
)

const tierLabel = computed(() => {
  const map = { basic: '基础层', advanced: '进阶层', excellent: '卓越层' }
  // 未分层时 myTier 回退 basic（逾期自动分配场景），同样展示"基础层"
  return map[myTier.value]
})

const tierBadgeClass = computed(() => {
  if (!tierFinalized.value) return 'bg-brand-400/10 text-brand-700 border border-brand-400'
  const map = {
    basic: 'bg-brand-400/10 text-brand-700 border border-brand-400',
    advanced: 'bg-blue-600/10 text-blue-600 border border-blue-400',
    excellent: 'bg-emerald-600/10 text-emerald-600 border border-emerald-400',
  }
  return map[myTier.value]
})

// ===== 增值评价（按任务归组：任务1 → 任务N，展示任务得分成长趋势） =====
const valueAddedData = computed(() => {
  if (!myStudent.value) return []
  const sid = myStudent.value.id

  const out: { task: number; score: number; label: string }[] = []
  let idx = 0
  for (const t of courseTasks.value) {
    // 该任务中"我"收到的全部评价（含自评/互评/教师/导师），取平均作为任务得分
    const evals = (taskEvalsByTask.value[t.id] || []).filter((e) => e.studentId === sid && e.score > 0)
    let score: number | null = null
    if (evals.length > 0) {
      score = Math.round(evals.reduce((a, e) => a + Number(e.score), 0) / evals.length)
    } else if (taskScoresByTask.value[t.id] != null) {
      score = taskScoresByTask.value[t.id]
    }
    if (score !== null) {
      idx++
      out.push({ task: idx, score, label: `任务${idx}` })
    }
  }
  return out
})

const valueAddedStats = computed(() => {
  const data = valueAddedData.value
  if (data.length < 2) return null
  
  const currentScore = data[data.length - 1].score
  const previousScore = data[data.length - 2].score
  const change = currentScore - previousScore
  
  return {
    currentScore,
    previousScore,
    change,
    hasTrend: true
  }
})

const valueAddedImprovement = computed(() => {
  const data = valueAddedData.value
  if (data.length < 2) return null
  
  // 计算整体提升/退步趋势
  let totalChange = 0
  for (let i = 1; i < data.length; i++) {
    totalChange += data[i].score - data[i-1].score
  }
  
  return {
    totalChange,
    avgChangePerSession: totalChange / (data.length - 1)
  }
})

// ===== 增值评价图表计算 =====
const chartWidth = 500
const chartHeight = 200
const padding = { top: 20, right: 20, bottom: 35, left: 45 }
const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

const xStep = computed(() => {
  if (valueAddedData.value.length <= 1) return 0
  return innerWidth / (valueAddedData.value.length - 1)
})

const linePoints = computed(() => {
  return valueAddedData.value.map((point, i) => {
    const x = padding.left + (valueAddedData.value.length > 1 ? i * xStep.value : innerWidth / 2)
    const y = padding.top + innerHeight * (1 - point.score / 100)
    return `${x},${y}`
  }).join(' ')
})

const areaPoints = computed(() => {
  if (valueAddedData.value.length === 0) return ''
  const points = valueAddedData.value.map((point, i) => {
    const x = padding.left + (valueAddedData.value.length > 1 ? i * xStep.value : innerWidth / 2)
    const y = padding.top + innerHeight * (1 - point.score / 100)
    return `${x},${y}`
  })
  // 添加底部两个点形成封闭区域
  const firstX = padding.left + (valueAddedData.value.length > 1 ? 0 * xStep.value : innerWidth / 2)
  const lastX = padding.left + (valueAddedData.value.length > 1 ? (valueAddedData.value.length - 1) * xStep.value : innerWidth / 2)
  const bottomY = padding.top + innerHeight
  return `${firstX},${bottomY} ${points.join(' ')} ${lastX},${bottomY}`
})

// ===== AI 分层测试弹窗 =====
const aiTestOpen = ref(false)
const testQuestions = ref<AITierQuestion[]>([])
const testAnswers = ref<Record<string, number | boolean>>({})
const testSubmitted = ref(false)
const testScore = ref(0)

function getMockAITierQuestions(courseId: string): AITierQuestion[] {
  const questionSets: Record<string, AITierQuestion[]> = {
    'course-1': [
      { id: 'q1', type: 'single_choice', question: 'React 中 JSX 最终会被编译成什么？', options: ['原生 HTML', 'JavaScript 函数调用', 'CSS 代码', 'XML 标记'], answer: 1, score: 10 },
      { id: 'q2', type: 'single_choice', question: '以下哪个 Hook 用于管理副作用？', options: ['useState', 'useEffect', 'useContext', 'useReducer'], answer: 1, score: 10 },
      { id: 'q3', type: 'true_false', question: 'React 组件名必须大写字母开头', options: ['正确', '错误'], answer: true, score: 10 },
      { id: 'q4', type: 'single_choice', question: 'Props 在组件间是？', options: ['可变的', '只读的', '异步的', '全局的'], answer: 1, score: 10 },
      { id: 'q5', type: 'true_false', question: 'useState 的更新是同步的', options: ['正确', '错误'], answer: false, score: 10 },
      { id: 'q6', type: 'single_choice', question: '以下哪个不是 React 生命周期方法？', options: ['componentDidMount', 'componentWillUnmount', 'componentRendered', 'componentDidUpdate'], answer: 2, score: 10 },
      { id: 'q7', type: 'true_false', question: '虚拟 DOM 可以提高页面渲染性能', options: ['正确', '错误'], answer: true, score: 10 },
      { id: 'q8', type: 'single_choice', question: 'React 中列表渲染需要使用什么属性？', options: ['id', 'key', 'ref', 'index'], answer: 1, score: 10 },
      { id: 'q9', type: 'single_choice', question: '以下哪个是受控组件的特征？', options: ['由 DOM 控制状态', '由 React state 控制表单值', '使用 ref 获取值', '无需事件处理'], answer: 1, score: 10 },
      { id: 'q10', type: 'true_false', question: 'React.Fragment 可以包含 key 属性', options: ['正确', '错误'], answer: true, score: 10 },
    ],
    'course-2': [
      { id: 'q1', type: 'single_choice', question: 'Python 中列表使用什么符号？', options: ['()', '[]', '{}', '<>'], answer: 1, score: 10 },
      { id: 'q2', type: 'single_choice', question: 'NumPy 数组相比 Python 列表的主要优势是？', options: ['支持更多数据类型', '向量化运算速度快', '占用更少内存', '以上都是'], answer: 3, score: 10 },
      { id: 'q3', type: 'true_false', question: 'Pandas 的 DataFrame 是二维数据结构', options: ['正确', '错误'], answer: true, score: 10 },
      { id: 'q4', type: 'single_choice', question: '以下哪个不是数据可视化的常用库？', options: ['Matplotlib', 'Seaborn', 'NumPy', 'Plotly'], answer: 2, score: 10 },
      { id: 'q5', type: 'true_false', question: '数据清洗是数据分析中最耗时的环节之一', options: ['正确', '错误'], answer: true, score: 10 },
      { id: 'q6', type: 'single_choice', question: '描述性统计不包括以下哪项？', options: ['均值', '标准差', '回归系数', '中位数'], answer: 2, score: 10 },
      { id: 'q7', type: 'true_false', question: '机器学习属于监督学习的一种方法', options: ['正确', '错误'], answer: false, score: 10 },
      { id: 'q8', type: 'single_choice', question: '特征工程的目的是什么？', options: ['增加数据量', '提升模型性能', '减少计算资源', '简化算法'], answer: 1, score: 10 },
      { id: 'q9', type: 'single_choice', question: '以下哪个是降维算法？', options: ['K-Means', 'PCA', '线性回归', '决策树'], answer: 1, score: 10 },
      { id: 'q10', type: 'true_false', question: '交叉验证可以有效防止过拟合', options: ['正确', '错误'], answer: true, score: 10 },
    ],
  }
  return questionSets[courseId] || questionSets['course-1']
}

function openAITest() {
  testQuestions.value = getMockAITierQuestions(courseId)
  testAnswers.value = {}
  testSubmitted.value = false
  testScore.value = 0
  aiTestOpen.value = true
}

function selectAnswer(questionId: string, answer: number | boolean) {
  testAnswers.value = { ...testAnswers.value, [questionId]: answer }
}

function submitAITest() {
  let score = 0
  for (const q of testQuestions.value) {
    const userAnswer = testAnswers.value[q.id]
    if (userAnswer === q.answer) {
      score += q.score
    }
  }
  testScore.value = score
  testSubmitted.value = true

  if (myStudent.value) {
    store.submitAITierTest(courseId, myStudent.value.id, score)
  }
}

function closeAITest() {
  aiTestOpen.value = false
}

const totalQuestions = computed(() => testQuestions.value.length)
const answeredCount = computed(() => Object.keys(testAnswers.value).length)
const allAnswered = computed(() => answeredCount.value === totalQuestions.value)

const aiTips = computed(() => {
  const tier = myTier.value
  if (tier === 'basic') {
    return [
      { title: '基础巩固', desc: '建议回看课程前3章内容，完成所有基础练习题' },
      { title: '重点突破', desc: '核心概念理解还不够深入，推荐观看配套视频讲解' },
      { title: '学习计划', desc: '建议每天安排1小时学习时间，周末可适当增加' },
    ]
  }
  if (tier === 'advanced') {
    return [
      { title: '拓展提升', desc: '基础扎实，可尝试完成课后拓展项目和实战练习' },
      { title: '查漏补缺', desc: '建议重点复习第4-5章薄弱环节，巩固整体知识体系' },
      { title: '能力进阶', desc: '推荐参加线上讨论和组队项目，提升协作实践能力' },
    ]
  }
  return [
    { title: '高阶挑战', desc: '已掌握课程核心内容，建议挑战高级项目和竞赛题目' },
    { title: '知识拓展', desc: '推荐阅读相关领域前沿资料，拓展知识深度和广度' },
    { title: '实践应用', desc: '可以尝试将所学知识应用到实际项目中，产出完整作品' },
  ]
})

// ===== 综合评价 =====
const totalScore = computed(() => {
  const base = myGrade.value?.score ?? null
  if (base === null || !myStudent.value) return null
  return Math.min(100, base + store.getStudentQualityScore(courseId, myStudent.value.id))
})

const classAvgScore = computed(() => {
  const courseGrades = store.grades.filter((g) => g.courseId === courseId)
  if (courseGrades.length === 0) return 0
  return Math.round(courseGrades.reduce((s, g) => s + g.score, 0) / courseGrades.length)
})

const currentCfg = computed(() => store.getGradeConfig(courseId))

const gradeIconMap: Record<string, any> = {
  self: UserCheck,
  intra_group: Users,
  inter_group: MessageSquare,
  teacher: Award,
  mentor: Sparkles,
}

const gradeLabelMap: Record<string, string> = {
  self: '自评',
  intra_group: '组内互评',
  inter_group: '组间互评',
  teacher: '教师评价',
  mentor: '企业导师',
}

const gradeWeightKeyMap: Record<string, keyof import('@/types').GradeWeightConfig> = {
  self: 'selfEvalWeight',
  intra_group: 'peerReviewWeight',
  inter_group: 'interGroupEvalWeight',
  teacher: 'teacherScoreWeight',
  mentor: 'mentorScoreWeight',
}

// ===== 综合评价（基于任务评价，session_number=0） =====

/** 该学生本课程的全部任务评价 */
const myTaskEvals = computed(() =>
  store.evaluations.filter(
    (e) => e.courseId === courseId && e.studentId === myStudent.value?.id && e.sessionNumber === 0
  )
)

/** 按类型聚合平均：与成绩计算保持一致（组内/组间互评去极值，其余普通平均） */
function avgForType(type: string): number | null {
  const list = myTaskEvals.value.filter((e) => e.type === type).map((e) => e.score)
  if (list.length === 0) return null
  if ((type === 'intra_group' || type === 'inter_group') && list.length >= 3) {
    const sorted = [...list].sort((a, b) => a - b).slice(1, -1)
    return Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
  }
  return Math.round(list.reduce((a, b) => a + b, 0) / list.length)
}

/** 任务评价综合分 = 各类型平均 × 成绩配置占比（即平时成绩，仅统计当前评价模板启用的类型） */
const currentComprehensiveScore = computed(() => {
  const cfg = currentCfg.value
  if (!cfg) return null
  let weightedSum = 0
  let totalWeight = 0
  for (const type of studentEvalTypes.value) {
    const avg = avgForType(type)
    const weight = (cfg[gradeWeightKeyMap[type]] as number) || 0
    if (avg !== null && weight > 0) {
      weightedSum += avg * weight
      totalWeight += weight
    }
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null
})

const evalDimensions = computed(() => {
  const dims: { label: string; icon: string; iconBg: string; iconColor: string; barColor: string; score: number; maxScore: number }[] = []
  for (const type of studentEvalTypes.value) {
    const score = avgForType(type)
    if (score !== null) {
      const weight = (currentCfg.value[gradeWeightKeyMap[type]] as number) || 0
      dims.push({
        label: gradeLabelMap[type],
        icon: gradeIconMap[type],
        iconBg: 'bg-brand-600/15',
        iconColor: 'text-brand-600',
        barColor: 'bg-brand-600',
        score,
        maxScore: 100,
      })
    }
  }
  return dims
})

function getFileTypeName(type: string): string {
  const extMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/docx': 'DOC',
    'application/zip': 'ZIP',
    'application/fig': 'FIG',
    'text/markdown': 'MD',
    'text/csv': 'CSV',
    'application/ipynb': 'IPYNB',
    'text/typescript': 'TS',
    'application/pptx': 'PPT',
  }
  return extMap[type] || '文件'
}

function downloadFile(file: CloudFile) {
  alert(`开始下载：${file.name}`)
}

function isHomeworkSubmitted(homeworkId: string): boolean {
  if (!myStudent.value) return false
  return !!store.getHomeworkSubmission(homeworkId, myStudent.value.id)
}

function getSubmissionFileName(homeworkId: string): string {
  if (!myStudent.value) return ''
  const submission = store.getHomeworkSubmission(homeworkId, myStudent.value.id)
  return submission?.fileName || ''
}

function downloadSubmission(homeworkId: string) {
  if (!myStudent.value) return
  const submission = store.getHomeworkSubmission(homeworkId, myStudent.value.id)
  if (submission) {
    alert(`开始下载已提交作业：${submission.fileName}`)
  }
}

function handleFileSelect(event: Event, homeworkId: string) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFiles.value[homeworkId] = file
  }
}

function submitHomework(hw: typeof courseHomework.value[0]) {
  if (!myStudent.value || !selectedFiles.value[hw.id]) return
  
  const file = selectedFiles.value[hw.id]
  
  store.submitHomework({
    id: `sub-${Date.now()}`,
    homeworkId: hw.id,
    courseId: courseId,
    studentId: myStudent.value.id,
    submittedAt: getNow().toISOString().split('T')[0],
    fileName: file.name,
    fileDataUrl: 'https://example.com/submissions/' + file.name,
    fileSize: file.size,
    fileType: file.type,
  })
  
  delete selectedFiles.value[hw.id]
  alert('作业提交成功！')
}

// ====== 素质评价 ======
const qualityDesc = ref('')
const qualityPendingFiles = ref<QualityEvalFile[]>([])
const qualitySubmitError = ref('')
const qualityFileInputRef = ref<HTMLInputElement | null>(null)

const myQualityRecord = computed(() => {
  if (!myStudent.value) return undefined
  return store.getStudentQualityEvaluation(courseId, myStudent.value.id)
})

// 历史提交列表（最新在前）
const myQualitySubmissions = computed(() => {
  const rec = myQualityRecord.value
  if (!rec) return []
  return [...rec.submissions].reverse()
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

async function handleQualityFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  qualitySubmitError.value = ''
  // 总大小限制（base64 存储于 localStorage，避免撑爆配额）
  const totalSize = qualityPendingFiles.value.reduce((s, f) => s + f.fileSize, 0)
  for (const file of Array.from(files)) {
    if (file.size > 2 * 1024 * 1024) {
      qualitySubmitError.value = `文件 ${file.name} 超过 2MB，已跳过`
      continue
    }
    if (totalSize + file.size > 4 * 1024 * 1024) {
      qualitySubmitError.value = `文件总大小超过 4MB，已停止添加（当前已选 ${(totalSize / 1024 / 1024).toFixed(1)}MB）`
      break
    }
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      qualityPendingFiles.value.push({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dataUrl,
      })
    } catch {
      qualitySubmitError.value = `文件 ${file.name} 读取失败`
    }
  }
  input.value = ''
}

function submitQuality() {
  if (!myStudent.value) return
  qualitySubmitError.value = ''

  // 多次提交：每次提交必须有新的文件
  if (qualityPendingFiles.value.length === 0) {
    qualitySubmitError.value = '请至少上传一份文件'
    return
  }

  store.submitQualityEvaluation({
    courseId,
    studentId: myStudent.value.id,
    files: qualityPendingFiles.value,
    description: qualityDesc.value,
  })

  // 清空本地状态
  qualityPendingFiles.value = []
  qualityDesc.value = ''
  alert('素质评价提交成功！请等待教师批改。')
}
</script>