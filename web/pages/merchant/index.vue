<template>
  <div class="dash">
    <div class="dash-header">
      <div>
        <h2 class="welcome">Selamat datang kembali</h2>
        <p class="welcome-sub">Ringkasan aktivitas merchant kamu</p>
      </div>
      <div class="live-tag">
        <span class="pulse"></span>
        Live
      </div>
    </div>

    <div class="balance-grid">
      <div class="balance-card">
        <div class="bc-head">
          <div class="bc-label">Saldo Settled</div>
          <div class="bc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
            </svg>
          </div>
        </div>
        <div class="bc-value">{{ rupiah(balance?.available ?? 0) }}</div>
      </div>

      <div class="balance-card">
        <div class="bc-head">
          <div class="bc-label">Saldo Pending</div>
          <div class="bc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
        </div>
        <div class="bc-value">{{ rupiah(balance?.pending ?? 0) }}</div>
      </div>

      <div class="balance-card">
        <div class="bc-head">
          <div class="bc-label">Total Diterima</div>
          <div class="bc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
        </div>
        <div class="bc-value">{{ rupiah(balance?.totalPaid ?? 0) }}</div>
      </div>

      <div class="balance-card">
        <div class="bc-head">
          <div class="bc-label">Total Transaksi</div>
          <div class="bc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
        </div>
        <div class="bc-value">{{ transactions.length }}</div>
      </div>
    </div>

    <div class="section-head">
      <h3>Aksi Cepat</h3>
    </div>
    <div class="quick-actions">
      <NuxtLink to="/merchant/qris" class="qa-item">
        <div class="qa-icon qa-icon-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="qa-info">
          <div class="qa-title">Buat QRIS</div>
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
        </div>
        <div class="qa-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </NuxtLink>

      <NuxtLink to="/merchant/api-key" class="qa-item">
        <div class="qa-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="qa-info">
          <div class="qa-title">Kredensial</div>
        </div>
        <div class="qa-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </NuxtLink>
    </div>

    <div class="card">
      <div class="card-head">
        <h3 class="card-title">Volume Transaksi</h3>
        <div class="card-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
          Rp {{ Number(stats?.summary?.totalPaid || 0).toLocaleString('id-ID') }}
        </div>
      </div>
      <div class="chart-wrap">
        <VolumeChart :series="stats?.series || []" realtime />
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <h3 class="card-title">Status Pembayaran</h3>
        </div>

        <div class="status-list">
          <div class="status-row">
            <div class="status-left">
              <span class="status-dot paid"></span>
              <div class="status-label">Berhasil</div>
            </div>
            <span class="status-count">{{ stats?.summary?.paid ?? 0 }}</span>
          </div>

          <div class="status-row">
            <div class="status-left">
              <span class="status-dot pending"></span>
              <div class="status-label">Pending</div>
            </div>
            <span class="status-count">{{ stats?.summary?.pending ?? 0 }}</span>
          </div>

          <div class="status-row">
            <div class="status-left">
              <span class="status-dot expired"></span>
              <div class="status-label">Kadaluwarsa</div>
            </div>
            <span class="status-count">{{ stats?.summary?.expired ?? 0 }}</span>
          </div>
        </div>

        <div class="settled-box">
          <div class="settled-label">Saldo Settled</div>
          <div class="settled-value">{{ rupiah(balance?.available ?? 0) }}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3 class="card-title">Pembayaran Terbaru</h3>
          <NuxtLink to="/merchant/transaction" class="card-link">
            Lihat semua
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </NuxtLink>
        </div>

        <div v-if="loading && transactions.length === 0" class="trx-skeleton">
          <div v-for="i in 3" :key="i" class="skel-row">
            <div class="skel-icon"></div>
            <div class="skel-body">
              <div class="skel-line skel-line-1"></div>
              <div class="skel-line skel-line-2"></div>
            </div>
            <div class="skel-right">
              <div class="skel-line skel-line-3"></div>
              <div class="skel-line skel-line-4"></div>
            </div>
          </div>
        </div>

        <div v-else-if="transactions.length === 0" class="empty-trx">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p>Belum ada transaksi</p>
          <NuxtLink to="/merchant/qris" class="btn-small">Buat QRIS Pertama</NuxtLink>
        </div>

        <ul v-else class="trx-list">
          <li v-for="t in transactions.slice(0, 5)" :key="t.trxId" class="trx-item">
            <div class="trx-icon" :class="t.status?.toLowerCase()">
              <span v-if="t.status === 'PAID'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span v-else-if="t.status === 'PENDING'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
              <span v-else>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </span>
            </div>
            <NuxtLink :to="`/merchant/transaction/${t.trxId}`" class="trx-info">
              <div class="trx-id">{{ t.trxId }}</div>
              <div class="trx-time">{{ formatDate(t.createdAt) }}</div>
            </NuxtLink>
            <div class="trx-right">
              <div class="trx-amt">{{ rupiah(t.amount) }}</div>
              <span :class="['badge', 'badge-' + (t.status || '').toLowerCase()]">
                {{ statusLabel(t.status) }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const balance = ref<any>({})
const stats = ref<any>({ series: [], summary: {} })
const transactions = ref<any[]>([])
const lastUpdate = ref('-')
const loading = ref(true)
let interval: any = null
let busy = false

async function load() {
  if (busy) return // request sebelumnya belum selesai, jangan numpuk
  busy = true
  try {
    const opt: any = { credentials: 'include' }
    const [b, s, t]: any = await Promise.allSettled([
      $fetch('/api/user/balance', opt),
      $fetch('/api/user/stats?days=30', opt),
      $fetch('/api/user/payment/list', opt),
    ])
    // yang gagal tetap pakai data sebelumnya, tidak diganti 0
    if (b.status === 'fulfilled') balance.value = b.value?.data || {}
    if (s.status === 'fulfilled') stats.value = s.value?.data || { series: [], summary: {} }
    if (t.status === 'fulfilled') transactions.value = Array.isArray(t.value?.data) ? t.value.data : []
    if ([b, s, t].some((r: any) => r.status === 'fulfilled')) {
      lastUpdate.value = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).replace('.', ':')
    }
  } catch (e) {
    console.error('load error:', e)
  } finally {
    busy = false
    loading.value = false
  }
}

