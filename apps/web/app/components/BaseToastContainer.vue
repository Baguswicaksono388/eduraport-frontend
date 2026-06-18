<script setup lang="ts">
import { useToast } from '../composables/useToast'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-vue-next'

const { toasts, remove } = useToast()

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return CheckCircle2
    case 'error':
      return XCircle
    case 'warning':
      return AlertTriangle
    default:
      return Info
  }
}

const getStyles = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-250 shadow-emerald-500/10'
    case 'error':
      return 'bg-rose-50/90 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-250 shadow-rose-500/10'
    case 'warning':
      return 'bg-amber-50/90 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-250 shadow-amber-500/10'
    default:
      return 'bg-blue-50/90 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-250 shadow-blue-500/10'
  }
}

const getIconColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-emerald-500 dark:text-emerald-400'
    case 'error':
      return 'text-rose-500 dark:text-rose-400'
    case 'warning':
      return 'text-amber-500 dark:text-amber-400'
    default:
      return 'text-blue-500 dark:text-blue-400'
  }
}
</script>

<template>
  <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
    <TransitionGroup 
      name="toast" 
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-[-20px] opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-[-20px] opacity-0 scale-95"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all"
        :class="getStyles(toast.type)"
      >
        <component :is="getIcon(toast.type)" class="shrink-0 mt-0.5" :class="getIconColor(toast.type)" :size="18" />
        
        <div class="flex-1 min-w-0">
          <p v-if="toast.title" class="text-xs font-bold tracking-wide leading-none mb-1">
            {{ toast.title }}
          </p>
          <p class="text-xs font-semibold leading-relaxed break-words">
            {{ toast.message }}
          </p>
        </div>

        <button 
          @click="remove(toast.id)" 
          class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 hover:bg-slate-100/30 dark:hover:bg-zinc-800/30 rounded"
        >
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
