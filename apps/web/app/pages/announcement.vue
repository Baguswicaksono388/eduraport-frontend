<script setup lang="ts">
import { 
  Bell, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar, 
  Users, 
  School, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useAnnouncement } from '../composables/useAnnouncement'
import { useClass } from '../composables/useClass'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      const authCookie = useCookie('auth_cookie')
      if (!token.value && !authCookie.value) {
        return navigateTo('/login')
      }
    }
  ]
})

const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext } = useSchoolContext()
const { classes, fetchClasses } = useClass()
const { 
  announcements, 
  announcementsMeta, 
  loading, 
  fetchSchoolAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} = useAnnouncement()
const { user: currentUser } = useAuth()
const toast = useToast()

// Filter states
const searchQuery = ref('')
const selectedTargetType = ref('all') // 'all', 'school', 'class'
const selectedClassFilter = ref('')
const currentPage = ref(1)

// Modal states
const showCreateModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const submitting = ref(false)

const showDeleteModal = ref(false)
const deletingItem = ref<any | null>(null)
const deleting = ref(false)

// Form state
const form = ref({
  title: '',
  content: '',
  target_type: 'school' as 'school' | 'class',
  target_class_id: ''
})

const canManageAll = computed(() => {
  return ['super_admin', 'principal', 'tu'].includes(currentUser.value?.role)
})

const canModify = (item: any) => {
  if (canManageAll.value) return true
  return item.created_by === currentUser.value?.id
}

const loadAnnouncements = async () => {
  if (!selectedSchoolId.value) return
  try {
    await fetchSchoolAnnouncements(selectedSchoolId.value, {
      target_type: selectedTargetType.value,
      target_class_id: selectedTargetType.value === 'class' ? selectedClassFilter.value : undefined,
      search: searchQuery.value.trim() || undefined,
      page: currentPage.value,
      limit: 10
    })
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat daftar pengumuman.', 'Error')
  }
}

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    selectedSchoolId.value = schoolId
    await Promise.all([
      fetchClasses(schoolId),
      loadAnnouncements()
    ])
  }
})

watch([selectedSchoolId, selectedTargetType, selectedClassFilter], async () => {
  currentPage.value = 1
  if (selectedSchoolId.value) {
    await fetchClasses(selectedSchoolId.value)
    await loadAnnouncements()
  }
})

// Debounced search
let searchTimeout: any = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadAnnouncements()
  }, 350)
})

const changePage = async (page: number) => {
  if (page < 1 || page > announcementsMeta.value.total_pages) return
  currentPage.value = page
  await loadAnnouncements()
}

// Modal Form Actions
const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = {
    title: '',
    content: '',
    target_type: 'school',
    target_class_id: classes.value.length > 0 ? classes.value[0].id : ''
  }
  showCreateModal.value = true
}

const openEditModal = (item: any) => {
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    title: item.title,
    content: item.content,
    target_type: item.target_type === 'class' ? 'class' : 'school',
    target_class_id: item.target_class_id || (classes.value.length > 0 ? classes.value[0].id : '')
  }
  showCreateModal.value = true
}

