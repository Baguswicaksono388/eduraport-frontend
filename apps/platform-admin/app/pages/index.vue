<template>
  <div class="space-y-8">
    <!-- Top KPI Cards Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- KPI 1: B2B Schools -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit Sekolah B2B</span>
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <School class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline space-x-2">
          <span class="text-2xl font-extrabold text-white">{{ stats.b2b?.total_schools ?? 0 }}</span>
          <span class="text-xs text-slate-400">sekolah ({{ stats.b2b?.total_foundations ?? 0 }} yayasan)</span>
        </div>
        <div class="mt-2 text-xs text-emerald-400 flex items-center space-x-1">
          <Users class="w-3 h-3" />
          <span>{{ stats.b2b?.total_students ?? 0 }} siswa terdaftar</span>
        </div>
      </div>

      <!-- KPI 2: B2C Teachers -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Guru Solo B2C</span>
          <div class="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <GraduationCap class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline space-x-2">
          <span class="text-2xl font-extrabold text-white">{{ stats.b2c?.total_teachers ?? 0 }}</span>
          <span class="text-xs text-slate-400">pelanggan guru</span>
        </div>
        <div class="mt-2 flex items-center space-x-1">
          <span
            v-if="stats.b2c?.pending_verifications > 0"
            class="text-xs text-amber-400 font-semibold animate-pulse flex items-center space-x-1"
          >
            <Clock class="w-3 h-3" />
            <span>{{ stats.b2c?.pending_verifications }} butuh verifikasi transfer</span>
          </span>
          <span v-else class="text-xs text-slate-400">Semua verifikasi lunas</span>
        </div>
      </div>

      <!-- KPI 3: AI Generation Platform -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Generate Dokumen AI</span>
          <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Sparkles class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline space-x-2">
          <span class="text-2xl font-extrabold text-white">{{ stats.b2c?.total_ai_generated ?? 0 }}</span>
          <span class="text-xs text-slate-400">dokumen total</span>
        </div>
        <div class="mt-2 text-xs text-slate-400">RPP, Modul Ajar, Soal & Asesmen</div>
      </div>

      <!-- KPI 4: Trojan Horse Leads & WA Gateway -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline B2B & WA</span>
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Target class="w-4 h-4" />
          </div>
        </div>
        <div class="mt-3 flex items-baseline space-x-2">
          <span class="text-2xl font-extrabold text-white">{{ stats.crm?.total_prospects ?? 0 }}</span>
          <span class="text-xs text-slate-400">prospek sekolah</span>
        </div>
        <div class="mt-2 text-xs text-emerald-400 flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{{ stats.b2b?.active_wa_devices ?? 0 }} WA Gateway aktif</span>
        </div>
      </div>
    </div>

    <!-- Main Operational Workspace Tabs -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <!-- Tabs Header -->
      <div class="border-b border-slate-800 bg-slate-950/60 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <nav class="flex space-x-2" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
              'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer'
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.badge"
              :class="[
                activeTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                'px-1.5 py-0.2 text-[10px] rounded-full font-bold ml-1'
              ]"
            >
              {{ tab.badge }}
            </span>
          </button>
        </nav>

        <!-- Global Refresh Button -->
        <button
          @click="loadCurrentTabData"
          :disabled="isFetching"
          class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isFetching ? 'animate-spin' : '']" />
          <span>Muat Ulang</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="p-6">
        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- TAB 1: B2B SCHOOLS & FOUNDATIONS                      -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'b2b'" class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <!-- Filter & Search -->
            <div class="flex flex-wrap items-center gap-3 flex-1">
              <div class="relative min-w-[240px] flex-1 max-w-md">
                <Search class="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  v-model="b2bSearch"
                  @input="debounceSearchB2B"
                  type="text"
                  placeholder="Cari nama sekolah, NPSN, atau yayasan..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                v-model="b2bLevelFilter"
                @change="fetchB2BSchools"
                class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Semua Jenjang</option>
                <option value="TK">TK / PAUD</option>
                <option value="SD">SD / MI</option>
                <option value="SMP">SMP / MTs</option>
                <option value="SMA">SMA / MA</option>
                <option value="SMK">SMK</option>
              </select>
            </div>

            <!-- Add B2B School Button -->
            <button
              @click="openCreateSchoolModal"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus class="w-4 h-4" />
              <span>Onboard Sekolah B2B Baru</span>
            </button>
          </div>

          <!-- B2B Schools Table -->
          <div class="overflow-x-auto rounded-xl border border-slate-800">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th class="px-4 py-3.5">Unit Sekolah</th>
                  <th class="px-4 py-3.5">Yayasan / Induk</th>
                  <th class="px-4 py-3.5">Jenjang / NPSN</th>
                  <th class="px-4 py-3.5">Siswa & Guru</th>
                  <th class="px-4 py-3.5">Admin Utama</th>
                  <th class="px-4 py-3.5">WA Gateway</th>
                  <th class="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                <tr v-if="b2bSchools.length === 0" class="text-center py-8">
                  <td colspan="7" class="py-8 text-slate-500">Belum ada data sekolah B2B yang sesuai.</td>
                </tr>
                <tr
                  v-for="school in b2bSchools"
                  :key="school.id"
                  class="hover:bg-slate-800/40 transition-colors"
                >
                  <td class="px-4 py-3.5">
                    <div class="font-bold text-white text-sm">{{ school.name }}</div>
                    <div class="text-[11px] text-slate-400 line-clamp-1">{{ school.address || 'Alamat belum diatur' }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <span class="font-medium text-slate-300">{{ school.foundation_name }}</span>
                    <div class="text-[10px] text-slate-400">{{ school.foundation_code }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {{ school.level }}
                    </span>
                    <div class="text-[11px] text-slate-400 mt-1 font-mono">{{ school.npsn || 'NPSN -' }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="font-semibold text-white">{{ school.total_students }} Siswa</div>
                    <div class="text-[10px] text-slate-400">{{ school.total_teachers }} Guru</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="text-slate-200 font-medium">{{ school.principal_name || 'Belum ada' }}</div>
                    <div class="text-[10px] text-slate-400">{{ school.principal_email || '-' }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <span
                      :class="[
                        school.wa_status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700',
                        'px-2 py-0.5 text-[10px] rounded-full border font-medium flex items-center space-x-1 w-fit'
                      ]"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="school.wa_status === 'connected' ? 'bg-emerald-500' : 'bg-slate-500'"></span>
                      <span>{{ school.wa_status === 'connected' ? 'Aktif' : 'Terputus' }}</span>
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-right">
                    <button
                      @click="openEditSchoolModal(school)"
                      class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- TAB 2: B2C SOLO TEACHERS & SUBSCRIPTIONS              -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'b2c'" class="space-y-6">
          <!-- Pending Verification Callout -->
          <div
            v-if="pendingB2CCount > 0"
            class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between"
          >
            <div class="flex items-center space-x-3">
              <AlertTriangle class="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span class="font-bold">Ada {{ pendingB2CCount }} Bukti Transfer Menunggu Verifikasi!</span>
                <p class="text-amber-400/80 text-[11px]">Segera review slip transfer untuk mengaktifkan paket guru.</p>
              </div>
            </div>
            <button
              @click="b2cStatusFilter = 'pending_verification'; fetchB2CSubscriptions()"
              class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Lihat Antrean
            </button>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="relative min-w-[240px] flex-1 max-w-md">
              <Search class="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                v-model="b2cSearch"
                @input="debounceSearchB2C"
                type="text"
                placeholder="Cari nama guru, email, atau no WA..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              v-model="b2cStatusFilter"
              @change="fetchB2CSubscriptions"
              class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Status</option>
              <option value="pending_verification">Menunggu Verifikasi (Pending)</option>
              <option value="active">Aktif (Berlangganan)</option>
              <option value="trial">Masa Trial (7 Hari)</option>
              <option value="expired">Kedaluwarsa (Expired)</option>
              <option value="cancelled">Dibatalkan / Ditolak</option>
            </select>
          </div>

          <!-- B2C Table -->
          <div class="overflow-x-auto rounded-xl border border-slate-800">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th class="px-4 py-3.5">Guru Solo</th>
                  <th class="px-4 py-3.5">Paket & Status</th>
                  <th class="px-4 py-3.5">Konsumsi Kuota AI</th>
                  <th class="px-4 py-3.5">Masa Berlaku</th>
                  <th class="px-4 py-3.5">Bukti Bayar</th>
                  <th class="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                <tr v-if="b2cSubscriptions.length === 0" class="text-center py-8">
                  <td colspan="6" class="py-8 text-slate-500">Belum ada pelanggan B2C yang sesuai filter.</td>
                </tr>
                <tr
                  v-for="sub in b2cSubscriptions"
                  :key="sub.id"
                  class="hover:bg-slate-800/40 transition-colors"
                >
                  <td class="px-4 py-3.5">
                    <div class="font-bold text-white text-sm">{{ sub.teacher_name }}</div>
                    <div class="text-[11px] text-slate-400">{{ sub.teacher_email }}</div>
                    <div class="text-[10px] text-indigo-400 font-mono">{{ sub.teacher_phone || '-' }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="flex items-center space-x-1.5">
                      <span class="font-bold text-white uppercase text-[11px]">{{ sub.plan_id }}</span>
                      <span
                        :class="[
                          sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          sub.status === 'pending_verification' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                          sub.status === 'trial' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20',
                          'px-2 py-0.5 text-[9px] rounded-full border font-bold uppercase'
                        ]"
                      >
                        {{ sub.status }}
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400 mt-1 capitalize">{{ sub.billing_cycle || 'Bulanan' }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="flex items-center justify-between text-[11px] mb-1">
                      <span class="text-slate-400">RPP/Modul:</span>
                      <span class="font-semibold text-white">{{ sub.ai_rpp_modul_used }} / {{ sub.ai_rpp_modul_quota }}</span>
                    </div>
                    <!-- Progress Bar -->
                    <div class="w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        class="bg-indigo-500 h-1.5 rounded-full"
                        :style="{ width: `${Math.min(100, (sub.ai_rpp_modul_used / (sub.ai_rpp_modul_quota || 1)) * 100)}%` }"
                      ></div>
                    </div>
                    <div class="text-[10px] text-slate-500 mt-1">Soal: {{ sub.ai_asesmen_used }} | Materi: {{ sub.ai_materi_used }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="text-slate-200">{{ formatDate(sub.current_period_end) }}</div>
                    <div class="text-[10px] text-slate-400">Trial end: {{ formatDate(sub.trial_ends_at) }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <button
                      v-if="sub.payment_proof_url"
                      @click="openProofModal(sub)"
                      class="px-2.5 py-1 text-xs bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 rounded-lg flex items-center space-x-1 cursor-pointer"
                    >
                      <Image class="w-3 h-3" />
                      <span>Lihat Slip</span>
                    </button>
                    <span v-else class="text-slate-500 text-[11px]">-</span>
                  </td>
                  <td class="px-4 py-3.5 text-right space-x-1.5">
                    <button
                      v-if="sub.status === 'pending_verification'"
                      @click="openProofModal(sub)"
                      class="px-2.5 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Verifikasi
                    </button>
                    <button
                      @click="openQuotaModal(sub)"
                      class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Setel Kuota
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- TAB 3: TROJAN HORSE B2B PROSPECTS (CRM)               -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'crm'" class="space-y-6">
          <div class="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4 text-xs text-indigo-300 flex items-start space-x-3">
            <Sparkles class="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span class="font-bold text-white">Database Prospek Trojan Horse:</span>
              Daftar sekolah formal yang diinput oleh guru saat registrasi mandiri. Ini adalah target empuk untuk tim Sales menawarkan paket Enterprise B2B ke Kepala Sekolah.
            </div>
          </div>

          <!-- CRM Filter -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="relative min-w-[240px] flex-1 max-w-md">
              <Search class="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                v-model="crmSearch"
                @input="debounceSearchCRM"
                type="text"
                placeholder="Cari sekolah, kota, atau nama guru..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              v-model="crmConvertedFilter"
              @change="fetchB2BProspects"
              class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Status Konversi</option>
              <option value="false">Belum Jadi Klien B2B</option>
              <option value="true">Sukses Konversi ke B2B</option>
            </select>
          </div>

          <!-- CRM Table -->
          <div class="overflow-x-auto rounded-xl border border-slate-800">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th class="px-4 py-3.5">Nama Sekolah Asal</th>
                  <th class="px-4 py-3.5">Wilayah & Jenjang</th>
                  <th class="px-4 py-3.5">Guru Terdaftar (Champion)</th>
                  <th class="px-4 py-3.5">Catatan Tim Sales</th>
                  <th class="px-4 py-3.5">Status B2B</th>
                  <th class="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                <tr v-if="b2bProspects.length === 0" class="text-center py-8">
                  <td colspan="6" class="py-8 text-slate-500">Belum ada data prospek B2B yang tercatat.</td>
                </tr>
                <tr
                  v-for="prospect in b2bProspects"
                  :key="prospect.id"
                  class="hover:bg-slate-800/40 transition-colors"
                >
                  <td class="px-4 py-3.5">
                    <div class="font-bold text-white text-sm">{{ prospect.school_name_input }}</div>
                    <div class="text-[10px] text-slate-400">Didaftarkan: {{ formatDate(prospect.created_at) }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="text-slate-200">{{ prospect.city || '-' }}, {{ prospect.province || '-' }}</div>
                    <div class="text-[10px] text-slate-400">Jenjang: {{ prospect.jenjang_taught?.join(', ') || '-' }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="font-medium text-white">{{ prospect.teacher_name }}</div>
                    <div class="text-[10px] text-slate-400">{{ prospect.teacher_email }}</div>
                    <div class="text-[10px] text-indigo-400 font-mono">{{ prospect.teacher_phone || '-' }}</div>
                  </td>
                  <td class="px-4 py-3.5">
                    <div class="max-w-xs text-slate-300 line-clamp-2 italic">
                      {{ prospect.sales_notes || 'Belum ada catatan kontak sales' }}
                    </div>
                  </td>
                  <td class="px-4 py-3.5">
                    <span
                      v-if="prospect.converted_to_b2b_at"
                      class="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                    >
                      B2B Client Resmi
                    </span>
                    <span
                      v-else-if="prospect.is_b2b_prospect"
                      class="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold"
                    >
                      Follow-up Sales Aktif
                    </span>
                    <span
                      v-else
                      class="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-400 border border-slate-700"
                    >
                      Prospek Dingin (Baru)
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-right">
                    <button
                      @click="openProspectModal(prospect)"
                      class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      Update Sales
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- TAB 4: PLATFORM HEALTH & INTEGRATIONS                 -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'health'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Health Card 1: Node.js Backend -->
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white text-sm">Status Server Backend</span>
                <span class="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Operational
                </span>
              </div>
              <p class="text-xs text-slate-400">Hono.js API engine terhubung ke PostgreSQL (Kysely) dan Redis.</p>
              <div class="pt-2 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                <span>Memory limit constraint:</span>
                <span class="text-slate-300 font-mono">VPS 4GB RAM</span>
              </div>
            </div>

            <!-- Health Card 2: WA Gateways -->
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white text-sm">WhatsApp Gateway Network</span>
                <span class="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {{ stats.b2b?.active_wa_devices ?? 0 }} Online
                </span>
              </div>
              <p class="text-xs text-slate-400">Baileys socket session multi-tenant untuk notifikasi orang tua dan broadcast nilai.</p>
              <div class="pt-2 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                <span>Multi-tenant isolation:</span>
                <span class="text-slate-300 font-mono">1 Session / School</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: ONBOARD SEKOLAH B2B BARU                        -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div
      v-if="showCreateSchoolModal"
      class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white">Onboard Sekolah B2B Baru</h3>
          <button @click="showCreateSchoolModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="submitCreateSchool" class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Nama Unit Sekolah *</label>
            <input
              v-model="createSchoolForm.name"
              type="text"
              required
              placeholder="Contoh: SMA Islam Terpadu Bina Insan"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Jenjang *</label>
              <select
                v-model="createSchoolForm.level"
                required
                class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="TK">TK / PAUD</option>
                <option value="SD">SD / MI</option>
                <option value="SMP">SMP / MTs</option>
                <option value="SMA">SMA / MA</option>
                <option value="SMK">SMK</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-300 font-semibold mb-1">NPSN (8 Digit)</label>
              <input
                v-model="createSchoolForm.npsn"
                type="text"
                maxlength="8"
                placeholder="Contoh: 20104820"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-300 font-semibold mb-1">Nama Yayasan / Induk</label>
            <input
              v-model="createSchoolForm.foundation_name"
              type="text"
              placeholder="Contoh: Yayasan Bina Insan Mulia (opsional)"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label class="block text-slate-300 font-semibold mb-1">Alamat Lengkap</label>
            <textarea
              v-model="createSchoolForm.address"
              rows="2"
              placeholder="Alamat sekolah..."
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            ></textarea>
          </div>

          <!-- Section Admin User Initial -->
          <div class="pt-3 border-t border-slate-800 space-y-3">
            <span class="text-indigo-400 font-bold block text-[11px] uppercase tracking-wider">Akun Kepala Sekolah / Admin Utama</span>
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Nama Admin / Kepala Sekolah *</label>
              <input
                v-model="createSchoolForm.admin_name"
                type="text"
                required
                placeholder="Nama lengkap..."
                class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Email Login *</label>
                <input
                  v-model="createSchoolForm.admin_email"
                  type="email"
                  required
                  placeholder="admin@sekolah.sch.id"
                  class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label class="block text-slate-300 font-semibold mb-1">Kata Sandi Awal *</label>
                <input
                  v-model="createSchoolForm.admin_password"
                  type="password"
                  required
                  minlength="6"
                  placeholder="Minimal 6 karakter"
                  class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              @click="showCreateSchoolModal = false"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="submittingModal"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {{ submittingModal ? 'Menyimpan...' : 'Onboard Sekolah' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: REVIEW BUKTI TRANSFER B2C                       -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div
      v-if="showProofModal && selectedSub"
      class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-white">Verifikasi Bukti Transfer B2C</h3>
            <p class="text-xs text-slate-400">{{ selectedSub.teacher_name }} ({{ selectedSub.teacher_email }})</p>
          </div>
          <button @click="showProofModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Image Preview / Lightbox -->
        <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center min-h-[220px]">
          <img
            v-if="selectedSub.payment_proof_url"
            :src="getResolvedMediaUrl(selectedSub.payment_proof_url)"
            alt="Struk Pembayaran"
            class="max-h-72 object-contain rounded-lg border border-slate-800 shadow"
          />
          <div v-else class="text-xs text-slate-500">Tidak ada file gambar terlampir</div>
        </div>

        <div class="text-xs text-slate-300 space-y-1">
          <div>Paket Dipilih: <span class="font-bold text-white uppercase">{{ selectedSub.plan_id }}</span> ({{ selectedSub.billing_cycle || 'Bulanan' }})</div>
          <div>Tanggal Upload: <span class="text-slate-400">{{ formatDate(selectedSub.created_at) }}</span></div>
        </div>

        <!-- Rejection Reason input (visible if rejecting) -->
        <div v-if="isRejectingMode" class="space-y-2 pt-2">
          <label class="block text-xs font-semibold text-rose-400">Alasan Penolakan (akan dikirim ke guru):</label>
          <input
            v-model="rejectionReason"
            type="text"
            placeholder="Contoh: Nominal transfer kurang atau bukti tidak terbaca"
            class="w-full bg-slate-950 border border-rose-500/40 rounded-lg p-2.5 text-xs text-white"
          />
        </div>

        <!-- Action Buttons -->
        <div class="pt-4 border-t border-slate-800 flex justify-end space-x-2">
          <button
            v-if="!isRejectingMode"
            @click="isRejectingMode = true"
            class="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50 rounded-xl text-xs font-medium cursor-pointer"
          >
            Tolak Bukti
          </button>
          <button
            v-else
            @click="submitVerification(false)"
            :disabled="submittingModal"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            Konfirmasi Tolak
          </button>

          <button
            @click="submitVerification(true)"
            :disabled="submittingModal"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
          >
            <Check class="w-4 h-4" />
            <span>Approve & Aktifkan Paket</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: ATUR KUOTA AI & PERPANJANGAN B2C                 -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div
      v-if="showQuotaModal && selectedSub"
      class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white">Setel Kuota AI Guru</h3>
          <button @click="showQuotaModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="submitQuotaAdjustment" class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Kuota RPP & Modul Ajar</label>
            <input
              v-model.number="quotaForm.ai_rpp_modul_quota"
              type="number"
              min="0"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Kuota Soal & Asesmen</label>
            <input
              v-model.number="quotaForm.ai_asesmen_quota"
              type="number"
              min="0"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Tambah Bonus Hari Aktif (+ Hari)</label>
            <input
              v-model.number="quotaForm.bonusDays"
              type="number"
              min="0"
              placeholder="0 (misal: 7 atau 30 hari)"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div class="pt-4 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              @click="showQuotaModal = false"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="submittingModal"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
            >
              Simpan Penyesuaian
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL: UPDATE PROSPEK CRM B2B                          -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <div
      v-if="showProspectModal && selectedProspect"
      class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-white">Catatan Sales B2B</h3>
            <p class="text-xs text-slate-400">{{ selectedProspect.school_name_input }}</p>
          </div>
          <button @click="showProspectModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="submitProspectUpdate" class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Catatan Follow-up Sales</label>
            <textarea
              v-model="prospectForm.sales_notes"
              rows="3"
              placeholder="Contoh: Sudah telp Kepala Sekolah, tertarik proposal B2B demo minggu depan..."
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
            ></textarea>
          </div>

          <div class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                v-model="prospectForm.is_b2b_prospect"
                type="checkbox"
                class="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span class="text-slate-300">Tandai Sedang Dihubungi (Follow-up Aktif)</span>
            </label>

            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                v-model="prospectForm.converted_to_b2b"
                type="checkbox"
                class="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"
              />
              <span class="text-emerald-400 font-semibold">Tandai SUKSES Jadi Klien B2B Resmi 🎉</span>
            </label>
          </div>

          <div class="pt-4 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              @click="showProspectModal = false"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              Tutup
            </button>
            <button
              type="submit"
              :disabled="submittingModal"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
            >
              Simpan Update
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  School,
  GraduationCap,
  Sparkles,
  Target,
  RefreshCw,
  Search,
  Plus,
  AlertTriangle,
  Image,
  Clock,
  Users,
  X,
  Check,
} from 'lucide-vue-next';
import { useApi } from '../composables/useApi';
import { useAuth } from '../composables/useAuth';

const { fetcher } = useApi();
const { isAuthenticated, fetchUser } = useAuth();
const router = useRouter();

// State Tabs
const tabs = computed(() => [
  { id: 'b2b', label: 'Manajemen B2B (Sekolah & Yayasan)', icon: School },
  {
    id: 'b2c',
    label: 'Manajemen B2C (Guru Solo)',
    icon: GraduationCap,
    badge: stats.value.b2c?.pending_verifications > 0 ? `${stats.value.b2c.pending_verifications} Pending` : null,
  },
  { id: 'crm', label: 'Pipeline Trojan Horse B2B', icon: Target },
  { id: 'health', label: 'Platform Health & Integrasi', icon: Sparkles },
]);

const activeTab = ref('b2b');
const isFetching = ref(false);
const submittingModal = ref(false);

// Stats
const stats = ref<any>({
  b2b: { total_schools: 0, total_foundations: 0, total_students: 0, active_wa_devices: 0 },
  b2c: { total_teachers: 0, pending_verifications: 0, active_subscriptions: 0, total_ai_generated: 0 },
  crm: { total_prospects: 0, converted_to_b2b: 0 },
});

// Tab 1: B2B State
const b2bSchools = ref<any[]>([]);
const b2bSearch = ref('');
const b2bLevelFilter = ref('');
const showCreateSchoolModal = ref(false);
const createSchoolForm = reactive({
  name: '',
  level: 'SMA',
  npsn: '',
  address: '',
  foundation_name: '',
  admin_name: '',
  admin_email: '',
  admin_password: '',
});

// Tab 2: B2C State
const b2cSubscriptions = ref<any[]>([]);
const b2cSearch = ref('');
const b2cStatusFilter = ref('all');
const pendingB2CCount = computed(() => stats.value.b2c?.pending_verifications ?? 0);
const selectedSub = ref<any>(null);
const showProofModal = ref(false);
const isRejectingMode = ref(false);
const rejectionReason = ref('');
const showQuotaModal = ref(false);
const quotaForm = reactive({
  ai_rpp_modul_quota: 50,
  ai_asesmen_quota: 50,
  bonusDays: 0,
});

// Tab 3: CRM State
const b2bProspects = ref<any[]>([]);
const crmSearch = ref('');
const crmConvertedFilter = ref('');
const selectedProspect = ref<any>(null);
const showProspectModal = ref(false);
const prospectForm = reactive({
  sales_notes: '',
  is_b2b_prospect: false,
  converted_to_b2b: false,
});

onMounted(async () => {
  const user = await fetchUser();
  if (!user || user.role !== 'super_admin') {
    router.push('/login');
    return;
  }
  await fetchOverviewStats();
  await loadCurrentTabData();
});

const loadCurrentTabData = async () => {
  isFetching.value = true;
  try {
    await fetchOverviewStats();
    if (activeTab.value === 'b2b') await fetchB2BSchools();
    else if (activeTab.value === 'b2c') await fetchB2CSubscriptions();
    else if (activeTab.value === 'crm') await fetchB2BProspects();
  } finally {
    isFetching.value = false;
  }
};

watch(activeTab, () => {
  loadCurrentTabData();
});

// ─── API Fetchers ─────────────────────────────────────────────
const fetchOverviewStats = async () => {
  try {
    const res: any = await fetcher('/admin/platform/overview');
    if (res.success && res.data) {
      stats.value = res.data;
    }
  } catch (e) {
    console.error('Failed to fetch platform stats', e);
  }
};

const fetchB2BSchools = async () => {
  try {
    const params = new URLSearchParams();
    if (b2bSearch.value) params.append('search', b2bSearch.value);
    if (b2bLevelFilter.value) params.append('level', b2bLevelFilter.value);
    const res: any = await fetcher(`/admin/platform/b2b/schools?${params.toString()}`);
    if (res.success && res.data) {
      b2bSchools.value = res.data.items || [];
    }
  } catch (e) {
    console.error('Failed to fetch B2B schools', e);
  }
};

let searchTimerB2B: any = null;
const debounceSearchB2B = () => {
  clearTimeout(searchTimerB2B);
  searchTimerB2B = setTimeout(fetchB2BSchools, 300);
};

const fetchB2CSubscriptions = async () => {
  try {
    const params = new URLSearchParams();
    if (b2cSearch.value) params.append('search', b2cSearch.value);
    if (b2cStatusFilter.value) params.append('status', b2cStatusFilter.value);
    const res: any = await fetcher(`/admin/platform/b2c/subscriptions?${params.toString()}`);
    if (res.success && res.data) {
      b2cSubscriptions.value = res.data.items || [];
    }
  } catch (e) {
    console.error('Failed to fetch B2C subs', e);
  }
};

let searchTimerB2C: any = null;
const debounceSearchB2C = () => {
  clearTimeout(searchTimerB2C);
  searchTimerB2C = setTimeout(fetchB2CSubscriptions, 300);
};

const fetchB2BProspects = async () => {
  try {
    const params = new URLSearchParams();
    if (crmSearch.value) params.append('search', crmSearch.value);
    if (crmConvertedFilter.value !== '') params.append('converted', crmConvertedFilter.value);
    const res: any = await fetcher(`/admin/platform/b2c/prospects?${params.toString()}`);
    if (res.success && res.data) {
      b2bProspects.value = res.data.items || [];
    }
  } catch (e) {
    console.error('Failed to fetch CRM prospects', e);
  }
};

let searchTimerCRM: any = null;
const debounceSearchCRM = () => {
  clearTimeout(searchTimerCRM);
  searchTimerCRM = setTimeout(fetchB2BProspects, 300);
};

// ─── Modals Actions ───────────────────────────────────────────
const openCreateSchoolModal = () => {
  createSchoolForm.name = '';
  createSchoolForm.level = 'SMA';
  createSchoolForm.npsn = '';
  createSchoolForm.address = '';
  createSchoolForm.foundation_name = '';
  createSchoolForm.admin_name = '';
  createSchoolForm.admin_email = '';
  createSchoolForm.admin_password = '';
  showCreateSchoolModal.value = true;
};

const submitCreateSchool = async () => {
  submittingModal.value = true;
  try {
    const res: any = await fetcher('/admin/platform/b2b/schools', {
      method: 'POST',
      body: createSchoolForm,
    });
    if (res.success) {
      showCreateSchoolModal.value = false;
      await fetchB2BSchools();
      await fetchOverviewStats();
    }
  } catch (err: any) {
    alert(err.data?.message || 'Gagal membuat unit sekolah');
  } finally {
    submittingModal.value = false;
  }
};

const openEditSchoolModal = (school: any) => {
  alert(`Edit untuk sekolah: ${school.name}`);
};

const openProofModal = (sub: any) => {
  selectedSub.value = sub;
  isRejectingMode.value = false;
  rejectionReason.value = '';
  showProofModal.value = true;
};

const submitVerification = async (isApproved: boolean) => {
  if (!selectedSub.value) return;
  submittingModal.value = true;
  try {
    const res: any = await fetcher(`/admin/platform/b2c/subscriptions/${selectedSub.value.id}/verify`, {
      method: 'POST',
      body: {
        isApproved,
        rejectionReason: isRejectingMode.value ? rejectionReason.value : null,
      },
    });
    if (res.success) {
      showProofModal.value = false;
      await fetchB2CSubscriptions();
      await fetchOverviewStats();
    }
  } catch (err: any) {
    alert(err.data?.message || 'Gagal memproses verifikasi');
  } finally {
    submittingModal.value = false;
  }
};

const openQuotaModal = (sub: any) => {
  selectedSub.value = sub;
  quotaForm.ai_rpp_modul_quota = sub.ai_rpp_modul_quota || 50;
  quotaForm.ai_asesmen_quota = sub.ai_asesmen_quota || 50;
  quotaForm.bonusDays = 0;
  showQuotaModal.value = true;
};

const submitQuotaAdjustment = async () => {
  if (!selectedSub.value) return;
  submittingModal.value = true;
  try {
    const res: any = await fetcher(`/admin/platform/b2c/subscriptions/${selectedSub.value.id}/quota`, {
      method: 'POST',
      body: quotaForm,
    });
    if (res.success) {
      showQuotaModal.value = false;
      await fetchB2CSubscriptions();
    }
  } catch (err: any) {
    alert(err.data?.message || 'Gagal menyesuaikan kuota');
  } finally {
    submittingModal.value = false;
  }
};

const openProspectModal = (prospect: any) => {
  selectedProspect.value = prospect;
  prospectForm.sales_notes = prospect.sales_notes || '';
  prospectForm.is_b2b_prospect = !!prospect.is_b2b_prospect;
  prospectForm.converted_to_b2b = !!prospect.converted_to_b2b_at;
  showProspectModal.value = true;
};

const submitProspectUpdate = async () => {
  if (!selectedProspect.value) return;
  submittingModal.value = true;
  try {
    const res: any = await fetcher(`/admin/platform/b2c/prospects/${selectedProspect.value.id}`, {
      method: 'PATCH',
      body: prospectForm,
    });
    if (res.success) {
      showProspectModal.value = false;
      await fetchB2BProspects();
      await fetchOverviewStats();
    }
  } catch (err: any) {
    alert(err.data?.message || 'Gagal memperbarui catatan prospek');
  } finally {
    submittingModal.value = false;
  }
};

// ─── Helpers ──────────────────────────────────────────────────
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getResolvedMediaUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
};
</script>
