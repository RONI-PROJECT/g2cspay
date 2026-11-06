<template>
  <div class="page">
    <header class="nav">
      <div class="brand">
        <NuxtLink to="/" class="brand-logo">
          <SiteLogo />
        </NuxtLink>
      </div>
      <div class="nav-status" :class="'is-' + (trx?.status || 'loading').toLowerCase()">
        <span class="status-dot"></span>
        <span>{{ statusLabel(trx?.status) }}</span>
      </div>
    </header>

    <div v-if="loading && !trx" class="state">
      <div class="spinner"></div>
      <p>Memuat transaksi</p>
    </div>

    <div v-else-if="error" class="state">
      <div class="err-icon">!</div>
      <h2>Transaksi Tidak Ditemukan</h2>
      <p>{{ error }}</p>
      <NuxtLink to="/" class="btn-primary">Ke Dashboard</NuxtLink>
    </div>

    <template v-else-if="trx">
      <!-- MERCHANT INFO -->
      <div class="merchant-card">
        <div class="merchant-avatar">{{ String(trx.storeName || siteName || 'C').trim().charAt(0).toUpperCase() }}</div>
        <div class="merchant-info">
          <h3>{{ trx.storeName || siteName }}</h3>
          <p>{{ siteDescription }}</p>
        </div>
      </div>

      <!-- AMOUNT -->
      <div class="amount-card">
        <p class="amount-label">TOTAL PEMBAYARAN</p>
        <div class="amount-value">
          <span class="amount-currency">Rp</span>
          <span class="amount-number">{{ formatRupiah(trx.amountToPay || trx.amount) }}</span>
        </div>
      </div>

      <!-- PENDING: QR + COUNTDOWN -->
      <div v-if="trx.status === 'PENDING'" class="qr-section">
        <div class="qr-wrap">
          <div class="qr-box" v-if="qrUrl">
            <img :src="qrUrl" alt="QRIS" />
          </div>
          <div v-else class="qr-loading">
            <div class="spinner"></div>
          </div>
        </div>

        <!-- COUNTDOWN -->
        <div v-if="timeLeft > 0" class="countdown">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="countdown-icon">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span class="countdown-text">Sisa waktu:</span>
          <span class="countdown-value">{{ formatCountdown(timeLeft) }}</span>
        </div>

        <div class="waiting-badge">
          <span class="waiting-dot"></span>
          Menunggu Pembayaran
        </div>

        <div class="method-badge">QRIS</div>

        <p class="qr-hint">
          Scan pakai GoPay, DANA, OVO, ShopeePay, atau m-banking
        </p>

        <!-- QR ACTIONS -->
        <div class="qr-actions">
          <button class="qr-action" @click="downloadQr" :disabled="!qrUrl || downloading">
            <svg v-if="!downloading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span v-else class="btn-spinner-small"></span>
            <span>Download QR</span>
          </button>
          <button class="qr-action" @click="copyQrLink" :class="{ copied: copiedKey === 'link' }">
            <svg v-if="copiedKey !== 'link'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{{ copiedKey === 'link' ? 'Copied!' : 'Salin Link' }}</span>
          </button>
        </div>
      </div>

      <!-- PAID -->
      <div v-else-if="trx.status === 'PAID'" class="result-section">
        <div class="result-icon success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>Pembayaran Berhasil</h2>
        <p class="result-sub">Terima kasih, pembayaran sudah diterima.</p>
        <div class="result-meta">
          <span>Dibayar</span>
          <strong>{{ formatDate(trx.paidAt) }}</strong>
        </div>
      </div>

      <!-- EXPIRED -->
      <div v-else-if="trx.status === 'EXPIRED'" class="result-section">
        <div class="result-icon expired">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <h2>Pembayaran Kadaluwarsa</h2>
        <p class="result-sub">Waktu pembayaran sudah habis.</p>
      </div>

      <!-- DETAIL -->
      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">ID Transaksi</span>
          <div class="detail-value-wrap">
            <span class="detail-value mono">{{ trx.trxId }}</span>
            <button class="btn-copy" @click="copyText(trx.trxId, 'trxid')" :class="{ copied: copiedKey === 'trxid' }" title="Copy">
              <svg v-if="copiedKey !== 'trxid'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-status" :class="'is-' + trx.status.toLowerCase()">
            <span class="dot"></span>
            {{ statusLabel(trx.status) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Dibuat</span>
          <span class="detail-value">{{ formatDate(trx.createdAt) }}</span>
        </div>
        <div v-if="trx.status === 'PENDING'" class="detail-row">
          <span class="detail-label">Berlaku sampai</span>
          <span class="detail-value">{{ formatDate(trx.expiresAt) }}</span>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Dilindungi enkripsi SSL</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const trxId = computed(() => route.params.trxId as string)

const { siteName, siteDescription } = useSiteSettings()

const trx = ref<any>(null)
const qrUrl = ref('')
const loading = ref(true)
const error = ref('')
const copiedKey = ref<string | null>(null)
const downloading = ref(false)
const timeLeft = ref(0)

let pollTimer: any = null
let countdownTimer: any = null

async function load() {
  try {
    const r: any = await $fetch(`/api/public/payment/${encodeURIComponent(trxId.value)}`)
    if (!r?.success) throw new Error(r?.error || 'not found')
    trx.value = r.data

    if (r.data.status === 'PENDING' && !qrUrl.value && r.data.qrString) {
      const QRCode = (await import('qrcode')).default
      qrUrl.value = await QRCode.toDataURL(r.data.qrString, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0a0a0a', light: '#ffffff' },
      })
    }

    if (r.data.status === 'PENDING' && r.data.expiresAt) {
      updateCountdown()
    }

    if (r.data.status !== 'PENDING') {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
      if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
    }
  } catch (e: any) {
    if (!trx.value) {
      error.value = e?.data?.error || e.message || 'Gagal memuat transaksi'
    }
  } finally {
    loading.value = false
  }
}

function updateCountdown() {
  if (!trx.value?.expiresAt) { timeLeft.value = 0; return }
  const expire = new Date(trx.value.expiresAt).getTime()
  const now = Date.now()
  timeLeft.value = Math.max(0, Math.floor((expire - now) / 1000))
}

function formatCountdown(sec: number) {
  if (sec <= 0) return '00:00'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function copyText(text: string, key: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => { if (copiedKey.value === key) copiedKey.value = null }, 1800)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
    copiedKey.value = key
    setTimeout(() => { if (copiedKey.value === key) copiedKey.value = null }, 1800)
  }
}