const handleSubmit = async () => {
  if (!form.value.title.trim()) {
    toast.error('Judul pengumuman tidak boleh kosong.', 'Peringatan')
    return
  }
  if (!form.value.content.trim()) {
    toast.error('Isi pengumuman tidak boleh kosong.', 'Peringatan')
    return
  }
  if (form.value.target_type === 'class' && !form.value.target_class_id) {
    toast.error('Silakan pilih kelas sasaran.', 'Peringatan')
    return
  }

  submitting.value = true
  try {
    const payload = {
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      target_type: form.value.target_type,
      target_class_id: form.value.target_type === 'class' ? form.value.target_class_id : null
    }

    if (isEditing.value && editingId.value) {
      await updateAnnouncement(selectedSchoolId.value, editingId.value, payload)
      toast.success('Pengumuman berhasil diperbarui.', 'Sukses')
    } else {
      await createAnnouncement(selectedSchoolId.value, payload)
      toast.success('Pengumuman resmi berhasil diterbitkan.', 'Sukses')
    }

    showCreateModal.value = false
    await loadAnnouncements()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan pengumuman.', 'Error')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (item: any) => {
  deletingItem.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!deletingItem.value || !selectedSchoolId.value) return
  deleting.value = true
  try {
    await deleteAnnouncement(selectedSchoolId.value, deletingItem.value.id)
    toast.success('Pengumuman berhasil dihapus.', 'Sukses')
    showDeleteModal.value = false
    deletingItem.value = null
    await loadAnnouncements()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menghapus pengumuman.', 'Error')
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Summary stats
const totalReadsCount = computed(() => {
  return announcements.value.reduce((acc, curr) => acc + (Number(curr.read_count) || 0), 0)
})
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-zinc-800/80">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-500 text-white rounded-xl shadow-lg shadow-violet-500/20">
          <Bell :size="24" />
        </div>
        <div>
          <h2 class="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            Pengumuman Sekolah
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
              {{ announcementsMeta.total }} Rilis
            </span>
          </h2>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Publikasikan siaran resmi sekolah kepada seluruh wali murid & siswa atau per kelas
          </p>
        </div>
      </div>

      <BaseButton 
        variant="primary" 
        size="sm" 
        class="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/15 flex items-center gap-1.5 self-start sm:self-auto"
        @click="openCreateModal"
      >
        <Plus :size="16" /> Buat Pengumuman Baru
      </BaseButton>
    </div>

    <!-- School Context Selector (if unlocked) -->
    <div v-if="!isSchoolLocked" class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm">
      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-violet-600">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-violet-600">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>
    </div>

    <!-- Overview Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800 shadow-sm flex items-center gap-3">
        <div class="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-lg">
          <MessageSquare :size="20" />
        </div>
        <div>
          <p class="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Total Pengumuman</p>
          <p class="text-xl font-bold text-slate-900 dark:text-zinc-100">{{ announcementsMeta.total }}</p>
        </div>
      </div>

      <div class="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800 shadow-sm flex items-center gap-3">
        <div class="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <Eye :size="20" />
        </div>
        <div>
          <p class="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Total Terbaca Wali</p>
          <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{ totalReadsCount }} <span class="text-xs font-normal text-slate-400">kali</span></p>
        </div>
      </div>

      <div class="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800 shadow-sm flex items-center gap-3">
        <div class="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
          <School :size="20" />
        </div>
        <div>
          <p class="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Jangkauan Penerima</p>
          <p class="text-sm font-bold text-slate-800 dark:text-zinc-200 mt-1">Seluruh Ortu & Per Kelas</p>
        </div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-2.5 text-slate-400" :size="16" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari judul atau isi pengumuman..."
          class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-medium outline-none focus:border-violet-600 text-slate-800 dark:text-zinc-200"
        />
      </div>

      <!-- Target Filter Buttons -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg text-xs font-semibold">
          <button 
            @click="selectedTargetType = 'all'" 
            class="px-3 py-1 rounded-md transition"
            :class="selectedTargetType === 'all' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
          >
            Semua Sasaran
          </button>
          <button 
            @click="selectedTargetType = 'school'" 
            class="px-3 py-1 rounded-md transition"
            :class="selectedTargetType === 'school' ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
          >
            Seluruh Sekolah
          </button>
          <button 
            @click="selectedTargetType = 'class'" 
            class="px-3 py-1 rounded-md transition"
            :class="selectedTargetType === 'class' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'"
          >
            Per Kelas
          </button>
        </div>

        <!-- Class Filter Dropdown (visible if target is class) -->
        <select 
          v-if="selectedTargetType === 'class'"
          v-model="selectedClassFilter" 
          class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-violet-600"
        >
          <option value="">Semua Kelas</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
        </select>
      </div>
    </div>

    <!-- Announcement Feed / Cards -->
    <div v-if="loading" class="py-20 text-center text-slate-400">
      <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mx-auto mb-2"></div>
      <p class="text-xs font-semibold">Memuat data pengumuman...</p>
    </div>

    <div v-else-if="announcements.length === 0" class="py-20 text-center bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-8">
      <Bell class="mx-auto text-slate-300 dark:text-zinc-700 mb-3" :size="40" />
      <h3 class="text-sm font-bold text-slate-700 dark:text-zinc-300">Belum Ada Pengumuman</h3>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
        Belum ada pengumuman yang diterbitkan untuk filter ini. Klik tombol di bawah untuk membuat pengumuman pertama Anda.
      </p>
      <BaseButton size="sm" class="mt-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs" @click="openCreateModal">
        <Plus :size="15" /> Terbitkan Pengumuman
      </BaseButton>
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="item in announcements" 
        :key="item.id"
        class="bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:border-violet-300 dark:hover:border-violet-800/50 transition-all duration-200 group"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="space-y-1.5 flex-1">
            <!-- Header Badges -->
            <div class="flex flex-wrap items-center gap-2">
              <span 
                v-if="item.target_type === 'school'" 
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-900/50"
              >
                <School :size="12" /> Seluruh Sekolah (Semua Wali)
              </span>
              <span 
                v-else 
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50"
              >
                <Users :size="12" /> Target: {{ item.target_class_name || 'Kelas Spesifik' }}
              </span>

              <span class="text-xs text-slate-400 flex items-center gap-1">
                <Clock :size="12" /> {{ formatDate(item.created_at) }}
              </span>
            </div>

            <!-- Title -->
            <h3 class="text-base font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {{ item.title }}
            </h3>

            <!-- Author -->
            <p v-if="item.created_by_name" class="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <UserCheck :size="12" /> Diterbitkan oleh: <span class="font-semibold text-slate-600 dark:text-zinc-400">{{ item.created_by_name }}</span>
            </p>
          </div>

          <!-- Action Buttons (if permitted) -->
          <div v-if="canModify(item)" class="flex items-center gap-1 self-end sm:self-start">
            <button 
              @click="openEditModal(item)" 
              class="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-zinc-800 rounded-lg transition"
              title="Edit Pengumuman"
            >
              <Edit3 :size="15" />
            </button>
            <button 
              @click="confirmDelete(item)" 
              class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-lg transition"
              title="Hapus Pengumuman"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>

        <!-- Content Body -->
        <div class="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
          {{ item.content }}
        </div>

        <!-- Footer / Read Receipt Counter -->
        <div class="mt-4 pt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-zinc-800/60">
          <div class="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
            <Eye :size="13" />
            <span>{{ item.read_count || 0 }} Wali Murid telah membaca</span>
          </div>
          <span class="text-[10px]">ID: {{ item.id.substring(0, 8) }}</span>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="announcementsMeta.total_pages > 1" class="flex items-center justify-between pt-4">
        <p class="text-xs text-slate-400">
          Menampilkan halaman {{ announcementsMeta.page }} dari {{ announcementsMeta.total_pages }}
        </p>
        <div class="flex items-center gap-1">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage <= 1"
            class="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
          >
            <ChevronLeft :size="14" />
          </button>
          <span class="text-xs font-bold px-3">{{ currentPage }}</span>
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage >= announcementsMeta.total_pages"
            class="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Form Buat / Edit Pengumuman -->
    <BaseModal 
      :show="showCreateModal" 
      :title="isEditing ? 'Ubah Pengumuman Sekolah' : 'Buat Pengumuman Sekolah Baru'" 
      @close="showCreateModal = false"
    >
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Judul Pengumuman</label>
          <input 
            v-model="form.title" 
            type="text" 
            placeholder="Contoh: Jadwal Ujian Akhir Semester & Pembagian Rapor"
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-semibold text-xs outline-none focus:border-violet-600 text-slate-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Sasaran Penerima</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="form.target_type = 'school'"
              class="p-2.5 rounded-lg border text-left font-semibold transition flex items-center gap-2"
              :class="form.target_type === 'school' 
                ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' 
                : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'"
            >
              <School :size="15" /> Seluruh Sekolah (Semua Wali)
            </button>
            <button
              type="button"
              @click="form.target_type = 'class'"
              class="p-2.5 rounded-lg border text-left font-semibold transition flex items-center gap-2"
              :class="form.target_type === 'class' 
                ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' 
                : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'"
            >
              <Users :size="15" /> Kelas Tertentu
            </button>
          </div>
        </div>

        <div v-if="form.target_type === 'class'">
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Pilih Kelas Sasaran</label>
          <select 
            v-model="form.target_class_id" 
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-semibold text-xs outline-none focus:border-violet-600 text-slate-900 dark:text-zinc-100"
          >
            <option value="" disabled>Pilih Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Isi Lengkap Pengumuman</label>
          <textarea 
            v-model="form.content" 
            rows="6"
            placeholder="Tuliskan isi pengumuman atau instruksi secara jelas kepada orang tua / siswa..."
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-medium text-xs outline-none focus:border-violet-600 text-slate-900 dark:text-zinc-100"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" size="sm" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton 
            size="sm" 
            class="bg-violet-600 hover:bg-violet-700 text-white font-bold" 
            :disabled="submitting" 
            @click="handleSubmit"
          >
            {{ submitting ? 'Menyimpan...' : (isEditing ? 'Perbarui Pengumuman' : 'Terbitkan Sekarang') }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal Konfirmasi Hapus -->
    <BaseModal 
      :show="showDeleteModal" 
      title="Hapus Pengumuman Sekolah" 
      @close="showDeleteModal = false"
    >
      <div class="space-y-4 text-xs">
        <p class="text-slate-600 dark:text-zinc-400">
          Apakah Anda yakin ingin menghapus pengumuman <strong>"{{ deletingItem?.title }}"</strong>? Tindakan ini tidak dapat dibatalkan dan pengumuman akan hilang dari portal wali murid.
        </p>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" size="sm" @click="showDeleteModal = false">Batal</BaseButton>
          <BaseButton 
            size="sm" 
            class="bg-rose-600 hover:bg-rose-700 text-white font-bold" 
            :disabled="deleting" 
            @click="handleDelete"
          >
            {{ deleting ? 'Menghapus...' : 'Hapus Pengumuman' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
