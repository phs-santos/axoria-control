export default defineNuxtRouteMiddleware((to) => {
  // Não executa no servidor pois a autenticação depende do localStorage
  if (process.server) return

  const { isAuthenticated, hydrated, init } = useAuth()

  // Ensure auth is initialized on client side
  if (!hydrated.value) {
    init()
  }

  // Allow access to login page
  if (to.path === '/login') {
    if (isAuthenticated.value) {
      const target = (to.query.redirect as string) || '/dashboard'
      return navigateTo(target)
    }
    return
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    })
  }
})
