import { ref } from 'vue'
import { useApi } from './useApi'
import { useToast } from './useToast'

export interface CurriculumElement {
  id: string;
  school_id: string;
  curriculum_id: string | null;
  subject_id: string | null;   // FK ke subjects — CP selalu terikat ke 1 mata pelajaran
  name: string;
  code: string | null;
  level: string | null;        // Fase: A, B, C, D, E, F
  description: string | null;  // Teks lengkap CP
  sort_order: number;
  is_active: boolean;
}

export interface LearningOutcome {
  id: string;
  school_id: string;
  element_id: string | null;
  subject_id: string | null;
  phase: string | null;
  outcome_text: string;
  code: string | null;
  sort_order: number;
  is_active: boolean;
}

export const useCurriculum = () => {
  const { fetcher } = useApi()
  const toast = useToast()

  const elements = ref<CurriculumElement[]>([])
  const outcomes = ref<LearningOutcome[]>([])
  const loading = ref(false)

  const fetchElements = async (schoolId: string, level?: string) => {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (level) query.append('level', level)
      const res: any = await fetcher(`/school/${schoolId}/curriculum-elements?${query.toString()}`)
      elements.value = res.data || []
      return { success: true, data: res.data }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat elemen kurikulum', 'Error')
      return { success: false, error: e }
    } finally {
      loading.value = false
    }
  }

  const fetchOutcomes = async (schoolId: string, elementId?: string, subjectId?: string) => {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (elementId) query.append('element_id', elementId)
      if (subjectId) query.append('subject_id', subjectId)
      const res: any = await fetcher(`/school/${schoolId}/learning-outcomes?${query.toString()}`)
      outcomes.value = res.data || []
      return { success: true, data: res.data }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat tujuan pembelajaran', 'Error')
      return { success: false, error: e }
    } finally {
      loading.value = false
    }
  }

  const createElement = async (schoolId: string, data: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/curriculum-elements`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      toast.success('Elemen berhasil ditambahkan', 'Sukses')
      await fetchElements(schoolId)
      return { success: true, data: res.data }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menambahkan elemen', 'Error')
      return { success: false, error: e }
    }
  }

  const updateElement = async (schoolId: string, id: string, data: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/curriculum-elements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      toast.success('Elemen berhasil diperbarui', 'Sukses')
      await fetchElements(schoolId)
      return { success: true, data: res.data }
    } catch (e: any) {
      return { success: false, error: e }
    }
  }

  const deleteElement = async (schoolId: string, id: string) => {
    try {
      await fetcher(`/school/${schoolId}/curriculum-elements/${id}`, {
        method: 'DELETE'
      })
      toast.success('Elemen berhasil dihapus', 'Sukses')
      await fetchElements(schoolId)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e }
    }
  }

  const createOutcome = async (schoolId: string, data: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/learning-outcomes`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      toast.success('Tujuan pembelajaran berhasil ditambahkan', 'Sukses')
      if (data.element_id) await fetchOutcomes(schoolId, data.element_id)
      return { success: true, data: res.data }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menambahkan tujuan pembelajaran', 'Error')
      return { success: false, error: e }
    }
  }

  const updateOutcome = async (schoolId: string, id: string, data: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/learning-outcomes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      toast.success('Tujuan pembelajaran berhasil diperbarui', 'Sukses')
      if (data.element_id) await fetchOutcomes(schoolId, data.element_id)
      return { success: true, data: res.data }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal mengubah tujuan pembelajaran', 'Error')
      return { success: false, error: e }
    }
  }

  const deleteOutcome = async (schoolId: string, id: string, elementId?: string) => {
    try {
      await fetcher(`/school/${schoolId}/learning-outcomes/${id}`, {
        method: 'DELETE'
      })
      toast.success('Tujuan pembelajaran berhasil dihapus', 'Sukses')
      if (elementId) await fetchOutcomes(schoolId, elementId)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e }
    }
  }

  return {
    elements,
    outcomes,
    loading,
    fetchElements,
    fetchOutcomes,
    createElement,
    updateElement,
    deleteElement,
    createOutcome,
    updateOutcome,
    deleteOutcome
  }
}
