<template>
  <div class="page">
    <div class="head">
      <div class="head-text">
        <h1>Profil Akun</h1>
        <p class="sub">Informasi akun merchant Anda</p>
      </div>
    </div>

    <div v-if="loading" class="state">
      <div class="spinner"></div>
      <p>Memuat</p>
    </div>

    <template v-else-if="user">
      <!-- PROFILE CARD -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar">{{ (user.name || user.email || 'U').charAt(0).toUpperCase() }}</div>
          <div class="profile-info">
            <h2>{{ user.name || 'Tanpa nama' }}</h2>
            <p>{{ user.email }}</p>
            <span class="role-badge">{{ user.role || 'user' }}</span>
          </div>
        </div>
      </div>

      <!-- DETAIL CARD -->
      <div class="card">
        <div class="card-head">
          <h3>Detail Akun</h3>
        </div>

        <div class="rows">
          <div class="row">
            <span class="label">Nama Lengkap</span>
            <strong class="value">{{ user.name || '-' }}</strong>
          </div>
          <div class="row store-row">
            <span class="label">Nama Toko</span>
            <form class="store-form" @submit.prevent="saveStore">
              <input v-model="storeInput" type="text" maxlength="60" placeholder="Nama toko kamu" />
              <button type="submit" :disabled="savingStore || storeInput.trim().length < 2 || storeInput.trim() === (user.storeName || '')">{{ savingStore ? 'Menyimpan' : 'Simpan' }}</button>
            </form>
          </div>
          <div class="row">
            <span class="label">Email</span>
            <strong class="value">{{ user.email }}</strong>
          </div>
          <div class="row">
            <span class="label">Nomor HP / WhatsApp</span>
            <strong class="value">{{ user.phone || '-' }}</strong>
          </div>
          <div class="row">
            <span class="label">Role</span>
            <span class="badge-role">{{ user.role || 'user' }}</span>
          </div>
          <div class="row">
            <span class="label">User ID</span>
            <code class="value mono">#{{ user.id }}</code>
          </div>
          <div class="row" v-if="user.status">
            <span class="label">Status</span>
            <span :class="['badge-status', user.status === 'active' ? 'badge-active' : 'badge-inactive']">
              {{ user.status }}
            </span>
          </div>
          <div class="row highlight">
            <span class="label">Saldo</span>
            <strong class="value big">{{ rupiah(user.balance) }}</strong>
          </div>
          <div class="row" v-if="user.isAdmin">
            <span class="label">Saldo Admin</span>
            <strong class="value">{{ rupiah(user.adminBalance) }}</strong>
          </div>
          <div class="row" v-if="user.createdAt">
            <span class="label">Terdaftar Sejak</span>
            <strong class="value">{{ formatDate(user.createdAt) }}</strong>
          </div>
          <div class="row" v-if="user.lastLoginAt">
            <span class="label">Login Terakhir</span>
            <strong class="value">{{ formatDate(user.lastLoginAt) }}</strong>
          </div>
        </div>
      </div>

      <!-- KEAMANAN / 2FA -->
      <div class="card">
        <div class="card-head">
          <h3>Keamanan</h3>
        </div>

        <div class="tfa-row">
          <div class="tfa-info">
            <div class="tfa-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tfa-lock" :class="{ on: totpEnabled }">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Two-Factor Authentication
            </div>
            <div class="tfa-desc">
              {{ totpEnabled ? 'Akun Anda dilindungi Google Authenticator' : 'Tambah lapisan keamanan dengan kode 6 digit' }}
            </div>
          </div>
          <button class="toggle" :class="{ on: totpEnabled }" @click="onToggleTfa" :disabled="tfaBusy">
            <span class="knob"></span>
          </button>
        </div>

        <!-- SETUP FLOW (OFF → ON) -->
        <div v-if="tfaMode === 'setup'" class="tfa-flow">
          <div class="tfa-step">
            <span class="step-num">1</span>
            <span class="step-text">Scan QR dengan Google Authenticator</span>
          </div>
          <div class="tfa-qr-wrap">
            <img v-if="tfaQr" :src="tfaQr" alt="QR 2FA" class="tfa-qr" />
            <div v-else class="tfa-qr-loading"><span class="mini-spinner"></span></div>
          </div>
          <div v-if="tfaSecret" class="tfa-manual">
            <code>{{ formattedSecret }}</code>
            <button class="btn-copy-sm" @click="copySecret" :class="{ copied: secretCopied }">
              {{ secretCopied ? 'Copied' : 'Copy' }}
            </button>
          </div>
          <div class="tfa-step">
            <span class="step-num">2</span>
            <span class="step-text">Masukkan kode 6 digit</span>
          </div>
          <input
            v-model="tfaCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            class="tfa-input"
            :disabled="tfaBusy"
            @keyup.enter="confirmEnable"
          />
          <div v-if="tfaError" class="tfa-error">{{ tfaError }}</div>
          <div class="tfa-actions">
            <button class="btn-ghost" @click="cancelTfa" :disabled="tfaBusy">Batal</button>
            <button class="btn-primary" @click="confirmEnable" :disabled="tfaBusy || tfaCode.length !== 6">
              {{ tfaBusy ? 'Memverifikasi' : 'Aktifkan 2FA' }}
            </button>
          </div>
        </div>

        <!-- DISABLE FLOW (ON → OFF) -->
        <div v-if="tfaMode === 'disable'" class="tfa-flow">
          <div class="tfa-warn">
            Masukkan kode 6 digit dari Google Authenticator untuk konfirmasi nonaktif.
          </div>
          <input
            v-model="tfaCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            class="tfa-input"
            :disabled="tfaBusy"
            @keyup.enter="confirmDisable"
          />
          <div v-if="tfaError" class="tfa-error">{{ tfaError }}</div>
          <div class="tfa-actions">
            <button class="btn-ghost" @click="cancelTfa" :disabled="tfaBusy">Batal</button>
            <button class="btn-danger" @click="confirmDisable" :disabled="tfaBusy || tfaCode.length !== 6">
              {{ tfaBusy ? 'Memproses' : 'Nonaktifkan' }}
            </button>
          </div>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div class="card">
        <div class="card-head">
          <h3>Aksi Cepat</h3>
        </div>

        <div class="quick-actions">
          <NuxtLink to="/merchant/api-key" class="qa-item">
            <div class="qa-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="qa-info">
              <div class="qa-title">Kredensial API</div>
              <div class="qa-desc">Kelola API key Anda</div>
            </div>
            <div class="qa-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </NuxtLink>

          <NuxtLink to="/merchant/webhook" class="qa-item">
            <div class="qa-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/>
                <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/>
                <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>
              </svg>
            </div>
            <div class="qa-info">
              <div class="qa-title">Webhook</div>
              <div class="qa-desc">Atur callback URL</div>
            </div>
            <div class="qa-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </NuxtLink>

          <NuxtLink to="/merchant/withdrawals" class="qa-item">
            <div class="qa-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="qa-info">
              <div class="qa-title">Tarik Dana</div>
              <div class="qa-desc">Ajukan penarikan saldo</div>
            </div>
            <div class="qa-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- DANGER ZONE -->
      <div class="card danger-card">
        <div class="card-head">
          <h3>Keluar Akun</h3>
          <p class="card-desc">Akhiri sesi login Anda dari perangkat ini</p>
        </div>

        <button class="btn-danger" @click="doLogout" :disabled="loggingOut">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>{{ loggingOut ? 'Keluar' : 'Logout' }}</span>
        </button>
      </div>
    </template>

    <div v-else class="state">
      <p>Gagal memuat data akun</p>
    </div>

    <!-- TOAST -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ toast.message }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const user = ref<any>(null)
