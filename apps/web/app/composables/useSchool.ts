import { useApi } from './useApi'

export const useSchool = () => {
  const { fetcher } = useApi()
  const schools = useState<any[]>('schools', () => [])
  const foundations = useState<any[]>('foundations', () => [])
  const curriculums = useState<any[]>('curriculums', () => [])
  const curriculumCategories = useState<any[]>('curriculumCategories', () => [])
  const currentSchoolId = useCookie('current_school_id')

  const fetchFoundations = async () => {
    try {
      const res: any = await fetcher('/management/foundation')
      foundations.value = res.data
    } catch (error) {
      console.error('Failed to fetch foundations:', error)
    }
  }

  const createFoundation = async (data: any) => {
    const res: any = await fetcher('/management/foundation', {
      method: 'POST',
      body: data
    })
    await fetchFoundations()
    return res
  }

  const deleteFoundation = async (id: string) => {
    const res = await fetcher(`/management/foundation/${id}`, {
      method: 'DELETE'
    })
    await fetchFoundations()
    return res
  }

  const updateFoundation = async (id: string, data: any) => {
    const res: any = await fetcher(`/management/foundation/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchFoundations()
    return res
  }

  const fetchCurriculums = async (foundationId: string) => {
    try {
      const res: any = await fetcher(`/management/curriculum/foundation/${foundationId}`)
      curriculums.value = res.data
    } catch (error) {
      console.error('Failed to fetch curriculums:', error)
    }
  }

  const createCurriculum = async (data: any) => {
    const res: any = await fetcher('/management/curriculum', {
      method: 'POST',
      body: data
    })
    await fetchCurriculums(data.foundation_id)
    return res
  }

  const updateCurriculum = async (id: string, data: any) => {
    const res: any = await fetcher(`/management/curriculum/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchCurriculums(data.foundation_id)
    return res
  }

  const deleteCurriculum = async (id: string, foundationId: string) => {
    const res = await fetcher(`/management/curriculum/${id}`, {
      method: 'DELETE'
    })
    await fetchCurriculums(foundationId)
    return res
  }

  const fetchSchools = async (foundationId: string) => {
    try {
      const res: any = await fetcher(`/management/school/foundation/${foundationId}`)
      schools.value = res.data
      
      // If user has an assigned school_id, always lock to that school
      const { user } = useAuth()
      if (user.value?.school_id) {
        // Lock to assigned school regardless
        currentSchoolId.value = user.value.school_id
      } else {
        // Foundation-level users: auto-set first school if current is invalid
        const exists = schools.value.some(s => s.id === currentSchoolId.value)
        if (schools.value.length > 0 && (!currentSchoolId.value || !exists)) {
          currentSchoolId.value = schools.value[0].id
        }
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error)
    }
  }

  const createSchool = async (data: any) => {
    const res: any = await fetcher('/management/school', {
      method: 'POST',
      body: data
    })
    await fetchSchools(data.foundation_id)
    return res
  }

  const updateSchool = async (id: string, data: any) => {
    const res: any = await fetcher(`/management/school/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchSchools(data.foundation_id)
    return res
  }

  const deleteSchool = async (id: string, foundationId: string) => {
    const res = await fetcher(`/management/school/${id}`, {
      method: 'DELETE'
    })
    await fetchSchools(foundationId)
    return res
  }

  // Curriculum Subject Categories CRUD
  const fetchCurriculumCategories = async (curriculumId: string) => {
    try {
      const res: any = await fetcher(`/management/curriculum/${curriculumId}/category`)
      curriculumCategories.value = res.data
    } catch (error) {
      console.error('Failed to fetch curriculum categories:', error)
    }
  }

  const createCurriculumCategory = async (data: any) => {
    const res: any = await fetcher('/management/curriculum/category', {
      method: 'POST',
      body: data
    })
    await fetchCurriculumCategories(data.curriculum_id)
    return res
  }

  const updateCurriculumCategory = async (id: string, data: any) => {
    const res: any = await fetcher(`/management/curriculum/category/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchCurriculumCategories(data.curriculum_id)
    return res
  }

  const deleteCurriculumCategory = async (id: string, curriculumId: string) => {
    const res = await fetcher(`/management/curriculum/category/${id}`, {
      method: 'DELETE'
    })
    await fetchCurriculumCategories(curriculumId)
    return res
  }

  const p5Dimensions = useState<any[]>('p5Dimensions', () => [])

  const fetchP5Dimensions = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/management/school/${schoolId}/p5-dimensions`)
      p5Dimensions.value = res.data
    } catch (error) {
      console.error('Failed to fetch P5 dimensions:', error)
    }
  }

  const createP5Dimension = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/management/school/${schoolId}/p5-dimensions`, {
      method: 'POST',
      body: data
    })
    await fetchP5Dimensions(schoolId)
    return res
  }

  const updateP5Dimension = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/management/school/${schoolId}/p5-dimensions/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchP5Dimensions(schoolId)
    return res
  }

  const deleteP5Dimension = async (schoolId: string, id: string) => {
    const res = await fetcher(`/management/school/${schoolId}/p5-dimensions/${id}`, {
      method: 'DELETE'
    })
    await fetchP5Dimensions(schoolId)
    return res
  }

  const currentSchool = computed(() => 
    schools.value.find(s => s.id === currentSchoolId.value) || schools.value[0]
  )

  return {
    schools,
    foundations,
    curriculums,
    curriculumCategories,
    currentSchoolId,
    currentSchool,
    p5Dimensions,
    fetchP5Dimensions,
    createP5Dimension,
    updateP5Dimension,
    deleteP5Dimension,
    fetchFoundations,
    createFoundation,
    updateFoundation,
    deleteFoundation,
    fetchCurriculums,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    fetchCurriculumCategories,
    createCurriculumCategory,
    updateCurriculumCategory,
    deleteCurriculumCategory,
    fetchSchools,
    createSchool,
    updateSchool,
    deleteSchool
  }
}
