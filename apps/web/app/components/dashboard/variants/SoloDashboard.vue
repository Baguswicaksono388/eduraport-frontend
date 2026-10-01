<script setup lang="ts">
import { GraduationCap, Users, LayoutGrid, CheckCircle, FileText } from 'lucide-vue-next'
import B2CQuotaCard from '../../b2c/B2CQuotaCard.vue'
import { useAuth } from '../../../composables/useAuth'
import { useClass } from '../../../composables/useClass'
import { useStudent } from '../../../composables/useStudent'
import { onMounted } from 'vue'

const { user, isSoloTeacher } = useAuth()
const { fetchClasses, totalClasses } = useClass()
const { fetchStudents, totalStudents } = useStudent()

onMounted(() => {
  if (user.value?.school_id) {
    fetchClasses(user.value.school_id, undefined, 1, 1) // Just fetch page 1 size 1 to get meta
    fetchStudents(user.value.school_id, 1, 1)
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Welcome Card -->
      <div class="col-span-1 md:col-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-xl p-8 relative overflow-hidden shadow-lg">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div class="relative z-10">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20 shadow-sm backdrop-blur-sm">
            Solo Teacher Edition
          </div>
          <h2 class="text-2xl font-bold mb-2">Halo, {{ user?.full_name }}! 👋</h2>
          <p class="text-violet-100 text-sm max-w-md">
            Selamat datang di EduRaport Solo. Anda mengelola data kelas, mata pelajaran, dan siswa secara independen.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <NuxtLink to="/class" class="px-4 py-2 bg-white text-violet-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
              Mulai Setup Kelas
            </NuxtLink>
            <NuxtLink to="/student" class="px-4 py-2 bg-violet-800/50 text-white border border-violet-500/50 rounded-lg text-sm font-bold hover:bg-violet-800 transition-colors">
              Tambah Siswa
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Quota Card -->
      <div class="col-span-1">
        <B2CQuotaCard />
      </div>

    </div>

    <!-- Quick Stats for Solo Teacher -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <LayoutGrid :size="24" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Total Kelas</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ totalClasses }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
          <Users :size="24" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Total Siswa</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ totalStudents }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
          <FileText :size="24" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Langganan B2C</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white text-sm mt-1">Status Aktif</p>
        </div>
      </div>
    </div>
  </div>
</template>
