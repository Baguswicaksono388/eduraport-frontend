<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { Crown, Sparkles, User, AlertTriangle, ArrowRight } from 'lucide-vue-next'
import { useB2CSubscription } from '../../composables/useB2CSubscription'

const { subscription, loading, fetchSubscription } = useB2CSubscription()

onMounted(async () => {
  await fetchSubscription()
})

const isTrial = computed(() => subscription.value?.plan_type === 'trial')
const isPro = computed(() => subscription.value?.plan_type === 'pro')
const isFree = computed(() => subscription.value?.plan_type === 'free')
const isExpired = computed(() => subscription.value?.status === 'expired')

const aiQuotaPercent = computed(() => {
  if (!subscription.value || subscription.value.ai_generation_limit === 0) return 0
  return Math.min(100, Math.round((subscription.value.ai_generation_used / subscription.value.ai_generation_limit) * 100))
})
</script>

<template>
  <div v-if="loading" class="animate-pulse bg-slate-100 dark:bg-zinc-800 rounded-xl h-48"></div>
  
  <div v-else-if="subscription" class="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm relative overflow-hidden">
    <!-- Background Decor -->
    <div class="absolute -right-6 -top-6 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none"></div>

    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
          <Crown :size="20" v-if="isPro" class="text-amber-500" />
          <Sparkles :size="20" v-else />
        </div>
        <div>
          <h3 class="font-bold text-slate-800 dark:text-white capitalize">{{ subscription.plan_type }} Plan</h3>
          <p class="text-xs text-slate-500">
            <span v-if="isTrial">Sisa {{ Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) }} hari trial</span>
            <span v-else-if="isPro">Aktif hingga {{ new Date(subscription.end_date).toLocaleDateString('id-ID') }}</span>
            <span v-else>Gratis terbatas</span>
          </p>
        </div>
      </div>
      <div v-if="isExpired" class="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1">
        <AlertTriangle :size="12" /> Expired
      </div>
    </div>

    <div class="space-y-4">
      <!-- AI Quota -->
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span class="text-slate-600 dark:text-slate-400 flex items-center gap-1"><Sparkles :size="14"/> AI Asisten</span>
          <span class="font-semibold text-slate-800 dark:text-slate-200">{{ subscription.ai_generation_used }} / {{ subscription.ai_generation_limit }}</span>
        </div>
        <div class="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2">
          <div class="bg-violet-600 h-2 rounded-full transition-all" :style="{ width: `${aiQuotaPercent}%` }" :class="{'bg-red-500': aiQuotaPercent >= 100}"></div>
        </div>
      </div>

      <!-- Student Quota -->
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span class="text-slate-600 dark:text-slate-400 flex items-center gap-1"><User :size="14"/> Kapasitas Siswa</span>
          <span class="font-semibold text-slate-800 dark:text-slate-200">Max {{ subscription.student_capacity_limit }}</span>
        </div>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
      <NuxtLink to="/b2c/subscription" class="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1">
        Upgrade Paket <ArrowRight :size="14" />
      </NuxtLink>
    </div>
  </div>
</template>
