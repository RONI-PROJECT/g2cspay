<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>Semua Transaksi</h1>
        <p class="sub">{{ list.length }} dari {{ allData.length }} transaksi</p>
      </div>
      <button class="btn-refresh" @click="load" :disabled="loading" title="Refresh">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: loading }">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      </button>
    </div>

    <!-- SUMMARY -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="sm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="sm-body">
          <div class="sm-label">Total</div>
          <div class="sm-value">{{ stats.total }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="sm-icon sm-icon--ok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="sm-body">
          <div class="sm-label">Sukses</div>
          <div class="sm-value">{{ stats.paid }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="sm-icon sm-icon--warn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="sm-body">
          <div class="sm-label">Pending</div>
          <div class="sm-value">{{ stats.pending }}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="sm-icon sm-icon--off">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <div class="sm-body">
          <div class="sm-label">Expired</div>
          <div class="sm-value">{{ stats.expired }}</div>
        </div>
      </div>
    </div>

    <!-- CONTROLS -->
    <div class="controls">
      <div class="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="q" placeholder="Cari trxId / email" />
        <button v-if="q" class="search-clear" @click="q = ''" title="Bersihkan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="tabs-wrap">
        <div class="tabs">
          <button
            v-for="t in tabs"
            :key="t.value"
            class="tab"
            :class="{ active: filter === t.value }"
            @click="filter = t.value"
          >
            <span>{{ t.label }}</span>
            <span v-if="countByStatus(t.value)" class="tab-count">{{ countByStatus(t.value) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- SKELETON -->
    <div v-if="loading" class="list">
      <div v-for="i in 5" :key="i" class="row skeleton">
        <div class="skel-dot"></div>
        <div class="col-main">
          <div class="skel-line" style="width: 40%;"></div>
          <div class="skel-line" style="width: 60%; height: 8px;"></div>
        </div>
        <div class="col-amt">
          <div class="skel-line" style="width: 80px; margin-left: auto;"></div>
          <div class="skel-line" style="width: 60px; height: 8px; margin-left: auto; margin-top: 6px;"></div>
        </div>
      </div>
    </div>

    <!-- EMPTY -->
    <div v-else-if="list.length === 0" class="state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <p class="empty-title">{{ q || filter ? 'Tidak ada hasil' : 'Belum ada transaksi' }}</p>
      <p class="empty-sub">{{ q || filter ? 'Coba ubah filter atau kata kunci' : 'Transaksi akan muncul di sini' }}</p>
    </div>

    <!-- LIST -->
    <div v-else class="list">
      <div v-for="t in list" :key="t.trxId" class="row">
        <div class="status-dot" :class="'dot-' + (t.status || '').toLowerCase()"></div>

        <div class="col-main">
          <div class="trx-id">{{ t.trxId }}</div>
          <div class="trx-meta">
            <span class="user">{{ t.email || 'Tanpa user' }}</span>
            <span class="sep">·</span>
            <span class="time">{{ formatDate(t.createdAt) }}</span>
          </div>
        </div>

        <div class="col-amt">
          <div class="amt-main">{{ rupiah(t.amount) }}</div>
          <div class="amt-sub">
            <span class="amt-label">Bayar</span>
            <span class="amt-val">{{ rupiah(t.payAmount) }}</span>
          </div>
        </div>

        <span class="badge" :class="'badge-' + (t.status || '').toLowerCase()">
          <span class="badge-dot"></span>
          {{ statusLabel(t.status) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'panel' })

const list = ref<any[]>([])
const allData = ref<any[]>([])
const loading = ref(true)
const filter = ref('')
const q = ref('')

const stats = computed(() => {
  const all = allData.value
  return {
    total: all.length,
    paid: all.filter(t => t.status === 'PAID').length,
    pending: all.filter(t => t.status === 'PENDING').length,
    expired: all.filter(t => t.status === 'EXPIRED').length,
  }
})

const tabs = [
  { label: 'Semua', value: '' },
  { label: 'Sukses', value: 'PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Expired', value: 'EXPIRED' },
]

function countByStatus(status: string) {
  if (!status) return allData.value.length
  return allData.value.filter(t => t.status === status).length
}

watch([filter, q], () => applyFilters())

function applyFilters() {
  let out = allData.value
  if (filter.value) out = out.filter(t => t.status === filter.value)
  if (q.value.trim()) {
    const s = q.value.trim().toLowerCase()
    out = out.filter(t =>
      (t.trxId || '').toLowerCase().includes(s) ||
      (t.email || '').toLowerCase().includes(s)
    )
  }
  list.value = out
}

async function load() {
  loading.value = true
  try {
    const all: any = await $fetch('/api/admin-panel/transactions', { credentials: 'include' })
    allData.value = all.data || []
    applyFilters()
  } catch (e) {
    console.error('load transactions error:', e)
    allData.value = []
    list.value = []
  } finally {
    loading.value = false
  }
}

function rupiah(n: number) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID') }
function formatDate(s: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' })
}
function statusLabel(s: string) {
  if (s === 'PAID') return 'Sukses'
  if (s === 'PENDING') return 'Pending'
  if (s === 'EXPIRED') return 'Expired'
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
  padding-bottom: 140px;
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.head {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px; gap: 12px;
}
h1 { font-size: 13px; font-weight: 700; color: var(--txt); letter-spacing: -0.02em; }
.sub { font-size: 13px; color: var(--dim); margin-top: 5px; }

.btn-refresh {
  width: 38px; height: 38px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-refresh:hover:not(:disabled) {
  border-color: var(--vio-2);
  color: var(--vio);
}
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-refresh svg { width: 15px; height: 15px; }
.btn-refresh svg.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== SUMMARY ===== */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
@media (max-width: 768px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.2s;
  min-width: 0;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.summary-card:hover { border-color: var(--line-2); }

.sm-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sm-icon--ok {
  background: rgba(16,185,129,0.08);
  border-color: rgba(16,185,129,0.22);
  color: #059669;
}
.sm-icon--warn {
  background: rgba(245,158,11,0.09);
  border-color: rgba(245,158,11,0.25);
  color: #d97706;
}
.sm-icon--off {
  background: var(--bg-soft, var(--soft));
  border-color: var(--line);
  color: var(--dim);
}
.sm-icon svg { width: 15px; height: 15px; }
.sm-body { min-width: 0; flex: 1; }
.sm-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  margin-bottom: 4px;
}
.sm-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* ===== CONTROLS ===== */
.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: stretch;
}
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
}
.search-wrap > svg {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  width: 16px; height: 16px; color: var(--dim); pointer-events: none;
}
.search-wrap input {
  width: 100%;
  padding: 10px 38px 10px 38px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  color: var(--txt);
  font-family: inherit;
  outline: none;
  transition: all 0.18s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.search-wrap input::placeholder { color: var(--dim); opacity: 0.55; }
.search-wrap input:focus {
  border-color: var(--vio);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px; height: 24px;
  border-radius: 6px;
  background: var(--bg-soft, var(--soft));
  border: none;
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.search-clear:hover { background: rgba(var(--vio-rgb),0.08); color: var(--vio); }
.search-clear svg { width: 12px; height: 12px; }

/* TABS */
.tabs-wrap {
  max-width: 100%;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tab {
  padding: 10px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--dim);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  -webkit-tap-highlight-color: transparent;
}
.tab:hover { border-color: var(--line-2); color: var(--txt); }
.tab.active {
  background: var(--grad, var(--vio));
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.tab-count {
  padding: 1px 7px;
  background: var(--bg-soft, var(--soft));
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
}
.tab.active .tab-count {
  background: rgba(255,255,255,0.22);
  color: #ffffff;
}

/* ===== STATE ===== */
.state {
  text-align: center;
  padding: 60px 20px;
  color: var(--dim);
  font-size: 13px;
}
.spinner {
  width: 28px; height: 28px;
  border: 3px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 14px;
}
.empty-icon {
  width: 60px; height: 60px;
  border-radius: 8px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  color: var(--vio);
}
.empty-icon svg { width: 26px; height: 26px; }
.empty-title {
  font-size: 13px;
  font-weight: 750;
  color: var(--txt);
  margin-bottom: 6px;
}
.empty-sub {
  font-size: 12.5px;
  color: var(--dim);
  line-height: 1.5;
}

/* ===== LIST ===== */
.list { display: flex; flex-direction: column; gap: 6px; }

.row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.row:hover {
  border-color: rgba(var(--vio-rgb),0.25);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

/* SKELETON */
.row.skeleton { pointer-events: none; }
.skel-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--bg-soft, var(--soft));
  flex-shrink: 0;
  animation: shimmer 1.5s infinite;
}
.skel-line {
  height: 10px;
  background: var(--bg-soft, var(--soft));
  border-radius: 5px;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* STATUS DOT */
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--line-2);
}
.dot-paid {
  background: #10b981;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.dot-pending {
  background: #f59e0b;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  animation: pulse 2s infinite;
}
.dot-expired {
  background: var(--line-2);
  opacity: 0.7;
}
@keyframes pulse {
  0%,100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* MAIN COL */
.col-main { flex: 1; min-width: 0; }
.trx-id {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--txt);
  letter-spacing: 0.02em;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.trx-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--dim);
  overflow: hidden;
}
.user {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}
.sep { opacity: 0.4; flex-shrink: 0; }
.time { flex-shrink: 0; }

/* AMOUNT */
.col-amt {
  text-align: right;
  flex-shrink: 0;
  min-width: 120px;
}
.amt-main {
  font-size: 13px;
  font-weight: 750;
  color: var(--txt);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.amt-sub {
  font-size: 11px;
  color: var(--dim);
  margin-top: 3px;
  font-variant-numeric: tabular-nums;
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
.amt-label { color: var(--dim); opacity: 0.7; }
.amt-val { color: var(--dim); font-weight: 650; }

/* BADGE */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid transparent;
  flex-shrink: 0;
  white-space: nowrap;
}
.badge-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.badge-paid {
  background: rgba(16,185,129,0.09);
  border-color: rgba(16,185,129,0.25);
  color: #059669;
}
.badge-pending {
  background: rgba(245,158,11,0.09);
  border-color: rgba(245,158,11,0.25);
  color: #d97706;
}
.badge-expired {
  background: var(--bg-soft, var(--soft));
  border-color: var(--line);
  color: var(--dim);
}

/* ===== MOBILE ===== */
@media (max-width: 640px) {
  .page { padding-bottom: 100px; }
  h1 { font-size: 13px; }

  .controls { flex-direction: column; }
  .search-wrap { min-width: 0; width: 100%; }

  .row {
    flex-wrap: wrap;
    padding: 12px 14px;
    gap: 10px;
  }
  .status-dot {
    order: 0;
  }
  .col-main {
    order: 1;
    flex: 1 1 60%;
  }
  .badge {
    order: 2;
    margin-left: auto;
  }
  .col-amt {
    order: 3;
    text-align: left;
    min-width: 0;
    flex-basis: 100%;
    padding-left: 22px;
    margin-top: -4px;
  }
  .amt-sub { justify-content: flex-start; }
  .user { max-width: 140px; }
}

@media (prefers-reduced-motion: reduce) {
  .btn-refresh svg.spinning,
  .dot-pending,
  .skel-dot,
  .skel-line {
    animation: none !important;
  }
}
</style>