import { useApi } from './useApi'

export const useDiscipline = () => {
  const { fetcher } = useApi()
  const pointRules = useState<any[]>('discipline_rules', () => [])
  const studentRecords = useState<any[]>('student_point_records', () => [])

  const fetchPointRules = async () => {
    try {
      const res: any = await fetcher(`/discipline/rules`)
      if (res.success) {
        pointRules.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch point rules:', error)
    }
  }

  const createPointRule = async (data: any) => {
    const res: any = await fetcher(`/discipline/rules`, {
      method: 'POST',
      body: data
    })
    await fetchPointRules()
    return res
  }

  const updatePointRule = async (id: string, data: any) => {
    const res: any = await fetcher(`/discipline/rules/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchPointRules()
    return res
  }

  const deletePointRule = async (id: string) => {
    const res = await fetcher(`/discipline/rules/${id}`, {
      method: 'DELETE'
    })
    await fetchPointRules()
    return res
  }

  const fetchStudentRecords = async (studentId: string, academicYearId: string) => {
    try {
      const res: any = await fetcher(`/discipline/students/${studentId}/points?academic_year_id=${academicYearId}`)
      if (res.success) {
        studentRecords.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch student records:', error)
    }
  }

  const createStudentRecord = async (data: any) => {
    const res: any = await fetcher(`/discipline/points`, {
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
