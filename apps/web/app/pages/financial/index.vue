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
  Layers
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchool } from '../../composables/useSchool'
import { useClass } from '../../composables/useClass'
import { useFinancial } from '../../composables/useFinancial'
import { useToast } from '../../composables/useToast'

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
  fetchBills, 
  generateBulkSPP, 
  recordPayment, 
  fetchAccounts, 
  fetchJournals,
  fetchCategories
} = useFinancial()
const toast = useToast()

const selectedFoundationId = ref('')
const selectedSchoolId = ref('')
const selectedClassId = ref('')
const filterStatus = ref('') // all, pending, paid

const activeTab = ref('bills') // bills, accounts, journals
const loading = ref(false)

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

const loadSchoolData = async (schoolId: string) => {
  loading.value = true
  try {
    await fetchClasses(schoolId)
    await Promise.all([
      fetchAccounts(schoolId),
      fetchJournals(schoolId),
      fetchCategories(schoolId)
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
    }
  } catch (error: any) {
    toast.error(error.message || 'Gagal mencatat pembayaran.', 'Gagal')
  }
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
        <p class="text-xs text-slate-500 dark:text-zinc-400">Atur tagihan SPP bulanan, pembayaran uang sekolah, dan pantau jurnal akuntansi double-entry terpusat.</p>
      </div>
      <div class="flex gap-2 flex-wrap" v-if="selectedSchoolId && activeTab === 'bills'">
        <BaseButton variant="primary" @click="openSPPModal" class="py-2.5 px-4 text-xs font-bold shadow-lg shadow-violet-600/15">
          <Plus class="mr-1.5" :size="14" /> Buat Tagihan SPP Bulanan
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
      <div class="flex border-b border-slate-200 dark:border-zinc-800/80 gap-6">
        <button 
          @click="activeTab = 'bills'" 
          class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5"
          :class="[
            activeTab === 'bills'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
          ]"
        >
          <CreditCard :size="14" /> Tagihan SPP Siswa
        </button>
        <button 
          @click="activeTab = 'journals'" 
          class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5"
          :class="[
            activeTab === 'journals'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
          ]"
        >
          <FileText :size="14" /> Jurnal Umum (Ledger)
        </button>
        <button 
          @click="activeTab = 'accounts'" 
          class="pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5"
          :class="[
            activeTab === 'accounts'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
          ]"
        >
          <Layers :size="14" /> Daftar Rekening (COA)
        </button>
      </div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="py-20 text-center text-slate-400">
        <div class="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin mx-auto mb-3"></div>
        <p class="text-xs font-semibold">Memuat data keuangan...</p>
      </div>

      <!-- Tab Content 1: SPP Bills -->
      <div v-else-if="activeTab === 'bills'" class="space-y-4 animate-in fade-in duration-300">
        <div v-if="billsList.length === 0" class="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
          <Info class="mx-auto mb-2 text-violet-500 opacity-60" :size="30" />
          <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">Belum Ada Tagihan SPP</p>
          <p class="text-[10px] mt-1">Gunakan tombol 'Buat Tagihan SPP Bulanan' untuk menambahkan tagihan kelas.</p>
        </div>

        <div v-else class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  <th class="p-4 pl-6">Nama Siswa</th>
                  <th class="p-4">Kelas</th>
                  <th class="p-4">Jumlah Tagihan</th>
                  <th class="p-4">Total Tagihan</th>
                  <th class="p-4">Sisa Tagihan</th>
                  <th class="p-4 text-center">Status</th>
                  <th class="p-4 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-150 dark:divide-zinc-850">
                <tr v-for="student in groupedBills" :key="student.student_id" class="hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
                  <td class="p-4 pl-6">
                    <div class="font-bold text-slate-900 dark:text-zinc-200">{{ student.student_name }}</div>
                    <div class="text-[10px] text-slate-400 font-mono">{{ student.student_nis || '-' }}</div>
                  </td>
                  <td class="p-4 text-slate-650 dark:text-zinc-400 font-semibold">{{ student.class_name || '-' }}</td>
                  <td class="p-4 font-semibold text-slate-600 dark:text-zinc-400">{{ student.bills.length }} Tagihan</td>
                  <td class="p-4 font-semibold text-slate-600 dark:text-zinc-400">{{ formatNumber(student.total_amount) }}</td>
                  <td class="p-4 font-bold" :class="student.unpaid_amount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-450'">
                    {{ formatNumber(student.unpaid_amount) }}
                  </td>
                  <td class="p-4 text-center">
                    <span 
                      class="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border"
                      :class="[
                        student.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      ]"
                    >
                      {{ student.status === 'paid' ? 'Lunas' : 'Belum Lunas' }}
                    </span>
                  </td>
                  <td class="p-4 text-right pr-6">
                    <button 
                      @click="openDetailModal(student)"
                      class="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-750 text-white rounded text-[10px] font-bold transition-colors shadow-sm inline-flex items-center gap-1"
                    >
                      <Search :size="10" /> Detail Tagihan
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab Content 2: General Ledger Journals -->
      <div v-else-if="activeTab === 'journals'" class="space-y-4 animate-in fade-in duration-300">
        <div v-if="journalsList.length === 0" class="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
          <Activity class="mx-auto mb-2 text-violet-500 opacity-60" :size="30" />
          <p class="text-xs font-bold text-slate-700 dark:text-zinc-300">Jurnal Akuntansi Kosong</p>
          <p class="text-[10px] mt-1">Semua aktivitas pembayaran SPP akan ter-posting otomatis sebagai entitas debit & kredit di sini.</p>
        </div>

        <div v-else class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  <th class="p-4 pl-6">Tanggal</th>
                  <th class="p-4">Kode Akun</th>
                  <th class="p-4">Nama Rekening</th>
                  <th class="p-4">Uraian / Deskripsi Transaksi</th>
                  <th class="p-4 text-center">No Ref / Bukti</th>
                  <th class="p-4 text-right">Debit</th>
                  <th class="p-4 text-right pr-6">Kredit</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-150 dark:divide-zinc-850">
                <tr v-for="j in journalsList" :key="j.id" class="hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
                  <td class="p-4 pl-6 font-semibold">{{ formatDate(j.date) }}</td>
                  <td class="p-4 font-mono font-bold">{{ j.account_code }}</td>
                  <td class="p-4 font-semibold text-slate-800 dark:text-zinc-300">{{ j.account_name }}</td>
                  <td class="p-4 text-slate-500">{{ j.description }}</td>
                  <td class="p-4 text-center font-bold text-slate-650">{{ j.reference || '-' }}</td>
                  <td class="p-4 text-right font-bold text-slate-900 dark:text-zinc-200">{{ Number(j.debit) > 0 ? formatNumber(j.debit) : '-' }}</td>
                  <td class="p-4 text-right font-bold text-slate-900 dark:text-zinc-200 pr-6">{{ Number(j.credit) > 0 ? formatNumber(j.credit) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab Content 3: Chart of Accounts (COA) -->
      <div v-else-if="activeTab === 'accounts'" class="space-y-4 animate-in fade-in duration-300">
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  <th class="p-4 pl-6">Kode Akun</th>
                  <th class="p-4">Nama Akun/Rekening</th>
                  <th class="p-4">Klasifikasi / Tipe</th>
                  <th class="p-4 text-right pr-6">Saldo Buku</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-150 dark:divide-zinc-850">
                <tr v-for="acc in accountsList" :key="acc.id" class="hover:bg-slate-50/20 dark:hover:bg-zinc-900/20 transition-colors">
                  <td class="p-4 pl-6 font-mono font-bold">{{ acc.account_code }}</td>
                  <td class="p-4 font-bold text-slate-800 dark:text-zinc-200">{{ acc.name }}</td>
                  <td class="p-4 uppercase text-[10px] font-bold text-slate-500 tracking-wider">{{ acc.type }}</td>
                  <td class="p-4 text-right font-black text-slate-900 dark:text-zinc-100 pr-6">{{ formatNumber(acc.balance) }}</td>
                </tr>
                <tr v-if="accountsList.length === 0">
                  <td colspan="4" class="p-6 text-center text-slate-400">Belum ada akun rekening terdaftar (akan dibuat otomatis saat mencatat pembayaran SPP pertama).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>

    <!-- Modal: Generate SPP Tagihan -->
    <BaseModal :show="showSPPModal" title="Buat Tagihan SPP Bulanan" @close="showSPPModal = false">
      <form @submit.prevent="handleGenerateSPP" class="space-y-4">
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Pilih Kelas Sasaran</label>
          <select v-model="sppForm.class_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option value="" disabled>Pilih Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tipe/Kategori Tagihan</label>
          <select v-model="sppForm.category_id" required class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-medium outline-none focus:border-violet-600">
            <option value="" disabled>Pilih Kategori</option>
            <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <BaseInput v-model="sppForm.amount" label="Nominal Tagihan (IDR)" type="number" required />
        
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="sppForm.period" label="Periode (YYYY-MM)" placeholder="Contoh: 2026-06" required />
          <BaseInput v-model="sppForm.due_date" label="Batas Jatuh Tempo" type="date" required />
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" type="button" @click="showSPPModal = false">Batal</BaseButton>
          <BaseButton variant="primary" type="submit">Buat Tagihan Kelas</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal: Detail Tagihan Siswa -->
    <BaseModal :show="showDetailModal" title="Detail Tagihan Siswa" @close="showDetailModal = false">
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
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
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
  </div>
</template>
