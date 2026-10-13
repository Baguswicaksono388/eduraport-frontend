<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Wallet, ArrowLeft, Plus, AlertTriangle, ArrowUpRight, ArrowDownLeft, Sliders, CheckCircle2 } from 'lucide-vue-next'
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

const { fetchMyChildren, myChildren, fetchWallet, fetchWalletTransactions, topupWallet, updateWalletLimits } = useParent()
const toast = useToast()

const selectedChildId = ref('')
const loading = ref(true)
const walletData = ref<any>(null)
const transactions = ref<any[]>([])

const isTopupModal = ref(false)
const topupAmount = ref(50000)
const paymentMethod = ref('qris')
const isLimitsModal = ref(false)
const limitsForm = ref({ daily_limit: 25000, weekly_limit: 100000 })
const processing = ref(false)

const activeChild = computed(() => {
  return myChildren.value.find((c: any) => c.student_id === selectedChildId.value) || myChildren.value[0]
})

const loadWallet = async () => {
  if (!selectedChildId.value) return
  loading.value = true
  try {
    const [w, t] = await Promise.all([
      fetchWallet(selectedChildId.value),
      fetchWalletTransactions(selectedChildId.value, 1, 20)
    ])
    walletData.value = w
    transactions.value = t
    if (w?.limits) {
      limitsForm.value.daily_limit = Number(w.limits.daily_limit || 25000)
      limitsForm.value.weekly_limit = Number(w.limits.weekly_limit || 100000)
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchMyChildren()
  if (myChildren.value.length > 0) {
    selectedChildId.value = myChildren.value[0].student_id
    await loadWallet()
  } else {
    loading.value = false
  }
})

watch(selectedChildId, () => {
  loadWallet()
})

const handleTopup = async () => {
  processing.value = true
  try {
    await topupWallet(selectedChildId.value, topupAmount.value, paymentMethod.value)
    toast.success('Pengisian saldo berhasil diajukan.', 'Sukses')
    isTopupModal.value = false
    await loadWallet()
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengisi saldo.', 'Error')
  } finally {
    processing.value = false
  }
}

const handleSaveLimits = async () => {
  processing.value = true
  try {
    await updateWalletLimits({
      student_id: selectedChildId.value,
      daily_limit: limitsForm.value.daily_limit,
      weekly_limit: limitsForm.value.weekly_limit
    })
    toast.success('Limit jajan harian berhasil diperbarui.', 'Sukses')
    isLimitsModal.value = false
    await loadWallet()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan limit.', 'Error')
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-violet-600 transition">
          <ArrowLeft :size="18" />
        </NuxtLink>
        <div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Wallet class="text-violet-600" :size="24" />
            Dompet Digital & Kantin Cashless
          </h2>
          <p class="text-xs text-slate-500">Kelola saldo kartu jajan kantin sekolah dan atur batas pengeluaran</p>
        </div>
      </div>

      <div v-if="myChildren.length > 1" class="w-44">
        <select v-model="selectedChildId" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-violet-600">
          <option v-for="c in myChildren" :key="c.student_id" :value="c.student_id">
            {{ c.student_name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- Saldo Card -->
      <div class="bg-gradient-to-r from-violet-600 to-indigo-700 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-violet-200">Saldo Kartu Kantin &bull; {{ activeChild?.student_name }}</span>
          <h3 class="text-3xl md:text-4xl font-black mt-1">
            Rp {{ Number(walletData?.balance || 0).toLocaleString('id-ID') }}
          </h3>
          <p class="text-xs text-violet-200 mt-2">
            Pengeluaran hari ini: Rp {{ Number(walletData?.today_spending || 0).toLocaleString('id-ID') }}
            {{ walletData?.limits?.daily_limit ? `(Limit harian: Rp ${Number(walletData.limits.daily_limit).toLocaleString('id-ID')})` : '' }}
          </p>
        </div>

        <div class="flex gap-2 w-full md:w-auto">
          <BaseButton size="sm" class="bg-white text-violet-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5" @click="isTopupModal = true">
            <Plus :size="16" /> Top Up Saldo
          </BaseButton>
          <BaseButton size="sm" variant="outline" class="border-white/30 text-white hover:bg-white/10 font-bold text-xs flex items-center gap-1.5" @click="isLimitsModal = true">
            <Sliders :size="16" /> Atur Limit
          </BaseButton>
        </div>
      </div>

      <!-- Alert Rendah Saldo -->
      <div v-if="Number(walletData?.balance || 0) < 15000" class="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
        <AlertTriangle :size="18" class="shrink-0" />
        <span>Saldo kantin ananda hampir habis. Silakan lakukan top up agar transaksi jajan tidak terkendala.</span>
      </div>

      <!-- Transactions History -->
      <BaseCard>
        <h4 class="font-bold text-slate-900 dark:text-zinc-100 text-sm mb-4">Riwayat Transaksi Kantin</h4>
        <div v-if="transactions.length > 0" class="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
          <div v-for="t in transactions" :key="t.id" class="py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="p-2 rounded-xl"
                :class="t.type === 'topup' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'"
              >
                <ArrowDownLeft v-if="t.type === 'topup'" :size="16" />
                <ArrowUpRight v-else :size="16" />
              </div>
              <div>
                <p class="font-bold text-slate-800 dark:text-zinc-200">{{ t.description || (t.type === 'topup' ? 'Top Up Saldo' : 'Jajan Kantin') }}</p>
                <p class="text-[10px] text-slate-400">{{ new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}</p>
              </div>
            </div>

            <p
              class="font-black text-sm"
              :class="t.type === 'topup' ? 'text-emerald-600' : 'text-slate-800 dark:text-zinc-200'"
            >
              {{ t.type === 'topup' ? '+' : '-' }} Rp {{ Number(t.amount).toLocaleString('id-ID') }}
            </p>
          </div>
        </div>
        <div v-else class="text-center py-10 text-slate-400 text-xs">
          Belum ada riwayat transaksi kantin.
        </div>
      </BaseCard>
    </template>

    <!-- Modal Top Up -->
    <BaseModal v-model="isTopupModal" title="Top Up Saldo Dompet Kantin">
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1.5">Pilih Nominal Top Up</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="amt in [20000, 50000, 100000]"
              :key="amt"
              type="button"
              @click="topupAmount = amt"
              :class="[
                'p-2.5 rounded-xl border font-bold text-center transition',
                topupAmount === amt ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
              ]"
            >
              Rp {{ amt.toLocaleString('id-ID') }}
            </button>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Metode Pembayaran</label>
          <select v-model="paymentMethod" class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-semibold text-xs outline-none">
            <option value="qris">QRIS (GoPay / OVO / Dana / BCA)</option>
            <option value="va_bca">Virtual Account BCA</option>
            <option value="va_mandiri">Virtual Account Mandiri</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" size="sm" @click="isTopupModal = false">Batal</BaseButton>
          <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white" :disabled="processing" @click="handleTopup">
            {{ processing ? 'Memproses...' : 'Lanjut Pembayaran' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal Set Limit -->
    <BaseModal v-model="isLimitsModal" title="Atur Batas Belanja Kantin">
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Batas Maksimal Harian</label>
          <input
            v-model.number="limitsForm.daily_limit"
            type="number"
            step="5000"
            class="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 font-semibold text-xs"
          />
          <p class="text-[10px] text-slate-400 mt-1">Kartu tidak bisa dipakai jika transaksi melebihi limit ini dalam 1 hari.</p>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <BaseButton variant="outline" size="sm" @click="isLimitsModal = false">Batal</BaseButton>
          <BaseButton size="sm" class="bg-violet-600 hover:bg-violet-700 text-white" :disabled="processing" @click="handleSaveLimits">
            Simpan Limit
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
