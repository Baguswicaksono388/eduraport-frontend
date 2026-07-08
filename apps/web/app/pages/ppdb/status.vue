<script setup lang="ts">
import { GraduationCap, Search, FileText, Calendar, DollarSign, Upload, CheckCircle2, AlertCircle, Clock, ArrowLeft, Copy, Check } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseInput } from '@eduraport/ui'
import { useRoute } from 'vue-router'
import { usePpdb } from '../../composables/usePpdb'

definePageMeta({
  layout: false
})

const route = useRoute()
const searchInput = ref((route.query.reg as string) || '')
const config = useRuntimeConfig()
const loading = ref(false)
const uploading = ref(false)
const applicant = ref<any>(null)
const error = ref<string | null>(null)
const successMsg = ref<string | null>(null)
const copied = ref(false)

const { uploadAcceptedDocument, fetchApplicantDocuments } = usePpdb()

// Document upload form
const docType = ref('kartu_keluarga')
const docLabel = ref('')
const docFileName = ref('dokumen.png')
const docFileUrl = ref('https://via.placeholder.com/600x400.png?text=Dokumen+PPDB') // Mock
const docFilePreview = ref<string | null>(null)
const docFileInput = ref<HTMLInputElement | null>(null)
const uploadedDocs = ref<any[]>([])

// Payment upload form
const paymentForm = reactive({
  amount_claimed: 0,
  transfer_date: '',
  bank_name: '',
  transfer_from_name: '',
  file_url: 'https://via.placeholder.com/600x400.png?text=Bukti+Transfer+PPDB', // Mock file upload
  file_name: 'bukti_transfer.png'
})

const fileInput = ref<HTMLInputElement | null>(null)
const filePreview = ref<string | null>(null)

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    paymentForm.file_name = file.name
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64String = event.target.result as string
        paymentForm.file_url = base64String
        filePreview.value = base64String
      }
    }
    reader.readAsDataURL(file)
  }
}

const viewFullImage = (url: string) => {
  if (!url) return
  if (url.startsWith('data:')) {
    const win = window.open()
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Bukti Transfer</title>
            <style>
              body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            </style>
          </head>
          <body>
            <img src="${url}" />
          </body>
        </html>
      `)
      win.document.close()
    }
  } else {
    window.open(url, '_blank')
  }
}

const loadApplicantDocuments = async () => {
  if (!applicant.value) return
  const res = await fetchApplicantDocuments(applicant.value.registration_number)
  if (res.success) {
    uploadedDocs.value = res.data
  }
}

const triggerDocFileSelect = () => {
  docFileInput.value?.click()
}

const onDocFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    docFileName.value = file.name
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64String = event.target.result as string
        docFileUrl.value = base64String
        docFilePreview.value = base64String
      }
    }
    reader.readAsDataURL(file)
  }
}

const handleUploadDocument = async () => {
  try {
    uploading.value = true
    successMsg.value = null
    error.value = null

    const label = docType.value === 'kartu_keluarga' ? 'Kartu Keluarga' :
                  docType.value === 'akte_kelahiran' ? 'Akta Kelahiran' :
                  docType.value === 'ijazah' ? 'Ijazah / SKL' : docLabel.value || 'Dokumen Lain'

    const res = await uploadAcceptedDocument(applicant.value.registration_number, {
      document_type: docType.value,
      document_label: label,
      file_url: docFileUrl.value,
      file_name: docFileName.value
    })

    if (res.success) {
      successMsg.value = 'Dokumen persyaratan pasca penerimaan berhasil diunggah!'
      docLabel.value = ''
      docFilePreview.value = null
      docFileName.value = 'dokumen.png'
      await loadApplicantDocuments()
    } else {
      error.value = res.message || 'Gagal mengunggah dokumen.'
    }
  } catch (err) {
    error.value = 'Terjadi kesalahan saat mengunggah dokumen.'
  } finally {
    uploading.value = false
  }
}

const handleSearch = async () => {
  if (!searchInput.value.trim()) return
  
  try {
    loading.value = true
    applicant.value = null
    error.value = null
    successMsg.value = null
    
    const response = await fetch(`${config.public.apiBase}/public/ppdb/status/${searchInput.value.trim()}`)
    const res = await response.json()
    
    if (res.success) {
      applicant.value = res.data
      paymentForm.amount_claimed = Number(res.data.batch_registration_fee || 0)
      // Set default transfer date to today
      paymentForm.transfer_date = new Date().toISOString().split('T')[0]
      if (res.data.status === 'accepted') {
        await loadApplicantDocuments()
      }
    } else {
      error.value = res.message || 'Nomor pendaftaran tidak ditemukan.'
    }
  } catch (err) {
    console.error(err)
    error.value = 'Gagal mengambil status pendaftaran. Silakan periksa koneksi internet Anda.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (searchInput.value) {
    handleSearch()
  }
})

const handleUploadPayment = async () => {
  try {
    uploading.value = true
    successMsg.value = null
    error.value = null
    
    const response = await fetch(`${config.public.apiBase}/school/${applicant.value.school_id}/ppdb/public/status/${applicant.value.registration_number}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentForm)
    })
    const res = await response.json()
    
    if (res.success) {
      successMsg.value = 'Bukti pembayaran berhasil diunggah! Mohon tunggu verifikasi oleh admin sekolah.'
      // Refresh applicant status
      await handleSearch()
    } else {
      error.value = res.message || 'Gagal mengunggah bukti pembayaran.'
    }
  } catch (err) {
    error.value = 'Terjadi kesalahan saat mengunggah bukti pembayaran.'
  } finally {
    uploading.value = false
  }
}

