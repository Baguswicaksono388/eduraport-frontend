<script setup lang="ts">
interface Props {
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'sm',
  dot: false
})
</script>

<template>
  <span
    class="inline-flex items-center font-medium transition-colors"
    :class="[
      {
        'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700': variant === 'neutral',
        'bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60': variant === 'primary',
        'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60': variant === 'success',
        'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60': variant === 'warning',
        'bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60': variant === 'danger',
        'bg-sky-50 text-sky-800 border border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60': variant === 'info',
      },
      {
        'text-[10px] px-1.5 py-0.5 rounded gap-1': size === 'xs',
        'text-xs px-2 py-0.5 rounded-md gap-1.5': size === 'sm',
        'text-xs px-2.5 py-1 rounded-md gap-1.5 font-semibold': size === 'md',
      }
    ]"
  >
    <span
      v-if="dot"
      class="w-1.5 h-1.5 rounded-full shrink-0"
      :class="{
        'bg-slate-400 dark:bg-slate-500': variant === 'neutral',
        'bg-blue-600 dark:bg-blue-400': variant === 'primary',
        'bg-emerald-600 dark:bg-emerald-400': variant === 'success',
        'bg-amber-500 dark:bg-amber-400': variant === 'warning',
        'bg-rose-600 dark:bg-rose-400': variant === 'danger',
        'bg-sky-600 dark:bg-sky-400': variant === 'info',
      }"
    />
    <slot />
  </span>
</template>
