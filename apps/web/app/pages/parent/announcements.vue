<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Bell, ArrowLeft, CheckCircle2, ChevronRight, School, Users } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal } from '@eduraport/ui'
import { useParent } from '../../composables/useParent'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) return navigateTo('/login')
    }
  ]
})

const { fetchAnnouncements, markAnnouncementRead } = useParent()

const loading = ref(true)
const announcements = ref<any[]>([])
const selectedAnnouncement = ref<any>(null)
const isDetailOpen = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchAnnouncements(1, 30)
    announcements.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const openDetail = async (item: any) => {
  selectedAnnouncement.value = item
  isDetailOpen.value = true
  if (!item.is_read) {
    try {
      await markAnnouncementRead(item.id)
      item.is_read = true
    } catch (e) {
      console.error(e)
    }
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <div class="flex items-center gap-3">
      <NuxtLink to="/" class="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-violet-600 transition">
        <ArrowLeft :size="18" />
      </NuxtLink>
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Bell class="text-amber-500" :size="24" />
          Pengumuman Sekolah
        </h2>
        <p class="text-xs text-slate-500">Informasi dan surat edaran resmi dari pihak sekolah</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-3">
      <div v-if="announcements.length > 0" class="space-y-3">
        <BaseCard
          v-for="item in announcements"
          :key="item.id"
          class="cursor-pointer hover:border-violet-500 hover:shadow-md transition-all group"
          @click="openDetail(item)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center gap-2">
                <span
                  v-if="!item.is_read"
                  class="w-2 h-2 rounded-full bg-violet-600 animate-ping"
                ></span>
                <span
                  class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  :class="item.target_type === 'school' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'"
                >
                  {{ item.target_type === 'school' ? 'Sekolah' : 'Kelas' }}
                </span>
                <span class="text-[10px] text-slate-400">
                  {{ new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                </span>
              </div>

              <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-sm group-hover:text-violet-600 transition">
                {{ item.title }}
              </h3>
              <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {{ item.content }}
              </p>
            </div>

            <ChevronRight class="text-slate-400 group-hover:text-violet-600 transition shrink-0" :size="20" />
          </div>
        </BaseCard>
      </div>

      <div v-else class="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
        <CheckCircle2 class="mx-auto text-slate-400 mb-2" :size="36" />
        <p class="text-sm font-bold text-slate-800 dark:text-zinc-200">Tidak ada pengumuman terbaru</p>
        <p class="text-xs text-slate-400 mt-1">Surat edaran atau pengumuman dari sekolah akan tampil di sini.</p>
      </div>
    </div>

    <!-- Announcement Detail Modal -->
    <BaseModal v-model="isDetailOpen" :title="selectedAnnouncement?.title || 'Detail Pengumuman'">
      <div v-if="selectedAnnouncement" class="space-y-4 text-xs">
        <div class="flex items-center gap-2 text-[10px] text-slate-400 pb-2 border-b border-slate-100 dark:border-zinc-800">
          <School :size="14" />
          <span>{{ selectedAnnouncement.school_name || 'Unit Sekolah' }}</span>
          <span>&bull;</span>
          <span>{{ new Date(selectedAnnouncement.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' }) }}</span>
        </div>

        <div class="prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
          {{ selectedAnnouncement.content }}
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
          <BaseButton size="sm" @click="isDetailOpen = false">Tutup</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
