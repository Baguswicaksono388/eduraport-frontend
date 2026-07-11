import { useApi } from './useApi'

export const useDashboard = () => {
  const { fetcher } = useApi()

  // 1. Metric Catalog & Values
  const fetchCatalog = async (schoolId: string, role: string) => {
    return await fetcher(`/school/${schoolId}/dashboard/catalog?role=${role}`)
  }

  const fetchMetrics = async (schoolId: string, keys: string[], period: string, role: string, date?: string) => {
    const keysStr = keys.join(',')
    const dateQuery = date ? `&date=${date}` : ''
    return await fetcher(`/school/${schoolId}/dashboard/metrics?keys=${keysStr}&period=${period}&role=${role}${dateQuery}`)
  }

  const recalculateMetric = async (schoolId: string, key: string) => {
    return await fetcher(`/school/${schoolId}/dashboard/metrics/${key}/recalculate`, {
      method: 'POST'
    })
  }

  // 2. Briefing Narrative
  const fetchBriefing = async (schoolId: string, role: string) => {
    return await fetcher(`/school/${schoolId}/dashboard/briefing?role=${role}`)
  }

  // 3. Thresholds
  const fetchThresholds = async (schoolId: string) => {
    return await fetcher(`/school/${schoolId}/dashboard/thresholds`)
  }

  const updateThresholds = async (schoolId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/dashboard/thresholds`, {
      method: 'PUT',
      body: data
    })
  }

  // 4. Layout Preferences
  const fetchPreferences = async (schoolId: string, variant: string) => {
    return await fetcher(`/school/${schoolId}/dashboard/preferences?variant=${variant}`)
  }

  const updatePreferences = async (schoolId: string, variant: string, data: any) => {
    return await fetcher(`/school/${schoolId}/dashboard/preferences?variant=${variant}`, {
      method: 'PUT',
      body: data
    })
  }

  // 5. Scheduled Digests
  const fetchDigests = async (schoolId: string) => {
    return await fetcher(`/school/${schoolId}/dashboard/digests`)
  }

  const createDigest = async (schoolId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/dashboard/digests`, {
      method: 'POST',
      body: data
    })
  }

  const updateDigest = async (schoolId: string, id: string, data: any) => {
    return await fetcher(`/school/${schoolId}/dashboard/digests/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const deleteDigest = async (schoolId: string, id: string) => {
    return await fetcher(`/school/${schoolId}/dashboard/digests/${id}`, {
      method: 'DELETE'
    })
  }

  const sendDigestNow = async (schoolId: string, id: string) => {
    return await fetcher(`/school/${schoolId}/dashboard/digests/${id}/send-now`, {
      method: 'POST'
    })
  }

  // 6. Work Reminders
  const remindTeacher = async (schoolId: string, data: { recipient_id: string; metric_key: string; message_body: string }) => {
    return await fetcher(`/school/${schoolId}/dashboard/actions/remind-teacher`, {
      method: 'POST',
      body: data
    })
  }

  const fetchWorkReminders = async (schoolId: string, teacherId?: string) => {
    const query = teacherId ? `?teacher_id=${teacherId}` : ''
    return await fetcher(`/school/${schoolId}/dashboard/work-reminders${query}`)
  }

  // 7. Daily Attendance Bulk
  const fetchDailyAttendances = async (schoolId: string, classId?: string, date?: string) => {
    const params = new URLSearchParams()
    if (classId) params.append('class_id', classId)
    if (date) params.append('date', date)
    return await fetcher(`/school/${schoolId}/dashboard/daily-attendances?${params.toString()}`)
  }

  const recordDailyAttendancesBulk = async (schoolId: string, attendances: any[]) => {
    return await fetcher(`/school/${schoolId}/dashboard/daily-attendances/bulk`, {
      method: 'POST',
      body: { attendances }
    })
  }

  // 7.5b. Teacher Daily Attendance
  const fetchTeacherAttendances = async (schoolId: string, date: string) => {
    return await fetcher(`/school/${schoolId}/dashboard/teacher-attendances?date=${date}`)
  }

  const recordTeacherAttendancesBulk = async (schoolId: string, attendances: any[]) => {
    return await fetcher(`/school/${schoolId}/dashboard/teacher-attendances/bulk`, {
      method: 'POST',
      body: { attendances }
    })
  }

  // 8. Consolidated Metrics (Foundation/Yayasan)
  const fetchConsolidatedMetrics = async (foundationId: string, keys: string[], period: string) => {
    const keysStr = keys.join(',')
    return await fetcher(`/foundation/${foundationId}/dashboard/consolidated?keys=${keysStr}&period=${period}`)
  }

  return {
    fetchCatalog,
    fetchMetrics,
    recalculateMetric,
    fetchBriefing,
    fetchThresholds,
    updateThresholds,
    fetchPreferences,
    updatePreferences,
    fetchDigests,
    createDigest,
    updateDigest,
    deleteDigest,
    sendDigestNow,
    remindTeacher,
    fetchWorkReminders,
    fetchDailyAttendances,
    recordDailyAttendancesBulk,
    fetchTeacherAttendances,
    recordTeacherAttendancesBulk,
    fetchConsolidatedMetrics,
    exportPdf: async (schoolId: string, variant: string, period: string, date?: string) => {
      const dateQuery = date ? `?date=${date}` : ''
      return await fetcher(`/school/${schoolId}/dashboard/export-pdf${dateQuery}`, {
        method: 'POST',
        body: { variant, period },
        responseType: 'blob'
      })
    }
  }
}
