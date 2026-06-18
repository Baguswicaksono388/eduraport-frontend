import { useApi } from './useApi'

export const useStudent = () => {
  const { fetcher } = useApi()
  const config = useRuntimeConfig()
  const token = useCookie('auth_token')
  const students = useState<any[]>('students', () => [])
  const totalStudents = useState<number>('total_students', () => 0)

  const fetchStudents = async (schoolId: string, page = 1, limit = 20) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/student`, {
        query: { page, limit }
      })
      if (res.success) {
        students.value = res.data.data
        totalStudents.value = res.data.meta.total
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const createStudent = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/student`, {
      method: 'POST',
      body: data
    })
    await fetchStudents(schoolId)
    return res
  }

  const updateStudent = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/student/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchStudents(schoolId)
    return res
  }

  const deleteStudent = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/student/${id}`, {
      method: 'DELETE'
    })
    await fetchStudents(schoolId)
    return res
  }

  // ─── Download Excel template ─────────────────────────────────
  const downloadTemplate = async (schoolId: string) => {
    const blob: any = await fetcher(`/school/${schoolId}/student/xls`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-import-siswa.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Import students from Excel file ─────────────────────────
  const importStudents = async (schoolId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetcher(`/school/${schoolId}/student/xls`, {
      method: 'POST',
      body: formData
    })
    await fetchStudents(schoolId)
    return res
  }

  return {
    students,
    totalStudents,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    downloadTemplate,
    importStudents,
  }
}
