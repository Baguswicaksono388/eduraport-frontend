<script setup lang="ts">
import { AlertCircle, Check } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const close = () => {
  if (props.loading) return
  emit('update:isOpen', false)
  emit('cancel')
}

const confirm = () => {
  emit('confirm')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300" @click="close"></div>

    <div class="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
      <div class="p-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <AlertCircle :size="20" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-800 dark:text-zinc-100 mb-2">
              {{ title }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
              {{ message }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-zinc-950/50 rounded-b-2xl border-t border-slate-100 dark:border-zinc-800">
        <button
          @click="close"
          :disabled="loading"
          class="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
        >
          {{ cancelText || 'Batal' }}
        </button>
        <button
          @click="confirm"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <Check v-if="!loading" :size="14" />
          <div v-else class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>{{ loading ? 'Memproses...' : (confirmText || 'Ya, Lanjutkan') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
