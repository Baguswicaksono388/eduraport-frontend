<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Receipt, UploadCloud, CreditCard, Clock, Search, FileDown } from 'lucide-vue-next'
import { BaseButton, BaseInput } from '@eduraport/ui'
import { useFinancial } from '../../composables/useFinancial'
import { useSchoolContext } from '../../composables/useSchoolContext'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  isOpen: Boolean,
  studentId: String,
  studentName: String,
})

const emit = defineEmits(['close', 'payment-success'])

const { selectedSchoolId } = useSchoolContext()
const { getStudentBilling, recordPayment, uploadProof } = useFinancial()
const toast = useToast()

const loading = ref(false)
const processing = ref(false)
const bills = ref<any[]>([])

const selectedBillIds = ref<string[]>([])
const paymentAmount = ref('')
const paymentMethod = ref('tunai') // tunai, transfer_manual
const note = ref('')
const proofFile = ref<File | null>(null)
const proofUrl = ref('')
const rawResponseDebug = ref<any>(null)

const receiptData = ref<{ receipt_number: string, receipt_url: string } | null>(null)

watch([() => props.isOpen, () => props.studentId], async ([newIsOpen, newStudentId]) => {
  if (newIsOpen && newStudentId && selectedSchoolId.value) {
    await fetchBilling()
  } else if (!newIsOpen) {
    resetForm()
  }
})

const fetchBilling = async () => {
  loading.value = true
  try {
    const res = await getStudentBilling(selectedSchoolId.value, props.studentId!)
    
    // DEBUG: temporary variable to see response structure
    rawResponseDebug.value = res

    if (res.data && res.data.bills) {
      bills.value = res.data.bills
    } else if (res.bills) {
      bills.value = res.bills
    } else {
      bills.value = res
    }
    
    // Auto-select all bills by default
    selectedBillIds.value = bills.value.map((b: any) => b.id)
    paymentAmount.value = totalSelectedAmount.value.toString()
  } catch (error) {
    toast.error('Gagal mengambil data tagihan', 'Error')
  } finally {
    loading.value = false
  }
}

const toggleSelectAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    selectedBillIds.value = bills.value.map((b: any) => b.id)
  } else {
    selectedBillIds.value = []
  }
  updateDefaultAmount()
}

const toggleBill = (id: string) => {
  if (selectedBillIds.value.includes(id)) {
    selectedBillIds.value = selectedBillIds.value.filter(bId => bId !== id)
  } else {
    selectedBillIds.value.push(id)
  }
  updateDefaultAmount()
}

const totalSelectedAmount = computed(() => {
  return bills.value
    .filter((b: any) => selectedBillIds.value.includes(b.id))
    .reduce((sum: number, b: any) => {
      const remaining = Number(b.amount) - (Number(b.amount_paid) || 0)
      return sum + remaining
    }, 0)
})

const updateDefaultAmount = () => {
  paymentAmount.value = totalSelectedAmount.value.toString()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    proofFile.value = target.files[0]
  }
}

const submitPayment = async () => {
  if (selectedBillIds.value.length === 0) {
    toast.error('Pilih minimal satu tagihan untuk dibayar', 'Error')
    return
  }
  
  if (!paymentAmount.value || Number(paymentAmount.value) <= 0) {
    toast.error('Masukkan nominal pembayaran', 'Error')
    return
  }

  processing.value = true
  try {
    // 1. Upload proof if any
    let uploadedProofUrl = null
    if (proofFile.value) {
      const uploadRes = await uploadProof(selectedSchoolId.value, proofFile.value)
      uploadedProofUrl = uploadRes.data.url
    }

    // 2. Record payment
    const res = await recordPayment(selectedSchoolId.value, {
      bill_ids: selectedBillIds.value,
      amount: paymentAmount.value.replace(/\D/g, ''), // strip non-numeric just in case
      method: paymentMethod.value,
      note: note.value,
      proof_file_url: uploadedProofUrl,
    })

    receiptData.value = {
      receipt_number: res.data.receipt_number,
      receipt_url: res.data.receipt_url
    }

    toast.success('Pembayaran berhasil dicatat', 'Sukses')
    emit('payment-success')
    
  } catch (error: any) {
    toast.error(error.data?.message || 'Gagal memproses pembayaran', 'Error')
  } finally {
    processing.value = false
  }
}

const resetForm = () => {
  bills.value = []
  selectedBillIds.value = []
  paymentAmount.value = ''
  paymentMethod.value = 'tunai'
  note.value = ''
  proofFile.value = null
  receiptData.value = null
}

const closeDrawer = () => {
  emit('close')
}

const downloadReceipt = () => {
  if (receiptData.value?.receipt_url) {
    const token = useCookie('auth_token').value
    const separator = receiptData.value.receipt_url.includes('?') ? '&' : '?'
    const url = `${receiptData.value.receipt_url}${separator}token=${token}`
    window.open(url, '_blank')
  }
}

