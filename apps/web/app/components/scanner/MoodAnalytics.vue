<template>
  <div class="w-full flex flex-col p-2 sm:p-5 space-y-6 text-slate-800 dark:text-slate-100 font-sans">
    
    <!-- Sync Banner with Parent Filters (if active) -->
    <div v-if="props.syncWithParentFilters" class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-violet-500/10 dark:bg-violet-950/20 border border-violet-500/20 dark:border-violet-900/40 rounded-2xl text-xs text-slate-600 dark:text-slate-300">
      <div class="flex items-center gap-2.5">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-bold text-slate-800 dark:text-slate-100">Filter Aktif Portal:</span>
        <span class="font-mono text-[11px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-violet-700 dark:text-violet-300 font-bold shadow-2xs">
          {{ props.classId ? 'Rombel Terpilih' : 'Semua Rombel' }} • {{ props.startDate || 'Awal Bulan' }} s/d {{ props.endDate || 'Hari Ini' }}
        </span>
      </div>
      <span class="text-[11px] text-slate-500 dark:text-slate-400 italic">Otomatis sinkron dengan panel filter di bagian atas halaman</span>
    </div>

    <!-- View Navigation Pills -->
    <div class="flex flex-wrap items-center gap-2">
      <button 
        @click="activeView = 'class'" 
        :class="activeView === 'class' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
      >
        Heatmap Kelas
      </button>
      <button 
        @click="activeView = 'student'" 
        :class="activeView === 'student' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
      >
        Tren Individu
      </button>
      <button 
        @click="activeView = 'school'" 
        :class="activeView === 'school' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
      >
        Ringkas Sekolah
      </button>
      <button 
        @click="activeView = 'arrival'" 
        :class="activeView === 'arrival' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25 ring-2 ring-violet-500/20' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
      >
        Jam Kedatangan
      </button>
      <button 
        @click="activeView = 'alerts'" 
        :class="activeView === 'alerts' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-500/20' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <span>🚨 Alert Kepedulian</span>
        <span v-if="openAlertsCount > 0" class="px-2 py-0.5 rounded-full bg-white text-rose-600 text-[10px] font-black shadow-xs">
          {{ openAlertsCount }}
        </span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loadingHeatmap || loadingSummary" class="flex flex-col items-center justify-center py-20 gap-3">
      <div class="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent"></div>
      <p class="text-xs text-slate-400 font-medium">Memuat data emosional siswa...</p>
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 p-5 md:p-6 transition-colors">
      
      <!-- 1. CLASS VIEW (HEATMAP MOOD) -->
      <div v-if="activeView === 'class'" class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🌈</span> Heatmap Mood Siswa (7 Hari Terakhir)
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik pada baris nama siswa untuk melihat riwayat grafik fluktuasi emosinya secara individual.
            </p>
          </div>
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium self-start sm:self-auto">
            Total Siswa Terdata: <b>{{ groupedByStudent.length }}</b>
          </span>
        </div>

        <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table class="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" class="px-4 py-3.5 font-bold">Nama Siswa</th>
                <th v-for="d in dates" :key="d" scope="col" class="px-2 py-3.5 text-center min-w-[58px] font-bold">
                  {{ formatDateShort(d) }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
              <tr 
                v-for="student in groupedByStudent" 
                :key="student.id" 
                class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group" 
                @click="selectStudent(student)"
              >
                <td class="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px] group-hover:text-violet-600 dark:group-hover:text-violet-400" :title="'Lihat grafik tren ' + student.name">
                  {{ student.name }}
                </td>
                <td v-for="d in dates" :key="d" class="px-2 py-3 text-center">
                  <div 
                    class="mx-auto w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-105 shadow-2xs" 
                    :class="getMoodBgClass(student.moods[d])"
                    :title="MOOD_LABELS[student.moods[d]] || 'Belum Check-in'"
                  >
                    {{ MOOD_EMOJI[student.moods[d]] || '' }}
                  </div>
                </td>
              </tr>
              <tr v-if="groupedByStudent.length === 0">
                <td :colspan="dates.length + 1" class="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <span class="text-2xl">🌱</span>
                    <p class="font-semibold text-xs">Belum ada check-in mood pada filter rombel/sekolah ini.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-4 items-center">
          <span class="font-bold text-slate-700 dark:text-slate-300">Legenda Emosi:</span>
          <span v-for="(label, key) in MOOD_LABELS" :key="key" class="flex items-center gap-1.5">
            <span>{{ MOOD_EMOJI[key] }}</span> <span class="capitalize">{{ label }}</span>
          </span>
          <span class="flex items-center gap-1.5"><div class="w-3.5 h-3.5 border border-dashed border-slate-400 dark:border-slate-600 rounded-md"></div> Belum check-in</span>
        </div>
      </div>

      <!-- 2. STUDENT VIEW (TREND INDIVIDU) -->
      <div v-else-if="activeView === 'student'">
        <div v-if="selectedStudent" class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <button 
                @click="activeView = 'class'" 
                class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Kembali ke Heatmap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
              </button>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Grafik Tren Emosi Individu — {{ selectedStudent.name }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Pantau pergerakan mood anak selama 7 hari observasi terakhir.</p>
              </div>
            </div>
            <button 
              @click="activeView = 'class'" 
              class="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Lihat Siswa Lain
            </button>
          </div>
          
          <div class="relative w-full h-[220px] bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div class="flex h-full items-end justify-between px-4 pb-6 pt-4 relative">
              <!-- Y-axis guide lines -->
              <div class="absolute inset-x-4 inset-y-4 flex flex-col justify-between pointer-events-none opacity-40">
                <div v-for="i in 4" :key="i" class="w-full h-px bg-slate-300 dark:bg-slate-700"></div>
              </div>
              
              <!-- Data Points -->
              <div v-for="(mood, i) in selectedStudentMoodList" :key="i" class="flex flex-col items-center justify-end z-10 w-full" :style="{ height: getMoodHeightPct(mood) }">
                <div class="text-2xl drop-shadow-sm transform translate-y-3 hover:scale-125 transition-transform" :title="MOOD_LABELS[mood] || 'Belum check-in'">
                  {{ MOOD_EMOJI[mood] || '⚪' }}
                </div>
                <div class="h-full w-px bg-violet-300 dark:bg-violet-700 mt-4 border-l border-dashed border-violet-400 dark:border-violet-600 opacity-60"></div>
              </div>
            </div>
            <!-- X-axis Labels -->
            <div class="absolute bottom-2 inset-x-4 flex justify-between px-4">
              <span v-for="d in dates" :key="d" class="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-full text-center">
                {{ formatDateShort(d) }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-16 text-slate-500 dark:text-slate-400">
          <p class="text-sm font-semibold">Pilih salah satu siswa dari Heatmap Kelas terlebih dahulu.</p>
          <button @click="activeView = 'class'" class="mt-3 px-4 py-2 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl font-bold text-xs hover:bg-violet-100 transition-colors">
            Buka Heatmap Kelas
          </button>
        </div>
      </div>

      <!-- 3. SCHOOL VIEW (RINGKAS SEKOLAH) -->
      <div v-else-if="activeView === 'school'" class="space-y-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏫</span> Ringkas Agregat Mood Sekolah
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Distribusi proporsi emosi siswa per rombongan belajar pada rentang tanggal aktif.</p>
          </div>
          <!-- Custom date picker only if parent filter is not used -->
          <div v-if="!props.syncWithParentFilters" class="flex flex-wrap items-end gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-1">Dari</label>
              <input type="date" v-model="summaryStartDate" class="w-[125px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none" />
            </div>
            <div>
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-1">Sampai</label>
              <input type="date" v-model="summaryEndDate" class="w-[125px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none" />
            </div>
            <button @click="loadSummaryData" class="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors">Terapkan</button>
          </div>
        </div>

        <!-- School-level mood totals -->
        <div v-if="summaryData" class="space-y-6">
          <div class="bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 text-center">
              Total Check-in Mood: <span class="text-slate-900 dark:text-white font-extrabold">{{ summaryData.moodSummary?.total || 0 }} Siswa</span>
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div v-for="(mood, key) in { senang: '😄', biasa: '🙂', sedih: '😢', kesal: '😠', lelah: '😴' }" :key="key" class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-center">
                <div class="text-2xl mb-1">{{ mood }}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 capitalize">{{ key }}</div>
                <div class="text-base font-extrabold text-slate-800 dark:text-slate-100">{{ summaryData.moodSummary?.[key] || 0 }}</div>
                <div class="text-[10px] text-slate-400 font-semibold">{{ summaryData.moodSummary?.total > 0 ? Math.round(((summaryData.moodSummary?.[key] || 0) / summaryData.moodSummary.total) * 100) : 0 }}%</div>
              </div>
            </div>
          </div>

          <!-- Class accordion -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Distribusi Emosi per Kelas</h3>
            <div v-for="c in displayedClasses" :key="c.class_id" class="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <button @click="toggleClass(c.class_id)" class="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                <div class="w-auto font-bold text-slate-800 dark:text-slate-200 text-left whitespace-nowrap text-sm">
                  {{ c.class_name }} <span v-if="c.academic_year_name" class="font-normal text-xs text-slate-400">(TA {{ c.academic_year_name }})</span>
                </div>
                <div class="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-violet-500 transition-all" :style="{ width: c.mood.total > 0 ? Math.round(((c.mood.senang + c.mood.biasa) / c.mood.total) * 100) + '%' : '0%' }"></div>
                </div>
                <div class="font-bold text-xs text-violet-600 dark:text-violet-400 whitespace-nowrap">{{ c.mood.total > 0 ? Math.round(((c.mood.senang + c.mood.biasa) / c.mood.total) * 100) : 0 }}% Positif</div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400 transform transition-transform shrink-0" :class="expandedClasses.includes(c.class_id) ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>

              <div v-if="expandedClasses.includes(c.class_id)" class="bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 p-4">
                <div v-if="c.students.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div v-for="st in c.students" :key="st.student_id" class="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 truncate">{{ st.name }}</div>
                    <div class="grid grid-cols-5 gap-1">
                      <div v-for="(emoji, key) in { senang: '😄', biasa: '🙂', sedih: '😢', kesal: '😠', lelah: '😴' }" :key="key" class="flex flex-col items-center" :title="(st.mood?.[key] || 0) + ' check-in'">
                        <div class="text-sm">{{ emoji }}</div>
                        <div class="text-[9px] font-bold text-slate-400">
                          {{ st.mood?.total > 0 ? Math.round(((st.mood?.[key] || 0) / st.mood.total) * 100) : 0 }}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-slate-400 text-center py-4">Belum ada data check-in mood di kelas ini.</div>
              </div>
            </div>

            <div v-if="!displayedClasses?.length" class="text-center py-8 text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Belum ada data mood untuk kelas yang difilter.
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
          Belum ada data pada rentang waktu ini.
        </div>
      </div>

      <!-- 4. ARRIVAL TIME VIEW -->
      <div v-else-if="activeView === 'arrival'" class="space-y-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>⏰</span> Analitik Jam Kedatangan Siswa
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Distribusi ketepatan waktu check-in siswa di gerbang.</p>
          </div>
          <div v-if="!props.syncWithParentFilters" class="flex flex-wrap items-end gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-1">Dari</label>
              <input type="date" v-model="summaryStartDate" class="w-[125px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none" />
            </div>
            <div>
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-1">Sampai</label>
              <input type="date" v-model="summaryEndDate" class="w-[125px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold outline-none" />
            </div>
            <button @click="loadSummaryData" class="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors">Terapkan</button>
          </div>
        </div>

        <div v-if="summaryData?.arrivalSummary?.total > 0" class="space-y-6">
          <div class="bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 text-center">
              Distribusi Jam Kedatangan: <span class="text-slate-900 dark:text-white font-extrabold">{{ summaryData.arrivalSummary.total }} Presensi</span>
            </h4>
            <div class="h-6 w-full flex rounded-full overflow-hidden shadow-inner mb-4">
              <div v-if="summaryData.arrivalSummary.awal > 0" :style="{ width: Math.round((summaryData.arrivalSummary.awal / summaryData.arrivalSummary.total) * 100) + '%' }" class="h-full bg-blue-500 transition-all hover:opacity-85" title="Datang Awal"></div>
              <div v-if="summaryData.arrivalSummary.tepat > 0" :style="{ width: Math.round((summaryData.arrivalSummary.tepat / summaryData.arrivalSummary.total) * 100) + '%' }" class="h-full bg-teal-500 transition-all hover:opacity-85" title="Tepat Waktu"></div>
              <div v-if="summaryData.arrivalSummary.terlambat > 0" :style="{ width: Math.round((summaryData.arrivalSummary.terlambat / summaryData.arrivalSummary.total) * 100) + '%' }" class="h-full bg-rose-500 transition-all hover:opacity-85" title="Terlambat"></div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-center">
                <div class="flex items-center gap-2 mb-1"><div class="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span class="text-[10px] font-bold text-slate-400 uppercase">Datang Awal</span></div>
                <div class="text-xl font-black text-slate-800 dark:text-slate-100">{{ Math.round((summaryData.arrivalSummary.awal / summaryData.arrivalSummary.total) * 100) }}%</div>
                <div class="text-[10px] text-slate-400 font-semibold">{{ summaryData.arrivalSummary.awal }} siswa</div>
              </div>
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-center">
                <div class="flex items-center gap-2 mb-1"><div class="w-2.5 h-2.5 rounded-full bg-teal-500"></div><span class="text-[10px] font-bold text-slate-400 uppercase">Tepat Waktu</span></div>
                <div class="text-xl font-black text-slate-800 dark:text-slate-100">{{ Math.round((summaryData.arrivalSummary.tepat / summaryData.arrivalSummary.total) * 100) }}%</div>
                <div class="text-[10px] text-slate-400 font-semibold">{{ summaryData.arrivalSummary.tepat }} siswa</div>
              </div>
              <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-center">
                <div class="flex items-center gap-2 mb-1"><div class="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span class="text-[10px] font-bold text-slate-400 uppercase">Terlambat</span></div>
                <div class="text-xl font-black text-slate-800 dark:text-slate-100">{{ Math.round((summaryData.arrivalSummary.terlambat / summaryData.arrivalSummary.total) * 100) }}%</div>
                <div class="text-[10px] text-slate-400 font-semibold">{{ summaryData.arrivalSummary.terlambat }} siswa</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
          Belum ada data presensi jam datang pada rentang waktu ini.
        </div>
      </div>

      <!-- 5. CARE ALERTS VIEW -->
      <div v-else-if="activeView === 'alerts'" class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚨</span> Sinyal Kepedulian (Care Alerts)
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deteksi otomatis siswa yang mengalami emosi sedih, kesal, atau lelah beruntun (3 hari+) untuk segera didampingi.
            </p>
          </div>

          <!-- Status Filters -->
          <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              @click="alertsFilter = 'open'" 
              :class="alertsFilter === 'open' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
              class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Perlu Tindak Lanjut ({{ openCount }})
            </button>
            <button 
              @click="alertsFilter = 'followed_up'" 
              :class="alertsFilter === 'followed_up' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
              class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Ditindaklanjuti
            </button>
            <button 
              @click="alertsFilter = 'closed'" 
              :class="alertsFilter === 'closed' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
              class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Selesai
            </button>
            <button 
              @click="alertsFilter = 'all'" 
              :class="alertsFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'"
              class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Semua
            </button>
          </div>
        </div>

        <!-- Alert Cards List -->
        <div v-if="filteredCareAlerts.length > 0" class="space-y-4">
          <div 
            v-for="alert in filteredCareAlerts" 
            :key="alert.id"
            class="p-5 rounded-2xl border transition-all shadow-xs"
            :class="getAlertCardBorder(alert.status)"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner shrink-0"
                     :class="getAlertIconBg(alert.status)">
                  {{ alert.status === 'closed' ? '💚' : '💔' }}
                </div>
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h4 class="font-extrabold text-base text-slate-900 dark:text-white">{{ alert.student_name }}</h4>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                          :class="getAlertStatusBadge(alert.status)">
                      {{ getAlertStatusLabel(alert.status) }}
                    </span>
                    <!-- Level Badge -->
                    <span 
                      v-if="isEarlyChildhood(alert)" 
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1"
                      title="Siswa Jenjang PAUD / TK (Observasi Anekdot)"
                    >
                      <span>🧸</span>
                      <span>{{ alert.class_level || 'PAUD / TK' }}</span>
                    </span>
                    <span 
                      v-else 
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1"
                      title="Siswa Jenjang Formal (Layanan Konseling BK)"
                    >
                      <span>🎓</span>
                      <span>{{ getStudentLevelLabel(alert) }}</span>
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ alert.class_name || 'Tanpa Kelas' }} <span v-if="alert.nis">· NIS: {{ alert.nis }}</span>
                  </p>
                </div>
              </div>

              <!-- Streak Info & Actions -->
              <div class="flex flex-wrap items-center gap-2">
                <div class="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>{{ alert.streak_days }} Hari Negatif</span>
                </div>

                <button 
                  v-if="alert.status !== 'closed'"
                  @click="openFollowupModal(alert)"
                  class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>✏️ Catat Tindak Lanjut</span>
                </button>

                <!-- Differentiated Action Button: TK/PAUD vs Non-TK -->
                <button 
                  v-if="alert.status !== 'closed' && isEarlyChildhood(alert)"
                  @click="openAnecdotalModal(alert)"
                  class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>📝 Catatan Anekdot</span>
                </button>

                <button 
                  v-else-if="alert.status !== 'closed'"
                  @click="openBkModal(alert)"
                  class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>📅 Jadwalkan Sesi BK</span>
                </button>

                <button 
                  v-if="alert.status !== 'closed'"
                  @click="openCloseModal(alert)"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>✓ Tutup Kasus</span>
                </button>
              </div>
            </div>

            <!-- Follow-up History Timeline -->
            <div v-if="alert.followups && alert.followups.length > 0" class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Riwayat Pendampingan:</p>
              <div class="space-y-2">
                <div 
                  v-for="f in alert.followups" 
                  :key="f.id"
                  class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs flex flex-col gap-1"
                >
                  <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    <span class="text-violet-600 dark:text-violet-400 font-bold">👤 {{ f.author_name || 'Konselor / Wali Kelas' }}</span>
                    <span>{{ formatDateTime(f.created_at) }}</span>
                  </div>
                  <p class="text-slate-700 dark:text-slate-200 leading-relaxed">{{ f.note }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-16 text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <span class="text-3xl block mb-2">🎉</span>
          <p class="font-bold text-sm text-slate-700 dark:text-slate-300">Semua Kondisi Emosional Siswa Terpantau Baik</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Tidak ada siswa yang mengalami mood negatif beruntun pada filter ini.</p>
        </div>
      </div>

    </div>

    <!-- Modals for Care Alerts -->
    <!-- Follow-up Modal -->
    <div v-if="showFollowupModal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <h3 class="text-base font-black text-slate-900 dark:text-white">
          ✏️ Catat Tindak Lanjut Pendampingan
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Siswa: <span class="font-bold text-slate-700 dark:text-slate-200">{{ activeAlert?.student_name }}</span> ({{ activeAlert?.class_name }})
        </p>

        <div class="mt-4">
          <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Catatan Pendampingan / Panggilan Orang Tua</label>
          <textarea 
            v-model="followupNote" 
            rows="4" 
            placeholder="Tuliskan hasil obrolan dengan siswa, konsultasi wali kelas, atau konfirmasi dengan wali murid..." 
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          ></textarea>
        </div>

        <div class="mt-6 flex justify-end gap-2.5">
          <button @click="showFollowupModal = false" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer">
            Batal
          </button>
          <button 
            @click="submitFollowup" 
            :disabled="!followupNote.trim() || submittingAlert"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {{ submittingAlert ? 'Menyimpan...' : 'Simpan Tindak Lanjut' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Close Alert Modal -->
    <div v-if="showCloseModal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <h3 class="text-base font-black text-slate-900 dark:text-white">
          ✓ Tutup Kasus Kepedulian
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Apakah siswa <span class="font-bold text-slate-700 dark:text-slate-200">{{ activeAlert?.student_name }}</span> sudah mendapatkan perhatian dan kondisinya membaik?
        </p>

        <div class="mt-4">
          <label class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Catatan Penyelesaian (Opsional)</label>
          <textarea 
            v-model="closeNote" 
            rows="3" 
            placeholder="Contoh: Siswa sudah ceria kembali setelah sesi konseling wali kelas..." 
            class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          ></textarea>
        </div>

        <div class="mt-6 flex justify-end gap-2.5">
          <button @click="showCloseModal = false" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer">
            Batal
          </button>
          <button 
            @click="submitCloseAlert" 
            :disabled="submittingAlert"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {{ submittingAlert ? 'Memproses...' : 'Ya, Selesaikan Kasus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- BK Session Modal (SD - SMA) -->
    <div v-if="showBkModal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📅</span> Jadwalkan Sesi Konseling (BK)
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Siswa: <span class="font-bold text-slate-800 dark:text-slate-100">{{ activeAlert?.student_name }}</span> ({{ activeAlert?.class_name }})
            </p>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Care Alert
          </span>
        </div>

        <div class="mt-4 space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Sesi Konseling</label>
            <input 
              type="date" 
              v-model="bkForm.session_date" 
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500" 
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori Masalah</label>
            <select 
              v-model="bkForm.issue_category" 
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Perilaku & Emosional (Care Alert)">Perilaku & Emosional (Care Alert)</option>
              <option value="Keluarga & Lingkungan">Keluarga & Lingkungan</option>
              <option value="Kesulitan Belajar / Akademik">Kesulitan Belajar / Akademik</option>
              <option value="Kedisiplinan & Tata Tertib">Kedisiplinan & Tata Tertib</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
              <span>🔒</span> Catatan Rahasia (Hanya Konselor BK & Wali Kelas)
            </label>
            <textarea 
              v-model="bkForm.confidential_notes" 
              rows="2" 
              placeholder="Catatan privat untuk asesmen awal siswa..." 
              class="w-full bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            ></textarea>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rencana Tindak Lanjut / Action Plan</label>
            <textarea 
              v-model="bkForm.action_plan" 
              rows="2" 
              placeholder="Contoh: Sesi konseling tatap muka empat mata, konfirmasi kondisi rumah ke orang tua..." 
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            ></textarea>
          </div>
        </div>

        <div class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <NuxtLink 
            :to="`/bk/sessions?student_id=${activeAlert?.student_id}&open_create=true&care_alert_id=${activeAlert?.id}&issue=${encodeURIComponent(bkForm.issue_category)}`"
            class="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
          >
            Buka Halaman Modul BK Lengkap ↗
          </NuxtLink>

          <div class="flex items-center gap-2">
            <button 
              @click="showBkModal = false" 
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button 
              @click="submitBkSession" 
              :disabled="submittingAlert"
              class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{{ submittingAlert ? 'Menyimpan...' : 'Jadwalkan Sesi BK' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Anecdotal Note Modal (TK / PAUD) -->
    <div v-if="showAnecdotalModal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📝</span> Catatan Anekdot (Wali Kelas TK/PAUD)
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Anak: <span class="font-bold text-slate-800 dark:text-slate-100">{{ activeAlert?.student_name }}</span> ({{ activeAlert?.class_name || 'TK/PAUD' }})
            </p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <span>🧸</span> Observasi Perkembangan
          </span>
        </div>

        <div class="mt-4 space-y-3.5 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Observasi</label>
              <input 
                type="date" 
                v-model="anecdotalForm.date" 
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500" 
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
              <select 
                v-model="anecdotalForm.semester" 
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Kegiatan / Situasi Pengamatan</label>
            <input 
              type="text" 
              v-model="anecdotalForm.activity_name" 
              placeholder="Contoh: Bermain balok di sentra, makan siang bersama, circle time pagi..." 
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500" 
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Catatan Observasi Perilaku & Emosi Anak</span>
              <span class="text-[10px] text-amber-600 font-bold">*Wajib diisi</span>
            </label>
            <textarea 
              v-model="anecdotalForm.observation_notes" 
              rows="3" 
              placeholder="Tuliskan peristiwa nyata/faktual mengenai ekspresi emosi anak, pemicu sedih/kesal/lelah, interaksi dengan teman sebaya, serta respon bimbingan guru..." 
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            ></textarea>
          </div>

          <div class="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            💡 <b>Info Wali Kelas:</b> Pada jenjang TK & PAUD, tindak lanjut Care Alert dialihkan ke pencatatan anekdot perkembangan emosional anak. Menyimpan catatan ini akan otomatis memperbarui status Care Alert menjadi <b>Ditindaklanjuti</b>.
          </div>
        </div>

        <div class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <NuxtLink 
            to="/gradebook/input"
            class="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            Buka Halaman Input Nilai & Anekdot ↗
          </NuxtLink>

          <div class="flex items-center gap-2">
            <button 
              @click="showAnecdotalModal = false" 
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button 
              @click="submitAnecdotalNote" 
              :disabled="!anecdotalForm.observation_notes.trim() || submittingAlert"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{{ submittingAlert ? 'Menyimpan...' : 'Simpan Catatan Anekdot' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Privacy Note -->
    <div class="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-2xl text-xs flex items-center gap-2.5 border border-blue-200/60 dark:border-blue-900/40 shadow-2xs">
      <span class="text-base shrink-0">🔒</span>
      <p class="leading-relaxed"><b>Pagar Privasi & Hak Akses:</b> Catatan mood individu hanya dapat dilihat oleh Wali Kelas, Guru BK, dan Kepala Sekolah. Alert kepedulian dikirim secara privat untuk melindungi kenyamanan psikologis peserta didik.</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { useSchoolContext } from '~/composables/useSchoolContext'

const props = withDefaults(defineProps<{
  schoolId?: string
  classId?: string
  startDate?: string
  endDate?: string
  academicYearId?: string
  syncWithParentFilters?: boolean
}>(), {
  syncWithParentFilters: false
})

const { fetcher } = useApi()
const { selectedSchoolId } = useSchoolContext()

const activeSchoolId = computed(() => props.schoolId || selectedSchoolId.value)

const activeView = ref<'class' | 'student' | 'school' | 'arrival' | 'alerts'>('class')
const loadingHeatmap = ref(true)
const loadingSummary = ref(false)
const heatmapData = ref<{ records: any[]; classes: any[]; startDate: string; endDate: string }>({
  records: [],
  classes: [],
  startDate: '',
  endDate: ''
})
const summaryData = ref<any>(null)

// Date filters
const today = new Date()
const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
const summaryStartDate = ref(sevenDaysAgo.toISOString().split('T')[0])
const summaryEndDate = ref(today.toISOString().split('T')[0])
const expandedClasses = ref<string[]>([])

const toggleClass = (classId: string) => {
  const idx = expandedClasses.value.indexOf(classId)
  if (idx > -1) expandedClasses.value.splice(idx, 1)
  else expandedClasses.value.push(classId)
}

const selectedStudent = ref<any>(null)

const MOOD_EMOJI: Record<string, string> = { senang: '😄', biasa: '😐', sedih: '😢', kesal: '😠', lelah: '😴', null: '' }
const MOOD_LABELS: Record<string, string> = { senang: 'Senang', biasa: 'Biasa', sedih: 'Sedih', kesal: 'Kesal', lelah: 'Lelah' }

const getMoodBgClass = (mood?: string | null) => {
  if (!mood) return 'border border-dashed border-slate-300 dark:border-slate-700 bg-transparent'
  switch (mood) {
    case 'senang': return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
    case 'biasa': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
    case 'sedih': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
    case 'kesal': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
    case 'lelah': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
    default: return 'bg-slate-100 dark:bg-slate-800'
  }
}

const getMoodHeightPct = (mood?: string | null) => {
  if (!mood) return '0%'
  const scoreMap: Record<string, number> = { senang: 100, biasa: 75, lelah: 50, sedih: 25, kesal: 10 }
  return (scoreMap[mood] || 0) + '%'
}

// Generate the 7 date strings (always from heatmapData)
const dates = computed(() => {
  if (!heatmapData.value.startDate) return []
  const dts: string[] = []
  const start = new Date(heatmapData.value.startDate)
  for (let i = 0; i <= 6; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dts.push(d.toISOString().split('T')[0])
  }
  return dts
})

const formatDateShort = (dStr: string) => {
  const d = new Date(dStr)
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  return days[d.getDay()]
}

const groupedByStudent = computed(() => {
  const map: Record<string, any> = {}
  if (!heatmapData.value?.records || !Array.isArray(heatmapData.value.records)) return []
  
  heatmapData.value.records.forEach((r: any) => {
    // Parent class filter
    if (props.syncWithParentFilters && props.classId && r.class_id !== props.classId) {
      return
    }
    if (!map[r.student_id]) {
      map[r.student_id] = { id: r.student_id, name: r.name, class_id: r.class_id, moods: {} }
    }
    const dateStr = (typeof r.date === 'string' ? r.date : new Date(r.date).toISOString()).split('T')[0]
    map[r.student_id].moods[dateStr] = r.mood
  })
  return Object.values(map).sort((a: any, b: any) => a.name.localeCompare(b.name))
})

const displayedClasses = computed(() => {
  if (!summaryData.value?.byClass) return []
  if (props.syncWithParentFilters && props.classId) {
    return summaryData.value.byClass.filter((c: any) => c.class_id === props.classId)
  }
  return summaryData.value.byClass
})

const selectedStudentMoodList = computed(() => {
  if (!selectedStudent.value) return []
  return dates.value.map(d => selectedStudent.value.moods[d] || null)
})

const selectStudent = (student: any) => {
  selectedStudent.value = student
  activeView.value = 'student'
}

const loadHeatmapData = async () => {
  if (!activeSchoolId.value) return
  loadingHeatmap.value = true
  try {
    const params = new URLSearchParams()
    if (props.syncWithParentFilters && props.startDate) params.append('startDate', props.startDate)
    if (props.syncWithParentFilters && props.endDate) params.append('endDate', props.endDate)
    const url = `/school/${activeSchoolId.value}/attendance/analytics/mood${params.toString() ? '?' + params.toString() : ''}`
    const res: any = await fetcher(url)
    if (res && res.data) {
      heatmapData.value = res.data
    }
  } catch (err) {
    console.error('Failed to load heatmap analytics:', err)
  } finally {
    loadingHeatmap.value = false
  }
}

const loadSummaryData = async () => {
  if (!activeSchoolId.value) return
  loadingSummary.value = true
  summaryData.value = null
  try {
    const sDate = (props.syncWithParentFilters && props.startDate) ? props.startDate : summaryStartDate.value
    const eDate = (props.syncWithParentFilters && props.endDate) ? props.endDate : summaryEndDate.value
    const res: any = await fetcher(`/school/${activeSchoolId.value}/attendance/analytics/mood/summary?startDate=${sDate}&endDate=${eDate}`)
    if (res && res.data) {
      summaryData.value = res.data
    }
  } catch (err) {
    console.error('Failed to load summary analytics:', err)
  } finally {
    loadingSummary.value = false
  }
}

// --- Care Alerts State ---
const careAlerts = ref<any[]>([])
const alertsFilter = ref<'open' | 'followed_up' | 'closed' | 'all'>('open')
const loadingAlerts = ref(false)
const showFollowupModal = ref(false)
const showCloseModal = ref(false)
const showBkModal = ref(false)
const showAnecdotalModal = ref(false)
const activeAlert = ref<any>(null)
const followupNote = ref('')
const closeNote = ref('')
const submittingAlert = ref(false)
const activeAcademicYears = ref<any[]>([])
const bkForm = reactive({
  session_date: '',
  issue_category: 'Perilaku & Emosional (Care Alert)',
  confidential_notes: '',
  action_plan: '',
  follow_up_date: ''
})
const anecdotalForm = reactive({
  date: '',
  semester: '1',
  activity_name: '',
  observation_notes: ''
})

const openCount = computed(() => {
  return careAlerts.value.filter((a) => a.status === 'open').length
})

const openAlertsCount = computed(() => openCount.value)

const filteredCareAlerts = computed(() => {
  let list = careAlerts.value
  if (props.syncWithParentFilters && props.classId) {
    list = list.filter((a: any) => a.class_id === props.classId)
  }
  if (alertsFilter.value === 'all') return list
  return list.filter((a) => a.status === alertsFilter.value)
})

const loadCareAlerts = async () => {
  if (!activeSchoolId.value) return
  loadingAlerts.value = true
  try {
    const res: any = await fetcher(`/school/${activeSchoolId.value}/attendance/care-alerts`)
    if (res && res.data) {
      careAlerts.value = res.data || []
    }
  } catch (err) {
    console.error('Failed to load care alerts:', err)
  } finally {
    loadingAlerts.value = false
  }
}

const openFollowupModal = (alert: any) => {
  activeAlert.value = alert
  followupNote.value = ''
  showFollowupModal.value = true
}

const openCloseModal = (alert: any) => {
  activeAlert.value = alert
  closeNote.value = ''
  showCloseModal.value = true
}

const submitFollowup = async () => {
  if (!activeAlert.value || !followupNote.value.trim() || !activeSchoolId.value) return
  submittingAlert.value = true
  try {
    await fetcher(`/school/${activeSchoolId.value}/attendance/care-alerts/${activeAlert.value.id}/followup`, {
      method: 'POST',
      body: { note: followupNote.value }
    })
    showFollowupModal.value = false
    await loadCareAlerts()
  } catch (err) {
    console.error('Failed to add care followup:', err)
  } finally {
    submittingAlert.value = false
  }
}

const submitCloseAlert = async () => {
  if (!activeAlert.value || !activeSchoolId.value) return
  submittingAlert.value = true
  try {
    await fetcher(`/school/${activeSchoolId.value}/attendance/care-alerts/${activeAlert.value.id}/close`, {
      method: 'POST',
      body: { note: closeNote.value }
    })
    showCloseModal.value = false
    await loadCareAlerts()
  } catch (err) {
    console.error('Failed to close care alert:', err)
  } finally {
    submittingAlert.value = false
  }
}

const openBkModal = async (alert: any) => {
  activeAlert.value = alert
  bkForm.session_date = new Date().toISOString().split('T')[0]
  bkForm.issue_category = 'Perilaku & Emosional (Care Alert)'
  bkForm.confidential_notes = `Siswa mengalami mood negatif beruntun (${alert.streak_days} hari berturut-turut).`
  bkForm.action_plan = 'Konseling tatap muka & pendampingan wali kelas'
  bkForm.follow_up_date = ''

  if (activeAcademicYears.value.length === 0 && activeSchoolId.value) {
    try {
      const res: any = await fetcher(`/academic-years?school_id=${activeSchoolId.value}`)
      if (res && res.data) {
        activeAcademicYears.value = res.data || []
      }
    } catch (e) {
      console.error('Failed to fetch academic years:', e)
    }
  }

  showBkModal.value = true
}

const submitBkSession = async () => {
  if (!activeAlert.value || !activeSchoolId.value) return
  submittingAlert.value = true
  try {
    const activeYear = activeAcademicYears.value.find((y) => y.is_active) || activeAcademicYears.value[0]
    if (!activeYear) {
      alert('Tahun ajaran aktif belum ditemukan untuk sekolah ini.')
      return
    }

    await fetcher(`/school/${activeSchoolId.value}/counseling/sessions`, {
      method: 'POST',
      body: {
        academic_year_id: activeYear.id,
        student_id: activeAlert.value.student_id,
        care_alert_id: activeAlert.value.id,
        session_date: bkForm.session_date,
        issue_category: bkForm.issue_category,
        confidential_notes: bkForm.confidential_notes || null,
        action_plan: bkForm.action_plan || null,
        follow_up_date: bkForm.follow_up_date || null
      }
    })

    showBkModal.value = false
    await loadCareAlerts()
  } catch (err: any) {
    console.error('Failed to schedule BK session:', err)
    alert(err?.message || 'Gagal menjadwalkan sesi BK')
  } finally {
    submittingAlert.value = false
  }
}

const isEarlyChildhood = (alert: any) => {
  if (!alert) return false
  const cl = (alert.class_level || '').toUpperCase()
  const sl = (alert.school_level || '').toUpperCase()
  const cn = (alert.class_name || '').toUpperCase()
  return cl.includes('TK') || cl.includes('PAUD') || sl.includes('TK') || sl.includes('PAUD') || cn.startsWith('TK') || cn.startsWith('PAUD')
}

const getStudentLevelLabel = (alert: any) => {
  if (!alert) return 'Siswa'
  if (alert.class_level) return alert.class_level
  if (alert.school_level) return alert.school_level
  return 'SD/SMP/SMA'
}

const openAnecdotalModal = async (alert: any) => {
  activeAlert.value = alert
  anecdotalForm.date = new Date().toISOString().split('T')[0]
  anecdotalForm.semester = '1'
  anecdotalForm.activity_name = 'Observasi Care Alert (Mood Tracking)'
  anecdotalForm.observation_notes = `Anak terdeteksi mood negatif selama ${alert.streak_days} hari berturut-turut. `

  if (activeAcademicYears.value.length === 0 && activeSchoolId.value) {
    try {
      const res: any = await fetcher(`/academic-years?school_id=${activeSchoolId.value}`)
      if (res && res.data) {
        activeAcademicYears.value = res.data || []
      }
    } catch (e) {
      console.error('Failed to fetch academic years:', e)
    }
  }

  showAnecdotalModal.value = true
}

const submitAnecdotalNote = async () => {
  if (!activeAlert.value || !activeSchoolId.value) return
  submittingAlert.value = true
  try {
    const activeYear = activeAcademicYears.value.find((y: any) => y.is_active) || activeAcademicYears.value[0]
    if (!activeYear) {
      alert('Tahun ajaran aktif belum ditemukan untuk sekolah ini.')
      return
    }

    await fetcher(`/school/${activeSchoolId.value}/anecdotal-note`, {
      method: 'POST',
      body: {
        academic_year_id: activeYear.id,
        student_id: activeAlert.value.student_id,
        semester: String(anecdotalForm.semester || '1'),
        date: anecdotalForm.date,
        activity_name: anecdotalForm.activity_name || null,
        observation_notes: anecdotalForm.observation_notes,
        care_alert_id: activeAlert.value.id
      }
    })

    showAnecdotalModal.value = false
    await loadCareAlerts()
  } catch (err: any) {
    console.error('Failed to submit anecdotal note:', err)
    alert(err?.message || 'Gagal menyimpan catatan anekdot')
  } finally {
    submittingAlert.value = false
  }
}

const getAlertCardBorder = (status: string) => {
  switch (status) {
    case 'closed': return 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
    case 'followed_up': return 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
    case 'open':
    default: return 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
  }
}

const getAlertIconBg = (status: string) => {
  switch (status) {
    case 'closed': return 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
    case 'followed_up': return 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
    case 'open':
    default: return 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
  }
}

const getAlertStatusBadge = (status: string) => {
  switch (status) {
    case 'closed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
    case 'followed_up': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700'
    case 'open':
    default: return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700'
  }
}

const getAlertStatusLabel = (status: string) => {
  switch (status) {
    case 'closed': return 'Selesai'
    case 'followed_up': return 'Ditindaklanjuti'
    case 'open':
    default: return 'Perlu Tindak Lanjut'
  }
}

const formatDateTime = (dtStr: string) => {
  if (!dtStr) return ''
  const d = new Date(dtStr)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadAllData = async () => {
  if (activeSchoolId.value) {
    await Promise.all([
      loadHeatmapData(),
      loadSummaryData(),
      loadCareAlerts()
    ])
  }
}

onMounted(() => {
  loadAllData()
})

watch(activeSchoolId, (newVal) => {
  if (newVal) {
    loadAllData()
    selectedStudent.value = null
  }
})

watch([() => props.startDate, () => props.endDate, () => props.classId], () => {
  if (props.syncWithParentFilters) {
    loadAllData()
  }
})
</script>
