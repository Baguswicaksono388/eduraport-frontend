import { useApi } from './useApi'

export const useClass = () => {
  const { fetcher } = useApi()
  const classes = useState<any[]>('classes', () => [])
  const classStudents = useState<any[]>('class_students', () => [])
  const teachers = useState<any[]>('class_teachers', () => [])

  const fetchClasses = async (schoolId: string, academicYearId?: string) => {
    try {
      const res: any = await fetcher(`/sekolah/${schoolId}/kelas`, {
        query: academicYearId ? { academic_year_id: academicYearId } : {}
      })
      if (res.success) {
        classes.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchClassStudents = async (schoolId: string, classId: string) => {
    try {
      const res: any = await fetcher(`/sekolah/${schoolId}/kelas/${classId}/siswa`)
      if (res.success) {
        classStudents.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch students in class:', error)
    }
  }

  const fetchTeachers = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/sekolah/${schoolId}/kelas/guru`)
      if (res.success) {
        teachers.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  const createClass = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/sekolah/${schoolId}/kelas`, {
      method: 'POST',
      body: data
    })
    await fetchClasses(schoolId, data.academic_year_id)
    return res
  }

  const updateClass = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/sekolah/${schoolId}/kelas/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchClasses(schoolId, data.academic_year_id)
    return res
  }

  const deleteClass = async (schoolId: string, id: string, academicYearId?: string) => {
    const res = await fetcher(`/sekolah/${schoolId}/kelas/${id}`, {
      method: 'DELETE'
    })
    await fetchClasses(schoolId, academicYearId)
    return res
  }

  return {
    classes,
    classStudents,
    teachers,
    fetchClasses,
    fetchClassStudents,
    fetchTeachers,
    createClass,
    updateClass,
    deleteClass
  }
}
