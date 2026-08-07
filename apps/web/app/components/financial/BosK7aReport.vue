<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber } from '~/utils/format'

const props = defineProps<{
  data: any
}>()

const perpusPct = computed(() => {
  if (!props.data || props.data.totals.revenue <= 0) return 0
  const perpusTotal = props.data.expenses.find((e: any) => e.account_code === '507')?.balance || 0
  return Math.round((Number(perpusTotal) / Number(props.data.totals.revenue)) * 100)
})

const honorPct = computed(() => {
  if (!props.data || props.data.totals.revenue <= 0) return 0
  const honorTotal = props.data.expenses.reduce((sum: number, e: any) => 
    ['501', '502'].includes(e.account_code) ? sum + Number(e.balance) : sum, 0)
  return Math.round((honorTotal / Number(props.data.totals.revenue)) * 100)
})

const isPerpusValid = computed(() => perpusPct.value >= 10)
const isHonorValid = computed(() => honorPct.value <= 50)
</script>

<template>
  <div class="space-y-4 animate-in fade-in duration-200">
    <div class="flex gap-3 p-4 rounded-xl border bg-blue-50/50 text-blue-800 border-blue-200/50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30 text-xs">
      <div class="mt-0.5 text-base">ℹ️</div>
      <div>
        <span class="font-bold">Laporan pendamping</span> — pelaporan resmi tetap melalui ARKAS. Gunakan angka ini untuk mempercepat input BKU bulanan. Hanya transaksi ber-sumber dana BOS yang dihitung.
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-if="data">
      <!-- Penggunaan per Komponen Column -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between items-center">
          <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Penggunaan per Komponen</h4>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BOS REGULER &middot; TAHAP berjalan</span>
        </div>
        <div class="space-y-2">
          <div v-for="exp in data.expenses" :key="exp.account_code" class="flex justify-between text-xs py-1">
            <span class="text-slate-600 dark:text-zinc-400 font-medium">{{ exp.account_code }} - {{ exp.name }}</span>
            <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">{{ formatNumber(exp.balance) }}</span>
          </div>
          <div v-if="data.expenses.length === 0" class="text-xs text-slate-400 py-4 text-center">Belum ada rincian belanja dana BOS.</div>
        </div>
        
        <div class="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 font-extrabold text-xs">
          <span class="text-slate-800 dark:text-zinc-200">TOTAL PENGGUNAAN</span>
          <span class="font-mono">{{ formatNumber(data.totals.expense) }}</span>
        </div>
        <div class="flex justify-between text-xs py-1">
          <span class="text-slate-600 dark:text-zinc-400 font-medium">Penerimaan Tahap</span>
          <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">{{ formatNumber(data.totals.revenue) }}</span>
        </div>
        <div class="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 font-extrabold text-xs">
          <span class="text-slate-800 dark:text-zinc-200">SALDO BOS</span>
          <span class="font-mono">{{ formatNumber(data.totals.remaining) }}</span>
        </div>
      </div>

      <!-- Kepatuhan Proporsi Column -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between items-center">
          <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Kepatuhan Proporsi Juknis</h4>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">INDIKATOR DASHBOARD</span>
        </div>
        
        <div class="space-y-4 mt-4">
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-slate-700 dark:text-zinc-300">Perpustakaan (min 10%)</span>
              <span class="font-mono font-bold" :class="isPerpusValid ? 'text-emerald-600' : 'text-red-500'">{{ perpusPct }}% {{ isPerpusValid ? '✓' : '⚠️' }}</span>
            </div>
            <div class="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full" :class="isPerpusValid ? 'bg-emerald-500' : 'bg-red-500'" :style="`width: ${Math.min(perpusPct, 100)}%`"></div>
            </div>
          </div>
          
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-slate-700 dark:text-zinc-300">Honor (maks 50%)</span>
              <span class="font-mono font-bold" :class="isHonorValid ? 'text-emerald-600' : 'text-red-500'">{{ honorPct }}% {{ isHonorValid ? '✓' : '⚠️' }}</span>
            </div>
            <div class="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full" :class="isHonorValid ? 'bg-emerald-500' : 'bg-red-500'" :style="`width: ${Math.min(honorPct, 100)}%`"></div>
            </div>
          </div>
        </div>

        <p class="text-[11px] text-slate-500 mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 leading-relaxed">
          Indikator yang sama tersedia sebagai metrik <b>fin.bos.component_compliance</b> di Executive Dashboard — alarm bila proporsi melanggar juknis sebelum tutup BKU.
        </p>
      </div>
    </div>
  </div>
</template>
