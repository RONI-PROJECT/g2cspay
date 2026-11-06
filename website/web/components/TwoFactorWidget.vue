<template>
  <div class="tfa-widget">
    <button class="tfa-toggle" @click="open = !open">
      <div class="tfa-lock-icon" :class="totpEnabled ? 'on' : 'off'">
        <svg v-if="totpEnabled" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
        </svg>
      </div>
      <div class="tfa-toggle-info">
        <div class="tfa-toggle-title">Keamanan 2FA</div>
        <div class="tfa-toggle-status" :class="statusKnown ? (totpEnabled ? 'on' : 'off') : 'wait'">
          {{ !statusKnown ? 'Memeriksa' : totpEnabled ? 'Aktif' : 'Belum Aktif' }}
        </div>
      </div>
    </button>

    <Transition name="tfa-panel">
      <div v-if="open" class="tfa-panel">
        <div class="tfa-panel-head">
          <div>
            <h3>Keamanan 2FA</h3>
            <p>Google Authenticator</p>
          </div>
          <button class="tfa-close" @click="open = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="tfa-status-box" :class="!statusKnown ? 'inactive' : totpEnabled ? 'active' : 'inactive'">
          <span v-if="!statusKnown">Memeriksa status 2FA</span>
          <span v-else-if="totpEnabled">2FA sudah aktif di akun Anda</span>
          <span v-else>2FA belum aktif. Amankan akun Anda.</span>
        </div>

        <button v-if="statusKnown && !totpEnabled && !setupMode" class="tfa-btn-primary" @click="startSetup" :disabled="loading">
          {{ loading ? 'Memuat' : 'Mulai Setup 2FA' }}
        </button>

        <div v-if="error && !setupMode && !disableMode" class="tfa-error">{{ error }}</div>

        <template v-if="setupMode && !totpEnabled">
          <div class="tfa-block">
            <div class="tfa-block-head">
              <div class="tfa-step-num">1</div>
              <div class="tfa-step-title">Scan QR pakai Google Authenticator</div>
            </div>
            <div class="tfa-qr-wrap">
              <div v-if="qrUrl" class="tfa-qr-box">
                <img :src="qrUrl" alt="QR 2FA" class="tfa-qr" />
              </div>
              <div v-else class="tfa-qr-loading">
                <div class="tfa-spinner"></div>
                <span>Memuat QR</span>
              </div>
            </div>
          </div>

          <div class="tfa-block">
            <div class="tfa-manual-label">Kode keamanan (isi manual kalau QR tidak bisa discan)</div>
            <div class="tfa-manual-row">
              <code>{{ formattedKey }}</code>
              <button class="tfa-copy-mini" @click="copyKey" :title="copied ? 'Tersalin' : 'Salin'" type="button">
                <span v-if="copied" class="tfa-copied">Tersalin</span>
                <template v-else>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                </template>
              </button>
            </div>
          </div>

          <div class="tfa-block">
            <div class="tfa-block-head">
              <div class="tfa-step-num">2</div>
              <div class="tfa-step-title">Masukkan kode 6 digit</div>
            </div>
            <input
              v-model="code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              class="tfa-input"
              @keyup.enter="verifySetup"
              autocomplete="off"
            />
          </div>

          <div v-if="error" class="tfa-error">{{ error }}</div>

          <div class="tfa-actions">
            <button class="tfa-btn-cancel" @click="cancelSetup" :disabled="loading">Batal</button>
            <button class="tfa-btn-grad" @click="verifySetup" :disabled="loading || code.length !== 6">
              {{ loading ? 'Memverifikasi' : 'Aktifkan 2FA' }}
            </button>
          </div>
        </template>

        <template v-if="statusKnown && totpEnabled && !disableMode">
          <button class="tfa-btn-danger" @click="startDisable" :disabled="loading">
            Nonaktifkan 2FA
          </button>
        </template>

        <template v-if="totpEnabled && disableMode">
          <div class="tfa-warn-box">
            Masukkan kode 6 digit dari Google Authenticator untuk konfirmasi.
          </div>

          <div class="tfa-block">
            <div class="tfa-block-head">
              <div class="tfa-step-num">1</div>
              <div class="tfa-step-title">Kode 6 digit</div>
            </div>
            <input
              v-model="disableCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="000000"
              class="tfa-input"
              @keyup.enter="confirmDisable"
              autocomplete="off"
            />
          </div>

          <div v-if="error" class="tfa-error">{{ error }}</div>

          <div class="tfa-actions">
            <button class="tfa-btn-cancel" @click="cancelDisable" :disabled="loading">Batal</button>
            <button class="tfa-btn-danger-solid" @click="confirmDisable" :disabled="loading || disableCode.length !== 6">
              {{ loading ? 'Menonaktifkan' : 'Konfirmasi' }}
            </button>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const open = ref(false)
