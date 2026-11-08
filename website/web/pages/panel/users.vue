<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>Kelola Users</h1>
        <p class="sub">{{ list.length }} user ditemukan</p>
      </div>
      <div class="head-actions">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="q" placeholder="Cari email/nama" @input="debouncedLoad" />
          <button v-if="q" class="search-clear" @click="clearSearch" title="Bersihkan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <button class="btn-backup" @click="downloadBackup" title="Download backup ZIP (.env + database)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Backup ZIP</span>
        </button>
        <button class="btn-delete-all" @click="showDeleteAll = true" :disabled="list.length === 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <span>Hapus Semua</span>
        </button>
      </div>
    </div>

    <!-- MINI STATS -->
    <div class="stats-row">
      <div class="mini-stat">
        <div class="ms-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
        </div>
        <div class="ms-body">
          <div class="ms-label">Total</div>
          <div class="ms-value">{{ list.length }}</div>
        </div>
      </div>
      <div class="mini-stat">
        <div class="ms-icon ms-icon--ok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="ms-body">
          <div class="ms-label">Aktif</div>
          <div class="ms-value">{{ countActive }}</div>
        </div>
      </div>
      <div class="mini-stat">
        <div class="ms-icon ms-icon--bad">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <div class="ms-body">
          <div class="ms-label">Banned</div>
          <div class="ms-value">{{ countBanned }}</div>
        </div>
      </div>
    </div>

    <!-- LOADING SKELETON -->
    <div v-if="loading" class="list">
      <div v-for="i in 4" :key="i" class="card skeleton">
        <div class="skel-avatar"></div>
        <div class="info">
          <div class="skel-line skel-line-1"></div>
          <div class="skel-line skel-line-2"></div>
          <div class="skel-line skel-line-3"></div>
        </div>
      </div>
    </div>

    <!-- EMPTY -->
    <div v-else-if="list.length === 0" class="state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      </div>
      <p class="empty-title">{{ q ? 'Tidak ada hasil' : 'Belum ada user' }}</p>
      <p class="empty-sub">{{ q ? 'Coba kata kunci lain' : 'User yang mendaftar akan muncul di sini' }}</p>
    </div>

    <!-- LIST -->
    <div v-else class="list">
      <div v-for="u in list" :key="u.id" class="card">
        <div class="avatar" :class="{ banned: u.status === 'banned' }">
          {{ (u.name || u.email || 'U').charAt(0).toUpperCase() }}
        </div>
        <div class="info">
          <div class="row1">
            <div class="name">{{ u.name || 'Tanpa nama' }}</div>
            <span :class="['badge', 'badge-' + (u.status || 'active')]">
              {{ u.status === 'banned' ? 'Banned' : 'Aktif' }}
            </span>
          </div>
          <div class="email">{{ u.email }}</div>
          <div class="meta">
            <span>ID {{ u.id }}</span>
            <span class="meta-dot">·</span>
            <span>Daftar {{ formatDate(u.createdAt) }}</span>
            <span class="meta-dot">·</span>
            <span class="saldo-val">Saldo {{ rupiahFmt(u.balance) }}</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn-action btn-topup" @click="openTopup(u)" title="Top Up Saldo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <circle cx="12" cy="12" r="2.5"/>
              <path d="M6 12h.01M18 12h.01"/>
            </svg>
          </button>
          <button class="btn-action btn-key" @click="openEdit(u, 'password')" title="Ganti Password">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </button>
          <button class="btn-action btn-mail" @click="openEdit(u, 'email')" title="Ganti Email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </button>
          <button v-if="u.status === 'active'" class="btn-action btn-ban" @click="openConfirm(u, 'ban')" title="Ban user">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </button>
          <button v-else class="btn-action btn-unban" @click="openConfirm(u, 'unban')" title="Unban user">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL BAN/UNBAN -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmTarget" class="modal-overlay" @click.self="closeConfirm">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-icon" :class="confirmAction === 'ban' ? 'icon-bad' : 'icon-ok'">
                <svg v-if="confirmAction === 'ban'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div>
                <h2>{{ confirmAction === 'ban' ? 'Ban User' : 'Unban User' }}</h2>
                <p class="modal-sub">{{ confirmAction === 'ban' ? 'User tidak akan bisa login' : 'User akan bisa login kembali' }}</p>
              </div>
            </div>

            <div class="modal-body">
              <div class="user-info">
                <div class="user-avatar">{{ (confirmTarget.name || confirmTarget.email || 'U').charAt(0).toUpperCase() }}</div>
                <div class="user-detail">
                  <div class="user-name">{{ confirmTarget.name || 'Tanpa nama' }}</div>
                  <div class="user-email">{{ confirmTarget.email }}</div>
                </div>
              </div>
            </div>

            <div class="modal-foot">
              <button class="btn-cancel" @click="closeConfirm" :disabled="confirming">Batal</button>
              <button class="btn-confirm" :class="confirmAction === 'ban' ? 'btn-danger-solid' : 'btn-grad'" @click="doConfirm" :disabled="confirming">
                <span>{{ confirming ? 'Memproses' : (confirmAction === 'ban' ? 'Ban User' : 'Unban User') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL EDIT USER (PW/EMAIL) -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="editTarget" class="modal-overlay" @click.self="closeEdit">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-icon icon-ok">
                <svg v-if="editMode === 'password'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <h2>{{ editMode === 'password' ? 'Ganti Password' : 'Ganti Email' }}</h2>
                <p class="modal-sub">{{ editTarget.email }}</p>
              </div>
            </div>
            <div class="modal-body">
              <div class="tp-field">
                <label class="tp-label">{{ editMode === 'password' ? 'Password baru (min 6 karakter)' : 'Email baru' }}</label>
                <input v-model="editValue" :type="editMode === 'password' ? 'password' : 'email'" class="tp-input" :placeholder="editMode === 'password' ? 'password baru' : 'nama@email.com'" @input="editError = ''" />
              </div>
              <p v-if="editError" class="tp-error">{{ editError }}</p>
            </div>
            <div class="modal-foot">
              <button class="btn-cancel" @click="closeEdit" :disabled="editBusy">Batal</button>
              <button class="btn-confirm btn-grad" @click="doEdit" :disabled="editBusy">
                <span>{{ editBusy ? 'Memproses' : 'Simpan' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL TOP UP -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="topupTarget" class="modal-overlay" @click.self="closeTopup">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-icon icon-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <circle cx="12" cy="12" r="2.5"/>
                  <path d="M6 12h.01M18 12h.01"/>
                </svg>
              </div>
              <div>
                <h2>Top Up Saldo</h2>
                <p class="modal-sub">Masuk sebagai transaksi PAID manual, potong fee {{ topupFeePct }}%</p>
              </div>
            </div>
            <div class="modal-body">
              <div class="user-info">
                <div class="user-avatar">{{ (topupTarget.name || topupTarget.email || 'U').charAt(0).toUpperCase() }}</div>
                <div class="user-detail">
                  <div class="user-name">{{ topupTarget.name || 'Tanpa nama' }}</div>
                  <div class="user-email">{{ topupTarget.email }}</div>
                </div>
              </div>
              <div class="tp-field">
                <label class="tp-label">Nominal (gross)</label>
                <input v-model="topupAmount" type="number" min="100" class="tp-input" placeholder="misal 1000" @input="topupError = ''" />
              </div>
              <div class="tp-field">
                <label class="tp-label">Catatan (opsional)</label>
                <input v-model="topupNote" type="text" maxlength="200" class="tp-input" placeholder="misal: restore saldo ilang" />
              </div>
              <div class="tp-preview">
                <div class="tp-row"><span>Fee ({{ topupFeePct }}%)</span><strong>-{{ rupiahFmt(topupFee) }}</strong></div>
                <div class="tp-row tp-net"><span>Net masuk ke user</span><strong>{{ rupiahFmt(topupNet) }}</strong></div>
              </div>
              <p v-if="topupError" class="tp-error">{{ topupError }}</p>
            </div>
            <div class="modal-foot">
              <button class="btn-cancel" @click="closeTopup" :disabled="topupBusy">Batal</button>
              <button class="btn-confirm btn-grad" @click="doTopup" :disabled="topupBusy || topupNet <= 0">
                <span>{{ topupBusy ? 'Memproses' : 'Top Up Sekarang' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL HAPUS SEMUA -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteAll" class="modal-overlay" @click.self="closeDeleteAll">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-icon icon-bad">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h2>Hapus Semua User</h2>
                <p class="modal-sub">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>

            <div class="modal-body">
              <div class="count-box">
                <div class="cb-label">User yang akan dihapus</div>
                <div class="cb-value">{{ list.length }} user</div>
              </div>

              <p class="warning-text">Data berikut akan ikut terhapus permanen:</p>
              <ul class="danger-list">
                <li>Semua akun user</li>
                <li>Semua transaksi &amp; riwayat penarikan</li>
                <li>API keys &amp; webhook config</li>
                <li>Notifikasi &amp; sesi login</li>
              </ul>
            </div>

            <div class="modal-foot">
              <button class="btn-cancel" @click="closeDeleteAll" :disabled="deleting">Batal</button>
              <button class="btn-confirm btn-danger-solid" @click="confirmDeleteAll" :disabled="deleting">
                <span>{{ deleting ? 'Menghapus' : 'Hapus Permanen' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
const loading = ref(true)
const q = ref('')
const showDeleteAll = ref(false)
const deleting = ref(false)
const toast = ref('')

// Confirm modal (ganti native confirm)
const confirmTarget = ref<any>(null)
const confirmAction = ref<'ban' | 'unban'>('ban')
const confirming = ref(false)

const countActive = computed(() => list.value.filter(u => (u.status || 'active') === 'active').length)
const countBanned = computed(() => list.value.filter(u => u.status === 'banned').length)

async function load() {
  loading.value = true
  try {
    const query = q.value ? `?q=${encodeURIComponent(q.value)}` : ''
    const r: any = await $fetch(`/api/admin-panel/users${query}`, { credentials: 'include' })
    list.value = r.data || []
  } catch (e) {
    console.error('load users error:', e)
    list.value = []
  } finally {
    loading.value = false
  }
}

let timer: any = null
function debouncedLoad() {
  clearTimeout(timer)
  timer = setTimeout(load, 300)
}

function clearSearch() {
  q.value = ''
  load()
}

function openConfirm(u: any, action: 'ban' | 'unban') {
  confirmTarget.value = u
  confirmAction.value = action
}

function closeConfirm() {
  if (confirming.value) return
  confirmTarget.value = null
}

async function doConfirm() {
  if (!confirmTarget.value) return
  confirming.value = true
  try {
    const u = confirmTarget.value
    const action = confirmAction.value
    await $fetch(`/api/admin-panel/users/${u.id}/${action}`, {
      method: 'POST',
      credentials: 'include',
    })
    toast.value = action === 'ban' ? `${u.email} berhasil di-ban` : `${u.email} berhasil di-unban`
    setTimeout(() => toast.value = '', 2500)
    confirmTarget.value = null
    await load()
  } catch (e: any) {
    alert('Gagal: ' + (e?.data?.error || e.message))
  } finally {
    confirming.value = false
  }
}

// Edit user (ganti pw / email) + backup
const editTarget = ref<any>(null)
const editMode = ref<'password' | 'email'>('password')
const editValue = ref('')
const editBusy = ref(false)
const editError = ref('')
function openEdit(u: any, mode: 'password' | 'email') {
  editTarget.value = u
  editMode.value = mode
  editValue.value = ''
  editError.value = ''
}
function closeEdit() {
  if (editBusy.value) return
  editTarget.value = null
}
async function doEdit() {
  if (!editTarget.value || editBusy.value) return
  const v = editValue.value.trim()
  if (editMode.value === 'password' && v.length < 6) { editError.value = 'Password minimal 6 karakter'; return }
  if (editMode.value === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { editError.value = 'Format email tidak valid'; return }
  editBusy.value = true
  try {
    await $fetch(`/api/admin-panel/users/${editTarget.value.id}/${editMode.value === 'password' ? 'password' : 'email'}`, {
      method: 'POST',
      credentials: 'include',
      body: editMode.value === 'password' ? { password: v } : { email: v },
    })
    toast.value = `${editTarget.value.email} berhasil diupdate (${editMode.value})`
    setTimeout(() => toast.value = '', 3000)
    editTarget.value = null
    await load()
  } catch (e: any) {
    editError.value = 'Gagal: ' + (e?.data?.error || e.message)
  } finally {
    editBusy.value = false
  }
}
function downloadBackup() {
  toast.value = 'Backup disiapkan, download mulai otomatis...'
  setTimeout(() => toast.value = '', 2500)
  window.location.href = '/api/admin-panel/backup'
}

// Top up saldo
const topupTarget = ref<any>(null)
const topupAmount = ref('')
const topupNote = ref('')
const topupBusy = ref(false)
const topupError = ref('')
const topupFeePct = ref(2)
const topupGross = computed(() => Math.floor(Number(topupAmount.value) || 0))
const topupFee = computed(() => Math.round(topupGross.value * topupFeePct.value / 100))
const topupNet = computed(() => Math.max(0, topupGross.value - topupFee.value))
function openTopup(u: any) {
  topupTarget.value = u
  topupAmount.value = ''
  topupNote.value = ''
  topupError.value = ''
}
function closeTopup() {
  if (topupBusy.value) return
  topupTarget.value = null
}
function rupiahFmt(n: number) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}
async function doTopup() {
  if (!topupTarget.value || topupBusy.value) return
  if (!topupGross.value || topupGross.value < 100) {
    topupError.value = 'Nominal minimal Rp 100'
    return
  }
  topupBusy.value = true
  try {
    const r: any = await $fetch(`/api/admin-panel/users/${topupTarget.value.id}/topup`, {
      method: 'POST',
      credentials: 'include',
      body: { amount: topupGross.value, note: topupNote.value },
    })
    toast.value = `Top up ${topupTarget.value.email}: +${rupiahFmt(r.data?.net || 0)} net (fee ${rupiahFmt(r.data?.fee || 0)})`
    setTimeout(() => toast.value = '', 3500)
    topupTarget.value = null
    await load()
  } catch (e: any) {
    topupError.value = 'Gagal: ' + (e?.data?.error || e.message)
  } finally {
    topupBusy.value = false
  }
}

function closeDeleteAll() {
  if (deleting.value) return
  showDeleteAll.value = false
}

async function confirmDeleteAll() {
  deleting.value = true
  try {
    const r: any = await $fetch('/api/admin-panel/delete-all-users', {
      method: 'POST',
      credentials: 'include',
    })
    showDeleteAll.value = false
    toast.value = `${r.deleted || list.value.length} user berhasil dihapus`
    setTimeout(() => toast.value = '', 3000)
    await load()
  } catch (e: any) {
    alert('Gagal: ' + (e?.data?.error || e.message))
  } finally {
    deleting.value = false
  }
}

function formatDate(s: string) {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' })
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
  margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
}
h1 { font-size: 13px; font-weight: 700; color: var(--txt); letter-spacing: -0.02em; }
.sub { font-size: 13px; color: var(--dim); margin-top: 5px; }

.head-actions {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  min-width: 240px;
}
.search-wrap > svg {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  width: 16px; height: 16px; color: var(--dim); pointer-events: none;
}
.search-wrap input {
  width: 100%;
  padding: 10px 36px 10px 38px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px; color: var(--txt); font-family: inherit;
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
  width: 22px; height: 22px;
  border-radius: 6px;
  background: var(--bg-soft, var(--soft));
  border: none;
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.search-clear:hover { background: rgba(var(--vio-rgb),0.08); color: var(--vio); }
.search-clear svg { width: 11px; height: 11px; }

.btn-delete-all {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 14px;
  background: var(--card);
  border: 1px solid rgba(225,29,72,0.3);
  border-radius: 8px;
  font-size: 12.5px; font-weight: 700;
  color: var(--bad, #e11d48);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.btn-delete-all:hover:not(:disabled) {
  background: rgba(225,29,72,0.05);
}
.btn-delete-all:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-delete-all svg { width: 14px; height: 14px; }

/* ===== MINI STATS ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}
.mini-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.mini-stat:hover { border-color: var(--line-2); }
.ms-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ms-icon--ok {
  background: rgba(16,185,129,0.08);
  border-color: rgba(16,185,129,0.22);
  color: #059669;
}
.ms-icon--bad {
  background: rgba(225,29,72,0.06);
  border-color: rgba(225,29,72,0.18);
  color: var(--bad, #e11d48);
}
.ms-icon svg { width: 15px; height: 15px; }
.ms-body { min-width: 0; }
.ms-label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--dim);
  margin-bottom: 4px;
}
.ms-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* ===== STATE ===== */
.state {
  text-align: center;
  padding: 60px 20px;
  color: var(--dim);
  font-size: 13px;
}
.empty-icon {
  width: 60px; height: 60px;
  margin: 0 auto 16px;
  border-radius: 8px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
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
.list { display: flex; flex-direction: column; gap: 10px; }

.card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.card:hover {
  border-color: rgba(var(--vio-rgb),0.25);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

/* SKELETON */
.card.skeleton { pointer-events: none; }
.skel-avatar {
  width: 44px; height: 44px;
  border-radius: 8px;
  background: var(--bg-soft, var(--soft));
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}
.skel-line {
  height: 10px;
  background: var(--bg-soft, var(--soft));
  border-radius: 5px;
  animation: shimmer 1.5s infinite;
}
.skel-line-1 { width: 55%; margin-bottom: 8px; }
.skel-line-2 { width: 75%; height: 8px; margin-bottom: 8px; }
.skel-line-3 { width: 40%; height: 7px; }
@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* AVATAR */
.avatar {
  width: 44px; height: 44px;
  border-radius: 8px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700;
  flex-shrink: 0;
  letter-spacing: -0.02em;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.avatar.banned {
  background: var(--bg-soft, var(--soft));
  color: var(--dim);
  border: 1px solid var(--line);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

/* INFO */
.info { flex: 1; min-width: 0; }
.row1 {
  display: flex; align-items: center; gap: 8px;
  flex-wrap: wrap; margin-bottom: 4px;
}
.name {
  font-size: 13px;
  font-weight: 750;
  color: var(--txt);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.email {
  font-size: 12.5px; color: var(--dim);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.meta {
  font-size: 11px; color: var(--dim); margin-top: 3px;
  display: flex; gap: 5px; flex-wrap: wrap;
  opacity: 0.8;
}
.meta-dot { opacity: 0.5; }

/* BADGE */
.badge {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 700;
  white-space: nowrap;
}
.badge-active {
  background: rgba(16,185,129,0.09);
  color: #059669;
  border: 1px solid rgba(16,185,129,0.25);
}
.badge-banned {
  background: rgba(225,29,72,0.06);
  color: var(--bad, #e11d48);
  border: 1px solid rgba(225,29,72,0.18);
}

/* ACTIONS */
.actions { display: flex; gap: 6px; flex-shrink: 0; }
.btn-action {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.btn-action svg { width: 15px; height: 15px; }
.btn-ban:hover {
  background: rgba(225,29,72,0.05);
  border-color: rgba(225,29,72,0.35);
  color: var(--bad, #e11d48);
}
.btn-unban:hover {
  background: rgba(16,185,129,0.05);
  border-color: rgba(16,185,129,0.35);
  color: #059669;
}
.btn-topup:hover {
  background: rgba(59,130,246,0.06);
  border-color: rgba(59,130,246,0.4);
  color: #3b82f6;
}
.btn-key:hover {
  background: rgba(245,158,11,0.06);
  border-color: rgba(245,158,11,0.4);
  color: #f59e0b;
}
.btn-mail:hover {
  background: rgba(139,92,246,0.06);
  border-color: rgba(139,92,246,0.4);
  color: #8b5cf6;
}
.saldo-val { color: #10b981; font-weight: 700; }
.btn-backup {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 14px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  font-size: 12px; font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.btn-backup:hover { border-color: rgba(59,130,246,0.5); color: #3b82f6; background: rgba(59,130,246,0.06); }
.btn-backup svg { width: 14px; height: 14px; }

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
  max-height: 90vh; overflow-y: auto;
  color: var(--txt);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.modal-head {
  display: flex; gap: 14px;
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
.modal-head h2 {
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}
.modal-sub {
  font-size: 12px;
  color: var(--dim);
  font-weight: 600;
}

.modal-body { padding: 20px 24px; }

/* User info (ban/unban modal) */
.user-info {
  display: flex; gap: 12px;
  padding: 14px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
  align-items: center;
}
.user-avatar {
  width: 40px; height: 40px;
  border-radius: 8px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.user-detail { min-width: 0; }
.user-name {
  font-size: 13px;
  font-weight: 750;
  color: var(--txt);
  margin-bottom: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-email {
  font-size: 12px;
  color: var(--dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Count box */
.count-box {
  padding: 16px;
  background: rgba(225,29,72,0.05);
  border: 1px solid rgba(225,29,72,0.18);
  border-radius: 8px;
  text-align: center;
  margin-bottom: 18px;
}
.cb-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--bad, #e11d48);
  margin-bottom: 6px;
}
.cb-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--bad, #e11d48);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.warning-text {
  font-size: 13px;
  color: var(--txt);
  font-weight: 650;
  margin-bottom: 10px;
  line-height: 1.5;
}
.danger-list { list-style: none; padding: 0; margin: 0; }
.danger-list li {
  position: relative;
  padding-left: 20px;
  font-size: 12.5px;
  color: var(--dim);
  line-height: 1.7;
  margin-bottom: 4px;
}
.danger-list li::before {
  content: '';
  position: absolute;
  left: 4px; top: 9px;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--bad, #e11d48);
  opacity: 0.7;
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
  font-size: 13px;
  font-weight: 650;
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
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-grad {
  background: var(--grad, var(--vio));
  color: #ffffff;
  border: none;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-grad:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-danger-solid {
  background: var(--bad, #e11d48);
  color: #ffffff;
  border: none;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-danger-solid:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #be123c;
}
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.btn-confirm svg { width: 14px; height: 14px; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.22s ease; }
.modal-enter-active .modal, .modal-leave-active .modal {
  transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease;
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}

/* TOAST */
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
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.22,1,0.36,1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 20px); }

/* ===== MOBILE ===== */
@media (max-width: 640px) {
  .page { padding-bottom: 100px; }
  h1 { font-size: 13px; }

  .head-actions { width: 100%; flex-wrap: wrap; }
  .search-wrap { flex: 1 1 100%; min-width: 0; order: 1; }
  .btn-delete-all { order: 2; width: 100%; justify-content: center; }

  .stats-row { gap: 8px; }
  .mini-stat { padding: 12px; gap: 10px; }
  .ms-icon { width: 32px; height: 32px; }
  .ms-icon svg { width: 14px; height: 14px; }
  .ms-value { font-size: 13px; }

  .card { padding: 14px; gap: 12px; }
  .avatar { width: 40px; height: 40px; font-size: 13px; }
  .name { font-size: 13px; }
  .email { font-size: 12px; }
  .btn-action { width: 32px; height: 32px; }

  .modal { border-radius: 8px; }
  .modal-head { padding: 18px 20px 16px; }
  .modal-body { padding: 18px 20px; }
  .modal-foot {
    padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px));
    flex-direction: column-reverse;
  }
  .modal-foot button { width: 100%; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .skel-avatar, .skel-line {
    animation: none !important;
  }
}
/* TOP UP */
.tp-field { margin-top: 12px; }
.tp-label { display: block; font-size: 11.5px; font-weight: 700; color: var(--dim, #64748b); margin-bottom: 6px; }
.tp-input {
  width: 100%; box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--line, #e2e8f0);
  background: rgba(15,23,42,0.03);
  color: var(--txt, #0f172a);
  font-size: 13.5px; font-weight: 600;
  font-family: inherit;
  outline: none;
}
.tp-input:focus { border-color: #3b82f6; }
.tp-preview { margin-top: 14px; padding: 10px 12px; border-radius: 8px; border: 1px dashed var(--line, #e2e8f0); }
.tp-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--dim, #64748b); padding: 2px 0; }
.tp-row strong { font-variant-numeric: tabular-nums; color: var(--txt, #0f172a); }
.tp-net strong { color: #059669; }
.tp-error { margin: 10px 0 0; font-size: 12px; color: var(--bad, #e11d48); font-weight: 600; }
</style>