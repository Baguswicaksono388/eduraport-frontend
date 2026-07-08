<script setup lang="ts">
import { 
  Layers, Plus, Trash2, Edit2, Settings, UserPlus, Clipboard, 
  CheckSquare, Check, X, ArrowUp, ArrowDown, ChevronRight, HelpCircle, Save, Link, Copy, Megaphone, FileText, Search, TrendingUp
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput, BaseDateInput } from '@eduraport/ui'
import { useSchool } from '../../composables/useSchool'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { usePpdb } from '../../composables/usePpdb'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) {
        return navigateTo('/login')
      }
    }
  ]
})

const { foundations, schools, fetchFoundations, fetchSchools } = useSchool()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { 
  ppdbBatches, fetchPpdbBatches, createPpdbBatch, updatePpdbBatch, deletePpdbBatch,
  fetchPpdbBatchFields, savePpdbBatchFields,
  fetchApplicants, fetchApplicantDetail, updateApplicantStatus, verifyPaymentProof, fetchPaymentProof,
  fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  fetchAcceptedDocumentsAdmin, verifyAcceptedDocumentAdmin,
  convertToStudentAdmin, bulkConvertToStudentsAdmin, fetchBatchStatsAdmin
} = usePpdb()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const activeTab = ref('batches') // 'batches' | 'applicants' | 'admissions' | 'announcements' | 'stats'

const selectedBatchId = ref('')
const selectedStatusFilter = ref('')
const applicants = ref<any[]>([])
const applicantsLoading = ref(false)
const showApplicantDetailModal = ref(false)
const selectedApplicant = ref<any>(null)
const paymentRejectionReason = ref('')
const statusRejectionReason = ref('')
const statusAdminNotes = ref('')
const statusUpdateVal = ref('')
const selectedApplicantIds = ref<string[]>([])

// Announcements states
const announcements = ref<any[]>([])
const announcementsLoading = ref(false)
const showAnnouncementModal = ref(false)
const editingAnnouncementId = ref('')
const announcementForm = reactive({
  title: '',
  content: '',
  show_accepted_list: false,
  status: 'draft'
})

// Search & Pagination states for Tab 2 (Daftar Pendaftar)
const applicantSearchQuery = ref('')
const applicantCurrentPage = ref(1)
const applicantPageSize = ref(10)

const filteredApplicants = computed(() => {
  const query = applicantSearchQuery.value.trim().toLowerCase()
  if (!query) return applicants.value
  return applicants.value.filter(app => 
    (app.full_name && app.full_name.toLowerCase().includes(query)) ||
    (app.registration_number && app.registration_number.toLowerCase().includes(query)) ||
    (app.parent_name && app.parent_name.toLowerCase().includes(query))
  )
})

const totalApplicantPages = computed(() => {
  return Math.ceil(filteredApplicants.value.length / applicantPageSize.value) || 1
})

const paginatedApplicants = computed(() => {
  const start = (applicantCurrentPage.value - 1) * applicantPageSize.value
  const end = start + applicantPageSize.value
  return filteredApplicants.value.slice(start, end)
})

// Document Review states
const docRejectionReasonMap = reactive<Record<string, string>>({})

// Batch Modal states
const showCreateBatchModal = ref(false)
const showEditBatchModal = ref(false)
const editingBatchId = ref('')

const batchForm = reactive({
  name: '',
  academic_year_id: '',
  level: 'TK',
  registration_start: '',
  registration_end: '',
  announcement_date: '',
  quota: 30,
  registration_fee: 0,
  slug: '',
  description: '',
  status: 'draft',
  is_public: false
})

const editBatchForm = reactive({
  name: '',
  academic_year_id: '',
  level: 'TK',
  registration_start: '',
  registration_end: '',
  announcement_date: '',
  quota: 30,
  registration_fee: 0,
  slug: '',
  description: '',
  status: 'draft',
  is_public: false
})

// Form Fields Builder states
const showFieldsBuilderModal = ref(false)
const selectedBatchForFields = ref<any>(null)
const customFields = ref<any[]>([])

onMounted(async () => {
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await fetchSchools(selectedFoundationId.value)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
      await fetchAcademicYears(selectedSchoolId.value)
      await fetchPpdbBatches(selectedSchoolId.value)
    }
  }
})

watch(selectedFoundationId, async (newVal) => {
  if (newVal) {
    await fetchSchools(newVal)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
    } else {
      selectedSchoolId.value = ''
      ppdbBatches.value = []
    }
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchAcademicYears(newVal)
    await fetchPpdbBatches(newVal)
  } else {
    ppdbBatches.value = []
  }
})

watch(ppdbBatches, (newBatches) => {
  if (newBatches && newBatches.length > 0) {
    if (!selectedBatchId.value || !newBatches.find(b => b.id === selectedBatchId.value)) {
      selectedBatchId.value = newBatches[0].id
    }
  } else {
    selectedBatchId.value = ''
  }
})

// Stats Dashboard states
const statsData = ref<any>(null)
const statsLoading = ref(false)

