import { useApi } from './useApi'

export const useReportTemplate = () => {
  const { fetcher } = useApi()
  const reportTemplates = useState<any[]>('reportTemplates', () => [])
  const currentTemplate = useState<any>('currentTemplate', () => null)

  const fetchReportTemplates = async (schoolId: string, level?: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/report-template`, {
        query: level ? { level } : {}
      })
      if (res.success) {
        reportTemplates.value = res.data
      }
    } catch (error) {
      console.error('Failed to fetch report templates:', error)
    }
  }

  const fetchReportTemplateById = async (schoolId: string, id: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/report-template/${id}`)
      if (res.success) {
        currentTemplate.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch report template detail:', error)
      throw error
    }
  }

  const createReportTemplate = async (schoolId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/report-template`, {
      method: 'POST',
      body: data
    })
    await fetchReportTemplates(schoolId)
    return res
  }

  const updateReportTemplate = async (schoolId: string, id: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/report-template/${id}`, {
      method: 'PUT',
      body: data
    })
    await fetchReportTemplates(schoolId)
    return res
  }

  const deleteReportTemplate = async (schoolId: string, id: string) => {
    const res = await fetcher(`/school/${schoolId}/report-template/${id}`, {
      method: 'DELETE'
    })
    await fetchReportTemplates(schoolId)
    return res
  }

  const addAssessmentElement = async (schoolId: string, templateId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/report-template/${templateId}/element`, {
      method: 'POST',
      body: data
    })
    await fetchReportTemplateById(schoolId, templateId)
    return res
  }

  const updateAssessmentElement = async (schoolId: string, templateId: string, elementId: string, data: any) => {
    const res: any = await fetcher(`/school/${schoolId}/report-template/${templateId}/element/${elementId}`, {
      method: 'PUT',
      body: data
    })
    await fetchReportTemplateById(schoolId, templateId)
    return res
  }

  const deleteAssessmentElement = async (schoolId: string, templateId: string, elementId: string) => {
    const res = await fetcher(`/school/${schoolId}/report-template/${templateId}/element/${elementId}`, {
      method: 'DELETE'
    })
    await fetchReportTemplateById(schoolId, templateId)
    return res
  }

  return {
    reportTemplates,
    currentTemplate,
    fetchReportTemplates,
    fetchReportTemplateById,
    createReportTemplate,
    updateReportTemplate,
    deleteReportTemplate,
    addAssessmentElement,
    updateAssessmentElement,
    deleteAssessmentElement
  }
}
