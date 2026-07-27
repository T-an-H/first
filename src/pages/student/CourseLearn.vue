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

            <!-- 逾期未测，自动分配基础层 -->
            <div v-else-if="secondClassStarted && !tierFinalized" class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <XCircle class="w-12 h-12 mx-auto mb-3 text-red-400" />
              <h3 class="text-lg font-semibold text-red-700 mb-2">测试窗口已关闭</h3>
              <p class="text-sm text-red-600 mb-4">第二节课已开始，AI 分层测试逾期未完成，已自动分配到基础层</p>
              <div class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                <Layers class="w-4 h-4 text-brand-600" />
                <span class="text-sm font-bold text-gray-800">基础层</span>
              </div>
              <p class="text-xs text-gray-400 mt-4">本学期不可修改，后续任务、资源、作业将根据基础层进行适配</p>
            </div>

            <!-- 已分层 → 永久锁定展示 -->
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
                      <p class="text-2xl font-bold text-blue-600">{{ myTierScore }}</p>
                      <p class="text-xs text-gray-400">/ {{ totalQuestions * 10 }}分</p>
                    </div>
                  </div>

                  <!-- 锁定提示 -->
                  <div class="mt-3 flex items-center gap-2 px-3 py-2 bg-brand-400/10/80 rounded-lg text-xs text-gray-400">
                    <Lock class="w-3.5 h-3.5" />
                    <span>AI 分层结果已锁定，本学期不可更改。后续任务、资源、作业将根据 {{ tierLabel }} 进行适配</span>
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

              <!-- 分层对比 -->
              <div>
                <h3 class="text-sm font-semibold text-gray-800 mb-3">层级对照</h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div v-for="ct in tierComparison" :key="ct.level"
                    class="p-3 rounded-lg border"
                    :class="ct.level === myTier ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' : 'border-brand-400/20'">
                    <p class="text-xs font-semibold mb-1" :class="ct.color">{{ ct.label }}</p>
                    <p class="text-xs text-gray-400">{{ ct.desc }}</p>
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

          <!-- ===== 知识图谱 (泡泡图) ===== -->
          <div v-if="activeTab === 'knowledge_graph'" class="space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-gray-800">知识点掌握图谱</h3>
                <p class="text-xs text-gray-400">基于学习进度与评价数据自动生成 · 泡泡越大表示知识越重要 · 颜色越深表示掌握度越高</p>
              </div>
              <span class="text-xs text-gray-400">点击泡泡查看详情</span>
            </div>

            <!-- 泡泡视图 -->
            <!-- 分类图例 + 关联图例 -->
              <div class="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-400 items-center">
                <span v-for="cat in categoryColors" :key="cat.key" class="flex items-center gap-1.5">
                  <span class="w-3 h-3 rounded-full" :style="{ background: cat.mid }" />
                  {{ cat.label }}
                </span>
                <span class="text-gray-400/60">|</span>
                <span v-for="rel in relationLegend" :key="rel.key" class="flex items-center gap-1.5">
                  <svg width="20" height="4" class="overflow-visible"><line x1="0" y1="2" x2="20" y2="2" :stroke="rel.color" stroke-width="2" :stroke-dasharray="rel.dash" /></svg>
                  {{ rel.label }}
                </span>
              </div>

              <!-- SVG 知识图谱 -->
              <div class="relative bg-white rounded-xl border border-brand-400/20 overflow-hidden">
                <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="w-full" style="min-height: 780px">
                  <!-- 背景网格 -->
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="0.5" />
                    </pattern>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  <!-- 分类环带 -->
                  <g v-for="(ring, ri) in categoryRings" :key="ri">
                    <ellipse :cx="SVG_CX" :cy="SVG_CY" :rx="ring.rx" :ry="ring.ry"
                      fill="none" :stroke="ring.color" stroke-width="1" stroke-dasharray="4,4" stroke-opacity="0.3" />
                    <text :x="SVG_CX + ring.rx - 4" :y="SVG_CY - ring.ry + 16" font-size="10" :fill="ring.color" fill-opacity="0.5" text-anchor="end">{{ ring.label }}</text>
                  </g>

                  <!-- 关联连线 -->
                  <g v-for="(edge, ei) in renderedEdges" :key="'edge-' + ei">
                    <path :d="edge.path" fill="none"
                      :stroke="edge.color" :stroke-width="edge.width" :stroke-dasharray="edge.dash"
                      stroke-linecap="round" opacity="0.5"
                      class="transition-all duration-300"
                      :class="{ 'opacity-100': selectedBubble && (edge.source === selectedBubble || edge.target === selectedBubble) }" />
                    <!-- 箭头标记 -->
                    <polygon :points="edge.arrow" :fill="edge.color" opacity="0.5"
                      :class="{ 'opacity-100': selectedBubble && (edge.source === selectedBubble || edge.target === selectedBubble) }" />
                    <!-- 关系标签（连线中间） -->
                    <text :x="edge.midX" :y="edge.midY" font-size="8" :fill="edge.color"
                      text-anchor="middle" dominant-baseline="middle" opacity="0.6"
                      class="pointer-events-none select-none">
                      {{ edge.label }}
                    </text>
                  </g>

                  <!-- 知识点节点 -->
                  <g v-for="pn in positionedNodes" :key="pn.node.id"
                    @click="selectedBubble = selectedBubble === pn.node.id ? null : pn.node.id"
                    class="cursor-pointer"
                    :class="{ 'selected-node': selectedBubble === pn.node.id }">
                    <!-- hover 提示 -->
                    <title>{{ pn.node.label }} - {{ pn.node.mastery }}% ({{ pn.node.chapter }})</title>
                    <!-- 阴影光晕（选中/大掌握度） -->
                    <circle v-if="pn.node.mastery >= 75" :cx="pn.x" :cy="pn.y" :r="pn.r + 6"
                      :fill="pn.fill" opacity="0.15" filter="url(#glow)" />
                    <!-- 外圈（选中时高亮） -->
                    <circle :cx="pn.x" :cy="pn.y" :r="pn.r + 3"
                      fill="none" :stroke="pn.fill" stroke-width="2"
                      :class="selectedBubble === pn.node.id ? 'opacity-100' : 'opacity-0'"
                      class="transition-opacity duration-200" />
                    <!-- 主体圆 -->
                    <circle :cx="pn.x" :cy="pn.y" :r="pn.r"
                      :fill="pn.fill" stroke="white" stroke-width="2"
                      class="transition-all duration-200 hover:brightness-110"
                      :style="{ filter: pn.node.mastery >= 80 ? 'drop-shadow(0 2px 6px ' + pn.fill + '66)' : 'none' }" />
                    <!-- 文字 - 知识点名称（圆内居中，根据泡泡大小自适应字号） -->
                    <text :x="pn.x" :y="pn.y + 1" :font-size="bubbleFontSize(pn.r)" font-weight="700"
                      fill="white" text-anchor="middle" dominant-baseline="central"
                      class="pointer-events-none select-none">
                      {{ pn.node.label }}
                    </text>
                  </g>

                  <!-- 无节点提示 -->
                  <text v-if="positionedNodes.length === 0" x="50%" y="50%" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">暂无知识点数据</text>
                </svg>
              </div>

              <!-- 选中节点的详情 -->
              <div v-if="selectedBubble && bubbleNode(selectedBubble)" class="bg-brand-400/5 rounded-xl p-4 border border-brand-400/30 space-y-2">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full" :style="{ background: bubbleColor(bubbleNode(selectedBubble)?.mastery ?? 50, bubbleNode(selectedBubble)?.category ?? 'foundation') }" />
                  <p class="text-sm font-bold text-gray-800">{{ bubbleNode(selectedBubble)?.label }}</p>
                  <span class="text-xs px-1.5 py-0.5 rounded bg-brand-400/10 text-brand-600">{{ bubbleNode(selectedBubble)?.chapter }}</span>
                </div>
                <p class="text-xs text-gray-400">{{ bubbleNode(selectedBubble)?.description }}</p>
                <div class="flex items-center gap-3 text-xs">
                  <span class="text-gray-400">掌握度</span>
                  <div class="flex-1 h-2 bg-brand-400/10 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :style="{ width: (bubbleNode(selectedBubble)?.mastery ?? 0) + '%', background: bubbleColor(bubbleNode(selectedBubble)?.mastery ?? 50, bubbleNode(selectedBubble)?.category ?? 'foundation') }" />
                  </div>
                  <span class="font-bold" :style="{ color: bubbleColor(bubbleNode(selectedBubble)?.mastery ?? 50, bubbleNode(selectedBubble)?.category ?? 'foundation') }">{{ bubbleNode(selectedBubble)?.mastery }}%</span>
                </div>
                <!-- 选中节点的关联 -->
                <div v-if="bubbleEdges(selectedBubble).length > 0" class="pt-1 border-t border-brand-400/30">
                  <p class="text-[11px] text-gray-400 mb-1">关联关系</p>
                  <div v-for="edge in bubbleEdges(selectedBubble)" :key="edge.source + edge.target"
                    class="text-xs text-brand-600 flex items-center gap-1.5">
                    <span :class="edge.source === selectedBubble ? 'font-semibold' : ''">{{ nodeLabel(edge.source) }}</span>
                    <ArrowRight class="w-3 h-3 text-gray-400" />
                    <span class="px-1 py-0.5 rounded text-[10px]" :class="relationChipClass(edge.relation)">{{ edge.label }}</span>
                    <ArrowRight class="w-3 h-3 text-gray-400" />
                    <span :class="edge.target === selectedBubble ? 'font-semibold' : ''">{{ nodeLabel(edge.target) }}</span>
                  </div>
                </div>
              </div>


          </div>

          <!-- ===== 任务 ===== -->
          <div v-if="activeTab === 'tasks'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程任务</h3>
            <div class="space-y-2">
              <div v-for="task in courseTasks" :key="task.id"
                class="flex items-center justify-between p-3 rounded-lg border border-brand-400/20 hover:bg-brand-400/5">
                <div class="flex items-center gap-3">
                  <CheckCircle v-if="task.completed" class="w-5 h-5 text-emerald-500" />
                  <Circle v-else class="w-5 h-5 text-gray-400/60" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ task.title }}</p>
                    <p v-if="task.dueDate" class="text-xs text-gray-400">截止：{{ task.dueDate }}</p>
                  </div>
                </div>
                <span v-if="task.score !== undefined" class="text-sm font-bold text-blue-600">{{ task.score }}分</span>
              </div>
              <div v-if="courseTasks.length === 0" class="text-center py-8 text-gray-400">暂无任务</div>
            </div>
          </div>

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
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-800">课程作业</h3>
              <span class="text-xs text-gray-400">{{ submittedCount }}/{{ courseHomework.length }} 已提交</span>
            </div>
            <div class="space-y-3">
              <div v-for="hw in courseHomework" :key="hw.id" class="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ hw.title }}</p>
                    <p v-if="hw.description" class="text-xs text-gray-500 mt-1">{{ hw.description }}</p>
                    <p class="text-xs text-gray-400 mt-2">截止：{{ hw.dueDate }} · 创建者：{{ hw.createdBy }}</p>
                  </div>
                  <span v-if="isHomeworkSubmitted(hw.id)" class="px-2 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full">已提交</span>
                  <span v-else class="px-2 py-1 text-xs font-medium text-brand-700 bg-brand-50 rounded-full">未提交</span>
                </div>
                <div v-if="isHomeworkSubmitted(hw.id)" class="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <FileText class="w-4 h-4 text-gray-400" />
                  <span class="text-xs text-gray-500">已提交：{{ getSubmissionFileName(hw.id) }}</span>
                  <button @click="downloadSubmission(hw.id)" class="ml-auto p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Download class="w-4 h-4" />
                  </button>
                </div>
                <div v-else class="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <label class="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                    <Upload class="w-4 h-4" />
                    <span>选择文件</span>
                    <input type="file" :data-homework-id="hw.id" @change="handleFileSelect($event, hw.id)" class="hidden" />
                  </label>
                  <button v-if="selectedFiles[hw.id]" @click="submitHomework(hw)" class="px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
                    提交作业
                  </button>
                  <span v-if="selectedFiles[hw.id]" class="text-xs text-gray-500">{{ selectedFiles[hw.id].name }}</span>
                </div>
              </div>
              <div v-if="courseHomework.length === 0" class="text-center py-8 text-gray-400">暂无作业</div>
            </div>
          </div>

          <!-- ===== 评价填写 ===== -->
          <div v-if="activeTab === 'evaluations'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程评价</h3>
            <div v-if="isReadOnly" class="bg-brand-400/5 border border-brand-400/30 rounded-xl p-6 text-center text-sm text-gray-400">
              <Eye class="w-8 h-8 mx-auto mb-2 text-gray-400/60" />
              <p>课程已结束，评价填写功能已关闭</p>
              <p class="text-xs mt-1">如需查看评价记录，请在"综合评价"中查看</p>
            </div>
            <StudentEvaluation v-else :course-id="courseId" :student-id="myStudent?.id || ''"
              :student-name="myStudent?.name || store.currentUser || ''" />
          </div>

          <!-- ===== 综合评价 ===== -->
          <div v-if="activeTab === 'eval_overview'" class="space-y-6">
            <!-- 综合成绩卡片 -->
            <div>
              <h3 class="text-sm font-semibold text-gray-800 mb-3">综合评价</h3>
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="text-xs text-gray-400 mb-1">课程总评</p>
                    <p class="text-3xl font-bold text-blue-600">{{ totalScore ?? '-' }}<span class="text-base text-gray-400">分</span></p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-400">班级平均</p>
                    <p class="text-xl font-semibold text-brand-600">{{ classAvgScore }}分</p>
                  </div>
                </div>
                <!-- 分数条对比 -->
                <div class="relative h-3 bg-brand-400/10 rounded-full overflow-hidden">
                  <div class="absolute top-0 h-full w-0.5 bg-red-400 z-10" :style="{ left: classAvgScore + '%' }" />
                  <div v-if="totalScore" class="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                    :style="{ width: Math.min(totalScore, 100) + '%' }" />
                </div>
                <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span class="text-red-400">平均{{ classAvgScore }}</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            <!-- 评价细分 -->
            <div>
              <h3 class="text-sm font-semibold text-gray-800 mb-3">评价维度细分</h3>
              <div class="space-y-3">
                <div v-for="dim in evalDimensions" :key="dim.label"
                  class="flex items-center gap-3 p-3 rounded-lg border border-brand-400/20">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    :class="dim.iconBg">
                    <component :is="dim.icon" class="w-4 h-4" :class="dim.iconColor" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">{{ dim.label }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <div class="flex-1 bg-brand-400/10 rounded-full h-2 overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500" :class="dim.barColor"
                          :style="{ width: (dim.score / (dim.maxScore || 100) * 100) + '%' }" />
                      </div>
                      <span class="text-xs font-medium text-brand-600 w-12 text-right">
                        {{ dim.score }}<span class="text-gray-400">/{{ dim.maxScore || 100 }}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="evalDimensions.length === 0" class="text-center py-6 text-gray-400">暂无评价数据</div>
              </div>
            </div>

            <!-- 成绩权重说明 -->
            <div v-if="currentCfg" class="bg-brand-50 rounded-xl p-4 border border-brand-200 text-sm text-brand-800">
              <p class="font-medium mb-1">成绩构成</p>
              <p>总成绩 = 平时成绩({{ currentCfg.regularWeight }}%) + 期中成绩({{ currentCfg.midtermWeight }}%) + 期末成绩({{ currentCfg.finalWeight }}%)</p>
              <p class="text-xs text-brand-700 mt-1">
                平时成绩构成：自评({{ currentCfg.selfEvalWeight }}%) + 互评({{ currentCfg.peerReviewWeight }}%) + 组间评({{ currentCfg.interGroupEvalWeight }}%) + 教师({{ currentCfg.teacherScoreWeight }}%) + 导师({{ currentCfg.mentorScoreWeight }}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 右侧栏（D3 渲染） ===== -->
      <div class="lg:col-span-1" id="course-learn-sidebar"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  ArrowLeft, BookOpen, FileText, ClipboardCheck, Edit3,
  CheckCircle, Circle, Layers, GitBranch, Award, Sparkles, UserCheck, Users, MessageSquare, ArrowRight, Eye, HelpCircle, Lock, XCircle,
  Download, Upload
} from 'lucide-vue-next'
import StudentEvaluation from '@/components/StudentEvaluation.vue'
import type { AITierQuestion, LearningTier, CloudFile } from '@/types'
import Modal from '@/components/Modal.vue'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const courseId = route.params.id as string
const myStudent = computed(() => store.students.find((s) => s.name === store.currentUser))
const activeTab = ref('tasks')
const selectedFiles = ref<Record<string, File>>({})

