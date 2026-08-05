<script setup lang="ts">
import { useSchoolContext } from '../../composables/useSchoolContext'
import { useAcademicYear } from '../../composables/useAcademicYear'
import { 
  CreditCard, 
  Plus, 
  Search, 
  FileText, 
  DollarSign, 
  Activity, 
  Coins, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Layers,
  Building,
  Wrench,
  FileSpreadsheet,
  Trash2,
  Printer,
  Download,
  Scale,
  Upload,
  X
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput, BaseDateInput } from '@eduraport/ui'
import CashierDrawer from '../../components/financial/CashierDrawer.vue'
import BalanceSheetReport from '../../components/financial/BalanceSheetReport.vue'
import IncomeStatementReport from '../../components/financial/IncomeStatementReport.vue'
import BosK7aReport from '../../components/financial/BosK7aReport.vue'
import FoundationReport from '../../components/financial/FoundationReport.vue'
import { useClass } from '../../composables/useClass'
import { useFinancial } from '../../composables/useFinancial'
import { useToast } from '../../composables/useToast'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ASSET_CATEGORIES, DEPRECIATION_METHODS } from '@eduraport/shared'
import { formatNumber, formatDate } from '~/utils/format'

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

const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { academicYears, fetchAcademicYears } = useAcademicYear()
const { classes, fetchClasses } = useClass()
const { 
  billsList, 
  accountsList, 
  journalsList, 
  journalsMeta,
  categoriesList,
  assetsList,
  fetchBills, 
  previewBulkSPP,
  generateBulkSPP, 
  recordPayment, 
  fetchAccounts, 
  fetchJournals,
  fetchCategories,
  fetchAssets,
  createAsset,
  deleteAsset,
  downloadTemplate,
  importAssets,
  fetchBalanceSheet,
  fetchIncomeStatement,
  fetchBOSReport,
  fetchFoundationReport,
  createManualJournal
} = useFinancial()
const toast = useToast()

const selectedClassId = ref('')
const filterStatus = ref('') // all, pending, paid

const activeTab = ref('bills') // bills, journals, accounts, reports, assets
const activeReportSubTab = ref('balance-sheet') // balance-sheet, income-statement, bos, foundation
const journalCurrentPage = ref(1)
const journalItemsPerPage = ref(50)
const loading = ref(false)

// Reports data states
const balanceSheetData = ref<any>(null)
const incomeStatementData = ref<any>(null)
const bosReportData = ref<any>(null)
const foundationReportData = ref<any>(null)

// Assets state & modal
const showAssetModal = ref(false)
const showAssetImportModal = ref(false)
const assetImportFile = ref<File | null>(null)
const assetImportLoading = ref(false)
const assetImportResult = ref<{ success: number; failed: number; errors: string[] } | null>(null)
const assetDownloadLoading = ref(false)

const handleAssetDownloadTemplate = async () => {
  if (!selectedSchoolId.value) return
  assetDownloadLoading.value = true
  try {
    await downloadTemplate(selectedSchoolId.value)
  } catch (e: any) {
    toast.error(e?.message ?? 'Gagal mengunduh template', 'Gagal')
  } finally {
    assetDownloadLoading.value = false
  }
}

const onAssetFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  assetImportFile.value = target.files?.[0] ?? null
  assetImportResult.value = null
}

const handleAssetImport = async () => {
  if (!assetImportFile.value || !selectedSchoolId.value) return
  assetImportLoading.value = true
  assetImportResult.value = null
  try {
    const res: any = await importAssets(selectedSchoolId.value, assetImportFile.value)
    assetImportResult.value = res.data
    toast.success('Data aset berhasil diimport', 'Sukses')
  } catch (e: any) {
    if (e.data?.errors) {
      const errorList = Object.entries(e.data.errors).flatMap(([field, msgs]: any) =>
        msgs.map((msg: string) => `${field}: ${msg}`)
      )
      assetImportResult.value = {
        success: 0,
        failed: errorList.length,
        errors: errorList
      }
    } else {
      toast.error(e?.message ?? 'Import gagal', 'Gagal')
    }
  } finally {
    assetImportLoading.value = false
  }
}

const assetForm = reactive({
  name: '',
  code: '',
  category: 'electronic',
  purchase_date: new Date().toISOString().substring(0, 10),
  purchase_cost: '',
  quantity: 1,
  condition: 'good',
  location: '',
  depreciation_method: 'straight_line',
  useful_life_years: 5
})

// Journal entry modal & form
const showJournalModal = ref(false)
const journalForm = reactive({
  date: new Date().toISOString().substring(0, 10),
  description: '',
  debit_account_id: '',
  credit_account_id: '',
  amount: '',
  reference: '',
  funding_source: 'yayasan',
  bos_component_id: ''
})

// Reversal state
const showReversalModal = ref(false)
const reversalForm = reactive({
  txRef: '',
  reason: ''
})

// Period Lock state
const showPeriodLockModal = ref(false)
const periodLockForm = reactive({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})
const lockedPeriods = ref<any[]>([])

// Grouped Bills & Details Modal States
const showCashierDrawer = ref(false)
const activeStudentId = ref('')
const activeStudentName = ref('')

const groupedBills = computed(() => {
  const groups: Record<string, {
    student_id: string
    student_name: string
    student_nis: string | null
    class_name: string | null
    bills: any[]
    total_amount: number
    unpaid_amount: number
    status: 'paid' | 'pending'
  }> = {}

  for (const bill of billsList.value) {
    const studentId = bill.student_id
    if (!groups[studentId]) {
      groups[studentId] = {
        student_id: studentId,
        student_name: bill.student_name,
        student_nis: bill.student_nis,
        class_name: bill.class_name,
        bills: [],
        total_amount: 0,
        unpaid_amount: 0,
        status: 'paid'
      }
    }

    groups[studentId].bills.push(bill)
    const amt = Number(bill.amount) || 0
    const paidAmt = Number(bill.amount_paid) || 0
    groups[studentId].total_amount += amt
    
    const unpaid = Math.max(0, amt - paidAmt)
    groups[studentId].unpaid_amount += unpaid
    if (unpaid > 0) {
      groups[studentId].status = 'pending'
    }
  }

  return Object.values(groups).sort((a, b) => a.student_name.localeCompare(b.student_name))
})

const billsSummary = computed(() => {
  let tertagihkan = 0
  let tertagih = 0
  let outstanding = 0
  let unpaidCount = 0

  for (const bill of billsList.value) {
    const amt = Number(bill.amount) || 0
    const paidAmt = Number(bill.amount_paid) || 0
    tertagihkan += amt
    tertagih += paidAmt
    
    const unpaid = Math.max(0, amt - paidAmt)
    if (unpaid > 0) {
      outstanding += unpaid
      unpaidCount++
    }
  }

  const tertagihPct = tertagihkan > 0 ? Math.round((tertagih / tertagihkan) * 100) : 0

  return { tertagihkan, tertagih, outstanding, tertagihPct, unpaidCount }
})

