import { useApi } from './useApi'

export const useSchedule = () => {
  const { fetcher } = useApi()
  const schedules = useState<any[]>('schedules', () => [])

  const fetchSchedules = async (schoolId: string, classId?: string, academicYearId?: string) => {
    try {
      let url = `/school/${schoolId}/schedule`
      const params = new URLSearchParams()
      if (classId) params.append('classId', classId)
      if (academicYearId) params.append('academicYearId', academicYearId)
      
      const queryString = params.toString()
      if (queryString) {
        url += `?${queryString}`
      }
      
      const res: any = await fetcher(url)
      if (res.success) {
        schedules.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    }
  }

  const createSchedule = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/schedule`, {
      method: 'POST',
      body: data
    })
    await fetchSchedules(schoolId, data.class_id)
    return res
  }

  const updateSchedule = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/schedule/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchSchedules(schoolId, data.class_id)
    return res
  }

  const deleteSchedule = async (schoolId: string, id: string, classId?: string) => {
    const res = await fetcher(`/school/${schoolId}/schedule/${id}`, {
      method: 'DELETE'
    })
    await fetchSchedules(schoolId, classId)
    return res
  }

  return {
    schedules,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
  }
}
