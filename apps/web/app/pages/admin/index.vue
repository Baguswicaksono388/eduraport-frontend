<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <div class="bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-700/50 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="space-y-2">
        <div class="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
          <span>Subdomain App Terpisah</span>
        </div>
        <h1 class="text-xl font-bold tracking-tight">EduRaport Platform Admin Cockpit</h1>
        <p class="text-xs text-slate-300 max-w-lg leading-relaxed">
          Pusat pemeliharaan seluruh ekosistem EduRaport: verifikasi pembayaran B2C solo teacher, manajemen lisensi sekolah B2B, monitor kuota token AI, dan pipeline prospek sales.
        </p>
      </div>

      <a
        :href="platformAdminUrl"
        target="_blank"
        class="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 shrink-0 transition-all"
      >
        <span>Buka Platform Cockpit</span>
        <ExternalLink class="w-4 h-4" />
      </a>
    </div>

    <!-- Quick info cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
        <div class="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
          <School class="w-4 h-4 text-indigo-500" />
          <span>Maintenance B2B</span>
        </div>
        <p class="text-slate-500 dark:text-zinc-400">Onboarding sekolah baru, direktori yayasan, monitoring jumlah siswa dan kuota.</p>
      </div>

      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
        <div class="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
          <GraduationCap class="w-4 h-4 text-violet-500" />
          <span>Maintenance B2C</span>
        </div>
        <p class="text-slate-500 dark:text-zinc-400">Verifikasi slip transfer manual guru solo, perpanjangan masa aktif, dan kuota AI.</p>
      </div>

      <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
        <div class="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
          <Target class="w-4 h-4 text-emerald-500" />
          <span>Trojan Horse CRM</span>
        </div>
        <p class="text-slate-500 dark:text-zinc-400">Follow-up sekolah asal guru B2C untuk dikonversikan menjadi kontrak enterprise B2B.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExternalLink, School, GraduationCap, Target } from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';

const { user } = useAuth();
const router = useRouter();
const config = useRuntimeConfig();
const platformAdminUrl = computed(() => config.public.platformAdminUrl || 'http://localhost:3002');

onMounted(() => {
  if (user.value && user.value.role !== 'super_admin') {
    router.push('/unauthorized');
  }
});
</script>
