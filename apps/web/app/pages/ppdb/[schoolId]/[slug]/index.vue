<script setup lang="ts">
import { GraduationCap, ArrowRight, CheckCircle2, Copy, Check, Calendar, Users, FileText, X } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseInput } from '@eduraport/ui'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: false
})

const route = useRoute()
const schoolId = route.params.schoolId as string
const slug = route.params.slug as string

const loading = ref(true)
const submitting = ref(false)
const batch = ref<any>(null)
const fields = ref<any[]>([])
const error = ref<string | null>(null)

// Form states
const form = reactive({
  full_name: '',
  parent_name: '',
  parent_phone: '',
  parent_email: '',
  form_answers: {} as Record<string, any>
})

// Success states
const isSuccess = ref(false)
const generatedRegNumber = ref('')
const copied = ref(false)

const fetchBatchDetails = async () => {
  try {
    loading.value = true
    const response = await fetch(`http://localhost:3000/api/v1/school/${schoolId}/ppdb/public/batches/${slug}`)
    const res = await response.json()
    if (res.success) {
      batch.value = res.data.batch
      fields.value = res.data.fields
      // Initialize form answers dictionary
      res.data.fields.forEach((f: any) => {
        form.form_answers[f.field_key] = ''
      })
    } else {
      error.value = res.message || 'Gelombang pendaftaran tidak ditemukan.'
    }
  } catch (err) {
    console.error(err)
    error.value = 'Terjadi kesalahan koneksi saat mengambil data pendaftaran.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBatchDetails()
})

