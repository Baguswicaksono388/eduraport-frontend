import { useApi } from './useApi'

export const useExtracurricular = () => {
  const { fetcher } = useApi()
  const extracurriculars = useState<any[]>('extracurriculars', () => [])

  const fetchExtracurriculars = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/sekolah/${schoolId}/ekskul`)
      if (res.success) {
        extracurriculars.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch extracurriculars:', error)
    }
  }

  const createExtracurricular = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/sekolah/${schoolId}/ekskul`, {
      method: 'POST',
      body: data
    })
    await fetchExtracurriculars(schoolId)
    return res
  }

  const updateExtracurricular = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/sekolah/${schoolId}/ekskul/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchExtracurriculars(schoolId)
    return res
  }

  const deleteExtracurricular = async (schoolId: string, id: string) => {
    const res = await fetcher(`/sekolah/${schoolId}/ekskul/${id}`, {
      method: 'DELETE'
    })
    await fetchExtracurriculars(schoolId)
    return res
  }

  return {
    extracurriculars,
    fetchExtracurriculars,
    createExtracurricular,
    updateExtracurricular,
    deleteExtracurricular
  }
}
