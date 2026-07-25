<script setup lang="ts">
import { GraduationCap, LogOut, LayoutDashboard, School, Users, Calendar, LayoutGrid, BookOpen, Clock, Trophy, UserCheck, ClipboardCheck, FileSpreadsheet, DollarSign, LayoutTemplate, Key, BarChart3, UserPlus, Landmark, Menu, X, CalendarRange, Smartphone, Settings } from 'lucide-vue-next'
import { BaseModal, BaseButton, BaseInput } from '@eduraport/ui'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'
import { useSchool } from '../composables/useSchool'
import { useAcademicYear } from '../composables/useAcademicYear'
import { useRbac } from '../composables/useRbac'

const { user, logout, fetchUser, changePassword } = useAuth()
const { currentSchoolId } = useSchool()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { canAccess } = useRbac()

const showChangePasswordModal = ref(false)
const isMobileMenuOpen = ref(false)
const changePasswordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})
const changePasswordLoading = ref(false)
const toast = useToast()

const handleChangePassword = async () => {
  if (changePasswordForm.value.new_password !== changePasswordForm.value.confirm_password) {
    toast.error('Password baru dan konfirmasi password tidak cocok', 'Error')
    return
  }
  if (changePasswordForm.value.new_password.length < 6) {
    toast.error('Password baru minimal 6 karakter', 'Error')
    return
  }

  changePasswordLoading.value = true
  const res = await changePassword({
    old_password: changePasswordForm.value.old_password,
    new_password: changePasswordForm.value.new_password
  })
  changePasswordLoading.value = false

  if (res.success) {
    toast.success('Password berhasil diubah', 'Sukses')
    showChangePasswordModal.value = false
    changePasswordForm.value = {
      old_password: '',
      new_password: '',
      confirm_password: ''
    }
  } else {
    toast.error(res.error || 'Gagal mengubah password', 'Error')
  }
}

const activeAcademicYear = computed(() => {
  return academicYears.value.find(y => y.is_active)
})

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
  if (currentSchoolId.value && user.value?.role !== 'parent') {
    await fetchAcademicYears(currentSchoolId.value)
  }
})

watch(currentSchoolId, async (newVal) => {
  if (newVal && user.value?.role !== 'parent') {
    await fetchAcademicYears(newVal)
  } else {
    academicYears.value = []
  }
})


const menuGroups = computed(() => [
  {
    title: 'Utama / Dashboard',
    items: [
      { to: '/', label: user.value?.role === 'parent' ? 'Portal Orang Tua' : 'Dashboard', icon: LayoutDashboard, access: '/' },
      { to: '/dashboard', label: 'Dashboard Eksekutif', icon: BarChart3, access: '/dashboard' },
      { to: '/scanner', label: 'QR Scanner PWA', icon: Smartphone, access: '/dashboard', external: true, customClass: 'text-amber-400 hover:text-amber-300 hover:bg-amber-900/30' }
    ]
  },
  {
    title: 'Master Data',
    items: [
      { to: '/school', label: 'Unit Sekolah', icon: School, access: '/school' },
      { to: '/academic-year', label: 'Tahun Ajaran', icon: Calendar, access: '/academic-year' },
      { to: '/class', label: 'Data Kelas', icon: LayoutGrid, access: '/class' },
      { to: '/subject', label: 'Mata Pelajaran', icon: BookOpen, access: '/subject' },
      { to: '/extracurricular', label: 'Ekstrakurikuler', icon: Trophy, access: '/extracurricular' }
    ]
  },
  {
    title: 'Kesiswaan & Absensi',
    items: [
      { to: '/student', label: 'Data Siswa', icon: Users, access: '/student' },
      { to: '/parent', label: 'Data Orang Tua', icon: Users, access: '/student' },
      { to: '/student/attendance', label: 'Absensi Siswa', icon: ClipboardCheck, access: '/student' },
      { to: '/attendance-settings', label: 'Pengaturan Absensi', icon: Settings, access: '/attendance-settings' },
      { to: '/ppdb', label: 'PPDB Online', icon: UserPlus, access: '/ppdb' }
    ]
  },
  {
    title: 'Kepegawaian',
    items: [
      { to: '/teacher', label: 'Guru & Staf', icon: UserCheck, access: '/teacher' },
      { to: '/teacher/attendance', label: 'Absensi Guru & Staf', icon: ClipboardCheck, access: '/teacher' },
      { to: '/schedule', label: 'Jadwal Pelajaran', icon: Clock, access: '/schedule' },
      { to: '/leave', label: 'Cuti & Izin Guru', icon: CalendarRange, access: '/leave' }
    ]
  },
  {
    title: 'Akademik & Penilaian',
    items: [
      { to: '/gradebook/scheme', label: 'Skema Penilaian', icon: FileSpreadsheet, access: '/gradebook' },
      { to: '/gradebook/input', label: 'Input Nilai', icon: ClipboardCheck, access: '/gradebook' },
      { to: '/gradebook/analytics', label: 'Analitik & Rekap', icon: BarChart3, access: '/gradebook' },
      { to: '/homeroom', label: 'Rapor Wali Kelas', icon: ClipboardCheck, access: '/homeroom' },
      { to: '/report/template', label: 'Template Rapor', icon: LayoutTemplate, access: '/report' },
      { to: '/report', label: 'Cetak Rapor', icon: ClipboardCheck, access: '/report' }
    ]
  },
  {
    title: 'Layanan Ekstra',
    items: [
      { to: '/financial', label: 'Keuangan & SPP', icon: DollarSign, access: '/financial' },
      { to: '/wa/devices', label: 'WA Gateway', icon: Smartphone, access: '/wa' }
    ]
  }
])

