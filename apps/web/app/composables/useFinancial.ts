import { useApi } from './useApi'

export const useFinancial = () => {
  const { fetcher } = useApi()
  const billsList = useState<any[]>('bills_list', () => [])
  const accountsList = useState<any[]>('accounts_list', () => [])
  const journalsList = useState<any[]>('journals_list', () => [])
  const journalsMeta = useState<any>('journals_meta', () => ({
    total: 0,
    page: 1,
    limit: 50,
    total_debit: '0',
    total_credit: '0'
  }))
  const categoriesList = useState<any[]>('categories_list', () => [])
  const assetsList = useState<any[]>('assets_list', () => [])
  const settings = useState<any>('settings', () => null)
  const bosComponentsList = useState<any[]>('bos_components_list', () => [])

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

  const previewBulkSPP = async (
    schoolId: string,
    payload: {
      class_ids: string[]
      period: string
      amount: string
      due_date: string
      category_id: string
    }
  ) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/bills/bulk-preview`, {
        method: 'POST',
        body: payload
      })
      return res
    } catch (error) {
      console.error('Failed to preview bulk bills:', error)
      throw error
    }
  }

  const generateBulkSPP = async (
    schoolId: string,
    payload: {
      class_ids: string[]
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
        await fetchBills(schoolId)
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
      bill_ids: string[]
      amount: string
      method: string
      paid_at?: string
      proof_no?: string | null
      note?: string | null
      proof_file_url?: string | null
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

  const getStudentBilling = async (schoolId: string, studentId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/students/${studentId}/billing`)
      return res
    } catch (error) {
      console.error('Failed to get student billing:', error)
      throw error
    }
  }

  const uploadProof = async (schoolId: string, payload: { data: string; file_name: string; mime_type: string }) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/payments/upload-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      return res
    } catch (error) {
      console.error('Failed to upload proof:', error)
      throw error
    }
  }

  const fetchAccounts = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/accounts`)
      accountsList.value = res.data || []
      return res
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
      accountsList.value = []
    }
  }

  const createAccount = async (schoolId: string, payload: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/accounts`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      if (res.success) {
        await fetchAccounts(schoolId)
      }
      return res
    } catch (error) {
      console.error('Failed to create account:', error)
      throw error
    }
  }

  const updateAccount = async (schoolId: string, accountId: string, payload: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/accounts/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      if (res.success) {
        await fetchAccounts(schoolId)
      }
      return res
    } catch (error) {
      console.error('Failed to update account:', error)
      throw error
    }
  }

  const archiveAccount = async (schoolId: string, accountId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/accounts/${accountId}/archive`, {
        method: 'PATCH'
      })
      if (res.success) {
        await fetchAccounts(schoolId)
      }
      return res
    } catch (error) {
      console.error('Failed to archive account:', error)
      throw error
    }
  }

  const fetchJournals = async (schoolId: string, page: number = 1, limit: number = 50) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/journals?page=${page}&limit=${limit}`)
      if (res.success) {
        journalsList.value = res.data.data || []
        if (res.data.meta) {
          journalsMeta.value = res.data.meta
        }
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

  const feeCategoriesList = ref<any[]>([])

  const fetchFeeCategories = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/fee-categories`)
      if (res.success) {
        feeCategoriesList.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch fee categories:', error)
      feeCategoriesList.value = []
      throw error
    }
  }

  const updateFeeCategoryMapping = async (schoolId: string, categoryId: string, revenueAccountId: string | null) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/fee-categories/${categoryId}/account-mapping`, {
        method: 'PATCH',
        body: JSON.stringify({ revenue_account_id: revenueAccountId })
      })
      if (res.success) {
        await fetchFeeCategories(schoolId)
      }
      return res
    } catch (error) {
      console.error('Failed to update fee category mapping:', error)
      throw error
    }
  }

  // --- School Assets API Callers ---
  const fetchAssets = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/assets`)
      if (res.success) {
        assetsList.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch assets:', error)
      assetsList.value = []
      throw error
    }
  }

  const createAsset = async (schoolId: string, payload: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/assets`, {
        method: 'POST',
        body: payload
      })
      if (res.success) {
        await fetchAssets(schoolId)
      }
      return res
    } catch (error) {
      console.error('Failed to create asset:', error)
      throw error
    }
  }

  const deleteAsset = async (schoolId: string, assetId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/assets/${assetId}`, {
        method: 'DELETE'
      })
      if (res.success) {
        await fetchAssets(schoolId)
      }
      return res
    } catch (error) {
      console.error('Failed to delete asset:', error)
      throw error
    }
  }

  const downloadTemplate = async (schoolId: string) => {
    try {
      const blob: any = await fetcher(`/school/${schoolId}/financial/assets/xls`, {
        responseType: 'blob'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'template-import-aset.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download template:', error)
      throw error
    }
  }

  const importAssets = async (schoolId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res: any = await fetcher(`/school/${schoolId}/financial/assets/xls`, {
      method: 'POST',
      body: formData
    })
    await fetchAssets(schoolId)
    return res
  }

  // --- Reports API Callers ---
  const fetchBalanceSheet = async (schoolId: string) => {
    return fetcher(`/school/${schoolId}/financial/reports/balance-sheet`)
  }

  const fetchIncomeStatement = async (schoolId: string) => {
    return fetcher(`/school/${schoolId}/financial/reports/income-statement`)
  }

  const fetchBOSReport = async (schoolId: string) => {
    return fetcher(`/school/${schoolId}/financial/reports/bos`)
  }

  const fetchFoundationReport = async (schoolId: string, foundationId: string) => {
    return fetcher(`/school/${schoolId}/financial/reports/foundation?foundation_id=${foundationId}`)
  }

  const createManualJournal = async (schoolId: string, payload: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/journals`, {
        method: 'POST',
        body: payload
      })
      if (res.success) {
        await Promise.all([
          fetchJournals(schoolId),
          fetchAccounts(schoolId)
        ])
      }
      return res
    } catch (error) {
      console.error('Failed to create manual journal entry:', error)
      throw error
    }
  }

  const reverseJournal = async (schoolId: string, txRef: string, reason: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/journals/${txRef}/reverse`, {
        method: 'POST',
        body: { reason }
      })
      if (res.success) {
        await Promise.all([
          fetchJournals(schoolId),
          fetchAccounts(schoolId)
        ])
      }
      return res
    } catch (error) {
      console.error('Failed to reverse journal entry:', error)
      throw error
    }
  }

  const lockedPeriodsList = ref<any[]>([])

  const fetchLockedPeriods = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/period-locks`)
      if (res.success) {
        lockedPeriodsList.value = res.data?.locks || []
      }
      return res
    } catch (error) {
      console.error('Failed to fetch period locks:', error)
      return { success: false }
    }
  }

  const lockPeriod = async (schoolId: string, year: number, month: number) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/period-locks`, {
        method: 'POST',
        body: { year, month }
      })
      return res
    } catch (error) {
      console.error('Failed to lock period:', error)
      throw error
    }
  }

  const unlockPeriod = async (schoolId: string, year: number, month: number) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/period-locks/unlock`, {
        method: 'POST',
        body: { year, month }
      })
      return res
    } catch (error) {
      console.error('Failed to unlock period:', error)
      throw error
    }
  }

  const fetchBosComponents = async (schoolId: string, filters: { year?: string } = {}) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/bos-components`, {
        query: filters
      })
      if (res.success) {
        bosComponentsList.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch BOS components:', error)
      return { success: false }
    }
  }

  const createBosComponent = async (schoolId: string, payload: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/bos-components`, {
        method: 'POST',
        body: payload
      })
      return res
    } catch (error) {
      console.error('Failed to create BOS component:', error)
      throw error
    }
  }

  const updateBosComponent = async (schoolId: string, id: string, payload: any) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/bos-components/${id}`, {
        method: 'PUT',
        body: payload
      })
      return res
    } catch (error) {
      console.error('Failed to update BOS component:', error)
      throw error
    }
  }

  const deleteBosComponent = async (schoolId: string, id: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/bos-components/${id}`, {
        method: 'DELETE'
      })
      return res
    } catch (error) {
      console.error('Failed to delete BOS component:', error)
      throw error
    }
  }

  const fetchSettings = async (schoolId: string) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/settings`)
      if (res.success) {
        settings.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to fetch financial settings:', error)
      throw error
    }
  }

  const updateSettings = async (schoolId: string, data: { enable_sub_ledger: boolean }) => {
    try {
      const res: any = await fetcher(`/school/${schoolId}/financial/settings`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
      if (res.success) {
        settings.value = res.data
      }
      return res
    } catch (error) {
      console.error('Failed to update financial settings:', error)
      throw error
    }
  }

  return {
    billsList,
    accountsList,
    journalsList,
    journalsMeta,
    categoriesList,
    feeCategoriesList,
    assetsList,
    lockedPeriodsList,
    bosComponentsList,
    settings,
    fetchBills,
    previewBulkSPP,
    generateBulkSPP,
    recordPayment,
    getStudentBilling,
    uploadProof,
    fetchAccounts,
    createAccount,
    updateAccount,
    archiveAccount,
    fetchJournals,
    fetchCategories,
    fetchFeeCategories,
    updateFeeCategoryMapping,
    fetchAssets,
    createAsset,
    deleteAsset,
    downloadTemplate,
    importAssets,
    fetchBalanceSheet,
    fetchIncomeStatement,
    fetchBOSReport,
    fetchFoundationReport,
    createManualJournal,
    reverseJournal,
    fetchLockedPeriods,
    lockPeriod,
    unlockPeriod,
    fetchBosComponents,
    createBosComponent,
    updateBosComponent,
    deleteBosComponent,
    fetchSettings,
    updateSettings
  }
}
