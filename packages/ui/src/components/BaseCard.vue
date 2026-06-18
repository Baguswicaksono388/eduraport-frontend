<script setup lang="ts">
interface Props {
  gradient?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  stripe?: boolean
}

withDefaults(defineProps<Props>(), {
  gradient: false,
  padding: 'md',
  stripe: false
})
</script>

<template>
  <div
    class="rounded-xl border transition-all duration-300 relative overflow-hidden"
    :class="[
      gradient 
        ? 'bg-gradient-to-br from-violet-800 to-indigo-950 border-transparent text-white dark:from-zinc-900 dark:to-zinc-950 dark:border-zinc-900' 
        : 'bg-white/80 dark:bg-zinc-900/80 border-slate-200/60 dark:border-zinc-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-none',
    ]"
  >
    <!-- Top Stripe Accent -->
    <div v-if="stripe && !gradient" class="absolute top-0 left-0 right-0 h-1 bg-violet-600"></div>
    <!-- Header Slot -->
    <div v-if="$slots.header" class="px-6 py-4 border-b border-slate-200/50 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30">
      <slot name="header" />
    </div>

    <!-- Content Slot -->
    <div :class="[
      {
        'p-0': padding === 'none',
        'p-4': padding === 'sm',
        'p-6': padding === 'md',
        'p-8': padding === 'lg',
      }
    ]">
      <slot />
    </div>
  </div>
</template>
