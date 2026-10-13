<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CalendarCheck, ArrowLeft, Plus, Clock, UserCheck, XCircle, CheckCircle2 } from 'lucide-vue-next'
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

const { fetchMyChildren, myChildren, fetchMeetings, fetchMeetingSlots, bookMeeting, cancelMeeting } = useParent()
const toast = useToast()

const loading = ref(true)
const meetingsList = ref<any[]>([])
const isBookModal = ref(false)
const bookingLoading = ref(false)

const bookForm = ref({
  student_id: '',
  teacher_id: '',
  date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  time: '10:00'
})

const slots = ref<any[]>([])

const loadMeetings = async () => {
  loading.value = true
  try {
    await fetchMyChildren()
    if (myChildren.value.length > 0) {
      bookForm.value.student_id = myChildren.value[0].student_id
    }
    meetingsList.value = await fetchMeetings()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMeetings()
})

const openBookModal = async () => {
  isBookModal.value = true
  // Default mock teacher id if not set
  bookForm.value.teacher_id = '11111111-1111-1111-1111-111111111111'
  slots.value = await fetchMeetingSlots(bookForm.value.teacher_id, bookForm.value.date)
}

const handleBook = async () => {
  bookingLoading.value = true
  try {
    const scheduledAt = `${bookForm.value.date}T${bookForm.value.time}:00.000Z`
    await bookMeeting({
      student_id: bookForm.value.student_id,
      teacher_id: bookForm.value.teacher_id,
      scheduled_at: scheduledAt
    })
    toast.success('Jadwal konsultasi guru berhasil dibooking.', 'Sukses')
    isBookModal.value = false
    await loadMeetings()
  } catch (err: any) {
    toast.error(err.message || 'Gagal membooking pertemuan.', 'Error')
  } finally {
    bookingLoading.value = false
  }
}

const handleCancel = async (meetingId: string) => {
  try {
    await cancelMeeting(meetingId)
    toast.success('Jadwal pertemuan berhasil dibatalkan.', 'Sukses')
    await loadMeetings()
  } catch (err: any) {
    toast.error(err.message || 'Gagal membatalkan jadwal.', 'Error')
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
            <CalendarCheck class="text-indigo-600" :size="24" />
            Jadwal Konsultasi Guru (PTM)
          </h2>
          <p class="text-xs text-slate-500">Booking sesi tatap muka atau konsultasi online dengan guru / wali kelas</p>
        </div>
      </div>

      <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center gap-1.5" @click="openBookModal">
        <Plus :size="16" /> Booking Jadwal Baru
      </BaseButton>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-3">
      <div v-if="meetingsList.length > 0" class="space-y-3">
        <BaseCard v-for="m in meetingsList" :key="m.id">
          <div class="flex justify-between items-start">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span
                  class="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  :class="m.status === 'scheduled' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40' : 'bg-slate-100 text-slate-500'"
                >
                  {{ m.status === 'scheduled' ? 'Terjadwal' : 'Dibatalkan' }}
                </span>
                <span class="text-xs font-bold text-slate-900 dark:text-zinc-100">{{ m.student_name }}</span>
              </div>

              <h4 class="font-bold text-slate-800 dark:text-zinc-200 text-sm mt-1">Konsultasi dengan {{ m.teacher_name || 'Guru' }}</h4>
              <p class="text-xs text-slate-500 flex items-center gap-1">
                <Clock :size="14" /> {{ new Date(m.scheduled_at).toLocaleDateString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) }}
              </p>
            </div>

            <div>
              <BaseButton
                v-if="m.status === 'scheduled'"
                size="sm"
                variant="outline"
                class="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
                @click="handleCancel(m.id)"
              >
                Batalkan
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <div v-else class="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
        <CalendarCheck class="mx-auto text-slate-400 mb-2" :size="36" />
        <p class="text-sm font-bold text-slate-800 dark:text-zinc-200">Belum ada jadwal konsultasi</p>
        <p class="text-xs text-slate-400 mt-1">Gunakan tombol "Booking Jadwal Baru" untuk membuat janji temu dengan guru.</p>
      </div>
    </div>

    <!-- Modal Booking -->
    <BaseModal v-model="isBookModal" title="Booking Jadwal Konsultasi">
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Pilih Siswa</label>
          <select v-model="bookForm.student_id" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-semibold text-xs outline-none">
            <option v-for="c in myChildren" :key="c.student_id" :value="c.student_id">
              {{ c.student_name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Tanggal Konsultasi</label>
          <input
            v-model="bookForm.date"
            type="date"
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-semibold text-xs outline-none"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Pilih Slot Jam Tersedia</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="slot in (slots.length > 0 ? slots : [
                { time: '09:00', available: true },
                { time: '10:00', available: true },
                { time: '11:00', available: true },
                { time: '13:00', available: true },
                { time: '14:00', available: true },
                { time: '15:00', available: true }
              ])"
              :key="slot.time"
              type="button"
              :disabled="!slot.available"
              @click="bookForm.time = slot.time"
              :class="[
                'p-2 rounded-xl text-center font-bold transition border',
                !slot.available ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-zinc-800' :
                bookForm.time === slot.time ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
              ]"
            >
              {{ slot.time }} WIB
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" size="sm" @click="isBookModal = false">Batal</BaseButton>
          <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white" :disabled="bookingLoading" @click="handleBook">
            {{ bookingLoading ? 'Membooking...' : 'Konfirmasi Booking' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
