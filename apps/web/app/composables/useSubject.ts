import { useApi } from './useApi'
import { computed } from 'vue'

export const useSubject = () => {
  const { fetcher } = useApi()
  const subjects = useState<any[]>('subjects', () => [])
  const subjectsMeta = useState<any>('subjects_meta', () => null)
  const totalSubjects = computed(() => subjectsMeta.value?.total_item || 0)

  const fetchSubjects = async (schoolId: string, page = 1, itemPerPage = 10, type?: string) => {
    try {
      const queryParams: any = { page, item_per_page: itemPerPage }
      if (type) queryParams.type = type

      const res: any = await fetcher(`/school/${schoolId}/subject`, {
        query: queryParams
      })
      if (res.success) {
        subjects.value = res.data.data
        subjectsMeta.value = {
          page: res.data.page,
          item_per_page: res.data.item_per_page,
          total_item: res.data.total_item,
          total_page: res.data.total_page,
          list_pagination: res.data.list_pagination
        }
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    }
  }

  const createSubject = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/subject`, {
      method: 'POST',
      body: data
    })
    await fetchSubjects(schoolId, subjectsMeta.value?.page || 1, subjectsMeta.value?.item_per_page || 10)
    return res
  }

  const updateSubject = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/subject/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchSubjects(schoolId, subjectsMeta.value?.page || 1, subjectsMeta.value?.item_per_page || 10)
    return res
  }

  const deleteSubject = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/subject/${id}`, {
      method: 'DELETE'
    })
    await fetchSubjects(schoolId, subjectsMeta.value?.page || 1, subjectsMeta.value?.item_per_page || 10)
    return res
  }

  return {
    subjects,
    subjectsMeta,
    totalSubjects,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject
  }
}
