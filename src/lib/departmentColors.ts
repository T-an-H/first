export const DEPARTMENT_COLOR_OPTIONS = [
  { name: '蓝色', value: '#3b82f6' },
  { name: '绿色', value: '#10b981' },
  { name: '橙色', value: '#f59e0b' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '青色', value: '#06b6d4' },
  { name: '粉色', value: '#ec4899' },
  { name: '红色', value: '#ef4444' },
  { name: '青绿色', value: '#14b8a6' },
  { name: '靛蓝色', value: '#6366f1' },
  { name: '黄绿色', value: '#84cc16' },
] as const

const colorNameMap = new Map(
  DEPARTMENT_COLOR_OPTIONS.flatMap((color) => [
    [color.name.toLowerCase(), color.value],
    [color.name.replace(/色$/, '').toLowerCase(), color.value],
    [color.value.toLowerCase(), color.value],
    [color.value.slice(1).toLowerCase(), color.value],
  ]),
)

export function isDepartmentColorOption(value: string) {
  const normalized = value.trim().toLowerCase()
  return DEPARTMENT_COLOR_OPTIONS.some((color) => color.value === normalized)
}

export function getDepartmentColorName(value: string) {
  const normalized = value.trim().toLowerCase()
  return DEPARTMENT_COLOR_OPTIONS.find((color) => color.value === normalized)?.name || '自定义颜色'
}

export function resolveDepartmentColor(
  value: unknown,
  fallback: string = DEPARTMENT_COLOR_OPTIONS[0].value,
) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return fallback

  const mapped = colorNameMap.get(normalized)
  if (mapped) return mapped

  const hex = normalized.startsWith('#') ? normalized : `#${normalized}`
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex : fallback
}
