<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LayoutGrid, BookOpen, Users, Smartphone, CheckCircle, ArrowRight } from 'lucide-vue-next'
import { BaseButton } from '@eduraport/ui'
import { useAuth } from '../composables/useAuth'

definePageMeta({
  layout: 'auth',
  middleware: ['auth']
})

const router = useRouter()
const { user } = useAuth()

const steps = [
  {
    icon: LayoutGrid,
    title: 'Setup Kelas',
    description: 'Buat kelas pertama Anda untuk mulai mengelola nilai.',
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30'
  },
  {
    icon: BookOpen,
    title: 'Tambah Mata Pelajaran',
    description: 'Masukkan mata pelajaran yang Anda ampu.',
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30'
  },
  {
    icon: Users,
    title: 'Input Data Siswa',
    description: 'Tambahkan data siswa ke dalam kelas yang telah dibuat.',
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30'
  },
  {
    icon: Smartphone,
    title: 'Hubungkan WhatsApp',
    description: 'Scan QR Code untuk mengirim rapor via WhatsApp (Opsional).',
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30'
  }
]
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 py-12">
    <div class="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 p-8 md:p-12">
      
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
          <CheckCircle :size="32" />
        </div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pendaftaran Berhasil!</h1>
        <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Selamat datang, {{ user?.full_name }}. Akun EduRaport Solo Anda sudah aktif dengan masa trial 7 Hari.
        </p>
      </div>

      <div class="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-6 mb-10 border border-slate-100 dark:border-zinc-800">
        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">4 Langkah Memulai EduRaport</h2>
        
        <div class="space-y-6">
          <div v-for="(step, index) in steps" :key="index" class="flex gap-4">
            <div class="flex-shrink-0 mt-1">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="[step.bg, step.color]">
                <component :is="step.icon" :size="20" />
              </div>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 dark:text-slate-200">{{ index + 1 }}. {{ step.title }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <BaseButton variant="primary" size="lg" class="w-full md:w-auto px-12" @click="router.push('/')">
          Masuk ke Dashboard
          <ArrowRight class="ml-2" :size="20" />
        </BaseButton>
      </div>

    </div>
  </div>
</template>