const loading = ref(true)
const loggingOut = ref(false)

const toast = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.show = true
  toast.message = message
  toast.type = type
  setTimeout(() => { toast.show = false }, 2500)
}

// ── 2FA state ──
const totpEnabled = ref(false)
const tfaMode = ref<'' | 'setup' | 'disable'>('')
const tfaBusy = ref(false)
const tfaCode = ref('')
const tfaQr = ref('')
const tfaSecret = ref('')
const tfaError = ref('')
const secretCopied = ref(false)

const formattedSecret = computed(() => {
  if (!tfaSecret.value) return ''
  return tfaSecret.value.match(/.{1,4}/g)?.join(' ') || tfaSecret.value
})

const storeInput = ref('')
const savingStore = ref(false)
async function saveStore() {
  savingStore.value = true
  try {
    const r: any = await $fetch('/api/auth/profile', { method: 'PATCH', body: { storeName: storeInput.value.trim() }, credentials: 'include' })
    if (r?.success) { user.value.storeName = r.data.storeName; showToast('Nama toko disimpan') }
  } catch (e: any) {
    showToast(e?.data?.error || 'Gagal menyimpan', 'error')
  } finally { savingStore.value = false }
}

async function load() {
  loading.value = true
  try {
    const r: any = await $fetch('/api/auth/me', { credentials: 'include' }).catch(() => null)
    if (r?.success) {
      user.value = r.data
      storeInput.value = r.data.storeName || ''
      totpEnabled.value = r.data.totpEnabled === true
    }
  } finally {
    loading.value = false
  }
}