const journalsGlobalTotal = computed(() => {
  return { 
    debit: Number(journalsMeta.value?.total_debit) || 0, 
    credit: Number(journalsMeta.value?.total_credit) || 0 
  }
})

const journalsPageTotal = computed(() => {
  let debit = 0
  let credit = 0
  for (const j of journalsList.value) {
    if (!j.reversed_by_tx) {
      debit += Number(j.debit) || 0
      credit += Number(j.credit) || 0
    }
  }
  return { debit, credit }
})

const activeStudent = computed(() => {
  return groupedBills.value.find(s => s.student_id === activeStudentId.value) || null
})

// SPP Gen Modal
const showSPPModal = ref(false)
const sppForm = reactive({
  class_ids: [] as string[],
  period: new Date().toISOString().substring(0, 7), // YYYY-MM
  amount: '450000',
  due_date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().substring(0, 10), // YYYY-MM-DD
  category_id: ''
})

// Generate upcoming periods for dropdown (from 2 months ago to 10 months ahead)
const periodOptions = computed(() => {
  const options = []
  const today = new Date()
  for (let i = -2; i <= 10; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const value = d.toISOString().substring(0, 7) // YYYY-MM
    const label = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d)
    options.push({ value, label })
  }
  return options
})

const previewData = ref<any>(null)
const isPreviewLoading = ref(false)

let previewTimeout: any = null
watch(sppForm, (newVal) => {
  if (!selectedSchoolId.value || newVal.class_ids.length === 0 || !newVal.category_id || !newVal.period || !newVal.amount) {
    previewData.value = null
    return
  }
  
  if (previewTimeout) clearTimeout(previewTimeout)
  previewTimeout = setTimeout(async () => {
    isPreviewLoading.value = true
    try {
      const res = await previewBulkSPP(selectedSchoolId.value, {
        class_ids: newVal.class_ids,
        period: newVal.period,
        amount: newVal.amount,
        due_date: newVal.due_date,
        category_id: newVal.category_id
      })
      if (res.success) {
        previewData.value = res.data
      }
    } catch (err) {
      console.error('Failed to preview SPP', err)
      previewData.value = null
    } finally {
      isPreviewLoading.value = false
    }
  }, 500)
}, { deep: true })

// Asset totals helper
const assetTotals = computed(() => {
  const list = assetsList.value || []
  const totalVal = list.reduce((sum, item) => sum + (Number(item.purchase_cost) * Number(item.quantity)), 0)
  const totalQty = list.reduce((sum, item) => sum + Number(item.quantity), 0)
  const goodQty = list.filter(item => item.condition === 'good').reduce((sum, item) => sum + Number(item.quantity), 0)
  return {
    value: totalVal,
    qty: totalQty,
    good: goodQty
  }
})

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadSchoolData(schoolId)
  }
})

const loadReports = async (schoolId: string) => {
  try {
    const [bs, inc, bos] = await Promise.all([
      fetchBalanceSheet(schoolId),
      fetchIncomeStatement(schoolId),
      fetchBOSReport(schoolId)
    ])
    balanceSheetData.value = bs.data
    incomeStatementData.value = inc.data
    bosReportData.value = bos.data
    
    if (selectedFoundationId.value) {
      const fd = await fetchFoundationReport(schoolId, selectedFoundationId.value)
      foundationReportData.value = fd.data
    }
  } catch (err) {
    console.error('Failed to load accounting reports:', err)
  }
}

const loadSchoolData = async (schoolId: string) => {
  loading.value = true
  try {
    await fetchAcademicYears(schoolId)
    const activeYear = academicYears.value.find(y => y.is_active)
    await fetchClasses(schoolId, activeYear ? activeYear.id : undefined)
    
    await Promise.all([
      fetchAccounts(schoolId),
      fetchJournals(schoolId, journalCurrentPage.value, journalItemsPerPage.value),
      fetchCategories(schoolId),
      fetchAssets(schoolId),
      loadReports(schoolId)
    ])
  } catch (error) {
    console.error('Failed loading school data:', error)
  } finally {
    loading.value = false
  }
}

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    selectedClassId.value = ''
    await loadSchoolData(newVal)
  } else {
    classes.value = []
    billsList.value = []
  }
})

const loadBills = async () => {
  if (!selectedSchoolId.value) {
    billsList.value = []
    return
  }
  loading.value = true
  try {
    const filters: any = {}
    if (selectedClassId.value) filters.class_id = selectedClassId.value
    if (filterStatus.value) filters.status = filterStatus.value

    await fetchBills(selectedSchoolId.value, filters)
  } catch (error: any) {
    toast.error(error.message || 'Gagal memuat tagihan SPP.', 'Gagal')
  } finally {
    loading.value = false
  }
}

watch([selectedSchoolId, selectedClassId, filterStatus], async () => {
  await loadBills()
})

const openSPPModal = () => {
  sppForm.class_id = selectedClassId.value
  if (categoriesList.value.length > 0) {
    sppForm.category_id = categoriesList.value[0].id
  } else {
    sppForm.category_id = ''
  }
  showSPPModal.value = true
}

const openCashierDrawer = (student: any) => {
  activeStudentId.value = student.student_id
  activeStudentName.value = student.student_name
  showCashierDrawer.value = true
}

const loadJournalsPage = async (page: number) => {
  if (page < 1 || page > Math.ceil(journalsMeta.value.total / journalItemsPerPage.value)) return
  journalCurrentPage.value = page
  loading.value = true
  try {
    await fetchJournals(selectedSchoolId.value, journalCurrentPage.value, journalItemsPerPage.value)
  } finally {
    loading.value = false
  }
}

