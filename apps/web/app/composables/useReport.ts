import { useApi } from './useApi'

export const useReport = () => {
  const { fetcher } = useApi()
  const reportsList = useState<any[]>('reports_list', () => [])

  const fetchReports = async (
    schoolId: string,
    classId: string,
    academicYearId: string,
    semester: string
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/report`, {
        query: { class_id: classId, academic_year_id: academicYearId, semester }
      })
      if (res.success) {
        reportsList.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch reports list:', error)
      reportsList.value = []
      throw error
    }
  }

  const generateReports = async (
    schoolId: string,
    payload: {
      class_id: string
      academic_year_id: string
      semester: string
    }
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/report/generate`, {
        method: 'POST',
        body: payload
      })
      if (res.success) {
        await fetchReports(schoolId, payload.class_id, payload.academic_year_id, payload.semester)
      }
      return res
    } catch (error) {
      console.error('Failed to generate reports:', error)
      throw error
    }
  }

  const updateReportStatus = async (
    schoolId: string,
    reportId: string,
    classId: string,
    academicYearId: string,
    semester: string,
    status: string
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/report/${reportId}/status`, {
        method: 'PUT',
        body: { status }
      })
      if (res.success) {
        await fetchReports(schoolId, classId, academicYearId, semester)
      }
      return res
    } catch (error) {
      console.error('Failed to update report status:', error)
      throw error
    }
  }

  const fetchReportDetail = async (schoolId: string, reportId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/report/${reportId}/detail`)
      return res
    } catch (error) {
      console.error('Failed to fetch report detail:', error)
      throw error
    }
  }

  return {
    reportsList,
    fetchReports,
    generateReports,
    updateReportStatus,
    fetchReportDetail
  }
}
