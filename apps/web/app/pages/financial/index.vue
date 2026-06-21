<script setup lang="ts">
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
  Scale
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput, BaseDateInput } from '@eduraport/ui'
import { useSchool } from '../../composables/useSchool'
import { useClass } from '../../composables/useClass'
import { useFinancial } from '../../composables/useFinancial'
import { useToast } from '../../composables/useToast'
import { ref, reactive, computed, onMounted, watch } from 'vue'

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
const { classes, fetchClasses } = useClass()
const { 
  billsList, 
  accountsList, 
  journalsList, 
  categoriesList,
  assetsList,
  fetchBills, 
  generateBulkSPP, 
  recordPayment, 
  fetchAccounts, 
  fetchJournals,
  fetchCategories,
  fetchAssets,
  createAsset,
  deleteAsset,
  fetchBalanceSheet,
  fetchIncomeStatement,
  fetchBOSReport,
  fetchFoundationReport,
  createManualJournal
} = useFinancial()
const toast = useToast()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const selectedClassId = ref('')
const filterStatus = ref('') // all, pending, paid

const activeTab = ref('bills') // bills, journals, accounts, reports, assets
const activeReportSubTab = ref('balance-sheet') // balance-sheet, income-statement, bos, foundation
const loading = ref(false)

// Reports data states
const balanceSheetData = ref<any>(null)
const incomeStatementData = ref<any>(null)
const bosReportData = ref<any>(null)
const foundationReportData = ref<any>(null)

// Assets state & modal
const showAssetModal = ref(false)
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
  reference: ''
})

// Grouped Bills & Details Modal States
const showDetailModal = ref(false)
const activeStudentId = ref('')

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
    groups[studentId].total_amount += amt
    if (bill.status !== 'paid') {
      groups[studentId].unpaid_amount += amt
      groups[studentId].status = 'pending'
    }
  }

  return Object.values(groups).sort((a, b) => a.student_name.localeCompare(b.student_name))
})

const activeStudent = computed(() => {
  return groupedBills.value.find(s => s.student_id === activeStudentId.value) || null
})

// SPP Gen Modal
const showSPPModal = ref(false)
const sppForm = reactive({
  class_id: '',
  period: new Date().toISOString().substring(0, 7), // YYYY-MM
  amount: '450000',
  due_date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().substring(0, 10), // YYYY-MM-DD
  category_id: ''
})

