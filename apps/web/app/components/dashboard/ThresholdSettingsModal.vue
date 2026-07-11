<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Check, Bell, ShieldAlert, Plus, Edit2, Info } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  thresholds: any[]
  catalog: any[]
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'save-threshold', threshold: any): void
}>()

// List of roles available for notification alerts
const rolesList = [
  { value: 'principal', label: 'Kepala Sekolah' },
  { value: 'vice_principal_curriculum', label: 'Wakasek Kurikulum' },
  { value: 'treasurer', label: 'Bendahara' }
]

// Filter catalog for alarm-supporting metrics
const alarmMetrics = computed(() => {
  return props.catalog.filter(c => c.supports_alarm)
})

// Track which metric key is currently being edited
const editingKey = ref<string | null>(null)

// Form state
const form = ref({
  metric_key: '',
  operator: 'lt' as 'lt' | 'lte' | 'gt' | 'gte',
  threshold_value: 0,
  action: 'visual_only',
  notify_roles: [] as string[],
  notify_cooldown_hours: 24,
  is_active: true
})

// Close helper
const close = () => {
  editingKey.value = null
  emit('update:isOpen', false)
}

// Find existing threshold by metric key
const getThresholdForMetric = (key: string) => {
  return props.thresholds.find(t => t.metric_key === key)
}

// Start editing or adding a threshold
const startEdit = (key: string) => {
  const existing = getThresholdForMetric(key)
  editingKey.value = key
  
  if (existing) {
    form.value = {
      metric_key: existing.metric_key,
      operator: existing.operator || 'lt',
      threshold_value: Number(existing.threshold_value) || 0,
      action: existing.action || 'visual_only',
      notify_roles: Array.isArray(existing.notify_roles) ? [...existing.notify_roles] : [],
      notify_cooldown_hours: Number(existing.notify_cooldown_hours) || 24,
      is_active: existing.is_active !== undefined ? !!existing.is_active : true
    }
  } else {
    // Default values for new threshold
    form.value = {
      metric_key: key,
      operator: 'lt',
      threshold_value: 80,
      action: 'visual_only',
      notify_roles: ['principal'],
      notify_cooldown_hours: 24,
      is_active: true
    }
  }
}

const cancelEdit = () => {
  editingKey.value = null
}

const save = () => {
  const finalAction = form.value.notify_roles.length > 0 ? 'notify' : 'visual_only'
  emit('save-threshold', { 
    ...form.value,
    action: finalAction
  })
  editingKey.value = null
}

// Toggle role selection helper
const toggleRole = (roleVal: string) => {
  const idx = form.value.notify_roles.indexOf(roleVal)
  if (idx > -1) {
    form.value.notify_roles.splice(idx, 1)
  } else {
    form.value.notify_roles.push(roleVal)
  }
}
</script>

