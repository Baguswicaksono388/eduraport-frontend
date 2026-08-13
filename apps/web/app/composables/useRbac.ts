import { computed } from 'vue'
import { useAuth } from './useAuth'

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  PRINCIPAL: 'principal',
  VICE_PRINCIPAL: 'vice_principal_curriculum',
  TEACHER: 'teacher',
  TU: 'tu',
  TREASURER: 'treasurer',
  PARENT: 'parent',
  STUDENT: 'student',
} as const

// Route-to-roles mapping (menu visibility)
export const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard':    ['super_admin', 'principal', 'vice_principal_curriculum', 'treasurer', 'user'],
  '/teacher':      ['super_admin', 'principal', 'tu', 'user'],
  '/student':      ['super_admin', 'principal', 'teacher', 'tu', 'user'],
  '/class':        ['super_admin', 'principal', 'vice_principal_curriculum', 'tu', 'teacher', 'user'],
  '/schedule':     ['super_admin', 'principal', 'vice_principal_curriculum', 'tu', 'teacher', 'user'],
  '/subject':      ['super_admin', 'principal', 'vice_principal_curriculum', 'teacher', 'tu', 'user'],
  '/gradebook':    ['super_admin', 'principal', 'vice_principal_curriculum', 'teacher', 'user'],
  '/homeroom':     ['super_admin', 'principal', 'teacher', 'tu', 'user'],
  '/leave':        ['super_admin', 'principal', 'teacher', 'tu', 'user'],
  '/report':       ['super_admin', 'principal', 'teacher', 'user'],
  '/financial':    ['super_admin', 'principal', 'treasurer', 'tu', 'user'],
  '/ppdb':         ['super_admin', 'principal', 'tu', 'user'],
  '/wa':           ['super_admin', 'principal', 'tu', 'user'],
  '/school':       ['super_admin', 'principal', 'user'],
  '/academic-year':['super_admin', 'principal', 'user'],
  '/attendance-settings': ['super_admin', 'principal', 'tu', 'user'],
  '/extracurricular': ['super_admin', 'principal', 'tu', 'teacher', 'user']
}

export const useRbac = () => {
  const { user } = useAuth()

  const hasRole = (...roles: string[]) => {
    return roles.length === 0 || (user.value?.role && roles.includes(user.value.role))
  }

  const canAccess = (route: string) => {
    // Check main route prefix
    const mainRoute = '/' + route.split('/')[1]
    const allowed = ROUTE_ROLES[mainRoute]
    if (!allowed) return true
    return hasRole(...allowed)
  }

  const isAdmin = computed(() => hasRole('super_admin', 'principal', 'tu', 'user'))
  const isManagement = computed(() => hasRole('super_admin', 'principal', 'user'))
  const isTeacher = computed(() => hasRole('teacher'))
  const isTreasurer = computed(() => hasRole('treasurer'))
  const isWaAdmin = computed(() => hasRole('super_admin', 'principal', 'tu'))

  return { hasRole, canAccess, isAdmin, isManagement, isTeacher, isTreasurer, isWaAdmin }
}
