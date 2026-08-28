<script setup lang="ts">
import { useSchoolContext } from '../../composables/useSchoolContext'
import { Plus, Trash2, Edit2, Scale, AlertTriangle, Trophy } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useDiscipline } from '../../composables/useDiscipline'

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
const { pointRules, fetchPointRules, createPointRule, updatePointRule, deletePointRule } = useDiscipline()

const filteredSchools = computed(() => {
  return schools.value.filter(s => s.level !== 'TK')
})

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingRuleId = ref('')

const ruleForm = reactive({
  rule_code: '',
  name: '',
  category: 'violation',
  point_value: 1
})

watch(selectedFoundationId, onFoundationChange)

onMounted(async () => {
  await initContext()
  
  if (filteredSchools.value.length > 0 && !filteredSchools.value.find(s => s.id === selectedSchoolId.value)) {
    selectedSchoolId.value = filteredSchools.value[0].id
  }

  if (selectedSchoolId.value) {
    await fetchPointRules()
  }
})

watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await fetchPointRules()
  } else {
    pointRules.value = []
  }
})

const handleCreateRule = async () => {
  try {
    const res = await createPointRule({ ...ruleForm })
    if (res.success) {
      showCreateModal.value = false
      Object.assign(ruleForm, {
        rule_code: '',
        name: '',
        category: 'violation',
        point_value: 1
      })
    }
  } catch (e: any) {
    alert(e?.message ?? 'Gagal membuat aturan poin')
  }
}

const openEditModal = (rule: any) => {
  editingRuleId.value = rule.id
  Object.assign(ruleForm, {
    rule_code: rule.rule_code,
    name: rule.name,
    category: rule.category,
    point_value: rule.point_value
  })
  showEditModal.value = true
}

const handleUpdateRule = async () => {
  try {
    const res = await updatePointRule(editingRuleId.value, { ...ruleForm })
    if (res.success) {
      showEditModal.value = false
    }
  } catch (e: any) {
    alert(e?.message ?? 'Gagal memperbarui aturan')
  }
}

const handleDeleteRule = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus aturan poin ini?')) {
    try {
      await deletePointRule(id)
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menghapus aturan')
    }
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Aturan Kedisiplinan & Prestasi</h2>
        <p class="text-xs text-slate-500 dark:text-zinc-400">Kelola master data aturan poin pelanggaran dan poin prestasi siswa.</p>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="primary" @click="showCreateModal = true" :disabled="!selectedSchoolId" class="py-2.5 px-4 text-xs font-bold">
          <Plus class="mr-1.5" :size="14" /> Tambah Aturan Baru
        </BaseButton>
      </div>
    </div>

    <!-- Filters and Selection -->
    <div v-if="!isSchoolLocked" class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Yayasan</label>
        <select v-model="selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Yayasan</option>
          <option v-for="found in foundations" :key="found.id" :value="found.id">{{ found.name }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Unit Sekolah</label>
        <select v-model="selectedSchoolId" :disabled="!selectedFoundationId" class="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none text-slate-900 dark:text-zinc-100">
          <option value="" disabled>Pilih Unit Sekolah</option>
          <option v-for="school in filteredSchools" :key="school.id" :value="school.id">{{ school.name }}</option>
        </select>
      </div>
    </div>

    <!-- Rules Table -->
    <BaseCard class="overflow-hidden border-slate-200/60 dark:border-zinc-800/80 shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
            <tr>
              <th scope="col" class="px-6 py-4 font-semibold uppercase tracking-wider">Kode</th>
              <th scope="col" class="px-6 py-4 font-semibold uppercase tracking-wider">Tipe</th>
              <th scope="col" class="px-6 py-4 font-semibold uppercase tracking-wider">Deskripsi Aturan</th>
              <th scope="col" class="px-6 py-4 font-semibold uppercase tracking-wider">Poin</th>
              <th scope="col" class="px-6 py-4 font-semibold text-right uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-zinc-800/50">
            <tr v-for="rule in pointRules" :key="rule.id" class="hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors">
              <td class="px-6 py-4 font-mono text-xs">{{ rule.rule_code }}</td>
              <td class="px-6 py-4">
                <span v-if="rule.category === 'violation'" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                  <AlertTriangle class="w-3 h-3 mr-1" /> Pelanggaran
                </span>
                <span v-else class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                  <Trophy class="w-3 h-3 mr-1" /> Prestasi
                </span>
              </td>
              <td class="px-6 py-4 font-medium text-slate-900 dark:text-zinc-100">
                {{ rule.name }}
              </td>
              <td class="px-6 py-4 font-bold" :class="rule.category === 'violation' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
                {{ rule.category === 'violation' ? '-' : '+' }}{{ rule.point_value }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEditModal(rule)" class="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors" title="Edit">
                    <Edit2 :size="16" />
                  </button>
                  <button @click="handleDeleteRule(rule.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Hapus">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="pointRules.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500 dark:text-zinc-400">
                <div class="flex flex-col items-center justify-center gap-3">
                  <div class="w-12 h-12 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <Scale class="w-6 h-6 text-slate-400" />
                  </div>
                  <p>Belum ada aturan poin</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Create/Edit Modal -->
    <BaseModal :show="showCreateModal" title="Tambah Aturan Baru" size="md" @close="showCreateModal = false">
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Kode Aturan</label>
          <BaseInput v-model="ruleForm.rule_code" placeholder="Cth: TATA-01" />
        </div>
        
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Tipe Aturan</label>
          <select v-model="ruleForm.category" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option value="violation">Pelanggaran (Poin Negatif)</option>
            <option value="achievement">Prestasi (Poin Positif)</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Deskripsi Aturan</label>
          <textarea v-model="ruleForm.name" rows="3" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"></textarea>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Jumlah Poin (Angka Positif)</label>
          <BaseInput type="number" v-model="ruleForm.point_value" min="1" />
          <p class="text-xs text-slate-500 mt-1">Sistem akan otomatis memberi tanda minus (-) jika tipe adalah pelanggaran.</p>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <BaseButton variant="outline" @click="showCreateModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleCreateRule">Simpan</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :show="showEditModal" title="Edit Aturan Poin" size="md" @close="showEditModal = false">
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Kode Aturan</label>
          <BaseInput v-model="ruleForm.rule_code" placeholder="Cth: TATA-01" />
        </div>
        
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Tipe Aturan</label>
          <select v-model="ruleForm.category" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 text-slate-900 dark:text-zinc-100">
            <option value="violation">Pelanggaran (Poin Negatif)</option>
            <option value="achievement">Prestasi (Poin Positif)</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Deskripsi Aturan</label>
          <textarea v-model="ruleForm.name" rows="3" class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"></textarea>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-zinc-300">Jumlah Poin</label>
          <BaseInput type="number" v-model="ruleForm.point_value" min="1" />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <BaseButton variant="outline" @click="showEditModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="handleUpdateRule">Simpan Perubahan</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
