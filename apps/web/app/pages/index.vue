<script setup lang="ts">
import { GraduationCap, School, Users, ArrowRight, Clock } from 'lucide-vue-next'
import { BaseCard } from '@eduraport/ui'
import { useAuth } from '../composables/useAuth'
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

const { user } = useAuth()
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
    <!-- Greet User -->
    <div class="bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 text-white rounded-xl p-8 md:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
      <!-- Sophisticated decorative gradient glow -->
      <div class="absolute -right-20 -top-20 w-80 h-80 bg-violet-600/10 rounded-full blur-2xl"></div>
      <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/5 rounded-full blur-2xl"></div>
      
      <div class="relative z-10 space-y-3">
        <span v-if="user?.role === 'parent'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-amber-400 border border-white/10 uppercase tracking-widest">
          Portal Orang Tua
        </span>
        <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-amber-400 border border-white/10 uppercase tracking-widest">
          Sistem Informasi Akademik
        </span>
        
        <h2 class="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
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
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">Daftar Anak Anda</h3>
      </div>

      <div v-if="myChildren.length === 0" class="text-center py-12 bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
        <Users class="mx-auto text-slate-300 dark:text-zinc-700 mb-3" :size="40" />
        <p class="text-sm font-semibold text-slate-700 dark:text-zinc-300">Belum ada anak yang terhubung</p>
        <p class="text-xs text-slate-500 mt-1">Silakan hubungi pihak sekolah untuk menghubungkan akun Anda dengan siswa.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BaseCard v-for="child in myChildren" :key="child.student_id" stripe class="relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 dark:bg-violet-400/5 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
          
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex flex-shrink-0 items-center justify-center font-bold text-xl border border-violet-200 dark:border-violet-800/50">
              {{ child.student_name[0] }}
            </div>
            
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-slate-900 dark:text-zinc-100 truncate text-lg" :title="child.student_name">
                {{ child.student_name }}
              </h4>
              <p class="text-xs font-semibold text-violet-600 dark:text-violet-400 mt-0.5">
                {{ child.school_name }} ({{ child.school_level }})
              </p>
              
              <div class="mt-4 space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">Kelas</span>
                  <span class="font-bold text-slate-700 dark:text-zinc-300">{{ child.class_name || 'Belum di Kelas' }}</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">NISN</span>
                  <span class="font-bold text-slate-700 dark:text-zinc-300">{{ child.nisn || '-' }}</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">Status</span>
                  <span class="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                    :class="[
                      child.student_status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                    ]"
                  >
                    {{ child.student_status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- View details button -->
          <div class="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <NuxtLink :to="'/parent/student/' + child.student_id" class="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Lihat Rapor & Absensi <ArrowRight :size="14" />
            </NuxtLink>
          </div>
        </BaseCard>
      </div>
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
          <NuxtLink v-if="isAdmin" to="/school" class="group block">
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

          <NuxtLink v-if="isAdmin" to="/academic-year" class="group block">
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

          <NuxtLink v-if="isAdmin" to="/class" class="group block">
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

          <NuxtLink to="/schedule" class="group block">
            <BaseCard class="hover:border-violet-500 dark:hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
              <div class="flex items-center justify-between h-full">
                <div class="pr-4">
                  <h4 class="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Jadwal Pelajaran</h4>
                  <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">Konfigurasi jadwal mata pelajaran mingguan per kelas dengan deteksi bentrok.</p>
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
                <ArrowRight class="text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0" :size="18" />
              </div>
            </BaseCard>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
