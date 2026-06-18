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

  return {
    homeroomStudents,
    activeExtracurriculars,
    fetchHomeroomData,
    saveHomeroomData,
    downloadTemplate,
    importTemplate
  }
}
