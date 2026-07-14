<script setup lang="ts">
import { ShieldAlert, Home, ArrowLeft } from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
import { useAuth } from '../composables/useAuth'

definePageMeta({
  layout: false
})

const { user, logout } = useAuth()
const goBack = () => {
  navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
    <!-- Sophisticated background blur elements -->
    <div class="absolute -top-24 -left-24 w-96 h-96 bg-rose-600/5 dark:bg-rose-500/5 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-600/5 dark:bg-amber-500/5 rounded-full blur-3xl"></div>

    <div class="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
      <BaseCard padding="lg" stripe class="border-rose-200/60 dark:border-rose-950/30 shadow-xl shadow-slate-100 dark:shadow-none">
        <div class="flex flex-col items-center text-center p-4">
          <!-- Icon -->
          <div class="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 dark:border-rose-900/30">
            <ShieldAlert class="text-rose-600 dark:text-rose-500 animate-bounce" :size="32" />
          </div>

          <!-- Header -->
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 mb-2">Akses Ditolak (403)</h1>
          <p class="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-6">
            Maaf, akun Anda tidak memiliki hak akses yang diperlukan untuk melihat halaman ini.
          </p>

          <!-- User Role Context -->
          <div v-if="user" class="w-full bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-4 mb-8 text-left">
            <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Sesi Pengguna Saat Ini</div>
            <div class="flex justify-between items-center">
              <div>
                <div class="text-sm font-bold text-slate-800 dark:text-zinc-200">{{ user.name || user.email }}</div>
                <div class="text-xs text-slate-400 dark:text-zinc-500">{{ user.email }}</div>
              </div>
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30 uppercase tracking-wider">
                {{ user.role }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3 w-full">
            <BaseButton 
              variant="secondary" 
              class="w-full py-2.5 text-xs font-bold uppercase tracking-wider"
              @click="logout"
            >
              Keluar Akun
            </BaseButton>
            <BaseButton 
              variant="primary" 
              class="w-full py-2.5 text-xs font-bold uppercase tracking-wider"
              @click="goBack"
            >
              <Home class="mr-2" :size="14" /> Kembali Utama
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
