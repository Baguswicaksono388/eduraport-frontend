import fs from 'fs'

let content = fs.readFileSync('apps/web/app/layouts/default.vue', 'utf8')

const menuGroupsCode = `
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
`

content = content.replace('</script>', `
${menuGroupsCode}
</script>`)

const mobileNavRegex = /<!-- Navigation Links -->[\s\S]*?<\/nav>/;
const desktopNavRegex = /<!-- Navigation Links -->[\s\S]*?<\/nav>/g;

const mobileReplacement = `<!-- Navigation Links -->
        <nav class="flex-1 overflow-y-auto pr-1 pb-4">
          <div v-for="(group, gIdx) in menuGroups" :key="gIdx" class="mb-4 mt-2">
            <div class="px-5 mb-2">
              <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-widest">{{ group.title }}</h3>
            </div>
            <div class="space-y-1">
              <template v-for="(item, iIdx) in group.items" :key="iIdx">
                <NuxtLink 
                  v-if="canAccess(item.access)"
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
        </nav>`

const desktopReplacement = `<!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto pr-1 pb-4">
        <div v-for="(group, gIdx) in menuGroups" :key="gIdx" class="mb-4 mt-2">
          <div class="px-5 mb-2">
            <h3 class="text-[9px] font-black text-slate-500 uppercase tracking-widest">{{ group.title }}</h3>
          </div>
          <div class="space-y-1">
            <template v-for="(item, iIdx) in group.items" :key="iIdx">
              <NuxtLink 
                v-if="canAccess(item.access)"
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
      </nav>`

// We have two instances of "<!-- Navigation Links -->... </nav>". 
// The first one is for mobile, the second for desktop.
let count = 0;
content = content.replace(desktopNavRegex, (match) => {
    count++;
    if (count === 1) return mobileReplacement;
    if (count === 2) return desktopReplacement;
    return match;
});

fs.writeFileSync('apps/web/app/layouts/default.vue', content)
console.log('Successfully refactored default.vue!')
