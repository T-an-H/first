<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-gray-800">{{ title }} <span class="text-xs text-gray-400 font-normal">(权重 {{ weight }}%)</span></h3>
      <span class="text-lg font-bold text-gray-900 tabular-nums">{{ props.score.toFixed(1) }}</span>
    </div>

    <div class="space-y-1.5 mb-2">
      <div v-for="item in items" :key="item.label" class="flex items-center justify-between">
        <span class="text-xs text-gray-400">{{ item.label }} ({{ item.weight }}%)</span>
        <span class="text-sm font-medium text-gray-800 tabular-nums">{{ formatScore(item.score) }}</span>
      </div>
    </div>

    <p class="text-xs text-gray-400 tabular-nums">
      {{ props.score.toFixed(1) }} × {{ weight }}% = {{ contribution.toFixed(1) }} 分
      <span v-if="weight > 0" class="text-gray-400/60">（贡献至总分）</span>
    </p>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title: string
  weight: number
  score: number
  contribution: number
  items: { score: number | undefined; weight: number; label: string }[]
}>()

function formatScore(s: number | undefined): string {
  if (s == null) return '-'
  return s.toFixed(1)
}
</script>