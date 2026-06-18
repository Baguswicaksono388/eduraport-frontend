import { useApi } from './useApi'

export const useTeacher = () => {
  const { fetcher } = useApi()
  const teachers = useState<any[]>('teachers', () => [])

  const fetchTeachers = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/teacher`)
      if (res.success) {
        teachers.value = res.data
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
    await fetchTeachers(schoolId)
    return res
  }

  const updateTeacher = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/teacher/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchTeachers(schoolId)
    return res
  }

  const deleteTeacher = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/teacher/${id}`, {
      method: 'DELETE'
    })
    await fetchTeachers(schoolId)
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
    await fetchTeachers(schoolId)
    return res
  }

  return {
    teachers,
    fetchTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    downloadTemplate,
    importTeachers
  }
}
