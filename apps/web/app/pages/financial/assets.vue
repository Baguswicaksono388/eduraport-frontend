<script setup lang="ts">
import { useSchoolContext } from '../../composables/useSchoolContext'
import { useFinancial } from '../../composables/useFinancial'
import { useToast } from '../../composables/useToast'
import { 
  Boxes, Plus, Search, Filter, Trash2, Edit, Printer, FileSpreadsheet,
  Download, Upload, Info, CheckCircle, AlertCircle, XCircle, Clock
} from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseInput } from '@eduraport/ui'
import { ASSET_CATEGORIES, DEPRECIATION_METHODS } from '@eduraport/shared'
import { formatNumber, formatDate } from '~/utils/format'
import AssetFormModal from '../../components/financial/AssetFormModal.vue'
import AssetDisposeModal from '../../components/financial/AssetDisposeModal.vue'
import AssetConditionLogsModal from '../../components/financial/AssetConditionLogsModal.vue'
import { ref, reactive, computed, watch, onMounted } from 'vue'

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

const { selectedFoundationId, selectedSchoolId, foundations, schools, initContext, onFoundationChange } = useSchoolContext()
const { 
  assetsList, fetchAssets, createAsset, updateAsset, disposeAsset, deleteAsset, 
  exportAssets, importAssets, downloadTemplate, getAssetConditionLogs,
  uploadAssetPhoto, deleteAssetPhoto, assetsMeta
} = useFinancial()
const toast = useToast()

const filters = reactive({
  category: '',
  condition: '',
  search: '',
  includeDisposed: false,
  page: 1,
  limit: 10
})

const showFormModal = ref(false)
const showDisposeModal = ref(false)
const showLogsModal = ref(false)
const selectedAsset = ref<any>(null)
const assetLogs = ref<any[]>([])

const getCategoryLabel = (val: string) => ASSET_CATEGORIES.find(c => c.value === val)?.label || val
const getDepreciationLabel = (val: string) => DEPRECIATION_METHODS.find(m => m.value === val)?.label || val

const conditionConfig: Record<string, { label: string; icon: any; colorClass: string }> = {
  good: { label: 'Baik', icon: CheckCircle, colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  repair_needed: { label: 'Perlu Perbaikan', icon: AlertCircle, colorClass: 'text-amber-600 bg-amber-50 border-amber-200' },
  broken: { label: 'Rusak', icon: XCircle, colorClass: 'text-rose-600 bg-rose-50 border-rose-200' },
  disposed: { label: 'Dihapusbukukan', icon: Trash2, colorClass: 'text-slate-600 bg-slate-50 border-slate-200' },
}

const getConditionBadge = (cond: string) => conditionConfig[cond] || conditionConfig.good

const totalNilai = computed(() => {
  return assetsList.value
    .filter(a => a.status === 'active')
    .reduce((sum, a) => sum + (Number(a.purchase_cost) * Number(a.quantity || 1)), 0)
})

const activeAssetsCount = computed(() => assetsList.value.filter(a => a.status === 'active').length)
const goodAssetsCount = computed(() => assetsList.value.filter(a => a.status === 'active' && a.condition === 'good').length)
const disposedAssetsCount = computed(() => assetsList.value.filter(a => a.status === 'disposed').length)

const goodPercentage = computed(() => activeAssetsCount.value ? Math.round((goodAssetsCount.value / activeAssetsCount.value) * 100) : 0)

const loadAssets = async () => {
  if (selectedSchoolId.value) {
    await fetchAssets(selectedSchoolId.value, filters)
  }
}

const handlePageChange = (page: number) => {
  filters.page = page
  loadAssets()
}

const handleLimitChange = (limit: number) => {
  filters.limit = limit
  filters.page = 1
  loadAssets()
}

watch([selectedSchoolId, filters], () => {
  loadAssets()
}, { immediate: true, deep: true })

onMounted(async () => {
  const schoolId = await initContext()
  if (schoolId) {
    await loadAssets()
  }
})

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))

const fileInputRef = ref<HTMLInputElement | null>(null)
const handleImportExcel = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    try {
      const res = await importAssets(selectedSchoolId.value, target.files[0])
      if (res.success) {
        toast.success(`Import berhasil: ${res.data.success} aset diimpor. ${res.data.failed} gagal.`, 'Berhasil')
        if (res.data.errors?.length) {
          console.warn('Import errors:', res.data.errors)
        }
      } else {
        toast.error(res.message || 'Gagal import aset', 'Error')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat import', 'Error')
    }
    target.value = ''
  }
}

const handleExport = (format: 'xlsx' | 'pdf') => {
  exportAssets(selectedSchoolId.value, format)
}

const openCreateModal = () => {
  selectedAsset.value = null
  showFormModal.value = true
}

const openEditModal = (asset: any) => {
  selectedAsset.value = { ...asset }
  showFormModal.value = true
}

const openDisposeModal = (asset: any) => {
  selectedAsset.value = asset
  showDisposeModal.value = true
}

