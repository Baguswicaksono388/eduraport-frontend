<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Landmark, Users, GraduationCap, ArrowRight } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseInput, BaseModal } from '@eduraport/ui'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useSchool } from '~/composables/useSchool'
import { useClass } from '~/composables/useClass'

const route = useRoute()
const fid = route.params.fid as string
const { fetcher } = useApi()
const toast = useToast()

const { schools, fetchSchools } = useSchool()
const { classes, fetchClasses } = useClass()

const users = ref<any[]>([])
const loading = ref(false)
const search = ref('')

// Promotion Modal State
const showPromoteModal = ref(false)
const promoteLoading = ref(false)
const fromSchoolId = ref('')
const toSchoolId = ref('')
const studentsInSource = ref<any[]>([])

const promoteForm = reactive({
  student_id: '',
  to_class_id: '',
  promotion_type: 'naik_jenjang'
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res: any = await fetcher(`/foundation/${fid}/workspace/users?search=${search.value}`)
    if (res.success) {
      users.value = res.data
    }
  } catch (err: any) {
    toast.error(err.data?.error?.message || 'Gagal memuat data pengguna')
  } finally {
    loading.value = false
  }
}

watch(fromSchoolId, async (newVal) => {
  promoteForm.student_id = ''
  if (newVal) {
    const res: any = await fetcher(`/school/${newVal}/student?item_per_page=1000`)
    if (res.success) {
      studentsInSource.value = res.data.data
    }
  } else {
    studentsInSource.value = []
  }
})

watch(toSchoolId, async (newVal) => {
  promoteForm.to_class_id = ''
  if (newVal) {
    await fetchClasses(newVal)
  } else {
    classes.value = []
  }
})

const handlePromote = async () => {
  if (!promoteForm.student_id || !toSchoolId.value || !promoteForm.to_class_id) {
    toast.error('Mohon lengkapi semua isian')
    return
  }
  promoteLoading.value = true
  try {
    const res: any = await fetcher(`/foundation/${fid}/workspace/students/${promoteForm.student_id}/promote`, {
      method: 'POST',
      body: {
        to_school_id: toSchoolId.value,
        to_class_id: promoteForm.to_class_id,
        promotion_type: promoteForm.promotion_type
      }
    })
    if (res.success) {
      toast.success('Siswa berhasil dipromosikan/dimutasi', 'Berhasil')
      showPromoteModal.value = false
      fromSchoolId.value = ''
      toSchoolId.value = ''
      promoteForm.student_id = ''
      promoteForm.to_class_id = ''
    }
  } catch (err: any) {
    toast.error(err.data?.error?.message || 'Gagal melakukan promosi', 'Error')
  } finally {
    promoteLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
  fetchSchools(fid)
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <div class="p-2.5 bg-violet-600 rounded-xl shadow-lg shadow-violet-600/20">
            <Landmark class="text-white" :size="24" />
          </div>
          Workspace Yayasan
        </h1>
        <p class="text-sm text-slate-500 dark:text-zinc-400 mt-2 font-medium max-w-2xl">
          Pusat pengelolaan lintas unit sekolah. Kelola penugasan staf dan mutasi/promosi siswa antar unit di bawah yayasan yang sama.
        </p>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Pengelolaan Guru / Staf -->
      <BaseCard class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold flex items-center gap-2">
            <Users class="text-violet-500" :size="20" />
            Staf & Guru Yayasan
          </h2>
        </div>
        
        <div class="flex gap-2 mb-4">
          <BaseInput 
            v-model="search" 
            placeholder="Cari nama staf..." 
            class="flex-1"
            @keyup.enter="fetchUsers"
          />
          <BaseButton @click="fetchUsers" variant="primary">Cari</BaseButton>
        </div>

        <div v-if="loading" class="text-center py-8 text-slate-500">Memuat...</div>
        <div v-else-if="users.length === 0" class="text-center py-8 text-slate-500">Tidak ada staf ditemukan</div>
        <div v-else class="space-y-3">
          <div v-for="u in users" :key="u.id" class="p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 flex justify-between items-center">
            <div>
              <p class="font-bold text-sm text-slate-900 dark:text-zinc-100">{{ u.full_name }}</p>
              <p class="text-xs text-slate-500 capitalize">{{ u.role.replace('_', ' ') }} • {{ u.main_school_name }}</p>
            </div>
            <BaseButton variant="outline" size="sm" class="text-xs">
              Kelola Penugasan
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Promosi Lintas Unit -->
      <BaseCard class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold flex items-center gap-2">
            <GraduationCap class="text-emerald-500" :size="20" />
            Promosi Siswa Lintas Unit
          </h2>
        </div>
        
        <div class="text-center py-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
          <GraduationCap class="text-emerald-400 mx-auto mb-3" :size="32" />
          <h3 class="font-bold text-slate-900 dark:text-zinc-100">Mutasi & Kenaikan Jenjang</h3>
          <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Fitur ini memungkinkan Anda mempromosikan siswa dari SD ke SMP tanpa kehilangan riwayat kelas dan absensi.</p>
          <BaseButton @click="showPromoteModal = true" variant="primary" class="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-600/20">
            Mulai Promosi
          </BaseButton>
        </div>
      </BaseCard>
    </div>

    <!-- Modal Promosi -->
    <BaseModal :show="showPromoteModal" title="Promosi / Mutasi Lintas Unit" @close="showPromoteModal = false">
      <form @submit.prevent="handlePromote" class="space-y-4">
        
        <div class="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>Dari Sekolah Asal</span>
          </div>
          
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Unit Sekolah Asal</label>
            <select v-model="fromSchoolId" class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20">
              <option value="">-- Pilih Sekolah --</option>
              <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Pilih Siswa</label>
            <select v-model="promoteForm.student_id" :disabled="!fromSchoolId" class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 disabled:opacity-50">
              <option value="">-- Cari / Pilih Siswa --</option>
              <option v-for="st in studentsInSource" :key="st.id" :value="st.id">{{ st.full_name }} (NIS: {{ st.student_number || '-' }})</option>
            </select>
            <p v-if="fromSchoolId && studentsInSource.length === 0" class="text-[10px] text-amber-500 mt-1">Tidak ada siswa ditemukan di sekolah ini.</p>
          </div>
        </div>

        <div class="flex justify-center -my-2 relative z-10">
          <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center border-4 border-white dark:border-zinc-950">
            <ArrowRight :size="16" />
          </div>
        </div>

        <div class="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-4">
          <div class="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <span>Ke Sekolah Tujuan</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5 col-span-2">
              <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Unit Sekolah Tujuan</label>
              <select v-model="toSchoolId" class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20">
                <option value="">-- Pilih Sekolah --</option>
                <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Kelas Tujuan</label>
              <select v-model="promoteForm.to_class_id" :disabled="!toSchoolId" class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 disabled:opacity-50">
                <option value="">-- Pilih Kelas --</option>
                <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }} ({{ c.level }}) - TA {{ c.academic_year_name || '-' }}</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Jenis Mutasi</label>
              <select v-model="promoteForm.promotion_type" class="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20">
                <option value="naik_jenjang">Lulus / Naik Jenjang</option>
                <option value="pindah_unit">Mutasi / Pindah Sekolah</option>
                <option value="tinggal_kelas_lintas_unit">Tinggal Kelas Lintas Unit</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800 gap-2">
          <BaseButton type="button" variant="outline" @click="showPromoteModal = false">Batal</BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="promoteLoading" class="bg-emerald-600 hover:bg-emerald-700">
            {{ promoteLoading ? 'Memproses...' : 'Proses Promosi' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

  </div>
</template>
