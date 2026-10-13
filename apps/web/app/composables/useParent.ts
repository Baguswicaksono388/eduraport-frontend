import { useApi } from './useApi'

export const useParent = () => {
  const { fetcher } = useApi()
  const parents = useState<any[]>('parents', () => [])
  const myChildren = useState<any[]>('myChildren', () => [])

  const fetchMyChildren = async () => {
    try {
      const res: any = await fetcher('/parents/my-students')
      if (res.success) {
        myChildren.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch my children:', error)
      myChildren.value = []
    }
  }

  const fetchChildDetail = async (studentId: string, startDate?: string, endDate?: string) => {
    try {
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      
      const queryString = query.toString() ? `?${query.toString()}` : '';
      const res: any = await fetcher(`/parents/my-students/${studentId}${queryString}`)
      if (res.success) {
        return res.data
      }
      return null
    } catch (error) {
      console.error('Failed to fetch child detail:', error)
      return null
    }
  }

  const fetchParents = async (schoolId: string, studentId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/student/${studentId}/parents`)
      if (res.success) {
        parents.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch parents:', error)
      parents.value = []
    }
  }

  const allParents = useState<any[]>('allParents', () => [])
  const allParentsMeta = useState<any>('allParentsMeta', () => null)
  
  const fetchAllParents = async (schoolId: string, page?: number, limit?: number, search?: string, status?: 'linked' | 'unlinked' | 'all', foundationId?: string) => {
    try {
      const query = new URLSearchParams()
      if (page) query.append('page', page.toString())
      if (limit) query.append('limit', limit.toString())
      if (search) query.append('search', search)
      if (status) query.append('status', status)
      
      let endpoint = `/school/${schoolId}/student/parents/all?${query.toString()}`
      
      if (status === 'unlinked' && foundationId) {
        const foundationQuery = new URLSearchParams()
        if (page) foundationQuery.append('page', page.toString())
        if (limit) foundationQuery.append('limit', limit.toString())
        if (search) foundationQuery.append('search', search)
        foundationQuery.append('foundationId', foundationId)
        
        endpoint = `/parents/unlinked?${foundationQuery.toString()}`
      }
      
      const res: any = await fetcher(endpoint)
      if (res.success) {
        allParents.value = res.data.parents
        allParentsMeta.value = res.data.meta
      }
    } catch (error) {
      console.error('Failed to fetch all parents:', error)
      allParents.value = []
      allParentsMeta.value = null
    }
  }

  const createParent = async (schoolId: string, data: any) => {
    const res = await fetcher(`/school/${schoolId}/student/parents`, {
      method: 'POST',
      body: data
    })
    return res
  }

  const updateParent = async (schoolId: string, id: string, data: any) => {
    const res = await fetcher(`/school/${schoolId}/student/parents/${id}`, {
      method: 'PUT',
      body: data
    })
    return res
  }

  const deleteParent = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/student/parents/${id}`, {
      method: 'DELETE'
    })
    return res
  }

  const fetchParentDashboard = async (parentId: string) => {
    try {
      const res: any = await fetcher(`/parents/${parentId}/dashboard`)
      return res.success ? res.data : null
    } catch (error) {
      console.error('Failed to fetch parent dashboard:', error)
      return null
    }
  }

  const fetchDigitalRaport = async (parentId: string, studentId: string, reportId: string) => {
    try {
      const res: any = await fetcher(`/parents/${parentId}/students/${studentId}/reports/${reportId}`)
      return res.success ? res.data : null
    } catch (error) {
      console.error('Failed to fetch digital raport:', error)
      return null
    }
  }

  const approveReport = async (parentId: string, studentId: string, reportId: string, payload: { agree_to_terms: boolean; signature_text: string }) => {
    try {
      const res: any = await fetcher(`/parents/${parentId}/students/${studentId}/reports/${reportId}/approve`, {
        method: 'POST',
        body: payload
      })
      return res
    } catch (error) {
      console.error('Failed to approve report:', error)
      throw error
    }
  }

  const fetchAttendance = async (childId: string, month?: string, type?: string) => {
    const params = new URLSearchParams()
    if (month) params.append('month', month)
    if (type) params.append('type', type)
    const res: any = await fetcher(`/parents/children/${childId}/attendance?${params.toString()}`)
    return res.success ? res.data : null
  }

  const fetchBills = async () => {
    const res: any = await fetcher('/parents/bills')
    return res.success ? res.data : []
  }

  const fetchBillDetail = async (billId: string) => {
    const res: any = await fetcher(`/parents/bills/${billId}`)
    return res.success ? res.data : null
  }

  const submitPayment = async (payload: any) => {
    return await fetcher('/parents/payments', {
      method: 'POST',
      body: payload
    })
  }

  const fetchAnnouncements = async (page: number = 1, limit: number = 20, unread: boolean = false) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (unread) params.append('unread', 'true')
    const res: any = await fetcher(`/parents/announcements?${params.toString()}`)
    return res.success ? res.data : { data: [], total: 0 }
  }

  const markAnnouncementRead = async (id: string) => {
    return await fetcher(`/parents/announcements/${id}/read`, { method: 'POST' })
  }

  const fetchGrades = async (studentId?: string, semester?: number, type?: string) => {
    const params = new URLSearchParams()
    if (studentId) params.append('student_id', studentId)
    if (semester) params.append('semester', semester.toString())
    if (type) params.append('type', type)
    const res: any = await fetcher(`/parents/grades?${params.toString()}`)
    return res.success ? res.data : { grades: [], ranking: null }
  }

  const fetchBehavior = async (studentId?: string, academicYearId?: string) => {
    const params = new URLSearchParams()
    if (studentId) params.append('student_id', studentId)
    if (academicYearId) params.append('academic_year_id', academicYearId)
    const res: any = await fetcher(`/parents/behavior?${params.toString()}`)
    return res.success ? res.data : { bk_points: null, attitude_records: [] }
  }

  const fetchSchedule = async (childId: string) => {
    const res: any = await fetcher(`/parents/children/${childId}/schedule`)
    return res.success ? res.data : {}
  }

  const fetchMessages = async (page: number = 1, limit: number = 20) => {
    const res: any = await fetcher(`/parents/messages?page=${page}&limit=${limit}`)
    return res.success ? res.data : { data: [], total: 0 }
  }

  const sendMessage = async (payload: any) => {
    return await fetcher('/parents/messages', {
      method: 'POST',
      body: payload
    })
  }

  const markMessageRead = async (id: string) => {
    return await fetcher(`/parents/messages/${id}/read`, { method: 'PATCH' })
  }

  const submitLeaveRequest = async (payload: any) => {
    return await fetcher('/parents/leave-request', {
      method: 'POST',
      body: payload
    })
  }

  const fetchLeaveRequests = async (studentId?: string) => {
    const params = studentId ? `?student_id=${studentId}` : ''
    const res: any = await fetcher(`/parents/leave-requests${params}`)
    return res.success ? res.data : []
  }

  const fetchNotificationPreferences = async () => {
    const res: any = await fetcher('/parents/notification-preferences')
    return res.success ? res.data : null
  }

  const updateNotificationPreferences = async (payload: any) => {
    return await fetcher('/parents/notification-preferences', {
      method: 'PATCH',
      body: payload
    })
  }

  const fetchAccessLogs = async (page: number = 1, limit: number = 10) => {
    const res: any = await fetcher(`/parents/access-log?page=${page}&limit=${limit}`)
    return res.success ? res.data : { data: [], total: 0 }
  }

  const chatAiAssistant = async (studentId: string, message: string) => {
    const res: any = await fetcher('/parents/ai-assistant/chat', {
      method: 'POST',
      body: { student_id: studentId, message }
    })
    return res
  }

  const fetchWallet = async (studentId: string) => {
    const res: any = await fetcher(`/parents/wallet?student_id=${studentId}`)
    return res.success ? res.data : null
  }

  const fetchWalletTransactions = async (studentId: string, page: number = 1, limit: number = 20) => {
    const res: any = await fetcher(`/parents/wallet/transactions?student_id=${studentId}&page=${page}&limit=${limit}`)
    return res.success ? res.data : []
  }

  const topupWallet = async (studentId: string, amount: number, paymentMethod: string) => {
    return await fetcher('/parents/wallet/topup', {
      method: 'POST',
      body: { student_id: studentId, amount, payment_method: paymentMethod }
    })
  }

  const updateWalletLimits = async (payload: any) => {
    return await fetcher('/parents/wallet/limits', {
      method: 'PATCH',
      body: payload
    })
  }

  const fetchPesantrenProgress = async (childId: string) => {
    const res: any = await fetcher(`/parents/children/${childId}/pesantren`)
    return res.success ? res.data : null
  }

  const fetchMeetings = async () => {
    const res: any = await fetcher('/parents/meetings')
    return res.success ? res.data : []
  }

  const fetchMeetingSlots = async (teacherId: string, date: string) => {
    const res: any = await fetcher(`/parents/meetings/slots?teacher_id=${teacherId}&date=${date}`)
    return res.success ? res.data : []
  }

  const bookMeeting = async (payload: any) => {
    return await fetcher('/parents/meetings/book', {
      method: 'POST',
      body: payload
    })
  }

  const cancelMeeting = async (id: string) => {
    return await fetcher(`/parents/meetings/${id}/cancel`, { method: 'PATCH' })
  }

  const fetchYayasanOverview = async () => {
    const res: any = await fetcher('/parents/yayasan/overview')
    return res.success ? res.data : { schools: [], summary: {} }
  }

  return {
    parents,
    allParents,
    allParentsMeta,
    myChildren,
    fetchMyChildren,
    fetchChildDetail,
    fetchParents,
    fetchAllParents,
    createParent,
    updateParent,
    deleteParent,
    fetchParentDashboard,
    fetchDigitalRaport,
    approveReport,
    fetchAttendance,
    fetchBills,
    fetchBillDetail,
    submitPayment,
    fetchAnnouncements,
    markAnnouncementRead,
    fetchGrades,
    fetchBehavior,
    fetchSchedule,
    fetchMessages,
    sendMessage,
    markMessageRead,
    submitLeaveRequest,
    fetchLeaveRequests,
    fetchNotificationPreferences,
    updateNotificationPreferences,
    fetchAccessLogs,
    chatAiAssistant,
    fetchWallet,
    fetchWalletTransactions,
    topupWallet,
    updateWalletLimits,
    fetchPesantrenProgress,
    fetchMeetings,
    fetchMeetingSlots,
    bookMeeting,
    cancelMeeting,
    fetchYayasanOverview
  }
}