function cancelTfa() {
  tfaMode.value = ''
  tfaCode.value = ''
  tfaQr.value = ''
  tfaSecret.value = ''
  tfaError.value = ''
}

function onToggleTfa() {
  tfaError.value = ''
  tfaCode.value = ''
  tfaMode.value = totpEnabled.value ? 'disable' : 'setup'
  if (tfaMode.value === 'setup') startSetup()
}

async function startSetup() {
  tfaBusy.value = true
  try {
    const r: any = await $fetch('/api/auth/2fa/setup', { method: 'POST', credentials: 'include' })
    if (r?.success) {
      tfaQr.value = r.data.qrDataUrl || r.data.qr || r.data.qrUrl || ''
      tfaSecret.value = r.data.secret || r.data.manualEntry || ''
    } else {
      tfaError.value = r?.error || 'Gagal memulai setup'
    }
  } catch (e: any) {
    tfaError.value = e?.data?.error || e.message
  } finally {
    tfaBusy.value = false
  }
}

async function confirmEnable() {
  if (tfaCode.value.length !== 6) return
  tfaBusy.value = true
  tfaError.value = ''
  try {
    const r: any = await $fetch('/api/auth/2fa/verify-setup', {
      method: 'POST',
      body: { token: tfaCode.value },
      credentials: 'include',
    })
    if (r?.success) {
      totpEnabled.value = true
      cancelTfa()
      showToast('2FA berhasil diaktifkan')
    } else {
      tfaError.value = r?.error || 'Kode salah'
    }
  } catch (e: any) {
    tfaError.value = e?.data?.error || 'Kode salah'
  } finally {
    tfaBusy.value = false
  }
}

async function confirmDisable() {
  if (tfaCode.value.length !== 6) return
  tfaBusy.value = true
  tfaError.value = ''
  try {
    const r: any = await $fetch('/api/auth/2fa/disable', {
      method: 'POST',
      body: { token: tfaCode.value },
      credentials: 'include',
    })
    if (r?.success) {
      totpEnabled.value = false
      cancelTfa()
      showToast('2FA dinonaktifkan')
    } else {
      tfaError.value = r?.error || 'Kode salah'
    }
  } catch (e: any) {
    tfaError.value = e?.data?.error || 'Kode salah'
  } finally {
    tfaBusy.value = false
  }
}

async function copySecret() {
  if (!tfaSecret.value) return
  try {
    await navigator.clipboard.writeText(tfaSecret.value)
    secretCopied.value = true
    setTimeout(() => (secretCopied.value = false), 1800)
  } catch {}
}

async function doLogout() {
  if (!confirm('Keluar dari akun ini?')) return
  loggingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
  } finally {
    navigateTo('/login')
  }
}

function rupiah(n: number) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}

function formatDate(s: string) {
  if (!s) return '-'
  try {
    return new Date(s).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })
  } catch { return s }
}

onMounted(load)
</script>

<style scoped>
* { box-sizing: border-box; }

.page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 60px;
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.head { margin-bottom: 24px; }
.head-text { min-width: 0; }
h1 { font-size: 13px; font-weight: 700; letter-spacing: -0.02em; color: var(--txt); }
.sub { font-size: 13px; color: var(--dim); margin-top: 5px; }

