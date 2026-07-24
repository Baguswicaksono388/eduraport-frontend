import { useAuth } from './useAuth'
import { useSchool } from './useSchool'

/**
 * Unified school context composable.
 *
 * - If the logged-in user has a `school_id` (school-level roles such as
 *   teacher, TU, treasurer, vice_principal, etc.) the context is locked
 *   to that school automatically — no foundation/school selectors needed.
 *
 * - If the user has NO `school_id` (super_admin / foundation-level) the
 *   normal foundation → school selection flow is preserved.
 *
 * Usage:
 *   const {
 *     isSchoolLocked,       // true → hide foundation/school dropdowns
 *     selectedFoundationId, // writable ref; ignored when isSchoolLocked
 *     selectedSchoolId,     // writable ref; always correct school
 *     foundations,          // list of foundations (may be empty when locked)
 *     schools,              // list of schools under selected foundation
 *     initContext,          // call in onMounted
 *   } = useSchoolContext()
 */
export const useSchoolContext = () => {
  const { user } = useAuth()
  const {
    foundations,
    schools,
    fetchFoundations,
    fetchSchools,
  } = useSchool()

  /** True when user is locked to a single school (school-level role). */
  const isSchoolLocked = computed(() => !!user.value?.school_id)

  const selectedFoundationId = useState<string>('ctx_foundation_id', () => '')
  const selectedSchoolId = useCookie<string>('current_school_id', { default: () => '' })

  /**
   * Initialise the context. Call this in `onMounted`.
   * Returns the resolved schoolId for use immediately.
   */
  const initContext = async (): Promise<string> => {
    if (isSchoolLocked.value) {
      // School-level user: use their assigned school directly
      selectedSchoolId.value = user.value!.school_id!
      return selectedSchoolId.value
    }

    // Foundation-level user: fetch foundations then auto-pick first school
    await fetchFoundations()
    if (foundations.value.length > 0) {
      if (!selectedFoundationId.value) {
        selectedFoundationId.value = foundations.value[0].id
      }
      await fetchSchools(selectedFoundationId.value)
      
      if (schools.value.length > 0) {
        if (!selectedSchoolId.value || !schools.value.find(s => s.id === selectedSchoolId.value)) {
          selectedSchoolId.value = schools.value[0].id
        }
      }
    }
    return selectedSchoolId.value
  }

  /** Call when foundation changes (only relevant for foundation-level users). */
  const onFoundationChange = async (newFoundationId: string) => {
    if (!newFoundationId || isSchoolLocked.value) return
    await fetchSchools(newFoundationId)
    selectedSchoolId.value = schools.value.length > 0 ? schools.value[0].id : ''
  }

  return {
    isSchoolLocked,
    selectedFoundationId,
    selectedSchoolId,
    foundations,
    schools,
    initContext,
    onFoundationChange,
  }
}
