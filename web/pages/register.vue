<template>
  <div class="auth-page">
    <div class="bg-glow glow-a" aria-hidden="true"></div>
    <div class="bg-glow glow-b" aria-hidden="true"></div>

    <div class="auth-left">
      <div class="auth-box">
        <NuxtLink to="/" class="btn-close" title="Kembali">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </NuxtLink>

        <NuxtLink to="/" class="brand">
          <SiteLogo />
        </NuxtLink>

        <div class="head">
          <div class="eyebrow">
            <span class="eyebrow-dot"></span>
            Buat Akun Baru
          </div>
          <h1>Daftar merchant</h1>
          <p>Isi data di bawah untuk mulai terima pembayaran QRIS.</p>
        </div>

        <form @submit.prevent="onSubmit" class="form">
          <!-- NAMA -->
          <div class="form-group">
            <label>Nama Lengkap</label>
            <div class="input-wrap" :class="statusClass(nameStatus)">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input v-model="name" type="text" required placeholder="Nama kamu" :disabled="loading" @blur="validateName" />
              <span v-if="nameStatus === 'valid'" class="input-status valid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span v-else-if="nameStatus === 'invalid'" class="input-status invalid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </span>
            </div>
            <p v-if="nameMsg" :class="['field-msg', nameStatus]">{{ nameMsg }}</p>
          </div>

          <!-- NAMA TOKO -->
          <div class="form-group">
            <label>Nama Toko / Bisnis</label>
            <div class="input-wrap" :class="statusClass(storeStatus)">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>
              </svg>
              <input v-model="storeName" type="text" required maxlength="60" placeholder="Contoh: Toko Maju Jaya" :disabled="loading" @input="validateStore" @blur="validateStore" />
            </div>
            <p :class="['field-msg', storeMsg ? storeStatus : 'idle']">{{ storeMsg || 'Tampil di halaman pembayaran pelanggan.' }}</p>
          </div>

          <!-- HP -->
          <div class="form-group">
            <label>Nomor HP / WhatsApp</label>
            <div class="input-wrap" :class="statusClass(phoneStatus)">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <input v-model="phone" type="tel" required placeholder="08123456789" :disabled="loading" @input="onPhoneInput" @blur="validatePhone" />
              <span v-if="phoneStatus === 'checking'" class="input-status checking"><span class="mini-spinner"></span></span>
              <span v-else-if="phoneStatus === 'valid'" class="input-status valid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span v-else-if="phoneStatus === 'invalid'" class="input-status invalid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </span>
            </div>
            <p v-if="phoneMsg" :class="['field-msg', phoneStatus]">{{ phoneMsg }}</p>
          </div>

          <!-- EMAIL -->
          <div class="form-group">
            <label>Email</label>
            <div class="input-wrap" :class="statusClass(emailStatus)">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input v-model="email" type="email" required placeholder="email@kamu.com" :disabled="loading" @input="onEmailInput" @blur="validateEmail" />
              <span v-if="emailStatus === 'checking'" class="input-status checking"><span class="mini-spinner"></span></span>
              <span v-else-if="emailStatus === 'valid'" class="input-status valid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span v-else-if="emailStatus === 'invalid'" class="input-status invalid">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </span>
            </div>
            <p v-if="emailMsg" :class="['field-msg', emailStatus]">{{ emailMsg }}</p>
          </div>

          <!-- PASSWORD -->
          <div class="form-group">
            <label>Password</label>
            <div class="input-wrap" :class="statusClass(passwordStatus)">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input v-model="password" :type="showPass ? 'text' : 'password'" required minlength="6" placeholder="Min 6 karakter" :disabled="loading" autocomplete="new-password" @input="validatePassword" />
              <button type="button" class="input-action" @click="showPass = !showPass">
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
            <div v-if="password" class="pass-strength">
              <div class="strength-bar">
                <div class="strength-fill" :class="strengthClass" :style="{ width: strengthPercent + '%' }"></div>
              </div>
              <span class="strength-text">{{ strengthText }}</span>
            </div>
            <ul v-if="password" class="pw-rules">
              <li v-for="r in pwRules" :key="r.t" :class="{ ok: r.ok }"><i></i>{{ r.t }}</li>
            </ul>
            <p v-if="passwordMsg" :class="['field-msg', passwordStatus]">{{ passwordMsg }}</p>
          </div>

          <!-- TURNSTILE -->
          <div class="turnstile-wrap" v-if="turnstileSiteKey">
            <div ref="turnstileEl" class="turnstile-el"></div>
            <p v-if="turnstileError" class="turnstile-hint error">
              Captcha gagal. <button type="button" @click="reloadTurnstile">Coba lagi</button>
            </p>
          </div>

          <div v-if="error" class="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ error }}</span>
          </div>

          <button type="submit" class="btn-submit" :disabled="!canSubmit">
            <span v-if="loading" class="btn-loading">
              <span class="btn-spinner"></span>
              Memproses
            </span>
            <span v-else>Buat Akun</span>
          </button>

          <p class="legal-note">
            Dengan mendaftar, kamu setuju dengan
            <NuxtLink to="/tos">Syarat &amp; Ketentuan</NuxtLink> dan
            <NuxtLink to="/privacy">Kebijakan Privasi</NuxtLink>.
          </p>
        </form>

        <div class="divider"><span>atau</span></div>

        <p class="footer-link">
          Sudah punya akun?
          <NuxtLink to="/login">Masuk</NuxtLink>
        </p>
      </div>
    </div>

    <div class="auth-right">
      <div class="branding">
        <div class="brand-logo-big">
          <SiteLogo />
        </div>
        <h2>Mulai terima pembayaran<br />QRIS hari ini</h2>
        <p class="branding-sub">Daftar gratis, langsung pakai. Tanpa biaya bulanan, tanpa setup rumit.</p>

        <div class="stats-mini">
          <div class="mini-item"><div class="mini-num">30s</div><div class="mini-lbl">Setup time</div></div>
          <div class="mini-item"><div class="mini-num">Auto</div><div class="mini-lbl">Matching</div></div>
          <div class="mini-item"><div class="mini-num">Rp 0</div><div class="mini-lbl">Biaya awal</div></div>
        </div>

        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div><div class="feature-title">Gratis selamanya</div><div class="feature-desc">Tanpa biaya bulanan tersembunyi</div></div>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div><div class="feature-title">Auto-matching</div><div class="feature-desc">Pembayaran masuk terdeteksi otomatis</div></div>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div><div class="feature-title">API siap pakai</div><div class="feature-desc">Integrasi cukup 5 menit</div></div>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div><div class="feature-title">Webhook signed</div><div class="feature-desc">Callback real-time JSON</div></div>
          </div>
        </div>

        <div class="branding-foot">
          <span>© {{ year }} {{ siteName }}</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showSuccess" class="modal-overlay">
          <div class="modal">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2>Pendaftaran Berhasil</h2>
            <p class="modal-msg">Akun kamu sudah dibuat. Silakan login untuk mulai menggunakan dashboard.</p>

            <div class="modal-info">
              <div class="info-row"><span>Email</span><strong>{{ registeredEmail }}</strong></div>
              <div class="info-row"><span>No HP</span><strong>{{ registeredPhone }}</strong></div>
            </div>

            <button class="modal-btn" @click="goToLogin">Ke Halaman Login</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const config = useRuntimeConfig()
