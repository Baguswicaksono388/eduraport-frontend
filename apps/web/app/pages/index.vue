<script setup lang="ts">
import { GraduationCap, School, Users, ArrowRight, Clock } from 'lucide-vue-next'
import { BaseCard } from '@eduraport/ui'
import { useAuth } from '../composables/useAuth'
import SoloDashboard from '../components/dashboard/variants/SoloDashboard.vue'
import ParentDashboard from '../components/dashboard/variants/ParentDashboard.vue'
import { useStudent } from '../composables/useStudent'
import { useParent } from '../composables/useParent'
import { useRbac } from '../composables/useRbac'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) {
        return navigateTo('/landing')
      }
    }
  ]
})

const { user, isSoloTeacher } = useAuth()
const { isAdmin } = useRbac()
const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { totalStudents, fetchStudents } = useStudent()
const { myChildren, fetchMyChildren } = useParent()

onMounted(async () => {
  if (user.value?.role === 'parent') {
    await fetchMyChildren()
  } else {
    const schoolId = await initContext()
    if (schoolId) {
      await fetchStudents(schoolId)
    }
  }
})
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <SoloDashboard v-if="isSoloTeacher" />
    
    <template v-else>
      <!-- Greet User -->
      <div class="bg-slate-900 text-white rounded-xl p-6 md:p-10 border border-slate-800 shadow-sm relative overflow-hidden">
      <div class="relative z-10 space-y-3">
        <span v-if="user?.role === 'parent'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/10 text-amber-300 border border-white/10 uppercase tracking-widest">
          Portal Orang Tua
        </span>
        <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/10 text-amber-300 border border-white/10 uppercase tracking-widest">
          Sistem Informasi Akademik
        </span>
        
        <h2 class="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
          Selamat Datang, {{ user?.full_name || 'Pengguna' }}!
        </h2>
        
        <p v-if="user?.role === 'parent'" class="text-slate-300 text-sm max-w-xl font-medium leading-relaxed">
          Pantau perkembangan akademik, kehadiran, dan ekstrakurikuler putra/putri Anda dengan mudah melalui portal terintegrasi.
        </p>
        <p v-else class="text-slate-300 text-sm max-w-xl font-medium leading-relaxed">
          Kelola administrasi unit sekolah, konfigurasi data siswa, dan akses rekapitulasi nilai E-Raport dengan mudah melalui portal terintegrasi.
        </p>
      </div>
    </div>

    <!-- Parent View -->
    <div v-if="user?.role === 'parent'" class="space-y-6">
      <ParentDashboard />
    </div>

    <!-- Admin View -->
    <div v-else class="space-y-8 animate-in fade-in duration-500">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BaseCard stripe>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Yayasan Pengampu</p>
              <h3 class="text-2xl font-bold mt-1 text-slate-900 dark:text-zinc-100">{{ foundations.length }}</h3>
            </div>
            <div class="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-center text-blue-900 dark:text-blue-400">
              <GraduationCap :size="20" />
            </div>
          </div>
        </BaseCard>

        <BaseCard stripe>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Unit Sekolah</p>
              <h3 class="text-2xl font-bold mt-1 text-slate-900 dark:text-zinc-100">{{ schools.length }}</h3>
            </div>
            <div class="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-center text-blue-900 dark:text-blue-400">
              <School :size="20" />
            </div>
          </div>
        </BaseCard>

        <BaseCard stripe>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Total Siswa Terdaftar</p>
              <h3 class="text-2xl font-bold mt-1 text-slate-900 dark:text-zinc-100">{{ totalStudents }}</h3>
            </div>
            <div class="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-center text-blue-900 dark:text-blue-400">
              <Users :size="20" />
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Quick Actions -->
      <div class="space-y-4">
        <h3 class="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">Akses Cepat Portal</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink v-if="isAdmin" to="/school" class="group block">
            <BaseCard class="hover:border-blue-600/60 dark:hover:border-blue-500/50 hover:shadow-sm transition-all duration-200">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">Kelola Unit Sekolah</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Konfigurasi jenjang sekolah, akreditasi, kurikulum aktif, dan yayasan pengampu.</p>
                </div>
                <ArrowRight class="text-slate-300 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>

          <NuxtLink v-if="isAdmin" to="/academic-year" class="group block">
            <BaseCard class="hover:border-blue-600/60 dark:hover:border-blue-500/50 hover:shadow-sm transition-all duration-200">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">Tahun Ajaran</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Atur tahun ajaran aktif, batas tanggal pendaftaran, dan kelola histori periode akademik.</p>
                </div>
                <ArrowRight class="text-slate-300 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>

          <NuxtLink v-if="isAdmin" to="/class" class="group block">
            <BaseCard class="hover:border-blue-600/60 dark:hover:border-blue-500/50 hover:shadow-sm transition-all duration-200">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">Data Kelas</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Konfigurasi rombel, wali kelas, serta pantau kapasitas dan detail murid per kelas.</p>
                </div>
                <ArrowRight class="text-slate-300 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>

          <NuxtLink to="/student" class="group block">
            <BaseCard class="hover:border-blue-600/60 dark:hover:border-blue-500/50 hover:shadow-sm transition-all duration-200">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">Data Siswa</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Kelola profil murid, hubungkan wali murid, serta update berat/tinggi badan raport.</p>
                </div>
                <ArrowRight class="text-slate-300 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>

          <NuxtLink to="/homeroom" class="group block">
            <BaseCard class="hover:border-blue-600/60 dark:hover:border-blue-500/50 hover:shadow-sm transition-all duration-200">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">Rapor Wali Kelas</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Input absensi kehadiran, nilai ekstrakurikuler, dan catatan rapor wali kelas per rombel.</p>
                </div>
                <ArrowRight class="text-slate-300 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>

          <NuxtLink to="/teacher" class="group block">
            <BaseCard class="hover:border-blue-600 dark:hover:border-blue-600/50 hover:shadow-lg transition-all duration-300">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">Guru & Staf</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Atur profil guru pengajar, kepala sekolah, bendahara, dan staf administrasi sekolah.</p>
                </div>
                <ArrowRight class="text-slate-300 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>

          <NuxtLink to="/subject" class="group block">
            <BaseCard class="hover:border-blue-600 dark:hover:border-blue-600/50 hover:shadow-lg transition-all duration-300">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">Mata Pelajaran</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Kelola daftar mata pelajaran intrakurikuler, kokurikuler (P5), dan ekskul sekolah.</p>
                </div>
                <ArrowRight class="text-slate-300 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>

          <NuxtLink to="/schedule" class="group block">
            <BaseCard class="hover:border-blue-600 dark:hover:border-blue-600/50 hover:shadow-lg transition-all duration-300">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">Jadwal Pelajaran</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Konfigurasi jadwal mata pelajaran mingguan per kelas dengan deteksi bentrok.</p>
                </div>
                <ArrowRight class="text-slate-300 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>

          <NuxtLink to="/extracurricular" class="group block">
            <BaseCard class="hover:border-blue-600 dark:hover:border-blue-600/50 hover:shadow-lg transition-all duration-300">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">Ekstrakurikuler</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Daftar kegiatan pengembangan diri murid, jadwal latihan, dan instruktur/pelatih.</p>
                </div>
                <ArrowRight class="text-slate-300 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>
