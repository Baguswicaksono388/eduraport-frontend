// ============================================
// useAiAsisten — Composable untuk Modul AI Asisten Guru (7.8)
// ============================================

export interface GenerateInput {
  document_type: 'rpp' | 'soal' | 'materi' | 'ppt'
  subject_id: string
  class_id?: string
  learning_outcome_id?: string
  manual_tp?: string
  academic_year_id: string
  semester?: 'ganjil' | 'genap'
  topic: string
  model_pembelajaran: string
  soal_opts?: {
    jumlah_pg: number
    jumlah_esai: number
    level_kognitif: string[]
  }
  materi_opts?: {
    jumlah_sub_bab: number
    with_images: boolean
  }
  ppt_opts?: {
    jumlah_slide: number
    style: 'minimalis' | 'colorful' | 'profesional'
    with_speaker_notes: boolean
    with_images: boolean
  }
}

export interface AiDocument {
  id: string
  school_id: string
  created_by: string
  document_type: 'rpp' | 'soal' | 'materi' | 'ppt'
  title: string
  subject_id: string
  class_id: string | null
  learning_outcome_id: string | null
  manual_tp: string | null
  academic_year_id: string
  semester: string | null
  content: Record<string, any>
  prompt_context: Record<string, any>
  status: 'generating' | 'draft' | 'final' | 'archived'
  current_version: number
  derived_from: string | null
  linked_scheme_id: string | null
  shared_school: boolean
  finalized_at: string | null
  created_at: string
  updated_at: string
  parent_title?: string
}

export interface AiDocumentVersion {
  id: string
  document_id: string
  version_no: number
  content: Record<string, any>
  origin: 'ai' | 'teacher_edited'
  edited_by: string | null
  created_at: string
}

export interface QuotaStatus {
  used: number
  max: number
  remaining: number
  resets_at: string
}

export interface LibraryFilter {
  type?: string
  subject_id?: string
  class_id?: string
  academic_year_id?: string
  q?: string
  page?: number
  limit?: number
  mine?: boolean
}

export const useAiAsisten = (schoolIdRef?: Ref<string>) => {
  const { fetcher } = useApi()
  const { selectedSchoolId } = useSchoolContext()

  const schoolId = computed(() => schoolIdRef ? schoolIdRef.value : selectedSchoolId.value)

  // ─── Context & Quota ─────────────────────────────────────────────────────

  const getContext = async (subjectId: string, classId?: string) => {
    const params = new URLSearchParams({ subject_id: subjectId })
    if (classId) params.append('class_id', classId)
    const res: any = await fetcher(`/school/${schoolId.value}/ai/context?${params}`)
    return res.data
  }

  const getQuota = async (): Promise<QuotaStatus> => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/quota`)
    return res.data
  }

  // ─── Generate ────────────────────────────────────────────────────────────

  const generate = async (input: GenerateInput) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/generate`, {
      method: 'POST',
      body: input,
    })
    return res.data as { document?: AiDocument; job_id?: string; document_id?: string; quota_remaining?: number; message?: string }
  }

  const pollJob = async (jobId: string) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/jobs/${jobId}`)
    return res.data as { status: 'queued' | 'running' | 'succeeded' | 'failed'; document_id?: string; progress?: number; fail_reason?: string }
  }

  // ─── Documents (Bank Materi) ──────────────────────────────────────────────

  const listDocuments = async (filter: LibraryFilter = {}) => {
    const params = new URLSearchParams()
    if (filter.type) params.append('type', filter.type)
    if (filter.subject_id) params.append('subject_id', filter.subject_id)
    if (filter.class_id) params.append('class_id', filter.class_id)
    if (filter.academic_year_id) params.append('academic_year_id', filter.academic_year_id)
    if (filter.q) params.append('q', filter.q)
    if (filter.page) params.append('page', filter.page.toString())
    if (filter.limit) params.append('limit', filter.limit.toString())
    if (filter.mine) params.append('mine', 'true')

    const res: any = await fetcher(`/school/${schoolId.value}/ai/documents?${params}`)
    return res.data as { data: AiDocument[]; pagination: any }
  }

  const getDocument = async (docId: string) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/documents/${docId}`)
    return res.data as AiDocument
  }

  const updateDocument = async (docId: string, content: Record<string, any>, title?: string) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/documents/${docId}`, {
      method: 'PUT',
      body: { content, ...(title ? { title } : {}) },
    })
    return res.data as AiDocumentVersion
  }

  const regenerate = async (docId: string, overrides?: { topic?: string; model_pembelajaran?: string; teacher_feedback?: string }) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/documents/${docId}/regenerate`, {
      method: 'POST',
      body: overrides ?? {},
    })
    return res.data as AiDocument
  }

  const finalizeDocument = async (docId: string) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/documents/${docId}/finalize`, {
      method: 'POST',
    })
    return res.data
  }

  const archiveDocument = async (docId: string) => {
    await fetcher(`/school/${schoolId.value}/ai/documents/${docId}/archive`, {
      method: 'POST',
    })
  }

  const duplicateDocument = async (docId: string, targetClassId: string, targetAcademicYearId?: string) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/documents/${docId}/duplicate`, {
      method: 'POST',
      body: { target_class_id: targetClassId, ...(targetAcademicYearId ? { target_academic_year_id: targetAcademicYearId } : {}) },
    })
    return res.data as AiDocument
  }

  const linkToScheme = async (docId: string, schemeId: string) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/documents/${docId}/link-scheme`, {
      method: 'POST',
      body: { assessment_scheme_id: schemeId },
    })
    return res.data
  }

  const exportDocument = async (docId: string, format: 'pdf' | 'docx' | 'pptx', title: string = 'Dokumen') => {
    // Download via fetcher agar interceptor 401 (refresh token) berjalan, dan blob diconvert ke URL Object
    const res = await fetcher(`/school/${schoolId.value}/ai/documents/${docId}/export?format=${format}`, {
      responseType: 'blob'
    })
    
    if (import.meta.client && res) {
      const url = window.URL.createObjectURL(res as Blob)
      const a = document.createElement('a')
      a.href = url
      // Ganti spasi dengan underscore dan hapus karakter tidak valid
      const safeTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_')
      a.download = `${safeTitle}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
  }

  const listVersions = async (docId: string) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/documents/${docId}/versions`)
    return res.data as AiDocumentVersion[]
  }

  const restoreVersion = async (docId: string, versionNo: number) => {
    const res: any = await fetcher(
      `/school/${schoolId.value}/ai/documents/${docId}/restore/${versionNo}`,
      { method: 'POST' },
    )
    return res.data as AiDocumentVersion
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  const getQuotaPolicy = async () => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/quota-policy`)
    return res.data
  }

  const updateQuotaPolicy = async (policy: any) => {
    const res: any = await fetcher(`/school/${schoolId.value}/ai/quota-policy`, {
      method: 'PUT',
      body: policy,
    })
    return res.data
  }

  return {
    getContext,
    getQuota,
    generate,
    pollJob,
    listDocuments,
    getDocument,
    updateDocument,
    regenerate,
    finalizeDocument,
    archiveDocument,
    duplicateDocument,
    linkToScheme,
    exportDocument,
    listVersions,
    restoreVersion,
    getQuotaPolicy,
    updateQuotaPolicy,
  }
}