const loadBatchStats = async () => {
  if (!selectedSchoolId.value || !selectedBatchId.value) return
  try {
    statsLoading.value = true
    const res = await fetchBatchStatsAdmin(selectedSchoolId.value, selectedBatchId.value)
    if (res.success) {
      statsData.value = res.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    statsLoading.value = false
  }
}

// Student Conversion states and methods
const convertingAppId = ref('')
const handleConvertStudent = async (applicantId: string) => {
  if (!selectedSchoolId.value || !selectedBatchId.value) return
  if (!confirm('Apakah Anda yakin ingin mengonversi pendaftar ini menjadi siswa aktif? Tindakan ini akan membuat user dan parent record baru.')) return
  try {
    convertingAppId.value = applicantId
    const res = await convertToStudentAdmin(selectedSchoolId.value, selectedBatchId.value, applicantId)
    if (res.success) {
      alert('Calon siswa berhasil dikonversi menjadi siswa aktif!')
      await openApplicantDetail({ id: applicantId })
      await loadApplicants()
      if (activeTab.value === 'stats') {
        await loadBatchStats()
      }
    } else {
      alert(res.message || 'Gagal mengonversi pendaftar.')
    }
  } catch (e) {
    console.error(e)
  } finally {
    convertingAppId.value = ''
  }
}

const bulkConverting = ref(false)
const handleBulkConvert = async () => {
  if (!selectedSchoolId.value || !selectedBatchId.value || selectedApplicantIds.value.length === 0) return
  if (!confirm(`Apakah Anda yakin ingin mengonversi secara massal ${selectedApplicantIds.value.length} pendaftar menjadi siswa aktif?`)) return
  try {
    bulkConverting.value = true
    const res = await bulkConvertToStudentsAdmin(selectedSchoolId.value, selectedBatchId.value, selectedApplicantIds.value)
    if (res.success) {
      alert(`${res.success_count} calon siswa berhasil dikonversi menjadi siswa aktif!`);
      selectedApplicantIds.value = []
      await loadApplicants()
      if (activeTab.value === 'stats') {
        await loadBatchStats()
      }
    } else {
      alert(res.message || 'Gagal melakukan konversi massal.')
    }
  } catch (e) {
    console.error(e)
  } finally {
    bulkConverting.value = false
  }
}

watch([selectedBatchId, selectedStatusFilter], () => {
  applicantCurrentPage.value = 1
  if (['applicants', 'admissions'].includes(activeTab.value)) {
    loadApplicants()
  } else if (activeTab.value === 'announcements') {
    loadAnnouncements()
  } else if (activeTab.value === 'stats') {
    loadBatchStats()
  }
})

watch(activeTab, (newTab) => {
  applicantCurrentPage.value = 1
  if (['applicants', 'admissions'].includes(newTab)) {
    loadApplicants()
  } else if (newTab === 'announcements') {
    loadAnnouncements()
  } else if (newTab === 'stats') {
    loadBatchStats()
  }
})

watch(applicantSearchQuery, () => {
  applicantCurrentPage.value = 1
})

const loadAnnouncements = async () => {
  if (!selectedSchoolId.value || !selectedBatchId.value) return
  try {
    announcementsLoading.value = true
    const res = await fetchAnnouncements(selectedSchoolId.value, selectedBatchId.value)
    if (res.success) {
      announcements.value = res.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    announcementsLoading.value = false
  }
}

const openCreateAnnouncement = () => {
  editingAnnouncementId.value = ''
  announcementForm.title = ''
  announcementForm.content = ''
  announcementForm.show_accepted_list = false
  announcementForm.status = 'draft'
  showAnnouncementModal.value = true
}

const openEditAnnouncement = (ann: any) => {
  editingAnnouncementId.value = ann.id
  announcementForm.title = ann.title
  announcementForm.content = ann.content
  announcementForm.show_accepted_list = ann.show_accepted_list
  announcementForm.status = ann.status
  showAnnouncementModal.value = true
}

const handleSaveAnnouncement = async () => {
  if (!selectedSchoolId.value || !selectedBatchId.value) return
  try {
    let res;
    if (editingAnnouncementId.value) {
      res = await updateAnnouncement(selectedSchoolId.value, selectedBatchId.value, editingAnnouncementId.value, announcementForm)
    } else {
      res = await createAnnouncement(selectedSchoolId.value, selectedBatchId.value, announcementForm)
    }
    if (res.success) {
      alert(editingAnnouncementId.value ? 'Pengumuman berhasil diperbarui.' : 'Pengumuman berhasil dibuat.')
      showAnnouncementModal.value = false
      await loadAnnouncements()
    } else {
      alert(res.message || 'Gagal menyimpan pengumuman.')
    }
  } catch (e) {
    console.error(e)
  }
}

const handleDeleteAnnouncement = async (annId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return
  try {
    const res = await deleteAnnouncement(selectedSchoolId.value, selectedBatchId.value, annId)
    if (res.success) {
      alert('Pengumuman berhasil dihapus.')
      await loadAnnouncements()
    }
  } catch (e) {
    console.error(e)
  }
}

// In-Modal Document Review
const handleVerifyDocModal = async (applicantId: string, docId: string, status: string) => {
  const reason = docRejectionReasonMap[docId] || ''
  if (status === 'rejected' && !reason.trim()) {
    alert('Alasan penolakan dokumen wajib diisi.')
    return
  }
  if (status === 'verified' && !confirm('Apakah Anda yakin menyetujui dokumen ini?')) {
    return
  }
  try {
    const res = await verifyAcceptedDocumentAdmin(
      selectedSchoolId.value, 
      selectedBatchId.value, 
      applicantId, 
      docId, 
      { status, rejection_reason: status === 'rejected' ? reason : undefined }
    )
    if (res.success) {
      alert(status === 'verified' ? 'Dokumen disetujui.' : 'Dokumen ditolak.')
      delete docRejectionReasonMap[docId]
      // Refresh the applicant details modal to show updated status
      await openApplicantDetail({ id: applicantId })
    } else {
      alert(res.message || 'Gagal mengubah verifikasi dokumen.')
    }
  } catch (e) {
    console.error(e)
  }
}

const loadApplicants = async () => {
  if (!selectedSchoolId.value || !selectedBatchId.value) {
    applicants.value = []
    return
  }
  try {
    applicantsLoading.value = true
    const res = await fetchApplicants(selectedSchoolId.value, selectedBatchId.value, selectedStatusFilter.value || undefined)
    if (res.success) {
      applicants.value = res.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    applicantsLoading.value = false
  }
}

const openApplicantDetail = async (app: any) => {
  selectedApplicant.value = null
  paymentRejectionReason.value = ''
  statusRejectionReason.value = ''
  statusAdminNotes.value = ''
  statusUpdateVal.value = ''
  
  showApplicantDetailModal.value = true
  
  const res = await fetchApplicantDetail(selectedSchoolId.value, selectedBatchId.value, app.id)
  if (res.success) {
    selectedApplicant.value = res.data
    statusUpdateVal.value = res.data.status
    statusAdminNotes.value = res.data.admin_notes || ''
    statusRejectionReason.value = res.data.rejection_reason || ''
  }
}

const viewFullImage = (url: string) => {
  if (!url) return
  if (url.startsWith('data:')) {
    const win = window.open()
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Bukti Transfer</title>
            <style>
              body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            </style>
          </head>
          <body>
            <img src="${url}" />
          </body>
        </html>
      `)
      win.document.close()
    }
  } else {
    window.open(url, '_blank')
  }
}

const handleApprovePayment = async (appId: string, proofId: string) => {
  if (confirm('Apakah Anda yakin ingin menyetujui bukti pembayaran ini?')) {
    const res = await verifyPaymentProof(selectedSchoolId.value, selectedBatchId.value, appId, proofId, { status: 'approved' })
    if (res.success) {
      alert('Bukti pembayaran berhasil disetujui.')
      await openApplicantDetail({ id: appId })
      await loadApplicants()
    } else {
      alert(res.message || 'Gagal menyetujui pembayaran.')
    }
  }
}

const handleRejectPayment = async (appId: string, proofId: string) => {
  if (!paymentRejectionReason.value.trim()) {
    alert('Alasan penolakan pembayaran wajib diisi.')
    return
  }
  const res = await verifyPaymentProof(selectedSchoolId.value, selectedBatchId.value, appId, proofId, { 
    status: 'rejected', 
    rejection_reason: paymentRejectionReason.value 
  })
  if (res.success) {
    alert('Bukti pembayaran berhasil ditolak.')
    await openApplicantDetail({ id: appId })
    await loadApplicants()
  } else {
    alert(res.message || 'Gagal menolak pembayaran.')
  }
}

const handleSaveStatusUpdate = async (appId: string) => {
  const res = await updateApplicantStatus(selectedSchoolId.value, selectedBatchId.value, appId, {
    status: statusUpdateVal.value,
    admin_notes: statusAdminNotes.value,
    rejection_reason: statusUpdateVal.value === 'rejected' ? statusRejectionReason.value : undefined
  })
  if (res.success) {
    alert('Status pendaftar berhasil diperbarui.')
    showApplicantDetailModal.value = false
    await loadApplicants()
  } else {
    alert(res.message || 'Gagal memperbarui status.')
  }
}

const handleBulkStatusChange = async (status: string) => {
  if (selectedApplicantIds.value.length === 0) return
  if (confirm(`Apakah Anda yakin ingin mengubah status ${selectedApplicantIds.value.length} pendaftar terpilih menjadi ${status}?`)) {
    try {
      let successCount = 0
      for (const appId of selectedApplicantIds.value) {
        const res = await updateApplicantStatus(selectedSchoolId.value, selectedBatchId.value, appId, {
          status: status
        })
        if (res.success) successCount++
      }
      alert(`Berhasil memperbarui ${successCount} pendaftar.`);
      selectedApplicantIds.value = []
      await loadApplicants()
    } catch (e) {
      alert('Terjadi kesalahan saat memproses bulk action.')
    }
  }
}

const toggleSelectAllApplicants = () => {
  const reviewingApps = applicants.value.filter(a => a.status === 'reviewing')
  if (selectedApplicantIds.value.length === reviewingApps.length) {
    selectedApplicantIds.value = []
  } else {
    selectedApplicantIds.value = reviewingApps.map(a => a.id)
  }
}

// ==========================================
// BATCH ACTIONS
// ==========================================
const handleCreateBatch = async () => {
  try {
    const data = { ...batchForm }
    // Convert registration_fee to number
    data.registration_fee = Number(data.registration_fee)
    
    const res = await createPpdbBatch(selectedSchoolId.value, data)
    if (res.success) {
      showCreateBatchModal.value = false
      Object.assign(batchForm, {
        name: '',
        academic_year_id: academicYears.value.find(y => y.is_active)?.id || '',
        level: 'TK',
        registration_start: '',
        registration_end: '',
        announcement_date: '',
        quota: 30,
        registration_fee: 0,
        slug: '',
        description: '',
        status: 'draft',
        is_public: false
      })
    }
  } catch (e: any) {
    alert(e?.message || 'Gagal membuat gelombang PPDB')
  }
}

const openEditBatchModal = (batch: any) => {
  editingBatchId.value = batch.id
  Object.assign(editBatchForm, {
    name: batch.name,
    academic_year_id: batch.academic_year_id,
    level: batch.level,
    registration_start: batch.registration_start ? new Date(batch.registration_start).toISOString().split('T')[0] : '',
    registration_end: batch.registration_end ? new Date(batch.registration_end).toISOString().split('T')[0] : '',
    announcement_date: batch.announcement_date ? new Date(batch.announcement_date).toISOString().split('T')[0] : '',
    quota: Number(batch.quota),
    registration_fee: Number(batch.registration_fee || 0),
    slug: batch.slug,
    description: batch.description || '',
    status: batch.status,
    is_public: !!batch.is_public
  })
  showEditBatchModal.value = true
}

const handleUpdateBatch = async () => {
  try {
    const data = { ...editBatchForm }
    data.registration_fee = Number(data.registration_fee)
    
    const res = await updatePpdbBatch(selectedSchoolId.value, editingBatchId.value, data)
    if (res.success) {
      showEditBatchModal.value = false
    }
  } catch (e: any) {
    alert(e?.message || 'Gagal memperbarui gelombang PPDB')
  }
}

const handleDeleteBatch = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus gelombang PPDB ini? Semua data pendaftar yang berkaitan akan ikut dihapus.')) {
    try {
      await deletePpdbBatch(selectedSchoolId.value, id)
    } catch (e: any) {
      alert(e?.message || 'Gagal menghapus gelombang PPDB')
    }
  }
}

// ==========================================
// FORM FIELDS BUILDER
// ==========================================
const openFieldsBuilder = async (batch: any) => {
  selectedBatchForFields.value = batch
  customFields.value = []
  
  const res = await fetchPpdbBatchFields(selectedSchoolId.value, batch.id)
  if (res.success) {
    customFields.value = res.data.map((f: any) => {
      // Parse options if it's a string
      let parsedOptions = f.options
      if (typeof f.options === 'string') {
        try {
          parsedOptions = JSON.parse(f.options)
        } catch {
          parsedOptions = []
        }
      }
      return {
        ...f,
        options: parsedOptions || []
      }
    })
  }
  showFieldsBuilderModal.value = true
}

const addCustomField = () => {
  customFields.value.push({
    field_key: 'custom_field_' + Math.random().toString(36).substring(2, 7),
    label: 'Pertanyaan Baru',
    field_type: 'text',
    options: [],
    is_required: false,
    placeholder: '',
    help_text: ''
  })
}

const removeCustomField = (index: number) => {
  customFields.value.splice(index, 1)
}

const moveField = (index: number, direction: 'up' | 'down') => {
  if (direction === 'up' && index > 0) {
    const temp = customFields.value[index]
    customFields.value[index] = customFields.value[index - 1]
    customFields.value[index - 1] = temp
  } else if (direction === 'down' && index < customFields.value.length - 1) {
    const temp = customFields.value[index]
    customFields.value[index] = customFields.value[index + 1]
    customFields.value[index + 1] = temp
  }
}

const addOption = (fieldIndex: number) => {
  if (!customFields.value[fieldIndex].options) {
    customFields.value[fieldIndex].options = []
  }
  customFields.value[fieldIndex].options.push({ value: '', label: '' })
}

const removeOption = (fieldIndex: number, optionIndex: number) => {
  customFields.value[fieldIndex].options.splice(optionIndex, 1)
}

const handleSaveFields = async () => {
  // Validate fields keys
  const keys = customFields.value.map(f => f.field_key)
  const duplicates = keys.filter((item, index) => keys.indexOf(item) !== index)
  if (duplicates.length > 0) {
    alert(`Gagal menyimpan: Ditemukan duplikasi key kustom '${duplicates.join(', ')}'`)
    return
  }

  // Ensure select/radio fields have options
  for (const f of customFields.value) {
    if (['select', 'radio'].includes(f.field_type) && (!f.options || f.options.length === 0)) {
      alert(`Field '${f.label}' bertipe Pilihan (select/radio) wajib diisi minimal 1 opsi jawaban.`)
      return
    }
    // Verify each option is complete
    if (f.options) {
      for (const opt of f.options) {
        if (!opt.value || !opt.label) {
          alert(`Opsi jawaban pada '${f.label}' tidak boleh ada value/label kosong.`)
          return
        }
      }
    }
  }

  try {
    const payload = customFields.value.map((f, idx) => ({
      field_key: f.field_key,
      label: f.label,
      field_type: f.field_type,
      options: f.options,
      is_required: !!f.is_required,
      sort_order: idx,
      placeholder: f.placeholder || null,
      help_text: f.help_text || null
    }))
    
    const res = await savePpdbBatchFields(selectedSchoolId.value, selectedBatchForFields.value.id, payload)
    if (res.success) {
      alert('Konfigurasi formulir pendaftaran berhasil disimpan!')
      showFieldsBuilderModal.value = false
    }
  } catch (e: any) {
    alert(e?.message || 'Gagal menyimpan konfigurasi form')
  }
}

const copyToClipboard = (text: string) => {
  if (!process.client) return false
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
    return true
  } else {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      console.error('Fallback copy failed', err)
      document.body.removeChild(textArea)
      return false
    }
  }
}

const copiedBatchId = ref('')
const copyBatchLink = (batch: any) => {
  if (!process.client) return
  const link = `${window.location.origin}/ppdb/${selectedSchoolId.value}/${batch.slug}`
  copyToClipboard(link)
  copiedBatchId.value = batch.id
  setTimeout(() => {
    copiedBatchId.value = ''
  }, 2000)
}

const copiedAnnId = ref('')
const copyAnnouncementLink = (batch: any) => {
  if (!process.client) return
  const link = `${window.location.origin}/ppdb/${selectedSchoolId.value}/${batch.slug}/pengumuman`
  copyToClipboard(link)
  copiedAnnId.value = batch.id
  setTimeout(() => {
    copiedAnnId.value = ''
  }, 2000)
}

const copyActiveAnnouncementLink = () => {
  const batch = ppdbBatches.value.find(b => b.id === selectedBatchId.value)
  if (batch) {
    copyAnnouncementLink(batch)
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
          <UserPlus class="text-violet-600" :size="26" /> Penerimaan Siswa Baru (PPDB)
        </h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Kelola gelombang pendaftaran, formulir kustom, verifikasi, dan kelulusan.</p>
      </div>
      <div class="flex gap-2" v-if="activeTab === 'batches'">
        <BaseButton variant="primary" @click="showCreateBatchModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Plus class="mr-1.5" :size="14" /> Buat Gelombang PPDB
        </BaseButton>
      </div>
    </div>

    <!-- Selection Units -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-200 dark:border-zinc-850">
      <button 
        @click="activeTab = 'batches'"
        :class="[
          'px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 flex items-center gap-2',
          activeTab === 'batches' 
            ? 'border-violet-600 text-violet-600 dark:text-violet-400' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-zinc-400 dark:hover:text-zinc-200'
        ]"
      >
        <Layers :size="14" /> Gelombang PPDB
      </button>
      <button 
        @click="activeTab = 'applicants'"
        :class="[
          'px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 flex items-center gap-2',
          activeTab === 'applicants' 
            ? 'border-violet-600 text-violet-600 dark:text-violet-400' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-zinc-400 dark:hover:text-zinc-200'
        ]"
      >
        <Clipboard :size="14" /> Daftar Pendaftar
      </button>
      <button 
        @click="activeTab = 'admissions'"
        :class="[
          'px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 flex items-center gap-2',
          activeTab === 'admissions' 
            ? 'border-violet-600 text-violet-600 dark:text-violet-400' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-zinc-400 dark:hover:text-zinc-200'
        ]"
      >
        <CheckSquare :size="14" /> Kelola Penerimaan
      </button>
      <button 
        @click="activeTab = 'announcements'"
        :class="[
          'px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 flex items-center gap-2',
          activeTab === 'announcements' 
            ? 'border-violet-600 text-violet-600 dark:text-violet-400' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-zinc-400 dark:hover:text-zinc-200'
        ]"
      >
        <Megaphone :size="14" /> Pengumuman
      </button>
      <button 
        @click="activeTab = 'stats'"
        :class="[
          'px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 flex items-center gap-2',
          activeTab === 'stats' 
            ? 'border-violet-600 text-violet-600 dark:text-violet-400' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-zinc-400 dark:hover:text-zinc-200'
        ]"
      >
        <TrendingUp :size="14" /> Statistik & Konversi
      </button>
    </div>

    <!-- Active Tab Panel Content -->
    <!-- Tab 1: Gelombang PPDB -->
    <div v-if="activeTab === 'batches'" class="space-y-6">
      <div v-if="ppdbBatches.length === 0" class="text-center py-16 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <Layers class="mx-auto text-slate-300 dark:text-zinc-700 mb-4" :size="48" />
        <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-200">Belum Ada Gelombang PPDB</h3>
        <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">Silakan buat gelombang pendaftaran baru untuk menerima pendaftaran siswa baru.</p>
        <BaseButton variant="outline" @click="showCreateBatchModal = true" :disabled="!selectedSchoolId" class="mt-4 text-xs font-bold py-2 px-4">
          <Plus class="mr-1.5" :size="12" /> Buat Gelombang Baru
        </BaseButton>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BaseCard v-for="batch in ppdbBatches" :key="batch.id" class="p-6 relative hover:shadow-md transition-shadow border border-slate-200/60 dark:border-zinc-800/80">
          <div class="flex items-center justify-between mb-4">
            <span :class="[
              'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
              batch.status === 'open' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
              batch.status === 'announced' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
              batch.status === 'closed' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
              'bg-slate-500/10 text-slate-600 border border-slate-500/20'
            ]">
              {{ batch.status === 'open' ? 'Buka' : batch.status === 'closed' ? 'Tutup' : batch.status === 'announced' ? 'Diumumkan' : 'Draft' }}
            </span>
            <div class="flex items-center gap-1">
              <span v-if="batch.is_public" class="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-600/10 px-2 py-0.5 rounded-full border border-violet-500/20">Publik</span>
              <span v-else class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full dark:bg-zinc-800 border dark:border-zinc-700">Internal</span>
            </div>
          </div>

          <h3 class="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-1.5">{{ batch.name }}</h3>
          <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Jenjang {{ batch.level }}</p>

          <div class="space-y-2 mb-6">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Pendaftaran:</span>
              <span class="font-medium text-slate-700 dark:text-zinc-300">
                {{ new Date(batch.registration_start).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) }} -
                {{ new Date(batch.registration_end).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) }}
              </span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Pengumuman:</span>
              <span class="font-medium text-slate-700 dark:text-zinc-300">
                {{ new Date(batch.announcement_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) }}
              </span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Kuota Diterima:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">{{ batch.quota }} Siswa</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Biaya Formulir:</span>
              <span class="font-bold text-slate-800 dark:text-zinc-200">
                {{ Number(batch.registration_fee) > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(batch.registration_fee) : 'Gratis' }}
              </span>
            </div>
          </div>

          <!-- Share Link Section -->
          <div v-if="['open', 'announced'].includes(batch.status) && batch.is_public" class="mb-2 bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-850 flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <Link class="text-violet-600 shrink-0" :size="12" />
              <span class="text-[10px] text-slate-500 font-mono truncate select-all">Link Pendaftaran</span>
            </div>
            <button 
              type="button" 
              @click="copyBatchLink(batch)"
              class="shrink-0 flex items-center gap-1 px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-[10px] font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="Salin Link Pendaftaran"
            >
              <Check v-if="copiedBatchId === batch.id" class="text-emerald-500" :size="10" />
              <Copy v-else :size="10" />
              <span>{{ copiedBatchId === batch.id ? 'Tersalin' : 'Salin Link' }}</span>
            </button>
          </div>

          <div v-if="batch.status === 'announced' && batch.is_public" class="mb-4 bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-850 flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <Megaphone class="text-violet-600 shrink-0" :size="12" />
              <span class="text-[10px] text-slate-500 font-mono truncate select-all">Link Pengumuman</span>
            </div>
            <button 
              type="button" 
              @click="copyAnnouncementLink(batch)"
              class="shrink-0 flex items-center gap-1 px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-[10px] font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="Salin Link Pengumuman"
            >
              <Check v-if="copiedAnnId === batch.id" class="text-emerald-500" :size="10" />
              <Copy v-else :size="10" />
              <span>{{ copiedAnnId === batch.id ? 'Tersalin' : 'Salin Link' }}</span>
            </button>
          </div>

          <div class="flex gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <BaseButton variant="outline" @click="openFieldsBuilder(batch)" class="flex-1 py-2 text-xs font-semibold">
              <Settings class="mr-1" :size="12" /> Form Builder
            </BaseButton>
            <BaseButton variant="outline" @click="openEditBatchModal(batch)" class="py-2 px-3 text-xs">
              <Edit2 :size="12" />
            </BaseButton>
            <BaseButton variant="outline" @click="handleDeleteBatch(batch.id)" class="py-2 px-3 text-xs hover:text-rose-600 hover:bg-rose-500/5">
              <Trash2 :size="12" />
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Tab 2: Daftar Pendaftar -->
    <div v-else-if="activeTab === 'applicants'" class="space-y-6">
      <!-- Filter & Search controls -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-500 uppercase shrink-0">Gelombang:</label>
            <select v-model="selectedBatchId" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600">
              <option v-for="b in ppdbBatches" :key="b.id" :value="b.id">{{ b.name }} ({{ b.level }})</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-500 uppercase shrink-0">Status:</label>
            <select v-model="selectedStatusFilter" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600">
              <option value="">Semua Status</option>
              <option value="pending">Menunggu Pembayaran</option>
              <option value="payment_review">Review Pembayaran</option>
              <option value="reviewing">Berkas / Seleksi Direview</option>
              <option value="accepted">Diterima</option>
              <option value="rejected">Ditolak</option>
              <option value="waitlisted">Cadangan</option>
            </select>
          </div>
        </div>
        
        <!-- Search bar -->
        <div class="relative w-full md:w-80">
          <input 
            v-model="applicantSearchQuery" 
            type="text" 
            placeholder="Cari nama, nomor reg, atau ortu..." 
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-violet-600 font-semibold"
          />
          <Search class="absolute left-2.5 top-2.5 text-slate-400" :size="12" />
        </div>
      </div>
 
      <!-- Loading State -->
      <div v-if="applicantsLoading" class="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl">
        <div class="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-xs text-slate-400 font-medium">Memuat data pendaftar...</p>
      </div>
 
      <!-- Empty State -->
      <div v-else-if="filteredApplicants.length === 0" class="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl">
        <Clipboard class="mx-auto text-slate-300 mb-3" :size="40" />
        <p class="text-xs text-slate-400 font-semibold">Tidak ditemukan pendaftar untuk kriteria pencarian ini.</p>
      </div>
 
      <!-- Applicants Table & Pagination -->
      <div v-else class="space-y-4">
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 dark:bg-zinc-950 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200/60 dark:border-zinc-850">
                <th class="px-5 py-4">No. Pendaftaran</th>
                <th class="px-5 py-4">Nama Siswa</th>
                <th class="px-5 py-4">Orang Tua / WA</th>
                <th class="px-5 py-4">Status</th>
                <th class="px-5 py-4 text-center">Bayar</th>
                <th class="px-5 py-4">Tanggal Daftar</th>
                <th class="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-zinc-850">
              <tr v-for="app in paginatedApplicants" :key="app.id" class="hover:bg-slate-50/50 dark:hover:bg-zinc-950/40 transition-colors">
                <td class="px-5 py-3.5 font-bold text-violet-600 dark:text-violet-400 font-mono tracking-wider">{{ app.registration_number }}</td>
                <td class="px-5 py-3.5 font-bold text-slate-800 dark:text-zinc-250">{{ app.full_name }}</td>
                <td class="px-5 py-3.5">
                  <div class="font-medium text-slate-700 dark:text-zinc-350">{{ app.parent_name }}</div>
                  <div class="text-[10px] text-slate-400">{{ app.parent_phone }}</div>
                </td>
                <td class="px-5 py-3.5">
                  <span :class="[
                    'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                    app.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                    app.status === 'payment_review' ? 'bg-blue-500/10 text-blue-600' :
                    app.status === 'reviewing' ? 'bg-indigo-500/10 text-indigo-600' :
                    app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' :
                    app.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' :
                    'bg-slate-500/10 text-slate-600'
                  ]">
                    {{ app.status === 'pending' ? 'Belum Bayar' :
                       app.status === 'payment_review' ? 'Review Bayar' :
                       app.status === 'reviewing' ? 'Review Berkas' :
                       app.status === 'accepted' ? 'Diterima' :
                       app.status === 'rejected' ? 'Ditolak' : 'Cadangan' }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <span :class="app.payment_verified ? 'text-emerald-500 font-bold' : 'text-slate-400 font-bold'">
                    {{ app.payment_verified ? '✓' : '✗' }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-slate-500">
                  {{ new Date(app.submitted_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) }}
                </td>
                <td class="px-5 py-3.5 text-right">
                  <button 
                    type="button"
                    @click="openApplicantDetail(app)" 
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-extrabold text-[10px] rounded-lg tracking-wider uppercase transition-all duration-200 active:scale-95 group shadow-sm border border-violet-100 dark:border-violet-900/30 outline-none"
                  >
                    <span>Kelola</span>
                    <ChevronRight :size="10" class="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination Controls -->
        <div v-if="filteredApplicants.length > applicantPageSize" class="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl shadow-sm text-xs">
          <span class="text-slate-400 font-semibold">
            Menampilkan {{ (applicantCurrentPage - 1) * applicantPageSize + 1 }} - {{ Math.min(applicantCurrentPage * applicantPageSize, filteredApplicants.length) }} dari {{ filteredApplicants.length }} pendaftar
          </span>
          <div class="flex items-center gap-2">
            <BaseButton 
              variant="outline" 
              class="py-1 px-3 text-[10px] font-bold" 
              :disabled="applicantCurrentPage === 1" 
              @click="applicantCurrentPage--"
            >
              Sebelumnya
            </BaseButton>
            <span class="px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded font-bold">
              {{ applicantCurrentPage }} / {{ totalApplicantPages }}
            </span>
            <BaseButton 
              variant="outline" 
              class="py-1 px-3 text-[10px] font-bold" 
              :disabled="applicantCurrentPage >= totalApplicantPages" 
              @click="applicantCurrentPage++"
            >
              Selanjutnya
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Kelola Penerimaan -->
    <div v-else-if="activeTab === 'admissions'" class="space-y-6">
      <!-- Selection of batch and summary metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
        <div class="lg:col-span-1 flex flex-col gap-1.5 justify-center">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Pilih Gelombang PPDB</label>
          <select v-model="selectedBatchId" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg px-3 py-2.5 text-xs font-semibold outline-none focus:border-violet-600">
            <option v-for="b in ppdbBatches" :key="b.id" :value="b.id">{{ b.name }} ({{ b.level }})</option>
          </select>
        </div>
        
        <div class="lg:col-span-3 grid grid-cols-3 gap-3">
          <div class="bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-200/50 dark:border-zinc-850 rounded-xl text-center shadow-sm">
            <div class="text-[10px] font-bold text-slate-400 uppercase">Total Review Berkas</div>
            <div class="text-xl font-black text-indigo-600 mt-1">{{ applicants.filter(a => a.status === 'reviewing').length }}</div>
          </div>
          <div class="bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-200/50 dark:border-zinc-850 rounded-xl text-center shadow-sm">
            <div class="text-[10px] font-bold text-slate-400 uppercase">Diterima</div>
            <div class="text-xl font-black text-emerald-600 mt-1">{{ applicants.filter(a => a.status === 'accepted').length }}</div>
          </div>
          <div class="bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-200/50 dark:border-zinc-850 rounded-xl text-center shadow-sm">
            <div class="text-[10px] font-bold text-slate-400 uppercase">Kuota Gelombang</div>
            <div class="text-xl font-black text-slate-700 dark:text-zinc-355 mt-1">
              {{ ppdbBatches.find(b => b.id === selectedBatchId)?.quota || 0 }}
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Actions Bar (only when checking boxes) -->
      <div v-if="selectedApplicantIds.length > 0" class="bg-violet-600 text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-300">
        <span class="text-xs font-bold">{{ selectedApplicantIds.length }} pendaftar dipilih</span>
        <div class="flex gap-2">
          <BaseButton type="button" variant="outline" @click="handleBulkStatusChange('accepted')" class="bg-emerald-600 hover:bg-emerald-700 border-none text-white py-1.5 px-3 text-[10px] font-bold shadow-sm">
            Terima (Lulus)
          </BaseButton>
          <BaseButton type="button" variant="outline" @click="handleBulkStatusChange('waitlisted')" class="bg-amber-600 hover:bg-amber-700 border-none text-white py-1.5 px-3 text-[10px] font-bold shadow-sm">
            Cadangkan
          </BaseButton>
          <BaseButton type="button" variant="outline" @click="handleBulkStatusChange('rejected')" class="bg-rose-600 hover:bg-rose-700 border-none text-white py-1.5 px-3 text-[10px] font-bold shadow-sm">
            Tolak
          </BaseButton>
          <button type="button" @click="selectedApplicantIds = []" class="text-xs font-bold text-violet-200 hover:text-white px-2">Batal</button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="applicantsLoading" class="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <div class="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-xs text-slate-400 font-medium">Memuat data...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="applicants.filter(a => a.status === 'reviewing').length === 0" class="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <Clipboard class="mx-auto text-slate-300 mb-3" :size="40" />
        <p class="text-xs text-slate-400 font-semibold">Tidak ada pendaftar berstatus "Review Berkas" yang siap dikelola.</p>
      </div>

      <!-- Admissions Table -->
      <div v-else class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl shadow-sm overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-zinc-950 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200/60 dark:border-zinc-850">
              <th class="px-5 py-4 text-center w-12">
                <input 
                  type="checkbox" 
                  :checked="selectedApplicantIds.length === applicants.filter(a => a.status === 'reviewing').length"
                  @change="toggleSelectAllApplicants"
                  class="rounded text-violet-600"
                />
              </th>
              <th class="px-5 py-4">No. Registrasi</th>
              <th class="px-5 py-4">Nama Lengkap</th>
              <th class="px-5 py-4">Kontak Utama</th>
              <th class="px-5 py-4 text-right">Aksi Mandiri</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-zinc-850">
            <tr v-for="app in applicants.filter(a => a.status === 'reviewing')" :key="app.id" class="hover:bg-slate-50/50 dark:hover:bg-zinc-950/40 transition-colors">
              <td class="px-5 py-3.5 text-center">
                <input 
                  type="checkbox" 
                  :value="app.id" 
                  v-model="selectedApplicantIds" 
                  class="rounded text-violet-600"
                />
              </td>
              <td class="px-5 py-3.5 font-bold text-violet-600 dark:text-violet-400 font-mono tracking-wider">{{ app.registration_number }}</td>
              <td class="px-5 py-3.5 font-bold text-slate-800 dark:text-zinc-250">{{ app.full_name }}</td>
              <td class="px-5 py-3.5">
                <div class="font-medium text-slate-700 dark:text-zinc-355">{{ app.parent_name }}</div>
                <div class="text-[10px] text-slate-400">{{ app.parent_phone }}</div>
              </td>
              <td class="px-5 py-3.5 text-right flex gap-1.5 justify-end">
                <BaseButton variant="outline" @click="updateApplicantStatus(selectedSchoolId, selectedBatchId, app.id, { status: 'accepted' }).then(() => loadApplicants())" class="bg-emerald-600 hover:bg-emerald-700 border-none text-white py-1 px-3.5 text-[10px] font-bold">
                  Terima
                </BaseButton>
                <BaseButton variant="outline" @click="updateApplicantStatus(selectedSchoolId, selectedBatchId, app.id, { status: 'rejected' }).then(() => loadApplicants())" class="bg-rose-600 hover:bg-rose-700 border-none text-white py-1 px-3.5 text-[10px] font-bold">
                  Tolak
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 4: Pengumuman -->
    <div v-else-if="activeTab === 'announcements'" class="space-y-6">
      <div class="flex justify-between items-center bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <label class="text-xs font-bold text-slate-500 uppercase shrink-0">Gelombang:</label>
          <select v-model="selectedBatchId" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600">
            <option v-for="b in ppdbBatches" :key="b.id" :value="b.id">{{ b.name }} ({{ b.level }})</option>
          </select>
        </div>
        <BaseButton variant="primary" @click="openCreateAnnouncement" class="py-2 px-4 text-xs font-bold shadow-lg shadow-violet-600/10">
          + Buat Pengumuman Baru
        </BaseButton>
      </div>

      <div v-if="announcementsLoading" class="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl">
        <div class="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-xs text-slate-400 font-medium">Memuat data pengumuman...</p>
      </div>

      <div v-else-if="announcements.length === 0" class="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl">
        <Megaphone class="mx-auto text-slate-300 dark:text-zinc-700 mb-3" :size="40" />
        <p class="text-xs text-slate-400 font-semibold">Belum ada pengumuman untuk gelombang ini.</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-4">
        <div v-for="ann in announcements" :key="ann.id" class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 p-5 rounded-2xl shadow-sm text-left space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-150">{{ ann.title }}</h3>
            <div class="flex items-center gap-2">
              <span :class="[
                'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider',
                ann.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600'
              ]">
                {{ ann.status === 'published' ? 'Diterbitkan' : 'Draft' }}
              </span>
            </div>
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 whitespace-pre-line leading-relaxed border-t border-slate-100 dark:border-zinc-850/50 pt-3">{{ ann.content }}</p>
          
          <!-- Share Link Section in Tab 4 -->
          <div v-if="ann.status === 'published'" class="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850/50 flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-1.5 min-w-0">
              <Megaphone class="text-violet-600 shrink-0" :size="12" />
              <span class="text-[10px] text-slate-500 font-mono truncate select-all">Link Pengumuman Publik</span>
            </div>
            <button 
              type="button" 
              @click="copyActiveAnnouncementLink()"
              class="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-[10px] font-extrabold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="Salin Link Pengumuman"
            >
              <Check v-if="copiedAnnId === selectedBatchId" class="text-emerald-500" :size="10" />
              <Copy v-else :size="10" />
              <span>{{ copiedAnnId === selectedBatchId ? 'Tersalin' : 'Salin Link' }}</span>
            </button>
          </div>

          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-2">
            <div>
              <span v-if="ann.show_accepted_list" class="bg-violet-600/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded font-bold mr-2">✓ Menampilkan Daftar Lulus</span>
              <span v-if="ann.published_at">Diterbitkan pada: {{ new Date(ann.published_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                @click="openEditAnnouncement(ann)" 
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-extrabold text-[10px] rounded-lg tracking-wider uppercase transition-all duration-200 active:scale-95 border border-violet-100 dark:border-violet-900/30 outline-none"
              >
                <Edit2 :size="10" />
                <span>Ubah</span>
              </button>
              <button 
                type="button" 
                @click="handleDeleteAnnouncement(ann.id)" 
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] rounded-lg tracking-wider uppercase transition-all duration-200 active:scale-95 border border-rose-100 dark:border-rose-900/30 outline-none"
              >
                <Trash2 :size="10" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 5: Statistik & Konversi -->
    <div v-else-if="activeTab === 'stats'" class="space-y-6">
      <!-- Selector Batch -->
      <div class="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm">
        <label class="text-xs font-bold text-slate-500 uppercase shrink-0">Gelombang:</label>
        <select v-model="selectedBatchId" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600">
          <option v-for="b in ppdbBatches" :key="b.id" :value="b.id">{{ b.name }} ({{ b.level }})</option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="statsLoading || !statsData" class="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <div class="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-xs text-slate-400 font-medium">Memuat statistik gelombang...</p>
      </div>

      <!-- Main Dashboard Grid -->
      <div v-else class="space-y-6">
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card 1: Kuota vs Diterima -->
          <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm flex flex-col gap-1.5 text-left">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kuota vs Lulus</span>
            <div class="text-2xl font-black text-slate-800 dark:text-zinc-150">
              {{ statsData.status_counts.accepted }} / {{ statsData.quota }}
            </div>
            <p class="text-[10px] text-slate-400 font-medium mt-1">
              Kuota terisi {{ Math.min(Math.round((statsData.status_counts.accepted / (statsData.quota || 1)) * 100), 100) }}% dari target.
            </p>
          </div>

          <!-- Card 2: Konversi Siswa -->
          <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm flex flex-col gap-1.5 text-left">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Telah Dikonversi</span>
            <div class="text-2xl font-black text-slate-800 dark:text-zinc-150">
              {{ statsData.converted_count }}
            </div>
            <p class="text-[10px] text-slate-400 font-medium mt-1">
              {{ statsData.status_counts.accepted - statsData.converted_count }} calon siswa menunggu konversi.
            </p>
          </div>

          <!-- Card 3: Pemasukan Keuangan -->
          <div class="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-2 text-left">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pemasukan Biaya Pendaftaran</span>
            <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(statsData.total_payments_amount) }}
            </div>
            <p class="text-[10px] text-slate-400 font-medium mt-1">
              Akumulasi biaya formulir transfer manual yang telah disetujui admin.
            </p>
          </div>
        </div>

        <!-- Funnel and Detail Lists -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Funnel Bar Chart Card -->
          <div class="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm space-y-5 lg:col-span-1 text-left">
            <h3 class="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
              <TrendingUp :size="14" class="text-violet-600" />
              <span>Funnel Pendaftaran</span>
            </h3>
            
            <div class="space-y-4 text-xs font-semibold">
              <!-- Total registered -->
              <div class="space-y-1">
                <div class="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Total Mendaftar</span>
                  <span class="font-bold">{{ Object.values(statsData.status_counts).reduce((a, b) => a + b, 0) }}</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden">
                  <div class="bg-violet-600 h-full w-full"></div>
                </div>
              </div>

              <!-- Payment Review -->
              <div class="space-y-1">
                <div class="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Review Pembayaran</span>
                  <span class="font-bold">{{ statsData.status_counts.payment_review }}</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden">
                  <div 
                    class="bg-blue-500 h-full transition-all duration-500" 
                    :style="{ width: `${(statsData.status_counts.payment_review / (Object.values(statsData.status_counts).reduce((a, b) => a + b, 0) || 1)) * 100}%` }"
                  ></div>
                </div>
              </div>

              <!-- Seleksi Reviewing -->
              <div class="space-y-1">
                <div class="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Proses Seleksi Berkas</span>
                  <span class="font-bold">{{ statsData.status_counts.reviewing }}</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden">
                  <div 
                    class="bg-indigo-500 h-full transition-all duration-500" 
                    :style="{ width: `${(statsData.status_counts.reviewing / (Object.values(statsData.status_counts).reduce((a, b) => a + b, 0) || 1)) * 100}%` }"
                  ></div>
                </div>
              </div>

              <!-- Accepted / Lolos -->
              <div class="space-y-1">
                <div class="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Dinyatakan Lulus</span>
                  <span class="font-bold">{{ statsData.status_counts.accepted }}</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden">
                  <div 
                    class="bg-emerald-500 h-full transition-all duration-500" 
                    :style="{ width: `${(statsData.status_counts.accepted / (Object.values(statsData.status_counts).reduce((a, b) => a + b, 0) || 1)) * 100}%` }"
                  ></div>
                </div>
              </div>

              <!-- Converted -->
              <div class="space-y-1">
                <div class="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Telah Konversi Siswa</span>
                  <span class="font-bold">{{ statsData.converted_count }}</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden">
                  <div 
                    class="bg-amber-500 h-full transition-all duration-500" 
                    :style="{ width: `${(statsData.converted_count / (statsData.status_counts.accepted || 1)) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Conversion List -->
          <div class="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm space-y-4 lg:col-span-2 text-left">
            <div class="flex items-center justify-between border-b pb-2">
              <h3 class="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-1.5">
                <Clipboard :size="14" class="text-violet-600" />
                <span>Pendaftar Menunggu Konversi</span>
              </h3>
              
              <!-- Bulk Convert Action Button -->
              <BaseButton 
                v-if="applicants.filter(a => a.status === 'accepted' && !a.is_converted).length > 0"
                variant="primary" 
                @click="selectedApplicantIds = applicants.filter(a => a.status === 'accepted' && !a.is_converted).map(a => a.id); handleBulkConvert()"
                :disabled="bulkConverting"
                class="py-1 px-3 text-[10px] font-bold shadow-sm shadow-violet-500/10 flex items-center gap-1"
              >
                <span>Konversi Massal Semua ({{ applicants.filter(a => a.status === 'accepted' && !a.is_converted).length }})</span>
              </BaseButton>
            </div>

            <!-- Empty List -->
            <div 
              v-if="applicants.filter(a => a.status === 'accepted' && !a.is_converted).length === 0"
              class="text-slate-400 text-center py-16 text-xs border border-dashed border-slate-200 dark:border-zinc-850 rounded-xl"
            >
              Tidak ada calon siswa lulus seleksi yang menunggu proses konversi akademik.
            </div>

            <!-- List table -->
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 dark:bg-zinc-950 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200/60 dark:border-zinc-850">
                    <th class="px-3 py-2.5">No. Pendaftaran</th>
                    <th class="px-3 py-2.5">Nama Calon Siswa</th>
                    <th class="px-3 py-2.5">Orang Tua / Wali</th>
                    <th class="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-zinc-850">
                  <tr 
                    v-for="app in applicants.filter(a => a.status === 'accepted' && !a.is_converted)" 
                    :key="app.id" 
                    class="hover:bg-slate-50/50 dark:hover:bg-zinc-950/40 transition-colors"
                  >
                    <td class="px-3 py-3 font-bold text-violet-600 dark:text-violet-400 font-mono tracking-wider">{{ app.registration_number }}</td>
                    <td class="px-3 py-3 font-bold text-slate-800 dark:text-zinc-250">{{ app.full_name }}</td>
                    <td class="px-3 py-3">{{ app.parent_name }}</td>
                    <td class="px-3 py-3 text-right">
                      <BaseButton 
                        variant="outline" 
                        @click="handleConvertStudent(app.id)"
                        :disabled="convertingAppId === app.id"
                        class="py-1 px-3 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 border-none text-white shadow-sm"
                      >
                        Konversi
                      </BaseButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Announcement Modal -->
    <BaseModal :show="showAnnouncementModal" :title="editingAnnouncementId ? 'Ubah Pengumuman PPDB' : 'Buat Pengumuman PPDB Baru'" @close="showAnnouncementModal = false">
      <form @submit.prevent="handleSaveAnnouncement" class="space-y-4">
        <BaseInput v-model="announcementForm.title" label="Judul Pengumuman" placeholder="Contoh: Pengumuman Kelulusan Seleksi Gelombang I" required />
        
        <div class="flex flex-col gap-1.5 text-left">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Isi Detail Pengumuman</label>
          <textarea v-model="announcementForm.content" rows="6" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600" placeholder="Tulis rincian pengumuman kelulusan, jadwal pendaftaran ulang, berkas yang harus disiapkan, dll..." required></textarea>
        </div>

        <div class="flex flex-col gap-3 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-xl text-left">
          <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
            <input type="checkbox" v-model="announcementForm.show_accepted_list" class="rounded border-slate-300 text-violet-600 focus:ring-violet-600" />
            <span>Tampilkan Daftar Nama Calon Siswa yang Diterima (Lulus)</span>
          </label>
          
          <div class="flex flex-col gap-1.5 border-t border-slate-200/50 dark:border-zinc-800 pt-3">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Status Pengumuman</label>
            <select v-model="announcementForm.status" class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs font-semibold">
              <option value="draft">Draft (Simpan saja, belum tampil ke publik)</option>
              <option value="published">Terbit (Published - Tampil ke halaman pengumuman publik)</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton type="button" variant="outline" @click="showAnnouncementModal = false" class="py-2 px-4 text-xs font-semibold">
            Batal
          </BaseButton>
          <BaseButton type="submit" variant="primary" class="py-2 px-4 text-xs font-bold">
            Simpan Pengumuman
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Applicant Detail Modal -->
    <BaseModal :show="showApplicantDetailModal" title="Detail Data Pendaftar" width="large" @close="showApplicantDetailModal = false">
      <div v-if="!selectedApplicant" class="text-center py-20">
        <div class="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-xs text-slate-400 font-medium">Memuat rincian pendaftar...</p>
      </div>

      <div v-else class="space-y-6 max-h-[500px] overflow-y-auto pr-1">
        
        <!-- Applicant Profile summary -->
        <div class="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200/50 dark:border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">{{ selectedApplicant.full_name }}</h3>
            <p class="text-[10px] font-mono text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider mt-0.5">{{ selectedApplicant.registration_number }}</p>
          </div>
          <span :class="[
            'px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider',
            selectedApplicant.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
            selectedApplicant.status === 'payment_review' ? 'bg-blue-500/10 text-blue-600' :
            selectedApplicant.status === 'reviewing' ? 'bg-indigo-500/10 text-indigo-600' :
            selectedApplicant.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' :
            selectedApplicant.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' :
            'bg-slate-500/10 text-slate-600'
          ]">
            {{ selectedApplicant.status }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Biodata standard -->
          <div class="bg-white dark:bg-zinc-900 p-4 border border-slate-100 dark:border-zinc-850 rounded-xl space-y-3">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Biodata Standar</h4>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between"><span class="text-slate-400">Orang Tua / Wali:</span> <strong class="text-slate-800 dark:text-zinc-350">{{ selectedApplicant.parent_name }}</strong></div>
              <div class="flex justify-between"><span class="text-slate-400">Nomor WhatsApp:</span> <strong class="text-slate-800 dark:text-zinc-350">{{ selectedApplicant.parent_phone }}</strong></div>
              <div class="flex justify-between"><span class="text-slate-400">Email:</span> <strong class="text-slate-800 dark:text-zinc-355">{{ selectedApplicant.parent_email || '-' }}</strong></div>
              <div class="flex justify-between"><span class="text-slate-400">Gelombang:</span> <strong class="text-slate-800 dark:text-zinc-355">{{ selectedApplicant.batch_name }}</strong></div>
            </div>
          </div>

          <!-- Custom Answers -->
          <div class="bg-white dark:bg-zinc-900 p-4 border border-slate-100 dark:border-zinc-850 rounded-xl space-y-3">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Pertanyaan Persyaratan Kustom</h4>
            <div class="space-y-2.5 text-xs max-h-[160px] overflow-y-auto pr-1">
              <div v-for="(answer, key) in selectedApplicant.form_answers" :key="key" class="flex flex-col gap-0.5 border-b border-slate-50 dark:border-zinc-850/50 pb-1.5">
                <span class="text-[10px] font-bold text-slate-400 uppercase font-sans text-left">{{ key.replace(/_/g, ' ') }}</span>
                <span class="font-semibold text-slate-800 dark:text-zinc-300 text-left">{{ answer }}</span>
              </div>
              <div v-if="!selectedApplicant.form_answers || Object.keys(selectedApplicant.form_answers).length === 0" class="text-slate-400 text-center italic py-4">Tidak ada data kustom.</div>
            </div>
          </div>
        </div>

        <!-- Section: Pembayaran Manual (Sprint 3) -->
        <div v-if="Number(selectedApplicant.batch_registration_fee) > 0" class="bg-white dark:bg-zinc-900 p-4 border border-slate-150 dark:border-zinc-850 rounded-xl space-y-4">
          <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Verifikasi Pembayaran Manual</h4>
          
          <div v-if="!selectedApplicant.payment_proof" class="text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
            Belum ada bukti pembayaran diunggah oleh pendaftar.
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Text details -->
              <div class="space-y-2 text-xs">
                <div class="flex justify-between"><span class="text-slate-400">Pengirim BCA / Bank Asal:</span> <strong>{{ selectedApplicant.payment_proof.bank_name }} - {{ selectedApplicant.payment_proof.transfer_from_name }}</strong></div>
                <div class="flex justify-between"><span class="text-slate-400">Jumlah di-Klaim:</span> <strong>{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedApplicant.payment_proof.amount_claimed) }}</strong></div>
                <div class="flex justify-between"><span class="text-slate-400">Tanggal Transfer:</span> <strong>{{ selectedApplicant.payment_proof.transfer_date }}</strong></div>
                <div class="flex justify-between"><span class="text-slate-400">Status Pembayaran:</span> <strong class="uppercase text-violet-600">{{ selectedApplicant.payment_proof.status }}</strong></div>
                <div class="flex justify-between items-center py-0.5">
                  <span class="text-slate-400">File Bukti:</span>
                  <a 
                    href="#"
                    @click.prevent="viewFullImage(selectedApplicant.payment_proof.file_url)" 
                    class="font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                  >
                    {{ selectedApplicant.payment_proof.file_name || 'bukti_transfer.png' }}
                  </a>
                </div>
              </div>
              
              <!-- Image view -->
              <a 
                href="#"
                @click.prevent="viewFullImage(selectedApplicant.payment_proof.file_url)" 
                class="bg-slate-50 dark:bg-zinc-950 p-2 rounded-xl border flex flex-col items-center justify-center hover:opacity-90 transition-opacity cursor-pointer group"
                title="Klik untuk melihat ukuran penuh"
              >
                <img :src="selectedApplicant.payment_proof.file_url" class="max-h-28 object-contain rounded" alt="Bukti Transfer" />
                <span class="text-[9px] text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 mt-1">*Klik untuk memperbesar</span>
              </a>
            </div>

            <!-- Verification Action Box (only visible when status is pending / payment_review) -->
            <div v-if="selectedApplicant.payment_proof.status === 'pending' || selectedApplicant.status === 'payment_review'" class="bg-violet-600/5 p-4 rounded-xl border border-violet-500/10 space-y-3">
              <span class="text-xs font-bold text-slate-700 dark:text-zinc-300">Tentukan Kelayakan Bukti Pembayaran:</span>
              <div class="flex flex-col gap-3">
                <div class="flex gap-2">
                  <BaseButton type="button" @click="handleApprovePayment(selectedApplicant.id, selectedApplicant.payment_proof.id)" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 text-xs">
                    Setujui Pembayaran (Approve)
                  </BaseButton>
                </div>
                
                <div class="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-2">
                  <label class="text-[10px] font-bold text-slate-400 uppercase">Alasan Penolakan Pembayaran (Jika Ditolak)</label>
                  <div class="flex gap-2">
                    <input v-model="paymentRejectionReason" type="text" placeholder="e.g. Gambar buram / nominal tidak sesuai" class="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded px-3 py-1.5 text-xs outline-none" />
                    <BaseButton type="button" @click="handleRejectPayment(selectedApplicant.id, selectedApplicant.payment_proof.id)" class="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-4 text-xs">
                      Tolak Pembayaran (Reject)
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Dokumen Pasca Penerimaan (Review Dokumen) -->
        <div v-if="selectedApplicant.status === 'accepted'" class="bg-white dark:bg-zinc-900 p-4 border border-slate-150 dark:border-zinc-850 rounded-xl space-y-4">
          <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1 flex items-center gap-1.5">
            <FileText :size="12" /> Verifikasi Dokumen Pasca Penerimaan
          </h4>
          
          <div v-if="!selectedApplicant.accepted_documents || selectedApplicant.accepted_documents.length === 0" class="text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-xs">
            Belum ada dokumen persyaratan diunggah oleh pendaftar.
          </div>

          <div v-else class="space-y-3">
            <div 
              v-for="doc in selectedApplicant.accepted_documents" 
              :key="doc.id" 
              class="p-4 border border-slate-100 dark:border-zinc-850/80 bg-slate-50/30 dark:bg-zinc-950/40 rounded-xl text-left space-y-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex gap-2.5">
                  <div class="p-2 bg-violet-600/10 text-violet-600 dark:text-violet-400 rounded-lg shrink-0 h-max">
                    <FileText :size="16" />
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-800 dark:text-zinc-200">{{ doc.document_label }}</div>
                    <div class="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[240px] truncate" :title="doc.file_name">{{ doc.file_name }}</div>
                  </div>
                </div>
                
                <span :class="[
                  'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider',
                  doc.status === 'verified' || doc.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                  doc.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'
                ]">
                  {{ doc.status === 'verified' || doc.status === 'approved' ? 'Disetujui' :
                     doc.status === 'rejected' ? 'Ditolak' : 'Pending' }}
                </span>
              </div>
              
              <!-- Actions and link -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-zinc-850/40">
                <a 
                  href="#" 
                  @click.prevent="viewFullImage(doc.file_url)" 
                  class="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-extrabold hover:underline"
                >
                  <FileText :size="12" />
                  <span>Lihat Lampiran Berkas</span>
                </a>
                
                <!-- Action Buttons -->
                <div class="flex items-center justify-end">
                  <div v-if="doc.status === 'pending'" class="flex flex-col sm:flex-row items-center gap-2 w-full justify-end">
                    <div class="flex gap-1 w-full sm:w-auto">
                      <input 
                        v-model="docRejectionReasonMap[doc.id]" 
                        type="text" 
                        placeholder="Alasan tolak..." 
                        class="flex-1 sm:w-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] outline-none font-semibold focus:border-rose-500 transition-colors"
                      />
                      <button 
                        type="button" 
                        @click="handleVerifyDocModal(selectedApplicant.id, doc.id, 'rejected')" 
                        class="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold px-3 py-1 rounded-lg text-[10px] transition-all flex items-center gap-1 shadow-sm shadow-rose-500/10 shrink-0"
                      >
                        <X :size="10" /> Tolak
                      </button>
                    </div>
                    <div class="hidden sm:block h-5 w-px bg-slate-200 dark:bg-zinc-800"></div>
                    <button 
                      type="button" 
                      @click="handleVerifyDocModal(selectedApplicant.id, doc.id, 'verified')" 
                      class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold px-4 py-1 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/10 shrink-0"
                    >
                      <Check :size="10" /> Setujui
                    </button>
                  </div>
                  <div v-else class="text-[10px] text-slate-400 dark:text-zinc-500 italic text-right font-medium">Verifikasi Selesai</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Kelola Status & Kelulusan (Sprint 4) -->
        <div class="bg-white dark:bg-zinc-900 p-4 border border-slate-150 dark:border-zinc-850 rounded-xl space-y-4">
          <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Ubah Status & Kelulusan Pendaftar</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Status Baru</label>
              <select v-model="statusUpdateVal" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600">
                <option value="pending">Menunggu Pembayaran (Pending)</option>
                <option value="payment_review">Review Pembayaran</option>
                <option value="reviewing">Berkas / Seleksi Direview (Reviewing)</option>
                <option value="accepted">Dinyatakan DITERIMA (Lulus)</option>
                <option value="rejected">Dinyatakan DITOLAK (Tidak Lulus)</option>
                <option value="waitlisted">Cadangan (Waitlist)</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catatan Admin</label>
              <input v-model="statusAdminNotes" type="text" placeholder="Catatan internal panitia..." class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded px-3 py-2 text-xs outline-none" />
            </div>
          </div>

          <!-- Rejection Reason input (Only shown when rejected status is chosen) -->
          <div v-if="statusUpdateVal === 'rejected'" class="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alasan Tidak Lulus Seleksi (Tampil ke pendaftar)</label>
            <textarea v-model="statusRejectionReason" placeholder="Tuliskan detail alasan ketidaklulusan..." rows="2" class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded px-3 py-2 text-xs outline-none"></textarea>
          </div>

          <div class="flex justify-end pt-2">
            <BaseButton type="button" @click="handleSaveStatusUpdate(selectedApplicant.id)" class="py-2 px-6 text-xs font-bold bg-violet-600 text-white shadow-lg">
              Simpan Update Status
            </BaseButton>
          </div>
        </div>

        <!-- Section: Konversi Akademik Siswa (Sprint 6) -->
        <div v-if="selectedApplicant.status === 'accepted'" class="bg-white dark:bg-zinc-900 p-4 border border-slate-150 dark:border-zinc-850 rounded-xl text-left space-y-4">
          <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1 flex items-center gap-1.5">
            <UserPlus :size="12" /> Konversi ke Siswa Aktif
          </h4>

          <div v-if="selectedApplicant.is_converted" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl text-xs flex items-center gap-2 leading-relaxed">
            <Check :size="16" class="text-emerald-600 shrink-0" />
            <div>
              <p class="font-bold">Calon siswa ini sudah sukses dikonversi menjadi siswa aktif!</p>
              <p class="text-[10px] text-emerald-600/80 mt-0.5 font-medium">Akun parent dan data siswa sudah dibuat di sistem akademik utama.</p>
            </div>
          </div>

          <div v-else class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p class="text-xs text-slate-500 dark:text-zinc-400 leading-normal max-w-md">
              Konversikan calon siswa ini ke database utama. Sistem akan otomatis membuat data <strong>Siswa</strong>, data <strong>Orang Tua</strong>, serta user log-in parent dengan password default <code>12345678</code>.
            </p>
            <BaseButton 
              type="button" 
              @click="handleConvertStudent(selectedApplicant.id)"
              :disabled="convertingAppId === selectedApplicant.id"
              class="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 border-none text-white font-black py-2 px-6 text-xs shadow-lg shrink-0"
            >
              {{ convertingAppId === selectedApplicant.id ? 'Mengonversi...' : 'Konversi Sekarang' }}
            </BaseButton>
          </div>
        </div>

      </div>
    </BaseModal>

    <!-- Create Batch Modal -->
    <BaseModal :show="showCreateBatchModal" title="Buat Gelombang PPDB Baru" @close="showCreateBatchModal = false">
      <form @submit.prevent="handleCreateBatch" class="space-y-4">
        <BaseInput v-model="batchForm.name" label="Nama Gelombang PPDB" placeholder="Contoh: PPDB TA 2026/2027 Gelombang I" required />
        
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Akademik Target</label>
            <select v-model="batchForm.academic_year_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none" required>
              <option value="" disabled>Pilih Tahun Ajaran</option>
              <option v-for="year in academicYears" :key="year.id" :value="year.id">{{ year.name }}</option>
            </select>
          </div>
          
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenjang PPDB</label>
            <select v-model="batchForm.level" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none" required>
              <option value="TK">TK / PAUD</option>
              <option value="SD">SD (Sekolah Dasar)</option>
              <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
              <option value="SMA">SMA (Sekolah Menengah Atas)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseDateInput v-model="batchForm.registration_start" label="Tanggal Pendaftaran Mulai" required />
          <BaseDateInput v-model="batchForm.registration_end" label="Tanggal Pendaftaran Selesai" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseDateInput v-model="batchForm.announcement_date" label="Tanggal Pengumuman Hasil" required />
          <BaseInput v-model.number="batchForm.quota" type="number" label="Kuota Penerimaan (Siswa)" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model.number="batchForm.registration_fee" type="number" label="Biaya Pendaftaran (Rp)" placeholder="0 jika gratis" required />
          <BaseInput v-model="batchForm.slug" label="URL Slug Kustom (Opsional)" placeholder="Contoh: gelombang-1" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Informasi / Deskripsi Singkat</label>
          <textarea v-model="batchForm.description" rows="3" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600" placeholder="Info gelombang pendaftaran, persyaratan berkas, atau petunjuk pembayaran..."></textarea>
        </div>

        <div class="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-xl">
          <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
            <input type="checkbox" v-model="batchForm.is_public" class="rounded border-slate-300 text-violet-600 focus:ring-violet-600" />
            <span>Aktifkan Formulir Pendaftaran Publik</span>
          </label>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton type="button" variant="outline" @click="showCreateBatchModal = false" class="py-2 px-4 text-xs font-semibold">
            Batal
          </BaseButton>
          <BaseButton type="submit" variant="primary" class="py-2 px-4 text-xs font-bold">
            Simpan Gelombang
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Edit Batch Modal -->
    <BaseModal :show="showEditBatchModal" title="Ubah Gelombang PPDB" @close="showEditBatchModal = false">
      <form @submit.prevent="handleUpdateBatch" class="space-y-4">
        <BaseInput v-model="editBatchForm.name" label="Nama Gelombang PPDB" required />

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tahun Akademik Target</label>
            <select v-model="editBatchForm.academic_year_id" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none" required>
              <option v-for="year in academicYears" :key="year.id" :value="year.id">{{ year.name }}</option>
            </select>
          </div>
          
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Jenjang PPDB</label>
            <select v-model="editBatchForm.level" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none" required>
              <option value="TK">TK / PAUD</option>
              <option value="SD">SD (Sekolah Dasar)</option>
              <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
              <option value="SMA">SMA (Sekolah Menengah Atas)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseDateInput v-model="editBatchForm.registration_start" label="Tanggal Pendaftaran Mulai" required />
          <BaseDateInput v-model="editBatchForm.registration_end" label="Tanggal Pendaftaran Selesai" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseDateInput v-model="editBatchForm.announcement_date" label="Tanggal Pengumuman Hasil" required />
          <BaseInput v-model.number="editBatchForm.quota" type="number" label="Kuota Penerimaan (Siswa)" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model.number="editBatchForm.registration_fee" type="number" label="Biaya Pendaftaran (Rp)" required />
          <BaseInput v-model="editBatchForm.slug" label="URL Slug Kustom" required />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Informasi / Deskripsi Singkat</label>
          <textarea v-model="editBatchForm.description" rows="3" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-xl">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Status Gelombang</label>
            <select v-model="editBatchForm.status" class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold">
              <option value="draft">Draft</option>
              <option value="open">Buka (Open)</option>
              <option value="closed">Tutup (Closed)</option>
              <option value="announced">Diumumkan (Announced)</option>
            </select>
          </div>
          <div class="flex items-center pt-5">
            <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 select-none cursor-pointer">
              <input type="checkbox" v-model="editBatchForm.is_public" class="rounded border-slate-300 text-violet-600 focus:ring-violet-600" />
              <span>Publik (Dapat diakses)</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton type="button" variant="outline" @click="showEditBatchModal = false" class="py-2 px-4 text-xs font-semibold">
            Batal
          </BaseButton>
          <BaseButton type="submit" variant="primary" class="py-2 px-4 text-xs font-bold">
            Simpan Perubahan
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Custom Fields Form Builder Modal -->
    <BaseModal :show="showFieldsBuilderModal" :title="`Form Builder - ${selectedBatchForFields?.name || ''}`" width="large" @close="showFieldsBuilderModal = false">
      <div class="space-y-6">
        <div class="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
          <HelpCircle class="shrink-0 text-amber-600 mt-0.5" :size="16" />
          <div>
            <p class="font-bold">Panduan Form Builder:</p>
            <p class="mt-1">Secara default, formulir pendaftaran <strong>selalu memuat field wajib standar</strong>: Nama Lengkap Siswa, Nama Orang Tua/Wali, dan Nomor WhatsApp. Gunakan form builder di bawah ini untuk menambahkan pertanyaan tambahan sesuai kebutuhan (seperti asal sekolah, golongan darah, pilihan program, dll.).</p>
          </div>
        </div>

        <!-- Read-Only Standard System Fields -->
        <div class="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-850 p-4 rounded-xl space-y-3">
          <h4 class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Field Standar Sistem (Wajib & Otomatis)</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 p-3 rounded-lg flex items-center justify-between text-xs shadow-sm">
              <span class="font-bold text-slate-700 dark:text-zinc-300">Nama Lengkap Siswa</span>
              <span class="text-[9px] font-bold text-violet-600 bg-violet-600/10 px-2 py-0.5 rounded-full">Text (Wajib)</span>
            </div>
            <div class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 p-3 rounded-lg flex items-center justify-between text-xs shadow-sm">
              <span class="font-bold text-slate-700 dark:text-zinc-300">Nama Orang Tua/Wali</span>
              <span class="text-[9px] font-bold text-violet-600 bg-violet-600/10 px-2 py-0.5 rounded-full">Text (Wajib)</span>
            </div>
            <div class="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 p-3 rounded-lg flex items-center justify-between text-xs shadow-sm">
              <span class="font-bold text-slate-700 dark:text-zinc-300">Nomor WA Orang Tua</span>
              <span class="text-[9px] font-bold text-violet-600 bg-violet-600/10 px-2 py-0.5 rounded-full">Text/Phone (Wajib)</span>
            </div>
          </div>
        </div>

        <!-- Custom Questions List -->
        <div class="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          <div v-if="customFields.length === 0" class="text-center py-10 bg-slate-50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
            <p class="text-xs text-slate-400 dark:text-zinc-500">Belum ada pertanyaan tambahan kustom. Klik tombol "+ Tambah Pertanyaan" di bawah.</p>
          </div>

          <div v-else v-for="(field, idx) in customFields" :key="field.id || idx" class="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm relative group space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <!-- Row 1: Key, Label & Type -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div class="md:col-span-3 flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Key Field (Unik, huruf kecil & _)</label>
                <input v-model="field.field_key" type="text" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600" placeholder="e.g. asal_sekolah" required />
              </div>
              
              <div class="md:col-span-4 flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pertanyaan / Label Form</label>
                <input v-model="field.label" type="text" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600" placeholder="e.g. Asal Sekolah Calon Siswa" required />
              </div>

              <div class="md:col-span-4 flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tipe Input</label>
                <select v-model="field.field_type" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none">
                  <option value="text">Text (Satu Baris)</option>
                  <option value="textarea">Textarea (Banyak Baris)</option>
                  <option value="number">Angka (Number)</option>
                  <option value="date">Tanggal (Date)</option>
                  <option value="select">Dropdown Select (Pilihan)</option>
                  <option value="radio">Radio Buttons (Pilihan Tunggal)</option>
                </select>
              </div>

              <!-- Action Controls -->
              <div class="md:col-span-1 flex gap-1 justify-end pb-0.5">
                <button type="button" @click="moveField(idx, 'up')" :disabled="idx === 0" class="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 disabled:opacity-30">
                  <ArrowUp :size="12" />
                </button>
                <button type="button" @click="moveField(idx, 'down')" :disabled="idx === customFields.length - 1" class="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 disabled:opacity-30">
                  <ArrowDown :size="12" />
                </button>
              </div>
            </div>

            <!-- Row 2: Placeholder, Help text & Required checkbox -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-50 dark:border-zinc-850/50">
              <div class="md:col-span-4 flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Placeholder (Petunjuk di kolom)</label>
                <input v-model="field.placeholder" type="text" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none" placeholder="e.g. Masukkan nama sekolah asal" />
              </div>
              <div class="md:col-span-5 flex flex-col gap-1">
                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sub-Text / Deskripsi Bantuan</label>
                <input v-model="field.help_text" type="text" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none" placeholder="Teks bantuan kecil di bawah kolom..." />
              </div>
              <div class="md:col-span-2 flex items-center pb-2.5">
                <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-400 select-none cursor-pointer">
                  <input type="checkbox" v-model="field.is_required" class="rounded border-slate-350 text-violet-600" />
                  <span>Wajib diisi</span>
                </label>
              </div>
              <div class="md:col-span-1 flex justify-end pb-1.5">
                <button type="button" @click="removeCustomField(idx)" class="p-2 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-rose-950 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center justify-center">
                  <Trash2 :size="12" />
                </button>
              </div>
            </div>

            <!-- Row 3: Options List (Only for Select or Radio field types) -->
            <div v-if="['select', 'radio'].includes(field.field_type)" class="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-lg border border-slate-100 dark:border-zinc-850 space-y-2.5">
              <div class="flex justify-between items-center">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Opsi Pilihan Jawaban</span>
                <BaseButton type="button" variant="outline" @click="addOption(idx)" class="py-1 px-2 text-[10px] font-bold">
                  + Tambah Opsi
                </BaseButton>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <div v-for="(opt, optIdx) in field.options" :key="optIdx" class="flex gap-1.5 items-center bg-white dark:bg-zinc-950 p-2 border border-slate-200 dark:border-zinc-800 rounded-md">
                  <input v-model="opt.value" type="text" class="w-1/2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 text-[10px] outline-none" placeholder="Value (e.g. A)" required />
                  <input v-model="opt.label" type="text" class="w-1/2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 text-[10px] outline-none" placeholder="Label (e.g. Program A)" required />
                  <button type="button" @click="removeOption(idx, optIdx)" class="text-rose-500 hover:text-rose-700 p-1">
                    <X :size="10" />
                  </button>
                </div>
              </div>
              <p v-if="!field.options || field.options.length === 0" class="text-[10px] text-rose-500 font-semibold">Sediakan minimal 1 opsi jawaban untuk input bertipe Pilihan.</p>
            </div>
          </div>
        </div>

        <!-- Add Field Control -->
        <div class="flex justify-start">
          <BaseButton type="button" variant="outline" @click="addCustomField" class="py-2.5 px-4 text-xs font-bold border-violet-600/30 text-violet-600 hover:bg-violet-600/5">
            + Tambah Pertanyaan Kustom
          </BaseButton>
        </div>

        <div class="flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton type="button" variant="outline" @click="showFieldsBuilderModal = false" class="py-2 px-4 text-xs font-semibold">
            Batal
          </BaseButton>
          <BaseButton type="button" variant="primary" @click="handleSaveFields" class="py-2 px-4 text-xs font-bold flex items-center gap-1.5">
            <Save :size="14" /> Simpan Konfigurasi Formulir
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
