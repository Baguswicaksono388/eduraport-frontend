<script setup lang="ts">
import { GraduationCap, LogOut, LayoutDashboard, School, Users, Calendar, LayoutGrid, BookOpen, Clock, Trophy, UserCheck, ClipboardCheck, FileSpreadsheet, DollarSign, LayoutTemplate, Key, BarChart3, UserPlus, Landmark, Menu, X, CalendarRange, Smartphone, Settings, Sparkles, Sun, Moon, Boxes, ShieldAlert, HeartHandshake, Scale, Activity, Crown, Library, MessageSquare, FileText, Wallet, BookMarked, Bell, ShieldCheck, CalendarCheck, Search } from 'lucide-vue-next'
import { BaseModal, BaseButton, BaseInput } from '@eduraport/ui'
import B2cSoloBadge from '../components/b2c/SoloBadge.vue'
import B2cPaywallModal from '../components/b2c/PaywallModal.vue'
import { useB2CSubscription } from '../composables/useB2CSubscription'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'
import { useSchool } from '../composables/useSchool'
import { useAcademicYear } from '../composables/useAcademicYear'
import { useRbac } from '../composables/useRbac'
import { usePaywallStore } from '../stores/paywall'
import { isEarlyChildhood } from '../composables/useSchoolLevel'
import { useColorMode } from '@vueuse/core'

const { user, isSoloTeacher, logout, fetchUser, changePassword } = useAuth()
const { currentSchoolId, currentSchool, foundations } = useSchool()
const { subscription, fetchSubscription } = useB2CSubscription()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { canAccess } = useRbac()
const paywallStore = usePaywallStore()

const colorMode = useColorMode()
const toggleTheme = () => {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
}

