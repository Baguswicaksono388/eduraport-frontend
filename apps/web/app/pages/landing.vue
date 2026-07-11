<script setup lang="ts">
definePageMeta({ layout: false })

const mobileMenuOpen = ref(false)

const features = [
  {
    icon: '📋',
    title: 'E-Raport Fleksibel',
    desc: 'Generate raport PDF otomatis untuk semua jenjang. Mendukung format Kurikulum Merdeka, K-13, hingga kurikulum pesantren dan internasional.',
    color: 'violet'
  },
  {
    icon: '🎨',
    title: 'Visual Template Builder',
    desc: 'Desainer rapor drag-and-drop dengan 14 widget premium. Kustomisasi tata letak tanpa perlu coding — hasilkan raport sesuai identitas sekolah Anda.',
    color: 'blue'
  },
  {
    icon: '📊',
    title: 'Gradebook Engine Cerdas',
    desc: 'Sistem penilaian berbobot dinamis. Atur komponen nilai (UH, UTS, UAS, Proyek) dengan bobot fleksibel. Kalkulasi nilai akhir otomatis real-time.',
    color: 'emerald'
  },
  {
    icon: '🗓️',
    title: 'Manajemen Jadwal',
    desc: 'Kalender grid mingguan bergaya Microsoft Teams. Deteksi konflik jadwal guru & kelas secara real-time. Filter per guru, kelas, dan ruangan.',
    color: 'amber'
  },
  {
    icon: '🏫',
    title: 'PPDB Online',
    desc: 'Sistem penerimaan peserta didik baru terintegrasi. Form pendaftaran custom, verifikasi pembayaran, pengumuman, hingga konversi pendaftar menjadi siswa.',
    color: 'rose'
  },
  {
    icon: '💰',
    title: 'Manajemen Keuangan',
    desc: 'Kelola SPP, tagihan, dan pembayaran dalam satu platform. Laporan BOS otomatis, notifikasi tunggakan, dan rekap keuangan yayasan.',
    color: 'teal'
  },
  {
    icon: '📅',
    title: 'Perizinan & Guru Pengganti',
    desc: 'Ajukan izin guru secara digital dengan workflow persetujuan. Sistem otomatis mendeteksi jadwal kosong dan merekomendasikan guru pengganti terbaik.',
    color: 'purple'
  },
  {
    icon: '📈',
    title: 'Executive Dashboard',
    desc: 'Dashboard KPI real-time untuk kepala sekolah & pengurus yayasan. Monitor kehadiran, nilai, keuangan, dan performa seluruh unit sekolah.',
    color: 'indigo'
  }
]

const levels = [
  { name: 'TK / KB / PAUD', emoji: '🌱', desc: 'Narasi & Capaian per Elemen', scale: 'BB/MB/BSH/BSB', special: 'Ekskul Iqra, Drumband, Seni' },
  { name: 'SD', emoji: '📚', desc: 'Nilai + Deskripsi Kompetensi', scale: '1–100 / Predikat', special: 'Profil Pelajar Pancasila (P5)' },
  { name: 'SMP', emoji: '🎒', desc: 'Nilai + Deskripsi + Rekap', scale: '1–100 / Predikat', special: 'Nilai Akhir Semester, KKM' },
  { name: 'SMA / SMK', emoji: '🎓', desc: 'Nilai + Deskripsi + Transkrip', scale: '1–100', special: 'Peminatan, SNPMB/PDSS' }
]

const personas = [
  { role: 'Kepala Sekolah', icon: '👨‍💼', desc: 'Dashboard KPI real-time, monitoring kinerja guru, laporan keuangan ringkas' },
  { role: 'Guru / Wali Kelas', icon: '👩‍🏫', desc: 'Input nilai cepat, generate narasi otomatis, cetak raport satu klik' },
  { role: 'Staf TU / Bendahara', icon: '🗂️', desc: 'Manajemen tagihan SPP, laporan BOS, rekap pembayaran terintegrasi' },
  { role: 'Orang Tua', icon: '👨‍👩‍👧', desc: 'Akses raport digital, notifikasi nilai, tagihan SPP, komunikasi guru' },
  { role: 'Pengurus Yayasan', icon: '🏛️', desc: 'Laporan konsolidasi multi-sekolah, analisis keuangan, perbandingan kinerja' }
]

const stats = [
  { value: '5+', label: 'Jenjang Pendidikan', icon: '🏫' },
  { value: '14', label: 'Widget Desainer Rapor', icon: '🎨' },
  { value: '10+', label: 'Format Penilaian', icon: '📊' },
  { value: '100%', label: 'Berbasis Cloud', icon: '☁️' }
]

const curriculums = [
  'Kurikulum Merdeka 2024',
  'Kurikulum 2013 Revisi',
  'Kurikulum Berbasis Islam/Pesantren',
  'Kurikulum International (IB, Cambridge)',
  'Kurikulum Internal Yayasan'
]

const comparisons = [
  { feature: 'E-Raport TK/PAUD mendalam', eduraport: true, competitor: false },
  { feature: 'Narasi otomatis & multi-skala', eduraport: true, competitor: false },
  { feature: 'Desainer rapor visual drag-drop', eduraport: true, competitor: false },
  { feature: 'Manajemen keuangan terintegrasi', eduraport: true, competitor: false },
  { feature: 'PPDB Online terintegrasi', eduraport: true, competitor: false },
  { feature: 'Perizinan guru & pengganti cerdas', eduraport: true, competitor: false },
  { feature: 'Yayasan multi-unit (TK+SD+SMP+SMA)', eduraport: true, competitor: false },
  { feature: 'Portal orang tua real-time', eduraport: true, competitor: false },
]

const chartHeights = [65,80,55,90,70,85,60,95]
</script>

