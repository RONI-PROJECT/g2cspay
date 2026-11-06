export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  const runGuard = async () => {
    if (typeof window === 'undefined') return

    const path = window.location.pathname

    // Route publik
    const publicRoutes = [
      '/', '/login', '/register', '/docs', '/tos',
      '/privacy', '/disclaimer', '/maintenance', '/panel/login'
    ]
    const isPublic = publicRoutes.some(r => path === r || path.startsWith(r + '/'))
    if (isPublic) return
    if (path.startsWith('/pay/')) return

    // Panel admin
    if (path.startsWith('/panel')) {
      try {
        const r: any = await $fetch('/api/admin-panel/me', {
          credentials: 'include',
          ignoreResponseError: true,
        })
        if (!r?.success || !r?.data) {
          router.push('/panel/login')
        }
      } catch {
        router.push('/panel/login')
      }
      return
    }

    // Merchant (default)
    try {
      const r: any = await $fetch('/api/auth/me', {
        credentials: 'include',
        ignoreResponseError: true,
      })
      if (!r?.success || !r?.data) {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    }
  }

  // Jalan saat app siap
  nuxtApp.hook('app:mounted', () => {
    runGuard()
  })

  // Jalan setiap navigasi
  router.afterEach(() => {
    runGuard()
  })
})
