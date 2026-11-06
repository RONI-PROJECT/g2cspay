<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>Kelola Tarik Dana</h1>
        <p class="sub">{{ list.length }} permintaan</p>
      </div>
      <button class="btn-refresh" @click="load" :disabled="refreshing" title="Refresh">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: refreshing }">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      </button>
    </div>

    <!-- SUMMARY -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="sm-icon sm-icon--warn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="sm-body">
          <div class="sm-label">Pending</div>
          <div class="sm-value">{{ rupiah(summary.pendingAmount) }}</div>
          <div class="sm-sub">{{ summary.pendingCount }} permintaan</div>
        </div>
      </div>

      <div class="summary-card">
        <div class="sm-icon sm-icon--ok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="sm-body">
          <div class="sm-label">Berhasil</div>
          <div class="sm-value">{{ rupiah(summary.doneAmount) }}</div>
          <div class="sm-sub">{{ summary.doneCount }} selesai</div>
        </div>
      </div>

      <div class="summary-card">
        <div class="sm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="sm-body">
          <div class="sm-label">Total Fee</div>
          <div class="sm-value">{{ rupiah(summary.totalFee) }}</div>
          <div class="sm-sub">Dari {{ summary.feeCount }} transaksi</div>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs-wrap">
      <div class="tabs">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="tab"
          :class="{ active: filter === t.value }"
          @click="filter = t.value; load()"
        >
          <span>{{ t.label }}</span>
          <span v-if="counts[t.value]" class="tab-count">{{ counts[t.value] }}</span>
        </button>
      </div>
    </div>

    <!-- LOADING SKELETON -->
    <div v-if="loading" class="list">
      <div v-for="i in 3" :key="i" class="card skeleton">
        <div class="skel-head">
          <div class="skel-line" style="width: 40%; height: 12px;"></div>
          <div class="skel-line" style="width: 15%; height: 20px; border-radius: 999px;"></div>
        </div>
        <div class="skel-body">
          <div class="skel-line" style="width: 60%;"></div>
          <div class="skel-line" style="width: 80%; height: 8px;"></div>
          <div class="skel-block"></div>
        </div>
      </div>
    </div>

    <!-- EMPTY -->
    <div v-else-if="list.length === 0" class="state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="empty-title">Tidak ada data</p>
      <p class="empty-sub">{{ filter ? 'Coba pilih tab lain' : 'Belum ada permintaan penarikan' }}</p>
    </div>

    <!-- LIST -->
    <div v-else class="list">
      <div v-for="w in list" :key="w.id" class="card" :class="'card-' + w.status.toLowerCase()">
        <div class="card-head">
          <div class="card-head-left">
            <div class="wdr-id">{{ w.wdrId }}</div>
            <div class="wdr-time">{{ formatDate(w.createdAt) }}</div>
          </div>
          <span class="badge" :class="'badge-' + w.status.toLowerCase()">{{ statusLabel(w.status) }}</span>
        </div>

        <div class="card-body">
          <!-- USER -->
          <div class="user-row">
            <div class="user-avatar">{{ (w.name || w.email || 'U').charAt(0).toUpperCase() }}</div>
            <div class="user-info">
              <div class="user-name">{{ w.name || 'User' }}</div>
              <div class="user-email">{{ w.email }}</div>
            </div>
          </div>

          <!-- AMOUNT -->
          <div class="amount-breakdown">
            <div class="ab-row">
              <div class="ab-left">
                <span class="ab-dot nominal"></span>
                <span class="ab-label">Nominal Diminta</span>
              </div>
              <span class="ab-value">{{ rupiah(w.amount) }}</span>
            </div>
            <div class="ab-row">
              <div class="ab-left">
                <span class="ab-dot fee"></span>
                <span class="ab-label">Fee Admin</span>
              </div>
              <span class="ab-value fee">-{{ rupiah(w.fee) }}</span>
            </div>
            <div class="ab-divider"></div>
            <div class="ab-row total">
              <div class="ab-left">
                <span class="ab-dot received"></span>
                <span class="ab-label">Dana Diterima User</span>
              </div>
              <span class="ab-value received">{{ rupiah(w.received) }}</span>
            </div>
          </div>

          <!-- BANK -->
          <div class="bank-box">
            <div class="bank-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>
              </svg>
            </div>
            <div class="bank-info">
              <div class="bank-label">Rekening Tujuan</div>
              <div class="bank-value">
                <strong>{{ w.bank }}</strong>
                <span>{{ w.account }}</span>
              </div>
            </div>
          </div>

          <div v-if="w.note" class="note-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{{ w.note }}</span>
          </div>
        </div>

        <div v-if="w.status === 'PENDING'" class="card-foot">
          <button class="btn-action btn-approve" @click="openConfirm(w, 'approve')" :disabled="acting === w.id">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Approve</span>
          </button>
          <button class="btn-action btn-reject" @click="openReject(w)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Tolak</span>
          </button>
        </div>

        <div v-else-if="w.status === 'APPROVED'" class="card-foot">
          <div class="foot-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Transfer <strong>{{ rupiah(w.received) }}</strong> ke {{ w.bank }} {{ w.account }}, lalu klik selesai</span>
          </div>
          <button class="btn-action btn-done" @click="openConfirm(w, 'done')" :disabled="acting === w.id">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Tandai Selesai</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL REJECT -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="rejectTarget" class="modal-overlay" @click.self="rejectTarget = null">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-icon icon-bad">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <div>
                <h2>Tolak Penarikan</h2>
                <p class="modal-sub">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <div class="modal-body">
              <div class="modal-info-box">
                <div class="mib-id">{{ rejectTarget.wdrId }}</div>
                <div class="mib-amount">{{ rupiah(rejectTarget.amount) }}</div>
              </div>
              <div class="form-group">
                <label>Alasan (opsional)</label>
                <input v-model="rejectReason" placeholder="Rekening salah, dll" />
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-cancel" @click="rejectTarget = null" :disabled="acting">Batal</button>
              <button class="btn-danger" @click="confirmReject" :disabled="acting">
                {{ acting ? 'Memproses' : 'Tolak' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL APPROVE / DONE -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmTarget" class="modal-overlay" @click.self="confirmTarget = null">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-icon icon-ok">
                <svg v-if="confirmAction === 'approve'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div>
                <h2>{{ confirmAction === 'approve' ? 'Approve Penarikan' : 'Tandai Selesai' }}</h2>
                <p class="modal-sub">
                  {{ confirmAction === 'approve'
                    ? 'Dana akan ditandai siap ditransfer'
                    : 'Pastikan sudah transfer sebelum tandai selesai' }}
                </p>
              </div>
            </div>
            <div class="modal-body">
              <div class="modal-info-box info-box--grad">
                <div class="mib-id">{{ confirmTarget.wdrId }}</div>
                <div class="mib-amount">{{ rupiah(confirmTarget.received || confirmTarget.amount) }}</div>
              </div>

              <div v-if="confirmAction === 'approve'" class="detail-list">
                <div class="dl-row"><span>Nominal diminta</span><strong>{{ rupiah(confirmTarget.amount) }}</strong></div>
                <div class="dl-row"><span>Fee admin</span><strong class="muted">-{{ rupiah(confirmTarget.fee) }}</strong></div>
                <div class="dl-row total"><span>Diterima user</span><strong>{{ rupiah(confirmTarget.received) }}</strong></div>
              </div>

              <div v-else class="detail-list">
                <div class="dl-row"><span>Rekening</span><strong>{{ confirmTarget.bank }} {{ confirmTarget.account }}</strong></div>
                <div class="dl-row total"><span>Transfer</span><strong>{{ rupiah(confirmTarget.received) }}</strong></div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-cancel" @click="confirmTarget = null" :disabled="acting">Batal</button>
              <button class="btn-confirm" @click="doConfirm" :disabled="acting">
                {{ acting ? 'Memproses' : (confirmAction === 'approve' ? 'Approve' : 'Tandai Selesai') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast" class="toast">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>{{ toast }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'panel' })

const list = ref<any[]>([])
const allData = ref<any[]>([])
const loading = ref(true)
const refreshing = ref(false)
const acting = ref<number | null>(null)
const filter = ref('PENDING')
const counts = ref<any>({ PENDING: 0, APPROVED: 0, DONE: 0, REJECTED: 0 })
const rejectTarget = ref<any>(null)
const rejectReason = ref('')
const confirmTarget = ref<any>(null)
const confirmAction = ref<'approve' | 'done'>('approve')
const toast = ref('')

const tabs = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Diproses', value: 'APPROVED' },
  { label: 'Berhasil', value: 'DONE' },
  { label: 'Ditolak', value: 'REJECTED' },
  { label: 'Semua', value: '' },
]

const summary = computed(() => {
  const all = allData.value
  const pending = all.filter(w => w.status === 'PENDING')
  const done = all.filter(w => w.status === 'DONE')
  const feeItems = all.filter(w => ['PENDING', 'APPROVED', 'DONE'].includes(w.status))

  return {
    pendingAmount: pending.reduce((s, w) => s + Number(w.amount || 0), 0),
    pendingCount: pending.length,
    doneAmount: done.reduce((s, w) => s + Number(w.received || 0), 0),
    doneCount: done.length,
    totalFee: feeItems.reduce((s, w) => s + Number(w.fee || 0), 0),
    feeCount: feeItems.length,
  }
})

function flashToast(msg: string) {
  toast.value = msg
  setTimeout(() => toast.value = '', 2500)
}

async function load() {
  refreshing.value = true
  try {
    const r: any = await $fetch('/api/admin-panel/withdrawals', { credentials: 'include' })
    allData.value = r.data || []

    list.value = filter.value
      ? allData.value.filter(w => w.status === filter.value)
      : allData.value

    counts.value = {
      PENDING: allData.value.filter(w => w.status === 'PENDING').length,
      APPROVED: allData.value.filter(w => w.status === 'APPROVED').length,
      DONE: allData.value.filter(w => w.status === 'DONE').length,
      REJECTED: allData.value.filter(w => w.status === 'REJECTED').length,
    }
  } catch (e) {
    console.error('load withdrawals error:', e)
    allData.value = []
    list.value = []
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function openConfirm(w: any, action: 'approve' | 'done') {
  confirmTarget.value = w
  confirmAction.value = action
}

async function doConfirm() {
  if (!confirmTarget.value) return
  const w = confirmTarget.value
  acting.value = w.id
  try {
    const endpoint = confirmAction.value === 'approve' ? 'approve' : 'done'
    await $fetch(`/api/admin-panel/withdrawals/${w.id}/${endpoint}`, {
      method: 'POST',
      credentials: 'include',
    })
    flashToast(confirmAction.value === 'approve' ? `${w.wdrId} di-approve` : `${w.wdrId} selesai`)
    confirmTarget.value = null
    await load()
  } catch (e: any) {
    alert('Gagal: ' + (e?.data?.error || e.message))
  } finally {
    acting.value = null
  }
}

function openReject(w: any) {
  rejectTarget.value = w
  rejectReason.value = ''
}

async function confirmReject() {
  if (!rejectTarget.value) return
  acting.value = rejectTarget.value.id
  try {
    await $fetch(`/api/admin-panel/withdrawals/${rejectTarget.value.id}/reject`, {
      method: 'POST',
      body: { reason: rejectReason.value },
      credentials: 'include',
    })
    flashToast(`${rejectTarget.value.wdrId} ditolak`)
    rejectTarget.value = null
    await load()
  } catch (e: any) {
    alert('Gagal: ' + (e?.data?.error || e.message))
  } finally {
    acting.value = null
  }
}

function rupiah(n: number) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID') }
function formatDate(s: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' })
}
function statusLabel(s: string) {
  if (s === 'PENDING') return 'Menunggu'
  if (s === 'APPROVED') return 'Diproses'
  if (s === 'DONE') return 'Berhasil'
  if (s === 'REJECTED') return 'Ditolak'
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
  margin-bottom: 22px; gap: 12px;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
@media (max-width: 768px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .summary-grid { grid-template-columns: 1fr; } }

.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.2s;
  min-width: 0;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.summary-card:hover { border-color: var(--line-2); }
.sm-icon {
  width: 40px; height: 40px;
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
.sm-icon svg { width: 16px; height: 16px; }
.sm-body { min-width: 0; flex: 1; }
.sm-label {
  font-size: 10px; font-weight: 700;
  color: var(--dim);
  margin-bottom: 6px;
}
.sm-value {
  font-size: 13px; font-weight: 700;
  color: var(--txt);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}
.sm-sub { font-size: 11px; color: var(--dim); margin-top: 3px; }

/* ===== TABS - wrap, nggak scroll ===== */
.tabs-wrap {
  margin-bottom: 16px;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tab {
  padding: 8px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 12.5px; font-weight: 650;
  color: var(--dim);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.15s;
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

/* ===== SKELETON ===== */
.card.skeleton { pointer-events: none; }
.skel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--line);
}
.skel-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skel-line {
  height: 10px;
  background: var(--bg-soft, var(--soft));
  border-radius: 5px;
  animation: shimmer 1.5s infinite;
}
.skel-block {
  height: 60px;
  background: var(--bg-soft, var(--soft));
  border-radius: 8px;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ===== LIST ===== */
.list { display: flex; flex-direction: column; gap: 12px; }

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.card-pending {
  border-color: rgba(245,158,11,0.35);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.card-approved {
  border-color: rgba(var(--vio-rgb),0.3);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--line);
  gap: 12px;
}
.card-head-left { min-width: 0; }
.wdr-id {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wdr-time { font-size: 11.5px; color: var(--dim); margin-top: 4px; }

.badge {
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 10px; font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge-pending {
  background: rgba(245,158,11,0.09);
  border: 1px solid rgba(245,158,11,0.25);
  color: #d97706;
}
.badge-approved {
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.2);
  color: var(--vio);
}
.badge-done {
  background: rgba(16,185,129,0.09);
  border: 1px solid rgba(16,185,129,0.25);
  color: #059669;
}
.badge-rejected {
  background: rgba(225,29,72,0.06);
  border: 1px solid rgba(225,29,72,0.18);
  color: var(--bad, #e11d48);
}

.card-body { padding: 18px; }

/* USER */
.user-row {
  display: flex; gap: 12px; align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.user-avatar {
  width: 40px; height: 40px;
  border-radius: 8px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.user-info { min-width: 0; }
.user-name {
  font-size: 13px; font-weight: 750; color: var(--txt);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.user-email {
  font-size: 11.5px; color: var(--dim); margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* AMOUNT */
.amount-breakdown {
  padding: 14px 16px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-bottom: 12px;
}
.ab-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  gap: 12px;
}
.ab-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.ab-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--line-2);
}
.ab-dot.nominal { background: var(--vio); }
.ab-dot.fee { background: #d97706; }
.ab-dot.received { background: #10b981; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.ab-label { font-size: 12.5px; color: var(--dim); }
.ab-value {
  font-size: 13px; font-weight: 750;
  color: var(--txt);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.ab-value.fee { color: #d97706; }
.ab-value.received { color: #059669; font-size: 13px; }
.ab-divider {
  height: 1px;
  background: var(--line);
  margin: 6px 0;
}
.ab-row.total { padding-top: 8px; }
.ab-row.total .ab-label {
  font-weight: 700;
  color: var(--txt);
  font-size: 13px;
}

/* BANK */
.bank-box {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-bottom: 10px;
}
.bank-icon {
  width: 34px; height: 34px;
  border-radius: 8px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.bank-icon svg { width: 16px; height: 16px; }
.bank-info { flex: 1; min-width: 0; }
.bank-label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--dim);
  margin-bottom: 4px;
}
.bank-value {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 13px;
  color: var(--txt);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: baseline;
  word-break: break-all;
}
.bank-value strong { font-weight: 700; }
.bank-value span { color: var(--dim); }

/* NOTE */
.note-box {
  display: flex;
  gap: 10px;
  padding: 11px 13px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--dim);
  line-height: 1.5;
}
.note-box svg {
  width: 14px; height: 14px;
  color: var(--vio);
  flex-shrink: 0;
  margin-top: 2px;
}

/* FOOTER */
.card-foot {
  display: flex; gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid var(--line);
  background: var(--bg-soft, var(--soft));
  flex-wrap: wrap;
}

.foot-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(var(--vio-rgb),0.05);
  border: 1px solid rgba(var(--vio-rgb),0.18);
  border-radius: 8px;
  font-size: 12px;
  color: var(--dim);
  line-height: 1.5;
  flex: 1;
  min-width: 0;
}
.foot-note svg { width: 14px; height: 14px; color: var(--vio); flex-shrink: 0; }
.foot-note strong { color: var(--vio-deep); font-weight: 750; }
.foot-note span { min-width: 0; }

.btn-action {
  flex: 1;
  min-width: 120px;
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  border: 1px solid transparent;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.btn-action svg { width: 15px; height: 15px; flex-shrink: 0; }
.btn-action:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-approve {
  background: var(--grad, var(--vio));
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-approve:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-reject {
  background: var(--card);
  border-color: rgba(225,29,72,0.3);
  color: var(--bad, #e11d48);
}
.btn-reject:hover:not(:disabled) {
  background: rgba(225,29,72,0.05);
}
.btn-done {
  background: var(--grad, var(--vio));
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-done:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42, 0.45);
  
  display: flex; align-items: center; justify-content: center;
  z-index: 900;
  padding: 20px;
}
.modal {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  width: 100%; max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  color: var(--txt);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.modal-head {
  display: flex;
  gap: 14px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--line);
  align-items: flex-start;
}
.modal-icon {
  width: 44px; height: 44px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.modal-icon.icon-bad {
  background: rgba(225,29,72,0.07);
  border: 1px solid rgba(225,29,72,0.2);
  color: var(--bad, #e11d48);
}
.modal-icon.icon-ok {
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.22);
  color: #059669;
}
.modal-icon svg { width: 22px; height: 22px; }
.modal-head h2 { font-size: 13px; font-weight: 700; color: var(--txt); margin-bottom: 4px; letter-spacing: -0.02em; }
.modal-sub {
  font-size: 12px;
  color: var(--dim);
  font-weight: 600;
  line-height: 1.4;
}

.modal-body { padding: 20px 24px; }

.modal-info-box {
  padding: 16px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
}
.info-box--grad {
  background: var(--grad, var(--vio));
  border: none;
}
.info-box--grad .mib-id { color: rgba(255,255,255,0.75); }
.info-box--grad .mib-amount { color: #ffffff; }
.mib-id {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--dim);
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}
.mib-amount {
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

.detail-list {
  display: flex;
  flex-direction: column;
}
.dl-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  color: var(--dim);
  gap: 12px;
}
.dl-row strong {
  color: var(--txt);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  text-align: right;
  word-break: break-word;
}
.dl-row strong.muted { color: #d97706; font-weight: 650; }
.dl-row.total {
  border-top: 1px solid var(--line);
  margin-top: 6px;
  padding-top: 10px;
  color: var(--txt);
  font-weight: 700;
}
.dl-row.total strong { font-size: 13px; color: var(--vio-deep); }

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 12px; font-weight: 700; color: var(--txt); }
.form-group input {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid var(--line-2);
  border-radius: 8px;
  font-size: 13px;
  background: var(--card);
  color: var(--txt);
  font-family: inherit;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
}
.form-group input::placeholder { color: var(--dim); opacity: 0.55; }
.form-group input:focus {
  border-color: var(--vio);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.modal-foot {
  padding: 16px 24px;
  border-top: 1px solid var(--line);
  display: flex; justify-content: flex-end; gap: 8px;
}
.btn-cancel {
  padding: 11px 18px;
  background: var(--card);
  border: 1px solid var(--line-2);
  border-radius: 8px;
  font-size: 13px; font-weight: 650;
  color: var(--dim);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-cancel:hover:not(:disabled) {
  border-color: var(--line);
  color: var(--txt);
}
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-confirm {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 20px;
  background: var(--grad, var(--vio));
  border: none;
  border-radius: 8px;
  font-size: 13px; font-weight: 700;
  color: #ffffff;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  white-space: nowrap;
}
.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

.btn-danger {
  padding: 11px 20px;
  background: var(--bad, #e11d48);
  border: none;
  border-radius: 8px;
  font-size: 13px; font-weight: 700;
  color: #ffffff;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-danger:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #be123c;
}
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.22s ease; }
.modal-enter-active .modal, .modal-leave-active .modal {
  transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease;
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}

/* ===== TOAST ===== */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  background: var(--txt);
  color: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  z-index: 850;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 32px);
}
.toast svg { width: 15px; height: 15px; flex-shrink: 0; color: #34d399; }
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

/* ===== MOBILE ===== */
@media (max-width: 640px) {
  .page { padding-bottom: 100px; }
  h1 { font-size: 13px; }

  .card-head { padding: 14px 16px 12px; }
  .card-body { padding: 16px; }
  .card-foot { padding: 12px 16px; flex-direction: column; }

  .btn-action { min-width: 0; width: 100%; }
  .foot-note { min-width: 0; width: 100%; }

  .user-avatar { width: 36px; height: 36px; }

  .bank-value { font-size: 12.5px; }

  .modal { border-radius: 8px; max-width: 100%; }
  .modal-head { padding: 18px 20px 16px; }
  .modal-body { padding: 18px 20px; }
  .modal-foot {
    padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px));
    flex-direction: column-reverse;
  }
  .modal-foot button { width: 100%; justify-content: center; }

  .mib-amount { font-size: 13px; }
}

@media (prefers-reduced-motion: reduce) {
  .spinner,
  .skel-line,
  .skel-block,
  .btn-refresh svg.spinning {
    animation: none !important;
  }
}
</style>