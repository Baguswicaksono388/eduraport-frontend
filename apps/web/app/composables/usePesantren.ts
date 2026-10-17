import { useApi } from './useApi'

export interface MutabaahItem {
  id: string
  foundation_id?: string
  name: string
  category: 'fardhu' | 'sunnah' | 'tahfidz' | 'adab_karakter' | 'kedisiplinan' | string
  target_gender?: 'all' | 'male' | 'female'
  order_index?: number
  is_mandatory?: boolean
  is_active?: boolean
  assignment_id?: string | null
  is_assigned?: boolean
}

export const usePesantren = () => {
  const { fetcher } = useApi()

  // =========================================================================
  // 1. TAHFIDZ
  // =========================================================================
  const recordTahfidz = async (schoolId: string, payload: any) => {
    return await fetcher(`/school/${schoolId}/pesantren/tahfidz`, {
      method: 'POST',
      body: payload
    })
  }

  const fetchTahfidzList = async (schoolId: string, date?: string, classId?: string) => {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    if (classId) params.append('class_id', classId)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res: any = await fetcher(`/school/${schoolId}/pesantren/tahfidz${queryString}`)
    return res.success ? res.data : []
  }

  const fetchTahfidzPaginated = async (
    schoolId: string,
    opts: { page?: number; itemPerPage?: number; date?: string; classId?: string; search?: string } = {}
  ) => {
    const params = new URLSearchParams()
    if (opts.page) params.append('page', String(opts.page))
    if (opts.itemPerPage) params.append('item_per_page', String(opts.itemPerPage))
    if (opts.date) params.append('date', opts.date)
    if (opts.classId) params.append('class_id', opts.classId)
    if (opts.search) params.append('search', opts.search)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res: any = await fetcher(`/school/${schoolId}/pesantren/tahfidz${queryString}`)
    return res.success
      ? res.data
      : { data: [], page: 1, item_per_page: 10, total_item: 0, total_page: 1, list_pagination: [10, 25, 50, 100] }
  }

  const fetchStudentTahfidz = async (schoolId: string, studentId: string) => {
    const res: any = await fetcher(`/school/${schoolId}/pesantren/tahfidz/student/${studentId}`)
    return res.success ? res.data : []
  }

  const deleteTahfidz = async (schoolId: string, id: string) => {
    return await fetcher(`/school/${schoolId}/pesantren/tahfidz/${id}`, {
      method: 'DELETE'
    })
  }

  // =========================================================================
  // 2. SCHOOL ASSIGNED MUTABA'AH ITEMS & STUDENT RECORDS
  // =========================================================================
  const fetchSchoolAssignedMutabaahItems = async (schoolId: string): Promise<MutabaahItem[]> => {
    const res: any = await fetcher(`/school/${schoolId}/pesantren/mutabaah/items`)
    return res.success ? res.data : []
  }

  const fetchMutabaahByDate = async (schoolId: string, date: string, classId?: string) => {
    const params = new URLSearchParams()
    if (classId) params.append('class_id', classId)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res: any = await fetcher(`/school/${schoolId}/pesantren/mutabaah/date/${date}${queryString}`)
    return res.success ? res.data : []
  }

  const recordMutabaahBulk = async (schoolId: string, payload: { date: string; records: any[] }) => {
    return await fetcher(`/school/${schoolId}/pesantren/mutabaah/bulk`, {
      method: 'POST',
      body: payload
    })
  }

  const recordMutabaahSingle = async (schoolId: string, payload: any) => {
    return await fetcher(`/school/${schoolId}/pesantren/mutabaah/single`, {
      method: 'POST',
      body: payload
    })
  }

  // Aliases for backward compatibility
  const recordIbadahBulk = recordMutabaahBulk
  const fetchIbadahByDate = fetchMutabaahByDate
  const recordIbadah = recordMutabaahSingle

  // =========================================================================
  // 3. FOUNDATION MASTER MUTABA'AH MANAGEMENT
  // =========================================================================
  const fetchFoundationMutabaahItems = async (foundationId: string, onlyActive = false): Promise<MutabaahItem[]> => {
    const query = onlyActive ? '?active=true' : ''
    const res: any = await fetcher(`/foundation/${foundationId}/pesantren/mutabaah/items${query}`)
    return res.success ? res.data : []
  }

  const createFoundationMutabaahItem = async (foundationId: string, payload: any) => {
    return await fetcher(`/foundation/${foundationId}/pesantren/mutabaah/items`, {
      method: 'POST',
      body: payload
    })
  }

  const updateFoundationMutabaahItem = async (foundationId: string, itemId: string, payload: any) => {
    return await fetcher(`/foundation/${foundationId}/pesantren/mutabaah/items/${itemId}`, {
      method: 'PUT',
      body: payload
    })
  }

  const deleteFoundationMutabaahItem = async (foundationId: string, itemId: string) => {
    return await fetcher(`/foundation/${foundationId}/pesantren/mutabaah/items/${itemId}`, {
      method: 'DELETE'
    })
  }

  const reorderFoundationMutabaahItems = async (foundationId: string, items: { id: string; order_index: number }[]) => {
    return await fetcher(`/foundation/${foundationId}/pesantren/mutabaah/items/reorder`, {
      method: 'POST',
      body: { items }
    })
  }

  const fetchFoundationSchoolAssignments = async (foundationId: string, schoolId?: string) => {
    const query = schoolId ? `?school_id=${schoolId}` : ''
    const res: any = await fetcher(`/foundation/${foundationId}/pesantren/mutabaah/assignments${query}`)
    return res.success ? res.data : []
  }

  const saveSchoolMutabaahAssignments = async (
    foundationId: string,
    payload: { school_id: string; assignments: any[] }
  ) => {
    return await fetcher(`/foundation/${foundationId}/pesantren/mutabaah/assignments/school`, {
      method: 'POST',
      body: payload
    })
  }

  const batchAssignMasterItem = async (
    foundationId: string,
    payload: { master_item_id: string; school_ids: string[] }
  ) => {
    return await fetcher(`/foundation/${foundationId}/pesantren/mutabaah/assignments/batch`, {
      method: 'POST',
      body: payload
    })
  }

  // =========================================================================
  // 4. ANALYTICS
  // =========================================================================
  const fetchPesantrenAnalytics = async (
    schoolId: string,
    opts: { classId?: string; startDate?: string; endDate?: string; aggregateFoundation?: boolean } = {}
  ) => {
    const params = new URLSearchParams()
    if (opts.classId) params.append('class_id', opts.classId)
    if (opts.startDate) params.append('start_date', opts.startDate)
    if (opts.endDate) params.append('end_date', opts.endDate)
    if (opts.aggregateFoundation) params.append('aggregate_foundation', 'true')
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res: any = await fetcher(`/school/${schoolId}/pesantren/analytics${queryString}`)
    return res.success ? res.data : null
  }

  const fetchFoundationPesantrenAnalytics = async (
    foundationId: string,
    opts: { startDate?: string; endDate?: string } = {}
  ) => {
    const params = new URLSearchParams()
    if (opts.startDate) params.append('start_date', opts.startDate)
    if (opts.endDate) params.append('end_date', opts.endDate)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res: any = await fetcher(`/foundation/${foundationId}/pesantren/analytics${queryString}`)
    return res.success ? res.data : null
  }

  return {
    recordTahfidz,
    fetchTahfidzList,
    fetchTahfidzPaginated,
    fetchStudentTahfidz,
    deleteTahfidz,
    fetchSchoolAssignedMutabaahItems,
    fetchMutabaahByDate,
    recordMutabaahBulk,
    recordMutabaahSingle,
    recordIbadahBulk,
    fetchIbadahByDate,
    recordIbadah,
    fetchFoundationMutabaahItems,
    createFoundationMutabaahItem,
    updateFoundationMutabaahItem,
    deleteFoundationMutabaahItem,
    reorderFoundationMutabaahItems,
    fetchFoundationSchoolAssignments,
    saveSchoolMutabaahAssignments,
    batchAssignMasterItem,
    fetchPesantrenAnalytics,
    fetchFoundationPesantrenAnalytics
  }
}
