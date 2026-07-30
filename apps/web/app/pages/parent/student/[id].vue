<template>
  <div class="space-y-6 pb-20">
    <div class="flex items-center gap-4">
      <button 
        @click="$router.push('/')"
        class="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-200 transition-colors"
      >
        <ArrowLeft :size="20" />
      </button>
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Detail Siswa</h2>
        <p class="text-sm text-slate-500">Portal Orang Tua</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
    </div>

    <div v-else-if="!studentDetail" class="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-slate-200">
      <p class="text-slate-500 font-semibold">Data siswa tidak ditemukan.</p>
    </div>

    <template v-else>
      <!-- Profile Header -->
      <BaseCard stripe class="relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-bl-full -z-10"></div>
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div class="w-20 h-20 rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-4xl shadow-inner border border-violet-200/50">
            {{ studentDetail.profile.full_name[0] }}
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-slate-900 dark:text-zinc-100">{{ studentDetail.profile.full_name }}</h3>
            <p class="font-medium text-violet-600 dark:text-violet-400 mt-1">
              {{ studentDetail.profile.school_name }} ({{ studentDetail.profile.school_level }})
            </p>
            <div class="flex flex-wrap gap-4 mt-4">
              <div class="flex items-center gap-2 text-sm">
                <span class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 font-semibold text-slate-700 dark:text-zinc-300">
                  NISN: {{ studentDetail.profile.national_student_number || '-' }}
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 font-semibold text-slate-700 dark:text-zinc-300">
                  Kelas: {{ studentDetail.profile.class_name || '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Custom Tabs -->
      <div class="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-slate-100/50 dark:bg-zinc-900/50 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
          :class="activeTab === tab.id ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="mt-6">
        <!-- 1. Kehadiran -->
        <div v-if="activeTab === 'attendance'" class="space-y-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BaseCard class="text-center p-6 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-zinc-900 border-emerald-100 dark:border-emerald-900/30">
              <div class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{{ studentDetail.attendanceSummary.hadir }}</div>
              <div class="text-xs font-bold text-emerald-800/70 dark:text-emerald-500/70 uppercase tracking-wider">Hadir</div>
            </BaseCard>
            <BaseCard class="text-center p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-zinc-900 border-blue-100 dark:border-blue-900/30">
              <div class="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">{{ studentDetail.attendanceSummary.izin }}</div>
              <div class="text-xs font-bold text-blue-800/70 dark:text-blue-500/70 uppercase tracking-wider">Izin</div>
            </BaseCard>
            <BaseCard class="text-center p-6 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-zinc-900 border-amber-100 dark:border-amber-900/30">
              <div class="text-3xl font-black text-amber-600 dark:text-amber-400 mb-1">{{ studentDetail.attendanceSummary.sakit }}</div>
              <div class="text-xs font-bold text-amber-800/70 dark:text-amber-500/70 uppercase tracking-wider">Sakit</div>
            </BaseCard>
            <BaseCard class="text-center p-6 bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/10 dark:to-zinc-900 border-rose-100 dark:border-rose-900/30">
              <div class="text-3xl font-black text-rose-600 dark:text-rose-400 mb-1">{{ studentDetail.attendanceSummary.alpa }}</div>
              <div class="text-xs font-bold text-rose-800/70 dark:text-rose-500/70 uppercase tracking-wider">Alpa</div>
            </BaseCard>
          </div>
        </div>

        <!-- 2. Analitik (Mood & Arrival) -->
        <div v-if="activeTab === 'analytics'" class="space-y-6">
          <div class="flex flex-wrap items-end gap-3 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
            <div>
              <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1 block mb-1">Dari Tanggal</label>
              <input type="date" v-model="startDate" @click="(e: any) => { try { e.target.showPicker() } catch(err){} }" class="w-[140px] bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1 block mb-1">Sampai</label>
              <input type="date" v-model="endDate" @click="(e: any) => { try { e.target.showPicker() } catch(err){} }" class="w-[140px] bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" />
            </div>
            <button @click="applyDateFilter" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors h-[38px] flex items-center justify-center">Terapkan</button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Keterlambatan -->
            <BaseCard class="p-6">
              <h3 class="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-6 flex items-center gap-2">
                <Clock :size="16" class="text-violet-500" /> Analitik Kedatangan
              </h3>
              
              <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle :size="20" />
                  </div>
                  <div>
                    <div class="font-bold text-slate-900 dark:text-zinc-100">Datang Awal</div>
                    <div class="text-xs text-slate-500">Tiba sebelum {{ studentDetail.analytics.arrival.timeRules?.check_in_start?.substring(0,5) || '06:45' }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xl font-black text-emerald-600 dark:text-emerald-400">{{ studentDetail.analytics.arrival.total > 0 ? Math.round((studentDetail.analytics.arrival.awal / studentDetail.analytics.arrival.total) * 100) : 0 }}%</div>
                  <div class="text-xs text-slate-400">{{ studentDetail.analytics.arrival.awal }} kali</div>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Clock :size="20" />
                  </div>
                  <div>
                    <div class="font-bold text-slate-900 dark:text-zinc-100">Datang Tepat Waktu</div>
                    <div class="text-xs text-slate-500">Tiba antara {{ studentDetail.analytics.arrival.timeRules?.check_in_start?.substring(0,5) || '06:45' }} - {{ studentDetail.analytics.arrival.timeRules?.on_time_until?.substring(0,5) || '07:00' }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xl font-black text-blue-600 dark:text-blue-400">{{ studentDetail.analytics.arrival.total > 0 ? Math.round((studentDetail.analytics.arrival.tepat / studentDetail.analytics.arrival.total) * 100) : 0 }}%</div>
                  <div class="text-xs text-slate-400">{{ studentDetail.analytics.arrival.tepat }} kali</div>
                </div>
              </div>

              <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <AlertTriangle :size="20" />
                  </div>
                  <div>
                    <div class="font-bold text-slate-900 dark:text-zinc-100">Datang Terlambat</div>
                    <div class="text-xs text-slate-500">Tiba setelah {{ studentDetail.analytics.arrival.timeRules?.on_time_until?.substring(0,5) || '07:00' }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xl font-black text-rose-600 dark:text-rose-400">{{ studentDetail.analytics.arrival.total > 0 ? Math.round((studentDetail.analytics.arrival.terlambat / studentDetail.analytics.arrival.total) * 100) : 0 }}%</div>
                  <div class="text-xs text-slate-400">{{ studentDetail.analytics.arrival.terlambat }} kali</div>
                </div>
              </div>
            </BaseCard>

            <!-- Mood Siswa -->
            <BaseCard class="p-6">
              <h3 class="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-6 flex items-center gap-2">
                <Smile :size="16" class="text-violet-500" /> Analitik Emosi & Mood Siswa
              </h3>

              <div class="space-y-4">
                <div class="flex items-center gap-4">
                  <div class="w-10 text-2xl text-center">😄</div>
                  <div class="flex-1">
                    <div class="flex justify-between text-xs mb-1 font-bold">
                      <span class="text-emerald-700 dark:text-emerald-400">Senang</span>
                      <span class="text-slate-500">{{ studentDetail.analytics.mood.total > 0 ? Math.round((studentDetail.analytics.mood.senang / studentDetail.analytics.mood.total) * 100) : 0 }}% ({{ studentDetail.analytics.mood.senang }}x)</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full" :style="{ width: `${(studentDetail.analytics.mood.senang / (studentDetail.analytics.mood.total || 1)) * 100}%` }"></div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="w-10 text-2xl text-center">😐</div>
                  <div class="flex-1">
                    <div class="flex justify-between text-xs mb-1 font-bold">
                      <span class="text-blue-700 dark:text-blue-400">Biasa</span>
                      <span class="text-slate-500">{{ studentDetail.analytics.mood.total > 0 ? Math.round((studentDetail.analytics.mood.biasa / studentDetail.analytics.mood.total) * 100) : 0 }}% ({{ studentDetail.analytics.mood.biasa }}x)</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div class="h-full bg-blue-500 rounded-full" :style="{ width: `${(studentDetail.analytics.mood.biasa / (studentDetail.analytics.mood.total || 1)) * 100}%` }"></div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="w-10 text-2xl text-center">😢</div>
                  <div class="flex-1">
                    <div class="flex justify-between text-xs mb-1 font-bold">
                      <span class="text-amber-700 dark:text-amber-400">Sedih</span>
                      <span class="text-slate-500">{{ studentDetail.analytics.mood.total > 0 ? Math.round((studentDetail.analytics.mood.sedih / studentDetail.analytics.mood.total) * 100) : 0 }}% ({{ studentDetail.analytics.mood.sedih }}x)</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div class="h-full bg-amber-500 rounded-full" :style="{ width: `${(studentDetail.analytics.mood.sedih / (studentDetail.analytics.mood.total || 1)) * 100}%` }"></div>
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center gap-4">
                  <div class="w-10 text-2xl text-center">😴</div>
                  <div class="flex-1">
                    <div class="flex justify-between text-xs mb-1 font-bold">
                      <span class="text-orange-700 dark:text-orange-400">Lelah</span>
                      <span class="text-slate-500">{{ studentDetail.analytics.mood.total > 0 ? Math.round((studentDetail.analytics.mood.lelah / studentDetail.analytics.mood.total) * 100) : 0 }}% ({{ studentDetail.analytics.mood.lelah }}x)</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div class="h-full bg-orange-500 rounded-full" :style="{ width: `${(studentDetail.analytics.mood.lelah / (studentDetail.analytics.mood.total || 1)) * 100}%` }"></div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="w-10 text-2xl text-center">😠</div>
                  <div class="flex-1">
                    <div class="flex justify-between text-xs mb-1 font-bold">
                      <span class="text-rose-700 dark:text-rose-400">Kesal</span>
                      <span class="text-slate-500">{{ studentDetail.analytics.mood.total > 0 ? Math.round((studentDetail.analytics.mood.kesal / studentDetail.analytics.mood.total) * 100) : 0 }}% ({{ studentDetail.analytics.mood.kesal }}x)</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div class="h-full bg-rose-500 rounded-full" :style="{ width: `${(studentDetail.analytics.mood.kesal / (studentDetail.analytics.mood.total || 1)) * 100}%` }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>

        <!-- 3. Akademik / Nilai -->
        <div v-if="activeTab === 'grades'" class="space-y-4">
          <div v-if="studentDetail.grades.length === 0" class="text-center py-12 bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200">
            <p class="text-slate-500 font-semibold">Belum ada data nilai</p>
          </div>
          <!-- Period Filter Dropdown -->
          <div v-if="gradePeriods.length > 0" class="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800">
            <div>
              <h3 class="font-bold text-slate-800 dark:text-zinc-100">Periode Akademik</h3>
              <p class="text-xs text-slate-500">Pilih tahun ajaran dan semester untuk melihat nilai</p>
            </div>
            <select 
              v-model="selectedPeriod"
              class="px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              <option v-for="period in gradePeriods" :key="period" :value="period">
                {{ period }}
              </option>
            </select>
          </div>
          
          <div v-if="Object.keys(groupedGrades).length === 0 && gradePeriods.length > 0" class="text-center py-8 bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200">
            <p class="text-slate-500 font-semibold">Tidak ada nilai untuk periode ini</p>
          </div>

          <!-- Accordion Cards for each Subject -->
          <div class="space-y-3">
            <BaseCard v-for="(grades, subject) in groupedGrades" :key="subject" class="p-0 overflow-hidden transition-all duration-200">
              <!-- Header (Clickable) -->
              <div 
                @click="toggleSubject(subject)"
                class="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50"
              >
                <div>
                  <h3 class="font-bold text-slate-800 dark:text-zinc-100 text-base">{{ subject }}</h3>
                  <div class="flex items-center gap-3 mt-1">
                    <p class="text-xs text-slate-500">{{ grades.length }} Nilai Masuk</p>
                    <span v-if="subjectFinalGrades[subject]" class="text-xs font-bold text-violet-600 dark:text-violet-400">
                      Nilai Akhir: {{ subjectFinalGrades[subject].final_score || '-' }} ({{ subjectFinalGrades[subject].predicate || '-' }})
                    </span>
                  </div>
                </div>
                <div class="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-500">
                  <ChevronUp v-if="expandedSubjects.includes(subject)" class="w-4 h-4" />
                  <ChevronDown v-else class="w-4 h-4" />
                </div>
              </div>

              <!-- Body (Expandable) -->
              <div v-show="expandedSubjects.includes(subject)" class="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/20">
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-slate-100/50 dark:bg-zinc-800/30 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800">
                      <tr>
                        <th class="px-6 py-3">Komponen</th>
                        <th class="px-6 py-3">Tanggal</th>
                        <th class="px-6 py-3">Nilai Angka</th>
                        <th class="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-zinc-800">
                      <tr v-for="grade in grades" :key="grade.created_at" class="hover:bg-white dark:hover:bg-zinc-900/50">
                        <td class="px-6 py-3 font-medium text-violet-600 dark:text-violet-400">
                          {{ grade.component_name || '-' }}
                        </td>
                        <td class="px-6 py-3 font-medium text-slate-600 dark:text-zinc-400 text-xs">
                          {{ new Date(grade.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                        </td>
                        <td class="px-6 py-3">
                          <span class="font-bold text-slate-900 dark:text-white">{{ grade.score }}</span>
                        </td>
                        <td class="px-6 py-3">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {{ grade.status }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>

        <!-- 4. Ekstrakurikuler -->
        <div v-if="activeTab === 'extracurricular'" class="space-y-4">
          <div v-if="studentDetail.extracurriculars.length === 0" class="text-center py-12 bg-white/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-slate-200">
            <p class="text-slate-500 font-semibold">Tidak mengikuti ekstrakurikuler</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <BaseCard v-for="(eks, i) in studentDetail.extracurriculars" :key="i" class="flex items-center gap-4 p-5">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-violet-500/20">
                {{ eks.name[0] }}
              </div>
              <div>
                <h4 class="font-bold text-slate-900 dark:text-zinc-100">{{ eks.name }}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span v-if="eks.instructor" class="text-xs text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-semibold">{{ eks.instructor }}</span>
                  <span v-if="eks.schedule" class="text-xs text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-semibold">{{ eks.schedule }}</span>
                  <span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold" v-if="eks.grade">Nilai: {{ eks.grade }}</span>
                </div>
                <p v-if="eks.description" class="text-xs text-slate-500 mt-2 line-clamp-2">{{ eks.description }}</p>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ClipboardCheck, Activity, BookOpen, User, CheckCircle, Clock, AlertTriangle, Smile, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useParent } from '~/composables/useParent'

const route = useRoute()
const { fetchChildDetail } = useParent()

const studentId = route.params.id as string
const loading = ref(true)
const studentDetail = ref<any>(null)

const gradePeriods = computed(() => {
  if (!studentDetail.value?.grades) return []
  const uniquePeriods = new Set<string>()
  studentDetail.value.grades.forEach((grade: any) => {
    const ay = grade.academic_year_name || 'Tanpa Tahun Ajaran'
    const sem = grade.semester ? (String(grade.semester).charAt(0).toUpperCase() + String(grade.semester).slice(1)) : 'Tanpa Semester'
    uniquePeriods.add(`${ay} - ${sem}`)
  })
  return Array.from(uniquePeriods).sort((a, b) => b.localeCompare(a)) // descending sort
})

const selectedPeriod = ref<string>('')

watch(gradePeriods, (newVal) => {
  if (newVal.length > 0 && !selectedPeriod.value) {
    selectedPeriod.value = newVal[0]
  }
})

const groupedGrades = computed(() => {
  const groups: Record<string, any[]> = {}
  if (!studentDetail.value?.grades || !selectedPeriod.value) return groups
  
  studentDetail.value.grades.forEach((grade: any) => {
    const ay = grade.academic_year_name || 'Tanpa Tahun Ajaran'
    const sem = grade.semester ? (String(grade.semester).charAt(0).toUpperCase() + String(grade.semester).slice(1)) : 'Tanpa Semester'
    const periodStr = `${ay} - ${sem}`
    
    if (periodStr === selectedPeriod.value) {
      const subject = grade.subject_name || 'Lainnya'
      if (!groups[subject]) groups[subject] = []
      groups[subject].push(grade)
    }
  })
  return groups
})

const subjectFinalGrades = computed(() => {
  const map: Record<string, any> = {}
  if (!studentDetail.value?.finalGrades || !selectedPeriod.value) return map
  
  studentDetail.value.finalGrades.forEach((fg: any) => {
    const ay = fg.academic_year_name || 'Tanpa Tahun Ajaran'
    const sem = fg.semester ? (String(fg.semester).charAt(0).toUpperCase() + String(fg.semester).slice(1)) : 'Tanpa Semester'
    const periodStr = `${ay} - ${sem}`
    
    if (periodStr === selectedPeriod.value) {
      const subject = fg.subject_name || 'Lainnya'
      map[subject] = fg
    }
  })
  return map
})

const expandedSubjects = ref<string[]>([])
const toggleSubject = (subject: string) => {
  if (expandedSubjects.value.includes(subject)) {
    expandedSubjects.value = expandedSubjects.value.filter(s => s !== subject)
  } else {
    expandedSubjects.value.push(subject)
  }
}

const today = new Date()
const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
const startDate = ref(sevenDaysAgo.toISOString().split('T')[0])
const endDate = ref(today.toISOString().split('T')[0])

const applyDateFilter = async () => {
  loading.value = true
  studentDetail.value = await fetchChildDetail(studentId, startDate.value, endDate.value)
  loading.value = false
}

const activeTab = ref('attendance')
const tabs = [
  { id: 'attendance', label: 'Rekap Kehadiran', icon: ClipboardCheck },
  { id: 'analytics', label: 'Analitik Emosi', icon: Activity },
  { id: 'grades', label: 'Nilai Akademik', icon: BookOpen },
  { id: 'extracurricular', label: 'Ekstrakurikuler', icon: User },
]

onMounted(async () => {
  loading.value = true
  studentDetail.value = await fetchChildDetail(studentId, startDate.value, endDate.value)
  loading.value = false
})
</script>
