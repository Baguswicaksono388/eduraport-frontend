<script setup lang="ts">
import { Sparkles, Calendar } from 'lucide-vue-next'

const props = defineProps<{
  textHtml: string
  actions: Array<{ label: string; route: string }>
  userName: string
}>()

const emit = defineEmits<{
  (e: 'action', route: string): void
}>()

const todayStr = computed(() => {
  const today = new Date()
  const daysName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const monthsName = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${daysName[today.getDay()]}, ${today.getDate()} ${monthsName[today.getMonth()]} ${today.getFullYear()}`
})
</script>

<template>
  <div class="relative bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 text-white rounded-xl p-6 md:p-8 border border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
    <!-- Sophisticated decorative glow elements -->
    <div class="absolute -right-16 -top-16 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10 space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-amber-400 border border-white/10 uppercase tracking-widest">
          <Sparkles :size="10" /> Taklimat Pagi
        </span>
        <div class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
          <Calendar :size="12" />
          {{ todayStr }}
        </div>
      </div>

      <h2 class="text-xl md:text-3xl font-black tracking-tight leading-tight">
        Selamat Pagi, {{ userName || 'Pengguna' }}!
      </h2>

      <!-- Narrative Briefing Body with custom good/bad colors -->
      <div class="briefing-text text-sm md:text-base text-slate-200 leading-relaxed font-medium max-w-4xl" v-html="textHtml"></div>

      <!-- Quick action buttons -->
      <div v-if="actions.length > 0" class="flex flex-wrap items-center gap-3 pt-2">
        <button
          v-for="act in actions"
          :key="act.label"
          @click="emit('action', act.route)"
          class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1"
        >
          {{ act.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* Scoped HTML injections styling */
.briefing-text .bad {
  color: #f43f5e; /* Rose 500 */
  background-color: rgba(244, 63, 94, 0.08);
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(244, 63, 94, 0.15);
  display: inline-block;
}

.briefing-text .good {
  color: #10b981; /* Emerald 500 */
  background-color: rgba(16, 185, 129, 0.08);
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(16, 185, 129, 0.15);
  display: inline-block;
}
</style>
