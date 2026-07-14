import { useApi } from './useApi'

export const useStudent = () => {
  const { fetcher } = useApi()
  const config = useRuntimeConfig()
  const token = useCookie('auth_token')
  const students = useState<any[]>('students', () => [])
  const studentsMeta = useState<any>('students_meta', () => null)
  const totalStudents = computed(() => studentsMeta.value?.total_item || 0)

  const fetchStudents = async (schoolId: string, page = 1, itemPerPage = 10) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/student`, {
        query: { page, item_per_page: itemPerPage }
      })
      if (res.success) {
        students.value = res.data.data
        studentsMeta.value = {
          page: res.data.page,
          item_per_page: res.data.item_per_page,
          total_item: res.data.total_item,
          total_page: res.data.total_page,
          list_pagination: res.data.list_pagination
        }
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
    await fetchStudents(schoolId, studentsMeta.value?.page || 1, studentsMeta.value?.item_per_page || 10)
    return res
  }

  const updateStudent = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/student/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchStudents(schoolId, studentsMeta.value?.page || 1, studentsMeta.value?.item_per_page || 10)
    return res
  }

  const deleteStudent = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/student/${id}`, {
      method: 'DELETE'
    })
    await fetchStudents(schoolId, studentsMeta.value?.page || 1, studentsMeta.value?.item_per_page || 10)
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
    await fetchStudents(schoolId, studentsMeta.value?.page || 1, studentsMeta.value?.item_per_page || 10)
    return res
  }

  return {
    students,
    studentsMeta,
    totalStudents,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    downloadTemplate,
    importStudents,
  }
}
