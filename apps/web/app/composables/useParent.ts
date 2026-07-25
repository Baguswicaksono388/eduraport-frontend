import { useApi } from './useApi'

export const useParent = () => {
  const { fetcher } = useApi()
  const parents = useState<any[]>('parents', () => [])
  const myChildren = useState<any[]>('myChildren', () => [])

  const fetchMyChildren = async () => {
    try {
      const res: any = await fetcher('/parents/my-students')
      if (res.success) {
        myChildren.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch my children:', error)
      myChildren.value = []
    }
  }

  const fetchChildDetail = async (studentId: string, startDate?: string, endDate?: string) => {
    try {
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      
      const queryString = query.toString() ? `?${query.toString()}` : '';
      const res: any = await fetcher(`/parents/my-students/${studentId}${queryString}`)
      if (res.success) {
        return res.data
      }
      return null
    } catch (error) {
      console.error('Failed to fetch child detail:', error)
      return null
    }
  }

  const fetchParents = async (schoolId: string, studentId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/student/${studentId}/parents`)
      if (res.success) {
        parents.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch parents:', error)
      parents.value = []
    }
  }

  const allParents = useState<any[]>('allParents', () => [])
  const allParentsMeta = useState<any>('allParentsMeta', () => null)
  
  const fetchAllParents = async (schoolId: string, page?: number, limit?: number, search?: string, status?: 'linked' | 'unlinked' | 'all', foundationId?: string) => {
    try {
      const query = new URLSearchParams()
      if (page) query.append('page', page.toString())
      if (limit) query.append('limit', limit.toString())
      if (search) query.append('search', search)
      if (status) query.append('status', status)
      
      let endpoint = `/school/${schoolId}/student/parents/all?${query.toString()}`
      
      if (status === 'unlinked' && foundationId) {
        const foundationQuery = new URLSearchParams()
        if (page) foundationQuery.append('page', page.toString())
        if (limit) foundationQuery.append('limit', limit.toString())
        if (search) foundationQuery.append('search', search)
        foundationQuery.append('foundationId', foundationId)
        
        endpoint = `/parents/unlinked?${foundationQuery.toString()}`
      }
      
      const res: any = await fetcher(endpoint)
      if (res.success) {
        allParents.value = res.data.parents
        allParentsMeta.value = res.data.meta
      }
    } catch (error) {
      console.error('Failed to fetch all parents:', error)
      allParents.value = []
      allParentsMeta.value = null
    }
  }

  const createParent = async (schoolId: string, data: any) => {
    const res = await fetcher(`/school/${schoolId}/student/parents`, {
      method: 'POST',
      body: data
    })
    return res
  }

  const updateParent = async (schoolId: string, id: string, data: any) => {
    const res = await fetcher(`/school/${schoolId}/student/parents/${id}`, {
      method: 'PUT',
      body: data
    })
    return res
  }

  const deleteParent = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/student/parents/${id}`, {
      method: 'DELETE'
    })
    return res
  }

  return {
    parents,
    allParents,
    allParentsMeta,
    myChildren,
    fetchMyChildren,
    fetchChildDetail,
    fetchParents,
    fetchAllParents,
    createParent,
    updateParent,
    deleteParent
  }
}
