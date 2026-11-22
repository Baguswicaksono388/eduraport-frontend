<script setup lang="ts">
import { Lock, Mail, User, Phone, ArrowRight, GraduationCap } from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useAuth } from '../composables/useAuth'

definePageMeta({
  layout: false
})

const { register } = useAuth()
const form = reactive({
  full_name: '',
  email: '',
  password: '',
  phone: '',
  role: 'user'
})
const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleRegister = async () => {
  error.value = ''
  success.value = false
  loading.value = true
  
  const result = await register(form)
  
  if (result.success) {
    success.value = true
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
  } else {
    error.value = result.error || 'Terjadi kesalahan saat pendaftaran'
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
    <div class="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-300">
      <!-- Logo -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-12 h-12 bg-blue-900 dark:bg-blue-600 rounded-xl flex items-center justify-center shadow-sm mb-3">
          <GraduationCap class="text-white" :size="24" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">EduRaport</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Registrasi Portal Yayasan</p>
      </div>

      <BaseCard padding="lg" stripe class="border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="mb-6">
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Daftar Akun Baru</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Buat akun pengelola yayasan Anda untuk memulai.</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div v-if="error" class="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-3.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400">
            {{ error }}
          </div>
          <div v-if="success" class="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-3.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Registrasi berhasil! Mengarahkan ke halaman login...
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Nama Lengkap</label>
            <div class="relative group">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-900 dark:group-focus-within:text-blue-400 transition-colors" :size="16" />
              <input 
                v-model="form.full_name"
                type="text" 
                placeholder="Nama Lengkap Anda"
                required
                class="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-700 dark:focus:border-blue-500 rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
            <div class="relative group">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-900 dark:group-focus-within:text-blue-400 transition-colors" :size="16" />
              <input 
                v-model="form.email"
                type="email" 
                placeholder="name@sekolah.sch.id"
                required
                class="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-700 dark:focus:border-blue-500 rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Nomor Telepon</label>
            <div class="relative group">
              <Phone class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-900 dark:group-focus-within:text-blue-400 transition-colors" :size="16" />
              <input 
                v-model="form.phone"
                type="text" 
                placeholder="081234567890"
                class="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-700 dark:focus:border-blue-500 rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Password</label>
            <div class="relative group">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-900 dark:group-focus-within:text-blue-400 transition-colors" :size="16" />
              <input 
                v-model="form.password"
                type="password" 
                placeholder="••••••••"
                required
                class="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-700 dark:focus:border-blue-500 rounded-lg py-2.5 pl-11 pr-4 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <BaseButton 
            variant="primary" 
            type="submit"
            :loading="loading"
            class="w-full py-3 text-sm font-bold shadow-sm mt-4"
          >
            Daftar Sekarang <ArrowRight v-if="!loading" class="ml-2" :size="16" />
          </BaseButton>
        </form>

        <div class="mt-6 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Sudah memiliki akun? 
            <NuxtLink to="/login" class="text-blue-900 dark:text-blue-400 font-bold hover:underline ml-1">Masuk di sini</NuxtLink>
          </p>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
