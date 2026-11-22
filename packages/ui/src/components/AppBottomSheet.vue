<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  show: boolean
  title?: string
  subtitle?: string
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[100] transition-opacity"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Sheet Panel -->
    <Transition
      enter-active-class="transition duration-300 ease-out transform"
      enter-from-class="translate-y-full sm:translate-y-4 sm:opacity-0"
      enter-to-class="translate-y-0 sm:translate-y-0 sm:opacity-100"
      leave-active-class="transition duration-200 ease-in transform"
      leave-from-class="translate-y-0 sm:translate-y-0 sm:opacity-100"
      leave-to-class="translate-y-full sm:translate-y-4 sm:opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 max-h-[88vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]"
        @click.stop
        role="dialog"
        aria-modal="true"
      >
        <!-- Mobile Grab Handle -->
        <div class="sm:hidden w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
          <div class="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        <!-- Header -->
        <div class="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 v-if="title" class="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              {{ title }}
            </h3>
            <p v-if="subtitle" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ subtitle }}
            </p>
          </div>
          <button
            type="button"
            @click="$emit('close')"
            class="p-2 -mr-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup sheet"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
