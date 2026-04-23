export default defineNuxtPlugin((nuxtApp) => {
  const { init } = useAuth()
  
  if (process.client) {
    init()
  }
})