.state { text-align: center; padding: 60px 20px; color: var(--dim); font-size: 13px; }
.spinner {
  width: 28px; height: 28px;
  border: 3px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 14px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== PROFILE CARD ===== */
.profile-card {
  padding: 26px;
  background: none;
  border: 1px solid rgba(var(--vio-rgb),0.22);
  border-radius: 8px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 18px;
  position: relative;
  z-index: 1;
}
.avatar {
  width: 72px; height: 72px;
  border-radius: 8px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  letter-spacing: -0.02em;
}
.profile-info { flex: 1; min-width: 0; }
.profile-info h2 {
  font-size: 13px; font-weight: 700;
  color: var(--txt);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.profile-info p {
  font-size: 13px;
  color: var(--dim);
  margin-bottom: 10px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.role-badge {
  display: inline-block;
  padding: 4px 11px;
  background: rgba(var(--vio-rgb),0.08);
  border: 1px solid rgba(var(--vio-rgb),0.2);
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--vio);
}

/* ===== CARD ===== */
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.card-head { margin-bottom: 14px; }
.card-head h3 {
  font-size: 13px;
  font-weight: 750;
  color: var(--txt);
  letter-spacing: -0.01em;
}
.card-desc {
  font-size: 12.5px;
  color: var(--dim);
  margin-top: 4px;
  line-height: 1.5;
}

.rows { display: flex; flex-direction: column; }
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  gap: 14px;
}
.row:last-child { border-bottom: none; }
.row.highlight {
  background: var(--bg-soft, var(--soft));
  margin: 0 -22px;
  padding: 14px 22px;
}
.label { font-size: 13px; color: var(--dim); flex-shrink: 0; }
.value { font-size: 13px; font-weight: 650; color: var(--txt); text-align: right; min-width: 0; word-break: break-word; }
.value.big { font-size: 13px; font-weight: 700; color: var(--vio-deep); }
.value.mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--vio-deep);
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  padding: 3px 9px;
  border-radius: 6px;
  font-weight: 700;
}

.badge-role {
  padding: 3px 11px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  background: rgba(var(--vio-rgb),0.08);
  border: 1px solid rgba(var(--vio-rgb),0.2);
  color: var(--vio);
}
.badge-status {
  padding: 3px 11px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
}
.badge-active {
  background: rgba(16,185,129,0.09);
  color: #059669;
  border: 1px solid rgba(16,185,129,0.25);
}
.badge-inactive {
  background: rgba(225,29,72,0.06);
  color: var(--bad, #e11d48);
  border: 1px solid rgba(225,29,72,0.18);
}

/* ===== 2FA ===== */
.tfa-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
}
.tfa-info { flex: 1; min-width: 0; }
.tfa-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 750;
  color: var(--txt);
  margin-bottom: 4px;
}
.tfa-lock {
  width: 16px; height: 16px;
  color: var(--dim);
  flex-shrink: 0;
  transition: color 0.2s;
}
.tfa-lock.on { color: var(--vio); }
.tfa-desc { font-size: 12.5px; color: var(--dim); line-height: 1.5; }

.toggle {
  position: relative;
  width: 52px; height: 30px;
  border-radius: 999px;
  background: var(--line);
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
  flex-shrink: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}
