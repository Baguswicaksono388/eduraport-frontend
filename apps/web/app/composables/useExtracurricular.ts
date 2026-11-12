import { useApi } from './useApi'

export const useExtracurricular = () => {
  const { fetcher } = useApi()
  const extracurriculars = useState<any[]>('extracurriculars', () => [])

  const fetchExtracurriculars = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/extracurricular`)
      if (res.success) {
        extracurriculars.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch extracurriculars:', error)
    }
  }

  const createExtracurricular = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/extracurricular`, {
      method: 'POST',
      body: data
    })
    await fetchExtracurriculars(schoolId)
    return res
  }

  const updateExtracurricular = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/extracurricular/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchExtracurriculars(schoolId)
    return res
  }

  const deleteExtracurricular = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/extracurricular/${id}`, {
      method: 'DELETE'
    })
    await fetchExtracurriculars(schoolId)
    return res
  }

  const fetchExtracurricularMembers = async (
    schoolId: string,
    ekskulId: string,
    academicYearId?: string,
    date?: string
  ) => {
    const params = new URLSearchParams()
    if (academicYearId) params.set('academic_year_id', academicYearId)
    if (date) params.set('date', date)
    const qs = params.toString()
    const url = `/school/${schoolId}/extracurricular/${ekskulId}/members${qs ? `?${qs}` : ''}`
    const res: any = await fetcher(url)
    return res.success ? res.data : []
  }

  const saveExtracurricularMembers = async (
    schoolId: string,
    ekskulId: string,
    studentIds: string[],
    academicYearId?: string
  ) => {
    return await fetcher(`/school/${schoolId}/extracurricular/${ekskulId}/members`, {
      method: 'PUT',
      body: {
        student_ids: studentIds,
        ...(academicYearId ? { academic_year_id: academicYearId } : {})
      }
    })
  }

  const cloneExtracurricularMembers = async (
    schoolId: string,
    ekskulId: string,
    sourceAcademicYearId: string,
    targetAcademicYearId?: string
  ) => {
    return await fetcher(`/school/${schoolId}/extracurricular/${ekskulId}/members/clone`, {
      method: 'POST',
      body: {
        source_academic_year_id: sourceAcademicYearId,
        ...(targetAcademicYearId ? { target_academic_year_id: targetAcademicYearId } : {})
      }
    })
  }

  const fetchExtracurricularAttendances = async (schoolId: string, ekskulId: string, date: string) => {
    const res: any = await fetcher(`/school/${schoolId}/extracurricular/${ekskulId}/attendances?date=${date}`)
    return res.success ? res.data : []
  }

  return {
    extracurriculars,
    fetchExtracurriculars,
    createExtracurricular,
    updateExtracurricular,
    deleteExtracurricular,
    fetchExtracurricularMembers,
    saveExtracurricularMembers,
    cloneExtracurricularMembers,
    fetchExtracurricularAttendances
  }
}
