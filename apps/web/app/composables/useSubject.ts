import { useApi } from './useApi'

export const useSubject = () => {
  const { fetcher } = useApi()
  const subjects = useState<any[]>('subjects', () => [])

  const fetchSubjects = async (schoolId: string, type?: string) => {
    try {
      const res: any = await fetcher(`/sekolah/${schoolId}/mata-pelajaran`, {
        query: type ? { type } : {}
      })
      if (res.success) {
        subjects.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    }
  }

  const createSubject = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/sekolah/${schoolId}/mata-pelajaran`, {
      method: 'POST',
      body: data
    })
    await fetchSubjects(schoolId)
    return res
  }

  const updateSubject = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/sekolah/${schoolId}/mata-pelajaran/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchSubjects(schoolId)
    return res
  }

  const deleteSubject = async (schoolId: string, id: string) => {
    const res = await fetcher(`/sekolah/${schoolId}/mata-pelajaran/${id}`, {
      method: 'DELETE'
    })
    await fetchSubjects(schoolId)
    return res
  }

  return {
    subjects,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject
  }
}