<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
  >
    <!-- Dark glass backdrop -->
    <div 
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
      @click="close"
    ></div>

    <!-- Modal Content Window -->
    <div 
      class="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
            <ShieldAlert :size="18" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-100">
              Konfigurasi Ambang Alarm Eksekutif
            </h3>
            <p class="text-[10px] text-slate-400 font-semibold">
              Kustomisasi parameter alarm dan otorisasi notifikasi untuk setiap indikator mutu sekolah.
            </p>
          </div>
        </div>
        <button 
          @click="close" 
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 transition-all"
        >
          <X :size="16" />
        </button>
      </div>

      <!-- Content Area -->
      <div class="p-6 space-y-4 flex-1">
        <div v-if="alarmMetrics.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
          <Info :size="32" class="mb-2 text-slate-300" />
          <p class="text-xs font-semibold">Tidak ada metrik yang mendukung fitur alarm.</p>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="m in alarmMetrics" 
            :key="m.metric_key"
            class="p-4 rounded-xl border transition-all"
            :class="[
              editingKey === m.metric_key 
                ? 'border-violet-500 bg-violet-50/10 dark:bg-violet-950/10' 
                : 'border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-950/10 hover:border-slate-200 dark:hover:border-zinc-700'
            ]"
          >
            <!-- Header of Card -->
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="space-y-1 max-w-[70%]">
                <span class="text-[10px] font-bold tracking-widest text-violet-500 uppercase">
                  {{ m.metric_key }}
                </span>
                <h4 class="text-xs font-bold text-slate-700 dark:text-zinc-100">
                  {{ m.display_name }}
                </h4>
                <p class="text-[10px] text-slate-400 font-medium leading-relaxed">
                  {{ m.description }}
                </p>
              </div>

              <!-- Action Button/Indicator when NOT editing -->
              <div v-if="editingKey !== m.metric_key" class="flex items-center gap-3">
                <div v-if="getThresholdForMetric(m.metric_key)" class="text-right">
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold"
                    :class="[
                      getThresholdForMetric(m.metric_key).is_active 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                    ]"
                  >
                    {{ getThresholdForMetric(m.metric_key).is_active ? 'Aktif' : 'Nonaktif' }}
                  </span>
                  <div class="text-[11px] font-black text-slate-600 dark:text-zinc-300 mt-1">
                    {{ getThresholdForMetric(m.metric_key).operator.toUpperCase() }} {{ getThresholdForMetric(m.metric_key).threshold_value }}
                  </div>
                </div>
                
                <button
                  @click="startEdit(m.metric_key)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  :class="[
                    getThresholdForMetric(m.metric_key)
                      ? 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                      : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-600/20'
                  ]"
                >
                  <Edit2 v-if="getThresholdForMetric(m.metric_key)" :size="10" />
                  <Plus v-else :size="10" />
                  {{ getThresholdForMetric(m.metric_key) ? 'Sunting' : 'Atur Batas' }}
                </button>
              </div>
            </div>

            <!-- Inline Editing Form Panel -->
            <div 
              v-if="editingKey === m.metric_key" 
              class="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200"
            >
              <!-- Rule Formula Inputs -->
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-2">
                  <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-bold text-slate-400 uppercase pl-0.5">Operator</label>
                    <select 
                      v-model="form.operator" 
                      class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-violet-600"
                    >
                      <option value="lt">&lt; (Kurang dari)</option>
                      <option value="lte">&le; (Kurang dari/Sama)</option>
                      <option value="gt">&gt; (Lebih dari)</option>
                      <option value="gte">&ge; (Lebih dari/Sama)</option>
                    </select>
                  </div>
                  
                  <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-bold text-slate-400 uppercase pl-0.5">Nilai Batas</label>
                    <input 
                      type="number" 
                      v-model.number="form.threshold_value" 
                      step="any"
                      class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-violet-600"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div class="flex flex-col gap-1">
                    <label class="text-[9px] font-bold text-slate-400 uppercase pl-0.5">Cooldown Notif (Jam)</label>
                    <input 
                      type="number" 
                      v-model.number="form.notify_cooldown_hours" 
                      class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-violet-600"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5 justify-end pb-1.5 pl-2">
                    <label class="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        v-model="form.is_active" 
                        class="rounded border-slate-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-600 w-3.5 h-3.5"
                      />
                      <span class="text-xs font-bold text-slate-600 dark:text-zinc-300">Aktifkan Aturan</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Roles to Alert -->
              <div class="flex flex-col justify-between">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[9px] font-bold text-slate-400 uppercase pl-0.5 flex items-center gap-1">
                    <Bell :size="10" /> Jabatan yang Menerima Alarm
                  </label>
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="r in rolesList"
                      :key="r.value"
                      type="button"
                      @click="toggleRole(r.value)"
                      class="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border"
                      :class="[
                        form.notify_roles.includes(r.value)
                          ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                          : 'bg-white border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 hover:border-slate-300'
                      ]"
                    >
                      {{ r.label }}
                    </button>
                  </div>
                </div>

                <!-- Action Button Save / Cancel -->
                <div class="flex items-center justify-end gap-2 mt-4 md:mt-0">
                  <button
                    @click="cancelEdit"
                    class="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    @click="save"
                    :disabled="saving"
                    class="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[10px] font-bold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-all shadow-md shadow-violet-600/10"
                  >
                    <Check :size="11" />
                    {{ saving ? 'Menyimpan...' : 'Simpan' }}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>
