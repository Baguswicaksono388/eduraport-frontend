<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
    <!-- Top Navigation Bar -->
    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Logo & Platform Badge -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl tracking-wider">
            ER
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-base font-bold text-white tracking-tight">EduRaport</span>
              <span class="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Superadmin
              </span>
            </div>
            <p class="text-xs text-slate-400">Platform Command Center (B2B & B2C)</p>
          </div>
        </div>

        <!-- Right Side: Server Indicator, User Chip & Logout -->
        <div class="flex items-center space-x-4">
          <!-- Server Ping Indicator -->
          <div class="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-slate-300 font-medium">Node.js API Active</span>
          </div>

          <!-- User Profile & Logout -->
          <div v-if="user" class="flex items-center space-x-3">
            <div class="hidden md:block text-right">
              <div class="text-xs font-semibold text-slate-200">{{ user.full_name }}</div>
              <div class="text-[10px] text-slate-400">{{ user.email }}</div>
            </div>
            <button
              @click="handleLogout"
              class="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-900/30 hover:border-rose-500/40 border border-slate-700 rounded-lg transition-colors flex items-center space-x-1.5"
              title="Logout Superadmin"
            >
              <LogOut class="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800 py-4 text-center text-xs text-slate-400 bg-slate-900/40">
      EduRaport Enterprise Platform &copy; 2026. Hak Cipta Dilindungi. Sistem Manajemen Multi-Tenant & Lisensi Guru.
    </footer>
  </div>
</template>

<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';

const { user, logout, fetchUser } = useAuth();

onMounted(async () => {
  await fetchUser();
});

const handleLogout = () => {
  logout();
};
</script>