const openLogsModal = async (asset: any) => {
  selectedAsset.value = asset
  try {
    const res: any = await getAssetConditionLogs(selectedSchoolId.value, asset.id)
    if (res.success) {
      assetLogs.value = res.data
      showLogsModal.value = true
    }
  } catch (err: any) {
    toast.error('Gagal mengambil riwayat kondisi', 'Error')
  }
}

const handleSaveAsset = async (payload: any, photoFile?: File) => {
  try {
    let res: any
    if (selectedAsset.value?.id) {
      res = await updateAsset(selectedSchoolId.value, selectedAsset.value.id, payload)
      if (res.success && photoFile) {
        await uploadAssetPhoto(selectedSchoolId.value, selectedAsset.value.id, photoFile)
      }
      toast.success('Aset berhasil diperbarui', 'Sukses')
    } else {
      res = await createAsset(selectedSchoolId.value, payload)
      if (res.success && photoFile && res.data?.id) {
        await uploadAssetPhoto(selectedSchoolId.value, res.data.id, photoFile)
      }
      toast.success('Aset berhasil didaftarkan', 'Sukses')
    }
    showFormModal.value = false
    loadAssets()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan aset', 'Error')
  }
}

const handleDisposeAsset = async (payload: any) => {
  try {
    await disposeAsset(selectedSchoolId.value, selectedAsset.value.id, payload)
    toast.success('Aset berhasil dihapusbukukan', 'Sukses')
    showDisposeModal.value = false
    loadAssets()
  } catch (err: any) {
    toast.error(err.message || 'Gagal menghapusbukukan aset', 'Error')
  }
}

const getPhotoUrl = (assetId: string) => {
  return `/api/school/${selectedSchoolId.value}/financial/assets/${assetId}/photo?t=${new Date().getTime()}`
}
</script>