// Payment Modal
const showPaymentModal = ref(false)
const activeBill = ref<any>(null)
const paymentForm = reactive({
  amount_paid: '0',
  method: 'cash',
  transaction_code: ''
})

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
  await fetchFoundations()
  if (foundations.value.length > 0) {
    selectedFoundationId.value = foundations.value[0].id
    await fetchSchools(selectedFoundationId.value)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
      await loadSchoolData(selectedSchoolId.value)
    }
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
    await fetchClasses(schoolId)
    await Promise.all([
      fetchAccounts(schoolId),
      fetchJournals(schoolId),
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

watch(selectedFoundationId, async (newVal) => {
  if (newVal) {
    await fetchSchools(newVal)
    if (schools.value.length > 0) {
      selectedSchoolId.value = schools.value[0].id
    } else {
      selectedSchoolId.value = ''
      classes.value = []
    }
  }
})

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

const openDetailModal = (student: any) => {
  activeStudentId.value = student.student_id
  showDetailModal.value = true
}

const handleGenerateSPP = async () => {
  if (!selectedSchoolId.value || !sppForm.class_id) {
    toast.error('Pilih kelas rombel terlebih dahulu.', 'Validasi')
    return
  }

  try {
    const res = await generateBulkSPP(selectedSchoolId.value, {
      class_id: sppForm.class_id,
      period: sppForm.period,
      amount: sppForm.amount,
      due_date: sppForm.due_date,
      category_id: sppForm.category_id
    })

    if (res.success) {
      toast.success(`Berhasil membuat ${res.data.billedCount} tagihan SPP baru.`, 'Berhasil')
      showSPPModal.value = false
      await loadBills()
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal membuat tagihan SPP.', 'Gagal')
  }
}

const openPaymentModal = (bill: any) => {
  activeBill.value = bill
  paymentForm.amount_paid = String(Number(bill.amount))
  paymentForm.method = 'cash'
  paymentForm.transaction_code = `TX-${Date.now()}`
  showPaymentModal.value = true
}

const handleRecordPayment = async () => {
  if (!selectedSchoolId.value || !activeBill.value) return

  try {
    const res = await recordPayment(selectedSchoolId.value, {
      bill_id: activeBill.value.id,
      amount_paid: paymentForm.amount_paid,
      method: paymentForm.method,
      transaction_code: paymentForm.transaction_code
    }, selectedClassId.value)

    if (res.success) {
      toast.success('Pembayaran SPP berhasil dicatat dan dibukukan.', 'Pembayaran Sukses')
      showPaymentModal.value = false
      await loadBills()
      // Reload reports and COA balances
      await loadReports(selectedSchoolId.value)
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal mencatat pembayaran.', 'Gagal')
  }
}

// Asset Management logic
const handleCreateAsset = async () => {
  if (!selectedSchoolId.value) return
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
  if (!journalForm.debit_account_id || !journalForm.credit_account_id || !journalForm.amount || !journalForm.description) {
    toast.error('Mohon isi semua field yang wajib.', 'Validasi')
    return
  }
  try {
    const res = await createManualJournal(selectedSchoolId.value, { ...journalForm })
    if (res.success) {
      toast.success('Jurnal transaksi berhasil dicatat.', 'Berhasil')
      showJournalModal.value = false
      // Reset form
      journalForm.description = ''
      journalForm.debit_account_id = ''
      journalForm.credit_account_id = ''
      journalForm.amount = ''
      journalForm.reference = ''
      formattedAmount.value = ''
      // Reload reports and general journals
      await loadReports(selectedSchoolId.value)
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal menyimpan transaksi jurnal.', 'Gagal')
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

const formatNumber = (numStr: any) => {
  if (numStr === null || numStr === undefined) return '0'
  return new Number(numStr).toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  })
}

const formatDate = (dateStr: any) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
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
          <Plus class="mr-1.5" :size="14" /> Buat Tagihan SPP Bulanan
        </BaseButton>
      </div>
      <div class="flex gap-2 flex-wrap" v-if="selectedSchoolId && activeTab === 'journals'">
        <BaseButton variant="primary" @click="showJournalModal = true" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Plus class="mr-1.5" :size="14" /> Tambah Jurnal Umum
        </BaseButton>
      </div>
      <div class="flex gap-2 flex-wrap" v-if="selectedSchoolId && activeTab === 'assets'">
        <BaseButton variant="primary" @click="showAssetModal = true" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Plus class="mr-1.5" :size="14" /> Tambah Aset Sekolah
        </BaseButton>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
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
                      <button @click="openDetailModal(student)" class="text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
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

          <div v-else class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    <th class="p-4 pl-6">Tanggal</th>
                    <th class="p-4">Keterangan / Deskripsi</th>
                    <th class="p-4">Rekening COA</th>
                    <th class="p-4">Debit</th>
                    <th class="p-4">Kredit</th>
                    <th class="p-4 pr-6">Referensi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/80 text-slate-700 dark:text-zinc-300">
                  <tr v-for="j in journalsList" :key="j.id" class="hover:bg-slate-50/30 dark:hover:bg-zinc-950/20 transition-all font-medium">
                    <td class="p-4 pl-6 text-slate-500">{{ formatDate(j.date) }}</td>
                    <td class="p-4 font-semibold">{{ j.description }}</td>
                    <td class="p-4">
                      <span class="font-mono bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-[10px]">
                        {{ j.account_code }} - {{ j.account_name }}
                      </span>
                    </td>
                    <td class="p-4 font-mono font-bold text-slate-800 dark:text-zinc-200">
                      {{ Number(j.debit) > 0 ? formatNumber(j.debit) : '-' }}
                    </td>
                    <td class="p-4 font-mono font-bold text-slate-850 dark:text-zinc-300">
                      {{ Number(j.credit) > 0 ? formatNumber(j.credit) : '-' }}
                    </td>
                    <td class="p-4 font-mono text-slate-400 pr-6">{{ j.reference || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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
                    <th class="p-4 pr-6 text-right">Saldo Saat Ini</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/80 font-medium">
                  <tr v-for="acc in accountsList" :key="acc.id" class="hover:bg-slate-50/30 dark:hover:bg-zinc-950/20 transition-all text-slate-700 dark:text-zinc-300">
                    <td class="p-4 pl-6 font-mono font-extrabold text-violet-600 dark:text-violet-400">{{ acc.account_code }}</td>
                    <td class="p-4 font-bold text-slate-800 dark:text-zinc-200">{{ acc.name }}</td>
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
                    <td class="p-4 pr-6 text-right font-mono font-extrabold text-slate-900 dark:text-zinc-150">
                      {{ formatNumber(acc.balance) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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
          <div v-if="activeReportSubTab === 'balance-sheet'" class="space-y-4 animate-in fade-in duration-200">
            <!-- Balance check banner -->
            <div 
              v-if="balanceSheetData" 
              class="flex items-center gap-3 p-4 rounded-xl border"
              :class="balanceSheetData.totals.balanced ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'"
            >
              <CheckCircle v-if="balanceSheetData.totals.balanced" :size="18" />
              <AlertCircle v-else :size="18" />
              <div class="text-xs">
                <span class="font-bold">Verifikasi Saldo Neraca: </span>
                <span>{{ balanceSheetData.totals.balanced ? 'SEIMBANG (Total Aset = Total Liabilitas + Ekuitas)' : 'BELUM SEIMBANG' }}</span>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-if="balanceSheetData">
              <!-- Assets Column -->
              <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4">
                <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between">
                  <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Aset (Assets)</h4>
                  <span class="text-xs text-slate-400">Kode Rekening 1xx</span>
                </div>
                <div class="space-y-2">
                  <div v-for="acc in balanceSheetData.assets" :key="acc.id" class="flex justify-between text-xs py-1">
                    <span class="text-slate-500">{{ acc.account_code }} - {{ acc.name }}</span>
                    <span class="font-mono font-bold">{{ formatNumber(acc.balance) }}</span>
                  </div>
                  <div v-if="balanceSheetData.assets.length === 0" class="text-xs text-slate-400 py-4 text-center">Tidak ada data aset.</div>
                </div>
                <div class="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 font-extrabold text-slate-800 dark:text-zinc-200 text-xs">
                  <span>TOTAL ASET</span>
                  <span class="font-mono">{{ formatNumber(balanceSheetData.totals.assets) }}</span>
                </div>
              </div>

              <!-- Liabilities & Equities Column -->
              <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-6">
                <!-- Liabilities -->
                <div class="space-y-4">
                  <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between">
                    <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Kewajiban (Liabilities)</h4>
                    <span class="text-xs text-slate-400">Kode Rekening 2xx</span>
                  </div>
                  <div class="space-y-2">
                    <div v-for="acc in balanceSheetData.liabilities" :key="acc.id" class="flex justify-between text-xs py-1">
                      <span class="text-slate-500">{{ acc.account_code }} - {{ acc.name }}</span>
                      <span class="font-mono font-bold">{{ formatNumber(acc.balance) }}</span>
                    </div>
                    <div v-if="balanceSheetData.liabilities.length === 0" class="text-xs text-slate-400 py-2 text-center">Tidak ada data kewajiban.</div>
                  </div>
                </div>

                <!-- Equities -->
                <div class="space-y-4">
                  <div class="border-b border-slate-100 dark:border-zinc-800 pb-2 flex justify-between">
                    <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Ekuitas (Equity)</h4>
                    <span class="text-xs text-slate-400">Kode Rekening 3xx</span>
                  </div>
                  <div class="space-y-2">
                    <div v-for="acc in balanceSheetData.equities" :key="acc.id" class="flex justify-between text-xs py-1">
                      <span class="text-slate-500">{{ acc.account_code }} - {{ acc.name }}</span>
                      <span class="font-mono font-bold">{{ formatNumber(acc.balance) }}</span>
                    </div>
                    <div v-if="balanceSheetData.equities.length === 0" class="text-xs text-slate-400 py-2 text-center">Tidak ada data ekuitas.</div>
                  </div>
                </div>

                <!-- Combined Total -->
                <div class="flex justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 font-extrabold text-slate-800 dark:text-zinc-200 text-xs">
                  <span>TOTAL KEWAJIBAN & EKUITAS</span>
                  <span class="font-mono">{{ formatNumber(balanceSheetData.totals.liabilities_and_equities) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- SUBTAB 2: Laba/Rugi -->
          <div v-else-if="activeReportSubTab === 'income-statement'" class="space-y-4 animate-in fade-in duration-200">
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 space-y-6 max-w-3xl mx-auto" v-if="incomeStatementData">
              <div class="text-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <h4 class="font-bold text-base text-slate-800 dark:text-zinc-200">Laporan Aktivitas Laba / Rugi</h4>
                <p class="text-[10px] text-slate-400 mt-1">Performa Pendapatan dan Beban Operasional Sekolah</p>
              </div>

              <!-- Revenues -->
              <div class="space-y-3">
                <h5 class="font-extrabold text-xs text-slate-800 dark:text-zinc-250 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-850 pb-1">Pendapatan (Revenues)</h5>
                <div v-for="acc in incomeStatementData.revenues" :key="acc.id" class="flex justify-between text-xs py-1 px-2 hover:bg-slate-50/50 dark:hover:bg-zinc-950/25 rounded transition-all">
                  <span class="text-slate-500 font-semibold">{{ acc.account_code }} - {{ acc.name }}</span>
                  <span class="font-mono font-bold text-slate-700 dark:text-zinc-300">{{ formatNumber(acc.balance) }}</span>
                </div>
                <div v-if="incomeStatementData.revenues.length === 0" class="text-xs text-slate-400 py-4 text-center">Tidak ada pendapatan tercatat.</div>
                <div class="flex justify-between font-bold text-slate-800 dark:text-zinc-200 text-xs px-2 pt-2 border-t border-dashed border-slate-100 dark:border-zinc-800">
                  <span>Total Pendapatan</span>
                  <span class="font-mono">{{ formatNumber(incomeStatementData.totals.revenue) }}</span>
                </div>
              </div>

              <!-- Expenses -->
              <div class="space-y-3">
                <h5 class="font-extrabold text-xs text-slate-800 dark:text-zinc-250 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-850 pb-1">Beban Operasional (Expenses)</h5>
                <div v-for="acc in incomeStatementData.expenses" :key="acc.id" class="flex justify-between text-xs py-1 px-2 hover:bg-slate-50/50 dark:hover:bg-zinc-950/25 rounded transition-all">
                  <span class="text-slate-500 font-semibold">{{ acc.account_code }} - {{ acc.name }}</span>
                  <span class="font-mono font-bold text-slate-700 dark:text-zinc-300">{{ formatNumber(acc.balance) }}</span>
                </div>
                <div v-if="incomeStatementData.expenses.length === 0" class="text-xs text-slate-400 py-4 text-center">Tidak ada beban operasional tercatat.</div>
                <div class="flex justify-between font-bold text-slate-800 dark:text-zinc-200 text-xs px-2 pt-2 border-t border-dashed border-slate-100 dark:border-zinc-800">
                  <span>Total Beban</span>
                  <span class="font-mono">{{ formatNumber(incomeStatementData.totals.expense) }}</span>
                </div>
              </div>

              <!-- Net profit -->
              <div 
                class="flex justify-between items-center p-4 rounded-xl border font-extrabold text-sm"
                :class="Number(incomeStatementData.totals.net_income) >= 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'"
              >
                <span>LABA (RUGI) BERSIH</span>
                <span class="font-mono text-base">{{ formatNumber(incomeStatementData.totals.net_income) }}</span>
              </div>
            </div>
          </div>

          <!-- SUBTAB 3: Laporan BOS -->
          <div v-else-if="activeReportSubTab === 'bos'" class="space-y-4 animate-in fade-in duration-200">
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 space-y-6 max-w-3xl mx-auto" v-if="bosReportData">
              <div class="text-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <h4 class="font-bold text-base text-slate-800 dark:text-zinc-200">Laporan Penggunaan Dana BOS</h4>
                <p class="text-[10px] text-slate-400 mt-1">Formulir K7a - Kompatibel Standar Kemendikbudristek</p>
              </div>

              <!-- Revenue Section -->
              <div class="space-y-3">
                <h5 class="font-extrabold text-xs text-slate-850 dark:text-zinc-250 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-850 pb-1">I. Penerimaan Dana</h5>
                <div class="flex justify-between text-xs py-1.5 px-2 bg-slate-50 dark:bg-zinc-950 rounded">
                  <span class="text-slate-500 font-semibold">{{ bosReportData.revenue.account_code }} - {{ bosReportData.revenue.name }}</span>
                  <span class="font-mono font-bold text-slate-800 dark:text-zinc-250">{{ formatNumber(bosReportData.revenue.balance) }}</span>
                </div>
              </div>

              <!-- Spending Section -->
              <div class="space-y-3">
                <h5 class="font-extrabold text-xs text-slate-850 dark:text-zinc-250 uppercase tracking-widest border-b border-slate-50 dark:border-zinc-850 pb-1">II. Penggunaan Dana per Komponen</h5>
                
                <div v-for="exp in bosReportData.expenses" :key="exp.account_code" class="flex justify-between text-xs py-1 px-2 border-b border-slate-50 dark:border-zinc-900">
                  <span class="text-slate-500 font-semibold">{{ exp.account_code }} - {{ exp.name }}</span>
                  <span class="font-mono font-bold text-slate-700 dark:text-zinc-300">{{ formatNumber(exp.balance) }}</span>
                </div>
                
                <div v-if="bosReportData.expenses.length === 0" class="text-xs text-slate-400 py-4 text-center">Belum ada rincian belanja dana BOS.</div>
              </div>

              <!-- Summary Section -->
              <div class="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <div class="bg-slate-50 dark:bg-zinc-950 p-3 rounded-lg text-center">
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Penerimaan</span>
                  <span class="font-mono font-bold text-xs text-slate-800 dark:text-zinc-200">{{ formatNumber(bosReportData.totals.revenue) }}</span>
                </div>
                <div class="bg-slate-50 dark:bg-zinc-950 p-3 rounded-lg text-center">
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Realisasi Belanja</span>
                  <span class="font-mono font-bold text-xs text-slate-850 dark:text-zinc-200">{{ formatNumber(bosReportData.totals.expense) }}</span>
                </div>
                <div class="bg-slate-50 dark:bg-zinc-950 p-3 rounded-lg text-center">
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Dana</span>
                  <span class="font-mono font-bold text-xs" :class="Number(bosReportData.totals.remaining) >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                    {{ formatNumber(bosReportData.totals.remaining) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- SUBTAB 4: Laporan Yayasan -->
          <div v-else-if="activeReportSubTab === 'foundation'" class="space-y-4 animate-in fade-in duration-200">
            <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
              <div class="p-5 border-b border-slate-100 dark:border-zinc-800/80">
                <h4 class="font-bold text-sm text-slate-800 dark:text-zinc-200">Perbandingan Keuangan Konsolidasi Unit Sekolah</h4>
                <p class="text-[10px] text-slate-400 mt-1">Ringkasan performa kas dan surplus antar unit sekolah di bawah naungan yayasan.</p>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="border-b border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      <th class="p-4 pl-6">Unit Sekolah</th>
                      <th class="p-4">Jenjang</th>
                      <th class="p-4">Saldo Kas & Bank</th>
                      <th class="p-4">Total Pendapatan</th>
                      <th class="p-4">Total Pengeluaran</th>
                      <th class="p-4 pr-6 text-right">Net Surplus / Defisit</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                    <tr v-for="schoolReport in foundationReportData" :key="schoolReport.school_id" class="hover:bg-slate-50/30 dark:hover:bg-zinc-950/20 text-slate-700 dark:text-zinc-300">
                      <td class="p-4 pl-6 font-bold text-slate-800 dark:text-zinc-200">{{ schoolReport.school_name }}</td>
                      <td class="p-4 font-bold uppercase text-slate-500">{{ schoolReport.level }}</td>
                      <td class="p-4 font-mono font-semibold">{{ formatNumber(schoolReport.cash_balance) }}</td>
                      <td class="p-4 font-mono font-semibold text-emerald-600">{{ formatNumber(schoolReport.revenue) }}</td>
                      <td class="p-4 font-mono font-semibold text-slate-650">{{ formatNumber(schoolReport.expense) }}</td>
                      <td class="p-4 pr-6 text-right font-mono font-extrabold" :class="Number(schoolReport.net_surplus) >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                        {{ formatNumber(schoolReport.net_surplus) }}
                      </td>
                    </tr>
                    <tr v-if="!foundationReportData || foundationReportData.length === 0">
                      <td colspan="6" class="p-8 text-center text-slate-400">Tidak ada unit sekolah yang terdaftar.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
                    <th class="p-4 pl-6">Kode Aset</th>
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
                    <td class="p-4 uppercase text-[10px] text-slate-500">{{ asset.category }}</td>
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
              <div class="font-bold text-slate-800 dark:text-zinc-200 text-xs">{{ bill.name }}</div>
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

    <!-- Modal: Record Payment -->
    <BaseModal :show="showPaymentModal" title="Pencatatan Pembayaran SPP" @close="showPaymentModal = false">
      <div v-if="activeBill" class="space-y-4">
        <div class="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 p-4 rounded-xl text-xs space-y-1">
          <p class="text-slate-400">Nama Murid: <strong class="text-slate-800 dark:text-zinc-200">{{ activeBill.student_name }}</strong></p>
          <p class="text-slate-400">Tagihan: <strong class="text-slate-800 dark:text-zinc-200">{{ activeBill.name }}</strong></p>
          <p class="text-slate-400">Jumlah Tagihan: <strong class="text-slate-800 dark:text-zinc-200">{{ formatNumber(activeBill.amount) }}</strong></p>
        </div>

        <BaseInput v-model="paymentForm.amount_paid" label="Jumlah Dibayarkan (IDR)" type="number" required />
        
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Metode Pembayaran</label>
          <select v-model="paymentForm.method" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option value="cash">Tunai (Cash)</option>
            <option value="transfer">Transfer Bank (VA)</option>
            <option value="qris">QRIS / E-Wallet</option>
          </select>
        </div>

        <BaseInput v-model="paymentForm.transaction_code" label="Nomor Referensi Transaksi (Bukti)" required />

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showPaymentModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleRecordPayment">Catat & Bukukan Pembayaran</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal: Buat Tagihan SPP Bulanan -->
    <BaseModal :show="showSPPModal" title="Buat Tagihan SPP Bulanan" @close="showSPPModal = false">
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Rombel Kelas</label>
          <select v-model="sppForm.class_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option value="" disabled>Pilih Rombel Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Kategori Biaya</label>
          <select v-model="sppForm.category_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option value="" disabled>Pilih Kategori</option>
            <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <BaseInput v-model="sppForm.period" label="Periode Tagihan (YYYY-MM)" type="month" required />
        <BaseInput v-model="sppForm.amount" label="Nominal Tagihan (IDR)" type="number" required />
        <BaseDateInput v-model="sppForm.due_date" label="Tanggal Jatuh Tempo" required />

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
            <option value="land">Tanah (Land)</option>
            <option value="building">Bangunan (Building)</option>
            <option value="furniture">Mebel & Furnitur (Furniture)</option>
            <option value="electronic">Elektronik & IT (Electronic)</option>
            <option value="vehicle">Kendaraan (Vehicle)</option>
            <option value="other">Lainnya (Other)</option>
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
              <option value="straight_line">Garis Lurus (Straight Line)</option>
              <option value="double_declining">Saldo Menurun Ganda</option>
              <option value="none">Tanpa Penyusutan</option>
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

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showJournalModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleCreateJournal">Simpan Transaksi</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
