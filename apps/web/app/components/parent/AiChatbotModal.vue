<script setup lang="ts">
import { ref } from 'vue'
import { Bot, X, Send, Sparkles, Trash2, Loader2 } from 'lucide-vue-next'
import { BaseButton } from '@eduraport/ui'
import { useParent } from '../../composables/useParent'

const props = defineProps<{
  studentId?: string
  studentName?: string
}>()

const { chatAiAssistant } = useParent()

const isOpen = ref(false)
const inputMessage = ref('')
const isLoading = ref(false)
const messages = ref<Array<{ role: 'user' | 'assistant'; content: string; time: string }>>([
  {
    role: 'assistant',
    content: 'Halo Ayah/Bunda! Saya EduRaport AI Assistant. Ada yang bisa saya bantu terkait nilai, absensi, tagihan, atau jadwal ananda?',
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
])

const suggestedPrompts = [
  'Bagaimana ringkasan nilai semester ini?',
  'Apakah ada tagihan yang belum dibayar?',
  'Bagaimana kehadiran ananda 30 hari terakhir?',
  'Kapan jadwal pelajaran hari ini?'
]

const sendMessage = async (textToSend?: string) => {
  const text = (textToSend || inputMessage.value).trim()
  if (!text || isLoading.value) return

  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  messages.value.push({ role: 'user', content: text, time: now })
  inputMessage.value = ''
  isLoading.value = true

  try {
    const res = await chatAiAssistant(props.studentId || '', text)
    if (res?.data?.reply) {
      messages.value.push({
        role: 'assistant',
        content: res.data.reply,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      })
    } else {
      messages.value.push({
        role: 'assistant',
        content: res?.message || 'Maaf, sistem tidak dapat memproses jawaban saat ini.',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      })
    }
  } catch (err: any) {
    messages.value.push({
      role: 'assistant',
      content: err.message || 'Terjadi gangguan koneksi ke AI.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    })
  } finally {
    isLoading.value = false
  }
}

const clearChat = () => {
  messages.value = [
    {
      role: 'assistant',
      content: 'Percakapan telah direset. Silakan tanyakan hal lain seputar putra/putri Anda.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]
}
</script>

<template>
  <div>
    <!-- Floating Action Button -->
    <button
      @click="isOpen = true"
      class="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-violet-500/30 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group border border-white/20"
      title="Tanya AI Asisten Wali Murid"
    >
      <Bot class="w-6 h-6 animate-pulse" />
      <span class="text-xs font-bold tracking-wide pr-1 hidden md:inline">Tanya AI</span>
    </button>

    <!-- Chat Modal Window -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        class="bg-white dark:bg-zinc-900 w-full sm:w-[420px] h-[580px] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        <!-- Header -->
        <div class="px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="p-1.5 bg-white/20 rounded-lg">
              <Bot class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-sm font-bold leading-tight">EduRaport AI Parent</h4>
              <p class="text-[10px] text-violet-200">Asisten Pintar {{ studentName ? `&bull; ${studentName}` : '' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="clearChat"
              class="p-1.5 hover:bg-white/20 rounded-lg text-violet-200 hover:text-white transition"
              title="Bersihkan Chat"
            >
              <Trash2 class="w-4 h-4" />
            </button>
            <button
              @click="isOpen = false"
              class="p-1.5 hover:bg-white/20 rounded-lg text-violet-200 hover:text-white transition"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Messages Body -->
        <div class="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-zinc-950/50">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
          >
            <div
              :class="[
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm',
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-800 rounded-bl-none'
              ]"
            >
              <p class="whitespace-pre-line">{{ msg.content }}</p>
              <p
                :class="[
                  'text-[9px] mt-1 text-right',
                  msg.role === 'user' ? 'text-violet-200' : 'text-slate-400'
                ]"
              >
                {{ msg.time }}
              </p>
            </div>
          </div>

          <div v-if="isLoading" class="flex justify-start">
            <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-2 text-slate-500 text-xs">
              <Loader2 class="w-4 h-4 animate-spin text-violet-600" />
              <span>AI sedang menganalisis data...</span>
            </div>
          </div>
        </div>

        <!-- Suggested Prompt Chips -->
        <div class="px-3 py-2 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
          <button
            v-for="(prompt, idx) in suggestedPrompts"
            :key="idx"
            @click="sendMessage(prompt)"
            class="whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900/40 rounded-full hover:bg-violet-100 transition shrink-0"
          >
            {{ prompt }}
          </button>
        </div>

        <!-- Input Box -->
        <div class="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
          <form @submit.prevent="sendMessage()" class="flex items-center gap-2">
            <input
              v-model="inputMessage"
              type="text"
              placeholder="Ketik pertanyaan untuk AI..."
              class="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-violet-600 text-slate-800 dark:text-zinc-100"
            />
            <BaseButton
              type="submit"
              size="sm"
              class="!p-2.5 !rounded-xl bg-violet-600 hover:bg-violet-700 text-white shrink-0"
              :disabled="!inputMessage.trim() || isLoading"
            >
              <Send class="w-4 h-4" />
            </BaseButton>
          </form>
          <p class="text-[9px] text-center text-slate-400 mt-1.5">Maks. 20 pertanyaan/hari &bull; Menjawab berdasarkan data resmi anak</p>
        </div>
      </div>
    </div>
  </div>
</template>
