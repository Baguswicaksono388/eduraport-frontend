<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  page: number
  itemPerPage: number
  totalItem: number
  totalPage: number
  listPagination?: number[]
}>()

const emit = defineEmits<{
  (e: 'update:page', val: number): void
  (e: 'update:itemPerPage', val: number): void
}>()

const listPagination = computed(() => props.listPagination || [10, 25, 50, 100])

const fromItem = computed(() => {
  if (props.totalItem === 0) return 0
  return (props.page - 1) * props.itemPerPage + 1
})

const toItem = computed(() => {
  return Math.min(props.page * props.itemPerPage, props.totalItem)
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = 5
  
  if (props.totalPage <= maxVisible) {
    for (let i = 1; i <= props.totalPage; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    
    let start = Math.max(2, props.page - 1)
    let end = Math.min(props.totalPage - 1, props.page + 1)
    
    if (props.page <= 3) {
      end = 4
    } else if (props.page >= props.totalPage - 2) {
      start = props.totalPage - 3
    }
    
    if (start > 2) {
      pages.push('...')
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < props.totalPage - 1) {
      pages.push('...')
    }
    
    pages.push(props.totalPage)
  }
  
  return pages
})

const onPageClick = (p: number | string) => {
  if (typeof p === 'number') {
    emit('update:page', p)
  }
}

const prevPage = () => {
  if (props.page > 1) {
    emit('update:page', props.page - 1)
  }
}

const nextPage = () => {
  if (props.page < props.totalPage) {
    emit('update:page', props.page + 1)
  }
}
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white dark:bg-zinc-900/60 border-t border-slate-200/60 dark:border-zinc-800/80 rounded-b-xl">
    <!-- Left: Limit Selection & Status -->
    <div class="flex items-center gap-3">
      <select
        :value="itemPerPage"
        @change="emit('update:itemPerPage', Number(($event.target as HTMLSelectElement).value))"
        class="bg-slate-50 dark:bg-zinc-950 border border-slate-250 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none transition-all focus:border-lime-500 focus:ring-4 focus:ring-lime-500/10 cursor-pointer"
      >
        <option v-for="size in listPagination" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
      
      <span class="text-xs text-slate-500 dark:text-zinc-400">
        menampilkan <span class="font-semibold">{{ fromItem }}</span> hingga <span class="font-semibold">{{ toItem }}</span> dari <span class="font-semibold">{{ totalItem }}</span> hasil
      </span>
    </div>

    <!-- Right: Page Navigation -->
    <div class="flex items-center gap-1">
      <!-- Previous Button -->
      <button
        @click="prevPage"
        :disabled="page <= 1"
        class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronLeft :size="14" />
        Sebelumnya
      </button>

      <!-- Page Numbers -->
      <button
        v-for="(p, index) in visiblePages"
        :key="index"
        @click="onPageClick(p)"
        :disabled="p === '...'"
        :class="[
          'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border',
          p === page
            ? 'bg-lime-300 dark:bg-lime-800 border-lime-400 dark:border-lime-700 text-lime-900 dark:text-lime-100 shadow-sm'
            : p === '...'
              ? 'border-transparent text-slate-400 dark:text-zinc-550 cursor-default'
              : 'border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-950'
        ]"
      >
        {{ p }}
      </button>

      <!-- Next Button -->
      <button
        @click="nextPage"
        :disabled="page >= totalPage"
        class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        Selanjutnya
        <ChevronRight :size="14" />
      </button>
    </div>
  </div>
</template>