const handlePaymentSuccess = () => {
  // refresh bills and journals
  if (selectedSchoolId.value) {
    fetchBills(selectedSchoolId.value)
    fetchJournals(selectedSchoolId.value, journalCurrentPage.value, journalItemsPerPage.value)
  }
}
const handleGenerateSPP = async () => {
  if (!selectedSchoolId.value || sppForm.class_ids.length === 0) {
    toast.error('Pilih kelas rombel terlebih dahulu.', 'Validasi')
    return
  }

  try {
    const res = await generateBulkSPP(selectedSchoolId.value, {
      class_ids: sppForm.class_ids,
      period: sppForm.period,
      amount: sppForm.amount,
      due_date: sppForm.due_date,
      category_id: sppForm.category_id
    })

    if (res.success) {
      toast.success(`Berhasil membuat ${res.data.billedCount} tagihan SPP baru.`, 'Berhasil')
      showSPPModal.value = false
      sppForm.class_ids = [] // reset form
      await loadBills()
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal membuat tagihan SPP.', 'Gagal')
  }
}
// Asset Management logic
const handleCreateAsset = async () => {
  if (!selectedSchoolId.value) return
  try {
    const res = await getStudentBilling(selectedSchoolId.value)
    if (res.success) {
      studentBillsList.value = res.data
    }
    const locks = await getLockedPeriods(selectedSchoolId.value)
    lockedPeriods.value = locks
  } catch (error) {
    console.error('Error loading student bills:', error)
  }
  try {
    const res = await createAsset(selectedSchoolId.value, { ...assetForm })
    if (res.success) {
      toast.success('Aset sekolah berhasil didaftarkan.', 'Berhasil')
      showAssetModal.value = false
      // Reset form
      assetForm.name = ''
      assetForm.code = ''
      assetForm.category = 'electronic'
      assetForm.purchase_cost = ''
      assetForm.quantity = 1
      assetForm.condition = 'good'
      assetForm.location = ''
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal mendaftarkan aset.', 'Gagal')
  }
}

const handleDeleteAsset = async (assetId: string) => {
  if (!selectedSchoolId.value) return
  if (!confirm('Apakah Anda yakin ingin menghapus aset ini?')) return
  try {
    const res = await deleteAsset(selectedSchoolId.value, assetId)
    if (res.success) {
      toast.success('Aset berhasil dihapus.', 'Berhasil')
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menghapus aset.', 'Gagal')
  }
}

const formattedAmount = ref('')

watch(formattedAmount, (newVal) => {
  const cleanVal = newVal.replace(/\D/g, '')
  if (!cleanVal) {
    journalForm.amount = ''
    formattedAmount.value = ''
    return
  }
  const formatted = Number(cleanVal).toLocaleString('id-ID')
  formattedAmount.value = formatted
  journalForm.amount = cleanVal
})

const handleCreateJournal = async () => {
  if (!selectedSchoolId.value) return

  try {
    const res = await createManualJournal(selectedSchoolId.value, journalForm)
    if (res.success) {
      toast.success('Jurnal umum berhasil dicatat.', 'Berhasil')
      showJournalModal.value = false
      journalForm.description = ''
      journalForm.amount = ''
      journalForm.reference = ''
      journalForm.bos_component_id = ''
      await loadJournals()
      await loadAccounts()
      await loadReports(selectedSchoolId.value)
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal mencatat jurnal umum.', 'Gagal')
  }
}

const promptReverseJournal = (journal: any) => {
  if (journal.origin === 'reversal' || journal.reversed_by_tx) {
    toast.error('Jurnal ini tidak bisa dikoreksi lagi.')
    return
  }
  reversalForm.txRef = journal.reference
  reversalForm.reason = ''
  showReversalModal.value = true
}

const submitReversal = async () => {
  if (!selectedSchoolId.value || !reversalForm.txRef) return
  try {
    const res = await reverseJournal(selectedSchoolId.value, reversalForm.txRef, reversalForm.reason)
    if (res.success) {
      toast.success('Jurnal berhasil dikoreksi.', 'Berhasil')
      showReversalModal.value = false
      await loadJournals()
      await loadAccounts()
      await loadReports(selectedSchoolId.value)
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal mengoreksi jurnal.', 'Gagal')
  }
}

const handlePeriodLock = async () => {
  if (!selectedSchoolId.value) return
  try {
    const res = await lockPeriod(selectedSchoolId.value, Number(periodLockForm.year), Number(periodLockForm.month))
    if (res.success) {
      toast.success(res.message || 'Periode berhasil ditutup.', 'Berhasil')
      showPeriodLockModal.value = false
      const locks = await getLockedPeriods(selectedSchoolId.value)
      lockedPeriods.value = locks
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menutup periode buku.', 'Gagal')
  }
}

// Simulated Export Action
const exportReport = (format: 'pdf' | 'xlsx') => {
  toast.success(`Laporan sedang diekspor ke format ${format.toUpperCase()}...`, 'Export Berhasil')
  // Simulated download triggers
  const blob = new Blob(['Export Data'], { type: 'application/octet-stream' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Laporan_${activeReportSubTab.value}_${Date.now()}.${format}`
  a.click()
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Keuangan Sekolah</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur tagihan SPP bulanan, pembayaran uang sekolah, dan pantau jurnal akuntansi double-entry terpus.</p>
      </div>
      <div class="flex gap-2 flex-wrap" v-if="selectedSchoolId && activeTab === 'bills'">
        <BaseButton variant="primary" @click="openSPPModal" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Plus class="mr-1.5" :size="14" /> Buat Tagihan SPP Massal
        </BaseButton>
      </div>
      <div class="flex gap-2 flex-wrap" v-if="selectedSchoolId && activeTab === 'journals'">
        <BaseButton variant="outline" @click="showPeriodLockModal = true" class="py-2.5 px-4 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/20">
          <Lock class="mr-1.5" :size="14" /> Tutup Buku Bulanan
        </BaseButton>
        <BaseButton variant="primary" @click="showJournalModal = true" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Plus class="mr-1.5" :size="14" /> Tambah Jurnal Umum
        </BaseButton>
      </div>
      <div class="flex gap-2 flex-wrap" v-if="selectedSchoolId && activeTab === 'assets'">
        <BaseButton variant="outline" @click="handleAssetDownloadTemplate" :disabled="assetDownloadLoading" class="py-2.5 px-4 text-xs font-bold">
          <Download class="mr-1.5" :size="14" /> {{ assetDownloadLoading ? 'Mengunduh...' : 'Unduh Template' }}
        </BaseButton>
        <BaseButton variant="outline" @click="showAssetImportModal = true" class="py-2.5 px-4 text-xs font-bold">
          <Upload class="mr-1.5" :size="14" /> Import Excel
        </BaseButton>
        <BaseButton variant="primary" @click="showAssetModal = true" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Plus class="mr-1.5" :size="14" /> Tambah Aset Sekolah
        </BaseButton>
      </div>
    </div>

    <!-- Filters Bar -->
    <div v-if="!isSchoolLocked" class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5" v-if="activeTab === 'bills'">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Kelas</label>
        <select v-model="selectedClassId" :disabled="!selectedSchoolId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="">Semua Kelas</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5" v-if="activeTab === 'bills'">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Status Tagihan</label>
        <select v-model="filterStatus" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-violet-600">
          <option value="">Semua Status</option>
          <option value="pending">Belum Lunas (Pending)</option>
          <option value="paid">Lunas (Paid)</option>
        </select>
      </div>
    </div>

    <!-- Active Workspace -->
    <div v-if="!selectedSchoolId" class="bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-16 text-center text-slate-400 dark:text-zinc-500">
      <DollarSign class="mx-auto mb-3 opacity-40 text-violet-600" :size="40" />
      <h3 class="font-bold text-slate-700 dark:text-zinc-300 text-sm">Pilih Unit Sekolah Terlebih Dahulu</h3>
      <p class="text-xs mt-1 max-w-sm mx-auto">Gunakan filter di atas untuk memuat data transaksi keuangan dan tagihan SPP sekolah.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Tabs -->
      <div class="flex border-b border-slate-200 dark:border-zinc-800/80 gap-6 overflow-x-auto">
        <button 
          @click="activeTab = 'bills'" 
          class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap"
          :class="[activeTab === 'bills' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300']"
        >
          <CreditCard :size="14" /> Tagihan SPP Siswa
        </button>
        <button 
          @click="activeTab = 'journals'" 
          class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap"
          :class="[activeTab === 'journals' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300']"
        >
          <FileText :size="14" /> Jurnal Umum (Ledger)
        </button>
        <button 
          @click="activeTab = 'accounts'" 
          class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap"
          :class="[activeTab === 'accounts' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300']"
        >
          <Layers :size="14" /> COA & Saldo Rekening
        </button>
        <button 
          @click="activeTab = 'reports'" 
          class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap"
          :class="[activeTab === 'reports' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300']"
        >
          <Scale :size="14" /> Laporan Keuangan
        </button>
        <button 
          @click="activeTab = 'assets'" 
          class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap"
          :class="[activeTab === 'assets' ? 'border-violet-600 text-violet-600 dark:text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300']"
        >
          <Wrench :size="14" /> Manajemen Aset
        </button>
      </div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="py-20 text-center text-slate-400">
        <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mx-auto mb-3"></div>
        <p class="text-xs font-semibold">Memuat data keuangan...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Tab Content 1: SPP Bills -->
        <div v-if="activeTab === 'bills'" class="space-y-4 animate-in fade-in duration-300">
          
          <!-- Summary Cards from Prototype -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4" v-if="billsList.length > 0">
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-1">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tertagihkan</span>
              <p class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 font-mono">{{ formatNumber(billsSummary.tertagihkan) }}</p>
              <p class="text-[10px] text-slate-400 font-medium mt-1">Total Tagihan Keseluruhan</p>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-1">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tertagih</span>
              <p class="text-xl font-extrabold text-emerald-600 dark:text-emerald-450 font-mono">{{ formatNumber(billsSummary.tertagih) }}</p>
              <p class="text-[10px] text-slate-400 font-medium mt-1">{{ billsSummary.tertagihPct }}% dari tertagihkan</p>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-1">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Total</span>
              <p class="text-xl font-extrabold text-rose-600 dark:text-rose-450 font-mono">{{ formatNumber(billsSummary.outstanding) }}</p>
              <p class="text-[10px] text-slate-400 font-medium mt-1">{{ billsSummary.unpaidCount }} tagihan belum lunas</p>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-1">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Aging Tunggakan</span>
              <div class="flex h-10 w-full rounded-md overflow-hidden text-[10px] font-bold text-center leading-[40px]">
                <div class="bg-amber-100 text-amber-700 flex-1 border-r border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" title="≤30 Hari">≤30h</div>
                <div class="bg-orange-100 text-orange-700 flex-1 border-r border-orange-200/50 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" title="31-90 Hari">31-90</div>
                <div class="bg-rose-100 text-rose-700 flex-1 dark:bg-rose-500/10 dark:text-rose-400" title=">90 Hari">>90</div>
              </div>
            </div>
          </div>

          <div v-if="billsList.length === 0" class="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
            <Info class="mx-auto mb-2 text-violet-500 opacity-60" :size="30" />
            <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">Belum Ada Tagihan SPP</p>
            <p class="text-[10px] mt-1">Gunakan tombol 'Buat Tagihan SPP Bulanan' untuk menambahkan tagihan kelas.</p>
          </div>

          <div v-else class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    <th class="p-4 pl-6">Nama Siswa</th>
                    <th class="p-4">Kelas</th>
                    <th class="p-4">Jumlah Tagihan</th>
                    <th class="p-4">Sisa Tagihan</th>
                    <th class="p-4">Status</th>
                    <th class="p-4 text-center pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/80 font-medium">
                  <tr v-for="student in groupedBills" :key="student.student_id" class="hover:bg-slate-50/30 dark:hover:bg-zinc-950/20 transition-all text-slate-700 dark:text-zinc-300">
                    <td class="p-4 pl-6 font-bold text-slate-800 dark:text-zinc-200">{{ student.student_name }}</td>
                    <td class="p-4">{{ student.class_name || '-' }}</td>
                    <td class="p-4 font-mono font-bold">{{ formatNumber(student.total_amount) }}</td>
                    <td class="p-4 font-mono font-bold" :class="student.unpaid_amount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-450'">
                      {{ formatNumber(student.unpaid_amount) }}
                    </td>
                    <td class="p-4">
                      <span 
                        class="px-2 py-0.5 rounded-full text-[9px] font-extrabold border"
                        :class="[
                          student.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        ]"
                      >
                        {{ student.status === 'paid' ? 'Lunas' : 'Belum Lunas' }}
                      </span>
                    </td>
                    <td class="p-4 text-center pr-6">
                      <button @click="openCashierDrawer(student)" class="text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
                        Rincian & Bayar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Content 2: Jurnal Umum -->
        <div v-else-if="activeTab === 'journals'" class="space-y-4 animate-in fade-in duration-300">
          <div v-if="journalsList.length === 0" class="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
            <Info class="mx-auto mb-2 text-violet-500 opacity-60" :size="30" />
            <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">Jurnal Masih Kosong</p>
            <p class="text-[10px] mt-1">Pembayaran SPP yang diselesaikan akan otomatis dibukukan ke dalam jurnal double-entry ini.</p>
          </div>

          <div v-else class="space-y-4">
            <!-- Global Totals Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-1">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Debit Terfilter</span>
                <p class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 font-mono">{{ formatNumber(journalsGlobalTotal.debit) }}</p>
                <p class="text-[10px] text-slate-400 font-medium mt-1">Total seluruh data yang sesuai filter</p>
              </div>
              <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-1">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Kredit Terfilter</span>
                <p class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 font-mono">{{ formatNumber(journalsGlobalTotal.credit) }}</p>
                <div class="flex items-center justify-between mt-1">
                  <p class="text-[10px] text-slate-400 font-medium">Total seluruh data yang sesuai filter</p>
                  <span 
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full" 
                    :class="journalsGlobalTotal.debit === journalsGlobalTotal.credit ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-amber-500/10 text-amber-600 dark:text-amber-500'"
                  >
                    {{ journalsGlobalTotal.debit === journalsGlobalTotal.credit ? '✓ Seimbang' : '⚠ Tidak Seimbang' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    <th class="p-4 pl-6">Tanggal</th>
                    <th class="p-4">Keterangan / Deskripsi</th>
                    <th class="p-4">Rekening COA</th>
                    <th class="p-4">Debit</th>
                    <th class="p-4">Kredit</th>
                    <th class="p-4">Sumber</th>
                    <th class="p-4">Asal</th>
                    <th class="p-4">Referensi</th>
                    <th class="p-4 pr-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/80 text-slate-700 dark:text-zinc-300">
                  <tr v-for="j in journalsList" :key="j.id" class="hover:bg-slate-50/30 dark:hover:bg-zinc-950/20 transition-all font-medium">
                    <td class="p-4 pl-6 text-slate-500 whitespace-nowrap">{{ formatDate(j.date) }}</td>
                    <td class="p-4 font-semibold">{{ j.description }}</td>
                    <td class="p-4">
                      <span class="font-mono bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-[10px]">
                        {{ j.account_code }} - {{ j.account_name }}
                      </span>
                    </td>
                    <td class="p-4 font-mono font-bold text-slate-800 dark:text-zinc-200" :class="{'line-through opacity-50': j.reversed_by_tx}">
                      {{ Number(j.debit) > 0 ? formatNumber(j.debit) : '-' }}
                    </td>
                    <td class="p-4 font-mono font-bold text-slate-850 dark:text-zinc-300" :class="{'line-through opacity-50': j.reversed_by_tx}">
                      {{ Number(j.credit) > 0 ? formatNumber(j.credit) : '-' }}
                    </td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border"
                        :class="j.funding_source?.startsWith('bos') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'"
                      >
                        {{ j.funding_source?.replace('_', ' ') || '-' }}
                      </span>
                    </td>
                    <td class="p-4">
                      <span 
                        class="px-2 py-0.5 w-max rounded text-[9px] font-extrabold uppercase"
                        :class="[
                          j.origin === 'auto' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                          j.origin === 'reversal' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                          'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        ]"
                      >
                        {{ j.origin === 'auto' ? 'Otomatis' : j.origin === 'reversal' ? 'Koreksi' : 'Manual' }}
                      </span>
                    </td>
                    <td class="p-4 font-mono text-[10px] text-slate-400">
                      {{ j.reference || '-' }}
                      <span v-if="j.reversed_by_tx" class="block text-[9px] text-rose-500 mt-0.5">Dibatalkan oleh {{ j.reversed_by_tx }}</span>
                    </td>
                    <td class="p-4 pr-6 text-center">
                      <button 
                        v-if="j.origin !== 'reversal' && !j.reversed_by_tx"
                        @click="promptReverseJournal(j)" 
                        class="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                        title="Koreksi (Jurnal Pembalik)"
                      >
                        Koreksi
                      </button>
                    </td>
                  </tr>
                  
                  <!-- TOTAL ROW -->
                  <tr class="bg-slate-50/50 dark:bg-zinc-900/50">
                    <td colspan="3" class="p-4 pl-6 font-extrabold text-slate-800 dark:text-zinc-200">TOTAL HALAMAN INI</td>
                    <td class="p-4 font-mono font-extrabold text-slate-800 dark:text-zinc-200">{{ formatNumber(journalsPageTotal.debit) }}</td>
                    <td class="p-4 font-mono font-extrabold text-slate-800 dark:text-zinc-200">{{ formatNumber(journalsPageTotal.credit) }}</td>
                    <td colspan="4" class="p-4 pr-6 font-extrabold" :class="journalsPageTotal.debit === journalsPageTotal.credit ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'">
                      <span v-if="journalsPageTotal.debit === journalsPageTotal.credit">✓ Seimbang</span>
                      <span v-else>⚠ Tidak Seimbang</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </div>
          
          <div v-if="journalsMeta.total > 0" class="mt-4">
            <AppPagination
              v-model:page="journalCurrentPage"
              v-model:itemPerPage="journalItemsPerPage"
              :total-item="journalsMeta.total"
              :total-page="Math.ceil(journalsMeta.total / journalItemsPerPage)"
              @update:page="loadJournalsPage($event)"
              @update:itemPerPage="journalCurrentPage = 1; loadJournalsPage(1)"
            />
          </div>

          <p class="text-[11px] text-slate-500 mt-2">Jurnal bersifat <b>append-only</b> — tidak ada edit/hapus. Salah catat → aksi "Koreksi" membuat jurnal pembalik (contoh baris KOREKSI di atas) + entri baru yang benar.</p>
        </div>

        <!-- Tab Content 3: COA accounts -->
        <div v-else-if="activeTab === 'accounts'" class="space-y-4 animate-in fade-in duration-300">
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    <th class="p-4 pl-6">Kode Rekening</th>
                    <th class="p-4">Nama Akun</th>
                    <th class="p-4">Tipe Klasifikasi</th>
                    <th class="p-4 pr-6 text-right">Saldo Saat Ini (derivasi jurnal)</th>
                    <th class="p-4"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/80 font-medium">
                  <tr v-for="acc in accountsList" :key="acc.id" class="hover:bg-slate-50/30 dark:hover:bg-zinc-950/20 transition-all text-slate-700 dark:text-zinc-300">
                    <td class="p-4 pl-6 font-mono font-extrabold text-violet-600 dark:text-violet-400">{{ acc.account_code }}</td>
                    <td class="p-4">
                      <div class="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200">
                        {{ acc.name }}
                        <span v-if="['101', '401', '102'].includes(acc.account_code)" class="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-violet-500/10 text-violet-600 border border-violet-500/20" title="Dipakai auto-posting">
                          Sistem
                        </span>
                        <div v-if="acc.account_code === '101'" class="group relative flex items-center">
                          <Info class="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 cursor-help transition-colors" />
                          <div class="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl text-center z-50 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-slate-800 font-normal leading-relaxed">
                            Saldo ini adalah total keseluruhan uang masuk ke lembaga dari berbagai penerimaan (SPP, Seragam, dll).
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="p-4">
                      <span 
                        class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                        :class="[
                          acc.type === 'asset' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          acc.type === 'liability' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                          acc.type === 'equity' ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' :
                          acc.type === 'revenue' ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20' :
                          'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        ]"
                      >
                        {{ acc.type }}
                      </span>
                    </td>
                    <td class="p-4 pr-6 text-right font-mono font-extrabold text-slate-900 dark:text-zinc-200">
                      {{ formatNumber(acc.balance) }}
                    </td>
                    <td class="p-4 pr-6 text-right">
                      <button v-if="!['101', '401', '102'].includes(acc.account_code)" class="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 font-bold transition-colors">
                        Arsipkan
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p class="text-[11px] text-slate-500 mt-2">COA default ter-seed otomatis saat aktivasi. Saldo dihitung dari jurnal, bukan kolom statis — direkonsiliasi harian.</p>
        </div>

        <!-- Tab Content 4: Laporan Keuangan -->
        <div v-else-if="activeTab === 'reports'" class="space-y-6 animate-in fade-in duration-300">
          <!-- Subtab Navigation -->
          <div class="flex justify-between items-center gap-4 bg-slate-50/50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800/80">
            <div class="flex gap-1.5 flex-wrap">
              <button 
                @click="activeReportSubTab = 'balance-sheet'" 
                class="px-4 py-2 text-xs font-bold rounded-lg transition-all"
                :class="activeReportSubTab === 'balance-sheet' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'"
              >
                Neraca (Balance Sheet)
              </button>
              <button 
                @click="activeReportSubTab = 'income-statement'" 
                class="px-4 py-2 text-xs font-bold rounded-lg transition-all"
                :class="activeReportSubTab === 'income-statement' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'"
              >
                Laba / Rugi
              </button>
              <button 
                @click="activeReportSubTab = 'bos'" 
                class="px-4 py-2 text-xs font-bold rounded-lg transition-all"
                :class="activeReportSubTab === 'bos' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'"
              >
                Laporan BOS (K7a)
              </button>
              <button 
                @click="activeReportSubTab = 'foundation'" 
                class="px-4 py-2 text-xs font-bold rounded-lg transition-all"
                :class="activeReportSubTab === 'foundation' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'"
              >
                Laporan Yayasan
              </button>
            </div>
            
            <div class="flex gap-2">
              <button @click="exportReport('xlsx')" class="p-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 transition-all" title="Ekspor Excel">
                <FileSpreadsheet :size="15" />
              </button>
              <button @click="exportReport('pdf')" class="p-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 transition-all" title="Cetak PDF">
                <Printer :size="15" />
              </button>
            </div>
          </div>

          <!-- SUBTAB 1: Neraca -->
          <BalanceSheetReport v-if="activeReportSubTab === 'balance-sheet'" :data="balanceSheetData" />

          <!-- SUBTAB 2: Laba/Rugi -->
          <IncomeStatementReport v-else-if="activeReportSubTab === 'income-statement'" :data="incomeStatementData" />

          <!-- SUBTAB 3: Laporan BOS -->
          <BosK7aReport v-else-if="activeReportSubTab === 'bos'" :data="bosReportData" />

          <!-- SUBTAB 4: Laporan Yayasan -->
          <FoundationReport v-else-if="activeReportSubTab === 'foundation'" :data="foundationReportData" />
        </div>

        <!-- Tab Content 5: Manajemen Aset -->
        <div v-else-if="activeTab === 'assets'" class="space-y-6 animate-in fade-in duration-300">
          <!-- Assets Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-1">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Nilai Perolehan Aset</span>
              <p class="text-xl font-extrabold text-slate-900 dark:text-zinc-100 font-mono">{{ formatNumber(assetTotals.value) }}</p>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-1">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Kuantitas Fisik</span>
              <p class="text-xl font-extrabold text-slate-900 dark:text-zinc-100">{{ assetTotals.qty }} Unit</p>
            </div>
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-1">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kondisi Baik</span>
              <p class="text-xl font-extrabold text-emerald-600 dark:text-emerald-450">{{ assetTotals.good }} Unit</p>
            </div>
          </div>

          <!-- Assets Table -->
          <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    <th class="p-4 pl-6">Kode Aset (auto)</th>
                    <th class="p-4">Nama Barang</th>
                    <th class="p-4">Kategori</th>
                    <th class="p-4">Tgl Perolehan</th>
                    <th class="p-4">Nilai Perolehan</th>
                    <th class="p-4 text-center">Jumlah</th>
                    <th class="p-4">Kondisi</th>
                    <th class="p-4">Lokasi</th>
                    <th class="p-4 text-center pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                  <tr v-for="asset in assetsList" :key="asset.id" class="hover:bg-slate-50/30 dark:hover:bg-zinc-950/20 text-slate-700 dark:text-zinc-300">
                    <td class="p-4 pl-6 font-mono font-extrabold text-violet-600 dark:text-violet-400">{{ asset.code }}</td>
                    <td class="p-4 font-bold text-slate-800 dark:text-zinc-200">{{ asset.name }}</td>
                    <td class="p-4 text-[10px] text-slate-550">{{ ASSET_CATEGORIES.find(c => c.value === asset.category)?.label || asset.category }}</td>
                    <td class="p-4 text-slate-500">{{ formatDate(asset.purchase_date) }}</td>
                    <td class="p-4 font-mono font-semibold">{{ formatNumber(asset.purchase_cost) }}</td>
                    <td class="p-4 text-center font-bold">{{ asset.quantity }}</td>
                    <td class="p-4">
                      <span 
                        class="px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase"
                        :class="[
                          asset.condition === 'good' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          asset.condition === 'repair_needed' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        ]"
                      >
                        {{ asset.condition === 'good' ? 'Baik' : asset.condition === 'repair_needed' ? 'Perlu Perbaikan' : 'Rusak' }}
                      </span>
                    </td>
                    <td class="p-4 text-slate-500">{{ asset.location || '-' }}</td>
                    <td class="p-4 text-center pr-6">
                      <button @click="handleDeleteAsset(asset.id)" class="text-slate-400 hover:text-rose-600 transition-all">
                        <Trash2 :size="15" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="assetsList.length === 0">
                    <td colspan="9" class="p-8 text-center text-slate-400">Belum ada aset sekolah terdaftar. Silakan tambah aset baru.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Detail SPP Murid -->
    <BaseModal :show="showDetailModal" title="Detail Tagihan SPP Murid" @close="showDetailModal = false">
      <div v-if="activeStudent" class="space-y-6">
        <!-- Student Summary Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-850 p-4 rounded-xl shadow-sm text-xs">
          <div class="space-y-1">
            <h4 class="font-bold text-slate-800 dark:text-zinc-200">{{ activeStudent.student_name }}</h4>
            <p class="text-slate-400">NIS: {{ activeStudent.student_nis || '-' }} | Kelas: {{ activeStudent.class_name || '-' }}</p>
          </div>
          <div class="flex gap-4">
            <div class="text-right">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Tagihan</span>
              <span class="font-bold text-slate-700 dark:text-zinc-300">{{ formatNumber(activeStudent.total_amount) }}</span>
            </div>
            <div class="text-right border-l border-slate-200 dark:border-zinc-800 pl-4">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Tagihan</span>
              <span class="font-bold" :class="activeStudent.unpaid_amount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-450'">
                {{ formatNumber(activeStudent.unpaid_amount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Individual Bills List -->
        <div class="space-y-3">
          <h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Rincian Item Tagihan</h5>
          
          <div 
            v-for="bill in activeStudent.bills" 
            :key="bill.id" 
            class="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl hover:border-violet-600/30 transition-all"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-slate-800 dark:text-zinc-200 text-xs">{{ bill.name }}</span>
                <span v-if="bill.category_name" class="inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-slate-150 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/80">
                  {{ bill.category_name }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-slate-400">
                <span>Tempo: {{ formatDate(bill.due_date) }}</span>
                <span>•</span>
                <span class="font-mono text-slate-500">{{ bill.period }}</span>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="text-right">
                <div class="font-extrabold text-slate-900 dark:text-zinc-100 text-xs">{{ formatNumber(bill.amount) }}</div>
                <div class="mt-0.5">
                  <span 
                    class="inline-block px-1.5 py-0.5 rounded-full text-[8px] font-extrabold border"
                    :class="[
                      bill.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20'
                    ]"
                  >
                    {{ bill.status === 'paid' ? 'Lunas' : 'Belum Lunas' }}
                  </span>
                </div>
              </div>
              
              <div>
                <button 
                  v-if="bill.status !== 'paid'"
                  @click="openPaymentModal(bill)"
                  class="px-3 py-1.5 bg-violet-600 hover:bg-violet-750 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm shadow-violet-600/15"
                >
                  Bayar
                </button>
                <span v-else class="text-xs text-emerald-500 dark:text-emerald-450 font-bold block px-2">✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showDetailModal = false">Tutup</BaseButton>
        </div>
      </div>
    </BaseModal>

    <CashierDrawer 
      :is-open="showCashierDrawer"
      :student-id="activeStudentId"
      :student-name="activeStudentName"
      @close="showCashierDrawer = false"
      @payment-success="handlePaymentSuccess"
    />

    <!-- Modal: Buat Tagihan SPP Massal -->
    <BaseModal :show="showSPPModal" title="Buat Tagihan SPP Massal" @close="showSPPModal = false">
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Rombel Kelas (boleh lebih dari satu)</label>
          <select v-model="sppForm.class_ids" multiple size="4" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Struktur Biaya</label>
          <select v-model="sppForm.category_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option value="" disabled>Pilih Struktur Biaya</option>
            <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput v-model="sppForm.amount" label="Nominal Khusus + Alasan" type="number" placeholder="Contoh: 450000" required />
          
          <div class="flex flex-col gap-1.5 w-full">
            <div class="flex items-center gap-1.5 px-1">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Periode Tagihan</label>
              <span title="Pilih bulan dan tahun tagihan. Sistem otomatis mengecek dan melewati siswa yang sudah memiliki tagihan di bulan ini (mencegah duplikasi).">
                <Info :size="14" class="text-slate-400 cursor-help" />
              </span>
            </div>
            <select v-model="sppForm.period" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
              <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
        <BaseDateInput v-model="sppForm.due_date" label="Tanggal Jatuh Tempo" required />

        <div class="p-3 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/20 rounded-lg text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
          <template v-if="isPreviewLoading">
            <span class="animate-pulse">Menghitung pratinjau tagihan...</span>
          </template>
          <template v-else-if="previewData">
            Pratinjau: akan membuat <b class="text-slate-800 dark:text-zinc-200">{{ previewData.totalStudents - previewData.skippedCount }} tagihan</b> 
            untuk {{ previewData.totalStudents }} siswa di {{ sppForm.class_ids.length }} rombel 
            &middot; <b class="text-slate-800 dark:text-zinc-200">{{ previewData.discountStudents }} keringanan diterapkan</b> 
            &middot; total tertagihkan <b class="font-mono text-slate-800 dark:text-zinc-200">{{ formatNumber(previewData.totalAmount) }}</b> 
            &middot; {{ previewData.skippedCount }} dilewati (sudah ada).
          </template>
          <template v-else>
            Pilih kelas dan lengkapi form untuk melihat pratinjau tagihan.
          </template>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showSPPModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleGenerateSPP">Buat Tagihan SPP Massal</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal: Tambah Aset Sekolah -->
    <BaseModal :show="showAssetModal" title="Daftarkan Aset Sekolah Baru" @close="showAssetModal = false">
      <div class="space-y-4">
        <BaseInput v-model="assetForm.name" label="Nama Barang Aset" placeholder="Contoh: Laptop Asus ExpertBook" required />
        <BaseInput v-model="assetForm.code" label="Kode / Serial Aset" placeholder="Contoh: AST-ELC-2026-001" required />
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Kategori Aset</label>
          <select v-model="assetForm.category" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option v-for="cat in ASSET_CATEGORIES" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseDateInput v-model="assetForm.purchase_date" label="Tanggal Perolehan" required />
          <BaseInput v-model="assetForm.purchase_cost" label="Harga Perolehan (IDR)" type="number" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="assetForm.quantity" label="Kuantitas (Pcs/Unit)" type="number" required />
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Kondisi Fisik</label>
            <select v-model="assetForm.condition" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
              <option value="good">Baik (Good)</option>
              <option value="repair_needed">Perlu Perbaikan (Repair Needed)</option>
              <option value="broken">Rusak (Broken)</option>
            </select>
          </div>
        </div>

        <BaseInput v-model="assetForm.location" label="Lokasi Penempatan" placeholder="Contoh: Lab Komputer Lt. 2" />

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Metode Penyusutan</label>
            <select v-model="assetForm.depreciation_method" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
              <option v-for="method in DEPRECIATION_METHODS" :key="method.value" :value="method.value">{{ method.label }}</option>
            </select>
          </div>
          <BaseInput v-model="assetForm.useful_life_years" label="Masa Manfaat (Tahun)" type="number" />
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showAssetModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleCreateAsset">Daftarkan Aset</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal: Tambah Jurnal Umum -->
    <BaseModal :show="showJournalModal" title="Catat Transaksi Jurnal Umum (Double-Entry)" @close="showJournalModal = false">
      <div class="space-y-4">
        <BaseDateInput v-model="journalForm.date" label="Tanggal Transaksi" required />
        <BaseInput v-model="journalForm.description" label="Keterangan / Deskripsi Transaksi" placeholder="Contoh: Pembelian ATK Kantor / Bayar Listrik Bulanan" required />
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Akun Debit (Penggunaan Dana / Beban / Aset Baru)</label>
          <select v-model="journalForm.debit_account_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option value="" disabled>Pilih Akun Debit</option>
            <option v-for="acc in accountsList" :key="'deb-'+acc.id" :value="acc.id">
              {{ acc.account_code }} - {{ acc.name }} (Saldo: {{ formatNumber(acc.balance) }})
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Akun Kredit (Sumber Dana / Kas & Bank / Hutang)</label>
          <select v-model="journalForm.credit_account_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option value="" disabled>Pilih Akun Kredit</option>
            <option v-for="acc in accountsList" :key="'cred-'+acc.id" :value="acc.id">
              {{ acc.account_code }} - {{ acc.name }} (Saldo: {{ formatNumber(acc.balance) }})
            </option>
          </select>
        </div>

        <BaseInput v-model="formattedAmount" label="Nominal Transaksi (IDR)" placeholder="Contoh: 300.000" type="text" required />
        <BaseInput v-model="journalForm.reference" label="Referensi / Nomor Bukti (Opsional)" placeholder="Contoh: BKK-001 / INV-889" />

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Sumber Dana</label>
          <select v-model="journalForm.funding_source" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option value="yayasan">Dana Yayasan / Pribadi</option>
            <option value="spp">Dana SPP</option>
            <option value="bos_reguler">Dana BOS Reguler</option>
            <option value="bos_kinerja">Dana BOS Kinerja</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>

        <BaseInput 
          v-if="journalForm.funding_source.startsWith('bos_')"
          v-model="journalForm.bos_component_id" 
          label="Komponen Pembiayaan BOS (Kode)" 
          placeholder="Contoh: K-01 / Kegiatan Pembelajaran" 
          required 
        />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showJournalModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleCreateJournal">Simpan Transaksi</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal: Koreksi Jurnal (Reversal) -->
    <BaseModal :show="showReversalModal" title="Koreksi / Batalkan Jurnal" @close="showReversalModal = false">
      <div class="space-y-4">
        <div class="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-xl">
          <p class="text-xs text-rose-700 dark:text-rose-300">
            <strong>Peringatan!</strong> Anda akan membuat jurnal pembalik untuk membatalkan jurnal dengan Referensi: <span class="font-bold font-mono">{{ reversalForm.txRef }}</span>.<br><br>Sistem keuangan menggunakan metode double-entry immutable (tidak dapat dihapus atau diedit setelah dicatat). Proses ini akan membuat entri jurnal pembalik otomatis.
          </p>
        </div>
        <BaseInput v-model="reversalForm.reason" label="Alasan Koreksi (Wajib)" placeholder="Contoh: Salah catat nominal / Salah pilih akun beban" required />
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showReversalModal = false">Batal</BaseButton>
          <BaseButton variant="danger" @click="submitReversal">Buat Jurnal Pembalik</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal: Tutup Buku (Period Lock) -->
    <BaseModal :show="showPeriodLockModal" title="Tutup Buku Bulanan" @close="showPeriodLockModal = false">
      <div class="space-y-4">
        <div class="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl">
          <p class="text-xs text-amber-700 dark:text-amber-300">
            <strong>Peringatan!</strong> Periode buku yang sudah ditutup tidak akan bisa dicatat atau dikoreksi jurnalnya lagi. Pastikan semua laporan sudah di-review.
          </p>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tahun</label>
            <input type="number" v-model="periodLockForm.year" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600" required />
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Bulan (1-12)</label>
            <input type="number" min="1" max="12" v-model="periodLockForm.month" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600" required />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showPeriodLockModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handlePeriodLock">Kunci Periode</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal: Import Aset Sekolah via Excel -->
    <BaseModal :show="showAssetImportModal" title="Import Data Aset Sekolah via Excel" @close="showAssetImportModal = false; assetImportResult = null; assetImportFile = null">
      <div class="space-y-5">
        <!-- Instructions -->
        <div class="flex items-start gap-3 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-100 dark:border-violet-900/50">
          <FileSpreadsheet class="text-violet-500 shrink-0 mt-0.5" :size="18" />
          <div class="text-xs text-violet-700 dark:text-violet-300">
            <p class="font-bold mb-1">Panduan Import</p>
            <ol class="list-decimal ml-4 space-y-0.5 text-violet-600 dark:text-violet-400">
              <li>Unduh template Excel terlebih dahulu melalui tombol <strong>Unduh Template</strong>.</li>
              <li>Isi data sesuai format pada baris ke-9 dan seterusnya (baris 1–8 adalah header dan contoh).</li>
              <li>Kolom <strong>Nama Barang Aset</strong>, <strong>Kode / Serial Aset</strong>, <strong>Kategori Aset</strong>, <strong>Tanggal Perolehan</strong>, <strong>Harga Perolehan</strong>, <strong>Kuantitas</strong>, dan <strong>Kondisi Fisik</strong> wajib diisi.</li>
              <li>Kategori Aset, Kondisi Fisik, dan Metode Penyusutan harus diisi sesuai opsi yang tertera di sheet <strong>DAFTAR REFERENSI</strong>.</li>
              <li>Upload file yang telah diisi kembali di sini.</li>
            </ol>
          </div>
        </div>

        <!-- File picker -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Pilih File Excel (.xlsx)</label>
          <label class="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-5 hover:border-violet-400 dark:hover:border-violet-600 transition-colors group">
            <Upload class="text-slate-400 group-hover:text-violet-500 transition-colors" :size="20" />
            <div class="flex-1 min-w-0">
              <p v-if="assetImportFile" class="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">{{ assetImportFile.name }}</p>
              <p v-else class="text-sm text-slate-400 dark:text-zinc-500">Klik untuk memilih file atau seret ke sini</p>
            </div>
            <input type="file" accept=".xlsx" class="hidden" @change="onAssetFileChange" />
          </label>
        </div>

        <!-- Import result -->
        <div v-if="assetImportResult" class="space-y-2">
          <div class="flex gap-3">
            <div class="flex-1 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg px-4 py-3">
              <CheckCircle class="text-emerald-500" :size="16" />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Berhasil</p>
                <p class="text-xl font-black text-emerald-700 dark:text-emerald-300">{{ assetImportResult.success }}</p>
              </div>
            </div>
            <div class="flex-1 flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-lg px-4 py-3">
              <AlertCircle class="text-rose-500" :size="16" />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Gagal</p>
                <p class="text-xl font-black text-rose-700 dark:text-rose-300">{{ assetImportResult.failed }}</p>
              </div>
            </div>
          </div>
          <div v-if="assetImportResult.errors.length > 0" class="bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/50 p-3 max-h-40 overflow-y-auto">
            <p class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">Detail Error</p>
            <ul class="space-y-1">
              <li v-for="(err, i) in assetImportResult.errors" :key="i" class="text-xs text-rose-700 dark:text-rose-300 flex gap-2">
                <X :size="11" class="shrink-0 mt-0.5" /> {{ err }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" @click="showAssetImportModal = false; assetImportResult = null; assetImportFile = null">Tutup</BaseButton>
          <BaseButton variant="primary" @click="handleAssetImport" :disabled="!assetImportFile || assetImportLoading">
            <Upload class="mr-1.5" :size="14" />
            {{ assetImportLoading ? 'Sedang Import...' : 'Mulai Import' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