const { siteName } = useSiteSettings()
const turnstileSiteKey = computed(() => (config.public as any).turnstileSiteKey || '')

const name = ref('')
const phone = ref('')
const storeName = ref('')
const email = ref('')
const password = ref('')
const showPass = ref(false)
const error = ref('')
const loading = ref(false)
const showSuccess = ref(false)
const registeredEmail = ref('')
const registeredPhone = ref('')
const turnstileToken = ref('')
const turnstileError = ref(false)
const turnstileEl = ref<HTMLElement | null>(null)
let widgetId: string | null = null

const year = new Date().getFullYear()

type Status = 'idle' | 'checking' | 'valid' | 'invalid'
const nameStatus = ref<Status>('idle')
const emailStatus = ref<Status>('idle')
const phoneStatus = ref<Status>('idle')
const passwordStatus = ref<Status>('idle')
const storeStatus = ref<Status>('idle')
const storeMsg = ref('')
const nameMsg = ref('')
const emailMsg = ref('')
const phoneMsg = ref('')
const passwordMsg = ref('')

let emailDebounce: any = null
let phoneDebounce: any = null

function statusClass(s: Status) {
  return { 'is-valid': s === 'valid', 'is-invalid': s === 'invalid', 'is-checking': s === 'checking' }
}

function validateStore() {
  const v = storeName.value.trim()
  if (!v) { storeStatus.value = 'idle'; storeMsg.value = ''; return }
  if (v.length < 2) { storeStatus.value = 'invalid'; storeMsg.value = 'Nama toko minimal 2 karakter'; return }
  if (!/[\p{L}\p{N}]/u.test(v)) { storeStatus.value = 'invalid'; storeMsg.value = 'Nama toko harus berisi huruf atau angka'; return }
  storeStatus.value = 'valid'; storeMsg.value = ''
}
const EMAIL_TYPO: Record<string, string> = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gnail.com': 'gmail.com', 'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'outlok.com': 'outlook.com' }
function emailTypo(v: string) {
  const [u, d] = v.toLowerCase().split('@')
  return d && EMAIL_TYPO[d] ? `${u}@${EMAIL_TYPO[d]}` : ''
}
const okPhone = (n: string) => /^(0|62)8\d{7,12}$/.test(n)
const PHONE_MSG = 'Gunakan nomor HP Indonesia (08xx atau +628xx)'
function validateName() {
  const v = name.value.trim()
  if (v.length >= 2 && !/^[\p{L}][\p{L}\s.'-]*$/u.test(v)) { nameStatus.value = 'invalid'; nameMsg.value = 'Nama hanya boleh huruf, spasi, titik, atau strip'; return }
  if (!v) { nameStatus.value = 'idle'; nameMsg.value = ''; return }
  if (v.length < 2) { nameStatus.value = 'invalid'; nameMsg.value = 'Nama minimal 2 karakter'; return }
  nameStatus.value = 'valid'; nameMsg.value = ''
}

function onEmailInput() {
  emailStatus.value = 'idle'; emailMsg.value = ''
  clearTimeout(emailDebounce)
  const v = email.value.trim().toLowerCase()
  if (!v) return
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { emailStatus.value = 'invalid'; emailMsg.value = 'Format email tidak valid'; return }
  { const t = emailTypo(v); if (t) { emailStatus.value = 'invalid'; emailMsg.value = `Maksud kamu ${t}?`; return } }
  emailStatus.value = 'checking'
  emailDebounce = setTimeout(() => checkEmail(v), 500)
}
async function checkEmail(v: string) {
  try {
    const r: any = await $fetch(`/api/auth/check-email?email=${encodeURIComponent(v)}`).catch(() => null)
    if (!r?.success) { emailStatus.value = 'idle'; return }
    if (r.data.available) { emailStatus.value = 'valid'; emailMsg.value = 'Email tersedia' }
    else { emailStatus.value = 'invalid'; emailMsg.value = 'Email sudah terdaftar' }
  } catch { emailStatus.value = 'idle' }
}
function validateEmail() {
  const v = email.value.trim().toLowerCase()
  if (!v) { emailStatus.value = 'idle'; emailMsg.value = ''; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { emailStatus.value = 'invalid'; emailMsg.value = 'Format email tidak valid'; return }
  { const t = emailTypo(v); if (t) { emailStatus.value = 'invalid'; emailMsg.value = `Maksud kamu ${t}?`; return } }
  if (emailStatus.value !== 'valid') onEmailInput()
}

function onPhoneInput(e: Event) {
  const input = e.target as HTMLInputElement
  input.value = input.value.replace(/[^\d+]/g, '')
  phone.value = input.value
  phoneStatus.value = 'idle'; phoneMsg.value = ''
  clearTimeout(phoneDebounce)
  const v = phone.value.trim()
  if (!v) return
  const n = v.replace(/\D/g, '')
  if (!okPhone(n)) { phoneStatus.value = 'invalid'; phoneMsg.value = PHONE_MSG; return }
  phoneStatus.value = 'checking'
  phoneDebounce = setTimeout(() => checkPhone(v), 500)
}
async function checkPhone(v: string) {
  try {
    const r: any = await $fetch(`/api/auth/check-phone?phone=${encodeURIComponent(v)}`).catch(() => null)
    if (!r?.success) { phoneStatus.value = 'idle'; return }
    if (r.data.available) { phoneStatus.value = 'valid'; phoneMsg.value = 'Nomor tersedia' }
    else { phoneStatus.value = 'invalid'; phoneMsg.value = 'Nomor sudah terdaftar' }
  } catch { phoneStatus.value = 'idle' }
}
function validatePhone() {
  const v = phone.value.trim()
  if (!v) { phoneStatus.value = 'idle'; phoneMsg.value = ''; return }
  const n = v.replace(/\D/g, '')
  if (!okPhone(n)) { phoneStatus.value = 'invalid'; phoneMsg.value = PHONE_MSG; return }
  if (phoneStatus.value !== 'valid') onPhoneInput({ target: { value: v } } as any)
}

const strengthPercent = computed(() => {
  const p = password.value
  if (!p) return 0
  let s = 0
  if (p.length >= 6) s += 30
  if (p.length >= 10) s += 20
  if (/[A-Z]/.test(p)) s += 20
  if (/[0-9]/.test(p)) s += 15
  if (/[^A-Za-z0-9]/.test(p)) s += 15
  return Math.min(100, s)
})
const pwRules = computed(() => [
  { t: 'Minimal 6 karakter', ok: password.value.length >= 6 },
  { t: 'Ada huruf besar', ok: /[A-Z]/.test(password.value) },
  { t: 'Ada angka', ok: /[0-9]/.test(password.value) },
  { t: 'Ada simbol (disarankan)', ok: /[^A-Za-z0-9]/.test(password.value) },
])
const strengthClass = computed(() => {
  const s = strengthPercent.value
  if (s < 40) return 'weak'
  if (s < 70) return 'medium'
  return 'strong'
})
const strengthText = computed(() => {
  const s = strengthPercent.value
  if (s < 40) return 'Lemah'
  if (s < 70) return 'Sedang'
  return 'Kuat'
})
function validatePassword() {
  const p = password.value
  if (!p) { passwordStatus.value = 'idle'; passwordMsg.value = ''; return }
  if (p.length < 6) { passwordStatus.value = 'invalid'; passwordMsg.value = 'Password minimal 6 karakter'; return }
  if (strengthPercent.value < 40) { passwordStatus.value = 'invalid'; passwordMsg.value = 'Password terlalu lemah'; return }
  passwordStatus.value = 'valid'; passwordMsg.value = ''
}

const canSubmit = computed(() => {
  if (loading.value) return false
  if (nameStatus.value !== 'valid') return false
  if (storeStatus.value !== 'valid') return false
  if (emailStatus.value !== 'valid') return false
  if (phoneStatus.value !== 'valid') return false
  if (passwordStatus.value !== 'valid') return false
  if (turnstileSiteKey.value && !turnstileToken.value) return false
  return true
})

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).turnstile) return resolve()
    const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('fail')))
      return
    }
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true; s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('fail'))
    document.head.appendChild(s)
  })
}

