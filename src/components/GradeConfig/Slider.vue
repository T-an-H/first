<template>
  <div class="flex items-center gap-3">
    <span class="text-sm text-gray-700 w-28 flex-shrink-0">{{ label }}</span>
    <input type="number" min="0" max="100" :value="val" @input="emit('change', Number(($event.target as HTMLInputElement).value))" class="flex-1 max-w-24 px-2 py-1 rounded border border-gray-200 focus:border-brand-600 outline-none text-sm text-center" />
    <span class="text-sm text-gray-400 w-4">%</span>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  label: string
  val: number
}>()

const emit = defineEmits<{
  change: [value: number]
}>()
</script>