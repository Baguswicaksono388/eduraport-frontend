<script setup lang="ts">
import { computed } from 'vue'
import { MessageSquare, Check, Clock } from 'lucide-vue-next'

const props = defineProps<{
  laggingTeachers: Array<{ user_id: string; name: string; gap: string; phone?: string | null }>
  reminders: any[]
  sending: boolean
}>()

const emit = defineEmits<{
  (e: 'send-reminder', payload: { recipient_id: string; metric_key: string; message_body: string; phone?: string }): void
}>()

// Clean and format phone number to E.164 (Indonesia 62)
const formatPhone = (phone?: string | null) => {
  if (!phone) return ''
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('62') && cleaned.length > 0) {
    cleaned = '62' + cleaned
  }
  return cleaned
}

// Check if a teacher reminder is in cooldown (last 24 hours)
const getCooldownState = (teacherId: string) => {
  const lastRem = props.reminders.find(
    (r: any) => r.recipient_id === teacherId && r.metric_key === 'acad.teacher.lagging'
  )
  if (!lastRem) return { active: false, timeStr: '' }
  
  const sentTime = new Date(lastRem.sent_at).getTime()
  const diffMs = Date.now() - sentTime
  const cooldownMs = 24 * 60 * 60 * 1000
  
  if (diffMs < cooldownMs) {
    const remainMs = cooldownMs - diffMs
    const hours = Math.ceil(remainMs / (1000 * 60 * 60))
    return { active: true, timeStr: `${hours} jam` }
  }
  return { active: false, timeStr: '' }
}

const handleRemind = (teacher: any) => {
  const msg = `Halo Bapak/Ibu ${teacher.name}. Mengingatkan untuk segera melengkapi pengisian & finalisasi nilai raport semester ini di portal EduRaport. Terima kasih.`
  const phone = formatPhone(teacher.phone)

  emit('send-reminder', {
    recipient_id: teacher.user_id,
    metric_key: 'acad.teacher.lagging',
    message_body: msg,
    phone
  })
}
</script>

<template>
  <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between h-full">
    <div class="space-y-4">
      <div>
        <h3 class="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
          Guru Terlambat Input Nilai
        </h3>
        <p class="text-[10px] text-slate-400 font-semibold mt-0.5">
          Gunakan tombol di bawah untuk mengirim pengingat manual via WhatsApp.
        </p>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-zinc-800 max-h-96 overflow-y-auto pr-1">
        <div
          v-for="t in laggingTeachers"
          :key="t.user_id"
          class="py-3 flex items-center justify-between gap-4 text-xs animate-in fade-in duration-200"
        >
          <div class="space-y-1">
            <p class="font-bold text-slate-700 dark:text-zinc-200">
              {{ t.name }}
            </p>
            <p class="text-[10px] text-slate-400 line-clamp-2 max-w-[200px]" :title="t.gap">
              Tertunda: {{ t.gap }}
            </p>
          </div>

          <div class="text-right">
            <!-- Cooldown State Check -->
            <template v-if="getCooldownState(t.user_id).active">
              <span 
                class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg text-[10px] font-bold cursor-not-allowed border border-slate-200/50 dark:border-zinc-700/50"
                :title="`Bisa diingatkan lagi dalam ${getCooldownState(t.user_id).timeStr}`"
              >
                <Clock :size="10" />
                <span>Cooldown ({{ getCooldownState(t.user_id).timeStr }})</span>
              </span>
            </template>
            
            <template v-else>
              <button
                @click="handleRemind(t)"
                :disabled="sending"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-[10px] font-extrabold shadow-sm hover:shadow transition-all"
              >
                <MessageSquare :size="11" />
                <span>Ingatkan WA</span>
              </button>
            </template>
          </div>
        </div>

        <div v-if="laggingTeachers.length === 0" class="text-center py-6 text-slate-400 italic font-semibold">
          Semua guru telah merampungkan pengisian nilai.
        </div>
      </div>
    </div>
  </div>
</template>
