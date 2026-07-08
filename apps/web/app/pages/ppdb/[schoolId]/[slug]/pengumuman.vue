<script setup lang="ts">
import { useRoute } from 'vue-router'
import { GraduationCap, Search, FileText, CheckCircle2, AlertCircle, ArrowLeft, ClipboardList } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseInput } from '@eduraport/ui'
import { usePpdb } from '../../../../composables/usePpdb'

definePageMeta({
  layout: false
})

const route = useRoute()
const schoolId = route.params.schoolId as string
const slug = route.params.slug as string

const { fetchPublicAnnouncement } = usePpdb()

const loading = ref(true)
const announcementData = ref<any>(null)
const searchQuery = ref('')

onMounted(async () => {
  try {
    loading.value = true
    const res = await fetchPublicAnnouncement(schoolId, slug)
    if (res.success) {
      announcementData.value = res.data
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

const filteredAcceptedList = computed(() => {
  if (!announcementData.value?.accepted_list) return []
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return announcementData.value.accepted_list
  return announcementData.value.accepted_list.filter((student: any) => 
    student.full_name.toLowerCase().includes(query) ||
    student.registration_number.toLowerCase().includes(query)
  )
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto space-y-6">
      
      <!-- Back Link -->
      <div>
        <NuxtLink 
          :to="`/ppdb/${schoolId}/${slug}`"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-150 transition-colors"
        >
          <ArrowLeft :size="14" />
          <span>Kembali ke Halaman Pendaftaran</span>
        </NuxtLink>
      </div>

      <!-- Header Card -->
      <div class="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 opacity-10">
          <GraduationCap :size="160" />
        </div>
        <div class="relative z-10 flex flex-col gap-2">
          <span class="bg-white/20 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider self-start">
            Hasil Seleksi
          </span>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight">Pengumuman Kelulusan PPDB</h1>
          <p class="text-xs sm:text-sm text-violet-100 font-medium">Pengumuman resmi penerimaan calon siswa baru sekolah.</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <div class="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-xs text-slate-400 font-medium">Memuat data pengumuman...</p>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        
        <!-- Case: No published announcement -->
        <div v-if="!announcementData || !announcementData.announcement" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-8 text-center shadow-sm">
          <AlertCircle class="mx-auto text-amber-500 mb-4" :size="48" />
          <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-200">Belum Ada Pengumuman Diterbitkan</h3>
          <p class="text-xs text-slate-400 dark:text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
            Panitia penerimaan belum menerbitkan pengumuman hasil kelulusan seleksi untuk gelombang ini. Silakan cek berkala halaman ini atau pantau status pendaftaran mandiri Anda.
          </p>
          <div class="mt-6 flex justify-center gap-3">
            <BaseButton variant="outline" class="py-2.5 px-5 text-xs font-bold" @click="$router.push('/ppdb/status')">
              Cek Status Pendaftaran Anda
            </BaseButton>
          </div>
        </div>

        <!-- Case: Has published announcement -->
        <div v-else class="space-y-6">
          <!-- Announcement body details -->
          <BaseCard class="p-6 sm:p-8 space-y-4">
            <h2 class="text-lg font-black text-slate-800 dark:text-zinc-150">{{ announcementData.announcement.title }}</h2>
            <div class="text-slate-500 dark:text-zinc-400 text-xs leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-zinc-850 pt-4">
              {{ announcementData.announcement.content }}
            </div>
          </BaseCard>

          <!-- Accepted Students Section -->
          <div v-if="announcementData.announcement.show_accepted_list" class="space-y-4">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <ClipboardList class="text-violet-600" :size="16" />
                  <span>Daftar Calon Siswa yang Diterima</span>
                </h3>
                <p class="text-[10px] text-slate-400 mt-0.5">Total Diterima: {{ announcementData.accepted_list?.length || 0 }} siswa</p>
              </div>
              
              <!-- Search Bar -->
              <div class="relative w-full sm:w-64">
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Cari nama atau nomor..." 
                  class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-violet-600 shadow-sm"
                />
                <Search class="absolute left-2.5 top-2.5 text-slate-400" :size="12" />
              </div>
            </div>

            <!-- Empty list state -->
            <div v-if="filteredAcceptedList.length === 0" class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-8 text-center shadow-sm">
              <p class="text-xs text-slate-400 font-semibold">Tidak ada siswa yang cocok dengan pencarian.</p>
            </div>

            <!-- Accepted Students grid list -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                v-for="(student, idx) in filteredAcceptedList" 
                :key="student.registration_number"
                class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-4 rounded-xl shadow-sm flex items-center gap-3 hover:border-violet-600/30 transition-colors"
              >
                <div class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {{ idx + 1 }}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-slate-800 dark:text-zinc-200 truncate">{{ student.full_name }}</div>
                  <div class="text-[10px] text-slate-400 font-mono tracking-wider font-semibold mt-0.5">{{ student.registration_number }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Informational/Instructions card -->
          <BaseCard class="p-6 bg-emerald-500/5 border border-emerald-500/10 text-emerald-800 dark:text-emerald-400/90 rounded-2xl space-y-3">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="text-emerald-600 shrink-0" :size="20" />
              <h4 class="text-xs font-bold uppercase tracking-wide">Langkah Selanjutnya Bagi Calon Siswa Diterima:</h4>
            </div>
            <ul class="list-decimal list-inside text-xs space-y-1.5 leading-relaxed pl-1 font-medium">
              <li>Buka menu <strong>"Cek Status Pendaftaran"</strong> dengan menekan tombol di bawah.</li>
              <li>Masukkan nomor pendaftaran Anda untuk masuk ke dashboard pendaftar Anda.</li>
              <li>Unggah dokumen administrasi pasca penerimaan (seperti <strong>Akte Kelahiran, Kartu Keluarga, Ijazah/SKL</strong>) yang diwajibkan oleh pihak sekolah pada bagian unggahan dokumen.</li>
              <li>Tunggu verifikasi dokumen oleh admin sekolah selesai.</li>
            </ul>
          </BaseCard>

          <div class="flex justify-center gap-3">
            <BaseButton variant="primary" class="py-2.5 px-6 text-xs font-bold shadow-lg" @click="$router.push('/ppdb/status')">
              Cek & Lengkapi Dokumen Pendaftaran
            </BaseButton>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
