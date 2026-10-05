<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FileText, Download, CheckCircle, Clock, QrCode, ArrowLeft } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../../composables/useAuth'
import { useParent } from '../../../composables/useParent'
import { useToast } from '../../../composables/useToast'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) {
        return navigateTo('/login')
      }
    }
  ]
})

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { fetchDigitalRaport, approveReport } = useParent()
const toast = useToast()

const reportId = route.params.id as string
const studentId = route.query.studentId as string

const loading = ref(true)
const reportData = ref<any>(null)

// Modal states
const showSignatureModal = ref(false)
const submitting = ref(false)
const signatureForm = ref({
  agree_to_terms: false,
  signature_text: ''
})

onMounted(async () => {
  if (user.value?.id && studentId && reportId) {
    reportData.value = await fetchDigitalRaport(user.value.id, studentId, reportId)
    loading.value = false
  } else {
    toast.error('Data tidak lengkap', 'Gagal')
    router.push('/')
  }
})

const handleSignReport = async () => {
  if (!signatureForm.value.agree_to_terms) {
    toast.error('Anda harus menyetujui pernyataan untuk menandatangani', 'Peringatan')
    return
  }
  
  if (!signatureForm.value.signature_text.trim()) {
    toast.error('Nama terang harus diisi', 'Peringatan')
    return
  }

  submitting.value = true
  try {
    const res = await approveReport(user.value!.id, studentId, reportId, {
      agree_to_terms: signatureForm.value.agree_to_terms,
      signature_text: signatureForm.value.signature_text
    })
    
    if (res.success) {
      toast.success('Rapor berhasil ditandatangani', 'Sukses')
      showSignatureModal.value = false
      // Refresh report data
      reportData.value = await fetchDigitalRaport(user.value!.id, studentId, reportId)
    } else {
      toast.error(res.message || 'Gagal menandatangani rapor', 'Gagal')
    }
  } catch (error: any) {
    toast.error(error?.message || 'Terjadi kesalahan sistem', 'Error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/" class="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-500 hover:text-violet-600 transition-colors">
        <ArrowLeft :size="20" />
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-zinc-100">Detail Rapor Digital</h1>
        <p class="text-xs text-slate-500 mt-1">Lihat dan tandatangani rapor putra/putri Anda</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="!reportData" class="text-center py-12 bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
      <FileText class="mx-auto text-slate-300 dark:text-zinc-700 mb-3" :size="40" />
      <p class="text-sm font-semibold text-slate-700 dark:text-zinc-300">Rapor tidak ditemukan</p>
      <NuxtLink to="/" class="text-violet-600 text-xs mt-2 block hover:underline">Kembali ke Dashboard</NuxtLink>
    </div>

    <div v-else class="space-y-6">
      <!-- Report Header Info -->
      <BaseCard stripe class="relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-bl-full -z-10"></div>
        <div class="flex flex-col md:flex-row justify-between gap-6">
          <div class="space-y-4">
            <div>
              <h2 class="text-xl font-bold text-slate-900 dark:text-zinc-100">{{ reportData.title }}</h2>
              <p class="text-sm text-slate-500">Tahun Ajaran {{ reportData.academic_year }} &bull; Semester {{ reportData.semester }}</p>
            </div>

            <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span class="text-slate-500">Siswa:</span>
                <span class="font-bold text-slate-800 dark:text-zinc-200 ml-2">{{ reportData.student_name }}</span>
              </div>
              <div>
                <span class="text-slate-500">NISN:</span>
                <span class="font-bold text-slate-800 dark:text-zinc-200 ml-2">{{ reportData.student_nisn || '-' }}</span>
              </div>
              <div>
                <span class="text-slate-500">Kelas:</span>
                <span class="font-bold text-slate-800 dark:text-zinc-200 ml-2">{{ reportData.class_name }}</span>
              </div>
              <div>
                <span class="text-slate-500">Wali Kelas:</span>
                <span class="font-bold text-slate-800 dark:text-zinc-200 ml-2">{{ reportData.homeroom_teacher }}</span>
              </div>
            </div>
          </div>

          <!-- Status & Actions -->
          <div class="flex flex-col items-start md:items-end gap-3">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border"
                 :class="[
                   reportData.status === 'APPROVED_BY_PARENT' 
                     ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
                     : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
                 ]"
            >
              <CheckCircle v-if="reportData.status === 'APPROVED_BY_PARENT'" :size="16" />
              <Clock v-else :size="16" />
              {{ reportData.status === 'APPROVED_BY_PARENT' ? 'Telah Ditandatangani' : 'Menunggu Tanda Tangan' }}
            </div>
            
            <p v-if="reportData.parent_approved_at" class="text-[10px] text-slate-500">
              Pada: {{ new Date(reportData.parent_approved_at).toLocaleString('id-ID') }}
            </p>
            
            <div class="flex gap-2 mt-2 w-full md:w-auto">
              <a v-if="reportData.pdf_url" :href="reportData.pdf_url" target="_blank" class="flex-1 md:flex-none">
                <BaseButton variant="outline" class="w-full justify-center">
                  <Download class="mr-2" :size="16" /> Unduh PDF
                </BaseButton>
              </a>
              <BaseButton 
                v-if="reportData.status !== 'APPROVED_BY_PARENT'" 
                variant="primary" 
                class="flex-1 md:flex-none justify-center shadow-lg shadow-violet-600/20"
                @click="showSignatureModal = true"
              >
                Tandatangani Rapor
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Teacher's Note -->
      <BaseCard v-if="reportData.teacher_notes" stripe>
        <h3 class="font-bold text-slate-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
          <FileText class="text-violet-600" :size="18" /> Catatan Wali Kelas
        </h3>
        <div class="bg-violet-50/50 dark:bg-violet-900/10 p-4 rounded-lg text-sm text-slate-700 dark:text-zinc-300 italic border border-violet-100 dark:border-violet-900/30">
          "{{ reportData.teacher_notes }}"
        </div>
      </BaseCard>

      <!-- Grades Summary -->
      <BaseCard stripe>
        <h3 class="font-bold text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <CheckCircle class="text-emerald-600" :size="18" /> Ringkasan Nilai
        </h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-slate-500">
                <th class="p-3 rounded-tl-lg">Mata Pelajaran</th>
                <th class="p-3 text-center">KKM</th>
                <th class="p-3 text-center">Nilai Akhir</th>
                <th class="p-3 rounded-tr-lg">Predikat</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-zinc-800">
              <tr v-for="grade in reportData.grades" :key="grade.subject_id" class="text-sm font-medium hover:bg-slate-50/50 transition-colors">
                <td class="p-3 text-slate-800 dark:text-zinc-200">{{ grade.subject_name }}</td>
                <td class="p-3 text-center text-slate-500">{{ grade.kkm || 75 }}</td>
                <td class="p-3 text-center font-bold" :class="grade.score >= (grade.kkm || 75) ? 'text-emerald-600' : 'text-rose-600'">
                  {{ grade.score }}
                </td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        :class="{
                          'bg-emerald-100 text-emerald-700': grade.predicate === 'A',
                          'bg-blue-100 text-blue-700': grade.predicate === 'B',
                          'bg-amber-100 text-amber-700': grade.predicate === 'C',
                          'bg-rose-100 text-rose-700': grade.predicate === 'D' || grade.predicate === 'E'
                        }">
                    {{ grade.predicate || '-' }}
                  </span>
                </td>
              </tr>
              <tr v-if="!reportData.grades || reportData.grades.length === 0">
                <td colspan="4" class="p-4 text-center text-sm text-slate-500">Data nilai tidak tersedia untuk rapor ini. Silakan unduh PDF untuk rincian lengkap.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>

      <!-- QR Code Validation -->
      <BaseCard v-if="reportData.qr_code_url" class="flex flex-col items-center justify-center text-center py-6">
        <QrCode class="text-slate-300 mb-2" :size="32" />
        <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-200">Validasi Rapor</h4>
        <p class="text-xs text-slate-500 mt-1 max-w-xs">Rapor ini dilengkapi dengan kode QR untuk verifikasi keaslian dokumen digital.</p>
        <img :src="reportData.qr_code_url" alt="QR Code" class="w-32 h-32 mt-4 rounded-lg border border-slate-200" />
      </BaseCard>
    </div>

    <!-- Digital Signature Modal -->
    <BaseModal :show="showSignatureModal" title="Tanda Tangan Digital Rapor" @close="showSignatureModal = false">
      <div class="space-y-5">
        <div class="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 rounded-lg">
          <h4 class="text-sm font-bold text-amber-800 dark:text-amber-500 flex items-center gap-2">
            <AlertCircle :size="16" /> Pernyataan Pengesahan
          </h4>
          <p class="text-xs text-amber-700 dark:text-amber-600 mt-2 leading-relaxed">
            Dengan menandatangani dokumen ini secara digital, saya menyatakan bahwa saya telah menerima, membaca, dan memahami hasil evaluasi belajar putra/putri saya. Tanda tangan digital ini sah dan memiliki kekuatan hukum yang sama dengan tanda tangan basah.
          </p>
        </div>

        <form @submit.prevent="handleSignReport" class="space-y-4">
          <label class="flex items-start gap-3 p-3 border border-slate-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
            <input type="checkbox" v-model="signatureForm.agree_to_terms" class="mt-0.5 w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-600" />
            <span class="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Saya menyetujui pernyataan pengesahan di atas dan menerima rapor ini.
            </span>
          </label>

          <BaseInput 
            v-model="signatureForm.signature_text" 
            label="Ketik Nama Terang Anda Sebagai Tanda Tangan" 
            placeholder="Contoh: Budi Santoso"
            :disabled="!signatureForm.agree_to_terms"
            required 
          />

          <!-- Visual Signature Preview -->
          <div v-if="signatureForm.signature_text" class="p-6 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg flex items-center justify-center min-h-[100px] overflow-hidden">
            <span class="font-signature text-4xl text-slate-800 dark:text-zinc-200 transform -rotate-2" style="font-family: 'Brush Script MT', cursive, sans-serif;">
              {{ signatureForm.signature_text }}
            </span>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <BaseButton variant="outline" type="button" @click="showSignatureModal = false" :disabled="submitting">Batal</BaseButton>
            <BaseButton variant="primary" type="submit" :loading="submitting" :disabled="!signatureForm.agree_to_terms">
              Sahkan Rapor
            </BaseButton>
          </div>
        </form>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');

.font-signature {
  font-family: 'Dancing Script', 'Brush Script MT', cursive;
}
</style>
