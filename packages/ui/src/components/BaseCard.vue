<script setup lang="ts">
interface Props {
  gradient?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  stripe?: boolean
  overflow?: 'hidden' | 'visible'
}

withDefaults(defineProps<Props>(), {
  gradient: false,
  padding: 'md',
  stripe: false,
  overflow: 'visible'
})
</script>

<template>
  <div
    class="rounded-xl border transition-all duration-300 relative"
    :class="[
      overflow === 'hidden' ? 'overflow-hidden' : 'overflow-visible',
      gradient 
        ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-transparent text-white' 
        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none',
    ]"
  >
    <!-- Top Stripe Accent -->
    <div v-if="stripe && !gradient" class="absolute top-0 left-0 right-0 h-1 bg-blue-800 dark:bg-blue-600 rounded-t-xl"></div>
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
