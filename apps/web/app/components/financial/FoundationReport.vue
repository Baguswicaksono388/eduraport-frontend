<script setup lang="ts">
import { formatNumber } from '~/utils/format'
import { computed } from 'vue'

const props = defineProps<{
  data: any
}>()

const totalRevenue = computed(() => {
  return props.data?.reduce((acc: number, item: any) => acc + (Number(item.revenue) || 0), 0) || 0
})

const totalExpense = computed(() => {
  return props.data?.reduce((acc: number, item: any) => acc + (Number(item.expense) || 0), 0) || 0
})

const totalNet = computed(() => {
  return totalRevenue.value - totalExpense.value
})
</script>

<template>
  <div class="space-y-4 animate-in fade-in duration-200">
    <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-700/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm" v-if="data && data.length > 0">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-slate-800/50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              <th class="p-4 pl-6">Unit</th>
              <th class="p-4">Pendapatan</th>
              <th class="p-4">Beban</th>
              <th class="p-4">Surplus</th>
              <th class="p-4">Kas Akhir</th>
              <th class="p-4 pr-6">Outstanding SPP</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/80 font-medium">
            <tr v-for="school in data" :key="school.school_id" class="hover:bg-slate-50 dark:bg-slate-800/50/30 dark:hover:bg-zinc-950/20 text-slate-700 dark:text-slate-300 dark:text-zinc-300">
              <td class="p-4 pl-6 font-bold text-slate-800 dark:text-slate-200 dark:text-zinc-200">{{ school.school_name }}</td>
              <td class="p-4 font-mono font-bold">{{ formatNumber(school.revenue) }}</td>
              <td class="p-4 font-mono font-bold">{{ formatNumber(school.expense) }}</td>
              <td class="p-4 font-mono font-bold" :class="(Number(school.revenue) - Number(school.expense)) >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'">
                {{ formatNumber(Number(school.revenue) - Number(school.expense)) }}
              </td>
              <td class="p-4 font-mono text-slate-400">-</td>
              <td class="p-4 pr-6 font-mono text-slate-400">-</td>
            </tr>
            
            <!-- Konsolidasi Row -->
            <tr class="bg-slate-50 dark:bg-slate-800/50/50 dark:bg-zinc-900/50">
              <td class="p-4 pl-6 font-extrabold text-slate-800 dark:text-slate-200 dark:text-zinc-200 uppercase">KONSOLIDASI</td>
              <td class="p-4 font-mono font-extrabold text-slate-800 dark:text-slate-200 dark:text-zinc-200">{{ formatNumber(totalRevenue) }}</td>
              <td class="p-4 font-mono font-extrabold text-slate-800 dark:text-slate-200 dark:text-zinc-200">{{ formatNumber(totalExpense) }}</td>
              <td class="p-4 font-mono font-extrabold" :class="totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'">
                {{ formatNumber(totalNet) }}
              </td>
              <td class="p-4 font-mono text-slate-400">-</td>
              <td class="p-4 pr-6 font-mono text-slate-400">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Sumber: metric_snapshots (7.5) — dashboard yayasan tidak menyentuh tabel transaksional unit.</p>

    <div v-if="!data || data.length === 0" class="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 dark:border-zinc-800 rounded-xl">
      <p class="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-zinc-300">Belum Ada Data Konsolidasi Yayasan</p>
    </div>
  </div>
</template>