const handleSubmit = async () => {
  try {
    submitting.value = true
    const response = await fetch(`http://localhost:3000/api/v1/school/${schoolId}/ppdb/public/batches/${slug}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    })
    const res = await response.json()
    if (res.success) {
      generatedRegNumber.value = res.data.registration_number
      isSuccess.value = true
    } else {
      alert(res.message || 'Gagal mengirimkan pendaftaran. Silakan periksa kembali data Anda.')
    }
  } catch (err) {
    alert('Terjadi kesalahan koneksi saat mengirim pendaftaran.')
  } finally {
    submitting.value = false
  }
}

const copyRegNumber = () => {
  navigator.clipboard.writeText(generatedRegNumber.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="min-h-screen bg-slate-55/40 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col font-sans">
    
    <!-- Header -->
    <header class="bg-white dark:bg-zinc-900 border-b border-slate-200/60 dark:border-zinc-800/80 px-6 py-4 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20">
          <GraduationCap class="text-white" :size="18" />
        </div>
        <div>
          <h1 class="text-sm font-bold tracking-tight leading-tight">EduRaport</h1>
          <span class="text-[8px] uppercase tracking-wider text-amber-500 font-bold">Penerimaan Siswa Baru</span>
        </div>
      </div>
      <NuxtLink to="/ppdb/status" class="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
        Cek Status Pendaftaran
      </NuxtLink>
    </header>

    <!-- Main Content Container -->
    <main class="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
      
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
        <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-xs text-slate-400 dark:text-zinc-500 font-semibold">Memuat formulir pendaftaran...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-150 dark:border-zinc-800">
        <div class="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4">
          <X :size="24" />
        </div>
        <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-200">Gagal Memuat Formulir</h3>
        <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">{{ error }}</p>
      </div>

      <!-- Success Screen -->
      <div v-else-if="isSuccess" class="space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div class="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-md border border-slate-200/50 dark:border-zinc-800/80 text-center space-y-6">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
            <CheckCircle2 :size="36" />
          </div>
          
          <div class="space-y-2">
            <h2 class="text-xl font-bold text-slate-900 dark:text-zinc-100">Pendaftaran Berhasil Dikirim!</h2>
            <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Terima kasih telah mendaftar di sekolah kami. Formulir Anda telah berhasil kami simpan dalam sistem.
            </p>
          </div>

          <!-- Registration Card -->
          <div class="bg-slate-50 dark:bg-zinc-950 p-5 rounded-xl border border-slate-200/60 dark:border-zinc-850/80 max-w-sm mx-auto space-y-3">
            <span class="text-[9px] uppercase tracking-widest font-bold text-slate-400">Nomor Pendaftaran Anda</span>
            <div class="flex items-center justify-center gap-2">
              <span class="text-lg font-extrabold text-violet-600 tracking-wider">{{ generatedRegNumber }}</span>
              <button 
                type="button" 
                @click="copyRegNumber" 
                class="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Salin Nomor"
              >
                <Check v-if="copied" class="text-emerald-500" :size="14" />
                <Copy v-else :size="14" />
              </button>
            </div>
            <p class="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold leading-relaxed">
              *Harap simpan nomor pendaftaran ini baik-baik untuk melakukan cek status kelulusan dan upload bukti pembayaran formulir.
            </p>
          </div>

          <div class="pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 justify-center">
            <NuxtLink :to="`/ppdb/status?reg=${generatedRegNumber}`" class="inline-flex justify-center items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-lg shadow-violet-600/10">
              Lanjutkan Pembayaran & Cek Status <ArrowRight :size="14" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Registration Form -->
      <div v-else class="space-y-6 animate-in fade-in duration-500">
        <!-- Batch details Banner -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-zinc-100">{{ batch.name }}</h2>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenjang {{ batch.level }}</span>
            </div>
            <span class="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Pendaftaran Dibuka
            </span>
          </div>
          
          <p v-if="batch.description" class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed border-t border-slate-50 dark:border-zinc-850/50 pt-3">
            {{ batch.description }}
          </p>

          <div class="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-zinc-850/50 pt-4 text-xs">
            <div class="flex items-center gap-2 text-slate-500">
              <Calendar :size="14" class="text-slate-400" />
              <span>Batas Akhir: <strong>{{ new Date(batch.registration_end).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) }}</strong></span>
            </div>
            <div class="flex items-center gap-2 text-slate-500">
              <FileText :size="14" class="text-slate-400" />
              <span>Biaya Pendaftaran: <strong>{{ Number(batch.registration_fee) > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(batch.registration_fee) : 'Gratis' }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Registration Form Card -->
        <form @submit.prevent="handleSubmit" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-850/50 pb-2 flex items-center gap-1.5">
            <Users :size="14" /> Informasi Utama Pendaftaran
          </h3>

          <!-- Standard Fields -->
          <div class="space-y-4">
            <BaseInput v-model="form.full_name" label="Nama Lengkap Calon Siswa" placeholder="Masukkan nama lengkap calon siswa" required />
            <BaseInput v-model="form.parent_name" label="Nama Lengkap Orang Tua / Wali" placeholder="Masukkan nama orang tua atau wali" required />
            <BaseInput v-model="form.parent_phone" label="Nomor WhatsApp Orang Tua / Wali (Kontak Utama)" placeholder="Contoh: 08123456789" required />
            <BaseInput v-model="form.parent_email" type="email" label="Alamat Email Orang Tua / Wali (Opsional)" placeholder="Contoh: email@domain.com" />
          </div>

          <!-- Custom Fields -->
          <div v-if="fields.length > 0" class="space-y-6 pt-4 border-t border-slate-100 dark:border-zinc-850">
            <h3 class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest pb-2 flex items-center gap-1.5">
              <FileText :size="14" /> Pertanyaan Persyaratan Sekolah
            </h3>

            <div class="space-y-4">
              <div v-for="field in fields" :key="field.id" class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {{ field.label }} <span v-if="field.is_required" class="text-rose-500">*</span>
                </label>

                <!-- Text / Textarea / Number / Date inputs -->
                <input 
                  v-if="['text', 'number', 'date'].includes(field.field_type)"
                  v-model="form.form_answers[field.field_key]"
                  :type="field.field_type"
                  :placeholder="field.placeholder || ''"
                  :required="!!field.is_required"
                  class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                />

                <textarea
                  v-else-if="field.field_type === 'textarea'"
                  v-model="form.form_answers[field.field_key]"
                  :placeholder="field.placeholder || ''"
                  :required="!!field.is_required"
                  rows="3"
                  class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                ></textarea>

                <!-- Select Dropdown -->
                <select
                  v-else-if="field.field_type === 'select'"
                  v-model="form.form_answers[field.field_key]"
                  :required="!!field.is_required"
                  class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                >
                  <option value="" disabled>{{ field.placeholder || 'Pilih salah satu...' }}</option>
                  <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>

                <!-- Radio Buttons -->
                <div v-else-if="field.field_type === 'radio'" class="flex flex-wrap gap-4 pt-1">
                  <label v-for="opt in field.options" :key="opt.value" class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
                    <input 
                      type="radio" 
                      v-model="form.form_answers[field.field_key]" 
                      :value="opt.value" 
                      :required="!!field.is_required"
                      class="text-violet-600 focus:ring-violet-600 border-slate-350"
                    />
                    <span>{{ opt.label }}</span>
                  </label>
                </div>

                <!-- Sub-Text Small Info -->
                <span v-if="field.help_text" class="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal">{{ field.help_text }}</span>
              </div>
            </div>
          </div>

          <!-- Form Submit Button -->
          <div class="pt-6 border-t border-slate-100 dark:border-zinc-850 flex justify-end">
            <BaseButton type="submit" variant="primary" :disabled="submitting" class="w-full sm:w-auto py-2.5 px-6 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/10">
              {{ submitting ? 'Mengirimkan Pendaftaran...' : 'Kirim Pendaftaran Siswa Baru' }}
              <ArrowRight v-if="!submitting" :size="14" />
            </BaseButton>
          </div>
        </form>
      </div>

    </main>

    <!-- Footer -->
    <footer class="py-6 border-t border-slate-200/50 dark:border-zinc-900 text-center text-[10px] text-slate-400 font-semibold tracking-wide">
      &copy; 2026 EduRaport Sekolah. Seluruh hak cipta dilindungi undang-undang.
    </footer>

  </div>
</template>
