/**
 * useSchoolLevel
 *
 * Helper composable untuk mendeteksi jenjang sekolah.
 *
 * Di Indonesia, semua satuan PAUD (TK, RA, KB, TPA, SPS) menggunakan sistem
 * penilaian yang sama: predikat BB/MB/BSH/BSB + narasi deskriptif, sesuai
 * Kurikulum Merdeka Fase Fondasi (Permendikbud No. 262/M/2022).
 */

// Semua satuan PAUD formal dan non-formal di Indonesia
// Referensi: UU No. 20 Tahun 2003 pasal 28, Permendikbud No. 137 Tahun 2014
const EARLY_CHILDHOOD_KEYWORDS = [
  'TK',   // Taman Kanak-Kanak (formal, Kemdikbud)
  'RA',   // Raudhatul Athfal (formal setara TK, Kemenag)
  'KB',   // Kelompok Bermain (non-formal, usia 2-4 th)
  'TPA',  // Taman Penitipan Anak (non-formal, 0-6 th)
  'SPS',  // Satuan PAUD Sejenis (non-formal, seperti Posyandu+PAUD)
  'PAUD', // Label umum/gabungan
]

/**
 * Memeriksa apakah sebuah level sekolah termasuk satuan PAUD.
 * Pengecekan dilakukan secara case-insensitive dan berbasis kata kunci
 * untuk mengakomodasi variasi seperti "TK A", "TK B", "RA Al-Hikmah", dll.
 */
export const isEarlyChildhood = (level?: string | null): boolean => {
  if (!level) return false
  const normalized = level.trim().toUpperCase()
  return EARLY_CHILDHOOD_KEYWORDS.some(keyword => {
    return (
      normalized === keyword ||
      normalized.startsWith(keyword + ' ') ||
      normalized.startsWith(keyword + '-') ||
      normalized.includes(' ' + keyword)
    )
  })
}

/**
 * Composable untuk mendapatkan info level sekolah yang dipilih saat ini.
 * Digunakan bersama useSchoolContext().
 */
export const useSchoolLevel = () => {
  const { schools, selectedSchoolId } = useSchoolContext()

  const selectedSchool = computed(() =>
    schools.value.find((s: any) => s.id === selectedSchoolId.value)
  )

  const schoolLevel = computed(() => (selectedSchool.value as any)?.level || '')

  /** True untuk semua satuan PAUD: TK, RA, KB, TPA, SPS */
  const isEarlyChildhoodSchool = computed(() =>
    isEarlyChildhood(schoolLevel.value)
  )

  const isSdLevel = computed(() => {
    const level = schoolLevel.value.toUpperCase()
    return level.includes('SD') || level.includes('MI')
  })

  const isSmpLevel = computed(() => {
    const level = schoolLevel.value.toUpperCase()
    return level.includes('SMP') || level.includes('MTS')
  })

  const isSmaLevel = computed(() => {
    const level = schoolLevel.value.toUpperCase()
    return level.includes('SMA') || level.includes('SMK') || level.includes('MA')
  })

  return {
    selectedSchool,
    schoolLevel,
    isEarlyChildhoodSchool,
    isSdLevel,
    isSmpLevel,
    isSmaLevel,
  }
}
