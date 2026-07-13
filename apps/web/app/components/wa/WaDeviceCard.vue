<script setup lang="ts">
import { 
  Smartphone, 
  Trash2, 
  Pause, 
  Play, 
  RotateCw, 
  Wifi, 
  WifiOff, 
  AlertOctagon, 
  ShieldAlert,
  Flame,
  Activity,
  UserCheck
} from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'

const props = defineProps<{
  device: {
    id: string;
    school_id: string;
    driver: 'unofficial' | 'official';
    phone_number: string | null;
    display_name: string | null;
    status: 'provisioning' | 'pairing' | 'connected' | 'disconnected' | 'paused' | 'banned' | 'removed';
    warmup_stage: 'new' | 'stage_1' | 'stage_2' | 'stage_3' | 'mature';
    circuit_state: 'closed' | 'slow' | 'open' | 'half_open';
    circuit_open_until: string | null;
    circuit_open_count: number;
    disclaimer_accepted: boolean;
    last_seen_at: string | null;
    paired_at: string | null;
    connected: boolean;
  }
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void;
  (e: 'pause', id: string): void;
  (e: 'resume', id: string): void;
  (e: 'repair', id: string): void;
  (e: 'bypass-warmup', id: string): void;
}>()

const statusConfig = computed(() => {
  switch (props.device.status) {
    case 'connected':
      return { label: 'Connected', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
    case 'pairing':
      return { label: 'Pairing QR', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' }
    case 'provisioning':
      return { label: 'Initializing', class: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse' }
    case 'paused':
      return { label: 'Paused', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
    case 'banned':
      return { label: 'Banned', class: 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold' }
    case 'disconnected':
    default:
      return { label: 'Disconnected', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
  }
})

const circuitConfig = computed(() => {
  switch (props.device.circuit_state) {
    case 'closed':
      return { label: 'Closed (Healthy)', class: 'text-emerald-500 bg-emerald-500/10' }
    case 'slow':
      return { label: 'Slow (Degraded)', class: 'text-amber-500 bg-amber-500/10' }
    case 'half_open':
      return { label: 'Half-Open (Testing)', class: 'text-indigo-500 bg-indigo-500/10 animate-pulse' }
    case 'open':
    default:
      return { label: 'Open (Blocked)', class: 'text-rose-500 bg-rose-500/10 font-bold' }
  }
})

const warmupConfig = computed(() => {
  switch (props.device.warmup_stage) {
    case 'new':
      return { label: 'New Device', limit: '0 messages/day', progress: 0 }
    case 'stage_1':
      return { label: 'Stage 1 (Warmup)', limit: '15 personal, 10 group / day', progress: 25 }
    case 'stage_2':
      return { label: 'Stage 2 (Warmup)', limit: '50 personal, 30 group / day', progress: 50 }
    case 'stage_3':
      return { label: 'Stage 3 (Warmup)', limit: '120 personal, 80 group / day', progress: 75 }
    case 'mature':
    default:
      return { label: 'Mature', limit: '250 personal, 150 group / day', progress: 100 }
  }
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' })
}
</script>

<template>
  <BaseCard class="device-card relative overflow-hidden transition-all duration-300 border border-slate-200 dark:border-slate-800 shadow-md">
    <!-- Decorative background flow for Premium visual feedback -->
    <div 
      class="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
      :class="props.device.status === 'connected' ? 'bg-emerald-500/5' : 'bg-slate-500/5'"
    ></div>

    <div class="p-6 space-y-6">
      <!-- Card Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center border transition-colors"
            :class="props.device.status === 'connected' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'"
          >
            <Smartphone :size="24" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-base leading-tight">
                {{ props.device.display_name || 'WhatsApp Device' }}
              </h4>
              <span 
                class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider"
                :class="props.device.driver === 'official' 
                  ? 'bg-violet-500/10 text-violet-500 border-violet-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'"
              >
                {{ props.device.driver }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              {{ props.device.phone_number ? `+${props.device.phone_number}` : 'Belum pairing' }}
            </p>
          </div>
        </div>

        <!-- Connection Status Badge -->
        <span 
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
          :class="statusConfig.class"
        >
          <span 
            class="w-1.5 h-1.5 rounded-full" 
            :class="[
              props.device.status === 'connected' ? 'bg-emerald-500' : '',
              props.device.status === 'pairing' ? 'bg-amber-500 animate-ping' : '',
              props.device.status === 'provisioning' ? 'bg-indigo-500 animate-ping' : '',
              props.device.status === 'paused' ? 'bg-blue-500' : '',
              props.device.status === 'banned' ? 'bg-rose-500' : '',
              props.device.status === 'disconnected' ? 'bg-slate-400' : '',
            ]"
          ></span>
          {{ statusConfig.label }}
        </span>
      </div>

      <!-- Device Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <!-- Warmup Stage & Limits -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400">
            <span class="flex items-center gap-1">
              <Flame :size="14" class="text-amber-500" />
              Stage Pemanasan
            </span>
            <span class="flex items-center gap-1.5">
              <span class="text-slate-900 dark:text-zinc-200">{{ warmupConfig.label }}</span>
              <button 
                v-if="props.device.warmup_stage !== 'mature'"
                type="button" 
                class="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline"
                title="Lewati Pemanasan (Bypass)"
                @click="emit('bypass-warmup', props.device.id)"
              >
                (Bypass)
              </button>
            </span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              class="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full transition-all duration-500" 
              :style="{ width: `${warmupConfig.progress}%` }"
            ></div>
          </div>
          <p class="text-[10px] font-medium text-slate-400 dark:text-zinc-500 leading-tight">
            Limit: {{ warmupConfig.limit }}
          </p>
        </div>

        <!-- Circuit Breaker State -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400">
            <span class="flex items-center gap-1">
              <Activity :size="14" class="text-violet-500" />
              Circuit Breaker
            </span>
            <span 
              class="px-2 py-0.5 rounded text-[10px] font-bold border"
              :class="circuitConfig.class"
            >
              {{ props.device.circuit_state.toUpperCase() }}
            </span>
          </div>
          <p class="text-[10px] font-medium text-slate-400 dark:text-zinc-500 leading-tight mt-2">
            Status: {{ circuitConfig.label }}
          </p>
        </div>
      </div>

      <!-- Audit dates -->
      <div class="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
        <div>
          <span>Terakhir Terlihat:</span>
          <p class="text-slate-600 dark:text-zinc-300 font-semibold mt-0.5">
            {{ formatDate(props.device.last_seen_at) }}
          </p>
        </div>
        <div>
          <span>Pairing Terakhir:</span>
          <p class="text-slate-600 dark:text-zinc-300 font-semibold mt-0.5">
            {{ formatDate(props.device.paired_at) }}
          </p>
        </div>
      </div>

      <!-- Action Buttons Footer -->
      <div class="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <!-- Repair (Pairing QR) -->
        <BaseButton 
          v-if="props.device.driver === 'unofficial' && props.device.status !== 'banned'"
          variant="outline" 
          size="sm"
          class="flex-1 flex items-center justify-center gap-1.5"
          @click="emit('repair', props.device.id)"
        >
          <RotateCw :size="14" />
          {{ props.device.status === 'pairing' ? 'Scan Ulang' : 'Repair Sesi' }}
        </BaseButton>

        <!-- Pause / Resume -->
        <BaseButton 
          v-if="props.device.status !== 'banned'"
          :variant="props.device.status === 'paused' ? 'primary' : 'outline'"
          size="sm"
          class="flex-1 flex items-center justify-center gap-1.5"
          @click="props.device.status === 'paused' ? emit('resume', props.device.id) : emit('pause', props.device.id)"
        >
          <Play v-if="props.device.status === 'paused'" :size="14" />
          <Pause v-else :size="14" />
          {{ props.device.status === 'paused' ? 'Resume' : 'Pause' }}
        </BaseButton>

        <!-- Hapus -->
        <BaseButton 
          variant="danger" 
          size="sm"
          class="flex-shrink-0 px-3 flex items-center justify-center text-rose-600 border border-rose-200 dark:border-rose-800/30 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          @click="emit('delete', props.device.id)"
        >
          <Trash2 :size="14" />
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.device-card {
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.7);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.dark .device-card {
  background-color: rgba(24, 24, 27, 0.8);
}
.device-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>