onMounted(() => {
  store.pushNearDeadlineEvalReminders()
  if (myStudent.value) {
    store.autoAssignOverdueBasicTier(courseId, myStudent.value.id)
  }
})

const tabs = [
  { id: 'ai_tier', label: 'AI分层', icon: Layers },
  { id: 'knowledge_graph', label: '知识图谱', icon: GitBranch },
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

// ===== 任务（按层级区分） =====
const courseTasks = computed(() => {
  const tier = tierFinalized.value ? myTier.value : 'basic'
  const basicTasks = [
    { id: '1', title: '完成第1章基础概念学习', dueDate: '2025-03-15', completed: true, score: 85 },
    { id: '2', title: '完成第2章基础知识练习', dueDate: '2025-03-22', completed: true, score: 78 },
    { id: '3', title: '完成第3章基础巩固任务', dueDate: '2025-03-29', completed: false },
    { id: '4', title: '完成第4章基础应用练习', dueDate: '2025-04-05', completed: false },
  ]
  const advancedTasks = [
    { id: '1', title: '完成第1章核心概念深入学习', dueDate: '2025-03-15', completed: true, score: 92 },
    { id: '2', title: '完成第2章进阶实践项目', dueDate: '2025-03-22', completed: true, score: 88 },
    { id: '3', title: '完成第3章拓展分析任务', dueDate: '2025-03-29', completed: false },
    { id: '4', title: '完成第4章综合应用项目', dueDate: '2025-04-05', completed: false },
  ]
  const excellentTasks = [
    { id: '1', title: '完成第1章高阶理论探究', dueDate: '2025-03-15', completed: true, score: 97 },
    { id: '2', title: '完成第2章创新实践项目', dueDate: '2025-03-22', completed: true, score: 95 },
    { id: '3', title: '完成第3章跨章节整合任务', dueDate: '2025-03-29', completed: false },
    { id: '4', title: '完成开源项目贡献任务', dueDate: '2025-04-05', completed: false },
  ]
  if (tier === 'excellent') return excellentTasks
  if (tier === 'advanced') return advancedTasks
  return basicTasks
})

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
// 是否逾期自动分配（score=0 且第二节课已开始）
const isAutoAssigned = computed(() =>
  tierFinalized.value && secondClassStarted.value && myTierScore.value === 0
)

const tierLabel = computed(() => {
  const map = { basic: '基础层', advanced: '进阶层', excellent: '卓越层' }
  return tierFinalized.value ? map[myTier.value] : '未分层'
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

const tierComparison = computed(() => [
  { level: 'basic' as const, label: '基础层', color: 'text-brand-700', desc: '初步掌握课程基础知识，建议加强练习与复习' },
  { level: 'advanced' as const, label: '进阶层', color: 'text-blue-600', desc: '较好掌握课程核心知识，可尝试拓展深入学习' },
  { level: 'excellent' as const, label: '卓越层', color: 'text-emerald-600', desc: '全面掌握课程内容，具备独立项目实践能力' },
])

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

// ===== 知识图谱 (节点 + 边) =====
interface KnowledgeNode {
  id: string
  label: string
  mastery: number
  importance: number
  category: 'foundation' | 'core' | 'advanced' | 'comprehensive'
  chapter: string
  description: string
}

interface KnowledgeEdge {
  source: string
  target: string
  relation: 'prerequisite' | 'related_to' | 'extends' | 'part_of'
  label: string
}

interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

function generateKnowledgeGraph(courseId: string, studentId: string): KnowledgeGraph {
  const evals = store.evaluations.filter((e) => e.courseId === courseId && e.studentId === studentId)
  const avgEvalScore = evals.length > 0
    ? Math.round(evals.reduce((s, e) => s + e.score, 0) / evals.length)
    : 60
  const progress = myEnrollment.value?.progress ?? 50

  const masteryFor = (base: number): number => Math.min(95, Math.max(20, (base + avgEvalScore + progress) / 2))

  const graphs: Record<string, { nodes: Omit<KnowledgeNode, 'mastery' | 'importance'>[]; edges: KnowledgeEdge[] }> = {
    'course-1': {
      nodes: [
        { id: 'kp-1', label: 'JS语法基础', category: 'foundation', chapter: '第1章', description: '变量、作用域、闭包、原型链等 JS 核心语法' },
        { id: 'kp-2', label: 'React核心概念', category: 'foundation', chapter: '第1章', description: 'JSX、组件化、Props、State 等 React 基础' },
        { id: 'kp-3', label: 'Hooks体系', category: 'core', chapter: '第2章', description: 'useState、useEffect、useContext 等内置 Hooks' },
        { id: 'kp-4', label: '状态管理', category: 'core', chapter: '第2章', description: 'Context API、Reducer、状态提升与共享策略' },
        { id: 'kp-5', label: '组件通信', category: 'core', chapter: '第3章', description: '父子传值、跨层通信、Event Bus 模式' },
        { id: 'kp-6', label: '路由与导航', category: 'core', chapter: '第3章', description: 'React Router 路由配置、嵌套路由、路由守卫' },
        { id: 'kp-7', label: '性能优化', category: 'advanced', chapter: '第4章', description: 'Memo、useCallback、Lazy Loading、虚拟列表' },
        { id: 'kp-8', label: '测试与调试', category: 'advanced', chapter: '第4章', description: 'Jest、React Testing Library、Debug 技巧' },
        { id: 'kp-9', label: '企业级架构', category: 'advanced', chapter: '第5章', description: 'Monorepo、微前端、CI/CD、工程化实践' },
        { id: 'kp-10', label: '综合项目实战', category: 'comprehensive', chapter: '项目', description: '从零搭建完整企业级应用的端到端能力' },
      ],
      edges: [
        { source: 'kp-1', target: 'kp-2', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-3', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-4', relation: 'related_to', label: '相关联' },
        { source: 'kp-3', target: 'kp-5', relation: 'extends', label: '拓展延伸' },
        { source: 'kp-4', target: 'kp-6', relation: 'related_to', label: '相关联' },
        { source: 'kp-3', target: 'kp-7', relation: 'extends', label: '深入扩展' },
        { source: 'kp-5', target: 'kp-8', relation: 'related_to', label: '实践关联' },
        { source: 'kp-7', target: 'kp-9', relation: 'extends', label: '进阶方向' },
        { source: 'kp-6', target: 'kp-9', relation: 'related_to', label: '组合构建' },
        { source: 'kp-9', target: 'kp-10', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-8', target: 'kp-10', relation: 'related_to', label: '实践关联' },
      ],
    },
    'course-2': {
      nodes: [
        { id: 'kp-1', label: 'Python基础', category: 'foundation', chapter: '第1章', description: '数据类型、控制流、函数、面向对象基础' },
        { id: 'kp-2', label: 'NumPy数组计算', category: 'foundation', chapter: '第1章', description: '多维数组、广播机制、向量化运算' },
        { id: 'kp-3', label: 'Pandas数据处理', category: 'core', chapter: '第2章', description: 'DataFrame操作、数据清洗、分组聚合' },
        { id: 'kp-4', label: '数据可视化', category: 'core', chapter: '第2章', description: 'Matplotlib、Seaborn 图表绘制' },
        { id: 'kp-5', label: '统计分析基础', category: 'core', chapter: '第3章', description: '描述统计、假设检验、相关分析' },
        { id: 'kp-6', label: '机器学习入门', category: 'advanced', chapter: '第4章', description: '监督学习、无监督学习基础算法' },
        { id: 'kp-7', label: '特征工程', category: 'advanced', chapter: '第4章', description: '特征选择、降维、数据变换' },
        { id: 'kp-8', label: '综合数据项目', category: 'comprehensive', chapter: '项目', description: '端到端数据分析项目实战能力' },
      ],
      edges: [
        { source: 'kp-1', target: 'kp-2', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-3', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-3', target: 'kp-4', relation: 'related_to', label: '相关联' },
        { source: 'kp-3', target: 'kp-5', relation: 'extends', label: '深入方向' },
        { source: 'kp-5', target: 'kp-6', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-4', target: 'kp-7', relation: 'related_to', label: '实践关联' },
        { source: 'kp-6', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-7', target: 'kp-8', relation: 'related_to', label: '实践关联' },
      ],
    },
    'course-14': {
      nodes: [
        { id: 'kp-1', label: '大模型基础', category: 'foundation', chapter: '第1章', description: 'Transformer 架构、预训练与微调概念' },
        { id: 'kp-2', label: 'Prompt工程', category: 'foundation', chapter: '第1章', description: '提示词设计、Few-shot、思维链技巧' },
        { id: 'kp-3', label: 'API调用集成', category: 'core', chapter: '第2章', description: 'OpenAI API、流式响应、Token管理' },
        { id: 'kp-4', label: 'RAG检索增强', category: 'core', chapter: '第2章', description: '文档索引、向量数据库、语义检索' },
        { id: 'kp-5', label: 'Agent智能体', category: 'core', chapter: '第3章', description: '函数调用、工具链、多智能体协作' },
        { id: 'kp-6', label: '微调与部署', category: 'advanced', chapter: '第3章', description: 'LoRA微调、模型量化、推理优化' },
        { id: 'kp-7', label: '应用安全与评估', category: 'advanced', chapter: '第4章', description: '内容过滤、越狱防护、效果评估' },
        { id: 'kp-8', label: 'AI应用综合开发', category: 'comprehensive', chapter: '项目', description: '打通前/后端+AI能力的完整应用构建' },
      ],
      edges: [
        { source: 'kp-1', target: 'kp-2', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-3', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-1', target: 'kp-4', relation: 'related_to', label: '相关联' },
        { source: 'kp-3', target: 'kp-5', relation: 'extends', label: '进阶方向' },
        { source: 'kp-4', target: 'kp-5', relation: 'related_to', label: '组合构建' },
        { source: 'kp-1', target: 'kp-6', relation: 'extends', label: '深入方向' },
        { source: 'kp-5', target: 'kp-7', relation: 'related_to', label: '实践关联' },
        { source: 'kp-3', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-5', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-6', target: 'kp-8', relation: 'related_to', label: '实践关联' },
      ],
    },
    'course-3': {
      nodes: [
        { id: 'kp-1', label: '设计基础理论', category: 'foundation', chapter: '第1章', description: '色彩理论、排版原则、视觉层级' },
        { id: 'kp-2', label: '用户研究方法', category: 'foundation', chapter: '第1章', description: '用户访谈、问卷、可用性测试方法' },
        { id: 'kp-3', label: '信息架构', category: 'core', chapter: '第2章', description: '内容组织、导航设计、心智模型' },
        { id: 'kp-4', label: '交互设计', category: 'core', chapter: '第2章', description: '用户流程、交互模式、反馈机制' },
        { id: 'kp-5', label: '原型设计', category: 'core', chapter: '第3章', description: '线框图、高保真原型、设计系统' },
        { id: 'kp-6', label: '视觉设计进阶', category: 'advanced', chapter: '第3章', description: '动效设计、微交互、品牌视觉统一' },
        { id: 'kp-7', label: '设计交付与开发', category: 'advanced', chapter: '第4章', description: '标注切图、设计Token、开发协作' },
        { id: 'kp-8', label: '全链路设计项目', category: 'comprehensive', chapter: '项目', description: '从用户研究到上线跟踪的完整设计流程' },
      ],
      edges: [
        { source: 'kp-1', target: 'kp-3', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-3', relation: 'related_to', label: '互补关联' },
        { source: 'kp-3', target: 'kp-4', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-4', target: 'kp-5', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-1', target: 'kp-6', relation: 'extends', label: '进阶方向' },
        { source: 'kp-5', target: 'kp-7', relation: 'related_to', label: '实践关联' },
        { source: 'kp-4', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-5', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-6', target: 'kp-8', relation: 'related_to', label: '实践关联' },
      ],
    },
  }

  const defaultGraph = graphs['course-1']
  const courseGraph = graphs[courseId] || defaultGraph

  const catGroups: Record<string, typeof courseGraph.nodes> = {}
  for (const n of courseGraph.nodes) {
    if (!catGroups[n.category]) catGroups[n.category] = []
    catGroups[n.category].push(n)
  }
  const catIdx: Record<string, number> = {}

  const nodes: KnowledgeNode[] = courseGraph.nodes.map((n) => {
    const ci = catIdx[n.category] ?? 0
    catIdx[n.category] = ci + 1

    let importance = 2
    if (n.category === 'foundation' || n.category === 'comprehensive') importance = 3
    else if (n.category === 'core') importance = ci < 2 ? 3 : 2
    else if (n.category === 'advanced') importance = ci < 1 ? 2 : 1

    return {
      ...n,
      mastery: masteryFor(
        n.category === 'foundation' ? 70 + Math.floor(Math.random() * 20) :
        n.category === 'core' ? 50 + Math.floor(Math.random() * 30) :
        n.category === 'advanced' ? 30 + Math.floor(Math.random() * 35) :
        20 + Math.floor(Math.random() * 50)
      ),
      importance,
    }
  })

  return { nodes, edges: courseGraph.edges }
}

const knowledgeGraphData = computed<KnowledgeGraph>(() =>
  generateKnowledgeGraph(courseId, myStudent.value?.id || '')
)

// ===== 知识图谱 SVG 可视化 =====

function nodeLabel(id: string): string {
  const n = knowledgeGraphData.value.nodes.find((n) => n.id === id)
  return n ? n.label : id
}

const SVG_W = 900
const SVG_H = 800
const SVG_CX = SVG_W / 2
const SVG_CY = 460

const categoryRings = computed(() => {
  const rings: { rx: number; ry: number; color: string; label: string }[] = []
  const radii = [145, 240, 330, 415]
  const ringColors = ['#5eb6b9', '#5eb6b9', '#5eb6b9', '#5eb6b9']
  const ringLabels = ['基础知识', '核心知识', '进阶能力', '综合能力']
  for (let i = 0; i < radii.length; i++) {
    rings.push({ rx: radii[i], ry: radii[i] * 0.78, color: ringColors[i], label: ringLabels[i] })
  }
  return rings
})

const relationLegend = [
  { key: 'prerequisite', label: '前置依赖', color: '#429fc4', dash: '' },
  { key: 'related_to', label: '相关联', color: '#5eb6b9', dash: '5,4' },
  { key: 'extends', label: '拓展延伸', color: '#429fc4', dash: '3,5' },
  { key: 'part_of', label: '组成关系', color: '#429fc4', dash: '7,4' },
]

const categoryColors = [
  { key: 'foundation', label: '基础知识', light: '#93c5fd', mid: '#3b82f6', deep: '#1d4ed8' },
  { key: 'core', label: '核心知识', light: '#86efac', mid: '#22c55e', deep: '#15803d' },
  { key: 'advanced', label: '进阶能力', light: '#fde68a', mid: '#f59e0b', deep: '#b45309' },
  { key: 'comprehensive', label: '综合能力', light: '#c4b5fd', mid: '#8b5cf6', deep: '#6d28d9' },
]

function categoryColorMap(cat: string): { light: string; mid: string; deep: string } {
  return categoryColors.find((c) => c.key === cat) || categoryColors[0]
}

function bubbleColor(mastery: number, category: string): string {
  const cc = categoryColorMap(category)
  if (mastery >= 80) return cc.deep
  if (mastery >= 50) return cc.mid
  return cc.light
}

function bubbleSize(importance: number): number {
  return importance === 3 ? 55 : importance === 2 ? 42 : 30
}

function bubbleFontSize(r: number): number {
  return r >= 50 ? 14 : r >= 38 ? 12 : 10
}

interface PositionedNode {
  x: number
  y: number
  r: number
  fill: string
  node: KnowledgeNode
}

const positionedNodes = computed<PositionedNode[]>(() => {
  const nodes = knowledgeGraphData.value.nodes
  const categoryRadius: Record<string, number> = {
    foundation: 145,
    core: 240,
    advanced: 330,
    comprehensive: 415,
  }
  const ringAngleOffsets: Record<string, number> = {
    foundation: 0,
    core: 30,
    advanced: -25,
    comprehensive: 20,
  }

  const grouped: Record<string, KnowledgeNode[]> = {}
  for (const n of nodes) {
    if (!grouped[n.category]) grouped[n.category] = []
    grouped[n.category].push(n)
  }

  const result: PositionedNode[] = []
  for (const [cat, catNodes] of Object.entries(grouped)) {
    const r = categoryRadius[cat] || 160
    const count = catNodes.length
    const arcDeg = Math.min(200, 60 + count * 30)
    const arcRad = (arcDeg * Math.PI) / 180
    const offsetRad = ((ringAngleOffsets[cat] || 0) * Math.PI) / 180
    const startAngle = -Math.PI / 2 - arcRad / 2 + offsetRad
    const step = count > 1 ? arcRad / (count - 1) : 0

    catNodes.forEach((node, i) => {
      const angle = startAngle + step * i
      const radius = bubbleSize(node.importance)
      const fill = bubbleColor(node.mastery, cat)
      result.push({
        x: SVG_CX + r * Math.cos(angle),
        y: SVG_CY + r * Math.sin(angle),
        r: radius,
        fill,
        node,
      })
    })
  }

  const MIN_GAP = 14
  for (let iter = 0; iter < 3; iter++) {
    let moved = false
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]
        const b = result[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = a.r + b.r + MIN_GAP
        if (dist < minDist && dist > 0.01) {
          const push = (minDist - dist) / 2
          const nx = dx / dist
          const ny = dy / dist
          a.x -= nx * push
          a.y -= ny * push
          b.x += nx * push
          b.y += ny * push
          moved = true
        }
      }
    }
    if (!moved) break
  }

  return result
})

interface RenderedEdge {
  source: string
  target: string
  path: string
  arrow: string
  midX: number
  midY: number
  label: string
  color: string
  dash: string
  width: number
}

const renderedEdges = computed<RenderedEdge[]>(() => {
  const posMap = new Map<string, { x: number; y: number; r: number }>()
  for (const pn of positionedNodes.value) {
    posMap.set(pn.node.id, { x: pn.x, y: pn.y, r: pn.r })
  }

  const edgeStyles: Record<string, { color: string; dash: string; width: number }> = {
    prerequisite: { color: '#429fc4', dash: '', width: 2 },
    related_to: { color: '#5eb6b9', dash: '5,3', width: 1.5 },
    extends: { color: '#429fc4', dash: '3,4', width: 1.5 },
    part_of: { color: '#429fc4', dash: '7,3', width: 1.5 },
  }

  const result: RenderedEdge[] = []
  for (const edge of knowledgeGraphData.value.edges) {
    const src = posMap.get(edge.source)
    const tgt = posMap.get(edge.target)
    if (!src || !tgt) continue

    const style = edgeStyles[edge.relation] || edgeStyles.related_to

    const dx = tgt.x - src.x
    const dy = tgt.y - src.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) continue
    const nx = dx / dist
    const ny = dy / dist

    const x1 = src.x + nx * src.r
    const y1 = src.y + ny * src.r
    const x2 = tgt.x - nx * tgt.r
    const y2 = tgt.y - ny * tgt.r

    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const cpx = midX - ny * 20
    const cpy = midY + nx * 20
    const path = `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`

    const arrowSize = 8
    const ax = x2 - nx * arrowSize
    const ay = y2 - ny * arrowSize
    const apx = -ny * arrowSize * 0.4
    const apy = nx * arrowSize * 0.4
    const arrow = `${ax - apx},${ay - apy} ${x2},${y2} ${ax + apx},${ay + apy}`

    result.push({
      source: edge.source,
      target: edge.target,
      path,
      arrow,
      midX: (x1 + x2) / 2,
      midY: (y1 + y2) / 2 - 6,
      label: edge.label,
      color: style.color,
      dash: style.dash,
      width: style.width,
    })
  }
  return result
})

const selectedBubble = ref<string | null>(null)

function bubbleNode(id: string | null): KnowledgeNode | undefined {
  if (!id) return undefined
  return knowledgeGraphData.value.nodes.find((n) => n.id === id)
}

function bubbleEdges(id: string): KnowledgeEdge[] {
  return knowledgeGraphData.value.edges.filter((e) => e.source === id || e.target === id)
}

function relationChipClass(relation: string): string {
  const map: Record<string, string> = {
    prerequisite: 'bg-brand-600/10 text-brand-600',
    related_to: 'bg-brand-400/10 text-brand-600',
    extends: 'bg-brand-600/10 text-brand-600',
    part_of: 'bg-brand-400/10 text-brand-600',
  }
  return map[relation] || 'bg-brand-400/10 text-gray-400'
}

// ===== 综合评价 =====
const totalScore = computed(() => myGrade.value?.score ?? null)

const classAvgScore = computed(() => {
  const courseGrades = store.grades.filter((g) => g.courseId === courseId)
  if (courseGrades.length === 0) return 0
  return Math.round(courseGrades.reduce((s, g) => s + g.score, 0) / courseGrades.length)
})

const currentCfg = computed(() => store.getGradeConfig(courseId))

const evalDimensions = computed(() => {
  const evals = store.evaluations.filter(
    (e) => e.courseId === courseId && e.studentId === myStudent.value?.id
  )
  const calcAvg = (type: string) => {
    const filtered = evals.filter((e) => e.type === type)
    if (filtered.length === 0) return null
    return Math.round(filtered.reduce((s, e) => s + e.score, 0) / filtered.length)
  }

  const dims: { label: string; icon: string; iconBg: string; iconColor: string; barColor: string; score: number; maxScore: number }[] = []
  const selfScore = calcAvg('self')
  if (selfScore !== null) dims.push({ label: '自评', icon: 'userCheck', iconBg: 'bg-brand-600/15', iconColor: 'text-brand-600', barColor: 'bg-brand-600', score: selfScore, maxScore: 100 })
  const peerScore = calcAvg('intra_group')
  if (peerScore !== null) dims.push({ label: '组内互评', icon: 'users', iconBg: 'bg-brand-600/10', iconColor: 'text-brand-600', barColor: 'bg-brand-600', score: peerScore, maxScore: 100 })
  const interScore = calcAvg('inter_group')
  if (interScore !== null) dims.push({ label: '组间互评', icon: 'messageSquare', iconBg: 'bg-brand-600/10', iconColor: 'text-brand-600', barColor: 'bg-brand-600', score: interScore, maxScore: 100 })
  const teacherScore = calcAvg('teacher')
  if (teacherScore !== null) dims.push({ label: '教师评价', icon: 'award', iconBg: 'bg-brand-400/10', iconColor: 'text-brand-600', barColor: 'bg-brand-600', score: teacherScore, maxScore: 100 })

  return dims
})

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

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
    submittedAt: new Date().toISOString().split('T')[0],
    fileName: file.name,
    fileDataUrl: 'https://example.com/submissions/' + file.name,
    fileSize: file.size,
    fileType: file.type,
  })
  
  delete selectedFiles.value[hw.id]
  alert('作业提交成功！')
}
</script>