async function renderTurnstile() {
  if (!turnstileSiteKey.value || !turnstileEl.value) return
  try {
    await loadTurnstileScript()
    const t = (window as any).turnstile
    if (!t || !turnstileEl.value) return
    if (widgetId) { try { t.remove(widgetId) } catch {} widgetId = null }
    widgetId = t.render(turnstileEl.value, {
      sitekey: turnstileSiteKey.value,
      theme: 'light',
      callback: (token: string) => { turnstileToken.value = token; turnstileError.value = false },
      'error-callback': () => { turnstileToken.value = ''; turnstileError.value = true },
      'expired-callback': () => { turnstileToken.value = '' },
    })
  } catch { turnstileError.value = true }
}

function reloadTurnstile() {
  turnstileToken.value = ''
  turnstileError.value = false
  renderTurnstile()
}

async function onSubmit() {
  error.value = ''
  validateName(); validateStore(); validateEmail(); validatePhone(); validatePassword()

  if (!canSubmit.value) {
    if (turnstileSiteKey.value && !turnstileToken.value) {
      error.value = 'Selesaikan verifikasi captcha dulu'
    } else {
      error.value = 'Lengkapi semua field dengan benar'
    }
    return
  }

  loading.value = true
  try {
    const res: any = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: name.value,
        phone: phone.value,
        storeName: storeName.value.trim(),
        email: email.value,
        password: password.value,
        turnstileToken: turnstileToken.value,
      },
      credentials: 'include',
    })

    if (res?.success) {
      registeredEmail.value = email.value
      registeredPhone.value = phone.value
      showSuccess.value = true
      return
    }

    error.value = 'Registrasi gagal, coba lagi'
  } catch (e: any) {
    const msg = e?.data?.error || e?.data?.message || e.message || 'Registrasi gagal'
    if (msg.toLowerCase().includes('sudah terdaftar')) {
      error.value = 'Email sudah terdaftar. Silakan login atau pakai email lain.'
      emailStatus.value = 'invalid'; emailMsg.value = 'Email sudah terdaftar'
    } else {
      error.value = msg
    }
    reloadTurnstile()
  } finally { loading.value = false }
}