<template>
  <div class="landing-page">

    <!-- NAV -->
    <header class="nav-wrapper">
      <div class="nav-inner">
        <a href="#" class="nav-logo">
          <div class="logo-icon">🎓</div>
          <div>
            <div class="logo-name">EduRaport</div>
            <div class="logo-tagline">Portal E-Raport</div>
          </div>
        </a>
        <nav class="nav-links">
          <a href="#fitur">Fitur</a>
          <a href="#jenjang">Jenjang</a>
          <a href="#kenapa">Keunggulan</a>
          <a href="#harga">Harga</a>
        </nav>
        <div class="nav-cta">
          <a href="/login" class="btn-ghost">Masuk</a>
          <a href="/login" class="btn-primary-sm">Coba Gratis →</a>
        </div>
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <span /><span /><span />
        </button>
      </div>
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <a href="#fitur" @click="mobileMenuOpen=false">Fitur</a>
        <a href="#jenjang" @click="mobileMenuOpen=false">Jenjang</a>
        <a href="#kenapa" @click="mobileMenuOpen=false">Keunggulan</a>
        <a href="#harga" @click="mobileMenuOpen=false">Harga</a>
        <a href="/login" class="btn-primary-sm" style="text-align:center">Masuk / Daftar →</a>
      </div>
    </header>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg-orbs">
        <div class="orb orb-1" />
        <div class="orb orb-2" />
        <div class="orb orb-3" />
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot" />
          Platform E-Raport & Manajemen Sekolah Terpadu · v1.4
        </div>
        <h1 class="hero-title">
          Raport Digital,
          <span class="gradient-text">Keuangan Sekolah</span>,
          &amp; Manajemen dalam
          <span class="gradient-text">Satu Platform</span>
        </h1>
        <p class="hero-sub">
          EduRaport adalah solusi SaaS cloud untuk sekolah swasta TK hingga SMA. Generate raport PDF otomatis, kelola nilai berbobot dinamis, pantau keuangan SPP, dan terima siswa baru — semuanya terintegrasi.
        </p>
        <div class="hero-ctas">
          <a href="/login" class="btn-hero-primary">🚀 Mulai Gratis 3 Bulan</a>
          <a href="#fitur" class="btn-hero-outline">Lihat Fitur Lengkap ↓</a>
        </div>
        <div class="hero-trust">
          <span>✅ Tanpa kartu kredit</span>
          <span>✅ Setup &lt; 7 hari</span>
          <span>✅ Support WhatsApp responsif</span>
        </div>

        <!-- Executive Dashboard Preview -->
        <div class="hero-preview">
          <div class="exec-window">
            <!-- Browser mockup Title bar -->
            <div class="exec-titlebar">
              <span class="dot red" /><span class="dot yellow" /><span class="dot green" />
              <span class="exec-url">app.eduraport.id/dashboard</span>
            </div>

            <!-- Dashboard Frame Body -->
            <div class="exec-body">
              <!-- Sidebar (Meniru layouts/default.vue desktop sidebar) -->
              <div class="exec-sidebar">
                <div class="exec-logo-area">
                  <div class="exec-logo-icon">🎓</div>
                  <div>
                    <div class="exec-logo-name">EduRaport</div>
                    <div class="exec-logo-tag">Portal E-Raport</div>
                  </div>
                </div>

                <nav class="exec-nav">
                  <div class="exec-nav-item">
                    <span class="exec-nav-icon">📊</span>
                    <span>Dashboard</span>
                  </div>
                  <div class="exec-nav-item active">
                    <span class="exec-nav-icon">📈</span>
                    <span>Dashboard Eksekutif</span>
                  </div>
                  <div class="exec-nav-item">
                    <span class="exec-nav-icon">🏫</span>
                    <span>Unit Sekolah</span>
                  </div>
                  <div class="exec-nav-item">
                    <span class="exec-nav-icon">📅</span>
                    <span>Tahun Ajaran</span>
                  </div>
                  <div class="exec-nav-item">
                    <span class="exec-nav-icon">👥</span>
                    <span>Data Siswa</span>
                  </div>
                  <div class="exec-nav-item">
                    <span class="exec-nav-icon">✏️</span>
                    <span>Input Nilai</span>
                  </div>
                  <div class="exec-nav-item">
                    <span class="exec-nav-icon">📄</span>
                    <span>Cetak Rapor</span>
                  </div>
                  <div class="exec-nav-item">
                    <span class="exec-nav-icon">💰</span>
                    <span>Keuangan &amp; SPP</span>
                  </div>
                  <div class="exec-nav-item">
                    <span class="exec-nav-icon">➕</span>
                    <span>PPDB Online</span>
                  </div>
                </nav>

                <div class="exec-sidebar-footer">
                  <div class="exec-user-info">
                    <div class="exec-user-text">
                      <div class="exec-username">Budi Santoso</div>
                      <div class="exec-userrole">PRINCIPAL</div>
                    </div>
                    <div class="exec-avatar-circle">BS</div>
                  </div>
                </div>
              </div>

              <!-- Main Dashboard Area -->
              <div class="exec-main">
                <!-- Topbar (Meniru DashboardTopbar.vue) -->
                <div class="exec-topbar">
                  <div>
                    <div class="exec-topbar-title">📈 Dashboard Eksekutif</div>
                    <div class="exec-topbar-sub">Ringkasan eksekutif performa sekolah, finansial, kehadiran, dan kelengkapan nilai akademik.</div>
                  </div>
                  <div class="exec-topbar-controls">
                    <div class="exec-ctrl-dropdown">
                      <span class="exec-ctrl-lbl">Tampilan:</span>
                      <span class="exec-ctrl-val">Kepala Sekolah</span>
                    </div>
                    <div class="exec-ctrl-dropdown">
                      <span class="exec-ctrl-lbl">Tanggal:</span>
                      <span class="exec-ctrl-val">11 Jul 2026</span>
                    </div>
                    <div class="exec-btn-primary">Segarkan</div>
                  </div>
                </div>

                <!-- Config Strip (Meniru Quick Config Strip di PrincipalDashboard.vue) -->
                <div class="exec-config-strip">
                  <div>
                    <div class="exec-cfg-title">Panel Kontrol Konfigurasi</div>
                    <div class="exec-cfg-sub">Atur ambang batas toleransi data dan penjadwalan laporan otomatis.</div>
                  </div>
                  <div class="exec-cfg-actions">
                    <button class="exec-btn-outline">⚙️ Konfigurasi Alarm</button>
                    <button class="exec-btn-solid">✉️ Laporan Otomatis</button>
                  </div>
                </div>

                <!-- Briefing Narrative (Meniru BriefingHero.vue) -->
                <div class="exec-briefing">
                  <div class="exec-briefing-badge">✨ TAKLIMAT PAGI</div>
                  <div class="exec-briefing-welcome">Selamat Pagi, Budi Santoso!</div>
                  <p class="exec-briefing-text">
                    Kehadiran siswa hari ini mencapai <span class="good">95%</span>. Rata-rata persentase input nilai rapor saat ini adalah <span class="good">94%</span>. Ada <span class="bad">3 guru izin hari ini</span>, mohon konfirmasi guru pengganti.
                  </p>
                </div>

                <!-- Highlights (Meniru Highlight Gauges di PrincipalDashboard.vue) -->
                <div class="exec-gauges-grid">
                  <div class="exec-gauge-card">
                    <div class="exec-gauge-title">Kesiapan Kelengkapan Nilai Rapor</div>
                    <div class="exec-gauge-body">
                      <!-- Semicircle gauge mockup -->
                      <div class="exec-gauge-circle">
                        <svg viewBox="0 0 100 50" class="exec-svg-gauge">
                          <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="#27272a" stroke-width="10" stroke-linecap="round" />
                          <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="#10b981" stroke-width="10" stroke-linecap="round" stroke-dasharray="125" stroke-dashoffset="7.5" />
                        </svg>
                        <div class="exec-gauge-val text-emerald">94%</div>
                      </div>
                      <div class="exec-gauge-label">Progress Pengisian</div>
                    </div>
                  </div>

                  <div class="exec-gauge-card">
                    <div class="exec-gauge-title">Okupansi / Kapasitas Daya Tampung Siswa</div>
                    <div class="exec-gauge-body">
                      <!-- Semicircle gauge mockup -->
                      <div class="exec-gauge-circle">
                        <svg viewBox="0 0 100 50" class="exec-svg-gauge">
                          <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="#27272a" stroke-width="10" stroke-linecap="round" />
                          <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" stroke-dasharray="125" stroke-dashoffset="31.25" />
                        </svg>
                        <div class="exec-gauge-val text-amber">75%</div>
                      </div>
                      <div class="exec-gauge-label">Kapasitas Terisi</div>
                    </div>
                  </div>
                </div>

                <!-- Main Layout Grid (Metrik & Alarm Rules) -->
                <div class="exec-bottom-layout">
                  <!-- Operational Metrics (MetricCard.vue) -->
                  <div class="exec-metrics-side">
                    <div class="exec-section-title">Metrik Operasional Utama</div>
                    <div class="exec-metrics-grid">
                      <!-- Card 1: Kehadiran Siswa -->
                      <div class="exec-mcard">
                        <div class="exec-mcard-header">
                          <span class="exec-mcard-fresh">REAL-TIME</span>
                          <h4 class="exec-mcard-title">Kehadiran Siswa Hari Ini</h4>
                        </div>
                        <div class="exec-mcard-value">95%</div>
                        <div class="exec-mcard-payload">
                          <div class="exec-mcard-row">
                            <span>Siswa Masuk:</span>
                            <span>803 / 847</span>
                          </div>
                        </div>
                        <div class="exec-mcard-footer">
                          <button class="exec-btn-mcard">↺ Hitung Ulang</button>
                          <button class="exec-btn-mcard text-violet">Detail ↗</button>
                        </div>
                      </div>

                      <!-- Card 2: Kehadiran Guru & Staf (Rose border / Alarm triggered) -->
                      <div class="exec-mcard alarm">
                        <div class="exec-mcard-header">
                          <span class="exec-mcard-fresh">REAL-TIME</span>
                          <h4 class="exec-mcard-title">Kehadiran Guru &amp; Staf</h4>
                          <span class="exec-alarm-indicator">⚠️</span>
                        </div>
                        <div class="exec-mcard-value text-rose">3</div>
                        <div class="exec-mcard-payload text-rose">
                          <div class="exec-mcard-row">
                            <span>Hadir:</span>
                            <span>28 / 31</span>
                          </div>
                          <div class="exec-mcard-subrow">IZIN: Pak Budi, Bu Sari</div>
                          <div class="exec-mcard-subrow">ALPHA: Pak Rudi</div>
                        </div>
                        <div class="exec-mcard-footer">
                          <button class="exec-btn-mcard">↺ Hitung Ulang</button>
                          <button class="exec-btn-mcard text-rose">Detail ↗</button>
                        </div>
                      </div>

                      <!-- Card 3: SPP -->
                      <div class="exec-mcard">
                        <div class="exec-mcard-header">
                          <span class="exec-mcard-fresh">SNAPSHOT JUL</span>
                          <h4 class="exec-mcard-title">Koleksi SPP Bulan Ini</h4>
                        </div>
                        <div class="exec-mcard-value text-xs" style="font-size: 15px; margin: 6px 0;">Rp 48.200.000</div>
                        <div class="exec-mcard-payload">
                          <div class="exec-mcard-row">
                            <span>Sudah Bayar:</span>
                            <span>Rp 48,2jt / 62,5jt</span>
                          </div>
                        </div>
                        <div class="exec-mcard-footer">
                          <button class="exec-btn-mcard">↺ Hitung Ulang</button>
                          <button class="exec-btn-mcard text-violet">Detail ↗</button>
                        </div>
                      </div>

                      <!-- Card 4: Kelas Kosong -->
                      <div class="exec-mcard">
                        <div class="exec-mcard-header">
                          <span class="exec-mcard-fresh">REAL-TIME</span>
                          <h4 class="exec-mcard-title">Kelas Kosong Hari Ini</h4>
                        </div>
                        <div class="exec-mcard-value">2</div>
                        <div class="exec-mcard-payload">
                          <div class="exec-mcard-row">
                            <span class="text-rose">5A - Mat (ALPHA)</span>
                          </div>
                          <div class="exec-mcard-row">
                            <span class="text-amber">4B - IPA (IZIN)</span>
                          </div>
                        </div>
                        <div class="exec-mcard-footer">
                          <button class="exec-btn-mcard">↺ Hitung Ulang</button>
                          <button class="exec-btn-mcard text-violet">Detail ↗</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Alarm Rules Side Panel (AlarmCard.vue) -->
                  <div class="exec-rules-side">
                    <div class="exec-section-title">Aturan Alarm</div>
                    <div class="exec-rules-card">
                      <div class="exec-rules-header">
                        <span class="exec-rules-icon">🚨</span>
                        <div>
                          <div class="exec-rules-title">Ambang Alarm &amp; Kritis</div>
                          <div class="exec-rules-desc">Ambang batas toleransi metrik sekolah.</div>
                        </div>
                      </div>

                      <div class="exec-rules-list">
                        <div class="exec-rule-item">
                          <div>
                            <div class="exec-rule-name">Kehadiran Siswa Hari Ini</div>
                            <div class="exec-rule-formula">Formula: LT 85 (AKTIF)</div>
                          </div>
                          <button class="exec-rule-edit">✏️</button>
                        </div>
                        <div class="exec-rule-item">
                          <div>
                            <div class="exec-rule-name">Kehadiran Guru &amp; Staf</div>
                            <div class="exec-rule-formula">Formula: LT 90 (AKTIF)</div>
                          </div>
                          <button class="exec-rule-edit">✏️</button>
                        </div>
                        <div class="exec-rule-item">
                          <div>
                            <div class="exec-rule-name">Koleksi SPP Bulan Ini</div>
                            <div class="exec-rule-formula">Formula: LT 60 (AKTIF)</div>
                          </div>
                          <button class="exec-rule-edit">✏️</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- STATS -->
    <section class="stats-band">
      <div class="container">
        <div class="stats-grid">
          <div v-for="s in stats" :key="s.label" class="stat-item">
            <div class="stat-icon">{{ s.icon }}</div>
            <div class="stat-val">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section id="fitur" class="section features-section">
      <div class="container">
        <div class="section-header">
          <div class="section-badge">Modul Lengkap</div>
          <h2 class="section-title">Semua yang Dibutuhkan Sekolah<br><span class="gradient-text">dalam Satu Ekosistem</span></h2>
          <p class="section-sub">Dari E-Raport hingga keuangan, jadwal, hingga PPDB — dirancang khusus untuk sekolah swasta Indonesia.</p>
        </div>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card" :class="'fc-'+f.color">
            <div class="fc-icon">{{ f.icon }}</div>
            <h3 class="fc-title">{{ f.title }}</h3>
            <p class="fc-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="section how-section">
      <div class="container">
        <div class="section-header">
          <div class="section-badge">Alur Kerja</div>
          <h2 class="section-title">Dari Input Nilai ke Raport<br><span class="gradient-text">Hanya 3 Langkah</span></h2>
        </div>
        <div class="steps">
          <div class="step">
            <div class="step-num">01</div>
            <div class="step-icon">🎨</div>
            <h3>Rancang Template</h3>
            <p>Desain format raport sekolah Anda menggunakan Visual Builder drag-and-drop. Pilih dari 14 widget premium, atur tata letak, dan simpan sebagai template reusable.</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">02</div>
            <div class="step-icon">✏️</div>
            <h3>Input & Hitung Nilai</h3>
            <p>Guru input nilai per komponen (UH, UTS, UAS, Proyek). Sistem kalkulasi nilai akhir otomatis dengan bobot yang telah dikonfigurasi. Import bulk via Excel pun tersedia.</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-num">03</div>
            <div class="step-icon">📄</div>
            <h3>Generate & Distribusi</h3>
            <p>Cetak raport PDF per siswa atau bulk seluruh kelas dengan satu klik. Raport otomatis tersedia di portal orang tua lengkap dengan QR code autentikasi.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SCHOOL LEVELS -->
    <section id="jenjang" class="section levels-section">
      <div class="container">
        <div class="section-header">
          <div class="section-badge">Multi-Jenjang</div>
          <h2 class="section-title">Satu Platform untuk<br><span class="gradient-text">Semua Jenjang Pendidikan</span></h2>
          <p class="section-sub">Dari TK hingga SMA, EduRaport menyediakan format penilaian dan raport yang sesuai dengan kebutuhan masing-masing jenjang.</p>
        </div>
        <div class="levels-grid">
          <div v-for="l in levels" :key="l.name" class="level-card">
            <div class="level-emoji">{{ l.emoji }}</div>
            <h3 class="level-name">{{ l.name }}</h3>
            <p class="level-desc">{{ l.desc }}</p>
            <div class="level-scale">
              <span class="scale-label">Skala:</span>
              <span class="scale-val">{{ l.scale }}</span>
            </div>
            <div class="level-special"><span>⭐</span> {{ l.special }}</div>
          </div>
        </div>
        <div class="curriculum-tags">
          <div class="curriculum-label">📚 Kurikulum yang Didukung:</div>
          <div class="tags">
            <span v-for="c in curriculums" :key="c" class="tag">{{ c }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- PERSONAS -->
    <section class="section personas-section">
      <div class="container">
        <div class="section-header">
          <div class="section-badge">Untuk Siapa</div>
          <h2 class="section-title">Dirancang untuk<br><span class="gradient-text">Setiap Peran di Sekolah</span></h2>
        </div>
        <div class="personas-grid">
          <div v-for="p in personas" :key="p.role" class="persona-card">
            <div class="persona-icon">{{ p.icon }}</div>
            <h3 class="persona-role">{{ p.role }}</h3>
            <p class="persona-desc">{{ p.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- WHY EDURAPORT -->
    <section id="kenapa" class="section comparison-section">
      <div class="container">
        <div class="two-col">
          <div class="comparison-text">
            <div class="section-badge">Keunggulan</div>
            <h2 class="section-title" style="text-align:left">Mengapa Memilih<br><span class="gradient-text">EduRaport?</span></h2>
            <p class="section-sub" style="text-align:left;margin:0 0 28px 0">Kami satu-satunya platform yang secara khusus melayani kebutuhan mendalam sekolah swasta Indonesia — dari TK hingga SMA — dengan raport yang benar-benar fleksibel dan terintegrasi penuh dengan keuangan.</p>
            <div class="diff-list">
              <div class="diff-item"><span class="diff-check">✓</span><div><strong>TK/PAUD mendalam</strong> — Format narasi, multi-skala, rekapitulasi kelas persis seperti yang Anda butuhkan</div></div>
              <div class="diff-item"><span class="diff-check">✓</span><div><strong>Visual Template Builder</strong> — Desain raport sesuai branding sekolah tanpa bantuan tim IT</div></div>
              <div class="diff-item"><span class="diff-check">✓</span><div><strong>Raport + Keuangan + Portal Ortu</strong> — Satu paket terpadu, harga terjangkau</div></div>
              <div class="diff-item"><span class="diff-check">✓</span><div><strong>Multi-unit Yayasan</strong> — Kelola TK + SD + SMP + SMA dalam satu akun yayasan</div></div>
              <div class="diff-item"><span class="diff-check">✓</span><div><strong>Support WA &lt; 2 jam</strong> — Tim kami responsif membantu onboarding Anda hingga go-live</div></div>
            </div>
          </div>
          <div class="comparison-table-wrap">
            <h3 class="ct-title">EduRaport vs. Kompetitor</h3>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Fitur</th>
                  <th class="th-us">EduRaport</th>
                  <th style="text-align:center">Lainnya</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in comparisons" :key="c.feature">
                  <td>{{ c.feature }}</td>
                  <td class="td-us">{{ c.eduraport ? '✅' : '❌' }}</td>
                  <td class="td-other">{{ c.competitor ? '✅' : '❌' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section id="harga" class="section pricing-section">
      <div class="container">
        <div class="section-header">
          <div class="section-badge">Harga Transparan</div>
          <h2 class="section-title">Terjangkau untuk<br><span class="gradient-text">Semua Skala Sekolah</span></h2>
          <p class="section-sub">Mulai dari sekolah kecil hingga yayasan besar — ada paket yang sesuai kebutuhan Anda.</p>
        </div>
        <div class="pricing-grid">
          <div class="price-card">
            <div class="price-badge-wrap"><span class="price-badge-tier">Starter</span></div>
            <div class="price-target">TK / SD Kecil</div>
            <div class="price-amount">Rp 500.000<span>/bulan</span></div>
            <div class="price-note">per sekolah, hingga 150 siswa</div>
            <ul class="price-features">
              <li>✓ E-Raport TK, SD (PDF)</li>
              <li>✓ Input nilai & gradebook dasar</li>
              <li>✓ Template raport visual builder</li>
              <li>✓ Manajemen data siswa</li>
              <li>✓ Portal orang tua (read-only)</li>
              <li>✓ Manajemen SPP dasar</li>
              <li>✓ Support WhatsApp</li>
            </ul>
            <a href="/login" class="btn-price-outline">Mulai Gratis 3 Bulan →</a>
          </div>
          <div class="price-card featured">
            <div class="price-badge-wrap"><span class="price-badge-tier featured-badge">⭐ Paling Populer</span></div>
            <div class="price-target">Sekolah Menengah</div>
            <div class="price-amount">Rp 1.200.000<span>/bulan</span></div>
            <div class="price-note">per sekolah, hingga 500 siswa</div>
            <ul class="price-features">
              <li>✓ Semua fitur Starter</li>
              <li>✓ E-Raport SMP & SMA</li>
              <li>✓ Gradebook Engine berbobot</li>
              <li>✓ Jadwal pelajaran + conflict detection</li>
              <li>✓ PPDB Online terintegrasi</li>
              <li>✓ Perizinan & guru pengganti</li>
              <li>✓ Dashboard Eksekutif</li>
              <li>✓ Keuangan lengkap (BOS, jurnal)</li>
              <li>✓ Notifikasi WhatsApp</li>
            </ul>
            <a href="/login" class="btn-price-primary">Mulai Gratis 3 Bulan →</a>
          </div>
          <div class="price-card">
            <div class="price-badge-wrap"><span class="price-badge-tier">Enterprise</span></div>
            <div class="price-target">Yayasan Multi-Unit</div>
            <div class="price-amount">Custom<span></span></div>
            <div class="price-note">disesuaikan jumlah unit & siswa</div>
            <ul class="price-features">
              <li>✓ Semua fitur Professional</li>
              <li>✓ Dashboard yayasan konsolidasi</li>
              <li>✓ Multi-unit (TK+SD+SMP+SMA)</li>
              <li>✓ White-label mobile app</li>
              <li>✓ Integrasi Dapodik & EMIS</li>
              <li>✓ API publik integrasi pihak ke-3</li>
              <li>✓ Dedicated customer success</li>
              <li>✓ SLA & onboarding premium</li>
            </ul>
            <a href="https://wa.me/6281234567890" class="btn-price-outline">Hubungi Kami →</a>
          </div>
        </div>
        <div class="pricing-note">
          <span>🎁 Pilot gratis 3 bulan khusus TK/PAUD</span>
          <span>·</span>
          <span>📞 Referral: rekomendasikan sekolah lain, dapatkan 1 bulan gratis</span>
          <span>·</span>
          <span>🤝 Partnership yayasan NU, Muhammadiyah, Pesantren tersedia</span>
        </div>
      </div>
    </section>

    <!-- TESTIMONIALS -->
    <section class="section testimonials-section">
      <div class="container">
        <div class="section-header">
          <div class="section-badge">Testimoni</div>
          <h2 class="section-title">Dipercaya oleh<br><span class="gradient-text">Sekolah di Seluruh Indonesia</span></h2>
        </div>
        <div class="testimonials-grid">
          <div class="testi-card">
            <div class="testi-quote">"Akhirnya ada platform yang benar-benar paham kebutuhan TK. Format narasi, skala BB/MB/BSH/BSB, semua tersedia. Guru-guru kami sangat terbantu dan proses pengisian raport jadi 10x lebih cepat!"</div>
            <div class="testi-author">
              <div class="testi-avatar">👩‍💼</div>
              <div>
                <div class="testi-name">Kepala TK Al-Falah</div>
                <div class="testi-school">Karanganyar, Jawa Tengah</div>
              </div>
            </div>
          </div>
          <div class="testi-card">
            <div class="testi-quote">"Visual Template Builder sungguh luar biasa. Kami bisa desain raport sesuai identitas sekolah kami dalam waktu 1 jam. Dulu butuh berhari-hari dan harus bayar desainer grafis."</div>
            <div class="testi-author">
              <div class="testi-avatar">👨‍💼</div>
              <div>
                <div class="testi-name">Wakasek Kurikulum SDIT Annur</div>
                <div class="testi-school">Bekasi, Jawa Barat</div>
              </div>
            </div>
          </div>
          <div class="testi-card">
            <div class="testi-quote">"Modul PPDB Online mengubah cara kami menerima siswa baru. Tidak perlu kertas lagi — semua dari pendaftaran hingga pengumuman penerimaan dilakukan secara digital."</div>
            <div class="testi-author">
              <div class="testi-avatar">👩‍🏫</div>
              <div>
                <div class="testi-name">Staf TU SMP Islam Terpadu</div>
                <div class="testi-school">Surabaya, Jawa Timur</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FINAL CTA -->
    <section class="cta-final">
      <div class="cta-orb-1" />
      <div class="cta-orb-2" />
      <div class="container cta-content">
        <div class="cta-badge">Mulai Sekarang</div>
        <h2 class="cta-title">Siap Transformasi<br>Digital Sekolah Anda?</h2>
        <p class="cta-sub">Bergabung bersama sekolah-sekolah progresif yang telah menggunakan EduRaport. Setup dalam 7 hari, tanpa tim IT, tanpa biaya tersembunyi.</p>
        <div class="cta-actions">
          <a href="/login" class="btn-cta-primary">🚀 Mulai Gratis 3 Bulan</a>
          <a href="https://wa.me/6281234567890" class="btn-cta-wa"><span>💬</span> Chat WhatsApp</a>
        </div>
        <div class="cta-guarantees">
          <span>✅ Tanpa kartu kredit</span>
          <span>✅ Onboarding gratis</span>
          <span>✅ Data aman & terenkripsi</span>
          <span>✅ Support WA responsif</span>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="footer-logo-icon">🎓</div>
            <div>
              <div class="footer-logo-name">EduRaport</div>
              <div class="footer-logo-tag">Portal E-Raport Terintegrasi</div>
            </div>
          </div>
          <p class="footer-desc">Platform SaaS cloud untuk E-Raport, manajemen akademik, dan keuangan sekolah. Melayani TK hingga SMA di seluruh Indonesia.</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h4>Produk</h4>
            <a href="#fitur">Fitur Lengkap</a>
            <a href="#jenjang">Jenjang Pendidikan</a>
            <a href="#harga">Harga</a>
            <a href="/login">Login Portal</a>
          </div>
          <div class="footer-col">
            <h4>Modul</h4>
            <a href="#">E-Raport & Penilaian</a>
            <a href="#">PPDB Online</a>
            <a href="#">Keuangan & SPP</a>
            <a href="#">Jadwal Pelajaran</a>
          </div>
          <div class="footer-col">
            <h4>Perusahaan</h4>
            <a href="#">Tentang Kami</a>
            <a href="#">Blog & Tutorial</a>
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat Layanan</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <span>© 2026 EduRaport. Hak cipta dilindungi.</span>
          <span>Dibuat dengan ❤️ untuk pendidikan Indonesia</span>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.landing-page {
  font-family: 'Inter', sans-serif;
  background: #060614;
  color: #e2e8f0;
  overflow-x: hidden;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
.gradient-text {
  background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* NAV */
.nav-wrapper {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  background: rgba(6,6,20,0.88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(167,139,250,0.1);
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.logo-icon {
  font-size: 22px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  width: 36px; height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-name { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
.logo-tagline { font-size: 9px; font-weight: 700; color: #f59e0b; letter-spacing: 1.5px; text-transform: uppercase; }
.nav-links { display: flex; gap: 32px; }
.nav-links a { color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
.nav-links a:hover { color: #fff; }
.nav-cta { display: flex; align-items: center; gap: 12px; }
.btn-ghost { color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
.btn-ghost:hover { color: #fff; }
.btn-primary-sm {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; text-decoration: none; font-size: 13px; font-weight: 700;
  padding: 8px 18px; border-radius: 8px; transition: opacity 0.2s, transform 0.2s;
}
.btn-primary-sm:hover { opacity: 0.9; transform: scale(1.02); }
.mobile-menu-btn {
  display: none; flex-direction: column; gap: 5px;
  background: none; border: none; cursor: pointer; padding: 4px;
}
.mobile-menu-btn span { display: block; width: 22px; height: 2px; background: #94a3b8; border-radius: 2px; }
.mobile-menu {
  display: flex; flex-direction: column;
  padding: 16px 24px 24px; gap: 12px;
  border-top: 1px solid rgba(167,139,250,0.1);
}
.mobile-menu a { color: #94a3b8; text-decoration: none; font-size: 15px; font-weight: 500; }

/* HERO */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 100px 24px 60px;
  overflow: hidden;
}
.hero-bg-orbs { position: absolute; inset: 0; pointer-events: none; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; }
.orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
  top: -200px; left: -100px;
  animation: float1 8s ease-in-out infinite;
}
.orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #1d4ed8 0%, transparent 70%);
  top: 100px; right: -50px;
  animation: float2 10s ease-in-out infinite;
}
.orb-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, #059669 0%, transparent 70%);
  bottom: 0; left: 40%;
  animation: float1 12s ease-in-out infinite reverse;
}
@keyframes float1 { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
@keyframes float2 { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(20px) scale(0.95); } }
.hero-content {
  max-width: 1200px; margin: 0 auto; width: 100%; position: relative; z-index: 1;
}
.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3);
  color: #a78bfa; font-size: 12px; font-weight: 600;
  padding: 6px 14px; border-radius: 100px; letter-spacing: 0.5px; margin-bottom: 24px;
}
.badge-dot { width: 7px; height: 7px; background: #7c3aed; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
.hero-title {
  font-size: clamp(34px, 6vw, 70px); font-weight: 900;
  line-height: 1.1; letter-spacing: -2px; color: #fff; margin-bottom: 24px; max-width: 820px;
}
.hero-sub { font-size: 18px; line-height: 1.7; color: #94a3b8; max-width: 600px; margin-bottom: 36px; }
.hero-ctas { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
.btn-hero-primary {
  background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; text-decoration: none;
  font-size: 16px; font-weight: 700; padding: 14px 28px; border-radius: 12px;
  box-shadow: 0 0 40px rgba(124,58,237,0.4); transition: transform 0.2s, box-shadow 0.2s;
}
.btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(124,58,237,0.6); }
.btn-hero-outline {
  border: 1px solid rgba(255,255,255,0.2); color: #e2e8f0; text-decoration: none;
  font-size: 16px; font-weight: 600; padding: 14px 28px; border-radius: 12px;
  transition: border-color 0.2s, background 0.2s;
}
.btn-hero-outline:hover { border-color: rgba(167,139,250,0.5); background: rgba(167,139,250,0.08); }
.hero-trust { display: flex; gap: 20px; flex-wrap: wrap; font-size: 13px; color: #64748b; margin-bottom: 60px; }

/* EXECUTIVE DASHBOARD MOCKUP PREVIEW Styles */
.exec-window {
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
  max-width: 1000px;
}
.exec-titlebar {
  background: #18181b;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #27272a;
}
.exec-url {
  margin-left: 12px;
  font-size: 10px;
  color: #52525b;
  font-family: monospace;
  background: rgba(255,255,255,0.03);
  padding: 3px 12px;
  border-radius: 6px;
  flex: 1;
}
.exec-body {
  display: flex;
  height: 520px;
  overflow: hidden;
}

/* Sidebar styling matching layout/default.vue desktop */
.exec-sidebar {
  width: 190px;
  background: #0f172a;
  border-right: 1px solid #1e293b;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
}
.exec-logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.exec-logo-icon {
  background: #7c3aed;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.exec-logo-name {
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}
.exec-logo-tag {
  font-size: 8px;
  font-weight: 700;
  color: #f59e0b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
.exec-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.exec-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 10.5px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}
.exec-nav-item:hover {
  color: #ffffff;
  background: rgba(30, 41, 59, 0.5);
}
.exec-nav-item.active {
  background: #7c3aed;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
}
.exec-nav-icon {
  font-size: 12px;
}
.exec-sidebar-footer {
  border-top: 1px solid #1e293b;
  padding-top: 12px;
  margin-top: 12px;
}
.exec-user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.exec-user-text {
  text-align: left;
}
.exec-username {
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}
.exec-userrole {
  font-size: 8px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  margin-top: 1px;
}
.exec-avatar-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(124,58,237,0.1);
  border: 1px solid rgba(124,58,237,0.3);
  color: #a78bfa;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Main Dashboard Container */
.exec-main {
  flex: 1;
  padding: 16px;
  background: #09090b;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;
}

/* Topbar */
.exec-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #18181b;
  padding-bottom: 12px;
}
.exec-topbar-title {
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;
}
.exec-topbar-sub {
  font-size: 9px;
  color: #71717a;
  margin-top: 3px;
}
.exec-topbar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.exec-ctrl-dropdown {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 9.5px;
  color: #71717a;
  display: flex;
  align-items: center;
  gap: 4px;
}
.exec-ctrl-lbl {
  font-weight: 700;
}
.exec-ctrl-val {
  color: #e2e8f0;
  font-weight: 700;
}
.exec-btn-primary {
  background: #7c3aed;
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 700;
  padding: 4.5px 10px;
  border-radius: 6px;
  cursor: pointer;
}

/* Config Strip */
.exec-config-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(39, 39, 42, 0.2);
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 10px 14px;
}
.exec-cfg-title {
  font-size: 10.5px;
  font-weight: 700;
  color: #e2e8f0;
}
.exec-cfg-sub {
  font-size: 8.5px;
  color: #71717a;
  margin-top: 1px;
}
.exec-cfg-actions {
  display: flex;
  gap: 6px;
}
.exec-btn-outline {
  background: #18181b;
  border: 1px solid #27272a;
  color: #e2e8f0;
  font-size: 9px;
  font-weight: 700;
  padding: 4.5px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.exec-btn-solid {
  background: #7c3aed;
  border: none;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  padding: 4.5px 10px;
  border-radius: 8px;
  cursor: pointer;
}

/* Briefing Narrative */
.exec-briefing {
  background: linear-gradient(135deg, #4c1d95 0%, #1e1b4b 50%, #09090b 100%);
  border: 1px solid #2e1065;
  border-radius: 12px;
  padding: 14px 16px;
}
.exec-briefing-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fbbf24;
  font-size: 8px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 100px;
  letter-spacing: 0.5px;
}
.exec-briefing-welcome {
  font-size: 12.5px;
  font-weight: 800;
  color: #ffffff;
  margin-top: 6px;
}
.exec-briefing-text {
  font-size: 10.5px;
  color: #e2e8f0;
  line-height: 1.5;
  margin-top: 4px;
}
.exec-briefing-text .good {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 700;
}
.exec-briefing-text .bad {
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.1);
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 700;
}

/* Gauge Charts */
.exec-gauges-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.exec-gauge-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.exec-gauge-title {
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: #71717a;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  text-align: center;
}
.exec-gauge-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.exec-gauge-circle {
  position: relative;
  width: 120px;
  height: 65px;
}
.exec-svg-gauge {
  width: 120px;
  height: 60px;
}
.exec-gauge-val {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 18px;
  font-weight: 900;
}
.exec-gauge-val.text-emerald {
  color: #34d399;
}
.exec-gauge-val.text-amber {
  color: #fbbf24;
}
.exec-gauge-label {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  color: #52525b;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

/* Bottom Grid Layout */
.exec-bottom-layout {
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 12px;
  align-items: start;
}
.exec-section-title {
  font-size: 11px;
  font-weight: 800;
  color: #e2e8f0;
  margin-bottom: 8px;
}
.exec-metrics-side {
  display: flex;
  flex-direction: column;
}
.exec-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* Operational Metric Card */
.exec-mcard {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  min-height: 120px;
}
.exec-mcard.alarm {
  border-color: #7f1d1d;
  background: rgba(127, 29, 29, 0.05);
}
.exec-mcard-alarm-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #f43f5e;
}
.exec-mcard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
}
.exec-mcard-fresh {
  font-size: 7px;
  font-weight: 800;
  color: #52525b;
  letter-spacing: 0.5px;
}
.exec-mcard-title {
  font-size: 9.5px;
  font-weight: 700;
  color: #d4d4d8;
  margin-top: 2px;
  width: 100%;
}
.exec-alarm-indicator {
  position: absolute;
  right: 12px;
  top: 12px;
  font-size: 10px;
}
.exec-mcard-value {
  font-size: 20px;
  font-weight: 900;
  color: #ffffff;
  margin: 6px 0;
}
.exec-mcard-value.text-rose {
  color: #f43f5e;
}
.exec-mcard-payload {
  background: rgba(9, 9, 11, 0.5);
  border: 1px solid rgba(39, 39, 42, 0.5);
  border-radius: 6px;
  padding: 6px;
  font-size: 8.5px;
  color: #a1a1aa;
}
.exec-mcard-payload.text-rose {
  color: #fda4af;
}
.exec-mcard-row {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
}
.exec-mcard-subrow {
  font-size: 7.5px;
  font-weight: 700;
  margin-top: 1px;
}
.exec-mcard-subrow:first-of-type {
  margin-top: 3px;
}
.exec-mcard-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(39, 39, 42, 0.5);
  padding-top: 6px;
  margin-top: 8px;
}
.exec-btn-mcard {
  background: transparent;
  border: none;
  font-size: 8.5px;
  font-weight: 750;
  color: #52525b;
  cursor: pointer;
  padding: 0;
}
.exec-btn-mcard.text-violet {
  color: #a78bfa;
}
.exec-btn-mcard.text-rose {
  color: #f43f5e;
}

/* Alarm Card (AlarmCard.vue) */
.exec-rules-side {
  display: flex;
  flex-direction: column;
}
.exec-rules-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.exec-rules-header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #27272a;
  padding-bottom: 8px;
}
.exec-rules-icon {
  font-size: 14px;
}
.exec-rules-title {
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
}
.exec-rules-desc {
  font-size: 8px;
  color: #71717a;
  margin-top: 1px;
}
.exec-rules-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.exec-rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(9, 9, 11, 0.5);
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 6px 8px;
  text-align: left;
}
.exec-rule-name {
  font-size: 9px;
  font-weight: 700;
  color: #d4d4d8;
}
.exec-rule-formula {
  font-size: 7.5px;
  color: #71717a;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: 1px;
}
.exec-rule-edit {
  background: transparent;
  border: none;
  font-size: 8px;
  cursor: pointer;
  padding: 0;
}

@media (max-width: 768px) {
  .exec-sidebar { display: none; }
  .exec-body { height: auto; }
  .exec-gauges-grid { grid-template-columns: 1fr; }
  .exec-bottom-layout { grid-template-columns: 1fr; }
  .exec-rules-side { display: none; }
}
@media (max-width: 480px) {
  .exec-metrics-grid { grid-template-columns: 1fr; }
  .exec-topbar { flex-direction: column; align-items: flex-start; gap: 8px; }
}

/* STATS */
.stats-band { background: rgba(124,58,237,0.08); border-top: 1px solid rgba(124,58,237,0.15); border-bottom: 1px solid rgba(124,58,237,0.15); padding: 40px 0; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center; }
.stat-icon { font-size: 28px; margin-bottom: 8px; }
.stat-val { font-size: 40px; font-weight: 900; color: #a78bfa; letter-spacing: -2px; }
.stat-label { font-size: 13px; color: #64748b; font-weight: 500; margin-top: 4px; }

/* SECTIONS */
.section { padding: 100px 0; }
.section-header { text-align: center; margin-bottom: 60px; }
.section-badge { display: inline-block; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); color: #a78bfa; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 100px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
.section-title { font-size: clamp(26px, 4vw, 48px); font-weight: 900; letter-spacing: -1.5px; color: #fff; line-height: 1.15; margin-bottom: 16px; }
.section-sub { font-size: 17px; color: #64748b; line-height: 1.7; max-width: 580px; margin: 0 auto; }

/* FEATURES */
.features-section { background: #060614; }
.features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.feature-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 28px 22px; transition: transform 0.25s, border-color 0.25s, background 0.25s; }
.feature-card:hover { transform: translateY(-6px); border-color: rgba(167,139,250,0.3); background: rgba(124,58,237,0.06); }
.fc-icon { font-size: 32px; margin-bottom: 14px; }
.fc-title { font-size: 15px; font-weight: 700; color: #e2e8f0; margin-bottom: 10px; }
.fc-desc { font-size: 13px; line-height: 1.65; color: #64748b; }

/* HOW IT WORKS */
.how-section { background: linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(6,6,20,1) 50%, rgba(16,185,129,0.05) 100%); }
.steps { display: flex; align-items: flex-start; gap: 24px; }
.step { flex: 1; text-align: center; padding: 36px 24px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; position: relative; }
.step-num { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 100px; letter-spacing: 1px; white-space: nowrap; }
.step-icon { font-size: 40px; margin-bottom: 16px; margin-top: 8px; }
.step h3 { font-size: 18px; font-weight: 700; color: #e2e8f0; margin-bottom: 12px; }
.step p { font-size: 14px; color: #64748b; line-height: 1.7; }
.step-arrow { font-size: 28px; color: #4338ca; margin-top: 80px; flex-shrink: 0; }

/* LEVELS */
.levels-section { background: #07071a; }
.levels-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 48px; }
.level-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 32px 20px; text-align: center; transition: transform 0.25s, border-color 0.25s; }
.level-card:hover { transform: translateY(-4px); border-color: rgba(167,139,250,0.25); }
.level-emoji { font-size: 44px; margin-bottom: 14px; }
.level-name { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 8px; }
.level-desc { font-size: 13px; color: #64748b; margin-bottom: 14px; line-height: 1.5; }
.level-scale { display: inline-flex; align-items: center; gap: 6px; background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.25); border-radius: 8px; padding: 5px 12px; margin-bottom: 14px; }
.scale-label { font-size: 10px; color: #6d28d9; font-weight: 700; text-transform: uppercase; }
.scale-val { font-size: 12px; color: #a78bfa; font-weight: 600; font-family: monospace; }
.level-special { font-size: 11px; color: #475569; display: flex; align-items: center; justify-content: center; gap: 5px; }
.curriculum-tags { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px 28px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.curriculum-label { font-size: 13px; color: #94a3b8; font-weight: 600; flex-shrink: 0; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); color: #a78bfa; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 100px; }

/* PERSONAS */
.personas-section { background: #060614; }
.personas-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
.persona-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px 18px; text-align: center; transition: transform 0.25s, border-color 0.25s; }
.persona-card:hover { transform: translateY(-4px); border-color: rgba(167,139,250,0.2); }
.persona-icon { font-size: 36px; margin-bottom: 12px; }
.persona-role { font-size: 14px; font-weight: 700; color: #e2e8f0; margin-bottom: 8px; }
.persona-desc { font-size: 12px; color: #475569; line-height: 1.6; }

/* COMPARISON */
.comparison-section { background: linear-gradient(180deg, #07071a 0%, #060614 100%); }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
.diff-list { display: flex; flex-direction: column; gap: 16px; }
.diff-item { display: flex; gap: 14px; align-items: flex-start; }
.diff-check { color: #10b981; font-size: 16px; flex-shrink: 0; margin-top: 2px; }
.diff-item strong { color: #e2e8f0; font-weight: 700; }
.diff-item div { font-size: 14px; color: #64748b; line-height: 1.6; }
.comparison-table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; }
.ct-title { font-size: 15px; font-weight: 700; color: #e2e8f0; padding: 20px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.comparison-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.comparison-table th { padding: 12px 20px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; background: rgba(255,255,255,0.02); }
.th-us { color: #a78bfa !important; text-align: center !important; }
.comparison-table td { padding: 11px 20px; border-top: 1px solid rgba(255,255,255,0.04); color: #94a3b8; }
.td-us { text-align: center; font-size: 16px; }
.td-other { text-align: center; font-size: 16px; filter: opacity(0.7); }

/* PRICING */
.pricing-section { background: #060614; }
.pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px; }
.price-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px 28px; display: flex; flex-direction: column; transition: transform 0.25s; }
.price-card.featured { background: rgba(124,58,237,0.08); border-color: rgba(124,58,237,0.4); transform: scale(1.03); box-shadow: 0 0 60px rgba(124,58,237,0.15); }
.price-card:hover { transform: translateY(-4px); }
.price-card.featured:hover { transform: scale(1.03) translateY(-4px); }
.price-badge-wrap { margin-bottom: 16px; }
.price-badge-tier { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; background: rgba(255,255,255,0.06); padding: 5px 12px; border-radius: 100px; }
.featured-badge { color: #a78bfa !important; background: rgba(124,58,237,0.2) !important; }
.price-target { font-size: 14px; color: #64748b; font-weight: 500; margin-bottom: 8px; }
.price-amount { font-size: 30px; font-weight: 900; color: #fff; letter-spacing: -1px; margin-bottom: 4px; }
.price-amount span { font-size: 14px; font-weight: 500; color: #64748b; letter-spacing: 0; }
.price-note { font-size: 12px; color: #475569; margin-bottom: 24px; }
.price-features { list-style: none; display: flex; flex-direction: column; gap: 10px; flex: 1; margin-bottom: 28px; }
.price-features li { font-size: 13.5px; color: #94a3b8; line-height: 1.5; }
.btn-price-primary { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px; border-radius: 10px; text-align: center; display: block; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 0 30px rgba(124,58,237,0.3); }
.btn-price-primary:hover { opacity: 0.9; transform: scale(1.02); }
.btn-price-outline { border: 1px solid rgba(255,255,255,0.15); color: #e2e8f0; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px; border-radius: 10px; text-align: center; display: block; transition: border-color 0.2s, background 0.2s; }
.btn-price-outline:hover { border-color: rgba(167,139,250,0.4); background: rgba(167,139,250,0.05); }
.pricing-note { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; font-size: 13px; color: #475569; text-align: center; }

/* TESTIMONIALS */
.testimonials-section { background: #07071a; }
.testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.testi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 28px; display: flex; flex-direction: column; gap: 20px; transition: transform 0.25s, border-color 0.25s; }
.testi-card:hover { transform: translateY(-4px); border-color: rgba(167,139,250,0.2); }
.testi-quote { font-size: 14px; line-height: 1.75; color: #94a3b8; font-style: italic; flex: 1; }
.testi-author { display: flex; align-items: center; gap: 12px; }
.testi-avatar { font-size: 28px; width: 44px; height: 44px; background: rgba(124,58,237,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.testi-name { font-size: 14px; font-weight: 700; color: #e2e8f0; }
.testi-school { font-size: 12px; color: #475569; }

/* FINAL CTA */
.cta-final { position: relative; padding: 100px 24px; overflow: hidden; text-align: center; background: linear-gradient(135deg, #0f0a2e 0%, #070714 50%, #0a1628 100%); }
.cta-orb-1, .cta-orb-2 { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; pointer-events: none; }
.cta-orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #7c3aed, transparent 70%); top: -150px; left: -100px; }
.cta-orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #1d4ed8, transparent 70%); bottom: -100px; right: -50px; }
.cta-content { position: relative; z-index: 1; }
.cta-badge { display: inline-block; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.4); color: #a78bfa; font-size: 11px; font-weight: 700; padding: 6px 16px; border-radius: 100px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px; }
.cta-title { font-size: clamp(30px, 5vw, 58px); font-weight: 900; letter-spacing: -2px; color: #fff; line-height: 1.1; margin-bottom: 20px; }
.cta-sub { font-size: 17px; color: #64748b; max-width: 560px; margin: 0 auto 36px; line-height: 1.7; }
.cta-actions { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
.btn-cta-primary { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; text-decoration: none; font-size: 17px; font-weight: 700; padding: 16px 36px; border-radius: 12px; box-shadow: 0 0 50px rgba(124,58,237,0.5); transition: transform 0.2s, box-shadow 0.2s; }
.btn-cta-primary:hover { transform: translateY(-3px); box-shadow: 0 0 80px rgba(124,58,237,0.7); }
.btn-cta-wa { background: rgba(22,163,74,0.15); border: 1px solid rgba(22,163,74,0.4); color: #4ade80; text-decoration: none; font-size: 17px; font-weight: 700; padding: 16px 36px; border-radius: 12px; display: flex; align-items: center; gap: 10px; transition: background 0.2s, transform 0.2s; }
.btn-cta-wa:hover { background: rgba(22,163,74,0.25); transform: translateY(-3px); }
.cta-guarantees { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; font-size: 13px; color: #475569; }

/* FOOTER */
.footer { background: #04040f; border-top: 1px solid rgba(255,255,255,0.05); padding: 60px 24px 0; }
.footer-inner { display: grid; grid-template-columns: 1.5fr 1fr; gap: 60px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.footer-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.footer-logo-icon { font-size: 24px; background: linear-gradient(135deg, #7c3aed, #4f46e5); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.footer-logo-name { font-size: 18px; font-weight: 800; color: #fff; }
.footer-logo-tag { font-size: 10px; color: #f59e0b; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.footer-desc { font-size: 14px; color: #475569; line-height: 1.7; max-width: 360px; }
.footer-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.footer-col h4 { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
.footer-col a { display: block; font-size: 14px; color: #475569; text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
.footer-col a:hover { color: #94a3b8; }
.footer-bottom { border-top: 1px solid rgba(255,255,255,0.04); }
.footer-bottom-inner { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; font-size: 13px; color: #334155; max-width: 1200px; margin: 0 auto; }

/* RESPONSIVE */
@media (max-width: 1024px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .levels-grid { grid-template-columns: repeat(2, 1fr); }
  .pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; }
  .price-card.featured { transform: none; }
  .price-card.featured:hover { transform: translateY(-4px); }
  .two-col { grid-template-columns: 1fr; }
  .personas-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .nav-links, .nav-cta { display: none; }
  .mobile-menu-btn { display: flex; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .steps { flex-direction: column; }
  .step-arrow { display: none; }
  .personas-grid { grid-template-columns: repeat(2, 1fr); }
  .testimonials-grid { grid-template-columns: 1fr; }
  .footer-inner { grid-template-columns: 1fr; gap: 40px; }
  .footer-links { grid-template-columns: 1fr 1fr; }
  .footer-bottom-inner { flex-direction: column; gap: 8px; text-align: center; }
  .preview-cards { grid-template-columns: repeat(2, 1fr); }
  .preview-sidebar { display: none; }
  .hero-title { letter-spacing: -1px; }
  .cta-actions { flex-direction: column; align-items: center; }
}
@media (max-width: 480px) {
  .features-grid { grid-template-columns: 1fr; }
  .levels-grid { grid-template-columns: 1fr; }
  .personas-grid { grid-template-columns: 1fr; }
  .pricing-note { flex-direction: column; gap: 8px; }
  .hero-trust { flex-direction: column; gap: 8px; }
  .curriculum-tags { flex-direction: column; align-items: flex-start; }
}
</style>
