<script setup lang="ts">
import { GraduationCap, School, Users, ArrowRight } from 'lucide-vue-next'
import { BaseCard } from '@eduraport/ui'
import { useAuth } from '../composables/useAuth'
import { useSchool } from '../composables/useSchool'
import { useStudent } from '../composables/useStudent'

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

const { user } = useAuth()
const { foundations, schools, fetchFoundations, fetchSchools } = useSchool()
const { totalStudents, fetchStudents } = useStudent()

onMounted(async () => {
  await fetchFoundations()
  if (foundations.value.length > 0) {
    const fId = foundations.value[0].id
    await fetchSchools(fId)
    if (schools.value.length > 0) {
      await fetchStudents(schools.value[0].id)
    }
  }
})
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Greet User -->
    <div class="bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 text-white rounded-xl p-8 md:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
      <!-- Sophisticated decorative gradient glow -->
      <div class="absolute -right-20 -top-20 w-80 h-80 bg-violet-600/10 rounded-full blur-2xl"></div>
      <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/5 rounded-full blur-2xl"></div>
      
      <div class="relative z-10 space-y-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-amber-400 border border-white/10 uppercase tracking-widest">
          Sistem Informasi Akademik
        </span>
        <h2 class="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
          Selamat Datang, {{ user?.full_name || 'Pengguna' }}!
        </h2>
        <p class="text-slate-300 text-sm max-w-xl font-medium leading-relaxed">
          Kelola administrasi unit sekolah, konfigurasi data siswa, dan akses rekapitulasi nilai E-Raport dengan mudah melalui portal terintegrasi.
        </p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BaseCard stripe>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Yayasan Pengampu</p>
            <h3 class="text-2xl font-bold mt-1 text-slate-900 dark:text-zinc-100">{{ foundations.length }}</h3>
          </div>
          <div class="w-10 h-10 bg-violet-50 dark:bg-zinc-800/80 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400">
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
          <div class="w-10 h-10 bg-violet-50 dark:bg-zinc-800/80 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400">
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
          <div class="w-10 h-10 bg-violet-50 dark:bg-zinc-800/80 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Users :size="20" />
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-4">
      <h3 class="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">Akses Cepat Portal</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink to="/school" class="group block">
          <BaseCard class="hover:border-violet-500 dark:hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-between h-full">
              <div class="pr-4">
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Kelola Unit Sekolah</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Konfigurasi jenjang sekolah, akreditasi, kurikulum aktif, dan yayasan pengampu.</p>
              </div>
              <ArrowRight class="text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
            </div>
          </BaseCard>
        </NuxtLink>

        <NuxtLink to="/academic-year" class="group block">
          <BaseCard class="hover:border-violet-500 dark:hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-between h-full">
              <div class="pr-4">
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Tahun Ajaran</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Atur tahun ajaran aktif, batas tanggal pendaftaran, dan kelola histori periode akademik.</p>
              </div>
              <ArrowRight class="text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
            </div>
          </BaseCard>
        </NuxtLink>

        <NuxtLink to="/class" class="group block">
          <BaseCard class="hover:border-violet-500 dark:hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-between h-full">
              <div class="pr-4">
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Data Kelas</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Konfigurasi rombel, wali kelas, serta pantau kapasitas dan detail murid per kelas.</p>
              </div>
              <ArrowRight class="text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
            </div>
          </BaseCard>
        </NuxtLink>

        <NuxtLink to="/student" class="group block">
          <BaseCard class="hover:border-violet-500 dark:hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-between h-full">
              <div class="pr-4">
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Data Siswa</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Kelola profil murid, hubungkan wali murid, serta update berat/tinggi badan raport.</p>
              </div>
              <ArrowRight class="text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
            </div>
          </BaseCard>
        </NuxtLink>

        <NuxtLink to="/homeroom" class="group block">
          <BaseCard class="hover:border-violet-500 dark:hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-between h-full">
              <div class="pr-4">
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Rapor Wali Kelas</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Input absensi kehadiran, nilai ekstrakurikuler, dan catatan rapor wali kelas per rombel.</p>
              </div>
              <ArrowRight class="text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
            </div>
          </BaseCard>
        </NuxtLink>

        <NuxtLink to="/teacher" class="group block">
          <BaseCard class="hover:border-violet-500 dark:hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-between h-full">
              <div class="pr-4">
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Guru & Staf</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Atur profil guru pengajar, kepala sekolah, bendahara, dan staf administrasi sekolah.</p>
              </div>
              <ArrowRight class="text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
            </div>
          </BaseCard>
        </NuxtLink>

        <NuxtLink to="/subject" class="group block">
          <BaseCard class="hover:border-violet-500 dark:hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-between h-full">
              <div class="pr-4">
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Mata Pelajaran</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Kelola daftar mata pelajaran intrakurikuler, kokurikuler (P5), dan ekskul sekolah.</p>
              </div>
              <ArrowRight class="text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
            </div>
          </BaseCard>
        </NuxtLink>

        <NuxtLink to="/extracurricular" class="group block">
          <BaseCard class="hover:border-violet-500 dark:hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-between h-full">
              <div class="pr-4">
                <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Ekstrakurikuler</h4>
                <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Daftar kegiatan pengembangan diri murid, jadwal latihan, dan instruktur/pelatih.</p>
              </div>
              <ArrowRight class="text-slate-300 group-hover:text-violet-600 group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
            </div>
          </BaseCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