function goToLogin() { navigateTo('/login') }

onMounted(() => {
  nextTick(() => renderTurnstile())
})
onBeforeUnmount(() => {
  if (widgetId && (window as any).turnstile) { try { (window as any).turnstile.remove(widgetId) } catch {} }
  clearTimeout(emailDebounce); clearTimeout(phoneDebounce)
})
</script>

<style scoped>
* { box-sizing: border-box; }
.auth-page {
  min-height: 100vh; min-height: 100dvh;
  display: grid; grid-template-columns: 1fr 1fr;
  position: relative; overflow: hidden;
  background: var(--bg, #ffffff); color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.bg-glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(120px); }
.glow-a { width: 520px; height: 520px; top: -200px; left: -140px; background: none; }
.glow-b { width: 600px; height: 600px; top: 20%; right: -240px; background: none; }

.auth-left { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; padding: 40px; overflow-y: auto; }
.auth-box { width: 100%; max-width: 420px; padding: 40px 36px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both; position: relative; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.btn-close { position: absolute; top: 16px; right: 16px; width: 34px; height: 34px; border-radius: 8px; background: var(--bg-soft, var(--soft)); border: 1px solid var(--line); color: var(--dim); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; text-decoration: none; z-index: 10; }
.btn-close:hover { border-color: rgba(var(--vio-rgb),0.35); color: var(--vio); }
.btn-close svg { width: 15px; height: 15px; }
.brand { display: flex; margin-bottom: 28px; }
.brand :deep(img) { height: 36px; width: auto; display: block; }
.head { margin-bottom: 24px; }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 10.5px; font-weight: 700; color: var(--vio); background: rgba(var(--vio-rgb),0.06); border: 1px solid rgba(var(--vio-rgb),0.18); padding: 5px 11px; border-radius: 999px; margin-bottom: 14px; }
.eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--vio); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.head h1 { font-size: 16px; font-weight: 700; letter-spacing: -0.03em; color: var(--txt); line-height: 1.15; margin-bottom: 8px; }
.head p { font-size: 13px; color: var(--dim); line-height: 1.55; }
.form { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 12px; font-weight: 700; color: var(--txt); }
.input-wrap { position: relative; display: flex; align-items: center; transition: all 0.2s; }
.input-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--dim); pointer-events: none; transition: color 0.2s; }
.input-wrap input { width: 100%; padding: 12px 42px 12px 40px; border: 1px solid var(--line-2); border-radius: 8px; font-size: 13px; color: var(--txt); background: var(--card); outline: none; transition: all 0.18s; font-family: inherit; }
.input-wrap input::placeholder { color: var(--dim); opacity: 0.55; }
.input-wrap input:focus { border-color: var(--vio); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.input-wrap input:disabled { opacity: 0.5; }
.input-wrap.is-valid input { border-color: rgba(16, 185, 129, 0.45); }
.input-wrap.is-valid .input-icon { color: #059669; }
.input-wrap.is-invalid input { border-color: rgba(225, 29, 72, 0.45); }
.input-wrap.is-invalid .input-icon { color: var(--bad, #e11d48); }
.input-wrap.is-checking input { border-color: rgba(var(--vio-rgb),0.35); }
.input-status { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.input-status svg { width: 12px; height: 12px; }
.input-status.valid { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.35); color: #059669; }
.input-status.invalid { background: rgba(225, 29, 72, 0.07); border: 1px solid rgba(225, 29, 72, 0.3); color: var(--bad, #e11d48); }
.input-status.checking { background: var(--bg-soft, var(--soft)); border: 1px solid var(--line); }
.mini-spinner { width: 10px; height: 10px; border: 1.5px solid var(--line-2); border-top-color: var(--vio); border-radius: 50%; animation: spin 0.7s linear infinite; display: block; }
@keyframes spin { to { transform: rotate(360deg); } }
.pw-rules { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin: 8px 0 2px; padding: 0 2px; }
.pw-rules li { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--dim); }
.pw-rules li i { width: 8px; height: 8px; border-radius: 50%; background: var(--line-2); flex: none; transition: background .2s; }
.pw-rules li.ok { color: #059669; }
.pw-rules li.ok i { background: #059669; }
@media (max-width: 420px) { .pw-rules { grid-template-columns: 1fr; } }
.field-msg { font-size: 11.5px; margin-top: 2px; line-height: 1.4; padding-left: 2px; }
.field-msg.valid { color: #059669; }
.field-msg.invalid { color: var(--bad, #e11d48); }
.field-msg.checking { color: var(--dim); }
.input-action { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 6px; cursor: pointer; color: var(--dim); display: flex; border-radius: 6px; transition: all 0.15s; z-index: 2; }
.input-action:hover { color: var(--vio); background: rgba(var(--vio-rgb),0.06); }
/* EYEFIX */
.input-action { min-height: 0 !important; width: 30px; height: 30px; padding: 0 !important; right: 6px !important; align-items: center; justify-content: center; line-height: 0; }
.input-action svg { width: 15px; height: 15px; }
.pass-strength { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
.strength-bar { flex: 1; height: 4px; background: var(--line); border-radius: 2px; overflow: hidden; }
.strength-fill { height: 100%; transition: all 0.3s; border-radius: 2px; background: var(--line-2); }
.strength-fill.weak { background: var(--bad, #e11d48); }
.strength-fill.medium { background: #d97706; }
.strength-fill.strong { background: #10b981; }
.strength-text { font-size: 11px; color: var(--dim); font-weight: 600; min-width: 42px; text-align: right; }
.turnstile-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 4px 0; min-height: 70px; }
.turnstile-el { min-height: 65px; display: flex; justify-content: center; }
.turnstile-hint { font-size: 11.5px; color: var(--dim); text-align: center; }
.turnstile-hint.error { color: var(--bad, #e11d48); }
.turnstile-hint button { background: transparent; border: none; color: var(--vio); text-decoration: underline; cursor: pointer; font-family: inherit; font-size: inherit; padding: 0; }
.alert { display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-radius: 8px; font-size: 12.5px; line-height: 1.5; }
.alert svg { width: 16px; height: 16px; flex-shrink: 0; }
.alert-error { background: rgba(225,29,72,0.05); color: var(--bad, #e11d48); border: 1px solid rgba(225,29,72,0.18); font-weight: 600; }
.btn-submit { width: 100%; padding: 14px; background: var(--grad, var(--vio)); color: #ffffff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.btn-submit:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.btn-loading { display: inline-flex; align-items: center; gap: 8px; }
.btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #ffffff; border-radius: 50%; animation: spin 0.7s linear infinite; }
.legal-note { text-align: center; margin-top: 4px; font-size: 12px; color: var(--dim); line-height: 1.6; }
.legal-note a { color: var(--vio); text-decoration: none; font-weight: 650; }
.legal-note a:hover { text-decoration: underline; }
.divider { display: flex; align-items: center; margin: 22px 0 18px; gap: 12px; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.divider span { font-size: 11px; color: var(--dim); font-weight: 700; }
.footer-link { text-align: center; font-size: 13px; color: var(--dim); }
.footer-link a { color: var(--vio); font-weight: 750; text-decoration: none; }
.footer-link a:hover { text-decoration: underline; }
.auth-right { position: relative; z-index: 1; padding: 60px 56px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-left: 1px solid var(--line); background: none; }
.branding { max-width: 440px; }
.brand-logo-big { width: 68px; height: 68px; border-radius: 8px; background: var(--grad, var(--vio)); display: flex; align-items: center; justify-content: center; margin-bottom: 32px; padding: 14px; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.brand-logo-big :deep(img) { width: 100%; height: auto; filter: brightness(0) invert(1); }
.branding h2 { font-size: 16px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.12; margin-bottom: 18px; color: var(--txt); }
.branding-sub { font-size: 13px; color: var(--dim); line-height: 1.65; margin-bottom: 36px; }
.stats-mini { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; padding: 20px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.mini-item { text-align: center; }
.mini-num { font-size: 13px; font-weight: 700; color: var(--txt); font-variant-numeric: tabular-nums; }
.mini-lbl { font-size: 10px; color: var(--dim); margin-top: 4px; font-weight: 700; }
.feature-list { display: flex; flex-direction: column; gap: 16px; }
.feature-item { display: flex; gap: 14px; align-items: flex-start; }
.feature-icon { width: 34px; height: 34px; border-radius: 8px; background: rgba(var(--vio-rgb),0.07); border: 1px solid rgba(var(--vio-rgb),0.15); color: var(--vio); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.feature-icon svg { width: 16px; height: 16px; }
.feature-title { font-size: 13px; font-weight: 750; margin-bottom: 3px; color: var(--txt); }
.feature-desc { font-size: 12.5px; color: var(--dim); line-height: 1.45; }
.branding-foot { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--line); font-size: 11px; color: var(--dim); }
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42, 0.45);  display: flex; align-items: center; justify-content: center; z-index: 900; padding: 20px; }
.modal { background: var(--card); border: 1px solid var(--line); border-radius: 8px; width: 100%; max-width: 400px; padding: 40px 32px 32px; text-align: center; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.success-icon { width: 72px; height: 72px; margin: 0 auto 20px; border-radius: 50%; background: var(--grad, var(--vio)); display: flex; align-items: center; justify-content: center; color: #ffffff; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.success-icon svg { width: 36px; height: 36px; }
.modal h2 { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 10px; letter-spacing: -0.02em; }
.modal-msg { font-size: 13px; color: var(--dim); line-height: 1.6; margin-bottom: 22px; }
.modal-info { padding: 14px 16px; background: var(--bg-soft, var(--soft)); border: 1px solid var(--line); border-radius: 8px; margin-bottom: 22px; }
.info-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 6px 0; }
.info-row span { font-size: 12.5px; color: var(--dim); }
.info-row strong { font-size: 13px; color: var(--txt); font-weight: 750; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
.modal-btn { width: 100%; padding: 14px; background: var(--grad, var(--vio)); color: #ffffff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.modal-btn:hover { transform: translateY(-1px); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
@media (max-width: 900px) {
  .auth-page { grid-template-columns: 1fr; }
  .auth-right { display: none; }
  .auth-left { padding: 24px 16px; }
  .auth-box { padding: 32px 24px; border-radius: 8px; }
  .head h1 { font-size: 13px; }
}
@media (max-width: 480px) {
  .auth-left { padding: 16px 12px; }
  .auth-box { padding: 28px 20px; border-radius: 8px; }
  .head h1 { font-size: 13px; }
  .head p { font-size: 12.5px; }
  .input-wrap input { font-size: 13px; padding: 11px 40px 11px 38px; }
  .btn-submit { padding: 13px; font-size: 13px; }
  .modal { padding: 32px 24px 24px; border-radius: 8px; }
  .info-row strong { max-width: 180px; }
}
@media (prefers-reduced-motion: reduce) {
  .btn-spinner, .mini-spinner { animation: none !important; }
}
</style>