import { useRoute } from 'vue-router'
const route = useRoute()
const isFullScreenPage = computed(() => route.path.includes('/ai-asisten'))
const isPaywallVisible = computed(() => {
  if (!isSoloTeacher.value || !subscription.value) return false;
  if (route.path.startsWith('/b2c/subscription')) return false;
  return subscription.value.status === 'expired';
})

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
  if (isSoloTeacher.value) {
    await fetchSubscription()
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


const isTKSchoolActive = computed(() => isEarlyChildhood(currentSchool.value?.level))
const menuSearchQuery = ref('')

const getBadgeClass = (badge?: string) => {
  if (!badge) return ''
  if (badge.includes('TK/PAUD')) return 'bg-amber-100/90 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/70 dark:border-amber-700/60'
  if (badge.includes('AI')) return 'bg-violet-100/90 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border-violet-300/70 dark:border-violet-700/60'
  if (badge.includes('BK')) return 'bg-rose-100/90 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300/70 dark:border-rose-700/60'
  if (badge.includes('Wali Kelas')) return 'bg-blue-100/90 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300/70 dark:border-blue-700/60'
  if (badge.includes('Tahfidz') || badge.includes('Pesantren')) return 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-700/60'
  if (badge.includes('Care Alert')) return 'bg-orange-100/90 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300/70 dark:border-orange-700/60'
  if (badge.includes('Bendahara') || badge.includes('Keuangan')) return 'bg-teal-100/90 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300/70 dark:border-teal-700/60'
  if (badge.includes('Mapel')) return 'bg-sky-100/90 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300/70 dark:border-sky-700/60'
  if (badge.includes('Kurikulum')) return 'bg-indigo-100/90 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300/70 dark:border-indigo-700/60'
  if (badge.includes('Kesiswaan')) return 'bg-amber-100/90 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/70 dark:border-amber-700/60'
  if (badge.includes('TU')) return 'bg-cyan-100/90 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-300/70 dark:border-cyan-700/60'
  return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
}

const menuGroups = computed(() => {
  const groups: any[] = []

  if (user.value?.role === 'parent') {
    return [
      {
        title: 'Portal Orang Tua',
        items: [
          { to: '/', label: 'Beranda Portal', icon: LayoutDashboard, access: '/', badge: 'Wali Murid', subtitle: 'Ringkasan info & kabar belajar anak' },
          { to: '/parent/attendance', label: 'Kehadiran Anak', icon: CalendarCheck, access: '/', badge: 'Presensi', subtitle: 'Catatan hadir, izin & surat sakit' },
          { to: '/parent/grades', label: 'Nilai & Akademik', icon: Trophy, access: '/', badge: 'Akademik', subtitle: 'Nilai ujian, formatif & capaian rapor' },
          { to: '/parent/schedule', label: 'Jadwal Pelajaran', icon: Clock, access: '/', badge: 'Jadwal', subtitle: 'Agenda harian & jam kelas anak' },
          { to: '/parent/pesantren', label: 'Tahfidz & Ibadah', icon: BookMarked, access: '/', badge: 'Tahfidz', subtitle: 'Ziyadah, murajaah & jurnal ibadah' }
        ]
      },
      {
        title: 'Administrasi & Keuangan',
        items: [
          { to: '/parent/bills', label: 'Tagihan & SPP', icon: DollarSign, access: '/', badge: 'Keuangan', subtitle: 'Riwayat bayar & kwitansi SPP' },
          { to: '/parent/wallet', label: 'Dompet Digital', icon: Wallet, access: '/', badge: 'Keuangan', subtitle: 'Saldo uang saku & transaksi digital' },
          { to: '/parent/leave', label: 'Permohonan Izin / Sakit', icon: CalendarRange, access: '/', badge: 'Dispensasi', subtitle: 'Ajukan surat izin atau sakit' },
          { to: '/parent/meetings', label: 'Konsultasi Guru (PTM)', icon: HeartHandshake, access: '/', badge: 'Konsultasi', subtitle: 'Booking jadwal temu wali kelas/guru' }
        ]
      },
      {
        title: 'Komunikasi & Keamanan',
        items: [
          { to: '/parent/announcements', label: 'Pengumuman Sekolah', icon: Bell, access: '/', badge: 'Edaran', subtitle: 'Informasi resmi & agenda sekolah' },
          { to: '/parent/messages', label: 'Pesan Guru', icon: MessageSquare, access: '/', badge: 'Chat', subtitle: 'Komunikasi pesan langsung guru' },
          { to: '/parent/notification-preferences', label: 'Pengaturan Notifikasi', icon: Settings, access: '/', badge: 'Setting', subtitle: 'Kanal WA & pemberitahuan akun' },
          { to: '/parent/security-log', label: 'Log Keamanan', icon: ShieldCheck, access: '/', badge: 'Keamanan', subtitle: 'Aktivitas masuk & audit login akun' }
        ]
      }
    ]
  }

  const foundationId = currentSchool.value?.foundation_id || (foundations.value?.length > 0 ? foundations.value[0].id : null)

  if (foundationId && ['super_admin', 'principal', 'tu', 'user', 'owner', 'admin'].includes(user.value?.role)) {
    groups.push({
      title: 'Yayasan / Workspace',
      items: [
        { to: `/foundation/${foundationId}/workspace`, label: 'Foundation Workspace', icon: Landmark, access: '/', badge: 'Yayasan', subtitle: 'Multi-sekolah & konsolidasi data' }
      ]
    })
  }

  groups.push(
    {
      title: 'Utama / Dashboard',
      items: [
        { to: '/', label: user.value?.role === 'parent' ? 'Portal Orang Tua' : 'Dashboard', icon: LayoutDashboard, access: '/', badge: 'Umum', subtitle: 'Ringkasan operasional & statistik' },
        ...(isSoloTeacher.value ? [] : [
          { to: '/dashboard', label: 'Dashboard Eksekutif', icon: BarChart3, access: '/dashboard', badge: 'Pimpinan', subtitle: 'KPI sekolah, tren nilai & analitik' }
        ]),
        ...(isSoloTeacher.value ? [{ to: '/b2c/subscription', label: 'Kelola Paket & Layanan', icon: Crown, access: '/', customClass: 'text-violet-500 hover:text-violet-400 hover:bg-violet-900/30 font-semibold', badge: 'B2C', subtitle: 'Status lisensi guru solo' }] : []),
        ...(isSoloTeacher.value ? [] : [
          { to: '/scanner', label: 'QR Scanner PWA', icon: Smartphone, access: '/dashboard', external: true, customClass: 'text-amber-400 hover:text-amber-300 hover:bg-amber-900/30', badge: 'Petugas', subtitle: 'Pemindai presensi QR & wajah' }
        ])
      ]
    },
    {
      title: 'Master Data',
      items: [
        { to: '/school', label: 'Unit Sekolah', icon: School, access: '/school', badge: 'Admin', subtitle: 'Identitas, profil & akreditasi' },
        { to: '/master-akademik', label: 'Master Akademik', icon: Library, access: '/academic-year', badge: 'Kurikulum', subtitle: 'Tahun ajaran, kelas & mapel' }
      ]
    },
    {
      title: 'Kesiswaan & Absensi',
      items: [
        { to: '/student', label: 'Data Siswa', icon: Users, access: '/student', badge: 'Kesiswaan', subtitle: 'Buku induk, NISN & biodata siswa' },
        { to: '/parent', label: 'Data Orang Tua', icon: Users, access: '/student', badge: 'Kesiswaan', subtitle: 'Daftar wali & nomor kontak WhatsApp' },
        { to: '/announcement', label: 'Pengumuman Sekolah', icon: Bell, access: '/student', badge: 'Humas', subtitle: 'Broadcast info resmi ke wali murid' },
        { to: '/student/attendance', label: 'Absensi Siswa', icon: ClipboardCheck, access: '/student', badge: 'Wali Kelas', subtitle: 'Presensi harian per rombel' },
        { to: '/attendance-analytics', label: 'Analitik & Audit Absensi', icon: BarChart3, access: '/student', badge: 'Care Alert', subtitle: 'Audit tanggal bolong & mood emosi' },
        { to: '/homeroom?tab=leave_requests', label: 'Izin Siswa (Wali Murid)', icon: CalendarRange, access: '/homeroom', badge: 'Wali Kelas', subtitle: 'Validasi surat izin & sakit siswa' },
        { to: '/attendance-settings', label: 'Pengaturan Absensi', icon: Settings, access: '/attendance-settings', badge: 'Admin', subtitle: 'Radius GPS, jam masuk & dispensasi' },
        ...(isSoloTeacher.value ? [] : [{ to: '/ppdb', label: 'PPDB Online', icon: UserPlus, access: '/ppdb', badge: 'Panitia', subtitle: 'Pendaftaran peserta didik baru' }])
      ]
    },
    {
      title: 'Kepegawaian',
      items: [
        { to: '/teacher', label: 'Guru & Staf', icon: UserCheck, access: '/teacher', badge: 'TU', subtitle: 'Direktori PTK & status penugasan' },
        { to: '/teacher/attendance', label: 'Absensi Guru & Staf', icon: ClipboardCheck, access: '/teacher', badge: 'TU', subtitle: 'Rekap kehadiran & jam finger guru' },
        { to: '/schedule', label: 'Jadwal Pelajaran', icon: Clock, access: '/schedule', badge: 'Kurikulum', subtitle: 'Plotting jam mengajar guru & ruang' },
        { to: '/leave', label: 'Cuti & Izin Guru', icon: CalendarRange, access: '/leave', badge: 'TU', subtitle: 'Pengajuan & persetujuan cuti PTK' }
      ]
    },
    {
      title: 'BK & Kedisiplinan',
      items: [
        { to: '/bk', label: 'Dashboard BK', icon: Activity, access: '/bk', badge: 'Guru BK', subtitle: 'Statistik bimbingan, aduan & tren' },
        { to: '/bk/counselors', label: 'Data Guru BK', icon: Users, access: '/bk', badge: 'Guru BK', subtitle: 'Daftar konselor & pembagian siswa' },
        { to: '/bk/sessions', label: 'Sesi Konseling', icon: HeartHandshake, access: '/bk', badge: 'Guru BK', subtitle: 'Jadwal & rekam bimbingan privat' },
        { to: '/discipline', label: 'Rekap Poin Siswa', icon: ShieldAlert, access: '/discipline', badge: 'Kesiswaan', subtitle: 'Buku pelanggaran, reward & sanksi' },
        { to: '/discipline/rules', label: 'Aturan Poin', icon: Scale, access: '/discipline', badge: 'Kesiswaan', subtitle: 'Katalog tata tertib & bobot poin' }
      ]
    },
    {
      title: 'Akademik & Penilaian',
      items: [
        { to: '/ai-asisten', label: 'AI Asisten Guru', icon: Sparkles, access: '/gradebook', customClass: 'text-violet-400 hover:text-violet-300 hover:bg-violet-900/30', badge: 'AI', subtitle: 'Generator RPP, modul ajar, ATP & soal' },
        { to: '/gradebook/scheme', label: 'Skema Penilaian', icon: FileSpreadsheet, access: '/gradebook', badge: 'Kurikulum', subtitle: 'Bobot formatif, sumatif & KKM' },
        { 
          to: '/gradebook/input', 
          label: isTKSchoolActive.value ? 'Penilaian TK & Anekdot' : 'Input Nilai Mapel', 
          icon: ClipboardCheck, 
          access: '/gradebook', 
          badge: isTKSchoolActive.value ? '🧸 TK/PAUD' : 'Mapel', 
          subtitle: isTKSchoolActive.value ? 'Capaian rapor & jurnal anekdot harian' : 'Nilai formatif, sumatif & PTS/PAS' 
        },
        { to: '/gradebook/analytics', label: 'Analitik & Rekap', icon: BarChart3, access: '/gradebook', badge: 'Kurikulum', subtitle: 'Distribusi nilai, ketuntasan & grafik' },
        { to: '/homeroom', label: 'Rapor Wali Kelas', icon: ClipboardCheck, access: '/homeroom', badge: 'Wali Kelas', subtitle: 'Absensi, ekskul, catatan wali & rangking' },
        { to: '/teacher/pesantren', label: 'Tahfidz & Pesantren', icon: BookMarked, access: '/teacher', badge: 'Tahfidz', subtitle: 'Mutabaah ibadah & setoran hafalan' },
        { to: '/report/template', label: 'Template Rapor', icon: LayoutTemplate, access: '/report', badge: 'Kurikulum', subtitle: 'Kustomisasi layout halaman rapor' },
        { to: '/report', label: 'Cetak Rapor', icon: ClipboardCheck, access: '/report', badge: 'Wali Kelas', subtitle: 'Generate PDF e-raport resmi siswa' }
      ]
    },
    {
      title: 'Layanan Ekstra',
      items: [
        { to: '/financial', label: 'Keuangan & SPP', icon: DollarSign, access: '/financial', badge: 'Bendahara', subtitle: 'Pos kas, tagihan SPP & tunggakan' },
        { to: '/financial/assets', label: 'Inventaris Aset', icon: Boxes, access: '/financial', badge: 'Sarpras', subtitle: 'Katalog sarana & inventaris sekolah' },
        { to: '/wa/devices', label: 'WA Gateway', icon: Smartphone, access: '/wa', badge: 'IT / Admin', subtitle: 'Koneksi perangkat WhatsApp broadcast' }
      ]
    }
  )

  return groups
})

const filteredMenuGroups = computed(() => {
  const query = menuSearchQuery.value.trim().toLowerCase()

  return menuGroups.value.map(group => {
    const accessibleItems = group.items.filter((item: any) => canAccess(item.access))
    if (!query) {
      return {
        ...group,
        items: accessibleItems
      }
    }
    const matchedItems = accessibleItems.filter((item: any) => {
      const labelMatch = item.label?.toLowerCase().includes(query)
      const subtitleMatch = item.subtitle?.toLowerCase().includes(query)
      const badgeMatch = item.badge?.toLowerCase().includes(query)
      const groupTitleMatch = group.title?.toLowerCase().includes(query)
      return labelMatch || subtitleMatch || badgeMatch || groupTitleMatch
    })
    return {
      ...group,
      items: matchedItems
    }
  }).filter(group => group.items.length > 0)
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
      <aside class="relative flex flex-col w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-5 shadow-2xl z-50 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300">
        <!-- Close Button -->
        <button 
          @click="isMobileMenuOpen = false" 
          class="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <X :size="18" />
        </button>

        <!-- Logo / School Branding -->
        <div class="flex items-center gap-3 mb-5 px-1">
          <div class="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20 shrink-0">
            <GraduationCap class="text-white" :size="20" />
          </div>
          <div class="min-w-0">
            <h1 class="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">EduRaport</h1>
            <span v-if="!isSoloTeacher" class="text-[9px] uppercase tracking-wider text-amber-500 font-bold block">Portal E-Raport</span>
            <B2cSoloBadge v-if="isSoloTeacher" class="mt-0.5" />
          </div>
        </div>

        <!-- Quick Menu Search -->
        <div class="mb-3 px-1">
          <div class="relative">
            <Search :size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input 
              v-model="menuSearchQuery"
              type="text"
              placeholder="Cari menu & fitur..."
              class="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
            />
            <button 
              v-if="menuSearchQuery"
              @click="menuSearchQuery = ''"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            >
              <X :size="12" />
            </button>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 overflow-y-auto pr-1 pb-4">
          <div v-if="filteredMenuGroups.length === 0" class="text-center py-8 px-3">
            <p class="text-xs text-slate-400 dark:text-slate-500">Tidak ada menu untuk "{{ menuSearchQuery }}"</p>
            <button 
              @click="menuSearchQuery = ''"
              class="mt-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Reset Pencarian
            </button>
          </div>

          <div v-for="(group, gIdx) in filteredMenuGroups" :key="gIdx" class="mb-3.5">
            <div class="px-2.5 mb-1.5">
              <h3 class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ group.title }}</h3>
            </div>
            <div class="space-y-1">
              <template v-for="(item, iIdx) in group.items" :key="item.to">
                <NuxtLink 
                  :to="item.to"
                  :target="item.external ? '_blank' : undefined"
                  @click="isMobileMenuOpen = false"
                  class="group relative flex flex-col gap-0.5 px-3 py-2 rounded-xl transition-all duration-200"
                  :class="item.customClass || 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'"
                  active-class="!bg-violet-600 !text-white shadow-md shadow-violet-600/20"
                >
                  <div class="flex items-center justify-between w-full gap-1.5">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <component :is="item.icon" :size="16" class="shrink-0 transition-transform group-hover:scale-110" /> 
                      <span class="text-xs font-semibold tracking-wide truncate">{{ item.label }}</span>
                    </div>
                    <span 
                      v-if="item.badge" 
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 transition-colors uppercase tracking-wider leading-none"
                      :class="[
                        getBadgeClass(item.badge),
                        'group-[.router-link-active]:!bg-white/20 group-[.router-link-active]:!text-white group-[.router-link-active]:!border-white/30'
                      ]"
                    >
                      {{ item.badge }}
                    </span>
                  </div>
                  <p 
                    v-if="item.subtitle" 
                    class="text-[10px] pl-[26px] truncate leading-tight transition-colors text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-[.router-link-active]:!text-violet-100"
                  >
                    {{ item.subtitle }}
                  </p>
                </NuxtLink>
              </template>
            </div>
          </div>
        </nav>

        <!-- Sidebar Footer -->
        <div class="pt-6 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-4 px-2">
            <div class="truncate pr-2">
              <p class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ user?.full_name || 'Guest User' }}</p>
              <p class="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{{ user?.role || 'Guest' }}</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400 uppercase">
              {{ user?.full_name?.substring(0, 2) || 'GU' }}
            </div>
          </div>
          <button 
            @click="showChangePasswordModal = true; isMobileMenuOpen = false" 
            class="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors text-xs font-bold mb-1"
          >
            <Key :size="16" />
            <span>Ubah Password</span>
          </button>
          <button 
            @click="logout(); isMobileMenuOpen = false" 
            class="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors text-xs font-bold"
          >
            <LogOut :size="16" />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>
    </div>

    <!-- Sidebar for Desktop -->
    <aside class="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex-col p-5 z-50 border-r border-slate-200 dark:border-slate-800">
      <!-- Logo / School Branding -->
      <div class="flex items-center gap-3 mb-5 px-1">
        <div class="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20 shrink-0">
          <GraduationCap class="text-white" :size="20" />
        </div>
        <div class="min-w-0">
          <h1 class="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">EduRaport</h1>
          <span v-if="!isSoloTeacher" class="text-[9px] uppercase tracking-wider text-amber-500 font-bold block">Portal E-Raport</span>
          <B2cSoloBadge v-if="isSoloTeacher" class="mt-0.5" />
        </div>
      </div>

      <!-- Quick Menu Search -->
      <div class="mb-3 px-1">
        <div class="relative">
          <Search :size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input 
            v-model="menuSearchQuery"
            type="text"
            placeholder="Cari menu & fitur..."
            class="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
          />
          <button 
            v-if="menuSearchQuery"
            @click="menuSearchQuery = ''"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            title="Hapus pencarian"
          >
            <X :size="12" />
          </button>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto pr-1 pb-4">
        <div v-if="filteredMenuGroups.length === 0" class="text-center py-8 px-3">
          <p class="text-xs text-slate-400 dark:text-slate-500">Tidak ada menu untuk "{{ menuSearchQuery }}"</p>
          <button 
            @click="menuSearchQuery = ''"
            class="mt-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
          >
            Reset Pencarian
          </button>
        </div>

        <div v-for="(group, gIdx) in filteredMenuGroups" :key="gIdx" class="mb-3.5">
          <div class="px-2.5 mb-1.5">
            <h3 class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ group.title }}</h3>
          </div>
          <div class="space-y-1">
            <template v-for="(item, iIdx) in group.items" :key="item.to">
              <NuxtLink 
                :to="item.to"
                :target="item.external ? '_blank' : undefined"
                class="group relative flex flex-col gap-0.5 px-3 py-2 rounded-xl transition-all duration-200"
                :class="item.customClass || 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'"
                active-class="!bg-violet-600 !text-white shadow-md shadow-violet-600/20"
              >
                <div class="flex items-center justify-between w-full gap-1.5">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <component :is="item.icon" :size="16" class="shrink-0 transition-transform group-hover:scale-110" /> 
                    <span class="text-xs font-semibold tracking-wide truncate">{{ item.label }}</span>
                  </div>
                  <span 
                    v-if="item.badge" 
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 transition-colors uppercase tracking-wider leading-none"
                    :class="[
                      getBadgeClass(item.badge),
                      'group-[.router-link-active]:!bg-white/20 group-[.router-link-active]:!text-white group-[.router-link-active]:!border-white/30'
                    ]"
                  >
                    {{ item.badge }}
                  </span>
                </div>
                <p 
                  v-if="item.subtitle" 
                  class="text-[10px] pl-[26px] truncate leading-tight transition-colors text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-[.router-link-active]:!text-violet-100"
                >
                  {{ item.subtitle }}
                </p>
              </NuxtLink>
            </template>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer (User Info & Logout) -->
      <div class="pt-6 border-t border-slate-200 dark:border-slate-800">
        <div class="flex items-center justify-between mb-4 px-2">
          <div class="truncate pr-2">
            <p class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ user?.full_name || 'Guest User' }}</p>
            <p class="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{{ user?.role || 'Guest' }}</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400 uppercase">
            {{ user?.full_name?.substring(0, 2) || 'GU' }}
          </div>
        </div>
        <button 
          @click="showChangePasswordModal = true" 
          class="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors text-xs font-bold mb-1"
        >
          <Key :size="16" />
          <span>Ubah Password</span>
        </button>
        <button 
          @click="logout" 
          class="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors text-xs font-bold"
        >
          <LogOut :size="16" />
          <span>Keluar Portal</span>
        </button>
      </div>
    </aside>

    <!-- Main Workspace -->
    <div class="flex-1 lg:pl-72 flex flex-col min-w-0">
      
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
          <ClientOnly>
            <button 
              @click="toggleTheme" 
              class="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors border border-slate-200 dark:border-zinc-700"
              title="Toggle Tema"
            >
              <Sun v-if="colorMode === 'dark'" :size="16" />
              <Moon v-else :size="16" />
            </button>
          </ClientOnly>
          
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
      <main :class="['flex-1 p-6 md:p-8 w-full pb-24 lg:pb-8', isFullScreenPage ? '' : 'max-w-7xl mx-auto']">
        <template v-if="!isPaywallVisible">
          <slot />
        </template>
        <div v-else class="flex items-center justify-center h-[60vh] opacity-50">
          <!-- Background placeholder when Paywall is active -->
        </div>
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

    <!-- B2C Paywall Modal for Subscription -->
    <B2cPaywallModal :model-value="isPaywallVisible" :forceUpgrade="true" title="Langganan Berakhir" message="Masa trial/langganan Anda telah berakhir. Anda harus memperpanjang paket untuk dapat terus menggunakan EduRaport." requiredPlan="PRO / BASIC" />

    <!-- B2C Paywall Modal for Quota Exceeded (from Store) -->
    <B2cPaywallModal 
      :model-value="paywallStore.isVisible" 
      @update:model-value="paywallStore.isVisible = $event"
      :forceUpgrade="paywallStore.forceUpgrade" 
      :title="paywallStore.title" 
      :message="paywallStore.message" 
      :requiredPlan="paywallStore.requiredPlan" 
    />

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
