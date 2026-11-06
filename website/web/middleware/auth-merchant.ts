export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  try {
    const r: any = await $fetch('/api/auth/me', {
      credentials: 'include',
      // PENTING: jangan throw di HTTP error
      ignoreResponseError: true,
    })

    // Backend lo balikin { error: 'Login required' } + status 401
    // Jadi kita check: ada success + ada data user
    if (!r?.success || !r?.data?.id) {
      return navigateTo('/login')
    }
  } catch {
    return navigateTo('/login')
  }
})
