<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DollarSign, UploadCloud, CheckCircle2, Clock, AlertCircle, ArrowLeft, Camera, CreditCard } from 'lucide-vue-next'
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

const { fetchBills, submitPayment } = useParent()
const toast = useToast()

const loading = ref(true)
const billsList = ref<any[]>([])
const selectedBill = ref<any>(null)
const isPaymentModalOpen = ref(false)
const submitting = ref(false)

const paymentForm = ref({
  amount: 0,
  payment_method: 'transfer_bank',
  proof_file_url: ''
})

const loadBills = async () => {
  loading.value = true
  try {
    billsList.value = await fetchBills()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBills()
})

const openPayModal = (bill: any) => {
  selectedBill.value = bill
  paymentForm.value = {
    amount: Number(bill.amount || bill.remaining_amount || 0),
    payment_method: 'transfer_bank',
    proof_file_url: ''
  }
  isPaymentModalOpen.value = true
}

const handleFileUpload = (event: any) => {
  const file = event.target.files[0]
  if (file) {
    // Generate simulated upload url for proof
    paymentForm.value.proof_file_url = URL.createObjectURL(file)
    toast.success('Bukti bayar berhasil dipilih.', 'Sukses')
  }
}

const handlePay = async () => {
  if (!selectedBill.value) return
  submitting.value = true
  try {
    await submitPayment({
      bill_id: selectedBill.value.id,
      amount: paymentForm.value.amount,
      payment_method: paymentForm.value.payment_method,
      proof_file_url: paymentForm.value.proof_file_url || 'https://storage.eduraport.id/proofs/sample.jpg'
    })
    toast.success('Pembayaran berhasil diajukan dan sedang diverifikasi.', 'Sukses')
    isPaymentModalOpen.value = false
    await loadBills()
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengajukan pembayaran.', 'Error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <div class="flex items-center gap-3">
      <NuxtLink to="/" class="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-violet-600 transition">
        <ArrowLeft :size="18" />
      </NuxtLink>
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <DollarSign class="text-rose-500" :size="24" />
          Tagihan & Pembayaran SPP
        </h2>
        <p class="text-xs text-slate-500">Lihat rincian tagihan sekolah dan upload bukti transaksi</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="space-y-4">
      <div v-if="billsList.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BaseCard
          v-for="bill in billsList"
          :key="bill.id"
          stripe
          :class="[
            bill.status === 'paid' || bill.status === 'lunas' ? 'border-t-4 border-t-emerald-500' :
            bill.status === 'pending' ? 'border-t-4 border-t-amber-500' : 'border-t-4 border-t-rose-500'
          ]"
        >
          <div class="flex justify-between items-start">
            <div>
              <span
                :class="[
                  'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-2',
                  bill.status === 'paid' || bill.status === 'lunas' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' :
                  bill.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                ]"
              >
                {{ bill.status === 'paid' || bill.status === 'lunas' ? 'Lunas' : bill.status === 'pending' ? 'Menunggu Verifikasi' : 'Belum Lunas' }}
              </span>
              <h3 class="font-bold text-slate-900 dark:text-zinc-100 text-base leading-snug">
                {{ bill.name || bill.title || 'Tagihan SPP Bulanan' }}
              </h3>
              <p class="text-xs text-slate-500 mt-1">Jatuh Tempo: {{ bill.due_date ? new Date(bill.due_date).toLocaleDateString('id-ID') : '-' }}</p>
            </div>
            <p class="text-lg font-black text-slate-900 dark:text-zinc-100">
              Rp {{ Number(bill.amount || 0).toLocaleString('id-ID') }}
            </p>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
            <BaseButton
              v-if="bill.status !== 'paid' && bill.status !== 'lunas' && bill.status !== 'pending'"
              size="sm"
              class="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs"
              @click="openPayModal(bill)"
            >
              Bayar Sekarang
            </BaseButton>
            <span v-else-if="bill.status === 'pending'" class="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
              <Clock :size="16" /> Verifikasi Pembayaran
            </span>
            <span v-else class="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <CheckCircle2 :size="16" /> Pembayaran Selesai
            </span>
          </div>
        </BaseCard>
      </div>

      <div v-else class="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
        <CheckCircle2 class="mx-auto text-emerald-500 mb-2" :size="36" />
        <p class="text-sm font-bold text-slate-800 dark:text-zinc-200">Tidak ada tagihan tertunggak</p>
        <p class="text-xs text-slate-400 mt-1">Semua kewajiban administrasi telah lunas.</p>
      </div>
    </div>

    <!-- Modal Upload Bukti Bayar / Pembayaran -->
    <BaseModal v-model="isPaymentModalOpen" title="Konfirmasi & Bayar Tagihan">
      <div v-if="selectedBill" class="space-y-4 text-xs">
        <div class="bg-violet-50 dark:bg-violet-950/30 p-3 rounded-lg border border-violet-100 dark:border-violet-900/40">
          <p class="font-bold text-slate-800 dark:text-zinc-200">{{ selectedBill.name || selectedBill.title }}</p>
          <p class="text-base font-black text-violet-600 mt-1">Rp {{ Number(selectedBill.amount || 0).toLocaleString('id-ID') }}</p>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Metode Pembayaran</label>
          <select v-model="paymentForm.payment_method" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-semibold">
            <option value="transfer_bank">Transfer Bank (BCA / Mandiri / BSI)</option>
            <option value="qris">QRIS Standar Nasional</option>
            <option value="va_online">Virtual Account Otomatis</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Upload Bukti Transfer (Opsional / Foto Struk)</label>
          <div class="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-center hover:border-violet-500 transition cursor-pointer relative">
            <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleFileUpload" />
            <Camera class="mx-auto text-slate-400 mb-1" :size="24" />
            <p class="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Pilih dari Galeri atau Foto Kamera</p>
            <p class="text-[9px] text-slate-400">Maksimal 5MB (JPG / PNG)</p>
          </div>
          <p v-if="paymentForm.proof_file_url" class="text-emerald-600 font-semibold text-[10px] mt-1 flex items-center gap-1">
            <CheckCircle2 :size="12" /> Bukti file terlampir
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" size="sm" @click="isPaymentModalOpen = false">Batal</BaseButton>
          <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white" :disabled="submitting" @click="handlePay">
            {{ submitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
