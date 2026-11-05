<template>
  <div class="page">
    <div class="head">
      <NuxtLink to="/merchant/transaction" class="btn-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Kembali
      </NuxtLink>
      <button class="btn-refresh" @click="load" :disabled="loading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: loading }">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        <span>{{ loading ? 'Memuat' : 'Refresh' }}</span>
      </button>
    </div>

    <div v-if="trx" class="title-block">
      <h1>Detail Transaksi</h1>
      <div class="subtitle-row">
        <span class="subtitle mono">{{ trx.trxId }}</span>
        <button class="btn-mini" @click="copyText(trx.trxId, 'trxid')" :class="{ copied: copiedKey === 'trxid' }">
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

    <div v-if="loading && !trx" class="state">
      <div class="spinner"></div>
      <p>Memuat</p>
    </div>

    <div v-else-if="!trx" class="state">
      <p>Transaksi tidak ditemukan</p>
    </div>

    <template v-else>
      <div class="status-wrap">
        <span class="status-badge" :class="'s-' + (trx.status || '').toLowerCase()">
          <span class="dot"></span>
          {{ statusLabel(trx.status) }}
        </span>
      </div>

      <div class="card">
        <div class="row">
          <div class="label">Payment ID</div>
          <div class="value-wrap">
            <span class="value mono">{{ trx.trxId }}</span>
            <button class="btn-copy" @click="copyText(trx.trxId, 'pid')" :class="{ copied: copiedKey === 'pid' }" title="Copy">
              <svg v-if="copiedKey !== 'pid'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="row">
          <div class="label">Referensi</div>
          <div class="value-wrap">
            <span class="value mono">{{ trx.metadata?.merchant_reference || '-' }}</span>
            <button
              v-if="trx.metadata?.merchant_reference"
              class="btn-copy"
              @click="copyText(trx.metadata.merchant_reference, 'ref')"
              :class="{ copied: copiedKey === 'ref' }"
              title="Copy"
            >
              <svg v-if="copiedKey !== 'ref'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="row">
          <div class="label">Nominal</div>
          <div class="value">{{ rupiah(trx.amount) }}</div>
        </div>
        <div class="row">
          <div class="label">Fee ({{ trx.feePercent || 1.8 }}%)</div>
          <div class="value warn">-{{ rupiah(trx.fee || 0) }}</div>
        </div>
        <div class="row highlight">
          <div class="label">Net</div>
          <div class="value big">{{ rupiah(trx.net || (trx.amount - (trx.fee || 0))) }}</div>
        </div>
        <div class="row">
          <div class="label">Total Dibayar</div>
          <div class="value">{{ rupiah(trx.amountToPay || trx.amount) }}</div>
        </div>
        <div class="row">
          <div class="label">Metode</div>
          <div class="value"><span class="method-badge">QRIS</span></div>
        </div>
        <div class="row">
          <div class="label">Pelanggan</div>
          <div class="value">{{ trx.metadata?.customer_name || '-' }}</div>
        </div>
        <div class="row">
          <div class="label">Deskripsi</div>
          <div class="value">{{ trx.metadata?.description || '-' }}</div>
        </div>
        <div class="row">
          <div class="label">Dibuat</div>
          <div class="value">{{ formatDate(trx.createdAt) }}</div>
        </div>
        <div class="row">
          <div class="label">Expired</div>
          <div class="value">{{ formatDate(trx.expiresAt) }}</div>
        </div>
        <div class="row">
          <div class="label">Dibayar</div>
          <div class="value">{{ trx.paidAt ? formatDate(trx.paidAt) : '-' }}</div>
        </div>
      </div>

      <div v-if="qrUrl || trx.qrImageUrl" class="card qr-card">
        <div class="qr-head">
          <p class="qr-label">QRIS</p>
          <button class="btn-mini" @click="downloadQr" :disabled="downloading" title="Download QR">
            <svg v-if="!downloading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span v-else class="btn-spinner-small"></span>
            <span>Download</span>
          </button>
        </div>
        <div class="qr-box">
          <img :src="qrUrl || trx.qrImageUrl" alt="QRIS" />
        </div>
        <p class="qr-amount">{{ rupiah(trx.amountToPay || trx.amount) }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const trxId = computed(() => route.params.trxId as string)

const trx = ref<any>(null)
const loading = ref(true)
const qrUrl = ref('')
const copiedKey = ref<string | null>(null)
const downloading = ref(false)

async function load() {
  loading.value = true
  try {
    const r: any = await $fetch(`/api/user/payment/${encodeURIComponent(trxId.value)}`, {
      credentials: 'include',
    })
    trx.value = r.data || null
    if (trx.value?.qrImageUrl) {
      qrUrl.value = trx.value.qrImageUrl
    } else if (trx.value?.qrString) {
      const QRCode = (await import('qrcode')).default
      qrUrl.value = await QRCode.toDataURL(trx.value.qrString, { width: 400, margin: 2 })
    }
  } catch (e) {
    trx.value = null
  } finally {
    loading.value = false
  }
}

async function copyText(text: string, key: string) {
  if (!text || text === '-') return
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

async function downloadQr() {
  const src = qrUrl.value || trx.value?.qrImageUrl
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
  } catch (e) {
    alert('Gagal download QR')
  } finally {
    downloading.value = false
  }
}

function rupiah(n: number) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID') }
function formatDate(s: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })
}
function statusLabel(s: string) {
  if (s === 'PAID') return 'Berhasil'
  if (s === 'PENDING') return 'Menunggu'
  if (s === 'EXPIRED') return 'Kadaluwarsa'
  return s
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

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-back, .btn-refresh {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 15px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 12.5px; font-weight: 650;
  color: var(--txt);
  cursor: pointer; font-family: inherit;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-back:hover, .btn-refresh:hover:not(:disabled) {
  border-color: var(--vio-2);
  color: var(--vio);
}
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-back svg, .btn-refresh svg { width: 13px; height: 13px; }
.btn-refresh svg.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.title-block { margin-bottom: 18px; }
h1 { font-size: 13px; font-weight: 700; letter-spacing: -0.025em; color: var(--txt); }
.subtitle-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.subtitle {
  font-size: 13px;
  color: var(--dim);
  letter-spacing: 0.02em;
}
.btn-mini {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  color: var(--dim);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  white-space: nowrap;
}
.btn-mini:hover:not(:disabled) {
  border-color: var(--vio-2);
  color: var(--vio);
}
.btn-mini:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-mini svg { width: 12px; height: 12px; }
.btn-mini.copied {
  background: var(--grad, var(--vio));
  border-color: transparent;
  color: #ffffff;
}

.mono { font-family: ui-monospace, 'SF Mono', monospace; }

/* STATUS BADGE */
.status-wrap { margin-bottom: 18px; }
.status-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 15px;
  border-radius: 999px;
  font-size: 11px; font-weight: 700;
  border: 1px solid;
}
.status-badge .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.status-badge.s-paid {
  background: rgba(16,185,129,0.09);
  border-color: rgba(16,185,129,0.25);
  color: #059669;
}
.status-badge.s-pending {
  background: rgba(245,158,11,0.09);
  border-color: rgba(245,158,11,0.25);
  color: #d97706;
}
.status-badge.s-pending .dot { animation: pulse 1.8s infinite; }
.status-badge.s-expired {
  background: var(--bg-soft, var(--soft));
  border-color: var(--line);
  color: var(--dim);
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* CARD */
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 22px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.row {
  display: flex; justify-content: space-between;
  align-items: center; gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}
.row:last-child { border-bottom: none; }
.row.highlight {
  background: var(--bg-soft, var(--soft));
  margin: 0 -22px;
  padding: 14px 22px;
  border-bottom: none;
}
.label { font-size: 12.5px; color: var(--dim); flex-shrink: 0; }
.value {
  font-size: 13px; color: var(--txt); font-weight: 650;
  text-align: right; word-break: break-word;
  min-width: 0;
}
.value.big { font-size: 13px; font-weight: 700; color: var(--vio-deep); }
.value.warn { color: #d97706; font-weight: 700; }
.value.mono { font-size: 12.5px; font-weight: 650; letter-spacing: 0.02em; }

.method-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 9.5px;
  font-weight: 700;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  letter-spacing: 0.06em;
}

/* VALUE WRAP + COPY */
.value-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 70%;
}
.value-wrap .value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}
.btn-copy {
  width: 26px; height: 26px;
  border-radius: 7px;
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

/* QR CARD */
.qr-card { text-align: center; padding: 22px; }
.qr-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: 10px;
}
.qr-label {
  font-size: 10.5px; font-weight: 700;
  color: var(--vio);
  margin: 0;
}
.btn-spinner-small {
  width: 11px; height: 11px;
  border: 1.5px solid rgba(255,255,255,0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
.qr-box {
  display: inline-block;
  background: var(--card);
  border: 1px solid var(--line);
  padding: 14px;
  border-radius: 8px;
  margin-bottom: 14px;
  max-width: 100%;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.qr-box img {
  width: 240px;
  max-width: 100%;
  height: auto;
  display: block;
}
.qr-amount {
  font-size: 13px; font-weight: 700;
  color: var(--txt); letter-spacing: -0.025em;
  margin: 0;
}

.state { text-align: center; padding: 60px 20px; color: var(--dim); font-size: 13px; }
.spinner {
  width: 28px; height: 28px;
  border: 3px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 14px;
}

/* MOBILE */
@media (max-width: 640px) {
  .page { padding-bottom: 40px; }
  h1 { font-size: 13px; }
  .card { padding: 6px 18px; }
  .row.highlight { margin: 0 -18px; padding: 14px 18px; }
  .label { font-size: 12px; }
  .value { font-size: 12.5px; }
  .value.big { font-size: 13px; }
  .value-wrap { max-width: 65%; }
  .value-wrap .value { font-size: 11.5px; }
  .btn-back, .btn-refresh { padding: 8px 12px; font-size: 12px; }
  .qr-box img { width: 200px; }
  .qr-amount { font-size: 13px; }
}

@media (max-width: 400px) {
  .btn-refresh span, .btn-back span { display: none; }
  .qr-box img { width: 180px; }
}
</style>