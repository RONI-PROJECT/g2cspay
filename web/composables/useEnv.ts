// Mode akun: selalu 'live'. Tombol toggle Live/Sandbox di header sudah dihapus,
// jadi state disetel permanen ke live agar merchant tidak terjebak di mode sandbox.
// Halaman Sandbox tetap berfungsi lewat endpoint /api/sandbox/*.
export function useEnv() {
  const env = useState<'live' | 'sandbox'>('cspay_env', () => 'live')
  const setEnv = (_v: 'live' | 'sandbox') => { env.value = 'live' }
  const isSandbox = computed(() => false)
  return { env, setEnv, isSandbox }
}
