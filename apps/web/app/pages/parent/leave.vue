<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FileEdit, ArrowLeft, Plus, Clock, CheckCircle2, XCircle, Paperclip, Camera } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal } from '@eduraport/ui'
import { useParent } from '../../composables/useParent'
import { useToast } from '../../composables/useToast'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) return navigateTo('/login')
    }
  ]
})

const { fetchMyChildren, myChildren, submitLeaveRequest, fetchLeaveRequests } = useParent()
const toast = useToast()

const loading = ref(true)
const leaveList = ref<any[]>([])
const isFormModalOpen = ref(false)
const submitting = ref(false)

const form = ref({
  student_id: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
  reason: '',
  attachment_url: ''
})

const loadData = async () => {
  loading.value = true
  try {
    await fetchMyChildren()
    if (myChildren.value.length > 0) {
      form.value.student_id = myChildren.value[0].student_id
    }
    leaveList.value = await fetchLeaveRequests()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const openFormModal = () => {
  if (myChildren.value.length > 0 && !form.value.student_id) {
    form.value.student_id = myChildren.value[0].student_id
  }
  isFormModalOpen.value = true
}

const handleFileUpload = (e: any) => {
  const file = e.target.files[0]
  if (file) {
    form.value.attachment_url = URL.createObjectURL(file)
    toast.success('Surat dokter/keterangan berhasil dipilih.', 'Sukses')
  }
}

const handleSubmit = async () => {
  if (!form.value.student_id || !form.value.reason.trim()) {
    toast.error('Pilih siswa dan isi alasan izin.', 'Peringatan')
    return
  }
  submitting.value = true
  try {
    await submitLeaveRequest({
      student_id: form.value.student_id,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      reason: form.value.reason,
      attachment_url: form.value.attachment_url || null
    })
    toast.success('Pengajuan izin berhasil dikirim ke pihak sekolah.', 'Sukses')
    isFormModalOpen.value = false
    form.value.reason = ''
    form.value.attachment_url = ''
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengajukan izin.', 'Error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-violet-600 transition">
          <ArrowLeft :size="18" />
        </NuxtLink>
        <div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <FileEdit class="text-amber-500" :size="24" />
            Pengajuan Izin & Sakit
          </h2>
          <p class="text-xs text-slate-500">Ajukan surat izin ketidakhadiran siswa secara digital</p>
        </div>
      </div>

      <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center gap-1.5" @click="openFormModal">
        <Plus :size="16" /> Ajukan Izin Baru
      </BaseButton>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-3">
      <div v-if="leaveList.length > 0" class="space-y-3">
        <BaseCard v-for="item in leaveList" :key="item.id">
          <div class="flex justify-between items-start">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span
                  class="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  :class="[
                    item.status === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' :
                    item.status === 'rejected' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                  ]"
                >
                  {{ item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu Persetujuan' }}
                </span>
                <span class="text-xs font-bold text-slate-900 dark:text-zinc-100">{{ item.student_name }}</span>
              </div>

              <p class="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-1">{{ item.reason }}</p>
              <p class="text-[10px] text-slate-400">
                Tanggal: {{ item.start_date }} s/d {{ item.end_date }}
              </p>

              <a
                v-if="item.attachment_url"
                :href="item.attachment_url"
                target="_blank"
                class="inline-flex items-center gap-1 text-[10px] text-violet-600 font-semibold hover:underline mt-1"
              >
                <Paperclip :size="12" /> Lihat Surat Keterangan / Dokter
              </a>
            </div>

            <div class="text-[10px] text-slate-400">
              {{ new Date(item.created_at).toLocaleDateString('id-ID') }}
            </div>
          </div>
        </BaseCard>
      </div>

      <div v-else class="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
        <CheckCircle2 class="mx-auto text-emerald-500 mb-2" :size="36" />
        <p class="text-sm font-bold text-slate-800 dark:text-zinc-200">Belum ada pengajuan izin</p>
        <p class="text-xs text-slate-400 mt-1">Gunakan tombol "Ajukan Izin Baru" saat ananda berhalangan hadir.</p>
      </div>
    </div>

    <!-- Modal Form Izin -->
    <BaseModal :show="isFormModalOpen" title="Form Pengajuan Izin / Sakit" @close="isFormModalOpen = false">
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Pilih Siswa</label>
          <select v-model="form.student_id" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-semibold text-xs outline-none focus:border-violet-600">
            <option v-for="c in myChildren" :key="c.student_id" :value="c.student_id">
              {{ c.student_name }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Tanggal Mulai</label>
            <input
              v-model="form.start_date"
              type="date"
              class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-semibold text-xs outline-none focus:border-violet-600"
            />
          </div>
          <div>
            <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Tanggal Selesai</label>
            <input
              v-model="form.end_date"
              type="date"
              class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-semibold text-xs outline-none focus:border-violet-600"
            />
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Alasan / Keterangan</label>
          <textarea
            v-model="form.reason"
            rows="3"
            placeholder="Contoh: Sakit demam berdarah dan harus istirahat rawat inap."
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-medium text-xs outline-none focus:border-violet-600"
          ></textarea>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Upload Surat Dokter / Keterangan (Opsional)</label>
          <div class="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-center cursor-pointer relative hover:border-violet-500 transition">
            <input type="file" accept="image/*,application/pdf" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleFileUpload" />
            <Camera class="mx-auto text-slate-400 mb-1" :size="20" />
            <p class="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Pilih Dokumen / Foto Surat</p>
          </div>
          <p v-if="form.attachment_url" class="text-emerald-600 font-semibold text-[10px] mt-1 flex items-center gap-1">
            <CheckCircle2 :size="12" /> Surat terlampir
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" size="sm" @click="isFormModalOpen = false">Batal</BaseButton>
          <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? 'Mengirim...' : 'Kirim Pengajuan Izin' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