async function copyQrLink() {
  if (typeof window === 'undefined') return
  await copyText(window.location.href, 'link')
}

async function downloadQr() {
  const src = qrUrl.value
  if (!src) return
  downloading.value = true
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qris-${trx.value?.trxId || 'payment'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    alert('Gagal download QR')
  } finally {
    downloading.value = false
  }
}

function formatRupiah(n: number) {
  return Number(n || 0).toLocaleString('id-ID')
}
function formatDate(s: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })
}
function statusLabel(s?: string) {
  if (!s) return 'Memuat'
  if (s === 'PENDING') return 'Menunggu'
  if (s === 'PAID') return 'Berhasil'
  if (s === 'EXPIRED') return 'Kadaluwarsa'
  return s
}

onMounted(async () => {
  await load()
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && trx.value?.status === 'PENDING') {
      load()
    }
  }, 4000)
  countdownTimer = setInterval(() => {
    if (trx.value?.status === 'PENDING') updateCountdown()
  }, 1000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})

useHead({ title: computed(() => trx.value?.trxId ? `Pembayaran ${trx.value.trxId} - ${siteName.value}` : 'Pembayaran') })
</script>

<style scoped>
* { box-sizing: border-box; }

.page {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg, #ffffff);
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  padding-bottom: 40px;
  -webkit-font-smoothing: antialiased;
}

/* ===== NAVBAR ===== */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  gap: 12px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.brand-logo {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  line-height: 0;
  transition: opacity 0.15s;
}
.brand-logo:hover { opacity: 0.85; }
.brand-logo :deep(img) {
  height: 28px;
  width: auto;
  display: block;
}

