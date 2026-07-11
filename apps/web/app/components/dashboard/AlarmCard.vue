<script setup lang="ts">
import { ShieldAlert, Edit2, Check, X } from 'lucide-vue-next'

const props = defineProps<{
  thresholds: Array<{
    id?: string
    metric_key: string
    operator: 'lt' | 'lte' | 'gt' | 'gte'
    threshold_value: number
    warning_level: string
    is_active: boolean
  }>
  catalog: Array<{
    metric_key: string
    display_name: string
    supports_alarm: boolean
  }>
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'save', threshold: any): void
}>()

const editingId = ref<string | null>(null)
const editForm = ref({
  metric_key: '',
  operator: 'lt' as 'lt' | 'lte' | 'gt' | 'gte',
  threshold_value: 0,
  is_active: true
})

const getMetricName = (key: string) => {
  const m = props.catalog.find((c) => c.metric_key === key)
  return m ? m.display_name : key
}

const startEdit = (t: any) => {
  editingId.value = t.metric_key
  editForm.value = {
    metric_key: t.metric_key,
    operator: t.operator,
    threshold_value: Number(t.threshold_value),
    is_active: t.is_active !== undefined ? !!t.is_active : true
  }
}

const cancelEdit = () => {
  editingId.value = null
}

const saveEdit = () => {
  emit('save', { ...editForm.value })
  editingId.value = null
}
</script>

<template>
  <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
    <div class="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
      <ShieldAlert class="text-rose-500" :size="20" />
      <div>
        <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-100">
          Ambang Alarm & Alarm Kritis
        </h3>
        <p class="text-[10px] text-slate-400 font-semibold">
          Konfigurasi nilai toleransi batas bawah/atas performa metrik sekolah.
        </p>
      </div>
    </div>

    <!-- Thresholds List -->
    <div class="space-y-3">
      <div
        v-for="t in thresholds"
        :key="t.metric_key"
        class="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-xs transition-all"
      >
        <div class="space-y-1 pr-4">
          <p class="font-bold text-slate-700 dark:text-zinc-200">
            {{ getMetricName(t.metric_key) }}
          </p>
          
          <!-- View / Edit mode switcher -->
          <div v-if="editingId === t.metric_key" class="flex flex-wrap items-center gap-2 mt-2">
            <select
              v-model="editForm.operator"
              class="border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 p-1 text-[10px] font-bold outline-none"
            >
              <option value="lt">&lt; (Kurang dari)</option>
              <option value="lte">&le; (Kurang dari/Sama dengan)</option>
              <option value="gt">&gt; (Lebih dari)</option>
              <option value="gte">&ge; (Lebih dari/Sama dengan)</option>
            </select>
            <input
              v-model.number="editForm.threshold_value"
              type="number"
              class="border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 p-1 text-[10px] w-20 font-bold outline-none"
            />
            <label class="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <input type="checkbox" v-model="editForm.is_active" class="rounded border-slate-200" />
              Aktif
            </label>
          </div>
          <p v-else class="text-[10px] text-slate-400 font-bold uppercase">
            Formula: {{ t.operator.toUpperCase() }} {{ t.threshold_value }} ({{ t.is_active ? 'AKTIF' : 'NONAKTIF' }})
          </p>
        </div>

        <!-- Buttons -->
        <div class="flex items-center gap-2">
          <template v-if="editingId === t.metric_key">
            <button
              @click="saveEdit"
              :disabled="saving"
              class="w-6 h-6 rounded bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              <Check :size="12" />
            </button>
            <button
              @click="cancelEdit"
              class="w-6 h-6 rounded bg-slate-200 dark:bg-zinc-800 text-slate-500 hover:bg-slate-300 flex items-center justify-center"
            >
              <X :size="12" />
            </button>
          </template>
          <button
            v-else
            @click="startEdit(t)"
            class="w-6 h-6 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all"
          >
            <Edit2 :size="11" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
