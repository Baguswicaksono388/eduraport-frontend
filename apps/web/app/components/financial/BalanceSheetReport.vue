<script setup lang="ts">
import { formatNumber } from '~/utils/format'

defineProps<{
  data: any
}>()
</script>

<template>
  <div class="space-y-4 animate-in fade-in duration-200">
    <!-- Balance check banner -->
    <div 
      v-if="data" 
      class="flex gap-3 p-4 rounded-xl border text-xs"
      :class="data.summary.isBalanced ? 'bg-emerald-50/50 text-emerald-800 border-emerald-200/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30' : 'bg-rose-50/50 text-rose-800 border-rose-200/50 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/30'"
    >
      <div class="mt-0.5 text-base">{{ data.summary.isBalanced ? '✓' : '⚠' }}</div>
      <div>
        <span class="font-bold">Verifikasi Saldo Neraca:</span>
        <span v-if="data.summary.isBalanced"> SEIMBANG — Aset {{ formatNumber(data.assets.total) }} = Kewajiban + Ekuitas {{ formatNumber(data.liabilities.total + data.equity.total) }}</span>
        <span v-else> TIDAK SEIMBANG — Aset {{ formatNumber(data.assets.total) }} &ne; Kewajiban + Ekuitas {{ formatNumber(data.liabilities.total + data.equity.total) }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-if="data">
      <!-- Assets Column -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
        <div>
          <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between items-center">
            <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Aset (Assets)</h4>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode Rekening 1xx</span>
          </div>
          <div class="space-y-2 mt-4">
            <div v-for="acc in data.assets.items" :key="acc.id" class="flex justify-between text-xs py-1">
              <span class="text-slate-600 dark:text-zinc-400 font-medium">{{ acc.account_code }} - {{ acc.name }}</span>
              <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">{{ formatNumber(acc.balance) }}</span>
            </div>
            <div v-if="data.assets.items.length === 0" class="text-xs text-slate-400 py-4 text-center">Tidak ada data aset.</div>
          </div>
        </div>
        
        <div class="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 font-extrabold text-xs">
          <span class="text-slate-800 dark:text-zinc-200">TOTAL ASET</span>
          <span class="font-mono">{{ formatNumber(data.assets.total) }}</span>
        </div>
      </div>

      <!-- Liabilities & Equities Column -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-6">
        <!-- Liabilities -->
        <div class="space-y-4">
          <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between items-center">
            <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Kewajiban (Liabilities)</h4>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode 2xx</span>
          </div>
          <div class="space-y-2 mt-4">
            <div v-for="acc in data.liabilities.items" :key="acc.id" class="flex justify-between text-xs py-1">
              <span class="text-slate-600 dark:text-zinc-400 font-medium">{{ acc.account_code }} - {{ acc.name }}</span>
              <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">{{ formatNumber(acc.balance) }}</span>
            </div>
            <div v-if="data.liabilities.items.length === 0" class="flex justify-between text-xs py-1">
              <span class="text-slate-400 italic">Tidak ada data kewajiban.</span>
              <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">Rp 0</span>
            </div>
          </div>
        </div>

        <!-- Equities -->
        <div class="space-y-4">
          <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between items-center mt-6">
            <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Ekuitas (Equity)</h4>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode 3xx + derivasi</span>
          </div>
          <div class="space-y-2 mt-4">
            <div v-for="acc in data.equity.items" :key="acc.id" class="flex justify-between text-xs py-1">
              <span class="text-slate-600 dark:text-zinc-400 font-medium">{{ acc.account_code }} - {{ acc.name }}</span>
              <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">{{ formatNumber(acc.balance) }}</span>
            </div>
            <div v-if="data.equity.items.length === 0 && Number(data.summary.netIncome) === 0" class="text-xs text-slate-400 py-4 text-center">Tidak ada data ekuitas.</div>
            
            <div class="flex justify-between text-xs py-2 px-3 bg-slate-50 dark:bg-zinc-950 rounded-lg" v-if="Number(data.summary.netIncome) !== 0">
              <span class="text-slate-600 dark:text-zinc-400 font-medium flex items-center">
                Laba/Rugi Tahun Berjalan 
                <span class="ml-1 text-slate-400 cursor-help" title="&Sigma; Pendapatan (4xx) &minus; &Sigma; Beban (5xx) tahun ajaran berjalan &mdash; baris derivasi otomatis, kunci neraca selalu seimbang">
                  ⓘ
                </span>
              </span>
              <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">{{ formatNumber(data.summary.netIncome) }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 font-extrabold text-xs">
          <span class="text-slate-800 dark:text-zinc-200">TOTAL KEWAJIBAN & EKUITAS</span>
          <span class="font-mono">{{ formatNumber(data.liabilities.total + data.equity.total) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