const formatNumber = (num: string | number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(num))
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" @click="closeDrawer"></div>
    
    <div class="fixed inset-y-0 right-0 w-full max-w-[470px] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
      
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-zinc-200">Kasir Pembayaran</h2>
          <p class="text-xs text-slate-500">{{ studentName }}</p>
        </div>
        <button @click="closeDrawer" class="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <X :size="20" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        
        <div v-if="loading" class="flex justify-center p-8">
          <div class="animate-spin h-6 w-6 border-2 border-violet-600 border-t-transparent rounded-full"></div>
        </div>

        <template v-else-if="!receiptData">
          <!-- Bills Selection -->
          <div class="space-y-3">
            <div class="flex justify-between items-end mb-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h3 class="font-bold text-sm text-slate-700 dark:text-zinc-300">Pilih Tagihan</h3>
              <label class="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input 
                  type="checkbox" 
                  class="rounded text-violet-600"
                  :checked="selectedBillIds.length === bills.length && bills.length > 0"
                  @change="toggleSelectAll"
                >
                Pilih Semua
              </label>
            </div>
            
            <div v-if="bills.length === 0 || !Array.isArray(bills)" class="text-center p-4 border border-dashed rounded-xl text-sm text-slate-400">
              <p>Tidak ada tagihan tertunggak untuk siswa ini.</p>
            </div>

            <template v-else>
              <div v-for="bill in bills" :key="bill.id" 
                 class="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer"
                 :class="selectedBillIds.includes(bill.id) ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10' : 'border-slate-200 dark:border-zinc-800'"
                 @click="toggleBill(bill.id)">
              
              <input type="checkbox" :checked="selectedBillIds.includes(bill.id)" class="rounded text-violet-600 pointer-events-none">
              
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm text-slate-800 dark:text-zinc-200 truncate">{{ bill.name }}</div>
                <div class="text-xs text-slate-500">Jatuh Tempo: {{ formatDate(bill.due_date) }}</div>
              </div>
              
              <div class="text-right font-mono font-bold text-slate-700 dark:text-zinc-300">
                {{ formatNumber(Number(bill.amount) - (Number(bill.amount_paid) || 0)) }}
              </div>
            </div>
            </template>
            
            <div class="flex justify-between font-bold p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl mt-2">
              <span class="text-sm">Total Terpilih</span>
              <span class="font-mono text-violet-600">{{ formatNumber(totalSelectedAmount) }}</span>
            </div>
          </div>

          <!-- Payment Form -->
          <div class="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <h3 class="font-bold text-sm text-slate-700 dark:text-zinc-300">Detail Pembayaran</h3>
            
            <div>
              <label class="block text-xs font-semibold mb-1">Nominal Pembayaran (Rp)</label>
              <BaseInput v-model="paymentAmount" type="text" placeholder="Cth: 150000" class="font-mono" />
              <p class="text-[10px] text-slate-400 mt-1">Pembayaran parsial diperbolehkan. Otomatis dibagi rata secara proporsional ke tagihan yang dipilih.</p>
            </div>

            <div>
              <label class="block text-xs font-semibold mb-1">Metode Pembayaran</label>
              <select v-model="paymentMethod" class="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-sm">
                <option value="tunai">Tunai / Cash</option>
                <option value="transfer_manual">Transfer Bank Manual</option>
              </select>
            </div>

            <div v-if="paymentMethod === 'transfer_manual'">
              <label class="block text-xs font-semibold mb-1">Bukti Transfer (Opsional)</label>
              <div class="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer relative">
                <input type="file" @change="handleFileChange" accept="image/*,.pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div class="flex flex-col items-center gap-2">
                  <UploadCloud :size="24" class="text-slate-400" />
                  <span class="text-xs text-slate-500">{{ proofFile ? proofFile.name : 'Pilih file atau drop disini' }}</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold mb-1">Catatan (Opsional)</label>
              <BaseInput v-model="note" type="text" placeholder="Catatan tambahan..." />
            </div>
          </div>
        </template>
        
        <!-- Success State -->
        <div v-else class="flex flex-col items-center justify-center h-full space-y-6 py-12">
          <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center">
            <Receipt :size="32" />
          </div>
          <div class="text-center">
            <h3 class="text-xl font-bold text-slate-800 dark:text-zinc-200 mb-2">Pembayaran Berhasil!</h3>
            <p class="text-sm text-slate-500">Kwitansi telah di-generate: <br><span class="font-mono font-bold text-slate-700 dark:text-zinc-300">{{ receiptData.receipt_number }}</span></p>
          </div>
          
          <BaseButton @click="downloadReceipt" variant="outline" class="w-full gap-2 justify-center border-violet-200 text-violet-700 hover:bg-violet-50">
            <FileDown :size="18" /> Unduh Kwitansi (PDF)
          </BaseButton>
          <BaseButton @click="closeDrawer" variant="primary" class="w-full justify-center">
            Selesai
          </BaseButton>
        </div>

      </div>

      <!-- Footer -->
      <div v-if="!receiptData" class="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
        <BaseButton @click="submitPayment" :disabled="processing || selectedBillIds.length === 0" variant="primary" class="w-full justify-center font-bold">
          {{ processing ? 'Memproses...' : 'Proses Pembayaran' }}
        </BaseButton>
      </div>

    </div>
  </div>
</template>
