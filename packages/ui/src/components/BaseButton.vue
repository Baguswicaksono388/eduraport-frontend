<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center rounded-lg font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
    :class="[
      {
        'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/15 dark:bg-violet-600 dark:hover:bg-violet-500 dark:shadow-violet-600/10': variant === 'primary',
        'bg-slate-100 text-slate-800 hover:bg-slate-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80': variant === 'secondary',
        'border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900': variant === 'outline',
        'bg-transparent hover:bg-slate-100/80 dark:hover:bg-zinc-900 dark:text-zinc-400': variant === 'ghost',
        'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/10 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30': variant === 'danger',
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30': variant === 'success',
      },
      {
        'px-3 py-1.5 text-xs': size === 'sm',
        'px-5 py-2.5 text-sm': size === 'md',
        'px-8 py-4 text-base': size === 'lg',
        'p-2.5': size === 'icon',
      }
    ]"
  >
    <slot v-if="!loading" />
    <span v-else class="flex items-center gap-2">
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Loading...
    </span>
  </button>
</template>
