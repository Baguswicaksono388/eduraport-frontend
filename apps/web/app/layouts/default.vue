<script setup lang="ts">
import { GraduationCap, LogOut, LayoutDashboard, School, Users, Calendar, LayoutGrid, BookOpen, Trophy, UserCheck, ClipboardCheck } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { useSchool } from '../composables/useSchool'
import { useAcademicYear } from '../composables/useAcademicYear'

const { user, logout, fetchUser } = useAuth()
const { currentSchoolId } = useSchool()
const { academicYears, fetchAcademicYears } = useAcademicYear()

const activeAcademicYear = computed(() => {
  return academicYears.value.find(y => y.is_active)
})

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
  if (currentSchoolId.value) {
    await fetchAcademicYears(currentSchoolId.value)
  }
})

watch(currentSchoolId, async (newVal) => {
  if (newVal) {
    await fetchAcademicYears(newVal)
  } else {
    academicYears.value = []
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex font-sans">
    
    <!-- Sidebar for Desktop -->
    <aside class="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-200 flex-col p-6 z-50 border-r border-slate-800">
      <!-- Logo / School Branding -->
      <div class="flex items-center gap-3 mb-10 px-2">
        <div class="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20">
          <GraduationCap class="text-white" :size="20" />
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight text-white leading-tight">EduRaport</h1>
          <span class="text-[9px] uppercase tracking-wider text-amber-500 font-bold">Portal E-Raport</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 space-y-1 overflow-y-auto pr-1">
        <NuxtLink 
          to="/" 
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
          active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
        >
          <LayoutDashboard :size="16" /> Dashboard
        </NuxtLink>
        <NuxtLink 
          to="/school" 
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
          active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
        >
          <School :size="16" /> Unit Sekolah
        </NuxtLink>
        <NuxtLink 
          to="/academic-year" 
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
          active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
        >
          <Calendar :size="16" /> Tahun Ajaran
        </NuxtLink>
        <NuxtLink 
          to="/class" 
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
          active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
        >
          <LayoutGrid :size="16" /> Data Kelas
        </NuxtLink>
        <NuxtLink 
          to="/student" 
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
          active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
        >
          <Users :size="16" /> Data Siswa
        </NuxtLink>
        <NuxtLink 
          to="/teacher" 
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
          active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
        >
          <UserCheck :size="16" /> Guru & Staf
        </NuxtLink>
        <NuxtLink 
          to="/homeroom" 
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
          active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
        >
          <ClipboardCheck :size="16" /> Rapor Wali Kelas
        </NuxtLink>
        <NuxtLink 
          to="/subject" 
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
          active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
        >
          <BookOpen :size="16" /> Mata Pelajaran
        </NuxtLink>
        <NuxtLink 
          to="/extracurricular" 
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
          active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
        >
          <Trophy :size="16" /> Ekstrakurikuler
        </NuxtLink>
      </nav>

      <!-- Sidebar Footer (User Info & Logout) -->
      <div class="pt-6 border-t border-slate-800">
        <div class="flex items-center justify-between mb-4 px-2">
          <div class="truncate pr-2">
            <p class="text-xs font-bold text-white truncate">{{ user?.full_name || 'Guest User' }}</p>
            <p class="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{{ user?.role || 'Guest' }}</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400 uppercase">
            {{ user?.full_name?.substring(0, 2) || 'GU' }}
          </div>
        </div>
        <button 
          @click="logout" 
          class="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-bold"
        >
          <LogOut :size="16" />
          <span>Keluar Portal</span>
        </button>
      </div>
    </aside>

    <!-- Main Workspace -->
    <div class="flex-1 lg:pl-64 flex flex-col min-w-0">
      
      <!-- Top header bar for desktop (thin bottom border, glassmorphism) -->
      <header class="sticky top-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-900/80 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 class="text-xs font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">EduRaport Terintegrasi</h2>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="activeAcademicYear" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Tahun Ajaran {{ activeAcademicYear.name }}
          </span>
          <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
            Tidak Ada Tahun Ajaran Aktif
          </span>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
        <slot />
      </main>
    </div>

    <!-- Floating Mobile Navigation Pill (Glassmorphism dock) -->
    <nav class="lg:hidden fixed bottom-6 left-4 right-4 bg-slate-950/90 text-slate-400 rounded-full py-3 px-6 shadow-xl backdrop-blur-md flex justify-around items-center z-50 border border-slate-800/80 overflow-x-auto">
      <NuxtLink 
        to="/" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200"
        active-class="text-violet-400 scale-110"
      >
        <LayoutDashboard :size="16" />
        <span class="text-[8px] font-bold">Dashboard</span>
      </NuxtLink>
      <NuxtLink 
        to="/school" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200"
        active-class="text-violet-400 scale-110"
      >
        <School :size="16" />
        <span class="text-[8px] font-bold">Sekolah</span>
      </NuxtLink>
      <NuxtLink 
        to="/academic-year" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200"
        active-class="text-violet-400 scale-110"
      >
        <Calendar :size="16" />
        <span class="text-[8px] font-bold">Tahun</span>
      </NuxtLink>
      <NuxtLink 
        to="/class" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200"
        active-class="text-violet-400 scale-110"
      >
        <LayoutGrid :size="16" />
        <span class="text-[8px] font-bold">Kelas</span>
      </NuxtLink>
      <NuxtLink 
        to="/student" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200"
        active-class="text-violet-400 scale-110"
      >
        <Users :size="16" />
        <span class="text-[8px] font-bold">Siswa</span>
      </NuxtLink>
      <NuxtLink 
        to="/homeroom" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200"
        active-class="text-violet-400 scale-110"
      >
        <ClipboardCheck :size="16" />
        <span class="text-[8px] font-bold">Wali Kelas</span>
      </NuxtLink>
    </nav>

    <!-- Global Toast Notifications -->
    <BaseToastContainer />

  </div>
</template>
