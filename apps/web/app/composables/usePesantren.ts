import { useApi } from './useApi'

export const usePesantren = () => {
  const { fetcher } = useApi()

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

  const recordIbadah = async (schoolId: string, payload: any) => {
    return await fetcher(`/school/${schoolId}/pesantren/ibadah`, {
      method: 'POST',
      body: payload
    })
  }

  const recordIbadahBulk = async (schoolId: string, payload: { date: string; records: any[] }) => {
    return await fetcher(`/school/${schoolId}/pesantren/ibadah/bulk`, {
      method: 'POST',
      body: payload
    })
  }

  const fetchIbadahByDate = async (schoolId: string, date: string, classId?: string) => {
    const params = new URLSearchParams()
    if (classId) params.append('class_id', classId)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res: any = await fetcher(`/school/${schoolId}/pesantren/ibadah/date/${date}${queryString}`)
    return res.success ? res.data : []
  }

  return {
    recordTahfidz,
    fetchTahfidzList,
    fetchTahfidzPaginated,
    fetchStudentTahfidz,
    deleteTahfidz,
    recordIbadah,
    recordIbadahBulk,
    fetchIbadahByDate
  }
}
