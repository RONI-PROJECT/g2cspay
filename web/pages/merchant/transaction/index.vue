<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>Riwayat Transaksi</h1>
        <p class="sub">Semua transaksi QRIS Anda</p>
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
      <div class="sm-card">
        <div class="sm-label">Total Transaksi</div>
        <div class="sm-value">{{ items.length }}</div>
      </div>
      <div class="sm-card">
        <div class="sm-label">Total Diterima</div>
        <div class="sm-value ok">{{ rupiah(totalNet) }}</div>
      </div>
      <div class="sm-card">
        <div class="sm-label">Total Fee</div>
        <div class="sm-value warn">-{{ rupiah(totalFee) }}</div>
      </div>
    </div>

    <!-- CONTROLS -->
    <div class="controls">
      <div class="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="q" placeholder="Cari trxId / referensi" />
        <button v-if="q" class="search-clear" @click="q = ''" title="Bersihkan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="tabs">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="tab"
          :class="{ active: filter === t.value }"
          @click="filter = t.value"
        >
          <span>{{ t.label }}</span>
          <span class="tab-count">{{ countByStatus(t.value) }}</span>
        </button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="state">
        <div class="spinner"></div>
        <p>Memuat</p>
      </div>

      <div v-else-if="filtered.length === 0" class="state empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <p class="empty-title">
          {{ items.length === 0 ? 'Belum ada transaksi' : 'Tidak ada yang cocok' }}
        </p>
        <p class="empty-sub">
          {{ items.length === 0 ? 'Mulai terima pembayaran QRIS pertama Anda' : 'Coba ubah filter atau kata kunci' }}
        </p>
        <NuxtLink v-if="items.length === 0" to="/merchant/qris" class="btn-empty">
          Buat QRIS Pertama
        </NuxtLink>
      </div>

      <div v-else>
        <!-- DESKTOP TABLE -->
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Trx ID</th>
                <th>Referensi</th>
                <th>Nominal</th>
                <th>Fee</th>
                <th>Net</th>
                <th>Metode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filtered" :key="t.trxId">
                <td class="id">
                  <NuxtLink :to="`/merchant/transaction/${t.trxId}`" class="id-link">
                    {{ t.trxId }}
                  </NuxtLink>
                </td>
                <td class="ref">{{ shortRef(t) }}</td>
                <td class="mono">{{ rupiah(t.amount) }}</td>
                <td class="mono warn">-{{ rupiah(t.fee || 0) }}</td>
                <td class="mono strong">{{ rupiah(t.net || (t.amount - (t.fee || 0))) }}</td>
                <td><span class="method-badge">QRIS</span></td>
                <td>
                  <span class="badge" :class="'badge-' + (t.status || '').toLowerCase()">
                    {{ statusLabel(t.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- MOBILE LIST -->
        <div class="mobile-list">
          <div v-for="t in filtered" :key="'m-' + t.trxId" class="mobile-item">
            <div class="mi-head">
              <NuxtLink :to="`/merchant/transaction/${t.trxId}`" class="mi-id-link">
                {{ t.trxId }}
              </NuxtLink>
              <span class="badge" :class="'badge-' + (t.status || '').toLowerCase()">
                {{ statusLabel(t.status) }}
              </span>
            </div>
            <div class="mi-body">
              <div class="mi-row">
                <span class="mi-label">Nominal</span>
                <span class="mi-val mono">{{ rupiah(t.amount) }}</span>
              </div>
              <div class="mi-row">
                <span class="mi-label">Fee</span>
                <span class="mi-val mono warn">-{{ rupiah(t.fee || 0) }}</span>
              </div>
              <div class="mi-row mi-net">
                <span class="mi-label">Net</span>
                <span class="mi-val mono strong">{{ rupiah(t.net || (t.amount - (t.fee || 0))) }}</span>
              </div>
              <div class="mi-row">
                <span class="mi-label">Metode</span>
                <span class="mi-val"><span class="method-badge">QRIS</span></span>
              </div>
            </div>
            <div class="mi-time">{{ formatDate(t.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const items = ref<any[]>([])
const loading = ref(true)
const q = ref('')
const filter = ref('')

const tabs = [
  { label: 'Semua', value: '' },
  { label: 'Berhasil', value: 'PAID' },
  { label: 'Menunggu', value: 'PENDING' },
  { label: 'Kadaluwarsa', value: 'EXPIRED' },
]

const totalNet = computed(() =>
  items.value.filter(t => t.status === 'PAID')
    .reduce((s, t) => s + Number(t.net ?? t.amount ?? 0), 0)
)
const totalFee = computed(() =>
  items.value.filter(t => t.status === 'PAID')
    .reduce((s, t) => s + Number(t.fee || 0), 0)
)

function countByStatus(status: string) {
  if (!status) return items.value.length
  return items.value.filter(t => t.status === status).length
}

const filtered = computed(() => {
  let out = items.value
  if (filter.value) out = out.filter(t => t.status === filter.value)
  if (q.value.trim()) {
    const s = q.value.trim().toLowerCase()
    out = out.filter(t => {
      const ref = (t?.metadata?.merchant_reference || '').toLowerCase()
      const id = (t.trxId || '').toLowerCase()
      return id.includes(s) || ref.includes(s)
    })
  }
  return out
})

async function load() {
  loading.value = true
  try {
    const r: any = await $fetch('/api/user/payment/list', { credentials: 'include' })
    items.value = r.data || []
  } finally {
    loading.value = false
  }
}

function rupiah(n: number) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID') }
function shortRef(t: any) {
  const ref = t?.metadata?.merchant_reference
  if (!ref) return '-'
  return String(ref).length > 16 ? String(ref).slice(0, 16) : ref
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
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px; gap: 12px;
}
h1 { font-size: 19px; font-weight: 750; color: var(--txt); letter-spacing: -0.03em; }
.sub { font-size: 13px; color: var(--dim); margin-top: 5px; }

.btn-refresh {
  width: 38px; height: 38px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-refresh:hover:not(:disabled) { border-color: var(--vio-2); color: var(--vio); }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-refresh svg { width: 15px; height: 15px; }
.btn-refresh svg.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== SUMMARY ===== */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
@media (max-width: 640px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .summary-grid > :nth-child(3) { grid-column: 1 / -1; }
}

.sm-card {
  padding: 14px 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.sm-card:hover { border-color: var(--line-2); }
.sm-label {
  font-size: 10.5px; font-weight: 700;
  color: var(--dim);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.sm-value {
  font-size: 19px; font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--txt);
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}
.sm-value.ok { color: #059669; }
.sm-value.warn { color: #d97706; }

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
  min-width: 200px;
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
.tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
.tabs::-webkit-scrollbar { display: none; }
.tabs { scrollbar-width: none; }

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  -webkit-tap-highlight-color: transparent;
}
.tab:hover { border-color: var(--line-2); color: var(--txt); }
.tab.active {
  background: var(--grad, var(--vio));
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(var(--vio-rgb),0.30);
}
.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--bg-soft, var(--soft));
  font-size: 10.5px;
  font-weight: 700;
  color: var(--dim);
  font-variant-numeric: tabular-nums;
}
.tab.active .tab-count {
  background: rgba(255,255,255,0.22);
  color: #ffffff;
}

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 20px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.state { text-align: center; padding: 60px 20px; color: var(--dim); font-size: 13px; }
.state.empty { padding: 60px 20px; }
.spinner {
  width: 28px; height: 28px;
  border: 3px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 14px;
}
.empty-icon {
  width: 60px; height: 60px; border-radius: 8px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}
.empty-icon svg { width: 24px; height: 24px; }
.empty-title {
  font-size: 15px; font-weight: 750;
  color: var(--txt);
  margin-bottom: 6px;
}
.empty-sub {
  font-size: 12.5px; color: var(--dim);
  margin-bottom: 18px;
  line-height: 1.5;
}
.btn-empty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-empty:hover { transform: translateY(-1px); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

/* ===== TABLE DESKTOP ===== */
.tbl-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 720px; }
.tbl th {
  text-align: left; padding: 14px 10px;
  border-bottom: 1px solid var(--line);
  color: var(--dim);
  font-size: 10.5px; font-weight: 700;
  white-space: nowrap;
}
.tbl td {
  padding: 15px 10px;
  border-bottom: 1px solid var(--line);
  color: var(--txt);
  font-variant-numeric: tabular-nums;
  vertical-align: middle;
}
.tbl tbody tr { transition: background 0.15s; }
.tbl tbody tr:hover { background: var(--bg-soft, var(--soft)); }
.tbl tbody tr:last-child td { border-bottom: none; }

.id { max-width: 180px; }
.id-link {
  color: var(--vio);
  text-decoration: none;
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: color 0.15s;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.id-link:hover { color: var(--vio-ink); text-decoration: underline; }

.ref {
  font-size: 11.5px;
  color: var(--dim);
  font-family: ui-monospace, monospace;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mono {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-weight: 700;
  color: var(--txt);
  font-size: 13px;
  white-space: nowrap;
}
.mono.warn { color: #d97706; font-weight: 650; }
.mono.strong { color: var(--vio-ink); font-weight: 700; font-size: 13px; }

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

/* BADGE */
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 999px;
  font-size: 10px; font-weight: 700;
  border: 1px solid; white-space: nowrap;
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

/* ===== MOBILE LIST ===== */
.mobile-list { display: none; }
@media (max-width: 640px) {
  .page { padding-bottom: 40px; }
  .card { padding: 6px 14px; border-radius: 8px; }
  .tbl { display: none; }
  .tbl-wrap { overflow: visible; }
  .mobile-list { display: flex; flex-direction: column; gap: 8px; padding: 10px 0; }

  .mobile-item {
    padding: 14px;
    background: var(--bg-soft, var(--soft));
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  .mi-head {
    display: flex; justify-content: space-between; align-items: center;
    gap: 10px; padding-bottom: 10px; margin-bottom: 10px;
    border-bottom: 1px solid var(--line);
  }
  .mi-id-link {
    color: var(--vio);
    text-decoration: none;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0.02em;
    flex: 1;
    min-width: 0;
  }
  .mi-id-link:hover { color: var(--vio-ink); text-decoration: underline; }
  .mi-body { display: flex; flex-direction: column; }
  .mi-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 0; font-size: 12.5px; gap: 10px;
  }
  .mi-label { color: var(--dim); font-size: 11.5px; flex-shrink: 0; }
  .mi-val { color: var(--txt); font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
  .mi-val.mono { font-family: ui-monospace, monospace; font-size: 12.5px; }
  .mi-val.warn { color: #d97706; }
  .mi-net { border-top: 1px solid var(--line); margin-top: 6px; padding-top: 10px; }
  .mi-time {
    font-size: 11px; color: var(--dim);
    margin-top: 10px; padding-top: 10px;
    border-top: 1px solid var(--line);
  }
}

@media (max-width: 400px) {
  h1 { font-size: 17px; }
  .summary-grid { gap: 8px; }
  .sm-card { padding: 12px; }
  .sm-value { font-size: 17px; }
  .tab { padding: 8px 11px; font-size: 12px; }
  .tab-count { min-width: 18px; height: 16px; font-size: 10px; }
}
</style>