const copyToClipboard = (text: string) => {
  if (!process.client) return false
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
    return true
  } else {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      console.error('Fallback copy failed', err)
      document.body.removeChild(textArea)
      return false
    }
  }
}

const copyRegNumber = () => {
  copyToClipboard(applicant.value.registration_number)
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
          <span class="text-[8px] uppercase tracking-wider text-amber-500 font-bold">Portal Status PPDB</span>
        </div>
      </div>
      <NuxtLink to="/" class="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1">
        <ArrowLeft :size="14" /> Kembali ke Beranda
      </NuxtLink>
    </header>

    <main class="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
      
      <!-- Search Card -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 mb-6">
        <h2 class="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Cek Status Kelulusan & Pembayaran</h2>
        <p class="text-xs text-slate-400 dark:text-zinc-500">Masukkan 13 digit nomor pendaftaran yang Anda peroleh saat submit formulir (contoh: PPDB-2026-00001).</p>
        
        <form @submit.prevent="handleSearch" class="flex gap-2 pt-2">
          <input 
            v-model="searchInput" 
            type="text" 
            placeholder="Masukkan Nomor Pendaftaran (PPDB-YYYY-XXXXX)" 
            required 
            class="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-violet-600"
          />
          <BaseButton type="submit" variant="primary" :disabled="loading" class="py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/10">
            <Search :size="14" /> {{ loading ? 'Mencari...' : 'Cari' }}
          </BaseButton>
        </form>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
        <div class="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-xs text-slate-400 dark:text-zinc-500 font-medium">Mencari data pendaftaran...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-rose-500/10 border border-rose-500/20 text-rose-700 p-4 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed mb-6">
        <AlertCircle class="shrink-0 text-rose-600" :size="16" />
        <span>{{ error }}</span>
      </div>

      <!-- Success Alert Message -->
      <div v-if="successMsg" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed mb-6">
        <CheckCircle2 class="shrink-0 text-emerald-600" :size="16" />
        <span>{{ successMsg }}</span>
      </div>

      <!-- Applicant Details -->
      <div v-if="applicant && !loading" class="space-y-6 animate-in fade-in duration-300">
        
        <!-- Status Banner -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <span class="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Status Pendaftaran Calon Siswa</span>
          
          <!-- Status Badges -->
          <div class="flex justify-center">
            <span v-if="applicant.status === 'pending'" class="bg-amber-500/15 text-amber-600 border border-amber-500/30 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock :size="14" /> Menunggu Pembayaran
            </span>
            <span v-else-if="applicant.status === 'payment_review'" class="bg-blue-500/15 text-blue-600 border border-blue-500/30 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock :size="14" /> Bukti Pembayaran Direview
            </span>
            <span v-else-if="applicant.status === 'reviewing'" class="bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock :size="14" /> Berkas / Seleksi Direview
            </span>
            <span v-else-if="applicant.status === 'accepted'" class="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 :size="14" /> Dinyatakan DITERIMA
            </span>
            <span v-else-if="applicant.status === 'rejected'" class="bg-rose-500/15 text-rose-600 border border-rose-500/30 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle :size="14" /> Belum Lulus Seleksi
            </span>
            <span v-else-if="applicant.status === 'waitlisted'" class="bg-slate-500/15 text-slate-600 border border-slate-500/30 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock :size="14" /> Cadangan (Waitlisted)
            </span>
          </div>

          <!-- Note based on status -->
          <p class="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            <span v-if="applicant.status === 'pending'">Mohon lakukan pembayaran biaya formulir pendaftaran sebesar <strong>{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(applicant.batch_registration_fee) }}</strong> dan unggah bukti transfer di bawah.</span>
            <span v-else-if="applicant.status === 'payment_review'">Bukti pembayaran Anda sudah dikirim dan sedang diperiksa oleh bendahara sekolah. Proses verifikasi biasanya memakan waktu 1x24 jam.</span>
            <span v-else-if="applicant.status === 'reviewing'">Pembayaran Anda telah diverifikasi! Saat ini berkas pendaftaran Anda sedang direview oleh tim panitia PPDB.</span>
            <span v-else-if="applicant.status === 'accepted'">Selamat! Anda dinyatakan lolos seleksi penerimaan siswa baru pada <strong>{{ applicant.batch_name }}</strong>. Silakan hubungi admin sekolah untuk penyerahan dokumen persyaratan.</span>
            <span v-else-if="applicant.status === 'rejected'">Mohon maaf, Anda belum lulus seleksi gelombang ini. Tetap semangat dan terima kasih telah mendaftar. <span v-if="applicant.rejection_reason" class="block mt-1.5 text-rose-500 font-bold">*Alasan: {{ applicant.rejection_reason }}</span></span>
            <span v-else-if="applicant.status === 'waitlisted'">Anda berada dalam daftar cadangan. Tim panitia PPDB akan menghubungi Anda jika kuota pendaftar utama tidak terpenuhi.</span>
          </p>
        </div>

        <!-- Detail Information Card -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-850/50 pb-2">Informasi Biodata Pendaftar</h3>
          
          <div class="space-y-3 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-850/30">
              <span class="text-slate-400">Nomor Pendaftaran:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                {{ applicant.registration_number }}
                <button type="button" @click="copyRegNumber" class="text-slate-400 hover:text-slate-600">
                  <Check v-if="copied" class="text-emerald-500" :size="12" />
                  <Copy v-else :size="12" />
                </button>
              </span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-850/30">
              <span class="text-slate-400">Nama Calon Siswa:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">{{ applicant.full_name }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-850/30">
              <span class="text-slate-400">Gelombang PPDB:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">{{ applicant.batch_name }} ({{ applicant.batch_level }})</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-850/30">
              <span class="text-slate-400">Nama Orang Tua:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">{{ applicant.parent_name }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Nomor WA Orang Tua:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">{{ applicant.parent_phone }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Upload Section (Only shown when status is 'pending') -->
        <div v-if="applicant.status === 'pending' && Number(applicant.batch_registration_fee) > 0" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-850/50 pb-2 flex items-center gap-1.5">
            <DollarSign :size="14" /> Informasi Rekening Pembayaran
          </h3>

          <div class="bg-violet-600/5 border border-violet-500/10 p-4 rounded-xl space-y-2 text-xs">
            <p class="font-semibold text-slate-700 dark:text-zinc-300">Mohon lakukan pembayaran transfer ke rekening berikut:</p>
            <div class="font-bold text-slate-800 dark:text-zinc-100 space-y-1">
              <p>Bank: <strong class="text-violet-600">Bank Central Asia (BCA)</strong></p>
              <p>Nomor Rekening: <strong>8123-456-789</strong></p>
              <p>Atas Nama: <strong>YAYASAN PENDIDIKAN EDURAPORT</strong></p>
              <p class="pt-1.5">Nominal Transfer: <strong class="text-rose-600 text-sm">{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(applicant.batch_registration_fee) }}</strong></p>
            </div>
          </div>

          <!-- Payment Proof Upload Form -->
          <form @submit.prevent="handleUploadPayment" class="space-y-4">
            <h4 class="text-xs font-bold text-slate-700 dark:text-zinc-300">Unggah Bukti Transfer</h4>
            
            <div class="grid grid-cols-2 gap-4">
              <BaseInput v-model="paymentForm.bank_name" label="Bank Pengirim Anda" placeholder="Contoh: Bank Mandiri / BCA" required />
              <BaseInput v-model="paymentForm.transfer_from_name" label="Nama Pemilik Rekening" placeholder="Nama sesuai buku tabungan" required />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <BaseInput v-model.number="paymentForm.amount_claimed" type="number" label="Jumlah Uang di-Transfer (Rp)" required />
              <BaseInput v-model="paymentForm.transfer_date" type="date" label="Tanggal Transfer" required />
            </div>

            <!-- Upload File Box placeholder (Mock / Clickable) -->
            <div 
              @click="triggerFileSelect"
              class="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-6 text-center space-y-2 cursor-pointer hover:border-violet-600/40 transition-colors"
            >
              <input 
                ref="fileInput" 
                type="file" 
                accept="image/*" 
                class="hidden" 
                @change="onFileChange" 
              />
              <Upload class="mx-auto text-slate-400" :size="24" />
              <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">{{ paymentForm.file_name || 'bukti_transfer.png' }}</p>
              <p class="text-[10px] text-slate-400 dark:text-zinc-500">*Klik untuk memilih berkas bukti transfer baru.</p>
              
              <div v-if="filePreview" class="mt-2 border border-slate-100 dark:border-zinc-850 rounded-lg overflow-hidden bg-slate-50 dark:bg-zinc-950 p-1 inline-block">
                <img :src="filePreview" class="max-h-32 object-contain" />
              </div>
            </div>

            <div class="flex justify-end pt-3">
              <BaseButton type="submit" variant="primary" :disabled="uploading" class="w-full py-2.5 px-6 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/10">
                <Upload :size="14" /> {{ uploading ? 'Mengirimkan Bukti...' : 'Kirim Bukti Pembayaran' }}
              </BaseButton>
            </div>
          </form>
        </div>

        <!-- Payment Proof Status (Only shown if payment_review or approved) -->
        <div v-if="applicant.payment_proof" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-850/50 pb-2">Informasi Bukti Transfer</h3>
          
          <div class="space-y-3 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-400">Oleh Rekening:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">{{ applicant.payment_proof.bank_name }} - {{ applicant.payment_proof.transfer_from_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Jumlah di-Klaim:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(applicant.payment_proof.amount_claimed) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Status Pembayaran:</span>
              <span :class="[
                'font-bold',
                applicant.payment_proof.status === 'approved' ? 'text-emerald-500' :
                applicant.payment_proof.status === 'rejected' ? 'text-rose-500' : 'text-blue-500'
              ]">
                {{ applicant.payment_proof.status === 'approved' ? 'Diterima' :
                   applicant.payment_proof.status === 'rejected' ? 'Ditolak' : 'Menunggu Review' }}
              </span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="text-slate-400">Berkas Bukti Transfer:</span>
              <a 
                href="#"
                @click.prevent="viewFullImage(applicant.payment_proof.file_url)" 
                class="font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
              >
                {{ applicant.payment_proof.file_name || 'bukti_transfer.png' }}
              </a>
            </div>
            <div v-if="applicant.payment_proof.status === 'rejected' && applicant.payment_proof.rejection_reason" class="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-rose-700 leading-normal">
              *Alasan penolakan pembayaran: {{ applicant.payment_proof.rejection_reason }}
            </div>
            <div class="pt-2 border-t border-slate-50 dark:border-zinc-850/30">
              <a 
                href="#"
                @click.prevent="viewFullImage(applicant.payment_proof.file_url)" 
                class="block border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-zinc-950 hover:opacity-90 transition-opacity"
              >
                <img :src="applicant.payment_proof.file_url" alt="Bukti Transfer" class="max-h-48 mx-auto object-contain p-2" />
              </a>
              <p class="text-[10px] text-slate-400 dark:text-zinc-500 text-center mt-1.5">*Klik gambar untuk melihat ukuran penuh</p>
            </div>
          </div>
        </div>

        <!-- Post-Admission Documents Section (Only shown when status is 'accepted') -->
        <div v-if="applicant.status === 'accepted'" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 class="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-850/50 pb-2 flex items-center gap-1.5">
            <FileText :size="14" /> Unggah Dokumen Pasca Penerimaan
          </h3>

          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Sebagai langkah pemberkasan lanjutan, mohon unggah dokumen administrasi yang diwajibkan oleh sekolah (seperti Akta Kelahiran, Kartu Keluarga, Ijazah/SKL).
          </p>

          <!-- Uploaded Documents List -->
          <div v-if="uploadedDocs.length > 0" class="space-y-2">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dokumen yang Telah Diunggah</h4>
            <div class="space-y-2 text-xs">
              <div 
                v-for="doc in uploadedDocs" 
                :key="doc.id" 
                class="flex items-center justify-between p-3 border border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl"
              >
                <div class="text-left">
                  <div class="font-bold text-slate-700 dark:text-zinc-300">{{ doc.document_label }}</div>
                  <div class="text-[9px] text-slate-400 font-mono mt-0.5">{{ doc.file_name }}</div>
                  <div v-if="doc.status === 'rejected' && doc.rejection_reason" class="text-[10px] text-rose-500 font-medium mt-1">
                    *Alasan ditolak: {{ doc.rejection_reason }}
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span :class="[
                    'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider',
                    doc.status === 'verified' || doc.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                    doc.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'
                  ]">
                    {{ doc.status === 'verified' || doc.status === 'approved' ? 'Terverifikasi' :
                       doc.status === 'rejected' ? 'Ditolak' : 'Menunggu Review' }}
                  </span>
                  <a 
                    href="#" 
                    @click.prevent="viewFullImage(doc.file_url)" 
                    class="text-violet-600 font-bold hover:underline"
                  >
                    Lihat
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Document Upload Form -->
          <form @submit.prevent="handleUploadDocument" class="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-850">
            <h4 class="text-xs font-bold text-slate-700 dark:text-zinc-300">Unggah Dokumen Baru</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1 text-left">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jenis Dokumen</label>
                <select v-model="docType" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-violet-600">
                  <option value="kartu_keluarga">Kartu Keluarga (KK)</option>
                  <option value="akte_kelahiran">Akta Kelahiran</option>
                  <option value="ijazah">Ijazah / SKL</option>
                  <option value="other">Dokumen Lainnya</option>
                </select>
              </div>
              <div v-if="docType === 'other'" class="flex flex-col gap-1 text-left">
                <BaseInput v-model="docLabel" label="Nama / Label Dokumen" placeholder="Contoh: Surat Pernyataan" required />
              </div>
            </div>

            <!-- Upload File Box placeholder (Mock / Clickable) -->
            <div 
              @click="triggerDocFileSelect"
              class="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-6 text-center space-y-2 cursor-pointer hover:border-violet-600/40 transition-colors"
            >
              <input 
                ref="docFileInput" 
                type="file" 
                accept="image/*,application/pdf" 
                class="hidden" 
                @change="onDocFileChange" 
              />
              <Upload class="mx-auto text-slate-400" :size="24" />
              <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">{{ docFileName || 'pilih_dokumen.png' }}</p>
              <p class="text-[10px] text-slate-400 dark:text-zinc-500">*Klik untuk memilih berkas dokumen persyaratan Anda.</p>
              
              <div v-if="docFilePreview" class="mt-2 border border-slate-100 dark:border-zinc-850 rounded-lg overflow-hidden bg-slate-50 dark:bg-zinc-950 p-1 inline-block">
                <img :src="docFilePreview" class="max-h-32 object-contain" />
              </div>
            </div>

            <div class="flex justify-end pt-3">
              <BaseButton type="submit" variant="primary" :disabled="uploading" class="w-full py-2.5 px-6 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/10">
                <Upload :size="14" /> {{ uploading ? 'Mengunggah Dokumen...' : 'Unggah Dokumen Persyaratan' }}
              </BaseButton>
            </div>
          </form>
        </div>

      </div>

    </main>

    <!-- Footer -->
    <footer class="py-6 border-t border-slate-200/50 dark:border-zinc-900 text-center text-[10px] text-slate-400 font-semibold tracking-wide">
      &copy; 2026 EduRaport Sekolah. Seluruh hak cipta dilindungi undang-undang.
    </footer>
  </div>
</template>
