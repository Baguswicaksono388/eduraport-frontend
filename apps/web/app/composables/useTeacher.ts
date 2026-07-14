import { useApi } from './useApi'
import { computed } from 'vue'

export const useTeacher = () => {
  const { fetcher } = useApi()
  const teachers = useState<any[]>('teachers', () => [])
  const teachersMeta = useState<any>('teachers_meta', () => null)
  const totalTeachers = computed(() => teachersMeta.value?.total_item || 0)

  const fetchTeachers = async (schoolId: string, page = 1, itemPerPage = 10) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/teacher`, {
        query: { page, item_per_page: itemPerPage }
      })
      if (res.success) {
        teachers.value = res.data.data
        teachersMeta.value = {
          page: res.data.page,
          item_per_page: res.data.item_per_page,
          total_item: res.data.total_item,
          total_page: res.data.total_page,
          list_pagination: res.data.list_pagination
        }
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  const createTeacher = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/teacher`, {
      method: 'POST',
      body: data
    })
    await fetchTeachers(schoolId, teachersMeta.value?.page || 1, teachersMeta.value?.item_per_page || 10)
    return res
  }

  const updateTeacher = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/teacher/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchTeachers(schoolId, teachersMeta.value?.page || 1, teachersMeta.value?.item_per_page || 10)
    return res
  }

  const deleteTeacher = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/teacher/${id}`, {
      method: 'DELETE'
    })
    await fetchTeachers(schoolId, teachersMeta.value?.page || 1, teachersMeta.value?.item_per_page || 10)
    return res
  }

  const downloadTemplate = async (schoolId: string) => {
    try {
      const blob: any = await fetcher(`/school/${schoolId}/teacher/xls`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'template-import-guru.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download template:', error)
      throw error
    }
  }

  const importTeachers = async (schoolId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res: any = await fetcher(`/school/${schoolId}/teacher/xls`, {
      method: 'POST',
      body: formData
    })
    await fetchTeachers(schoolId, teachersMeta.value?.page || 1, teachersMeta.value?.item_per_page || 10)
    return res
  }

  return {
    teachers,
    teachersMeta,
    totalTeachers,
    fetchTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    downloadTemplate,
    importTeachers
  }
}
