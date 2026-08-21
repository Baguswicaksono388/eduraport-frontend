<script setup lang="ts">
import { ref, watch } from 'vue'
import { BaseModal, BaseButton, BaseInput } from '@eduraport/ui'
import { AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  asset: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: any): void
}>()

const form = ref({
  disposal_date: new Date().toISOString().split('T')[0],
  disposal_reason: ''
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    form.value = {
      disposal_date: new Date().toISOString().split('T')[0],
      disposal_reason: ''
    }
  }
})

const handleSubmit = () => {
  emit('save', { ...form.value })
}
</script>

<template>
  <BaseModal :show="show" title="Penghapusbukuan Aset" @close="$emit('close')">
    <div class="space-y-4">
      <div class="bg-rose-50 p-3 rounded-lg border border-rose-200 flex items-start gap-3">
        <AlertCircle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div class="text-sm text-rose-800">
          <p class="font-medium">Perhatian</p>
          <p class="mt-1">Aset yang dihapusbukukan tidak akan muncul di daftar aktif. Data tidak dihapus dari sistem dan dapat dilihat kembali menggunakan filter.</p>
        </div>
      </div>

      <div class="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <div class="text-sm">
          <span class="text-slate-500 dark:text-slate-400 block mb-1">Aset yang akan dihapusbukukan:</span>
          <span class="font-medium text-slate-900 dark:text-slate-100 block">{{ asset?.name }}</span>
          <span class="font-mono text-slate-500 dark:text-slate-400 mt-1 block">{{ asset?.code }}</span>
        </div>
      </div>

      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Tanggal Penghapusbukuan *</label>
          <input type="date" v-model="form.disposal_date" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
        </div>
        
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Alasan Penghapusbukuan *</label>
          <textarea v-model="form.disposal_reason" rows="3" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Contoh: Rusak total tidak dapat diperbaiki, dijual, dihibahkan, dsb." required minlength="10"></textarea>
        </div>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 w-full">
      <BaseButton variant="outline" @click="$emit('close')">Batal</BaseButton>
      <BaseButton @click="handleSubmit" variant="danger" :disabled="!form.disposal_date || form.disposal_reason.length < 5">
        Konfirmasi Hapusbuku
      </BaseButton>
    </div>
  </BaseModal>
</template>

