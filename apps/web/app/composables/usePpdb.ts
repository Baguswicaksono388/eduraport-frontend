import { useApi } from './useApi'

export const usePpdb = () => {
  const { fetcher } = useApi()
  const config = useRuntimeConfig()
  const ppdbBatches = useState<any[]>('ppdb_batches', () => [])

  const fetchPpdbBatches = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches`)
      if (res.success) {
        ppdbBatches.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch PPDB batches:', error)
    }
  }

  const createPpdbBatch = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/ppdb/batches`, {
      method: 'POST',
      body: data
    })
    await fetchPpdbBatches(schoolId)
    return res
  }

  const updatePpdbBatch = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchPpdbBatches(schoolId)
    return res
  }

  const deletePpdbBatch = async (schoolId: string, id: string) => {
    const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${id}`, {
      method: 'DELETE'
    })
    await fetchPpdbBatches(schoolId)
    return res
  }

  const fetchPpdbBatchFields = async (schoolId: string, batchId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/fields`)
      return res
    } catch (error) {
      console.error('Failed to fetch PPDB fields:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const savePpdbBatchFields = async (schoolId: string, batchId: string, fields: any[]) => {
    const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/fields`, {
      method: 'PUT',
      body: { fields }
    })
    return res
  }

  const fetchApplicants = async (schoolId: string, batchId: string, status?: string) => {
    try {
      const url = status 
        ? `/school/${schoolId}/ppdb/batches/${batchId}/applicants?status=${status}`
        : `/school/${schoolId}/ppdb/batches/${batchId}/applicants`
      const res: any = await fetcher(url)
      return res
    } catch (error) {
      console.error('Failed to fetch PPDB applicants:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const fetchApplicantDetail = async (schoolId: string, batchId: string, applicantId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/applicants/${applicantId}`)
      return res
    } catch (error) {
      console.error('Failed to fetch PPDB applicant detail:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const updateApplicantStatus = async (schoolId: string, batchId: string, applicantId: string, data: { status: string, admin_notes?: string, rejection_reason?: string }) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/applicants/${applicantId}/status`, {
        method: 'PATCH',
        body: data
      })
      return res
    } catch (error) {
      console.error('Failed to update applicant status:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const verifyPaymentProof = async (schoolId: string, batchId: string, applicantId: string, proofId: string, data: { status: string, rejection_reason?: string }) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/applicants/${applicantId}/payment/${proofId}`, {
        method: 'PATCH',
        body: data
      })
      return res
    } catch (error) {
      console.error('Failed to verify payment proof:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const fetchPaymentProof = async (schoolId: string, batchId: string, applicantId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/applicants/${applicantId}/payment`)
      return res
    } catch (error) {
      console.error('Failed to fetch payment proof:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const fetchAnnouncements = async (schoolId: string, batchId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/announcements`)
      return res
    } catch (error) {
      console.error('Failed to fetch PPDB announcements:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const createAnnouncement = async (schoolId: string, batchId: string, data: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/announcements`, {
        method: 'POST',
        body: data
      })
      return res
    } catch (error) {
      console.error('Failed to create PPDB announcement:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const updateAnnouncement = async (schoolId: string, batchId: string, annId: string, data: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/announcements/${annId}`, {
        method: 'PUT',
        body: data
      })
      return res
    } catch (error) {
      console.error('Failed to update PPDB announcement:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const deleteAnnouncement = async (schoolId: string, batchId: string, annId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/announcements/${annId}`, {
        method: 'DELETE'
      })
      return res
    } catch (error) {
      console.error('Failed to delete PPDB announcement:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const fetchPublicAnnouncement = async (schoolId: string, slug: string) => {
    try {
      const response = await fetch(`${config.public.apiBase}/public/ppdb/${schoolId}/${slug}/announcement`)
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch public PPDB announcement:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const uploadAcceptedDocument = async (regNumber: string, doc: { document_type: string, document_label: string, file_url: string, file_name: string }) => {
    try {
      const response = await fetch(`${config.public.apiBase}/public/ppdb/status/${regNumber}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to upload post-admission document:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const fetchApplicantDocuments = async (regNumber: string) => {
    try {
      const response = await fetch(`${config.public.apiBase}/public/ppdb/status/${regNumber}/documents`)
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch applicant documents:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const fetchAcceptedDocumentsAdmin = async (schoolId: string, batchId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/documents`)
      return res
    } catch (error) {
      console.error('Failed to fetch PPDB documents for review:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const verifyAcceptedDocumentAdmin = async (schoolId: string, batchId: string, applicantId: string, docId: string, data: { status: string, rejection_reason?: string }) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/applicants/${applicantId}/documents/${docId}`, {
        method: 'PATCH',
        body: data
      })
      return res
    } catch (error) {
      console.error('Failed to verify PPDB document:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const convertToStudentAdmin = async (schoolId: string, batchId: string, applicantId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/convert/${applicantId}`, {
        method: 'POST'
      })
      return res
    } catch (error) {
      console.error('Failed to convert applicant to student:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const bulkConvertToStudentsAdmin = async (schoolId: string, batchId: string, applicantIds: string[]) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/bulk-convert`, {
        method: 'POST',
        body: { applicant_ids: applicantIds }
      })
      return res
    } catch (error) {
      console.error('Failed bulk converting applicants to students:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  const fetchBatchStatsAdmin = async (schoolId: string, batchId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/ppdb/batches/${batchId}/stats`)
      return res
    } catch (error) {
      console.error('Failed to fetch PPDB batch stats:', error)
      return { success: false, error: 'Internal Error' }
    }
  }

  return {
    ppdbBatches,
    fetchPpdbBatches,
    createPpdbBatch,
    updatePpdbBatch,
    deletePpdbBatch,
    fetchPpdbBatchFields,
    savePpdbBatchFields,
    fetchApplicants,
    fetchApplicantDetail,
    updateApplicantStatus,
    verifyPaymentProof,
    fetchPaymentProof,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    fetchPublicAnnouncement,
    uploadAcceptedDocument,
    fetchApplicantDocuments,
    fetchAcceptedDocumentsAdmin,
    verifyAcceptedDocumentAdmin,
    convertToStudentAdmin,
    bulkConvertToStudentsAdmin,
    fetchBatchStatsAdmin
  }
}