.toggle.on {
  background: var(--grad, var(--vio));
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.toggle:disabled { opacity: 0.5; cursor: not-allowed; }
.knob {
  position: absolute;
  top: 50%;
  left: 3px;
  transform: translateY(-50%);
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--card);
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.toggle.on .knob { left: 25px; }

.tfa-flow {
  padding: 18px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: slideDown 0.25s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: none; }
}
.tfa-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 650;
  color: var(--txt);
}
.step-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--grad, var(--vio));
  color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  flex-shrink: 0;
}
.step-text { min-width: 0; }
.tfa-qr-wrap { display: flex; justify-content: center; }
.tfa-qr {
  width: 170px; height: 170px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px;
}
.tfa-qr-loading {
  width: 170px; height: 170px;
  border-radius: 8px;
  background: var(--card);
  border: 1px dashed var(--line-2);
  display: flex; align-items: center; justify-content: center;
}
.mini-spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--line-2);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: block;
}
.tfa-manual {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.tfa-manual code {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--vio-deep);
  word-break: break-all;
  text-align: center;
}
.btn-copy-sm {
  padding: 5px 10px;
  border-radius: 7px;
  background: var(--card);
  border: 1px solid var(--line-2);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--dim);
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  transition: all 0.15s;
}
.btn-copy-sm:hover { border-color: var(--vio-2); color: var(--vio); }
.btn-copy-sm.copied {
  background: var(--grad, var(--vio));
  border-color: transparent;
  color: #ffffff;
}
.tfa-input {
  width: 100%;
  padding: 14px;
  border: 2px solid var(--line-2);
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  letter-spacing: 10px;
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
.tfa-input::placeholder { letter-spacing: 10px; color: var(--line-2); }
.tfa-error {
  padding: 10px 12px;
  background: rgba(225,29,72,0.05);
  border: 1px solid rgba(225,29,72,0.18);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--bad, #e11d48);
  text-align: center;
}
.tfa-warn {
  padding: 11px 14px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 8px;
  font-size: 12.5px;
  color: #92400e;
  line-height: 1.55;
  text-align: center;
}
.tfa-actions { display: flex; gap: 8px; }
.tfa-actions > * { flex: 1; }

/* ===== QUICK ACTIONS ===== */
.quick-actions { display: flex; flex-direction: column; gap: 8px; }
.qa-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
}
.qa-item:hover {
  background: var(--card);
  border-color: rgba(var(--vio-rgb),0.3);
  transform: translateX(2px);
}
.qa-icon {
  width: 40px; height: 40px;
  border-radius: 8px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.qa-icon svg { width: 18px; height: 18px; }
.qa-info { flex: 1; min-width: 0; }
.qa-title { font-size: 13px; font-weight: 750; color: var(--txt); margin-bottom: 2px; }
.qa-desc { font-size: 12px; color: var(--dim); }
.qa-arrow { color: var(--line-2); transition: color 0.15s; flex-shrink: 0; }
.qa-arrow svg { width: 16px; height: 16px; }
.qa-item:hover .qa-arrow { color: var(--vio); }

/* ===== DANGER ===== */
.danger-card { border-color: rgba(225,29,72,0.15); }
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  background: var(--card);
  border: 1px solid rgba(225,29,72,0.3);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 750;
  color: var(--bad, #e11d48);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
}
.btn-danger svg { width: 15px; height: 15px; }
.btn-danger:hover:not(:disabled) { background: rgba(225,29,72,0.05); }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== TOAST ===== */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  background: var(--txt);
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  z-index: 10000;
  max-width: calc(100% - 40px);
}
.toast svg { width: 16px; height: 16px; flex-shrink: 0; }
.toast-success svg { color: #34d399; }
.toast-error svg { color: #fb7185; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 12px); }

/* ===== MOBILE ===== */
@media (max-width: 640px) {
  .page { padding-bottom: 40px; }
  h1 { font-size: 13px; }
  .profile-card { padding: 20px; border-radius: 8px; }
  .avatar { width: 60px; height: 60px; font-size: 13px; border-radius: 8px; }
  .profile-info h2 { font-size: 13px; }
  .profile-info p { font-size: 12.5px; }
  .card { padding: 18px; }
  .row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 12px 0;
  }
  .row.highlight { margin: 0 -22px; padding: 14px 22px; }
  .value { text-align: left; }
  .tfa-row { flex-direction: column; align-items: flex-start; gap: 12px; }
  .qa-icon { width: 36px; height: 36px; }
  .btn-danger { width: 100%; justify-content: center; }
  .tfa-actions { flex-direction: column; }
}
.store-row { align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.store-form { display: flex; gap: 8px; flex: 1; min-width: 220px; justify-content: flex-end; }
.store-form input { flex: 1; min-width: 0; max-width: 280px; height: 36px; padding: 0 12px; border: 1px solid var(--line-2); border-radius: 8px; font-size: 13.5px; background: var(--card); color: inherit; }
.store-form input:focus { outline: none; border-color: var(--vio); box-shadow: 0 0 0 3px rgba(var(--vio-rgb),.12); }
.store-form button { height: 36px; padding: 0 16px; border-radius: 8px; background: var(--txt); color: #fff; font-size: 13px; font-weight: 600; }
.store-form button:disabled { opacity: .4; cursor: not-allowed; }
</style>