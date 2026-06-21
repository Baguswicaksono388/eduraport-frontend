import { useApi } from './useApi'

export const useGradebook = () => {
  const { fetcher } = useApi()

  const fetchSchemes = async (schoolId: string) => {
    return await fetcher(`/school/${schoolId}/gradebook`)
  }

  const fetchSchemeByClassAndSubject = async (
    schoolId: string,
    classId: string,
    subjectId: string,
    academicYearId: string,
    semester: string
  ) => {
    return await fetcher(`/school/${schoolId}/gradebook`, {
      query: { class_id: classId, subject_id: subjectId, academic_year_id: academicYearId, semester }
    })
  }

  const fetchSchemeById = async (schoolId: string, id: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/${id}`)
  }

  const createScheme = async (schoolId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/gradebook`, {
      method: 'POST',
      body: data
    })
  }

  const updateScheme = async (schoolId: string, id: string, data: any) => {
    return await fetcher(`/school/${schoolId}/gradebook/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  const deleteScheme = async (schoolId: string, id: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/${id}`, {
      method: 'DELETE'
    })
  }

  const createGroup = async (schoolId: string, schemeId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/gradebook/${schemeId}/group`, {
      method: 'POST',
      body: data
    })
  }

  const updateGroup = async (schoolId: string, groupId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/gradebook/group/${groupId}`, {
      method: 'PUT',
      body: data
    })
  }

  const deleteGroup = async (schoolId: string, groupId: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/group/${groupId}`, {
      method: 'DELETE'
    })
  }

  const createComponent = async (schoolId: string, groupId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/gradebook/group/${groupId}/component`, {
      method: 'POST',
      body: data
    })
  }

  const updateComponent = async (schoolId: string, componentId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/gradebook/component/${componentId}`, {
      method: 'PUT',
      body: data
    })
  }

  const deleteComponent = async (schoolId: string, componentId: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/component/${componentId}`, {
      method: 'DELETE'
    })
  }

  const fetchSchemeScores = async (schoolId: string, schemeId: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/${schemeId}/scores`)
  }

  const upsertScore = async (schoolId: string, componentId: string, studentId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/gradebook/score/component/${componentId}/student/${studentId}`, {
      method: 'PUT',
      body: data
    })
  }

  const bulkUpsertScores = async (schoolId: string, componentId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/gradebook/score/component/${componentId}/bulk`, {
      method: 'POST',
      body: data
    })
  }

  const finalizeScores = async (schoolId: string, componentId: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/score/component/${componentId}/finalize`, {
      method: 'POST'
    })
  }

  const saveFinalGrades = async (schoolId: string, schemeId: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/${schemeId}/finalize`, {
      method: 'POST'
    })
  }

  const fetchScoreLogs = async (schoolId: string, scoreId: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/score/${scoreId}/logs`)
  }

  const fetchKkm = async (
    schoolId: string,
    subjectId: string,
    classId: string,
    academicYearId: string,
    semester: string
  ) => {
    return await fetcher(`/school/${schoolId}/gradebook/kkm/subject/${subjectId}/class/${classId}`, {
      query: { academic_year_id: academicYearId, semester }
    })
  }

  const upsertKkm = async (schoolId: string, data: any) => {
    return await fetcher(`/school/${schoolId}/gradebook/kkm`, {
      method: 'POST',
      body: data
    })
  }

  const deleteKkm = async (schoolId: string, kkmId: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/kkm/${kkmId}`, {
      method: 'DELETE'
    })
  }

  const fetchClassRecapitulation = async (
    schoolId: string,
    classId: string,
    academicYearId: string,
    semester: string
  ) => {
    return await fetcher(`/school/${schoolId}/gradebook/analytics/recapitulation`, {
      query: { class_id: classId, academic_year_id: academicYearId, semester }
    })
  }

  const fetchClassDistribution = async (schoolId: string, params: any) => {
    return await fetcher(`/school/${schoolId}/gradebook/analytics/distribution`, {
      query: params
    })
  }

  const fetchStudentProgression = async (schoolId: string, studentId: string) => {
    return await fetcher(`/school/${schoolId}/gradebook/analytics/student-progression/${studentId}`)
  }

  const fetchEarlyWarning = async (
    schoolId: string,
    classId: string,
    academicYearId: string,
    semester: string
  ) => {
    return await fetcher(`/school/${schoolId}/gradebook/analytics/early-warning`, {
      query: { class_id: classId, academic_year_id: academicYearId, semester }
    })
  }

  return {
    fetchSchemes,
    fetchSchemeByClassAndSubject,
    fetchSchemeById,
    createScheme,
    updateScheme,
    deleteScheme,
    createGroup,
    updateGroup,
    deleteGroup,
    createComponent,
    updateComponent,
    deleteComponent,
    fetchSchemeScores,
    upsertScore,
    bulkUpsertScores,
    finalizeScores,
    saveFinalGrades,
    fetchScoreLogs,
    fetchKkm,
    upsertKkm,
    deleteKkm,
    fetchClassRecapitulation,
    fetchClassDistribution,
    fetchStudentProgression,
    fetchEarlyWarning
  }
}

