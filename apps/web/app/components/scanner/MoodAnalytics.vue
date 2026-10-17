<template>
  <div class="h-full bg-slate-100 flex flex-col p-4 md:p-6 overflow-y-auto">
    
    <div class="mb-6 flex gap-2">
      <button 
        @click="activeView = 'class'" 
        :class="activeView === 'class' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300'"
        class="px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors"
      >
        Heatmap Kelas
      </button>
      <button 
        @click="activeView = 'student'" 
        :class="activeView === 'student' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300'"
        class="px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors"
      >
        Tren Individu
      </button>
      <button 
        @click="activeView = 'school'" 
        :class="activeView === 'school' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300'"
        class="px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors"
      >
        Ringkas Sekolah
      </button>
      <button 
        @click="activeView = 'arrival'" 
        :class="activeView === 'arrival' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300'"
        class="px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors"
      >
        Jam Kedatangan
      </button>
      <button 
        @click="activeView = 'alerts'" 
        :class="activeView === 'alerts' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-300'"
        class="px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors flex items-center gap-1.5"
      >
        <span>🚨 Alert Kepedulian</span>
        <span v-if="openAlertsCount > 0" class="px-2 py-0.5 rounded-full bg-white text-rose-600 text-[10px] font-black shadow-sm">
          {{ openAlertsCount }}
        </span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loadingHeatmap || loadingSummary" class="flex items-center justify-center flex-1">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      
      <!-- CLASS VIEW -->
      <div v-if="activeView === 'class'">
        <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center">
          Heatmap Mood — 7 Hari Terakhir
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-slate-600">
            <thead class="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th scope="col" class="px-4 py-3">Nama Siswa</th>
                <th v-for="d in dates" :key="d" scope="col" class="px-2 py-3 text-center min-w-[50px]">{{ formatDateShort(d) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in groupedByStudent" :key="student.id" class="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" @click="selectStudent(student)">
                <td class="px-4 py-3 font-medium text-slate-800 truncate max-w-[150px]" :title="'Lihat tren ' + student.name">
                  {{ student.name }}
                </td>
                <td v-for="d in dates" :key="d" class="px-2 py-3 text-center">
                  <div 
                    class="mx-auto w-8 h-8 rounded-md flex items-center justify-center text-lg" 
                    :class="getMoodBgClass(student.moods[d])"
                  >
                    {{ MOOD_EMOJI[student.moods[d]] || '' }}
                  </div>
                </td>
              </tr>
              <tr v-if="groupedByStudent.length === 0">
                <td :colspan="dates.length + 1" class="px-4 py-8 text-center text-slate-500">
                  Belum ada data mood untuk kelas ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mt-4 text-xs text-slate-500 flex gap-4">
          <span v-for="(label, key) in MOOD_LABELS" :key="key" class="flex items-center gap-1">
            <span>{{ MOOD_EMOJI[key] }}</span> {{ label }}
          </span>
          <span class="flex items-center gap-1"><div class="w-4 h-4 border border-dashed border-slate-300 rounded-sm"></div> belum check-in</span>
        </div>
      </div>

      <!-- STUDENT VIEW -->
      <div v-else-if="activeView === 'student'">
        <div v-if="selectedStudent">
          <div class="flex items-center gap-3 mb-6">
            <button @click="activeView = 'class'" class="text-slate-500 hover:text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            <h3 class="text-lg font-bold text-slate-800 flex items-center">
              Tren Mood Individu — {{ selectedStudent.name }}
            </h3>
          </div>
          
          <div class="relative w-full h-[200px] bg-slate-50 rounded-xl border border-slate-100 p-4">
            <div class="flex h-full items-end justify-between px-4 pb-6 pt-4 relative">
              <!-- Y-axis lines -->
              <div class="absolute inset-x-4 inset-y-4 flex flex-col justify-between pointer-events-none">
                <div v-for="i in 4" :key="i" class="w-full h-px bg-slate-200"></div>
              </div>
              
              <!-- Data Points -->
              <div v-for="(mood, i) in selectedStudentMoodList" :key="i" class="flex flex-col items-center justify-end z-10 w-full" :style="{ height: getMoodHeightPct(mood) }">
                <div class="text-2xl drop-shadow-sm transform translate-y-3">{{ MOOD_EMOJI[mood] || '⚪' }}</div>
                <div class="h-full w-px bg-indigo-200 mt-4 border-l border-dashed border-indigo-400 opacity-50"></div>
              </div>
            </div>
            <!-- X-axis Labels -->
            <div class="absolute bottom-1 inset-x-4 flex justify-between px-4">
              <span v-for="d in dates" :key="d" class="text-[10px] font-bold text-slate-400 w-full text-center">
                {{ formatDateShort(d) }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-slate-500">
          <p>Pilih siswa dari Heatmap Kelas terlebih dahulu.</p>
          <button @click="activeView = 'class'" class="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100">Kembali ke Heatmap</button>
        </div>
      </div>

      <!-- SCHOOL VIEW -->
      <div v-else-if="activeView === 'school'">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 class="text-lg font-bold text-slate-800 mb-1 flex items-center">
              Ringkas Sekolah — Indeks Mood per Kelas
            </h3>
            <p class="text-sm text-slate-500">Jumlah check-in mood siswa pada rentang waktu terpilih.</p>
          </div>
          <div class="flex flex-wrap items-end gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 block mb-1">Dari Tanggal</label>
              <input type="date" v-model="summaryStartDate" class="w-[130px] bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 block mb-1">Sampai</label>
              <input type="date" v-model="summaryEndDate" class="w-[130px] bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <button @click="loadSummaryData" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors h-[38px] flex items-center justify-center">Terapkan</button>
          </div>
        </div>

        <!-- School-level mood totals -->
        <div v-if="summaryData" class="space-y-6">
          <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 class="text-sm font-bold text-slate-700 mb-4 text-center">Total Mood Sekolah: {{ summaryData.moodSummary?.total || 0 }} Check-in</h4>
            <div class="grid grid-cols-3 md:grid-cols-5 gap-3">
              <div v-for="(mood, key) in { senang: '😄', biasa: '🙂', sedih: '😢', kesal: '😠', lelah: '😴' }" :key="key" class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                <div class="text-xl mb-1">{{ mood }}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{{ key }}</div>
                <div class="text-lg font-black text-slate-700">{{ summaryData.moodSummary?.[key] || 0 }}</div>
                <div class="text-[10px] text-slate-400">{{ summaryData.moodSummary?.total > 0 ? Math.round(((summaryData.moodSummary?.[key] || 0) / summaryData.moodSummary.total) * 100) : 0 }}%</div>
              </div>
            </div>
          </div>

          <!-- Class accordion -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest pl-2 mb-2">Detail per Kelas</h3>
            <div v-for="c in summaryData.byClass" :key="c.class_id" class="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
              <button @click="toggleClass(c.class_id)" class="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div class="w-auto font-bold text-slate-700 text-left whitespace-nowrap">
                  {{ c.class_name }} <span v-if="c.academic_year_name" class="font-normal text-slate-500">(TA {{ c.academic_year_name }})</span>
                </div>
                <div class="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-indigo-500 transition-all" :style="{ width: c.mood.total > 0 ? Math.round(((c.mood.senang + c.mood.biasa) / c.mood.total) * 100) + '%' : '0%' }"></div>
                </div>
                <div class="font-bold text-sm text-indigo-600 whitespace-nowrap">{{ c.mood.total > 0 ? Math.round(((c.mood.senang + c.mood.biasa) / c.mood.total) * 100) : 0 }}% Positif</div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 transform transition-transform shrink-0" :class="expandedClasses.includes(c.class_id) ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>

              <div v-if="expandedClasses.includes(c.class_id)" class="bg-slate-50 border-t border-slate-100 p-4">
                <div v-if="c.students.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div v-for="st in c.students" :key="st.student_id" class="bg-white p-3 rounded-lg border border-slate-200 flex flex-col">
                    <div class="text-sm font-bold text-slate-700 mb-2">{{ st.name }}</div>
                    <div class="grid grid-cols-5 gap-1">
                      <div v-for="(emoji, key) in { senang: '😄', biasa: '🙂', sedih: '😢', kesal: '😠', lelah: '😴' }" :key="key" class="flex flex-col items-center" :title="(st.mood?.[key] || 0) + ' check-in'">
                        <div class="text-base">{{ emoji }}</div>
                        <div class="text-[10px] font-bold text-slate-500">
                          {{ st.mood?.total > 0 ? Math.round(((st.mood?.[key] || 0) / st.mood.total) * 100) : 0 }}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-slate-500 text-center py-4">Belum ada data.</div>
              </div>
            </div>

            <div v-if="!summaryData.byClass?.length" class="text-center py-8 text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm">
              Belum ada data untuk kelas manapun.
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
          Belum ada data pada rentang waktu ini.
        </div>
      </div>

      <!-- ARRIVAL TIME VIEW -->
      <div v-else-if="activeView === 'arrival'">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 class="text-lg font-bold text-slate-800 mb-1 flex items-center">
              Analitik Jam Kedatangan Siswa
            </h3>
            <p class="text-sm text-slate-500">Distribusi kedatangan siswa di sekolah berdasarkan rentang tanggal.</p>
          </div>
          <div class="flex flex-wrap items-end gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 block mb-1">Dari Tanggal</label>
              <input type="date" v-model="summaryStartDate" @click="(e) => { try { e.target.showPicker() } catch(err){} }" class="w-[130px] bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 block mb-1">Sampai</label>
              <input type="date" v-model="summaryEndDate" @click="(e) => { try { e.target.showPicker() } catch(err){} }" class="w-[130px] bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" />
            </div>
            <button @click="loadSummaryData" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors h-[38px] flex items-center justify-center">Terapkan</button>
          </div>
        </div>

        <div v-if="summaryData?.arrivalSummary?.total > 0" class="space-y-6">
          <!-- Big Distribution Bar -->
          <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 class="text-sm font-bold text-slate-700 mb-4 text-center">Distribusi Jam Kedatangan Total: {{ summaryData.arrivalSummary.total }} Check-in</h4>
            <div class="h-8 w-full flex rounded-full overflow-hidden shadow-inner mb-4">
              <div v-if="summaryData.arrivalSummary.awal > 0" :style="{ width: Math.round((summaryData.arrivalSummary.awal / summaryData.arrivalSummary.total) * 100) + '%' }" class="h-full bg-blue-500 transition-all hover:opacity-80" title="Datang Awal"></div>
              <div v-if="summaryData.arrivalSummary.tepat > 0" :style="{ width: Math.round((summaryData.arrivalSummary.tepat / summaryData.arrivalSummary.total) * 100) + '%' }" class="h-full bg-teal-500 transition-all hover:opacity-80" title="Tepat Waktu"></div>
              <div v-if="summaryData.arrivalSummary.terlambat > 0" :style="{ width: Math.round((summaryData.arrivalSummary.terlambat / summaryData.arrivalSummary.total) * 100) + '%' }" class="h-full bg-rose-500 transition-all hover:opacity-80" title="Terlambat"></div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                <div class="flex items-center gap-2 mb-1"><div class="w-3 h-3 rounded-full bg-blue-500"></div><span class="text-xs font-bold text-slate-500 uppercase">Datang Awal</span></div>
                <div class="text-2xl font-black text-slate-800">{{ Math.round((summaryData.arrivalSummary.awal / summaryData.arrivalSummary.total) * 100) }}%</div>
                <div class="text-xs text-slate-400">{{ summaryData.arrivalSummary.awal }} check-in</div>
              </div>
              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                <div class="flex items-center gap-2 mb-1"><div class="w-3 h-3 rounded-full bg-teal-500"></div><span class="text-xs font-bold text-slate-500 uppercase">Tepat Waktu</span></div>
                <div class="text-2xl font-black text-slate-800">{{ Math.round((summaryData.arrivalSummary.tepat / summaryData.arrivalSummary.total) * 100) }}%</div>
                <div class="text-xs text-slate-400">{{ summaryData.arrivalSummary.tepat }} check-in</div>
              </div>
              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                <div class="flex items-center gap-2 mb-1"><div class="w-3 h-3 rounded-full bg-rose-500"></div><span class="text-xs font-bold text-slate-500 uppercase">Terlambat</span></div>
                <div class="text-2xl font-black text-slate-800">{{ Math.round((summaryData.arrivalSummary.terlambat / summaryData.arrivalSummary.total) * 100) }}%</div>
                <div class="text-xs text-slate-400">{{ summaryData.arrivalSummary.terlambat }} check-in</div>
              </div>
            </div>

            <div class="mt-4 text-xs text-center text-slate-400" v-if="summaryData.timeRule">
              *Datang Awal: Sblm {{ summaryData.timeRule.check_in_start?.substring(0,5) }} &nbsp;|&nbsp;
              Tepat Waktu: {{ summaryData.timeRule.check_in_start?.substring(0,5) }} - {{ summaryData.timeRule.on_time_until?.substring(0,5) }} &nbsp;|&nbsp;
              Terlambat: > {{ summaryData.timeRule.on_time_until?.substring(0,5) }}
            </div>
          </div>

          <!-- Class & Student Detail Accordion -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest pl-2 mb-2">Detail per Kelas</h3>
            <div v-for="c in summaryData.byClass" :key="c.class_id" class="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
              <button @click="toggleClass(c.class_id)" class="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div class="w-auto font-bold text-slate-700 text-left whitespace-nowrap">
                  {{ c.class_name }} <span v-if="c.academic_year_name" class="font-normal text-slate-500">(TA {{ c.academic_year_name }})</span>
                </div>

                <div class="flex-1 hidden md:flex h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div v-if="c.arrival.awal > 0" class="h-full bg-blue-500 transition-all" :style="{ width: c.arrival.total > 0 ? Math.round((c.arrival.awal/c.arrival.total)*100)+'%' : '0%' }" title="Datang Awal"></div>
                  <div v-if="c.arrival.tepat > 0" class="h-full bg-teal-500 transition-all" :style="{ width: c.arrival.total > 0 ? Math.round((c.arrival.tepat/c.arrival.total)*100)+'%' : '0%' }" title="Tepat Waktu"></div>
                  <div v-if="c.arrival.terlambat > 0" class="h-full bg-rose-500 transition-all" :style="{ width: c.arrival.total > 0 ? Math.round((c.arrival.terlambat/c.arrival.total)*100)+'%' : '0%' }" title="Terlambat"></div>
                </div>

                <div class="flex items-center gap-4 text-xs font-bold whitespace-nowrap px-2 md:px-4 ml-auto">
                  <div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Awal</span><span class="text-blue-600">{{ c.arrival.total > 0 ? Math.round((c.arrival.awal/c.arrival.total)*100) : 0 }}%</span></div>
                  <div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Tepat</span><span class="text-teal-600">{{ c.arrival.total > 0 ? Math.round((c.arrival.tepat/c.arrival.total)*100) : 0 }}%</span></div>
                  <div class="flex flex-col items-center"><span class="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Telat</span><span class="text-rose-600">{{ c.arrival.total > 0 ? Math.round((c.arrival.terlambat/c.arrival.total)*100) : 0 }}%</span></div>
                </div>

                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 transform transition-transform shrink-0" :class="expandedClasses.includes(c.class_id) ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>

              <div v-if="expandedClasses.includes(c.class_id)" class="bg-slate-50 border-t border-slate-100 p-4">
                <div v-if="c.students.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div v-for="st in c.students" :key="st.student_id" class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-violet-200 transition-colors flex flex-col">
                    <div class="text-sm font-bold text-slate-700 truncate mb-3 text-center">{{ st.name }}</div>

                    <div class="grid grid-cols-3 gap-2 mb-3">
                      <div class="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                        <div class="w-1.5 h-1.5 rounded-full bg-blue-500 mb-1"></div>
                        <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Awal</div>
                        <div class="text-sm font-black text-slate-700">{{ st.arrival.total > 0 ? Math.round((st.arrival.awal/st.arrival.total)*100) : 0 }}%</div>
                        <div class="text-[9px] text-slate-400 mt-0.5">{{ st.arrival.awal }} check-in</div>
                      </div>
                      <div class="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                        <div class="w-1.5 h-1.5 rounded-full bg-teal-500 mb-1"></div>
                        <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tepat</div>
                        <div class="text-sm font-black text-slate-700">{{ st.arrival.total > 0 ? Math.round((st.arrival.tepat/st.arrival.total)*100) : 0 }}%</div>
                        <div class="text-[9px] text-slate-400 mt-0.5">{{ st.arrival.tepat }} check-in</div>
                      </div>
                      <div class="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                        <div class="w-1.5 h-1.5 rounded-full bg-rose-500 mb-1"></div>
                        <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Telat</div>
                        <div class="text-sm font-black text-slate-700">{{ st.arrival.total > 0 ? Math.round((st.arrival.terlambat/st.arrival.total)*100) : 0 }}%</div>
                        <div class="text-[9px] text-slate-400 mt-0.5">{{ st.arrival.terlambat }} check-in</div>
                      </div>
                    </div>

                    <!-- Mini segmented bar -->
                    <div class="h-1.5 w-full flex rounded-full overflow-hidden bg-slate-100 mt-auto">
                      <div v-if="st.arrival.awal > 0" class="h-full bg-blue-500" :style="{ width: st.arrival.total > 0 ? Math.round((st.arrival.awal/st.arrival.total)*100)+'%' : '0%' }"></div>
                      <div v-if="st.arrival.tepat > 0" class="h-full bg-teal-500" :style="{ width: st.arrival.total > 0 ? Math.round((st.arrival.tepat/st.arrival.total)*100)+'%' : '0%' }"></div>
                      <div v-if="st.arrival.terlambat > 0" class="h-full bg-rose-500" :style="{ width: st.arrival.total > 0 ? Math.round((st.arrival.terlambat/st.arrival.total)*100)+'%' : '0%' }"></div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-slate-500 text-center py-4">Belum ada data siswa untuk kelas ini.</div>
              </div>
            </div>

            <div v-if="!summaryData.byClass?.length" class="text-center py-8 text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm">
              Belum ada data kedatangan untuk kelas manapun.
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
          Belum ada data kedatangan pada rentang waktu ini.
        </div>
      </div>

      <!-- CARE ALERTS VIEW (UF-5) -->
      <div v-else-if="activeView === 'alerts'" class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>🚨</span> Alert Kepedulian (Care Alerts)
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Deteksi otomatis siswa yang mengalami mood negatif (sedih, kesal, lelah) selama 3 hari berturut-turut.
            </p>
          </div>

          <!-- Status Filters -->
          <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button 
              @click="alertsFilter = 'open'" 
              :class="alertsFilter === 'open' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 rounded-lg transition-all"
            >
              Perlu Tindak Lanjut ({{ openCount }})
            </button>
            <button 
              @click="alertsFilter = 'followed_up'" 
              :class="alertsFilter === 'followed_up' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 rounded-lg transition-all"
            >
              Ditindaklanjuti
            </button>
            <button 
              @click="alertsFilter = 'closed'" 
              :class="alertsFilter === 'closed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 rounded-lg transition-all"
            >
              Selesai
            </button>
            <button 
              @click="alertsFilter = 'all'" 
              :class="alertsFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              class="px-3 py-1.5 rounded-lg transition-all"
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
            class="p-5 rounded-2xl border transition-all shadow-sm"
            :class="getAlertCardBorder(alert.status)"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner"
                     :class="getAlertIconBg(alert.status)">
                  {{ alert.status === 'closed' ? '💚' : '💔' }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-black text-base text-slate-900">{{ alert.student_name }}</h4>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                          :class="getAlertStatusBadge(alert.status)">
                      {{ getAlertStatusLabel(alert.status) }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ alert.class_name || 'Tanpa Kelas' }} <span v-if="alert.nis">· NIS: {{ alert.nis }}</span>
                  </p>
                </div>
              </div>

              <!-- Streak Info & Actions -->
              <div class="flex flex-wrap items-center gap-2.5">
                <div class="px-3 py-1.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>{{ alert.streak_days }} Hari Berturut-turut Negatif</span>
                </div>

                <button 
                  v-if="alert.status !== 'closed'"
                  @click="openFollowupModal(alert)"
                  class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <span>✏️ Catat Follow-up</span>
                </button>

                <button 
                  v-if="alert.status !== 'closed'"
                  @click="openCloseModal(alert)"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <span>✓ Tutup Kasus</span>
                </button>
              </div>
            </div>

            <!-- Follow-up History Timeline -->
            <div v-if="alert.followups && alert.followups.length > 0" class="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Riwayat Pendampingan & Konseling:</p>
              <div class="space-y-2">
                <div 
                  v-for="f in alert.followups" 
                  :key="f.id"
                  class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex flex-col gap-1"
                >
                  <div class="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span class="text-indigo-600 font-bold">👤 {{ f.author_name || 'Konselor / Wali Kelas' }}</span>
                    <span>{{ formatDateTime(f.created_at) }}</span>
                  </div>
                  <p class="text-slate-700 leading-relaxed">{{ f.note }}</p>
                </div>
              </div>
            </div>

            <div v-else class="mt-3 text-[11px] text-slate-400 italic">
              Belum ada catatan tindak lanjut untuk siswa ini.
            </div>
          </div>
        </div>

        <div v-else class="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <span class="text-3xl block mb-2">🎉</span>
          <p class="font-bold text-sm text-slate-700">Tidak Ada Alert Kepedulian</p>
          <p class="text-xs text-slate-500 mt-1">Semua siswa dalam kondisi emosional terpantau baik pada filter ini.</p>
        </div>
      </div>

    </div>

    <!-- Modals for Care Alerts -->
    <!-- Follow-up Modal -->
    <div v-if="showFollowupModal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <h3 class="text-base font-black text-slate-800">
          ✏️ Catat Tindak Lanjut Konseling
        </h3>
        <p class="text-xs text-slate-500 mt-1">
          Siswa: <span class="font-bold text-slate-700">{{ activeAlert?.student_name }}</span> ({{ activeAlert?.class_name }})
        </p>

        <div class="mt-4">
          <label class="block text-xs font-bold text-slate-600 mb-1.5">Catatan Pendampingan / Panggilan Orang Tua</label>
          <textarea 
            v-model="followupNote" 
            rows="4" 
            placeholder="Tuliskan hasil obrolan dengan siswa, konsultasi wali kelas, atau konfirmasi dengan wali murid..." 
            class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div class="mt-6 flex justify-end gap-2.5">
          <button @click="showFollowupModal = false" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors">
            Batal
          </button>
          <button 
            @click="submitFollowup" 
            :disabled="!followupNote.trim() || submittingAlert"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            {{ submittingAlert ? 'Menyimpan...' : 'Simpan Tindak Lanjut' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Close Alert Modal -->
    <div v-if="showCloseModal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <h3 class="text-base font-black text-slate-800">
          ✓ Tutup Kasus Kepedulian
        </h3>
        <p class="text-xs text-slate-500 mt-1">
          Apakah siswa <span class="font-bold text-slate-700">{{ activeAlert?.student_name }}</span> sudah mendapatkan perhatian dan kondisinya membaik?
        </p>

        <div class="mt-4">
          <label class="block text-xs font-bold text-slate-600 mb-1.5">Catatan Penyelesaian (Opsional)</label>
          <textarea 
            v-model="closeNote" 
            rows="3" 
            placeholder="Contoh: Siswa sudah ceria kembali setelah sesi konseling wali kelas..." 
            class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          ></textarea>
        </div>

        <div class="mt-6 flex justify-end gap-2.5">
          <button @click="showCloseModal = false" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors">
            Batal
          </button>
          <button 
            @click="submitCloseAlert" 
            :disabled="submittingAlert"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            {{ submittingAlert ? 'Memproses...' : 'Ya, Selesaikan Kasus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Privacy Note -->
    <div class="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs flex gap-2 border border-blue-100 shadow-sm">
      <span class="text-base">🔒</span>
      <p><b>Pagar privasi:</b> mood individu hanya terlihat oleh wali kelas, guru BK, dan kepala sekolah. Guru mapel hanya melihat agregat kelas. Alert kepedulian dikirim secara privat ke wali kelas/BK.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { useSchoolContext } from '~/composables/useSchoolContext'

const { fetcher } = useApi()
const { selectedSchoolId } = useSchoolContext()

const activeView = ref('class')
const loadingHeatmap = ref(true)
const loadingSummary = ref(false)
const heatmapData = ref({ records: [], classes: [], startDate: '', endDate: '' })
const summaryData = ref(null)

// Date filters shared between School and Arrival tabs
const today = new Date()
const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
const summaryStartDate = ref(sevenDaysAgo.toISOString().split('T')[0])
const summaryEndDate = ref(today.toISOString().split('T')[0])
const expandedClasses = ref([])

const toggleClass = (classId) => {
  const idx = expandedClasses.value.indexOf(classId)
  if (idx > -1) expandedClasses.value.splice(idx, 1)
  else expandedClasses.value.push(classId)
}

const selectedStudent = ref(null)

const MOOD_EMOJI = { senang: '😄', biasa: '😐', sedih: '😢', kesal: '😠', lelah: '😴', null: '' }
const MOOD_LABELS = { senang: 'Senang', biasa: 'Biasa', sedih: 'Sedih', kesal: 'Kesal', lelah: 'Lelah' }

const getMoodBgClass = (mood) => {
  if (!mood) return 'border border-dashed border-slate-300 bg-white'
  switch (mood) {
    case 'senang': return 'bg-teal-100 text-teal-800'
    case 'biasa': return 'bg-slate-100 text-slate-800'
    case 'sedih': return 'bg-blue-100 text-blue-800'
    case 'kesal': return 'bg-rose-100 text-rose-800'
    case 'lelah': return 'bg-amber-100 text-amber-800'
    default: return 'bg-slate-100'
  }
}

const getMoodHeightPct = (mood) => {
  if (!mood) return '0%'
  const scoreMap = { senang: 100, biasa: 75, lelah: 50, sedih: 25, kesal: 10 }
  return (scoreMap[mood] || 0) + '%'
}

// Generate the 7 date strings (always from heatmapData)
const dates = computed(() => {
  if (!heatmapData.value.startDate) return []
  const dts = []
  const start = new Date(heatmapData.value.startDate)
  for (let i = 0; i <= 6; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dts.push(d.toISOString().split('T')[0])
  }
  return dts
})

const formatDateShort = (dStr) => {
  const d = new Date(dStr)
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  return days[d.getDay()]
}

const groupedByStudent = computed(() => {
  const map = {}
  if (!heatmapData.value?.records || !Array.isArray(heatmapData.value.records)) return []
  
  heatmapData.value.records.forEach(r => {
    if (!map[r.student_id]) {
      map[r.student_id] = { id: r.student_id, name: r.name, class_id: r.class_id, moods: {} }
    }
    const dateStr = (typeof r.date === 'string' ? r.date : new Date(r.date).toISOString()).split('T')[0]
    map[r.student_id].moods[dateStr] = r.mood
  })
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
})

const selectedStudentMoodList = computed(() => {
  if (!selectedStudent.value) return []
  return dates.value.map(d => selectedStudent.value.moods[d] || null)
})

const selectStudent = (student) => {
  selectedStudent.value = student
  activeView.value = 'student'
}

const loadHeatmapData = async () => {
  loadingHeatmap.value = true
  try {
    const res = await fetcher(`/school/${selectedSchoolId.value}/attendance/analytics/mood`)
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
  loadingSummary.value = true
  summaryData.value = null
  try {
    const res = await fetcher(`/school/${selectedSchoolId.value}/attendance/analytics/mood/summary?startDate=${summaryStartDate.value}&endDate=${summaryEndDate.value}`)
    if (res && res.data) {
      summaryData.value = res.data
    }
  } catch (err) {
    console.error('Failed to load summary analytics:', err)
  } finally {
    loadingSummary.value = false
  }
}

// --- Care Alerts State (UF-5) ---
const careAlerts = ref([])
const alertsFilter = ref('open')
const loadingAlerts = ref(false)
const showFollowupModal = ref(false)
const showCloseModal = ref(false)
const activeAlert = ref(null)
const followupNote = ref('')
const closeNote = ref('')
const submittingAlert = ref(false)

const openCount = computed(() => {
  return careAlerts.value.filter((a) => a.status === 'open').length
})

const openAlertsCount = computed(() => openCount.value)

const filteredCareAlerts = computed(() => {
  if (alertsFilter.value === 'all') return careAlerts.value
  return careAlerts.value.filter((a) => a.status === alertsFilter.value)
})

const loadCareAlerts = async () => {
  if (!selectedSchoolId.value) return
  loadingAlerts.value = true
  try {
    const res = await fetcher(`/school/${selectedSchoolId.value}/attendance/care-alerts`)
    if (res && res.data) {
      careAlerts.value = res.data || []
    }
  } catch (err) {
    console.error('Failed to load care alerts:', err)
  } finally {
    loadingAlerts.value = false
  }
}

const openFollowupModal = (alert) => {
  activeAlert.value = alert
  followupNote.value = ''
  showFollowupModal.value = true
}

const openCloseModal = (alert) => {
  activeAlert.value = alert
  closeNote.value = ''
  showCloseModal.value = true
}

const submitFollowup = async () => {
  if (!activeAlert.value || !followupNote.value.trim() || !selectedSchoolId.value) return
  submittingAlert.value = true
  try {
    await fetcher(`/school/${selectedSchoolId.value}/attendance/care-alerts/${activeAlert.value.id}/followup`, {
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
  if (!activeAlert.value || !selectedSchoolId.value) return
  submittingAlert.value = true
  try {
    await fetcher(`/school/${selectedSchoolId.value}/attendance/care-alerts/${activeAlert.value.id}/close`, {
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

const getAlertCardBorder = (status) => {
  switch (status) {
    case 'closed': return 'bg-emerald-50/40 border-emerald-200'
    case 'followed_up': return 'bg-amber-50/40 border-amber-200'
    case 'open':
    default: return 'bg-rose-50/40 border-rose-200'
  }
}

const getAlertIconBg = (status) => {
  switch (status) {
    case 'closed': return 'bg-emerald-100 text-emerald-700'
    case 'followed_up': return 'bg-amber-100 text-amber-700'
    case 'open':
    default: return 'bg-rose-100 text-rose-700'
  }
}

const getAlertStatusBadge = (status) => {
  switch (status) {
    case 'closed': return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'followed_up': return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'open':
    default: return 'bg-rose-100 text-rose-800 border-rose-300'
  }
}

const getAlertStatusLabel = (status) => {
  switch (status) {
    case 'closed': return 'Selesai'
    case 'followed_up': return 'Ditindaklanjuti'
    case 'open':
    default: return 'Perlu Tindak Lanjut'
  }
}

const formatDateTime = (dtStr) => {
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

onMounted(() => {
  if (selectedSchoolId.value) {
    loadHeatmapData()
    loadSummaryData()
    loadCareAlerts()
  }
})

watch(selectedSchoolId, (newVal) => {
  if (newVal) {
    loadHeatmapData()
    loadSummaryData()
    loadCareAlerts()
    selectedStudent.value = null
  }
})
</script>
