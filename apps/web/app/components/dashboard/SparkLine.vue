<script setup lang="ts">
const props = defineProps<{
  data: number[]
  width?: number
  height?: number
  strokeColor?: string
  fillColor?: string
}>()

const w = computed(() => props.width || 120)
const h = computed(() => props.height || 40)
const stroke = computed(() => props.strokeColor || '#8b5cf6') // violet-500
const fill = computed(() => props.fillColor || '#c084fc') // violet-400

const points = computed(() => {
  if (!props.data || props.data.length < 2) return ''
  const max = Math.max(...props.data, 100) // Default max base 100
  const min = Math.min(...props.data, 0)
  const range = max - min || 1

  return props.data
    .map((val, index) => {
      const x = (index / (props.data.length - 1)) * w.value
      const y = h.value - ((val - min) / range) * (h.value - 4) - 2 // Padding 2px
      return `${x},${y}`
    })
    .join(' ')
})

const closedPoints = computed(() => {
  if (!points.value) return ''
  return `0,${h.value} ${points.value} ${w.value},${h.value}`
})
</script>

<template>
  <svg :width="w" :height="h" class="overflow-visible">
    <defs>
      <linearGradient :id="`sparkline-grad-${fill}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="fill" stop-opacity="0.2" />
        <stop offset="100%" :stop-color="fill" stop-opacity="0" />
      </linearGradient>
    </defs>
    <!-- Gradient Fill Area -->
    <polygon :points="closedPoints" :fill="`url(#sparkline-grad-${fill})`" />
    <!-- Line stroke -->
    <polyline :points="points" fill="none" :stroke="stroke" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
