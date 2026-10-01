<script setup lang="ts">
import { Crown, Check, ArrowRight, ShieldCheck, CreditCard, Sparkles, AlertTriangle } from 'lucide-vue-next'
import { BaseButton, BaseInput, BaseModal } from '@eduraport/ui'



const { subscription, loading, fetchSubscription, upgradeSubscription } = useB2CSubscription()
const toast = useToast()

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Rp 0',
    period: ' / 7 hari',
    color: 'border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    features: [
      '1 Sekolah',
      '2 Rombel',
      'Maksimal 60 Siswa',
      '1 Tema Template PDF/Excel',
      'AI Asisten (100x)',
      'Tanpa WA Gateway',
      'Tanpa CS Support',
      'Batas input Data Masa Lalu: 1 Tahun Ajaran Sebelumnya'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 'Rp 29.000',
    period: '/ 1 bulan',
    color: 'border-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/10',
    features: [
      '1 Sekolah',
      '5 Rombel',
      'Maksimal 180 Siswa',
      '3 Tema Template PDF/Excel',
      'AI Asisten (300x)',
      '1 Device WA Gateway',
      'Maksimal 500 Pesan WA/bulan',
      'Standard CS Support',
      'Batas input Data Masa Lalu: 3 Tahun Ajaran Sebelumnya'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Rp 59.000',
    period: '/ 1 bulan',
    color: 'border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    features: [
      '1 Sekolah',
      '15 Rombel',
      'Maksimal 500 Siswa',
      'Semua Tema Template PDF/Excel',
      'AI Asisten (Unlimited)',
      '1 Device WA Gateway',
      'Pesan WA Unlimited',
      'Priority CS Support',
      'Tanpa batas input data masa lalu'
    ]
  }
]

const showUpgradeModal = ref(false)
const selectedPlan = ref<any>(null)
const upgradeForm = ref({
  paymentMethod: 'BCA',
  paymentProofUrl: 'https://example.com/proof.jpg', // Dummy for v1.0
  paymentProofName: 'bukti_transfer.jpg'
})
const upgradeLoading = ref(false)

onMounted(async () => {
  await fetchSubscription()
})

const openUpgrade = (plan: any) => {
  selectedPlan.value = plan
  showUpgradeModal.value = true
}

const submitUpgrade = async () => {
  upgradeLoading.value = true
  const res = await upgradeSubscription({
    planId: selectedPlan.value.id,
    paymentMethod: upgradeForm.value.paymentMethod,
    paymentProofUrl: upgradeForm.value.paymentProofUrl,
    paymentProofName: upgradeForm.value.paymentProofName
  })
  upgradeLoading.value = false

  if (res.success) {
    toast.success('Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.', 'Sukses')
    showUpgradeModal.value = false
  } else {
    toast.error(res.error || 'Gagal mengirim bukti pembayaran', 'Error')
  }
}

const isTrial = computed(() => subscription.value?.status === 'trial')
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Kelola Paket & Layanan</h1>
        <p class="text-slate-500 dark:text-slate-400">Upgrade akun EduRaport Anda untuk menikmati fitur tanpa batas.</p>
      </div>
      <!-- Active Plan Banner (Wait for loading to avoid flicker) -->
      <div v-if="!pending" class="px-4 py-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
          <Crown :size="16" />
        </div>
        <div>
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paket Aktif</p>
          <p class="font-bold text-slate-900 dark:text-white capitalize">{{ subscription?.plan_id || 'starter' }} Plan</p>
        </div>
      </div>
    </div>

    <!-- Alert for Trial -->
    <div v-if="isTrial" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-4">
      <div class="text-amber-500 mt-0.5"><AlertTriangle :size="20"/></div>
      <div>
        <h3 class="font-bold text-amber-800 dark:text-amber-500">Masa Trial Anda Akan Berakhir</h3>
        <p class="text-sm text-amber-700 dark:text-amber-400 mt-1">
          Anda saat ini menggunakan versi Trial. Upgrade sekarang untuk memastikan data Anda aman dan fitur premium tetap aktif.
        </p>
      </div>
    </div>

    <!-- Pricing Plans -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="plan in plans" :key="plan.id" 
           class="bg-white dark:bg-zinc-900 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
           :class="(subscription?.plan_id || 'starter') === plan.id ? plan.color : 'border-slate-200 dark:border-zinc-800'">
        
        <div v-if="(subscription?.plan_id || 'starter') === plan.id" class="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
          Sedang Aktif
        </div>
        
        <div class="p-8">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">{{ plan.name }}</h3>
          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-3xl font-black text-slate-900 dark:text-white">{{ plan.price }}</span>
            <span class="text-sm font-semibold text-slate-500">{{ plan.period }}</span>
          </div>

          <BaseButton 
            v-if="(subscription?.plan_id || 'starter') !== plan.id"
            class="w-full justify-center mb-8" 
            :variant="plan.id !== 'starter' ? 'primary' : 'outline'"
            @click="openUpgrade(plan)"
          >
            Pilih Paket
          </BaseButton>
          <BaseButton v-else class="w-full justify-center mb-8" variant="secondary" disabled>
            Paket Saat Ini
          </BaseButton>

          <div class="space-y-4">
            <div v-for="(feat, idx) in plan.features" :key="idx" class="flex items-start gap-3">
              <div class="mt-0.5 text-emerald-500"><Check :size="16" /></div>
              <span class="text-sm text-slate-600 dark:text-slate-400 font-medium">{{ feat }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <BaseModal 
      :show="showUpgradeModal" 
      :title="`Upgrade ke ${selectedPlan?.name}`" 
      @close="showUpgradeModal = false" 
      size="md"
    >
      <div class="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-xl p-4 mb-6">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">Total Tagihan</span>
          <span class="text-xl font-bold text-violet-700 dark:text-violet-400">{{ selectedPlan?.price }}</span>
        </div>
        <p class="text-xs text-slate-500">Silakan transfer ke rekening berikut:</p>
        <div class="mt-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center gap-3">
          <CreditCard class="text-slate-400" :size="20"/>
          <div>
            <p class="font-bold text-slate-900 dark:text-white">BCA 1234567890</p>
            <p class="text-xs text-slate-500">a.n PT EduRaport Nusantara</p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metode Pembayaran</label>
          <select v-model="upgradeForm.paymentMethod" class="w-full px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100">
            <option value="BCA">Transfer BCA</option>
            <option value="Mandiri">Transfer Mandiri</option>
            <option value="BRI">Transfer BRI</option>
            <option value="E-Wallet">Gopay/OVO/Dana</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Bukti Transfer</label>
          <div class="border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-zinc-800/30">
            <div class="text-slate-400 mb-2">Upload File (Dummy v1.0)</div>
            <BaseInput v-model="upgradeForm.paymentProofUrl" placeholder="URL Bukti (Mock)" class="max-w-xs mx-auto text-center" />
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" class="flex-1 justify-center" @click="showUpgradeModal = false">Batal</BaseButton>
        <BaseButton variant="primary" class="flex-1 justify-center" @click="submitUpgrade" :loading="upgradeLoading">Konfirmasi Pembayaran</BaseButton>
      </template>
    </BaseModal>

  </div>
</template>
