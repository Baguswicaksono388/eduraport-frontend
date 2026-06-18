<script setup lang="ts">
defineProps<{
  modelValue?: string | number
  type?: string
  placeholder?: string
  label?: string
  error?: string
  prefix?: string
  class?: string
}>()

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">
      {{ label }}
    </label>
    <div class="relative group">
      <div v-if="prefix" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
        {{ prefix }}
      </div>
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', type === 'number' ? Number(($event.target as HTMLInputElement).value) : ($event.target as HTMLInputElement).value)"
        :type="type || 'text'"
        :placeholder="placeholder"
        class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium focus:ring-4 focus:ring-violet-600/10 focus:border-violet-600 outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
        :class="[
          prefix ? 'pl-10' : '',
          error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : '',
          $attrs.class
        ]"
      />
    </div>
    <p v-if="error" class="text-xs font-medium text-rose-500 px-1">
      {{ error }}
    </p>
  </div>
</template>
