<script setup lang="ts">
import type { Component } from 'vue'

export interface NavItem {
  id: string
  label: string
  to?: string
  icon: Component
  badge?: string | number
  active?: boolean
}

defineProps<{
  items: NavItem[]
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'select', item: NavItem): void
  (e: 'update:modelValue', id: string): void
}>()

const handleClick = (item: NavItem) => {
  emit('select', item)
  emit('update:modelValue', item.id)
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom,0px)]"
    aria-label="Mobile Bottom Navigation"
  >
    <div class="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        @click="handleClick(item)"
        class="relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] px-1 py-1 rounded-xl transition-all duration-150 active:scale-95 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        :class="[
          (modelValue === item.id || item.active)
            ? 'text-blue-900 dark:text-blue-400 font-semibold'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-normal'
        ]"
      >
        <!-- Icon & Badge Container -->
        <div class="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          :class="[
            (modelValue === item.id || item.active)
              ? 'bg-blue-50 dark:bg-blue-950/60'
              : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60'
          ]"
        >
          <component
            :is="item.icon"
            :size="19"
            class="transition-transform group-active:scale-90"
            :class="[
              (modelValue === item.id || item.active)
                ? 'stroke-[2.2]'
                : 'stroke-[1.8]'
            ]"
          />

          <!-- Notification / Counter Badge -->
          <span
            v-if="item.badge"
            class="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-rose-600 rounded-full border-2 border-white dark:border-slate-900 leading-none"
          >
            {{ item.badge }}
          </span>
        </div>

        <!-- Label -->
        <span class="text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-[64px]">
          {{ item.label }}
        </span>
      </button>
    </div>
  </nav>
</template>
