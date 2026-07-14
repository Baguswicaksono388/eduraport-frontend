import { useApi } from './useApi'
import { computed } from 'vue'

export const useClass = () => {
  const { fetcher } = useApi()
  const classes = useState<any[]>('classes', () => [])
  const classesMeta = useState<any>('classes_meta', () => null)
  const totalClasses = computed(() => classesMeta.value?.total_item || 0)
  
  const classStudents = useState<any[]>('class_students', () => [])
  const teachers = useState<any[]>('class_teachers', () => [])

  const fetchClasses = async (schoolId: string, academicYearId?: string, page = 1, itemPerPage = 1000) => {
    try {
      const queryParams: any = { page, item_per_page: itemPerPage }
      if (academicYearId) queryParams.academic_year_id = academicYearId

      const res: any = await fetcher(`/school/${schoolId}/class`, {
        query: queryParams
      })
      if (res.success) {
        classes.value = res.data.data
        classesMeta.value = {
          page: res.data.page,
          item_per_page: res.data.item_per_page,
          total_item: res.data.total_item,
          total_page: res.data.total_page,
          list_pagination: res.data.list_pagination
        }
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const fetchClassStudents = async (schoolId: string, classId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/class/${classId}/student`)
      if (res.success) {
        classStudents.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch students in class:', error)
    }
  }

  const fetchTeachers = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/class/teacher`)
      if (res.success) {
        teachers.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  const createClass = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/class`, {
      method: 'POST',
      body: data
    })
    await fetchClasses(schoolId, data.academic_year_id, classesMeta.value?.page || 1, classesMeta.value?.item_per_page || 10)
    return res
  }

  const updateClass = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/class/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchClasses(schoolId, data.academic_year_id, classesMeta.value?.page || 1, classesMeta.value?.item_per_page || 10)
    return res
  }

  const deleteClass = async (schoolId: string, id: string, academicYearId?: string) => {
    const res = await fetcher(`/school/${schoolId}/class/${id}`, {
      method: 'DELETE'
    })
    await fetchClasses(schoolId, academicYearId, classesMeta.value?.page || 1, classesMeta.value?.item_per_page || 10)
    return res
  }

  return {
    classes,
    classesMeta,
    totalClasses,
    classStudents,
    teachers,
    fetchClasses,
    fetchClassStudents,
    fetchTeachers,
    createClass,
    updateClass,
    deleteClass
  }
}
