import { useApi } from './useApi'

export const useAcademicYear = () => {
  const { fetcher } = useApi()
  const academicYears = useState<any[]>('academic_years', () => [])

  const fetchAcademicYears = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/academic-year`)
      if (res.success) {
        academicYears.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error)
    }
  }

  const createAcademicYear = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/academic-year`, {
      method: 'POST',
      body: data
    })
    await fetchAcademicYears(schoolId)
    return res
  }

  const updateAcademicYear = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/academic-year/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchAcademicYears(schoolId)
    return res
  }

  const deleteAcademicYear = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/academic-year/${id}`, {
      method: 'DELETE'
    })
    await fetchAcademicYears(schoolId)
    return res
  }

  const activateAcademicYear = async (schoolId: string, id: string) => {
    const res: any = await fetcher(`/school/${schoolId}/academic-year/${id}/activate`, {
      method: 'PUT'
    })
    await fetchAcademicYears(schoolId)
    return res
  }

  return {
    academicYears,
    fetchAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    activateAcademicYear
  }
}
