<template>
  <div class="page">
    <div class="glow-a" aria-hidden="true"></div>
    <div class="glow-b" aria-hidden="true"></div>

    <div class="card">
      <div class="brand">
        <SiteLogo />
      </div>

      <div class="head">
        <h1>Login Admin</h1>
        <p>Khusus administrator sistem</p>
      </div>

      <form @submit.prevent="submit" class="form">
        <div class="form-group">
          <label>Username</label>
          <div class="input-wrap">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              v-model="username"
              type="text"
              required
              placeholder="Masukkan username"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-wrap">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              required
              placeholder="Masukkan password"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button type="button" class="input-action" @click="showPass = !showPass" :aria-label="showPass ? 'Sembunyikan password' : 'Tampilkan password'">
              <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="turnstileKey" class="ts-wrap">
          <div ref="turnstileEl" class="ts-el"></div>
          <p v-if="turnstileError" class="ts-hint">Captcha gagal dimuat. <button type="button" @click="renderTurnstile">Coba lagi</button></p>
        </div>

        <div v-if="error" class="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>

        <button type="submit" class="btn" :disabled="loading || (!!turnstileKey && !turnstileToken)">
          <span v-if="loading" class="btn-loading">
            <span class="btn-spinner"></span>
            Memeriksa
          </span>
          <span v-else>Masuk Panel</span>
        </button>
      </form>

      <div class="footer-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="footer-icon">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Sesi admin dilindungi enkripsi</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const username = ref('')
const password = ref('')
const showPass = ref(false)
const error = ref('')
const loading = ref(false)

const config = useRuntimeConfig()
const turnstileKey = computed(() => (config.public as any).turnstileSiteKey || '')
const turnstileToken = ref('')
const turnstileError = ref(false)
const turnstileEl = ref<HTMLElement | null>(null)
let widgetId: string | null = null

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).turnstile) return resolve()
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true; s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('turnstile script failed'))
    document.head.appendChild(s)
  })
}

async function renderTurnstile() {
  if (!turnstileKey.value || !turnstileEl.value) return
  turnstileError.value = false
  turnstileToken.value = ''
  try {
    await loadTurnstileScript()
    const t = (window as any).turnstile
    if (!t) return
    if (widgetId) { try { t.remove(widgetId) } catch {} widgetId = null }
    widgetId = t.render(turnstileEl.value, {
      sitekey: turnstileKey.value,
      theme: 'light',
      callback: (tok: string) => { turnstileToken.value = tok; turnstileError.value = false },
      'error-callback': () => { turnstileToken.value = ''; turnstileError.value = true },
      'expired-callback': () => { turnstileToken.value = '' },
    })
  } catch { turnstileError.value = true }
}

onMounted(async () => {
  const me: any = await $fetch('/api/admin-panel/me', { credentials: 'include' }).catch(() => null)
  if (me?.success) { navigateTo('/panel'); return }
  await nextTick()
  renderTurnstile()
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const r: any = await $fetch('/api/admin-panel/login', {
      method: 'POST',
      body: { username: username.value, password: password.value, turnstileToken: turnstileToken.value },
      credentials: 'include',
    })
    if (r?.success) navigateTo('/panel')
    else error.value = 'Login gagal'
  } catch (e: any) {
    error.value = e?.data?.error || e.message || 'Login gagal'
    if (turnstileKey.value) renderTurnstile()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
* { box-sizing: border-box; }

.page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: none;
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

.glow-a {
  position: fixed;
  pointer-events: none;
  z-index: 0;
  width: 500px; height: 500px;
  top: -180px; left: -120px;
  border-radius: 50%;
  background: none;
  filter: blur(120px);
}
.glow-b {
  position: fixed;
  pointer-events: none;
  z-index: 0;
  width: 600px; height: 600px;
  bottom: -240px; right: -180px;
  border-radius: 50%;
  background: none;
  filter: blur(140px);
}

.card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 40px 36px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
}
.brand :deep(img) {
  height: 38px;
  width: auto;
  display: block;
}

.head { margin-bottom: 26px; }
.head h1 {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--txt);
  margin-bottom: 8px;
  text-align: center;
}
.head p {
  font-size: 13px;
  color: var(--dim);
  text-align: center;
}

.form { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 12px; font-weight: 700; color: var(--txt); }

.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon {
  position: absolute; left: 13px; top: 50%;
  transform: translateY(-50%);
  width: 16px; height: 16px;
  color: var(--dim);
  pointer-events: none;
}
.input-wrap input {
  width: 100%;
  padding: 12px 42px 12px 40px;
  border: 1px solid var(--line-2);
  border-radius: 8px;
  font-size: 13px;
  color: var(--txt);
  background: var(--card);
  transition: border-color 0.18s, box-shadow 0.18s;
  font-family: inherit;
  outline: none;
}
.input-wrap input::placeholder { color: var(--dim); opacity: 0.55; }
.input-wrap input:focus {
  border-color: var(--vio);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.input-wrap input:disabled { opacity: 0.5; }

.input-action {
  position: absolute; right: 8px; top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: var(--dim);
  display: flex;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.input-action:hover { color: var(--vio); background: rgba(var(--vio-rgb),0.06); }
/* EYEFIX */
.input-action { min-height: 0 !important; width: 30px; height: 30px; padding: 0 !important; right: 6px !important; align-items: center; justify-content: center; line-height: 0; }
.input-action svg { width: 15px; height: 15px; }

.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  line-height: 1.5;
  background: rgba(225,29,72,0.05);
  color: var(--bad, #e11d48);
  border: 1px solid rgba(225,29,72,0.18);
  font-weight: 600;
}
.alert svg { width: 16px; height: 16px; flex-shrink: 0; }

.btn {
  width: 100%;
  padding: 14px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  margin-top: 4px;
}
.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

.btn-loading { display: inline-flex; align-items: center; gap: 8px; }
.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.footer-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  font-size: 11.5px;
  color: var(--dim);
}
.footer-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  color: var(--vio);
}

@media (max-width: 480px) {
  .page { padding: 16px; }
  .card { padding: 32px 24px; border-radius: 8px; }
  .head h1 { font-size: 13px; }
  .head p { font-size: 12.5px; }
  .brand { margin-bottom: 24px; }
  .brand :deep(img) { height: 34px; }
  .input-wrap input { font-size: 13px; padding: 11px 40px 11px 38px; }
  .btn { padding: 13px; font-size: 13px; }
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .btn-spinner {
    animation: none !important;
  }
}
.ts-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ts-el { min-height: 65px; max-width: 100%; display: flex; justify-content: center; }
.ts-hint { font-size: 12px; color: #e11d48; text-align: center; }
.ts-hint button { color: var(--vio); font-weight: 600; text-decoration: underline; }
</style>