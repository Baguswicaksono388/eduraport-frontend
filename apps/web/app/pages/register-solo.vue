<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles, ArrowRight, ArrowLeft, Mail, Phone, Lock, Building, MapPin, Briefcase } from 'lucide-vue-next'
import { BaseInput, BaseButton } from '@eduraport/ui'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

definePageMeta({
  layout: false,
  auth: false
})

const router = useRouter()
const { registerSolo, loading } = useAuth()
const toast = useToast()

const step = ref(1)

const form = ref({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  schoolNameInput: '',
  province: '',
  city: '',
  jenjangTaught: ''
})

const nextStep = () => {
  if (step.value === 1 && (!form.value.fullName || !form.value.email || !form.value.phone || !form.value.password)) {
    toast.error('Harap isi semua data akun', 'Error')
    return
  }
  if (step.value < 2) step.value++
}

const prevStep = () => {
  if (step.value > 1) step.value--
}

const submit = async () => {
  if (!form.value.schoolNameInput || !form.value.province || !form.value.city || !form.value.jenjangTaught) {
    toast.error('Harap isi semua profil mengajar', 'Error')
    return
  }

  const payload = {
    ...form.value,
    jenjangTaught: form.value.jenjangTaught ? [form.value.jenjangTaught] : []
  }

  const res = await registerSolo(payload as any)
  if (res.success) {
    toast.success('Pendaftaran berhasil! Silakan login untuk melanjutkan.', 'Sukses')
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
  } else {
    toast.error(res.error || 'Pendaftaran gagal', 'Error')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
    <div class="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 p-8">
      
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mb-4">
          <Sparkles :size="24" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">EduRaport Solo</h1>
        <p class="text-sm text-slate-500 mt-2">Daftar sekarang dan nikmati trial 7 hari gratis.</p>
      </div>

      <!-- Step Indicator -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <div class="w-3 h-3 rounded-full transition-colors" :class="step >= 1 ? 'bg-violet-600' : 'bg-slate-200 dark:bg-zinc-800'"></div>
        <div class="w-10 h-0.5" :class="step >= 2 ? 'bg-violet-600' : 'bg-slate-200 dark:bg-zinc-800'"></div>
        <div class="w-3 h-3 rounded-full transition-colors" :class="step >= 2 ? 'bg-violet-600' : 'bg-slate-200 dark:bg-zinc-800'"></div>
      </div>

      <!-- Form Step 1: Account -->
      <div v-if="step === 1" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
          <BaseInput v-model="form.fullName" placeholder="Masukkan nama lengkap Anda" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <BaseInput v-model="form.email" type="email" placeholder="contoh@email.com" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No WhatsApp</label>
          <BaseInput v-model="form.phone" placeholder="08123456789" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
          <BaseInput v-model="form.password" type="password" placeholder="Minimal 8 karakter" />
        </div>
        
        <div class="pt-4">
          <BaseButton class="w-full justify-center" variant="primary" @click="nextStep">
            Lanjut
            <ArrowRight class="ml-2" :size="16" />
          </BaseButton>
        </div>
      </div>

      <!-- Form Step 2: Profile -->
      <div v-else-if="step === 2" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mengajar di Sekolah / Bimbel apa?</label>
          <BaseInput v-model="form.schoolNameInput" placeholder="Nama sekolah/bimbel Anda" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provinsi</label>
          <BaseInput v-model="form.province" placeholder="Contoh: Jawa Timur" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kota/Kabupaten</label>
          <BaseInput v-model="form.city" placeholder="Contoh: Surabaya" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jenjang yang Diajar</label>
          <select v-model="form.jenjangTaught" class="w-full px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100">
            <option value="" disabled>Pilih Jenjang</option>
            <option value="SD">SD/MI</option>
            <option value="SMP">SMP/MTs</option>
            <option value="SMA">SMA/SMK/MA</option>
            <option value="Lainnya">Lainnya (Bimbel/Umum)</option>
          </select>
        </div>
        
        <div class="pt-4 flex gap-3">
          <BaseButton class="flex-1 justify-center" variant="outline" @click="prevStep">
            <ArrowLeft class="mr-2" :size="16" />
            Kembali
          </BaseButton>
          <BaseButton class="flex-1 justify-center" variant="primary" @click="submit" :loading="loading">
            Daftar
          </BaseButton>
        </div>
      </div>

      <div class="mt-8 text-center text-sm text-slate-500">
        Sudah punya akun? 
        <NuxtLink to="/login" class="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
          Masuk di sini
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
