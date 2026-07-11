<script setup lang="ts">
import { ref } from 'vue'
import { RefreshCw, SlidersHorizontal, CalendarDays, ShieldAlert, Printer } from 'lucide-vue-next'

const props = defineProps<{
  currentRole: string
  roles: Array<{ value: string; label: string }>
  date: string
  loading: boolean
  exportingPdf?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:role', role: string): void
  (e: 'update:date', date: string): void
  (e: 'refresh'): void
  (e: 'export-pdf'): void
}>()

const dateInputRef = ref<HTMLInputElement | null>(null)

// Programmatically trigger native date picker popup when clicking anywhere in the container
const openDatePicker = () => {
  if (dateInputRef.value) {
    try {
      dateInputRef.value.showPicker()
    } catch (e) {
      console.warn("showPicker is not supported in this browser")
    }
  }
}

// Adjust date by offset of days
const adjustDate = (days: number) => {
  if (!props.date) return
  const d = new Date(props.date)
  d.setDate(d.getDate() + days)
  emit('update:date', d.toISOString().split('T')[0])
}

// Shortcut to set date to today
const setToday = () => {
  emit('update:date', new Date().toISOString().split('T')[0])
}
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800 animate-in fade-in duration-300">
    <div>
      <h1 class="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2.5">
        <SlidersHorizontal class="text-violet-600 dark:text-violet-400" :size="24" />
        Dashboard Eksekutif
      </h1>
      <p class="text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-1">
        Ringkasan eksekutif performa sekolah, finansial, kehadiran, dan kelengkapan nilai akademik.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <!-- Role Switcher (Simulator view) -->
      <div class="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-sm">
        <ShieldAlert class="text-violet-500" :size="15" />
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tampilan:</span>
        <select
          :value="currentRole"
          @change="emit('update:role', ($event.target as HTMLSelectElement).value)"
          class="bg-transparent text-xs font-bold text-slate-700 dark:text-zinc-250 outline-none cursor-pointer focus:ring-0 border-none p-0 pr-6"
        >
          <option 
            v-for="r in roles" 
            :key="r.value" 
            :value="r.value"
            class="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 font-semibold"
          >
            {{ r.label }}
          </option>
        </select>
      </div>

      <!-- Date Filter Controls -->
      <div class="flex items-center gap-1.5">
        <!-- Prev Day Arrow Button -->
        <button 
          @click="adjustDate(-1)" 
          class="p-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold shadow-sm"
          title="Kemarin"
        >
          &larr;
        </button>

        <!-- Date Picker Container -->
        <div 
          @click="openDatePicker"
          class="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
        >
          <CalendarDays class="text-amber-500" :size="15" />
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal:</span>
          <input
            ref="dateInputRef"
            :value="date"
            @change="emit('update:date', ($event.target as HTMLInputElement).value)"
            @input="emit('update:date', ($event.target as HTMLInputElement).value)"
            type="date"
            class="bg-transparent text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none border-none p-0 w-28 focus:ring-0 cursor-pointer"
          />
        </div>

        <!-- Next Day Arrow Button -->
        <button 
          @click="adjustDate(1)" 
          class="p-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold shadow-sm"
          title="Besok"
        >
          &rarr;
        </button>

        <!-- Today Button -->
        <button
          @click="setToday"
          class="px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 shadow-sm"
        >
          Hari Ini
        </button>
      </div>

      <!-- Export PDF Button -->
      <button
        @click="emit('export-pdf')"
        :disabled="exportingPdf"
        class="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-250 rounded-lg shadow-sm text-xs font-bold transition-all disabled:opacity-50"
      >
        <Printer :class="{ 'animate-pulse': exportingPdf }" :size="14" />
        <span>{{ exportingPdf ? 'Mengekspor...' : 'Cetak PDF' }}</span>
      </button>

      <!-- Refresh Button -->
      <button
        @click="emit('refresh')"
        :disabled="loading"
        class="inline-flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-lg shadow-sm text-xs font-bold transition-all"
      >
        <RefreshCw :class="{ 'animate-spin': loading }" :size="14" />
        <span>Segarkan</span>
      </button>
    </div>
  </div>
</template>
