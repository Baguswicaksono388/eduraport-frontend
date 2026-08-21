<script setup lang="ts">
import { BaseModal, BaseButton } from '@eduraport/ui'
import { CheckCircle, AlertCircle, XCircle, Trash2, UserCircle } from 'lucide-vue-next'
import { formatDate } from '~/utils/format'

const props = defineProps<{
  show: boolean
  asset: any
  logs: any[]
}>()

defineEmits<{
  (e: 'close'): void
}>()

const conditionConfig: Record<string, { label: string; icon: any; colorClass: string }> = {
  good: { label: 'Baik', icon: CheckCircle, colorClass: 'text-emerald-600 bg-emerald-50' },
  repair_needed: { label: 'Perlu Perbaikan', icon: AlertCircle, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  broken: { label: 'Rusak', icon: XCircle, colorClass: 'text-rose-600 bg-rose-50' },
  disposed: { label: 'Dihapusbukukan', icon: Trash2, colorClass: 'text-slate-600 bg-slate-50 dark:bg-slate-800/50' },
}

const getConditionInfo = (cond: string) => conditionConfig[cond] || conditionConfig.good
</script>

<template>
  <BaseModal :show="show" title="Riwayat Kondisi Aset" @close="$emit('close')">
    <div class="space-y-4">
      <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
        <div class="text-sm">
          <span class="font-medium text-slate-900 dark:text-slate-100 block">{{ asset?.name }}</span>
          <span class="font-mono text-slate-500 dark:text-slate-400 mt-1 block">{{ asset?.code }}</span>
        </div>
      </div>

      <div v-if="logs && logs.length > 0" class="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6 pb-4">
        <div v-for="(log, index) in logs" :key="log.id" class="relative pl-6">
          <div class="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400"></div>
          
          <div class="flex flex-col gap-1">
            <div class="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5">
              <span>{{ formatDate(log.changed_at, true) }}</span>
              <span class="text-slate-300">•</span>
              <div class="flex items-center gap-1">
                <UserCircle class="w-3.5 h-3.5" />
                <span>{{ log.user_name || 'Sistem' }}</span>
              </div>
            </div>
            
            <div class="flex items-center gap-2 mt-1">
              <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border border-transparent"
                   :class="getConditionInfo(log.previous_condition).colorClass">
                {{ getConditionInfo(log.previous_condition).label }}
              </div>
              <span class="text-slate-400 text-xs">→</span>
              <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border border-transparent"
                   :class="getConditionInfo(log.new_condition).colorClass">
                {{ getConditionInfo(log.new_condition).label }}
              </div>
            </div>
            
            <div v-if="log.reason" class="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 mt-1.5">
              "{{ log.reason }}"
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
        Belum ada riwayat perubahan kondisi.
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end w-full">
      <BaseButton @click="$emit('close')">Tutup</BaseButton>
    </div>
  </BaseModal>
</template>

