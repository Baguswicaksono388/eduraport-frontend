<script setup lang="ts">
import { Lock, Mail, ArrowRight, GraduationCap } from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useAuth } from '../composables/useAuth'

definePageMeta({
  layout: false
})

const { login } = useAuth()
const form = reactive({
  email: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  const textInputEmail = form.email;
  const textInputPassword = form.password;
  
  const result = await login({ email: textInputEmail, password: textInputPassword })
  
  if (result.success) {
    navigateTo('/')
  } else {
    error.value = result.error || 'Terjadi kesalahan'
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
        <p class="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Portal E-Raport & Keuangan</p>
      </div>

      <BaseCard padding="lg" stripe class="border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="mb-6">
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Masuk Akun</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Akses laporan hasil belajar dan administrasi sekolah Anda.</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div v-if="error" class="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-3.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-2">
            {{ error }}
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Email</label>
            <div class="relative group">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-900 dark:group-focus-within:text-blue-400 transition-colors" :size="16" />
              <input 
                v-model="form.email"
                type="email" 
                placeholder="guru@sekolah.sch.id"
                required
                class="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-700 dark:focus:border-blue-500 rounded-lg py-3 pl-11 pr-4 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between items-center px-1">
              <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</label>
              <a href="#" class="text-[10px] font-bold text-blue-900 dark:text-blue-400 uppercase tracking-widest hover:underline">Lupa?</a>
            </div>
            <div class="relative group">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-900 dark:group-focus-within:text-blue-400 transition-colors" :size="16" />
              <input 
                v-model="form.password"
                type="password" 
                placeholder="••••••••"
                required
                class="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-700 dark:focus:border-blue-500 rounded-lg py-3 pl-11 pr-4 text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-blue-600/20 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <BaseButton 
            variant="primary" 
            type="submit"
            :loading="loading"
            class="w-full py-3 text-sm font-bold shadow-sm mt-2"
          >
            Masuk Portal <ArrowRight v-if="!loading" class="ml-2" :size="16" />
          </BaseButton>
        </form>

        <div class="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
          <div class="text-xs text-slate-500 dark:text-slate-400 font-medium flex flex-col gap-2 items-center">
            <div>
              Belum terdaftar? 
              <NuxtLink to="/register" class="text-blue-900 dark:text-blue-400 font-bold hover:underline ml-1">Daftar Akun Yayasan</NuxtLink>
            </div>
            <div class="text-slate-400">atau</div>
            <NuxtLink to="/register-solo" class="text-blue-900 dark:text-blue-400 font-bold hover:underline">Daftar sebagai Guru Mandiri (B2C)</NuxtLink>
          </div>
        </div>
      </BaseCard>

      <p class="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-600 font-semibold uppercase tracking-widest">
        &copy; 2026 EduRaport • Secure Academic Network
      </p>
    </div>
  </div>
</template>
