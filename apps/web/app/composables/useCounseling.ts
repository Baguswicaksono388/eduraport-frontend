import { useApi } from './useApi'

export const useCounseling = () => {
  const { fetcher } = useApi()
  const counselors = useState<any[]>('bk_counselors', () => [])
  const sessions = useState<any[]>('counseling_sessions', () => [])

  // -- Counselors --

  const fetchCounselors = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/counseling/counselors`)
      if (res.success) {
        counselors.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch counselors:', error)
    }
  }

  const createCounselor = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/counseling/counselors`, {
      method: 'POST',
      body: data
    })
    await fetchCounselors(schoolId)
    return res
  }

  const updateCounselor = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/counseling/counselors/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchCounselors(schoolId)
    return res
  }

  const deleteCounselor = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/counseling/counselors/${id}`, {
      method: 'DELETE'
    })
    await fetchCounselors(schoolId)
    return res
  }

  // -- Sessions --

  const fetchSessions = async (schoolId: string, studentId: string, academicYearId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/counseling/sessions?student_id=${studentId}&academic_year_id=${academicYearId}`)
      if (res.success) {
        sessions.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const createSession = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/counseling/sessions`, {
      method: 'POST',
      body: data
    })
    return res
  }

  const updateSession = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/counseling/sessions/${id}`, {
      method: 'PUT',
      body: data
    })
    return res
  }

  const deleteSession = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/counseling/sessions/${id}`, {
      method: 'DELETE'
    })
    return res
  }

  return {
    counselors,
    sessions,
    fetchCounselors,
    createCounselor,
    updateCounselor,
    deleteCounselor,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession
  }
}
