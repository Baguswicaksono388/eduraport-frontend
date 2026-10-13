<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MessageSquare, ArrowLeft, Send, Paperclip, Check, CheckCheck, User, Plus } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal } from '@eduraport/ui'
import { useParent } from '../../composables/useParent'
import { useToast } from '../../composables/useToast'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) return navigateTo('/login')
    }
  ]
})

const { fetchMessages, sendMessage, markMessageRead } = useParent()
const toast = useToast()

const loading = ref(true)
const messagesList = ref<any[]>([])
const isNewMessageModal = ref(false)
const sending = ref(false)

const newForm = ref({
  subject: '',
  body: '',
  attachment_url: ''
})

const loadMessages = async () => {
  loading.value = true
  try {
    const res = await fetchMessages(1, 50)
    messagesList.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMessages()
})

const handleSend = async () => {
  if (!newForm.value.subject.trim() || !newForm.value.body.trim()) {
    toast.error('Subjek dan pesan wajib diisi.', 'Peringatan')
    return
  }
  sending.value = true
  try {
    await sendMessage({
      subject: newForm.value.subject,
      body: newForm.value.body,
      attachment_url: newForm.value.attachment_url || null
    })
    toast.success('Pesan berhasil terkirim ke wali kelas/guru.', 'Sukses')
    isNewMessageModal.value = false
    newForm.value = { subject: '', body: '', attachment_url: '' }
    await loadMessages()
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengirim pesan.', 'Error')
  } finally {
    sending.value = false
  }
}

const toggleRead = async (msg: any) => {
  if (!msg.is_read) {
    try {
      await markMessageRead(msg.id)
      msg.is_read = true
    } catch (e) {
      console.error(e)
    }
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-violet-600 transition">
          <ArrowLeft :size="18" />
        </NuxtLink>
        <div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <MessageSquare class="text-violet-600" :size="24" />
            Pesan & Komunikasi Guru
          </h2>
          <p class="text-xs text-slate-500">Pesan resmi dua arah dengan wali kelas dan pihak sekolah</p>
        </div>
      </div>

      <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center gap-1.5" @click="isNewMessageModal = true">
        <Plus :size="16" /> Tulis Pesan
      </BaseButton>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-3">
      <div v-if="messagesList.length > 0" class="space-y-3">
        <BaseCard
          v-for="msg in messagesList"
          :key="msg.id"
          class="hover:border-violet-500 transition group cursor-pointer"
          @click="toggleRead(msg)"
        >
          <div class="flex justify-between items-start">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span
                  class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                  :class="msg.sender_type === 'parent' ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/40' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'"
                >
                  {{ msg.sender_type === 'parent' ? 'Dari Anda' : 'Dari Guru / Sekolah' }}
                </span>
                <span class="text-[10px] text-slate-400">
                  {{ new Date(msg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-sm">{{ msg.subject }}</h4>
              <p class="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{{ msg.body }}</p>
              
              <a
                v-if="msg.attachment_url"
                :href="msg.attachment_url"
                target="_blank"
                class="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:underline mt-1"
              >
                <Paperclip :size="12" /> Lihat Lampiran
              </a>
            </div>

            <div class="text-slate-400 shrink-0">
              <CheckCheck v-if="msg.is_read" :size="16" class="text-violet-600" title="Dibaca" />
              <Check v-else :size="16" title="Terkirim" />
            </div>
          </div>
        </BaseCard>
      </div>

      <div v-else class="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
        <MessageSquare class="mx-auto text-slate-400 mb-2" :size="36" />
        <p class="text-sm font-bold text-slate-800 dark:text-zinc-200">Belum ada riwayat pesan</p>
        <p class="text-xs text-slate-400 mt-1">Gunakan tombol "Tulis Pesan" untuk menghubungi wali kelas.</p>
      </div>
    </div>

    <!-- Modal Tulis Pesan -->
    <BaseModal v-model="isNewMessageModal" title="Kirim Pesan ke Guru/Wali Kelas">
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Subjek Pesan</label>
          <input
            v-model="newForm.subject"
            type="text"
            placeholder="Contoh: Konsultasi Perkembangan Belajar Ananda"
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-semibold text-xs outline-none focus:border-violet-600"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Isi Pesan</label>
          <textarea
            v-model="newForm.body"
            rows="4"
            placeholder="Tuliskan pertanyaan atau hal yang ingin disampaikan kepada wali kelas..."
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-medium text-xs outline-none focus:border-violet-600"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" size="sm" @click="isNewMessageModal = false">Batal</BaseButton>
          <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white" :disabled="sending" @click="handleSend">
            {{ sending ? 'Mengirim...' : 'Kirim Pesan' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
