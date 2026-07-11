<script setup lang="ts">
const props = defineProps<{
  value: number
  label?: string
  size?: number
}>()

const sz = computed(() => props.size || 160)
const radius = computed(() => (sz.value / 2) - 16)
const strokeWidth = 12

// Semicircular stroke length formulas
const circumference = computed(() => Math.PI * radius.value)
const strokeDashoffset = computed(() => {
  const percent = Math.min(Math.max(props.value, 0), 100)
  return circumference.value - (percent / 100) * circumference.value
})

const colorClass = computed(() => {
  if (props.value >= 85) return 'stroke-emerald-500 dark:stroke-emerald-400'
  if (props.value >= 70) return 'stroke-amber-500 dark:stroke-amber-400'
  return 'stroke-rose-500 dark:stroke-rose-400'
})

const textClass = computed(() => {
  if (props.value >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (props.value >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
})
</script>

<template>
  <div class="flex flex-col items-center justify-center relative">
    <svg :width="sz" :height="sz / 2 + 10" class="overflow-visible">
      <defs>
        <linearGradient id="gauge-bg-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f1f5f9" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
      </defs>
      <!-- Background arc -->
      <path
        :d="`M 16,${sz / 2} A ${radius.value},${radius.value} 0 0,1 ${sz - 16},${sz / 2}`"
        fill="none"
        stroke="currentColor"
        class="text-slate-100 dark:text-zinc-800"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
      />
      <!-- Active arc -->
      <path
        :d="`M 16,${sz / 2} A ${radius.value},${radius.value} 0 0,1 ${sz - 16},${sz / 2}`"
        fill="none"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :class="colorClass"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        class="transition-all duration-1000 ease-out"
      />
    </svg>

    <!-- Overlay Value & Label -->
    <div class="absolute bottom-1 text-center">
      <span class="text-2xl md:text-3xl font-black tracking-tight" :class="textClass">
        {{ value }}%
      </span>
      <p v-if="label" class="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500 mt-0.5">
        {{ label }}
      </p>
    </div>
  </div>
</template>
