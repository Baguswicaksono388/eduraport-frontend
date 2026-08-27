<script setup lang="ts">
import { Users, HeartHandshake, ShieldAlert, Scale, ChevronRight } from 'lucide-vue-next'

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
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Bimbingan Konseling & Kedisiplinan</h2>
      <p class="text-xs text-slate-500 dark:text-zinc-400">Pusat informasi dan manajemen Bimbingan Konseling serta Kedisiplinan Siswa.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink to="/bk/counselors" class="group bg-white dark:bg-zinc-900/60 p-6 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center mb-4">
            <Users class="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-lg">Guru BK</h3>
          <p class="text-xs text-slate-500 mt-1">Kelola data guru bimbingan konseling</p>
        </div>
        <div class="mt-6 flex items-center text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:gap-1 transition-all">
          Masuk Menu <ChevronRight class="w-4 h-4" />
        </div>
      </NuxtLink>

      <NuxtLink to="/bk/sessions" class="group bg-white dark:bg-zinc-900/60 p-6 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center mb-4">
            <HeartHandshake class="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-lg">Sesi Konseling</h3>
          <p class="text-xs text-slate-500 mt-1">Catat dan pantau sesi konseling siswa</p>
        </div>
        <div class="mt-6 flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400 group-hover:gap-1 transition-all">
          Masuk Menu <ChevronRight class="w-4 h-4" />
        </div>
      </NuxtLink>

      <NuxtLink to="/discipline" class="group bg-white dark:bg-zinc-900/60 p-6 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mb-4">
            <ShieldAlert class="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-lg">Rekap Poin</h3>
          <p class="text-xs text-slate-500 mt-1">Pantau kedisiplinan dan poin siswa</p>
        </div>
        <div class="mt-6 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:gap-1 transition-all">
          Masuk Menu <ChevronRight class="w-4 h-4" />
        </div>
      </NuxtLink>

      <NuxtLink to="/discipline/rules" class="group bg-white dark:bg-zinc-900/60 p-6 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mb-4">
            <Scale class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-lg">Aturan Poin</h3>
          <p class="text-xs text-slate-500 mt-1">Konfigurasi bobot poin pelanggaran/prestasi</p>
        </div>
        <div class="mt-6 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:gap-1 transition-all">
          Masuk Menu <ChevronRight class="w-4 h-4" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
