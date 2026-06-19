import { useApi } from './useApi'

export const useFinancial = () => {
  const { fetcher } = useApi()
  const billsList = useState<any[]>('bills_list', () => [])
  const accountsList = useState<any[]>('accounts_list', () => [])
  const journalsList = useState<any[]>('journals_list', () => [])
  const categoriesList = useState<any[]>('categories_list', () => [])

  const fetchBills = async (
    schoolId: string,
    filters: { class_id?: string; student_id?: string; status?: string } = {}
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/bills`, {
        query: filters
      })
      if (res.success) {
        billsList.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch bills:', error)
      billsList.value = []
      throw error
    }
  }

  const generateBulkSPP = async (
    schoolId: string,
    payload: {
      class_id: string
      period: string
      amount: string
      due_date: string
      category_id: string
    }
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/bills/bulk`, {
        method: 'POST',
        body: payload
      })
      if (res.success) {
        await fetchBills(schoolId, { class_id: payload.class_id })
      }
      return res
    } catch (error) {
      console.error('Failed to generate bulk bills:', error)
      throw error
    }
  }

  const recordPayment = async (
    schoolId: string,
    payload: {
      bill_id: string
      amount_paid: string
      method: string
      transaction_code?: string | null
    },
    classId?: string
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/payments`, {
        method: 'POST',
        body: payload
      })
      if (res.success) {
        await fetchBills(schoolId, classId ? { class_id: classId } : {})
        await fetchAccounts(schoolId)
        await fetchJournals(schoolId)
      }
      return res
    } catch (error) {
      console.error('Failed to record payment:', error)
      throw error
    }
  }

  const fetchAccounts = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/accounts`)
      if (res.success) {
        accountsList.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
      accountsList.value = []
      throw error
    }
  }

  const fetchJournals = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/journals`)
      if (res.success) {
        journalsList.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch journals:', error)
      journalsList.value = []
      throw error
    }
  }

  const fetchCategories = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/categories`)
      if (res.success) {
        categoriesList.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      categoriesList.value = []
      throw error
    }
  }

  return {
    billsList,
    accountsList,
    journalsList,
    categoriesList,
    fetchBills,
    generateBulkSPP,
    recordPayment,
    fetchAccounts,
    fetchJournals,
    fetchCategories
  }
}
