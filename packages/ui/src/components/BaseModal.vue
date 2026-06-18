<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  show: boolean
  title: string
}>()

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
        <div 
          class="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl border border-slate-200/60 dark:border-zinc-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 class="font-bold text-base tracking-tight text-slate-900 dark:text-zinc-100">{{ title }}</h3>
            <button 
              @click="$emit('close')" 
              class="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-slate-400 hover:text-slate-950 dark:hover:text-zinc-100"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
