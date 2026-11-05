export const useAuth = () => {
   const user = useState<any>('user', () => null)

   async function fetchMe() {
      try {
         const res: any = await $fetch('/api/auth/me', { credentials: 'include' })
         user.value = res.data
      } catch { user.value = null }
   }

   async function login(email: string, password: string) {
      try {
         const res: any = await $fetch('/api/auth/login', {
            method: 'POST', body: { email, password }, credentials: 'include',
         })
         user.value = res.data.user
         return { ok: true }
      } catch (e: any) {
         return { ok: false, error: e?.data?.error || e.message }
      }
   }

   async function register(email: string, password: string, name: string) {
      try {
         const res: any = await $fetch('/api/auth/register', {
            method: 'POST', body: { email, password, name }, credentials: 'include',
         })
         user.value = res.data.user
         return { ok: true }
      } catch (e: any) {
         return { ok: false, error: e?.data?.error || e.message }
      }
   }

   async function logout() {
      try { await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) } catch {}
      user.value = null
      navigateTo('/login')
   }

   return { user, login, register, logout, fetchMe }
}