function onVisible() { if (document.visibilityState === 'visible') load() }

onMounted(() => {
  load()
  interval = setInterval(() => { if (document.visibilityState === 'visible') load() }, 15000)
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
  document.removeEventListener('visibilitychange', onVisible)
})

function rupiah(n: number) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}
function formatDate(s: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' })
}
function statusLabel(s: string) {
  if (s === 'PAID') return 'Berhasil'
  if (s === 'PENDING') return 'Menunggu'
  if (s === 'EXPIRED') return 'Kadaluwarsa'
  return s
}
</script>

<style scoped>
* { box-sizing: border-box; }

.dash {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  padding-bottom: 160px;
  overflow-x: clip;
}
.dash > * { max-width: 100%; box-sizing: border-box; }

.dash-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
}
.welcome { font-size: 19px; font-weight: 750; letter-spacing: -0.03em; color: var(--txt); }
.welcome-sub { font-size: 13px; color: var(--dim); margin-top: 5px; }
.live-tag {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 12px; font-weight: 600; color: var(--txt);
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.pulse {
  width: 6px; height: 6px; border-radius: 50%; background: #10b981;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.85); }
}

/* ===== BALANCE GRID ===== */
.balance-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 32px;
}
@media (max-width: 1024px) { .balance-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px)  { .balance-grid { grid-template-columns: 1fr; gap: 10px; } }

.balance-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.25s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  position: relative;
  overflow: hidden;
}
.balance-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: var(--grad);
  opacity: 0;
  transition: opacity 0.25s;
}
.balance-card:hover { transform: translateY(-3px); border-color: var(--line-2); box-shadow: 0 10px 24px rgba(var(--shadow-rgb),0.10); }
.balance-card:hover::before { opacity: 1; }

.bc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 10px; }
.bc-label { font-size: 11px; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: 0.05em; }
.bc-icon {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  flex-shrink: 0;
}
.bc-icon svg { width: 16px; height: 16px; }
.bc-value {
  font-size: 21px; font-weight: 800; color: var(--txt);
  letter-spacing: -0.03em; font-variant-numeric: tabular-nums;
  line-height: 1.15;
  word-break: break-word;
}