const filteredMenuGroups = computed(() => {
  return menuGroups.value.map(group => ({
    ...group,
    items: group.items.filter(item => canAccess(item.access))
  })).filter(group => group.items.length > 0)
})

</script>

<template>
  <div class="min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex font-sans">
    
    <!-- Mobile Sidebar Drawer -->
    <div v-if="isMobileMenuOpen" class="lg:hidden fixed inset-0 z-50 flex">
      <!-- Backdrop -->
      <div 
        @click="isMobileMenuOpen = false" 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
      ></div>

      <!-- Drawer Content -->
      <aside class="relative flex flex-col w-72 max-w-[85vw] h-full bg-slate-900 text-slate-200 p-6 shadow-2xl z-50 border-r border-slate-800 transition-transform duration-300">
        <!-- Close Button -->
        <button 
          @click="isMobileMenuOpen = false" 
          class="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X :size="18" />
        </button>

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
        <nav class="flex-1 overflow-y-auto pr-1 pb-4">
          <div v-for="(group, gIdx) in filteredMenuGroups" :key="gIdx" class="mb-4 mt-2">
            <div class="px-5 mb-2">
              <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-widest">{{ group.title }}</h3>
            </div>
            <div class="space-y-1">
              <template v-for="(item, iIdx) in group.items" :key="iIdx">
                <NuxtLink 
                  :to="item.to"
                  :target="item.external ? '_blank' : undefined"
                  @click="isMobileMenuOpen = false"
                  class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200"
                  :class="item.customClass || 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
                  active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
                >
                  <component :is="item.icon" :size="16" /> 
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </template>
            </div>
          </div>
        </nav>

        <!-- Sidebar Footer -->
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
            @click="showChangePasswordModal = true; isMobileMenuOpen = false" 
            class="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold mb-1"
          >
            <Key :size="16" />
            <span>Ubah Password</span>
          </button>
          <button 
            @click="logout(); isMobileMenuOpen = false" 
            class="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-bold"
          >
            <LogOut :size="16" />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>
    </div>

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
      <nav class="flex-1 overflow-y-auto pr-1 pb-4">
        <div v-for="(group, gIdx) in filteredMenuGroups" :key="gIdx" class="mb-4 mt-2">
          <div class="px-5 mb-2">
            <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-widest">{{ group.title }}</h3>
          </div>
          <div class="space-y-1">
            <template v-for="(item, iIdx) in group.items" :key="iIdx">
              <NuxtLink 
                :to="item.to"
                :target="item.external ? '_blank' : undefined"
                class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200"
                :class="item.customClass || 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
                active-class="!bg-violet-600 !text-white shadow-lg shadow-violet-600/15"
              >
                <component :is="item.icon" :size="16" /> 
                <span>{{ item.label }}</span>
              </NuxtLink>
            </template>
          </div>
        </div>
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
          @click="showChangePasswordModal = true" 
          class="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-bold mb-1"
        >
          <Key :size="16" />
          <span>Ubah Password</span>
        </button>
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
      
      <!-- Top header bar for desktop/mobile (thin bottom border, glassmorphism) -->
      <header class="sticky top-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-900/80 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button 
            type="button" 
            @click="isMobileMenuOpen = true" 
            class="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Menu :size="20" />
          </button>
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
    <nav class="lg:hidden fixed bottom-6 left-4 right-4 bg-slate-950/90 text-slate-400 rounded-full py-3 px-6 shadow-xl backdrop-blur-md flex justify-between items-center z-50 border border-slate-800/80 overflow-x-auto gap-4">
      <NuxtLink 
        to="/" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200 shrink-0"
        active-class="text-violet-400 scale-110"
      >
        <LayoutDashboard :size="16" />
        <span class="text-[8px] font-bold">Dashboard</span>
      </NuxtLink>
      <NuxtLink 
        v-if="user && ['principal', 'treasurer', 'super_admin', 'vice_principal_curriculum'].includes(user.role)"
        to="/dashboard" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200 shrink-0"
        active-class="text-violet-400 scale-110"
      >
        <BarChart3 :size="16" />
        <span class="text-[8px] font-bold">Eksekutif</span>
      </NuxtLink>
      <NuxtLink 
        to="/school" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200 shrink-0"
        active-class="text-violet-400 scale-110"
      >
        <School :size="16" />
        <span class="text-[8px] font-bold">Sekolah</span>
      </NuxtLink>
      <NuxtLink 
        to="/academic-year" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200 shrink-0"
        active-class="text-violet-400 scale-110"
      >
        <Calendar :size="16" />
        <span class="text-[8px] font-bold">Tahun</span>
      </NuxtLink>
      <NuxtLink 
        to="/class" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200 shrink-0"
        active-class="text-violet-400 scale-110"
      >
        <LayoutGrid :size="16" />
        <span class="text-[8px] font-bold">Kelas</span>
      </NuxtLink>
      <NuxtLink 
        to="/schedule" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200 shrink-0"
        active-class="text-violet-400 scale-110"
      >
        <Clock :size="16" />
        <span class="text-[8px] font-bold">Jadwal</span>
      </NuxtLink>
      <NuxtLink 
        to="/student" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200 shrink-0"
        active-class="text-violet-400 scale-110"
      >
        <Users :size="16" />
        <span class="text-[8px] font-bold">Siswa</span>
      </NuxtLink>
      <NuxtLink 
        to="/homeroom" 
        class="flex flex-col items-center gap-0.5 transition-all duration-200 shrink-0"
        active-class="text-violet-400 scale-110"
      >
        <ClipboardCheck :size="16" />
        <span class="text-[8px] font-bold">Wali Kelas</span>
      </NuxtLink>
      <button 
        type="button"
        @click="isMobileMenuOpen = true"
        class="flex flex-col items-center gap-0.5 transition-all duration-200 text-slate-400 hover:text-white shrink-0 outline-none"
      >
        <Menu :size="16" />
        <span class="text-[8px] font-bold text-violet-400">Lainnya</span>
      </button>
    </nav>

    <!-- Global Toast Notifications -->
    <BaseToastContainer />

    <!-- Change Password Modal -->
    <BaseModal :show="showChangePasswordModal" title="Ubah Password Akun" @close="showChangePasswordModal = false">
      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <BaseInput 
          v-model="changePasswordForm.old_password" 
          type="password" 
          label="Password Lama" 
          placeholder="Masukkan password lama" 
          required 
        />
        
        <BaseInput 
          v-model="changePasswordForm.new_password" 
          type="password" 
          label="Password Baru" 
          placeholder="Masukkan password baru (minimal 6 karakter)" 
          required 
        />
        
        <BaseInput 
          v-model="changePasswordForm.confirm_password" 
          type="password" 
          label="Konfirmasi Password Baru" 
          placeholder="Masukkan kembali password baru" 
          required 
        />

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton type="button" variant="outline" @click="showChangePasswordModal = false" class="py-2 px-4 text-xs font-semibold">
            Batal
          </BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="changePasswordLoading" class="py-2 px-4 text-xs font-bold shadow-lg shadow-violet-600/10">
            {{ changePasswordLoading ? 'Menyimpan...' : 'Simpan Password' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

  </div>
</template>
