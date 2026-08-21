<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { BaseModal, BaseButton, BaseInput } from '@eduraport/ui'
import { ASSET_CATEGORIES, DEPRECIATION_METHODS } from '@eduraport/shared'

const props = defineProps<{
  show: boolean
  initialData?: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: any, photoFile?: File): void
}>()

const form = ref({
  name: '',
  category: 'electronic',
  purchase_date: new Date().toISOString().split('T')[0],
  purchase_cost: '',
  quantity: 1,
  condition: 'good',
  condition_change_reason: '',
  location: '',
  useful_life_years: null as number | null,
  depreciation_method: 'straight_line',
  description: ''
})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.initialData) {
      form.value = {
        name: props.initialData.name || '',
        category: props.initialData.category || 'electronic',
        purchase_date: props.initialData.purchase_date ? (typeof props.initialData.purchase_date === 'string' ? props.initialData.purchase_date.substring(0,10) : new Date(props.initialData.purchase_date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        purchase_cost: props.initialData.purchase_cost ? String(props.initialData.purchase_cost) : '',
        quantity: props.initialData.quantity || 1,
        condition: props.initialData.condition || 'good',
        condition_change_reason: '',
        location: props.initialData.location || '',
        useful_life_years: props.initialData.useful_life_years || null,
        depreciation_method: props.initialData.depreciation_method || 'straight_line',
        description: props.initialData.description || ''
      }
    } else {
      form.value = {
        name: '',
        category: 'electronic',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_cost: '',
        quantity: 1,
        condition: 'good',
        condition_change_reason: '',
        location: '',
        useful_life_years: null,
        depreciation_method: 'straight_line',
        description: ''
      }
    }
    photoFile.value = null
    photoPreview.value = null
  }
})

const isEdit = computed(() => !!props.initialData?.id)
const conditionChanged = computed(() => isEdit.value && form.value.condition !== props.initialData?.condition)

const handlePhotoChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    photoFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removePhoto = () => {
  photoFile.value = null
  photoPreview.value = null
}

const handleSubmit = () => {
  const payload = { ...form.value }
  emit('save', payload, photoFile.value || undefined)
}
</script>

<template>
  <BaseModal :show="show" :title="isEdit ? 'Edit Aset' : 'Daftarkan Aset Baru'" size="xl" @close="$emit('close')">
    <div class="space-y-4">
      <div v-if="isEdit" class="text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <span class="text-slate-500 dark:text-slate-400">Kode Aset:</span> <span class="font-mono font-medium text-slate-800 dark:text-slate-200">{{ initialData?.code }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Barang *</label>
          <BaseInput v-model="form.name" placeholder="Misal: Laptop Asus ExpertBook" required />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Kategori *</label>
          <select v-model="form.category" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option v-for="cat in ASSET_CATEGORIES" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Tgl Perolehan *</label>
          <input type="date" v-model="form.purchase_date" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Harga (Rp) *</label>
          <BaseInput v-model="form.purchase_cost" type="number" placeholder="0" min="0" required />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Kuantitas *</label>
          <BaseInput v-model="form.quantity" type="number" min="1" required />
        </div>
      </div>

      <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h4 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Kondisi & Lokasi</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Kondisi Fisik *</label>
              <select v-model="form.condition" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="good">Baik</option>
                <option value="repair_needed">Perlu Perbaikan</option>
                <option value="broken">Rusak</option>
              </select>
            </div>
            
            <div v-if="conditionChanged" class="space-y-1 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700/30">
              <label class="text-sm font-medium text-amber-900 dark:text-amber-500">Alasan Perubahan Kondisi *</label>
              <textarea v-model="form.condition_change_reason" rows="2" class="w-full rounded-md border border-amber-300 dark:border-amber-700/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-900 dark:text-slate-100" placeholder="Sebutkan alasannya..." required></textarea>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Lokasi / Ruangan</label>
            <BaseInput v-model="form.location" placeholder="Misal: Lab Komputer 1" />
          </div>
        </div>
      </div>

      <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h4 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Penyusutan & Info Lain</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Metode Penyusutan</label>
            <select v-model="form.depreciation_method" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option v-for="m in DEPRECIATION_METHODS" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Masa Manfaat (Tahun)</label>
            <BaseInput v-model="form.useful_life_years" type="number" min="0" placeholder="0" />
          </div>
        </div>

        <div class="mt-4 space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Deskripsi Tambahan</label>
          <textarea v-model="form.description" rows="2" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Catatan opsional..."></textarea>
        </div>
        
        <div class="mt-4 space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Foto Aset (Opsional)</label>
          <div v-if="photoPreview" class="relative w-32 h-32 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50 mb-2">
            <img :src="photoPreview" class="w-full h-full object-cover" />
            <button @click="removePhoto" class="absolute top-1 right-1 bg-white/80 dark:bg-slate-900/80 p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/50"><X class="w-4 h-4" /></button>
          </div>
          <input type="file" accept="image/*" @change="handlePhotoChange" class="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-500/20 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-500/30" />
        </div>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 w-full">
      <BaseButton variant="outline" @click="$emit('close')">Batal</BaseButton>
      <BaseButton @click="handleSubmit" :disabled="!form.name || !form.purchase_cost || (conditionChanged && !form.condition_change_reason)">Simpan Aset</BaseButton>
    </div>
  </BaseModal>
</template>

