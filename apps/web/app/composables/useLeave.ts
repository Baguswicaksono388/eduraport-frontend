import { useApi } from './useApi'

export const useLeave = () => {
  const { fetcher } = useApi()

  const leaveTypes = useState<any[]>('leaveTypes', () => [])
  const leaveQuotas = useState<any[]>('leaveQuotas', () => [])
  const leaveRequests = useState<any[]>('leaveRequests', () => [])
  const leaveRequestsMeta = useState<any>('leaveRequestsMeta', () => null)
  const vacancies = useState<any[]>('vacancies', () => [])
  const candidates = useState<any[]>('candidates', () => [])

  const fetchLeaveTypes = async (schoolId: string, onlyActive = false) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/leave/types?onlyActive=${onlyActive}`)
      if (res.success) {
        leaveTypes.value = res.data.map((item: any) => ({
          ...item,
          quota_default: item.annual_quota_days,
          is_deduct_annual: item.deducts_quota
        }))
      }
    } catch (error) {
      console.error('Failed to fetch leave types:', error)
    }
  }

  const createLeaveType = async (schoolId: string, data: any) => {
    const payload = {
      name: data.name,
      code: data.code,
      annual_quota_days: data.quota_default,
      deducts_quota: data.is_deduct_annual,
      is_active: data.is_active
    }
    const res: any = await fetcher(`/school/${schoolId}/leave/types`, {
      method: 'POST',
      body: payload
    })
    await fetchLeaveTypes(schoolId)
    return res
  }

  const updateLeaveType = async (schoolId: string, id: string, data: any) => {
    const payload = {
      name: data.name,
      code: data.code,
      annual_quota_days: data.quota_default,
      deducts_quota: data.is_deduct_annual,
      is_active: data.is_active
    }
    const res: any = await fetcher(`/school/${schoolId}/leave/types/${id}`, {
      method: 'PUT',
      body: payload
    })
    await fetchLeaveTypes(schoolId)
    return res
  }

  const deleteLeaveType = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/leave/types/${id}`, {
      method: 'DELETE'
    })
    await fetchLeaveTypes(schoolId)
    return res
  }

  const fetchLeaveQuotas = async (schoolId: string, employeeId: string, academicYearId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/leave/quota?employee_id=${employeeId}&academic_year_id=${academicYearId}`)
      if (res.success) {
        leaveQuotas.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch leave quotas:', error)
    }
  }

  const updateLeaveQuota = async (schoolId: string, id: string, quotaDays: number, employeeId: string, academicYearId: string) => {
    const res: any = await fetcher(`/school/${schoolId}/leave/quota/${id}`, {
      method: 'PUT',
      body: { quota_days: quotaDays }
    })
    await fetchLeaveQuotas(schoolId, employeeId, academicYearId)
    return res
  }

  const initializeLeaveQuotas = async (schoolId: string, employeeId: string, academicYearId: string, quotas: Array<{ leave_type_id: string, quota_days: number }>) => {
    const res: any = await fetcher(`/school/${schoolId}/leave/quota/bulk`, {
      method: 'POST',
      body: {
        employee_id: employeeId,
        academic_year_id: academicYearId,
        quotas
      }
    })
    await fetchLeaveQuotas(schoolId, employeeId, academicYearId)
    return res
  }

  const fetchLeaveRequests = async (schoolId: string, page = 1, itemPerPage = 10, filters: any = {}) => {
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('item_per_page', String(itemPerPage))
      if (filters.status) params.append('status', filters.status)
      if (filters.employee_id) params.append('employee_id', filters.employee_id)
      if (filters.from) params.append('from', filters.from)
      if (filters.to) params.append('to', filters.to)
      const query = `?${params.toString()}`

      const res: any = await fetcher(`/school/${schoolId}/leave/requests${query}`)
      if (res.success) {
        leaveRequests.value = res.data.data
        leaveRequestsMeta.value = {
          page: res.data.page,
          item_per_page: res.data.item_per_page,
          total_item: res.data.total_item,
          total_page: res.data.total_page,
          list_pagination: res.data.list_pagination
        }
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error)
    }
  }

  const createLeaveRequest = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/leave/requests`, {
      method: 'POST',
      body: data
    })
    await fetchLeaveRequests(schoolId, leaveRequestsMeta.value?.page || 1, leaveRequestsMeta.value?.item_per_page || 10)
    return res
  }

  const updateLeaveRequest = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/leave/requests/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchLeaveRequests(schoolId, leaveRequestsMeta.value?.page || 1, leaveRequestsMeta.value?.item_per_page || 10)
    return res
  }

  const decideLeaveRequest = async (schoolId: string, id: string, status: 'approved' | 'rejected', decisionNote?: string) => {
    const action = status === 'approved' ? 'approve' : 'reject'
    const url = `/school/${schoolId}/leave/requests/${id}/${action}`
    const res: any = await fetcher(url, {
      method: 'POST',
      body: { status, decision_note: decisionNote }
    })
    await fetchLeaveRequests(schoolId, leaveRequestsMeta.value?.page || 1, leaveRequestsMeta.value?.item_per_page || 10)
    return res
  }

  const cancelLeaveRequest = async (schoolId: string, id: string, newEndDate?: string) => {
    const res: any = await fetcher(`/school/${schoolId}/leave/requests/${id}/cancel`, {
      method: 'POST',
      body: { new_end_date: newEndDate }
    })
    await fetchLeaveRequests(schoolId, leaveRequestsMeta.value?.page || 1, leaveRequestsMeta.value?.item_per_page || 10)
    return res
  }

  const fetchVacancies = async (schoolId: string, from: string, to: string, status?: string) => {
    try {
      let query = `?from=${from}&to=${to}`
      if (status) query += `&status=${status}`
      const res: any = await fetcher(`/school/${schoolId}/leave/vacancies${query}`)
      if (res.success) {
        vacancies.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch vacancies:', error)
    }
  }

  const fetchCandidates = async (schoolId: string, slotKey: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/leave/vacancies/${slotKey}/candidates`)
      if (res.success) {
        candidates.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    }
  }

  const markPlannedEmpty = async (schoolId: string, slotKey: string, note: string) => {
    return fetcher(`/school/${schoolId}/leave/vacancies/${slotKey}/mark-planned-empty`, {
      method: 'POST',
      body: { note }
    })
  }

  const unmarkPlannedEmpty = async (schoolId: string, slotKey: string) => {
    return fetcher(`/school/${schoolId}/leave/vacancies/${slotKey}/unmark-planned-empty`, {
      method: 'POST'
    })
  }

  const createSubstitution = async (schoolId: string, data: any) => {
    return fetcher(`/school/${schoolId}/leave/substitutions`, {
      method: 'POST',
      body: data
    })
  }

  const bulkSubstitution = async (schoolId: string, data: any) => {
    return fetcher(`/school/${schoolId}/leave/substitutions/bulk`, {
      method: 'POST',
      body: data
    })
  }

  const confirmSubstitution = async (schoolId: string, id: string) => {
    return fetcher(`/school/${schoolId}/leave/substitutions/${id}/confirm`, {
      method: 'POST'
    })
  }

  const declineSubstitution = async (schoolId: string, id: string, reason: string) => {
    return fetcher(`/school/${schoolId}/leave/substitutions/${id}/decline`, {
      method: 'POST',
      body: { reason }
    })
  }

  const cancelSubstitution = async (schoolId: string, id: string) => {
    return fetcher(`/school/${schoolId}/leave/substitutions/${id}/cancel`, {
      method: 'POST'
    })
  }

  const fetchSubstitutionRecap = async (schoolId: string, month: string, teacherId?: string) => {
    let query = `?month=${month}`
    if (teacherId) query += `&teacher_id=${teacherId}`
    return fetcher(`/school/${schoolId}/leave/substitution-recap${query}`)
  }

  return {
    leaveTypes,
    leaveQuotas,
    leaveRequests,
    leaveRequestsMeta,
    vacancies,
    candidates,
    fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    fetchLeaveQuotas,
    updateLeaveQuota,
    initializeLeaveQuotas,
    fetchLeaveRequests,
    createLeaveRequest,
    updateLeaveRequest,
    decideLeaveRequest,
    cancelLeaveRequest,
    fetchVacancies,
    fetchCandidates,
    markPlannedEmpty,
    unmarkPlannedEmpty,
    createSubstitution,
    bulkSubstitution,
    confirmSubstitution,
    declineSubstitution,
    cancelSubstitution,
    fetchSubstitutionRecap
  }
}
