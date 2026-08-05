<script setup lang="ts">
import { formatNumber } from '~/utils/format'

defineProps<{
  data: any
}>()
</script>

<template>
  <div class="space-y-4 animate-in fade-in duration-200">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-if="data">
      <!-- Pendapatan Column -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between items-center">
          <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Pendapatan</h4>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">4xx &middot; PERIODE AKTIF</span>
        </div>
        <div class="space-y-2">
          <div v-for="acc in data.revenues.items" :key="acc.id" class="flex justify-between text-xs py-1">
            <span class="text-slate-600 dark:text-zinc-400 font-medium">{{ acc.account_code }} - {{ acc.name }}</span>
            <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">{{ formatNumber(acc.balance) }}</span>
          </div>
          <div v-if="data.revenues.items.length === 0" class="text-xs text-slate-400 py-4 text-center">Tidak ada data pendapatan.</div>
        </div>
        <div class="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 font-extrabold text-xs">
          <span class="text-slate-800 dark:text-zinc-200">TOTAL PENDAPATAN</span>
          <span class="font-mono text-emerald-600 dark:text-emerald-450">{{ formatNumber(data.revenues.total) }}</span>
        </div>
      </div>

      <!-- Beban Column -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
        <div>
          <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between items-center">
            <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Beban</h4>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">5xx</span>
          </div>
          <div class="space-y-2 mt-4">
            <div v-for="acc in data.expenses.items" :key="acc.id" class="flex justify-between text-xs py-1">
              <span class="text-slate-600 dark:text-zinc-400 font-medium">{{ acc.account_code }} - {{ acc.name }}</span>
              <span class="font-mono font-bold text-slate-900 dark:text-zinc-100">{{ formatNumber(acc.balance) }}</span>
            </div>
            <div v-if="data.expenses.items.length === 0" class="text-xs text-slate-400 py-4 text-center">Tidak ada data beban operasional.</div>
          </div>
        </div>
        
        <div class="space-y-3 pt-6">
          <div class="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 font-extrabold text-xs">
            <span class="text-slate-800 dark:text-zinc-200">TOTAL BEBAN</span>
            <span class="font-mono text-rose-600 dark:text-rose-500">{{ formatNumber(data.expenses.total) }}</span>
          </div>
          
          <div class="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 font-extrabold text-xs items-center">
            <span class="text-slate-800 dark:text-zinc-200">SURPLUS / (DEFISIT)</span>
            <div class="text-right">
              <span class="font-mono text-base block mb-0.5" :class="Number(data.summary.netIncome) >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'">
                {{ formatNumber(data.summary.netIncome) }}
              </span>
              <span class="text-[9px] text-slate-400 uppercase font-semibold block">&Delta; vs periode lalu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