const setupMode = ref(false)
const disableMode = ref(false)
const totpEnabled = ref(false)
const statusKnown = ref(false)
const qrUrl = ref('')
const manualKey = ref('')
const code = ref('')
const disableCode = ref('')
const error = ref('')
const loading = ref(false)
const copied = ref(false)

const formattedKey = computed(() => {
  if (!manualKey.value) return ''
  return manualKey.value.match(/.{1,4}/g)?.join(' ') || manualKey.value
})

let retryTimer: ReturnType<typeof setTimeout> | null = null

// Widget selalu tampil. Kalau server lagi lambat, status dicoba lagi sampai berhasil.
async function checkStatus(attempt = 1) {
  try {
    const r: any = await $fetch('/api/auth/me', { credentials: 'include' })
    if (r?.success) {
      totpEnabled.value = r.data.totpEnabled === true
      statusKnown.value = true
      return
    }
  } catch (e: any) {
    if (e?.status === 401 || e?.statusCode === 401) return
  }
  if (attempt < 6) retryTimer = setTimeout(() => checkStatus(attempt + 1), attempt * 2500)
}

async function startSetup() {
  error.value = ''
  loading.value = true
  try {
    const r: any = await $fetch('/api/auth/2fa/setup', { method: 'POST', credentials: 'include' })
    if (r?.success) {
      qrUrl.value = r.data.qrDataUrl || r.data.qr || r.data.qrUrl || ''
      manualKey.value = r.data.secret || r.data.manualEntry || ''
      setupMode.value = true
    } else {
      error.value = r?.error || 'Gagal memulai setup'
    }
  } catch (e: any) {
    const msg = e?.data?.error || e.message
    if (/sudah aktif|udah aktif/i.test(msg || '')) { totpEnabled.value = true; statusKnown.value = true }
    else error.value = msg
  } finally {
    loading.value = false
  }
}

async function verifySetup() {
  if (code.value.length !== 6) return
  error.value = ''
  loading.value = true
  try {
    const r: any = await $fetch('/api/auth/2fa/verify-setup', {
      method: 'POST',
      body: { token: code.value },
      credentials: 'include',
    })
    if (r?.success) {
      totpEnabled.value = true
      setupMode.value = false
      code.value = ''
      await checkStatus()
    } else {
      error.value = r?.error || 'Kode salah'
    }
  } catch (e: any) {
    error.value = e?.data?.error || 'Kode salah'
  } finally {
    loading.value = false
  }
}

function cancelSetup() {
  setupMode.value = false
  code.value = ''
  error.value = ''
  qrUrl.value = ''
  manualKey.value = ''
}

function startDisable() {
  disableMode.value = true
  disableCode.value = ''
  error.value = ''
}

async function confirmDisable() {
  if (disableCode.value.length !== 6) return
  error.value = ''
  loading.value = true
  try {
    const r: any = await $fetch('/api/auth/2fa/disable', {
      method: 'POST',
      body: { token: disableCode.value },
      credentials: 'include',
    })
    if (r?.success) {
      totpEnabled.value = false
      disableMode.value = false
      disableCode.value = ''
      await checkStatus()
    } else {
      error.value = r?.error || 'Kode salah'
    }
  } catch (e: any) {
    error.value = e?.data?.error || 'Kode salah'
  } finally {
    loading.value = false
  }
}

