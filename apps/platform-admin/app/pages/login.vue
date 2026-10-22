<template>
  <div class="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
    <!-- Ambient Glow Effects -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Login Container -->
    <div class="w-full max-w-md z-10">
      <!-- Branding Header -->
      <div class="text-center mb-8">
        <div class="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 items-center justify-center shadow-xl shadow-indigo-500/25 text-white font-black text-2xl mb-4">
          ER
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Superadmin Cockpit</h1>
        <p class="text-sm text-slate-400 mt-1">Platform Command & Tenant Maintenance</p>
      </div>

      <!-- Login Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur">
        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2.5"
        >
          <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Email Input -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Superadmin
            </label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="superadmin@eduraport.com"
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Kata Sandi
            </label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                v-model="form.password"
                type="password"
                required
                placeholder="••••••••••••"
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <ShieldCheck v-else class="w-4 h-4" />
            <span>{{ loading ? 'Mengautentikasi...' : 'Masuk ke Platform Hub' }}</span>
          </button>
        </form>

        <!-- Security Notice -->
        <div class="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p class="text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
            <ShieldAlert class="w-3.5 h-3.5 text-amber-500" />
            <span>Akses dibatasi hanya untuk personil Superadmin EduRaport resmi.</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Mail, Lock, ShieldCheck, ShieldAlert, AlertCircle, Loader2 } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';

definePageMeta({
  layout: false,
});

const { login, loading } = useAuth();
const router = useRouter();

const form = reactive({
  email: '',
  password: '',
});

const errorMessage = ref('');

const handleLogin = async () => {
  errorMessage.value = '';
  const result = await login(form);
  if (result.success) {
    router.push('/');
  } else {
    errorMessage.value = result.error || 'Autentikasi gagal';
  }
};
</script>
