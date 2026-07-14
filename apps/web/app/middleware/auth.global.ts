import { ROUTE_ROLES } from '../composables/useRbac'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for public routes
  if (
    to.path === '/login' ||
    to.path === '/register' ||
    to.path === '/landing' ||
    to.path.startsWith('/ppdb/public') ||
    to.path.includes('/public/status') ||
    to.path.includes('/public/batches') ||
    to.path === '/unauthorized'
  ) {
    return
  }

  const { token, user, fetchUser } = useAuth()

  // Redirect to login if token is missing
  if (!token.value) {
    if (to.path === '/') {
      return navigateTo('/landing')
    }
    return navigateTo('/login')
  }

  // Fetch user details if not loaded yet
  if (!user.value) {
    await fetchUser()
  }

  // Double check if user still failed to load
  if (!user.value) {
    return navigateTo('/login')
  }

  // Auto-set currentSchoolId based on user's school assignment.
  // Users with a school_id (teacher, TU, treasurer, etc.) are locked to their assigned school.
  // Users without school_id (super_admin / foundation level) can pick schools manually.
  if (user.value.school_id) {
    const currentSchoolId = useCookie('current_school_id')
    if (currentSchoolId.value !== user.value.school_id) {
      currentSchoolId.value = user.value.school_id
    }
  }

  // Retrieve allowed roles from route metadata or default ROUTE_ROLES map
  let allowedRoles = to.meta.roles as string[] | undefined

  if (!allowedRoles) {
    // Fallback to routing roles mapping based on path prefix
    const pathSegment = '/' + to.path.split('/')[1]
    allowedRoles = ROUTE_ROLES[pathSegment]
  }

  // Enforce role guards
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.value.role)) {
      return navigateTo('/unauthorized')
    }
  }
})
