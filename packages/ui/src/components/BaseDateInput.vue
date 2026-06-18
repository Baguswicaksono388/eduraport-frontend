<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'

defineProps<{
  modelValue?: string
  label?: string
  error?: string
  placeholder?: string
  required?: boolean
}>()

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full relative">
    <label v-if="label" class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">
      {{ label }}
    </label>
    <div class="relative group">
      <input
        type="date"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :required="required"
        class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg pl-3.5 pr-10 py-2.5 text-sm font-medium focus:ring-4 focus:ring-violet-600/10 focus:border-violet-600 outline-none transition-all duration-200 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 appearance-none custom-date-input"
        :class="[
          error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : ''
        ]"
      />
      <div class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none group-hover:text-violet-500 transition-colors">
        <Calendar :size="16" />
      </div>
    </div>
    <p v-if="error" class="text-xs font-medium text-rose-500 px-1">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.custom-date-input::-webkit-calendar-picker-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  opacity: 0;
  cursor: pointer;
}
</style>
