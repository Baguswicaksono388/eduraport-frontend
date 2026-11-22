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
        'bg-blue-900 text-white hover:bg-blue-950 shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700': variant === 'primary',
        'bg-slate-100 text-slate-800 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80': variant === 'secondary',
        'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800': variant === 'outline',
        'bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800 dark:text-slate-300': variant === 'ghost',
        'bg-rose-600 text-white hover:bg-rose-700 shadow-sm dark:bg-rose-600 dark:hover:bg-rose-700': variant === 'danger',
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm dark:bg-emerald-600 dark:hover:bg-emerald-700': variant === 'success',
      },
      {
        'px-3 py-1.5 text-xs min-h-[32px]': size === 'sm',
        'px-4 py-2.5 text-sm min-h-[44px]': size === 'md',
        'px-6 py-3 text-base min-h-[48px]': size === 'lg',
        'p-2.5 min-h-[44px] min-w-[44px]': size === 'icon',
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
