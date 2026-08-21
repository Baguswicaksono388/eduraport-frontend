export interface CompetitorFeature {
  feature: string
  eduraport: boolean | string
  competitor: boolean | string
}

export interface CompetitorData {
  slug: string
  name: string
  tagline: string
  priceLabel: string
  targetAudience: string
  weakness: string
  seoTitle: string
  metaDescription: string
  h1: string
  intro: string
  features: CompetitorFeature[]
  verdict: string
  faq: { q: string; a: string }[]
}

export const competitors: CompetitorData[] = [
  {
    slug: 'e-rapor-kemendikbud',
    name: 'e-Rapor Kemendikbud',
    tagline: 'Aplikasi raport resmi dari pemerintah',
    priceLabel: 'Gratis',
    targetAudience: 'Semua sekolah negeri & swasta',
    weakness: 'Administratif-pasif, tidak ada modul keuangan, kaku, tidak bisa dimodifikasi',
    seoTitle: 'EduRaport vs e-Rapor Kemendikbud — Mana yang Lebih Lengkap untuk Sekolah Swasta?',
    metaDescription: 'Perbandingan mendalam EduRaport vs e-Rapor Kemendikbud 2025. EduRaport menyatukan raport, SPP, absensi, dan keuangan yayasan dalam satu platform. e-Rapor gratis tapi terbatas pada pencetakan rapor saja.',
    h1: 'EduRaport vs e-Rapor Kemendikbud: Lebih dari Sekadar Cetak Nilai',
    intro: 'e-Rapor dari Kemdikbud memang gratis dan wajib terintegrasi dengan Dapodik. Namun, bagi sekolah swasta yang ingin mengelola SPP, memantau emosi siswa, atau mendapatkan laporan harian via WhatsApp—e-Rapor pemerintah tidak menyediakan satu pun fitur tersebut. EduRaport dibangun untuk mengisi kesenjangan ini: patuh pada regulasi PPA 2025, sekaligus menjadi infrastruktur manajemen strategis yang sesungguhnya.',
    features: [
      { feature: 'E-Rapor (Kurikulum Merdeka)', eduraport: true, competitor: true },
      { feature: 'Kepatuhan Regulasi PPA 2025 (AI Guardrail)', eduraport: '✅ Otomatis, ada hard-block tes tulis PAUD', competitor: '⚠️ Manual, tidak ada guardrail' },
      { feature: 'Template Raport Kustom (Pesantren/Internasional)', eduraport: true, competitor: false },
      { feature: 'Modul Keuangan & Tagihan SPP', eduraport: true, competitor: false },
      { feature: 'Notifikasi WhatsApp ke Orang Tua', eduraport: true, competitor: false },
      { feature: 'Executive Dashboard Harian (Jam 6 Pagi)', eduraport: true, competitor: false },
      { feature: 'Absensi QR + Mood Check-in Siswa', eduraport: true, competitor: false },
      { feature: 'Multi-Unit Yayasan (Satu Identitas TK-SMA)', eduraport: true, competitor: false },
      { feature: 'Biaya Langganan', eduraport: 'Rp 500.000/bulan', competitor: 'Gratis' },
    ],
    verdict: 'Jika sekolah Anda hanya butuh pencetakan rapor standar dan sudah memiliki sistem SPP terpisah, e-Rapor Kemendikbud sudah cukup. Namun, jika Anda ingin memantau kondisi keuangan yayasan, mencegah siswa pindah lebih awal, dan memberi orang tua notifikasi real-time—EduRaport adalah satu-satunya pilihan yang mengintegrasikan semua kebutuhan tersebut.',
    faq: [
      { q: 'Apakah EduRaport bisa digunakan bersamaan dengan e-Rapor Kemendikbud?', a: 'Ya. EduRaport menyimpan data raport secara internal dan bisa diekspor. Untuk sinkronisasi Dapodik, sekolah tetap bisa menggunakan e-Rapor Kemendikbud sebagai jembatan pelaporan ke pemerintah.' },
      { q: 'Apakah EduRaport mendukung format Kurikulum Merdeka 2024?', a: 'Ya, EduRaport sepenuhnya mendukung Kurikulum Merdeka termasuk narasi deskriptif, P5, dan secara otomatis mematuhi regulasi PPA 2025 dengan fitur AI Guardrail yang memblokir pembuatan tes kognitif untuk PAUD/Fase A.' },
      { q: 'Kenapa harus bayar kalau ada yang gratis?', a: 'e-Rapor gratis hanya menyelesaikan 10% masalah sekolah swasta (pencetakan rapor). EduRaport menyelesaikan 90% sisanya: manajemen SPP, keuangan yayasan, komunikasi orang tua, absensi digital, dan deteksi dini churn siswa—semuanya dalam satu sistem.' },
    ],
  },
  {
    slug: 'adminsekolah',
    name: 'AdminSekolah.net',
    tagline: 'Aplikasi administrasi sekolah berbasis web',
    priceLabel: 'Rp 300.000 – Rp 500.000/bulan',
    targetAudience: 'Sekolah dengan kebutuhan administrasi & keuangan dasar',
    weakness: 'Tidak ada AI Asisten Guru, tidak ada Mood Check-in, tidak ada integrasi Yayasan persisten',
    seoTitle: 'EduRaport vs AdminSekolah.net — Perbandingan Lengkap untuk Sekolah Swasta 2025',
    metaDescription: 'Bandingkan EduRaport dengan AdminSekolah.net. EduRaport unggul di AI Asisten Guru, Mood Check-in Siswa, integrasi Yayasan multi-unit, dan Executive Dashboard harian via WA. Harga bersaing mulai Rp 500.000/bulan.',
    h1: 'EduRaport vs AdminSekolah.net: Mana yang Lebih Cerdas untuk Sekolah Swasta?',
    intro: 'AdminSekolah.net adalah pilihan solid untuk sekolah yang baru mulai digitalisasi. Namun, saat sekolah Anda berkembang—dan Anda membutuhkan AI Asisten Guru, deteksi dini kelas kosong, atau dashboard yayasan lintas jenjang—AdminSekolah.net belum menyediakan itu. EduRaport dirancang sebagai Smart School ERP yang tidak hanya mengelola data, tetapi secara proaktif membantu pimpinan sekolah mengambil keputusan strategis.',
    features: [
      { feature: 'E-Raport Digital', eduraport: true, competitor: true },
      { feature: 'Manajemen SPP & Keuangan', eduraport: true, competitor: true },
      { feature: 'Notifikasi WhatsApp ke Orang Tua', eduraport: true, competitor: true },
      { feature: 'AI Asisten Guru (Generate RPP/Soal)', eduraport: true, competitor: false },
      { feature: 'Kepatuhan PPA 2025 (AI Hard Guardrail)', eduraport: true, competitor: false },
      { feature: 'Absensi QR + Mood Check-in Emosi Siswa', eduraport: true, competitor: false },
      { feature: 'Executive Dashboard (WA Digest Jam 6)', eduraport: true, competitor: false },
      { feature: 'Vacancy Detection (Deteksi Kelas Kosong)', eduraport: true, competitor: false },
      { feature: 'Multi-Unit Yayasan (Identitas Siswa Lintas Jenjang)', eduraport: true, competitor: false },
      { feature: 'Harga Mulai', eduraport: 'Rp 500.000/bulan', competitor: 'Rp 300.000/bulan' },
    ],
    verdict: 'AdminSekolah.net adalah titik awal yang baik untuk digitalisasi dasar. EduRaport cocok untuk sekolah yang sudah siap naik kelas: butuh AI yang membantu guru, sistem yang mencegah siswa pindah sekolah, dan pimpinan yang ingin "tahu kondisi sekolah" bahkan sebelum sampai di kantor.',
    faq: [
      { q: 'Apakah migrasi dari AdminSekolah.net ke EduRaport sulit?', a: 'Tim EduRaport menyediakan pendampingan migrasi data lengkap, termasuk import data siswa dan riwayat SPP. Proses setup rata-rata kurang dari 7 hari kerja.' },
      { q: 'Apakah EduRaport lebih mahal dari AdminSekolah.net?', a: 'Harga EduRaport sebanding atau lebih efisien jika dihitung dari nilai yang didapat: AI Asisten Guru saja menghemat jam kerja guru yang setara dengan nilai berlipat ganda. Bandingkan bukan dari harga, tapi dari ROI (Return on Investment) untuk operasional sekolah.' },
    ],
  },
  {
    slug: 'skoola',
    name: 'Skoola',
    tagline: 'Sistem informasi sekolah berbasis cloud',
    priceLabel: 'Mulai Rp 1.499.000/bulan',
    targetAudience: 'Sekolah menengah hingga besar',
    weakness: 'Harga mahal, tidak ada Mood Check-in, tidak ada AI Guru terintegrasi',
    seoTitle: 'EduRaport vs Skoola — Alternatif Lebih Terjangkau untuk Sekolah Swasta Indonesia',
    metaDescription: 'Perbandingan EduRaport vs Skoola 2025. EduRaport menawarkan fitur lebih lengkap (AI Guru, Mood Check-in, Yayasan Multi-Unit) dengan harga mulai Rp 500.000/bulan—jauh lebih terjangkau dari Skoola.',
    h1: 'EduRaport vs Skoola: Fitur Lebih Lengkap, Harga Lebih Terjangkau',
    intro: 'Skoola adalah platform cloud yang layak untuk sekolah besar. Namun dengan harga mulai dari Rp 1.499.000 per bulan, banyak sekolah swasta kecil dan menengah merasa keberatan. EduRaport hadir sebagai alternatif cerdas: menawarkan fitur strategis seperti AI Asisten Guru, Mood Check-in untuk mencegah churn siswa, dan Workspace Yayasan multi-unit—dengan harga yang jauh lebih dapat dijangkau.',
    features: [
      { feature: 'E-Rapor Digital', eduraport: true, competitor: true },
      { feature: 'Dashboard Real-time untuk Kepala Sekolah', eduraport: true, competitor: true },
      { feature: 'Manajemen SPP / Keuangan', eduraport: true, competitor: true },
      { feature: 'AI Asisten Guru (RPP, Soal, Materi)', eduraport: true, competitor: false },
      { feature: 'Kepatuhan PPA 2025 (Guardrail Otomatis)', eduraport: true, competitor: false },
      { feature: 'Mood Check-in Emosi Siswa (Churn Prevention)', eduraport: true, competitor: false },
      { feature: 'Scheduled WA Digest ke Pimpinan (Jam 6)', eduraport: true, competitor: false },
      { feature: 'Workspace Yayasan (Identitas Lintas Jenjang)', eduraport: true, competitor: false },
      { feature: 'Harga Mulai', eduraport: 'Rp 500.000/bulan', competitor: 'Rp 1.499.000+/bulan' },
    ],
    verdict: 'Jika anggaran adalah pertimbangan, EduRaport jauh lebih hemat (selisih hingga Rp 1.000.000/bulan) dengan fitur yang lebih kaya di sisi AI dan retensi siswa. Untuk yayasan yang mengelola multiple unit, EduRaport adalah satu-satunya yang menyatukan identitas siswa dari TK hingga SMA secara persisten.',
    faq: [
      { q: 'Apakah EduRaport cocok untuk sekolah besar seperti yang pakai Skoola?', a: 'Ya. EduRaport dirancang skalabel untuk sekolah dengan 50 hingga lebih dari 1.500 siswa. Workspace Yayasan v1.6 bahkan mendukung konsolidasi data dari multiple unit sekolah dalam satu dashboard eksekutif.' },
      { q: 'Mengapa EduRaport lebih murah dari Skoola?', a: 'EduRaport membangun teknologinya secara in-house dengan efisiensi tinggi, tanpa overhead distribusi enterprise yang besar. Penghematan biaya operasional diteruskan ke pelanggan agar digitalisasi bisa dijangkau lebih banyak sekolah swasta Indonesia.' },
    ],
  },
  {
    slug: 'simsch',
    name: 'SIMSCH.id',
    tagline: 'Sistem Manajemen Sekolah Terpadu',
    priceLabel: 'Custom / Hubungi penyedia',
    targetAudience: 'Sekolah yang membutuhkan kustomisasi tinggi',
    weakness: 'Harga tidak transparan, tidak ada AI Guru, tidak ada Mood Check-in',
    seoTitle: 'EduRaport vs SIMSCH — Alternatif Transparan dengan Harga Jelas untuk Sekolah Swasta',
    metaDescription: 'Bandingkan EduRaport dengan SIMSCH.id. EduRaport menawarkan harga transparan, AI Asisten Guru, dan fitur Mood Check-in siswa yang tidak dimiliki SIMSCH. Mulai dari Rp 500.000/bulan.',
    h1: 'EduRaport vs SIMSCH.id: Transparansi Harga dan Fitur AI yang Lebih Unggul',
    intro: 'SIMSCH.id tidak mencantumkan harga secara publik, yang bisa menyulitkan sekolah saat merencanakan anggaran tahunan. EduRaport percaya pada transparansi: harga jelas, fitur terbuka untuk dievaluasi sejak demo pertama. Di sisi fitur, EduRaport menyediakan AI Asisten Guru dan Mood Check-in siswa—dua inovasi yang belum dimiliki SIMSCH.',
    features: [
      { feature: 'E-Raport Digital', eduraport: true, competitor: true },
      { feature: 'Manajemen SPP & Keuangan', eduraport: true, competitor: true },
      { feature: 'PPDB Online Terintegrasi', eduraport: true, competitor: true },
      { feature: 'Harga Transparan & Publik', eduraport: '✅ Mulai Rp 500.000/bulan', competitor: '❌ Custom, harus hubungi sales' },
      { feature: 'AI Asisten Guru (Generate RPP/Soal/PPT)', eduraport: true, competitor: false },
      { feature: 'Kepatuhan PPA 2025 (AI Hard Guardrail)', eduraport: true, competitor: false },
      { feature: 'Mood Check-in Emosi Siswa', eduraport: true, competitor: false },
      { feature: 'Workspace Yayasan Multi-Unit Persisten', eduraport: true, competitor: false },
    ],
    verdict: 'Pilih EduRaport jika Anda menginginkan kepastian harga di awal dan fitur AI yang proaktif membantu guru dan pimpinan. Pilih SIMSCH jika kebutuhan Anda sangat spesifik dan bersedia melalui negosiasi panjang dengan tim sales mereka.',
    faq: [
      { q: 'Mengapa harga EduRaport transparan sementara banyak kompetitor tidak?', a: 'EduRaport percaya sekolah harus bisa menghitung ROI sebelum memutuskan berlangganan. Dengan harga publik yang jelas, kepala sekolah dan bendahara dapat merencanakan anggaran digitalisasi tanpa kejutan.' },
      { q: 'Apakah EduRaport bisa dikustomisasi seperti SIMSCH?', a: 'Ya. Visual Template Builder memungkinkan template raport dikustomisasi sepenuhnya—termasuk kurikulum pesantren, internasional, atau yayasan internal—tanpa perlu coding.' },
    ],
  },
]