<template>
  <div class="flex-1 space-y-4 p-4 md:p-8 pt-6">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
      <div class="space-y-2">
        <h2 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">Manajemen Aset Inventaris</h2>
      </div>

      <!-- School Switcher -->
      <div class="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div class="space-y-1.5 w-full sm:w-48">
          <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Yayasan</label>
          <select 
            v-model="selectedFoundationId" 
            class="w-full text-xs font-semibold rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 p-2 text-slate-700 dark:text-zinc-300"
          >
            <option v-for="f in foundations" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <div class="space-y-1.5 w-full sm:w-48">
          <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Unit Sekolah</label>
          <select 
            v-model="selectedSchoolId" 
            class="w-full text-xs font-semibold rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 p-2 text-slate-700 dark:text-zinc-300"
          >
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }} ({{ s.level }})</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <BaseCard>
        <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium dark:text-slate-200">Total Nilai Aset</h3>
          <div class="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-full">
            <Boxes class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div class="p-6 pt-0">
          <div class="text-2xl font-bold dark:text-slate-100">{{ formatNumber(totalNilai) }}</div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Nilai perolehan aset aktif</p>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium dark:text-slate-200">Total Aset Aktif</h3>
          <div class="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-full">
            <FileSpreadsheet class="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div class="p-6 pt-0">
          <div class="text-2xl font-bold dark:text-slate-100">{{ activeAssetsCount }} <span class="text-sm font-normal text-slate-500 dark:text-slate-400">unit</span></div>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium dark:text-slate-200">Kondisi Baik</h3>
          <div class="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-full">
            <CheckCircle class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div class="p-6 pt-0">
          <div class="text-2xl font-bold dark:text-slate-100">{{ goodAssetsCount }} <span class="text-sm font-normal text-slate-500 dark:text-slate-400">unit</span></div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ goodPercentage }}% dari total aset aktif</p>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="tracking-tight text-sm font-medium dark:text-slate-200">Dihapusbukukan</h3>
          <div class="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-full">
            <Trash2 class="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
        <div class="p-6 pt-0">
          <div class="text-2xl font-bold dark:text-slate-100">{{ disposedAssetsCount }} <span class="text-sm font-normal text-slate-500 dark:text-slate-400">item</span></div>
        </div>
      </BaseCard>
    </div>

    <!-- Toolbar -->
    <BaseCard>
      <div class="p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-lg">
        <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
          <div class="relative w-full md:w-64">
            <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <BaseInput
              v-model="filters.search"
              placeholder="Cari kode atau nama..."
              class="pl-9 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <select 
            v-model="filters.category"
            class="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Semua Kategori</option>
            <option v-for="cat in ASSET_CATEGORIES" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
          <select 
            v-model="filters.condition"
            class="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Semua Kondisi</option>
            <option value="good">Baik</option>
            <option value="repair_needed">Perlu Perbaikan</option>
            <option value="broken">Rusak</option>
          </select>
          
          <label class="flex items-center space-x-2 text-sm cursor-pointer md:ml-2">
            <input 
              type="checkbox" 
              v-model="filters.includeDisposed"
              class="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500"
            >
            <span class="text-slate-700 dark:text-slate-300">Tampilkan Dihapusbukukan</span>
          </label>
        </div>

        <div class="flex flex-wrap gap-2 md:justify-end">
          <!-- Dropdown Export -->
          <div class="relative group">
            <BaseButton variant="outline" class="gap-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
              <Download class="w-4 h-4" /> Export
            </BaseButton>
            <div class="absolute right-0 pt-2 w-48 hidden group-hover:block z-10">
              <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg overflow-hidden py-1">
                <button @click="handleExport('xlsx')" class="w-full text-left px-4 py-2 text-sm dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                  <FileSpreadsheet class="w-4 h-4 text-emerald-600" /> Excel (.xlsx)
                </button>
                <button @click="handleExport('pdf')" class="w-full text-left px-4 py-2 text-sm dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                  <Printer class="w-4 h-4 text-rose-600" /> PDF Report
                </button>
              </div>
            </div>
          </div>
          
          <!-- Dropdown Import -->
          <div class="relative group">
            <BaseButton variant="outline" class="gap-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
              <Upload class="w-4 h-4" /> Import
            </BaseButton>
            <div class="absolute right-0 pt-2 w-48 hidden group-hover:block z-10">
              <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg overflow-hidden py-1">
                <button @click="downloadTemplate(selectedSchoolId)" class="w-full text-left px-4 py-2 text-sm dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                  <Download class="w-4 h-4 text-slate-500 dark:text-slate-400" /> Unduh Template
                </button>
                <button @click="fileInputRef?.click()" class="w-full text-left px-4 py-2 text-sm dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                  <Upload class="w-4 h-4 text-emerald-600" /> Upload Excel
                </button>
              </div>
            </div>
          </div>
          
          <input 
            type="file" 
            ref="fileInputRef" 
            accept=".xlsx, .xls" 
            class="hidden" 
            @change="handleImportExcel"
          >
          
          <BaseButton @click="openCreateModal" class="gap-2">
            <Plus class="w-4 h-4" /> Tambah Aset
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Table -->
    <BaseCard>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="px-4 py-3 font-medium">Info Aset</th>
              <th class="px-4 py-3 font-medium">Kategori</th>
              <th class="px-4 py-3 font-medium text-right">Perolehan</th>
              <th class="px-4 py-3 font-medium">Lokasi</th>
              <th class="px-4 py-3 font-medium text-center">Kondisi</th>
              <th class="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in assetsList" :key="asset.id" class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" :class="{'opacity-75': asset.status === 'disposed'}">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 relative">
                    <img :src="getPhotoUrl(asset.id)" class="h-full w-full object-cover" @error="(e: any) => e.target.style.display = 'none'" />
                    <Boxes class="h-5 w-5 text-slate-400 dark:text-slate-500 absolute" style="z-index: -1" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-900 dark:text-slate-100" :class="{'line-through text-slate-500 dark:text-slate-500': asset.status === 'disposed'}">{{ asset.name }}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ asset.code || '-' }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
                {{ getCategoryLabel(asset.category) }}
                <div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ asset.quantity }} unit</div>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="font-medium text-slate-700 dark:text-slate-300">{{ formatNumber(Number(asset.purchase_cost)) }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{{ formatDate(asset.purchase_date) }}</div>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
                {{ asset.location || '-' }}
              </td>
              <td class="px-4 py-3 text-center">
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                     :class="getConditionBadge(asset.condition).colorClass">
                  <component :is="getConditionBadge(asset.condition).icon" class="w-3.5 h-3.5" />
                  {{ getConditionBadge(asset.condition).label }}
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <button @click="openLogsModal(asset)" class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded" title="Riwayat Kondisi">
                    <Clock class="w-4 h-4" />
                  </button>
                  <button v-if="asset.status === 'active'" @click="openEditModal(asset)" class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded" title="Edit Aset">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button v-if="asset.status === 'active'" @click="openDisposeModal(asset)" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded" title="Hapusbukukan">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="assetsList.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                Tidak ada data aset yang ditemukan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="assetsMeta.total > 0" class="mt-4 pb-2 border-t border-slate-100 dark:border-slate-800 pt-4">
        <AppPagination
          v-model:page="assetsMeta.page"
          v-model:itemPerPage="assetsMeta.limit"
          :total-item="assetsMeta.total"
          :total-page="assetsMeta.total_pages"
          @update:page="handlePageChange"
          @update:itemPerPage="handleLimitChange"
        />
      </div>
    </BaseCard>

    <AssetFormModal 
      v-if="showFormModal"
      :show="showFormModal" 
      :initial-data="selectedAsset" 
      @close="showFormModal = false"
      @save="handleSaveAsset"
    />

    <AssetDisposeModal
      v-if="showDisposeModal"
      :show="showDisposeModal"
      :asset="selectedAsset"
      @close="showDisposeModal = false"
      @save="handleDisposeAsset"
    />

    <AssetConditionLogsModal
      v-if="showLogsModal"
      :show="showLogsModal"
      :asset="selectedAsset"
      :logs="assetLogs"
      @close="showLogsModal = false"
    />
  </div>
</template>