.section-head { margin-bottom: 14px; }
.section-head h3 { font-size: 12px; font-weight: 700; color: var(--dim); }

/* ===== QUICK ACTIONS ===== */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}
@media (max-width: 900px) { .quick-actions { grid-template-columns: 1fr; } }
.qa-item {
  display: flex; align-items: center; gap: 14px;
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.25s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.qa-item:hover { border-color: rgba(var(--vio-rgb),0.25); transform: translateY(-3px); box-shadow: 0 10px 24px rgba(var(--shadow-rgb),0.10); }
.qa-icon {
  width: 44px; height: 44px; border-radius: 8px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.qa-icon-primary {
  background: var(--grad);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.qa-item:hover .qa-icon:not(.qa-icon-primary) {
  background: rgba(var(--vio-rgb),0.06);
  border-color: rgba(var(--vio-rgb),0.2);
  color: var(--vio);
}
.qa-icon svg { width: 18px; height: 18px; }
.qa-info { flex: 1; min-width: 0; }
.qa-title { font-size: 13px; font-weight: 700; color: var(--txt); }
.qa-arrow { color: var(--line-2); transition: color 0.15s; flex-shrink: 0; }
.qa-arrow svg { width: 16px; height: 16px; }
.qa-item:hover .qa-arrow { color: var(--vio); }

/* ===== CARD ===== */
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
.card-title { font-size: 14.5px; font-weight: 750; color: var(--txt); }
.card-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: rgba(var(--vio-rgb),0.06);
  border: 1px solid rgba(var(--vio-rgb),0.18);
  border-radius: 999px;
  font-size: 12px; font-weight: 700; color: var(--vio);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.card-tag svg { width: 12px; height: 12px; }
.card-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--vio); font-weight: 700;
  text-decoration: none;
  padding: 5px 9px;
  border-radius: 7px;
  transition: background 0.15s;
  white-space: nowrap;
}
.card-link:hover { background: rgba(var(--vio-rgb),0.07); }
.card-link svg { width: 12px; height: 12px; }

.chart-wrap {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}
.chart-wrap :deep(svg),
.chart-wrap :deep(canvas) {
  max-width: 100%;
  display: block;
}

/* ===== STATUS ===== */
.status-list { display: flex; flex-direction: column; margin-bottom: 18px; }
.status-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  gap: 12px;
}
.status-row:last-child { border-bottom: none; }
.status-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.status-dot.paid { background: #10b981; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.status-dot.pending { background: #f59e0b; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.status-dot.expired { background: var(--line-2); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.status-label { font-size: 13px; font-weight: 600; color: var(--txt); }
.status-count { font-size: 13px; font-weight: 700; color: var(--txt); font-variant-numeric: tabular-nums; flex-shrink: 0; }

.settled-box {
  padding: 18px;
  background: var(--grad);
  border-radius: 10px;
  color: #fff;
  box-shadow: 0 4px 14px rgba(var(--vio-rgb),0.28);
}
.settled-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.78); margin-bottom: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
.settled-value { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; word-break: break-word; }