.nav-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 13px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}
.nav-status.is-pending {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #d97706;
}
.nav-status.is-paid {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #059669;
}
.nav-status.is-expired {
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  color: var(--dim);
  opacity: 0.8;
}
.nav-status.is-loading {
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  color: var(--dim);
}
.status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.nav-status.is-pending .status-dot { animation: pulse 2s infinite; }
.nav-status.is-loading .status-dot { animation: pulse 1s infinite; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* ===== STATE ===== */
.state {
  text-align: center;
  padding: 60px 24px;
  color: var(--dim);
  font-size: 13px;
}
.state h2 {
  color: var(--txt);
  font-size: 13px;
  margin: 16px 0 8px;
  font-weight: 700;
}
.spinner {
  width: 28px; height: 28px;
  border: 3px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 14px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.btn-spinner-small {
  width: 11px; height: 11px;
  border: 1.5px solid rgba(255,255,255,0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
.err-icon {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: rgba(225, 29, 72, 0.06);
  border: 2px solid rgba(225, 29, 72, 0.25);
  color: var(--bad, #e11d48);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  font-weight: 700;
  margin: 0 auto 16px;
}
.btn-primary {
  display: inline-block;
  margin-top: 20px;
  padding: 12px 26px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

/* ===== MERCHANT ===== */
.merchant-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line);
}
.merchant-avatar {
  width: 44px; height: 44px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  padding: 8px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.merchant-avatar { font-size: 18px; font-weight: 800; color: var(--vio); background: rgba(var(--vio-rgb),.08); }
.merchant-avatar :deep(img) {
  width: 100%;
  height: auto;
}
.merchant-info { min-width: 0; }
.merchant-info h3 {
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  margin-bottom: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.merchant-info p {
  font-size: 12px;
  color: var(--dim);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== AMOUNT ===== */
.amount-card {
  text-align: center;
  padding: 28px 20px 8px;
}
.amount-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--dim);
  margin-bottom: 10px;
}
.amount-value {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}
.amount-currency {
  font-size: 13px;
  color: var(--dim);
  font-weight: 600;
}
.amount-number {
  font-size: 27px;
  font-weight: 700;
  color: var(--txt);
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

/* ===== QR SECTION ===== */
.qr-section {
  padding: 24px 20px 8px;
  text-align: center;
}
.qr-wrap {
  display: inline-block;
  position: relative;
}
.qr-box {
  display: inline-block;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--line);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.qr-box img {
  width: 260px;
  max-width: 100%;
  height: auto;
  display: block;
}
.qr-loading {
  width: 260px;
  height: 260px;
  max-width: 100%;
  border-radius: 8px;
  background: var(--bg-soft, var(--soft));
  border: 1px dashed var(--line-2);
  display: flex; align-items: center; justify-content: center;
}

/* COUNTDOWN */
.countdown {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 8px 16px;
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 999px;
  font-size: 12.5px;
  color: #fbbf24;
}
.countdown-icon { width: 14px; height: 14px; flex-shrink: 0; color: #d97706; }
.countdown-text { color: #fbbf24; }
.countdown-value {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-weight: 700;
  color: #fbbf24;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.waiting-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 9px 18px;
  border-radius: 999px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
}
.waiting-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--vio);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  animation: pulse 1.5s infinite;
}
.method-badge {
  display: inline-block;
  margin-top: 14px;
  padding: 5px 14px;
  border-radius: 8px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.qr-hint {
  margin-top: 16px;
  font-size: 12.5px;
  color: var(--dim);
  line-height: 1.6;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

/* QR ACTIONS */
.qr-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  justify-content: center;
  flex-wrap: wrap;
}
.qr-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 650;
  color: var(--dim);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  white-space: nowrap;
}
.qr-action svg { width: 13px; height: 13px; }
.qr-action:hover:not(:disabled) {
  border-color: var(--vio-2);
  color: var(--vio);
}
.qr-action:disabled { opacity: 0.5; cursor: not-allowed; }
.qr-action.copied {
  background: var(--grad, var(--vio));
  border-color: transparent;
  color: #ffffff;
}

/* ===== RESULT ===== */
.result-section {
  text-align: center;
  padding: 32px 20px;
}
.result-icon {
  width: 88px; height: 88px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.result-icon.success {
  background: var(--grad, var(--vio));
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.result-icon.expired {
  background: var(--bg-soft, var(--soft));
  border: 2px solid var(--line-2);
  color: var(--dim);
}
.result-icon svg { width: 44px; height: 44px; }
.result-section h2 {
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}
.result-sub {
  font-size: 13px;
  color: var(--dim);
  margin-bottom: 24px;
}
.result-meta {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  padding: 12px 20px;
  border-radius: 8px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  font-size: 13px;
}
.result-meta span { color: var(--dim); }
.result-meta strong { color: var(--txt); font-weight: 700; }

/* ===== DETAIL ===== */
.detail-card {
  margin: 24px 20px 0;
  padding: 6px 20px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  gap: 14px;
}
.detail-row:last-child { border-bottom: none; }
.detail-label {
  font-size: 12.5px;
  color: var(--dim);
  flex-shrink: 0;
}
.detail-value {
  font-size: 12.5px;
  color: var(--txt);
  font-weight: 700;
  text-align: right;
  word-break: break-word;
}
.detail-value.mono {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 12px;
  color: var(--vio-ink);
}
.detail-value-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 65%;
}
.detail-value-wrap .detail-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-copy {
  width: 24px; height: 24px;
  border-radius: 6px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.btn-copy svg { width: 11px; height: 11px; }
.btn-copy:hover {
  border-color: var(--vio-2);
  color: var(--vio);
}
.btn-copy.copied {
  background: var(--grad, var(--vio));
  border-color: transparent;
  color: #ffffff;
}
.detail-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
}
.detail-status .dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.detail-status.is-paid { color: #059669; }
.detail-status.is-pending { color: #d97706; }
.detail-status.is-expired { color: var(--dim); }
.detail-status.is-pending .dot { animation: pulse 2s infinite; }

/* ===== FOOTER ===== */
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 36px;
  color: var(--dim);
  font-size: 11.5px;
  font-weight: 500;
}
.footer svg { opacity: 0.6; color: var(--vio); }

/* ===== MOBILE ===== */
@media (max-width: 480px) {
  .nav { padding: 14px 16px; }
  .brand-logo :deep(img) { height: 24px; }
  .nav-status { padding: 5px 11px; font-size: 11px; }
  .amount-number { font-size: 16px; }
  .amount-currency { font-size: 13px; }
  .qr-box { padding: 14px; border-radius: 8px; }
  .qr-box img { width: 220px; }
  .qr-loading { width: 220px; height: 220px; }
  .result-icon { width: 72px; height: 72px; }
  .result-icon svg { width: 36px; height: 36px; }
  .detail-card { margin: 20px 16px 0; padding: 4px 16px; }
  .merchant-card { padding: 14px 16px; }
  .merchant-avatar { width: 40px; height: 40px; }
}

@media (prefers-reduced-motion: reduce) {
  .status-dot,
  .waiting-dot,
  .spinner,
  .btn-spinner-small {
    animation: none !important;
  }
}
</style>
