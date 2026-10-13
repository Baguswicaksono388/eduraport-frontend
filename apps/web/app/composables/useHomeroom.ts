import { useApi } from './useApi'

export const useHomeroom = () => {
  const { fetcher } = useApi()
  const homeroomStudents = useState<any[]>('homeroom_students', () => [])
  const activeExtracurriculars = useState<any[]>('active_extracurriculars', () => [])

  const fetchHomeroomData = async (
    schoolId: string,
    classId: string,
    academicYearId: string,
    semester: string
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/class/${classId}/homeroom/data`, {
        query: { academic_year_id: academicYearId, semester }
      })
      if (res.success) {
        homeroomStudents.value = res.data.students
        activeExtracurriculars.value = res.data.extracurriculars
      }
      return res
    } catch (error) {
      console.error('Failed to fetch homeroom data:', error)
      throw error
    }
  }

  const saveHomeroomData = async (
    schoolId: string,
    classId: string,
    payload: {
      academic_year_id: string
      semester: string
      students: any[]
    }
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/class/${classId}/homeroom/data`, {
        method: 'POST',
        body: payload
      })
      if (res.success) {
        await fetchHomeroomData(schoolId, classId, payload.academic_year_id, payload.semester)
      }
      return res
    } catch (error) {
      console.error('Failed to save homeroom data:', error)
      throw error
    }
  }

  const downloadTemplate = async (
    schoolId: string,
    classId: string,
    academicYearId: string,
    semester: string
  ) => {
    try {
      const blob: any = await fetcher(`/school/${schoolId}/class/${classId}/homeroom/xls`, {
        query: { academic_year_id: academicYearId, semester },
        responseType: 'blob'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `template-rapor-kelas-${classId}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download template:', error)
      throw error
    }
  }

  const importTemplate = async (
    schoolId: string,
    classId: string,
    academicYearId: string,
    semester: string,
    file: File
  ) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('academic_year_id', academicYearId)
      formData.append('semester', semester)

      const res: any = await fetcher(`/school/${schoolId}/class/${classId}/homeroom/xls`, {
        method: 'POST',
        body: formData,
        query: { academic_year_id: academicYearId, semester }
      })
      if (res.success) {
        await fetchHomeroomData(schoolId, classId, academicYearId, semester)
      }
      return res
    } catch (error) {
      console.error('Failed to import homeroom template:', error)
      throw error
    }
  }

  const leaveRequests = useState<any[]>('homeroom_leave_requests', () => [])

  const fetchClassLeaveRequests = async (schoolId: string, classId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/class/${classId}/homeroom/leave-requests`)
      if (res.success) {
        leaveRequests.value = res.data || []
      }
      return res.data || []
    } catch (error) {
      console.error('Failed to fetch class leave requests:', error)
      return []
    }
  }

  const fetchSchoolLeaveRequests = async (schoolId: string, options: { status?: string; classId?: string } = {}) => {
    try {
      const params = new URLSearchParams()
      if (options.status) params.append('status', options.status)
      if (options.classId) params.append('class_id', options.classId)
      const queryStr = params.toString() ? `?${params.toString()}` : ''

      const res: any = await fetcher(`/school/${schoolId}/homeroom/leave-requests${queryStr}`)
      if (res.success) {
        leaveRequests.value = res.data || []
      }
      return res.data || []
    } catch (error) {
      console.error('Failed to fetch school leave requests:', error)
      return []
    }
  }

  const approveLeaveRequest = async (schoolId: string, id: string, classId?: string) => {
    try {
      const url = classId 
        ? `/school/${schoolId}/class/${classId}/homeroom/leave-requests/${id}/approve`
        : `/school/${schoolId}/homeroom/leave-requests/${id}/approve`
      const res: any = await fetcher(url, { method: 'POST' })
      return res
    } catch (error) {
      console.error('Failed to approve leave request:', error)
      throw error
    }
  }

  const rejectLeaveRequest = async (schoolId: string, id: string, classId?: string) => {
    try {
      const url = classId 
        ? `/school/${schoolId}/class/${classId}/homeroom/leave-requests/${id}/reject`
        : `/school/${schoolId}/homeroom/leave-requests/${id}/reject`
      const res: any = await fetcher(url, { method: 'POST' })
      return res
    } catch (error) {
      console.error('Failed to reject leave request:', error)
      throw error
    }
  }

  return {
    homeroomStudents,
    activeExtracurriculars,
    leaveRequests,
    fetchHomeroomData,
    saveHomeroomData,
    downloadTemplate,
    importTemplate,
    fetchClassLeaveRequests,
    fetchSchoolLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest
  }
}