/* ===== SKELETON ===== */
.trx-skeleton { display: flex; flex-direction: column; gap: 4px; }
.skel-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}
.skel-row:last-child { border-bottom: none; }
.skel-icon {
  width: 40px; height: 40px; border-radius: 8px;
  background: var(--bg-soft);
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}
.skel-body { flex: 1; min-width: 0; }
.skel-right { text-align: right; flex-shrink: 0; }
.skel-line {
  height: 10px;
  background: var(--bg-soft);
  border-radius: 5px;
  animation: shimmer 1.5s infinite;
}
.skel-line-1 { width: 60%; margin-bottom: 6px; }
.skel-line-2 { width: 35%; height: 8px; }
.skel-line-3 { width: 70px; margin-left: auto; margin-bottom: 6px; }
.skel-line-4 { width: 50px; height: 8px; margin-left: auto; }
@keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* ===== EMPTY ===== */
.empty-trx { text-align: center; padding: 40px 20px; color: var(--dim); font-size: 13px; }
.empty-icon {
  width: 52px; height: 52px; border-radius: 8px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
}
.empty-icon svg { width: 22px; height: 22px; }
.btn-small {
  display: inline-block; margin-top: 16px;
  padding: 10px 20px;
  background: var(--grad); color: #fff;
  border-radius: 8px; font-size: 12.5px; font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-small:hover { transform: translateY(-1px); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

/* ===== TRANSACTION LIST ===== */
.trx-list { list-style: none; padding: 0; margin: 0; }
.trx-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}
.trx-item:last-child { border-bottom: none; }
.trx-icon {
  width: 40px; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  color: var(--dim);
}
.trx-icon svg { width: 16px; height: 16px; display: block; }
.trx-icon span { display: flex; align-items: center; justify-content: center; }
.trx-icon.paid { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.25); color: #059669; }
.trx-icon.pending { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.25); color: #d97706; }
.trx-icon.expired { background: var(--bg-soft); border-color: var(--line); color: var(--dim); }
.trx-info { flex: 1; min-width: 0; text-decoration: none; display: block; }
.trx-info:hover .trx-id { color: var(--vio); }
.trx-id {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 12px; color: var(--txt); font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  transition: color 0.15s;
}
.trx-time { font-size: 11.5px; color: var(--dim); margin-top: 4px; }
.trx-right { text-align: right; flex-shrink: 0; }
.trx-amt { font-size: 13px; font-weight: 750; color: var(--txt); margin-bottom: 4px; font-variant-numeric: tabular-nums; }
.badge {
  padding: 3px 10px; border-radius: 999px;
  font-size: 10px; font-weight: 700;
  border: 1px solid transparent;
  white-space: nowrap;
  display: inline-block;
}
.badge-paid { background: rgba(16,185,129,0.09); color: #059669; border-color: rgba(16,185,129,0.25); }
.badge-pending { background: rgba(245,158,11,0.09); color: #d97706; border-color: rgba(245,158,11,0.25); }
.badge-expired { background: var(--bg-soft); color: var(--dim); border-color: var(--line); }

.grid-2 { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 900px) { .grid-2 { grid-template-columns: 1fr 1fr; } }

/* ===== MOBILE TWEAKS ===== */
@media (max-width: 640px) {
  .dash { padding-bottom: 120px; }
  .dash-header { margin-bottom: 20px; }
  .welcome { font-size: 17px; }
  .welcome-sub { font-size: 12.5px; }
  .live-tag { font-size: 11px; padding: 6px 11px; }
  .card { padding: 16px; }
  .balance-card { padding: 16px; }
  .bc-value { font-size: 18px; }
  .settled-value { font-size: 16px; }
  .status-count { font-size: 13px; }
  .status-label { font-size: 13px; }
  .trx-amt { font-size: 12.5px; }
  .trx-id { font-size: 11.5px; }
}

@media (max-width: 400px) {
  .balance-grid { gap: 8px; }
  .quick-actions { gap: 8px; }
  .qa-item { padding: 14px; }
  .qa-icon { width: 40px; height: 40px; }
  .qa-title { font-size: 13px; }
}
</style>

<style>
/* Mobile: ikon status (centang/X) benar-benar di tengah baris, bukan nempel ke atas */
@media (max-width: 640px) {
  .trx-item {
    display: grid !important;
    grid-template-columns: 40px 1fr !important;
    grid-template-rows: auto auto !important;
    gap: 8px 12px !important;
    align-items: center !important;
    padding: 14px 0 !important;
  }
  .trx-icon {
    grid-row: 1 / 3 !important;
    grid-column: 1 !important;
    align-self: center !important;
    justify-self: start !important;
    margin-top: 0 !important;
  }
  .trx-info {
    grid-row: 1 !important;
    grid-column: 2 !important;
    min-width: 0 !important;
    overflow: hidden !important;
  }
  .trx-id {
    font-size: 11.5px !important;
    display: block !important;
    overflow: hidden !important;
    text-overflow: ellipsis;
    white-space: nowrap !important;
  }
  .trx-right {
    grid-row: 2 !important;
    grid-column: 2 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    text-align: left !important;
    gap: 8px !important;
    width: 100% !important;
  }
  .trx-amt {
    font-size: 13px !important;
    margin-bottom: 0 !important;
  }
  .badge {
    font-size: 9.5px !important;
    padding: 2px 8px !important;
  }
}

@media (max-width: 380px) {
  .trx-id { font-size: 11px !important; }
  .trx-amt { font-size: 12.5px !important; }
}
</style>