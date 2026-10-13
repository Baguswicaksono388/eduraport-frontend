import { useApi } from './useApi'

export const useAnnouncement = () => {
  const { fetcher } = useApi()
  const announcements = useState<any[]>('school_announcements', () => [])
  const announcementsMeta = useState<any>('school_announcements_meta', () => ({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1
  }))
  const loading = ref(false)

  const fetchSchoolAnnouncements = async (
    schoolId: string, 
    params: {
      target_type?: string
      target_class_id?: string
      search?: string
      page?: number
      limit?: number
    } = {}
  ) => {
    loading.value = true
    try {
      const searchParams = new URLSearchParams()
      if (params.target_type && params.target_type !== 'all') searchParams.append('target_type', params.target_type)
      if (params.target_class_id) searchParams.append('target_class_id', params.target_class_id)
      if (params.search) searchParams.append('search', params.search)
      if (params.page) searchParams.append('page', String(params.page))
      if (params.limit) searchParams.append('limit', String(params.limit))
      
      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : ''
      const res: any = await fetcher(`/school/${schoolId}/announcements${queryStr}`)
      if (res.success) {
        announcements.value = res.data?.data || []
        announcementsMeta.value = res.data?.meta || { total: 0, page: 1, limit: 10, total_pages: 1 }
      }
      return res
    } catch (error) {
      console.error('Failed to fetch school announcements:', error)
      announcements.value = []
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchAnnouncementDetail = async (schoolId: string, id: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/announcements/${id}`)
      return res.data
    } catch (error) {
      console.error('Failed to fetch announcement detail:', error)
      throw error
    }
  }

  const createAnnouncement = async (
    schoolId: string, 
    payload: {
      title: string
      content: string
      target_type: 'school' | 'class'
      target_class_id?: string | null
    }
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/announcements`, {
        method: 'POST',
        body: payload
      })
      return res
    } catch (error) {
      console.error('Failed to create announcement:', error)
      throw error
    }
  }

  const updateAnnouncement = async (
    schoolId: string, 
    id: string, 
    payload: {
      title?: string
      content?: string
      target_type?: 'school' | 'class'
      target_class_id?: string | null
    }
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/announcements/${id}`, {
        method: 'PUT',
        body: payload
      })
      return res
    } catch (error) {
      console.error('Failed to update announcement:', error)
      throw error
    }
  }

  const deleteAnnouncement = async (schoolId: string, id: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/announcements/${id}`, {
        method: 'DELETE'
      })
      return res
    } catch (error) {
      console.error('Failed to delete announcement:', error)
      throw error
    }
  }

  return {
    announcements,
    announcementsMeta,
    loading,
    fetchSchoolAnnouncements,
    fetchAnnouncementDetail,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  }
}
