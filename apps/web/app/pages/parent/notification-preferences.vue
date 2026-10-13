<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Bell, ArrowLeft, Smartphone, MessageCircle, Mail, Sliders, CheckCircle2 } from 'lucide-vue-next'
import { BaseCard, BaseButton } from '@eduraport/ui'
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

const { fetchNotificationPreferences, updateNotificationPreferences, fetchMyChildren, myChildren } = useParent()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)

const channels = ref({
  push_enabled: true,
  whatsapp_enabled: true,
  email_enabled: false
})

const thresholds = ref<Array<{ student_id: string; student_name: string; attendance_threshold: number; grade_threshold: number; wallet_balance_threshold: number }>>([])

const loadData = async () => {
  loading.value = true
  try {
    await fetchMyChildren()
    const prefs = await fetchNotificationPreferences()
    if (prefs) {
      channels.value.push_enabled = prefs.push_enabled ?? true
      channels.value.whatsapp_enabled = prefs.whatsapp_enabled ?? true
      channels.value.email_enabled = prefs.email_enabled ?? false

      thresholds.value = myChildren.value.map((c: any) => {
        const found = (prefs.thresholds || []).find((t: any) => t.student_id === c.student_id)
        return {
          student_id: c.student_id,
          student_name: c.student_name,
          attendance_threshold: found?.attendance_threshold ?? 80,
          grade_threshold: found?.grade_threshold ?? 70,
          wallet_balance_threshold: found?.wallet_balance_threshold ?? 20000
        }
      })
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const handleSave = async () => {
  saving.value = true
  try {
    await updateNotificationPreferences({
      push_enabled: channels.value.push_enabled,
      whatsapp_enabled: channels.value.whatsapp_enabled,
      email_enabled: channels.value.email_enabled,
      thresholds: thresholds.value.map(t => ({
        student_id: t.student_id,
        attendance_threshold: Number(t.attendance_threshold),
        grade_threshold: Number(t.grade_threshold),
        wallet_balance_threshold: Number(t.wallet_balance_threshold)
      }))
    })
    toast.success('Pengaturan notifikasi berhasil disimpan.', 'Sukses')
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan pengaturan.', 'Error')
  } finally {
    saving.value = false
  }
}

const resetDefaults = () => {
  channels.value = { push_enabled: true, whatsapp_enabled: true, email_enabled: false }
  thresholds.value.forEach(t => {
    t.attendance_threshold = 80
    t.grade_threshold = 70
    t.wallet_balance_threshold = 20000
  })
  toast.info('Nilai telah direset ke default. Klik simpan untuk menerapkan.', 'Info')
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
            <Bell class="text-violet-600" :size="24" />
            Pengaturan Notifikasi & Ambang Batas
          </h2>
          <p class="text-xs text-slate-500">Pilih channel notifikasi dan tentukan batas peringatan otomatis</p>
        </div>
      </div>

      <div class="flex gap-2">
        <BaseButton variant="outline" size="sm" @click="resetDefaults">Reset Default</BaseButton>
        <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white" :disabled="saving" @click="handleSave">
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </BaseButton>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Channel Preferences -->
      <BaseCard stripe class="border-t-4 border-t-violet-600">
        <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-base mb-4 flex items-center gap-2">
          <Sliders :size="18" class="text-violet-600" />
          Kanal Notifikasi
        </h3>

        <div class="space-y-4 text-xs divide-y divide-slate-100 dark:divide-zinc-800">
          <div class="flex items-center justify-between pt-2">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 rounded-lg">
                <MessageCircle :size="18" />
              </div>
              <div>
                <p class="font-bold text-slate-900 dark:text-zinc-100 text-sm">Notifikasi WhatsApp</p>
                <p class="text-slate-400 text-[10px]">Pemberitahuan absensi langsung, rekap nilai & tagihan</p>
              </div>
            </div>
            <input type="checkbox" v-model="channels.whatsapp_enabled" class="w-5 h-5 accent-violet-600 cursor-pointer" />
          </div>

          <div class="flex items-center justify-between pt-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 rounded-lg">
                <Smartphone :size="18" />
              </div>
              <div>
                <p class="font-bold text-slate-900 dark:text-zinc-100 text-sm">Push Notification (Aplikasi / PWA)</p>
                <p class="text-slate-400 text-[10px]">Pop-up instan di handphone saat ada pembaruan status</p>
              </div>
            </div>
            <input type="checkbox" v-model="channels.push_enabled" class="w-5 h-5 accent-violet-600 cursor-pointer" />
          </div>

          <div class="flex items-center justify-between pt-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 rounded-lg">
                <Mail :size="18" />
              </div>
              <div>
                <p class="font-bold text-slate-900 dark:text-zinc-100 text-sm">Laporan Email Berkala</p>
                <p class="text-slate-400 text-[10px]">Kirim rekap rapor dan kwitansi tagihan ke email</p>
              </div>
            </div>
            <input type="checkbox" v-model="channels.email_enabled" class="w-5 h-5 accent-violet-600 cursor-pointer" />
          </div>
        </div>
      </BaseCard>

      <!-- Alert Thresholds per Child -->
      <BaseCard v-for="t in thresholds" :key="t.student_id">
        <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-sm mb-4">
          Batas Peringatan Otomatis &bull; {{ t.student_name }}
        </h4>

        <div class="space-y-5 text-xs">
          <!-- Attendance Threshold -->
          <div>
            <div class="flex justify-between font-bold mb-1.5">
              <span class="text-slate-700 dark:text-zinc-300">Peringatan Kehadiran Minimal</span>
              <span class="text-violet-600">{{ t.attendance_threshold }}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              v-model.number="t.attendance_threshold"
              class="w-full accent-violet-600 cursor-pointer"
            />
            <p class="text-[10px] text-slate-400 mt-1">Kirim peringatan jika kehadiran ananda turun di bawah angka ini.</p>
          </div>

          <!-- Grade Threshold -->
          <div>
            <div class="flex justify-between font-bold mb-1.5">
              <span class="text-slate-700 dark:text-zinc-300">Peringatan Nilai Minimal</span>
              <span class="text-violet-600">{{ t.grade_threshold }}</span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              v-model.number="t.grade_threshold"
              class="w-full accent-violet-600 cursor-pointer"
            />
            <p class="text-[10px] text-slate-400 mt-1">Kirim peringatan saat nilai ujian atau tugas berada di bawah standar.</p>
          </div>

          <!-- Wallet Balance Threshold -->
          <div>
            <div class="flex justify-between font-bold mb-1.5">
              <span class="text-slate-700 dark:text-zinc-300">Peringatan Saldo Kantin Rendah</span>
              <span class="text-violet-600">Rp {{ Number(t.wallet_balance_threshold).toLocaleString('id-ID') }}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="50000"
              step="5000"
              v-model.number="t.wallet_balance_threshold"
              class="w-full accent-violet-600 cursor-pointer"
            />
            <p class="text-[10px] text-slate-400 mt-1">Kirim notifikasi untuk segera isi ulang saldo dompet kantin anak.</p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
