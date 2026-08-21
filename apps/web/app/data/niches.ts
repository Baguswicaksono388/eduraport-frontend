export interface NicheFeature {
  icon: string
  title: string
  desc: string
}

export interface NicheData {
  slug: string
  name: string
  seoTitle: string
  metaDescription: string
  badge: string
  h1: string
  h1Highlight: string
  intro: string
  painPoints: string[]
  features: NicheFeature[]
  ctaText: string
  faq: { q: string; a: string }[]
}

export const niches: NicheData[] = [
  {
    slug: 'pesantren',
    name: 'Pondok Pesantren',
    seoTitle: 'Sistem E-Raport Pondok Pesantren & Madrasah — EduRaport Indonesia',
    metaDescription: 'Sistem raport digital khusus pondok pesantren. Dukung nilai Jayyid/Maqbul, tahfidz, kitab, dan mapel kepondokan. Otomatis patuh Kurikulum Merdeka 2025. SPP asrama terintegrasi. Coba demo gratis.',
    badge: '🕌 Solusi untuk Pondok Pesantren & Madrasah',
    h1: 'Sistem Raport Digital yang Mengerti',
    h1Highlight: 'Kurikulum Pondok Pesantren',
    intro: 'E-Rapor dari pemerintah tidak mengenal nilai "Jayyid", tidak bisa menampilkan hafalan tahfidz, dan tidak memahami struktur mata pelajaran kepondokan. EduRaport dirancang agar pesantren tidak perlu memilih antara patuh aturan dinas atau mengakomodasi kurikulum internal pondok. Anda bisa memiliki keduanya.',
    painPoints: [
      'E-Rapor dinas tidak bisa mengakomodasi skala nilai Jayyid/Maqbul/Mumtaz',
      'Hasil hafalan tahfidz tidak bisa dicatat di sistem resmi pemerintah',
      'SPP asrama, makan, dan biaya pondok susah direkap secara terpadu',
      'Data santri sering terputus saat naik dari jenjang Tsanawiyah ke Aliyah',
    ],
    features: [
      { icon: '📜', title: 'Skala Nilai Kustom (Jayyid/Maqbul)', desc: 'Template raport pesantren bisa menggunakan skala nilai Arab, huruf, atau angka sesuai kebijakan pondok. Tidak perlu kompromi dengan format baku pemerintah.' },
      { icon: '🕌', title: 'Modul Tahfidz & Kitab', desc: 'Catat progres hafalan (Juz ke-berapa) dan nilai kitab per santri secara terstruktur. Bisa dimasukkan ke raport berdampingan dengan nilai Kurikulum Merdeka.' },
      { icon: '💰', title: 'SPP Asrama + Komponen Biaya Pondok', desc: 'Tagihan bulanan bisa dipisah per komponen: SPP, uang makan, laundry, biaya kamar. Pengingat otomatis dikirim ke WA wali santri.' },
      { icon: '🔗', title: 'Identitas Santri Lintas Jenjang', desc: 'Santri yang naik dari MTs ke MA tidak perlu input ulang data. Riwayat akademik dan piutang pondok tetap tersambung secara otomatis.' },
      { icon: '✅', title: 'Patuh Kurikulum Merdeka 2025', desc: 'AI Guardrail otomatis memblokir pembuatan tes tulis untuk santri jenjang Fase A (setara Kelas 1-2), memastikan pesantren tetap patuh regulasi terbaru.' },
      { icon: '📲', title: 'WA Gateway ke Wali Santri', desc: 'Nilai raport, bukti bayar, dan pengumuman dikirim otomatis ke WA wali. Komunikasi pondok terasa profesional dan proaktif.' },
    ],
    ctaText: 'Jadwalkan Demo untuk Pesantren Anda',
    faq: [
      { q: 'Apakah EduRaport bisa digunakan di pesantren yang juga punya sekolah formal (MTs/MA)?', a: 'Ya. EduRaport mendukung kombinasi kurikulum pondok (nilai Jayyid, tahfidz) dengan kurikulum Kemendikbud (Kurikulum Merdeka) dalam satu template raport yang terintegrasi.' },
      { q: 'Bagaimana cara input nilai hafalan santri?', a: 'Modul Gradebook Engine mendukung komponen nilai kustom. Admin pesantren bisa menambahkan komponen "Tahfidz (Juz)", "Kitab Dasar", atau komponen lain dengan bobot yang bisa diatur sesuai kebijakan pondok.' },
      { q: 'Apakah sistem bisa menangani biaya asrama yang berbeda per kamar/kelas?', a: 'Ya. Modul keuangan mendukung template tagihan per kategori (kamar, kelas, program). Masing-masing santri bisa memiliki tagihan yang berbeda sesuai paket yang diambil.' },
    ],
  },
  {
    slug: 'tk-paud',
    name: 'TK & PAUD',
    seoTitle: 'Aplikasi Raport Narasi TK & PAUD — EduRaport Indonesia',
    metaDescription: 'Aplikasi raport TK dan PAUD dengan narasi deskriptif otomatis. Dukung skala BB/MB/BSH/BSB, Capaian Perkembangan, dan Profil Anak. Patuh Kurikulum Merdeka 2025. Coba gratis.',
    badge: '🌱 Solusi Khusus TK, KB & PAUD',
    h1: 'Raport TK & PAUD yang',
    h1Highlight: 'Otomatis Tulis Narasi untuk Guru',
    intro: 'Guru TK dan PAUD menghabiskan berjam-jam setiap semester hanya untuk menulis narasi deskriptif yang personal untuk setiap anak. EduRaport memiliki Visual Template Builder dan AI Narasi yang dirancang khusus untuk jenjang ini—guru cukup memilih capaian, sistem yang menuliskan kalimatnya.',
    painPoints: [
      'Menulis narasi raport untuk 20-30 anak per semester memakan waktu berhari-hari',
      'Format rapot TK/PAUD tidak bisa menggunakan aplikasi raport SD/SMP biasa',
      'Asesmen observasi harian susah direkap menjadi laporan yang rapi',
      'Orang tua ingin tahu perkembangan anak lebih sering dari sekedar akhir semester',
    ],
    features: [
      { icon: '✍️', title: 'AI Narasi Otomatis', desc: 'Pilih capaian per elemen (Nilai Agama, Motorik, Kognitif, Sosial-Emosional, Bahasa, Seni). AI otomatis menyusun kalimat narasi yang natural dan personal untuk setiap anak.' },
      { icon: '🎨', title: 'Template Raport Visual Drag-and-Drop', desc: 'Desain tata letak raport TK sesuai identitas sekolah. Tambahkan foto anak, logo sekolah, dan komponen kustom dengan mudah—tanpa coding.' },
      { icon: '🛡️', title: 'AI Hard Guardrail PPA 2025', desc: 'Guru tidak bisa membuat tes kognitif tertulis untuk anak Fase A. Sistem otomatis memblokir dan mengarahkan ke instrumen asesmen alternatif (Observasi, Anekdot, Ceklis).' },
      { icon: '📊', title: 'Skala BB/MB/BSH/BSB', desc: 'Sistem mendukung skala perkembangan standar PAUD lengkap: Belum Berkembang, Mulai Berkembang, Berkembang Sesuai Harapan, dan Berkembang Sangat Baik.' },
      { icon: '📲', title: 'Laporan Perkembangan ke WA Orang Tua', desc: 'Orang tua menerima notifikasi WA saat raport siap. Portal orang tua memungkinkan mereka memantau perkembangan anak kapan saja dari HP.' },
      { icon: '❤️', title: 'Mood Check-in Harian', desc: 'Saat anak scan QR absensi pagi, mereka memilih emoji emosi. Guru mendapat data kesejahteraan emosional kelas secara real-time untuk intervensi lebih awal.' },
    ],
    ctaText: 'Demo Gratis untuk TK/PAUD Anda',
    faq: [
      { q: 'Apakah EduRaport mendukung format raport PAUD yang memiliki banyak elemen observasi?', a: 'Ya. Visual Template Builder mendukung hingga puluhan komponen elemen perkembangan. Guru bisa mengatur tampilan, urutan, dan narasi otomatis per elemen sesuai standar PAUD.' },
      { q: 'Bagaimana guru memasukkan observasi harian ke dalam sistem?', a: 'EduRaport menyediakan fitur Catatan Anekdot dan Ceklis Observasi digital yang bisa diisi dari HP. Data ini otomatis terakumulasi dan menjadi bahan narasi raport akhir semester.' },
      { q: 'Apakah orang tua bisa melihat raport dari HP?', a: 'Ya. Raport digital TK bisa dibagikan via link atau diunduh sebagai PDF langsung dari notifikasi WhatsApp yang dikirim otomatis oleh sistem.' },
    ],
  },
  {
    slug: 'yayasan-multi-unit',
    name: 'Yayasan Multi-Unit',
    seoTitle: 'Sistem Manajemen Yayasan Pendidikan Multi-Unit — EduRaport Indonesia',
    metaDescription: 'Platform ERP untuk yayasan pendidikan yang mengelola TK, SD, SMP, dan SMA dalam satu layar. Konsolidasi data siswa, keuangan, dan rapor lintas jenjang. Identitas siswa persisten dari TK sampai SMA.',
    badge: '🏛️ Solusi untuk Yayasan Multi-Unit',
    h1: 'Satu Layar untuk',
    h1Highlight: 'Seluruh Unit Sekolah Yayasan',
    intro: 'Mengawasi TK, SD, SMP, dan SMA yang berbeda gedung—dengan data yang terpisah-pisah di masing-masing unit—adalah mimpi buruk bagi pengurus yayasan. EduRaport menghadirkan Workspace Yayasan: satu dashboard eksekutif yang menyatukan semua data akademik dan keuangan seluruh unit sekolah dalam satu layar.',
    painPoints: [
      'Data keuangan setiap unit sekolah terpisah, rekap konsolidasi butuh waktu berhari-hari',
      'Siswa yang naik dari SD ke SMP di yayasan yang sama harus input ulang data dari awal',
      'Tidak ada cara mudah untuk membandingkan kinerja antar-unit sekolah',
      'Guru yang mengajar di 2 unit sekolah punya akun terpisah yang membingungkan',
    ],
    features: [
      { icon: '🔗', title: 'Identitas Siswa Tunggal (TK → SMA)', desc: 'Tabel foundation_persons menyatukan identitas siswa lintas jenjang. Siswa naik jenjang tidak perlu cetak kartu baru atau input data ulang. Hemat biaya operasional (OpEx) yayasan secara signifikan.' },
      { icon: '📊', title: 'Executive Dashboard Konsolidasi', desc: 'Pantau kehadiran siswa, koleksi SPP, dan kesiapan raport seluruh unit dalam satu layar. Pimpinan yayasan menerima ringkasan harian via WhatsApp pukul 06.00 pagi.' },
      { icon: '💰', title: 'Laporan Keuangan Konsolidasi Yayasan', desc: 'Dashboard piutang global menampilkan status tunggakan SPP di semua unit. Cash flow predictability via pengelompokan usia piutang (≤30, 31-90, >90 hari).' },
      { icon: '👥', title: 'Single Sign-On Guru Multi-Unit', desc: 'Guru yang mengajar di SD dan SMP sekarang hanya butuh satu akun. User School Assignments memungkinkan satu identitas mengelola banyak unit.' },
      { icon: '📈', title: 'Perbandingan Kinerja Antar-Unit', desc: 'Bandingkan tingkat kehadiran, kesiapan raport, dan koleksi SPP antar unit sekolah. Identifikasi unit yang butuh perhatian lebih cepat.' },
      { icon: '🏫', title: 'PPDB Terintegrasi Lintas Jenjang', desc: 'Calon siswa yang mendaftar via PPDB langsung terhubung ke sistem akademik dan keuangan. Data tidak perlu diinput ulang saat diterima.' },
    ],
    ctaText: 'Demo Workspace Yayasan Sekarang',
    faq: [
      { q: 'Berapa banyak unit sekolah yang bisa dikelola dalam satu Workspace Yayasan?', a: 'EduRaport mendukung multi-unit tanpa batasan jumlah. Paket Yayasan dirancang untuk mengelola dari 2 hingga belasan unit sekolah dalam satu ekosistem terpadu.' },
      { q: 'Bagaimana data keuangan dikonsolidasi antar-unit?', a: 'Setiap unit memiliki buku kas mandiri. Namun dashboard Yayasan secara otomatis mengkonsolidasi seluruh data piutang, koleksi SPP, dan saldo aktif dalam satu tampilan ringkasan.' },
      { q: 'Apakah kepala sekolah per unit bisa melihat data unit lain?', a: 'Tidak. Hak akses dikontrol per peran. Kepala Sekolah hanya melihat unitnya sendiri. Pengurus Yayasan memiliki akses dashboard konsolidasi lintas seluruh unit.' },
    ],
  },
  {
    slug: 'kurikulum-merdeka',
    name: 'Kurikulum Merdeka',
    seoTitle: 'Sistem E-Raport Kurikulum Merdeka 2025 untuk Sekolah Swasta — EduRaport',
    metaDescription: 'Sistem e-raport yang sepenuhnya mendukung Kurikulum Merdeka 2024-2025. Patuh regulasi PPA 2025 otomatis, deskripsi narasi P5, KKTP, dan AI Asisten Guru. Untuk TK hingga SMA.',
    badge: '📚 Solusi Kurikulum Merdeka 2025',
    h1: 'E-Raport Kurikulum Merdeka yang',
    h1Highlight: 'Patuh Regulasi 2025 Secara Otomatis',
    intro: 'Kurikulum Merdeka terus berkembang, dan regulasi PPA 2025 membawa aturan baru yang wajib dipatuhi sekolah—termasuk larangan tes kognitif tertulis untuk Fase A (PAUD/SD Kelas 1-2). EduRaport adalah satu-satunya platform yang menerapkan aturan ini sebagai *hard guardrail* otomatis: guru tidak bisa membuat tes tertulis untuk Fase A, sistem langsung mengarahkan ke asesmen alternatif yang sesuai regulasi.',
    painPoints: [
      'Regulasi Kurikulum Merdeka berubah, guru tidak selalu tahu aturan terbaru',
      'Format raport naratif membutuhkan banyak waktu untuk ditulis secara manual',
      'Instrumen KKTP (Kriteria Ketercapaian Tujuan Pembelajaran) susah diintegrasikan ke raport',
      'P5 (Projek Penguatan Profil Pelajar Pancasila) membutuhkan format penilaian khusus',
    ],
    features: [
      { icon: '🛡️', title: 'AI Hard Guardrail Regulasi PPA 2025', desc: 'Sistem otomatis memblokir pembuatan tes kognitif tertulis untuk PAUD dan Fase A (SD Kelas 1-2). Error HTTP 422 dengan notifikasi yang jelas dan pengalihan ke asesmen alternatif yang tepat.' },
      { icon: '📋', title: 'Instrumen KKTP Terintegrasi', desc: 'Kriteria Ketercapaian Tujuan Pembelajaran bisa dikonfigurasi per mapel dan diintegrasikan langsung ke template raport. Tidak perlu dokumen terpisah.' },
      { icon: '🌱', title: 'Penilaian P5 Terstruktur', desc: 'Modul P5 mendukung input capaian per dimensi Profil Pelajar Pancasila dengan deskripsi narasi otomatis. Format raport P5 sesuai panduan resmi Kemdikbud.' },
      { icon: '✨', title: 'AI Asisten Guru (Kurikulum Merdeka)', desc: 'Generate Modul Ajar, Soal Evaluasi, dan Bahan Ajar dengan konteks CP/TP yang otomatis diambil dari sistem. Guru tidak perlu mengetik ulang konteks kurikulum setiap kali.' },
      { icon: '📝', title: 'Narasi Otomatis per Capaian', desc: 'AI menyusun kalimat narasi raport yang personal untuk setiap siswa berdasarkan capaian yang dipilih guru—menghemat jam kerja di akhir semester.' },
      { icon: '📊', title: 'Multi-Skala Penilaian', desc: 'Dukung skala nilai Kurikulum Merdeka (angka 0-100, predikat A/B/C/D, atau deskripsi Mulai Berkembang/Berkembang/Mahir) dalam satu sistem terpadu.' },
    ],
    ctaText: 'Coba Demo E-Raport Kurikulum Merdeka',
    faq: [
      { q: 'Apakah EduRaport otomatis diperbarui setiap kali regulasi Kurikulum Merdeka berubah?', a: 'Ya. Tim EduRaport memantau pembaruan regulasi dari Kemdikbud. Setiap perubahan regulasi yang berdampak pada sistem (seperti guardrail tes tertulis Fase A) diperbarui otomatis tanpa sekolah perlu mengkonfigurasi ulang.' },
      { q: 'Apakah raport EduRaport bisa diterima oleh pihak dinas sebagai bukti laporan akademik?', a: 'Ya. Raport EduRaport bisa dicetak sebagai PDF berformat resmi yang mengikuti panduan Kemdikbud. Sekolah tetap bisa menggunakan e-Rapor dinas untuk pelaporan Dapodik jika diperlukan.' },
      { q: 'Bagaimana cara guru memasukkan nilai P5 yang berbasis proyek?', a: 'Modul P5 menyediakan form terstruktur per fase proyek. Guru menilai capaian per dimensi Profil Pelajar Pancasila. Sistem otomatis mengkonversi ke format narasi raport P5 yang sesuai panduan resmi.' },
    ],
  },
]