function cancelDisable() {
  disableMode.value = false
  disableCode.value = ''
  error.value = ''
}

async function copyKey() {
  if (!manualKey.value) return
  const text = manualKey.value
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text)
    else throw new Error('no clipboard')
  } catch {
    // http / browser lama: pakai cara lama
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    try { document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 1800)
}

onMounted(() => { checkStatus() })
onBeforeUnmount(() => { if (retryTimer) clearTimeout(retryTimer) })

defineExpose({ checkStatus })
</script>

<style scoped>
/* Widget mengambang di tengah bawah */
.tfa-widget {
  position: fixed;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  right: 20px;
  left: auto;
  transform: none;
  z-index: 850;
  display: block;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  pointer-events: auto;
}

/* ===== TOGGLE BUTTON ===== */
.tfa-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: var(--card);
  color: var(--txt);
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  transition: all 0.2s;
  width: auto;
  max-width: calc(100vw - 32px);
}
.tfa-toggle:hover {
  border-color: rgba(var(--vio-rgb),0.35);
  transform: translateY(-2px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.tfa-lock-icon {
  width: 38px; height: 38px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.tfa-lock-icon svg { width: 18px; height: 18px; }
.tfa-lock-icon.off {
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.3);
  color: #d97706;
}
.tfa-lock-icon.on {
  background: var(--grad, var(--vio));
  border: none;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.tfa-toggle-info { text-align: left; }
.tfa-toggle-title { font-size: 13px; font-weight: 750; color: var(--txt); margin-bottom: 2px; white-space: nowrap; }
.tfa-toggle-status { font-size: 11px; font-weight: 650; white-space: nowrap; }
.tfa-toggle-status.off { color: #d97706; }
.tfa-toggle-status.on { color: var(--vio); }
.tfa-toggle-status.wait { color: var(--dim); }
.tfa-copied { font-size: 11px; font-weight: 700; color: var(--ok, #0d9488); padding: 0 4px; }

/* ===== PANEL ===== */
.tfa-panel {
  position: absolute;
  bottom: 62px;
  left: auto;
  right: 0;
  margin-left: 0;
  box-sizing: border-box;
  width: min(380px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  max-height: 80vh;
  overflow-y: auto;
}

.tfa-panel-head {
  display: flex; justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px; gap: 12px;
}
.tfa-panel-head h3 { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 4px; letter-spacing: -0.01em; }
.tfa-panel-head p { font-size: 12px; color: var(--dim); line-height: 1.5; }
.tfa-close {
  background: var(--card);
  border: 1px solid var(--line);
  width: 30px; height: 30px;
  border-radius: 8px;
  color: var(--dim); cursor: pointer;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.tfa-close svg { width: 14px; height: 14px; }
.tfa-close:hover { border-color: rgba(var(--vio-rgb),0.35); color: var(--vio); }

/* ===== STATUS / WARN BOX ===== */
.tfa-status-box {
  padding: 11px 14px; border-radius: 8px;
  font-size: 12.5px; font-weight: 650;
  margin-bottom: 16px; text-align: center;
}
.tfa-status-box.inactive {
  background: rgba(245,158,11,0.07);
  color: #d97706;
  border: 1px solid rgba(245,158,11,0.2);
}
.tfa-status-box.active {
  background: rgba(16,185,129,0.07);
  color: #059669;
  border: 1px solid rgba(16,185,129,0.2);
}

.tfa-warn-box {
  padding: 11px 14px; border-radius: 8px;
  font-size: 12px;
  background: var(--bg-soft, var(--soft));
  color: var(--dim);
  border: 1px solid var(--line);
  margin-bottom: 14px; line-height: 1.55;
  text-align: center;
}

/* ===== STEPS ===== */
.tfa-block { margin-bottom: 16px; width: 100%; }
.tfa-block-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.tfa-step-num {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--grad, var(--vio));
  color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.tfa-step-title { font-size: 13px; font-weight: 650; color: var(--txt); line-height: 1.4; }

/* ===== QR ===== */
.tfa-qr-wrap { display: flex; justify-content: center; align-items: center; width: 100%; margin: 0 auto; }
.tfa-qr-box {
  padding: 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  display: inline-block;
  margin: 0 auto;
}
.tfa-qr { width: 180px; height: 180px; display: block; }
.tfa-qr-loading {
  width: 200px; height: 200px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px;
  background: var(--bg-soft, var(--soft));
  border: 1px dashed var(--line-2);
  border-radius: 8px;
  color: var(--dim); font-size: 12px;
}
.tfa-spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== MANUAL KEY ===== */
.tfa-manual-label {
  font-size: 11.5px;
  color: var(--dim);
  margin-bottom: 8px;
  font-weight: 600;
  text-align: center;
  width: 100%;
}
.tfa-manual-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
  width: 100%;
}
.tfa-manual-row code {
  font-family: ui-monospace, monospace;
  color: var(--vio-ink);
  font-weight: 750;
  font-size: 12px;
  letter-spacing: 1.5px;
  word-break: break-all;
  text-align: center;
  flex: 1;
}
.tfa-copy-mini {
  background: var(--card);
  border: 1px solid var(--line-2);
  border-radius: 7px;
  padding: 6px;
  color: var(--dim);
  cursor: pointer;
  display: flex; align-items: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.tfa-copy-mini svg { width: 13px; height: 13px; }
.tfa-copy-mini:hover { border-color: var(--vio); color: var(--vio); }

/* ===== CODE INPUT ===== */
.tfa-input {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--line-2);
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  letter-spacing: 12px;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  outline: none;
  background: var(--card);
  color: var(--txt);
  transition: all 0.2s;
  box-sizing: border-box;
}
.tfa-input:focus {
  border-color: var(--vio);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.tfa-input::placeholder { letter-spacing: 12px; color: var(--line-2); font-weight: 700; }

/* ===== ACTIONS ===== */
.tfa-actions { display: flex; gap: 8px; margin-top: 6px; }

.tfa-btn-grad {
  flex: 1;
  padding: 13px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  transition: all 0.2s;
}
.tfa-btn-grad:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.tfa-btn-grad:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

.tfa-btn-cancel {
  padding: 13px 18px;
  background: var(--card);
  color: var(--dim);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  transition: all 0.15s;
}
.tfa-btn-cancel:hover:not(:disabled) { border-color: var(--line-2); color: var(--txt); }

.tfa-btn-primary {
  width: 100%;
  padding: 13px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  transition: all 0.2s;
}
.tfa-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.tfa-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

.tfa-btn-danger {
  width: 100%;
  padding: 13px;
  background: var(--card);
  color: var(--bad, #e11d48);
  border: 1px solid rgba(225,29,72,0.3);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.tfa-btn-danger:hover:not(:disabled) { background: rgba(225,29,72,0.05); }
.tfa-btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

.tfa-btn-danger-solid {
  flex: 1;
  padding: 13px;
  background: var(--bad, #e11d48);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.tfa-btn-danger-solid:hover:not(:disabled) { background: #be123c; }
.tfa-btn-danger-solid:disabled { opacity: 0.4; cursor: not-allowed; }

.tfa-error {
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(225,29,72,0.05);
  color: var(--bad, #e11d48);
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid rgba(225,29,72,0.15);
  text-align: center;
  font-weight: 600;
}

.tfa-panel-enter-active, .tfa-panel-leave-active { transition: opacity 0.25s, transform 0.25s; }
.tfa-panel-enter-from, .tfa-panel-leave-to { opacity: 0; transform: translateY(12px) scale(0.96); }

@media (max-width: 480px) {
  .tfa-widget { bottom: calc(14px + env(safe-area-inset-bottom, 0px)); right: 14px; }
  .tfa-toggle-info { display: none; }
  .tfa-toggle { padding: 10px; border-radius: 999px; }
  .tfa-panel { max-width: calc(100vw - 28px); }
  .tfa-panel { padding: 18px 16px; }
}
</style>