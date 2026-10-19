import { useApi } from './useApi'

export const useDiscipline = () => {
  const { fetcher } = useApi()
  const pointRules = useState<any[]>('discipline_rules', () => [])
  const studentRecords = useState<any[]>('student_point_records', () => [])

  const fetchPointRules = async (schoolId: string) => {
    if (!schoolId || typeof schoolId !== 'string') return
    try {
      const res: any = await fetcher(`/school/${schoolId}/discipline/rules`)
      if (res.success) {
        pointRules.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch point rules:', error)
    }
  }

  const createPointRule = async (schoolId: string, data: any) => {
    if (!schoolId || typeof schoolId !== 'string') {
      throw new Error('School ID is required')
    }
    const res: any = await fetcher(`/school/${schoolId}/discipline/rules`, {
      method: 'POST',
      body: data
    })
    await fetchPointRules(schoolId)
    return res
  }

  const updatePointRule = async (schoolId: string, id: string, data: any) => {
    if (!schoolId || typeof schoolId !== 'string' || !id) {
      throw new Error('School ID and Rule ID are required')
    }
    const res: any = await fetcher(`/school/${schoolId}/discipline/rules/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchPointRules(schoolId)
    return res
  }

  const deletePointRule = async (schoolId: string, id: string) => {
    if (!schoolId || typeof schoolId !== 'string' || !id) {
      throw new Error('School ID and Rule ID are required')
    }
    const res = await fetcher(`/school/${schoolId}/discipline/rules/${id}`, {
      method: 'DELETE'
    })
    await fetchPointRules(schoolId)
    return res
  }

  const fetchStudentRecords = async (schoolId: string, studentId: string, academicYearId: string) => {
    if (!schoolId || typeof schoolId !== 'string' || !studentId || !academicYearId) return
    try {
      const res: any = await fetcher(`/school/${schoolId}/discipline/students/${studentId}/points?academic_year_id=${academicYearId}`)
      if (res.success) {
        studentRecords.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch student records:', error)
    }
  }

  const createStudentRecord = async (schoolId: string, data: any) => {
    if (!schoolId || typeof schoolId !== 'string') {
      throw new Error('School ID is required')
    }
    const res: any = await fetcher(`/school/${schoolId}/discipline/points`, {
      method: 'POST',
      body: data
    })
    return res
  }

  return {
    pointRules,
    studentRecords,
    fetchPointRules,
    createPointRule,
    updatePointRule,
    deletePointRule,
    fetchStudentRecords,
    createStudentRecord
  }
}
