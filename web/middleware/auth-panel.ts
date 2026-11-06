export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  try {
    const r: any = await $fetch('/api/admin-panel/me', {
      credentials: 'include',
      ignoreResponseError: true,
    })

    if (!r?.success || !r?.data) {
      return navigateTo('/panel/login')
    }
  } catch {
    return navigateTo('/panel/login')
  }
})
