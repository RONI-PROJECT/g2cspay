<template>
  <div class="page">
    <div class="head">
      <div class="head-text">
        <h1>Kredensial</h1>
        <p class="sub">Cukup 1 credential: API Key (full akses, dipakai server-to-server via Basic Auth/Bearer). Sandbox dan Production terpisah.</p>
      </div>
      <button class="btn-primary" @click="openCreate">Buat Key</button>
    </div>

    <div class="env-tabs">
      <button v-for="t in envTabs" :key="t.id" :class="{ on: envTab === t.id }" @click="envTab = t.id">
        {{ t.label }} <span>{{ t.count }}</span>
      </button>
    </div>
    <p v-if="envTab === 'sandbox'" class="env-note sbx">Sandbox: uji integrasi tanpa uang sungguhan. Endpoint <code>/api/sandbox/*</code>, data terpisah dari production.</p>
    <p v-else-if="envTab === 'production'" class="env-note prod">Production: transaksi live dengan uang sungguhan. Endpoint <code>/api/*</code>.</p>

    <div v-if="keys.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="empty-title">Belum ada API key</p>
      <p class="empty-sub">Buat key pertama kamu untuk mulai integrasi</p>
      <button class="btn-primary" @click="openCreate">Buat Key Pertama</button>
    </div>

    <div v-if="keys.length > 0" class="key-list">
      <p v-if="shownKeys.length === 0" class="env-empty">Belum ada key di lingkungan ini.</p>
      <div v-for="k in shownKeys" :key="k.id" class="key-card">
        <div class="key-head">
          <div class="key-title">
            <h3>{{ k.name }}</h3>
            <span class="badge" :class="'badge-' + (k.environment || 'production')">
              <span class="badge-dot"></span>
              {{ k.environment || 'production' }}
            </span>
          </div>
          <div class="key-actions">
            <button class="btn-icon" @click="regenerate(k)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <span>Regenerate</span>
            </button>
            <button class="btn-icon danger" @click="remove(k)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              <span>Hapus</span>
            </button>
          </div>
        </div>

        <div class="key-field">
          <label>API Key</label>
          <div class="field-row">
            <code class="key-display" :class="{ revealed: revealedId === k.id }">
              {{ revealedId === k.id ? k.key : maskKey(k.key) }}
            </code>
            <button class="btn-reveal" @click="toggleReveal(k.id)">
              <svg v-if="revealedId !== k.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <span>{{ revealedId === k.id ? 'Hide' : 'Show' }}</span>
            </button>
            <button class="btn-copy" @click="copy(k.key, k.id)" :class="{ copied: copiedId === k.id }">
              <svg v-if="copiedId !== k.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{{ copiedId === k.id ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>
        </div>

        <div class="key-meta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="meta-icon">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Dibuat: {{ formatDate(k.createdAt) }}
        </div>
      </div>
    </div>

    <!-- MODAL CREATE -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCreate" class="modal-overlay" @click.self="closeCreate">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-eyebrow">Baru</div>
              <h2>Buat API Key</h2>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Label</label>
                <input v-model="form.label" placeholder="Produksi utama" @keyup.enter="create" />
              </div>
              <div class="form-group">
                <label>Environment</label>
                <select v-model="form.environment">
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
                <p class="hint">
                  {{ form.environment === 'sandbox' ? 'Untuk testing tanpa transaksi nyata.' : 'Untuk transaksi live dengan uang sungguhan.' }}
                </p>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-ghost" @click="closeCreate">Batal</button>
              <button class="btn-primary" @click="create" :disabled="!form.label || creating">
                {{ creating ? 'Membuat' : 'Buat' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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

const keys = ref<any[]>([])
const envTab = ref<'all' | 'sandbox' | 'production'>('all')
const envOf = (k: any) => (k.environment === 'sandbox' ? 'sandbox' : 'production')
const shownKeys = computed(() => (envTab.value === 'all' ? keys.value : keys.value.filter((k) => envOf(k) === envTab.value)))
const envTabs = computed(() => [
  { id: 'all' as const, label: 'Semua', count: keys.value.length },
  { id: 'sandbox' as const, label: 'Sandbox', count: keys.value.filter((k) => envOf(k) === 'sandbox').length },
  { id: 'production' as const, label: 'Production', count: keys.value.filter((k) => envOf(k) === 'production').length },
])
const showCreate = ref(false)
const creating = ref(false)
const copiedId = ref<number | string | null>(null)
const revealedId = ref<string | null>(null)
const form = reactive({ label: '', environment: 'sandbox' })
const toast = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.show = true
  toast.message = message
  toast.type = type
  setTimeout(() => { toast.show = false }, 2500)
}

function maskKey(key: string) {
  if (!key) return '-'
  const m = /^((?:SB-)?CSPay-(?:API|Server)-)(.+)$/.exec(key)
  if (m) return m[1] + m[2].slice(0, 4) + '*'.repeat(12) + m[2].slice(-4)
  if (key.length <= 12) return key
  return key.substring(0, 6) + '••••' + key.substring(key.length - 4)
}

function toggleReveal(id: string) {
  revealedId.value = revealedId.value === id ? null : id
}

async function load() {
  try {
    const r: any = await $fetch('/api/user/api-keys', { credentials: 'include' }).catch(() => ({ data: [] }))
    keys.value = r?.data || []
  } catch {}
}
onMounted(load)

function openCreate() {
  form.label = ''
  form.environment = 'sandbox'
  showCreate.value = true
}
function closeCreate() { showCreate.value = false }

async function create() {
  if (!form.label) return
  creating.value = true
  try {
    await $fetch('/api/user/api-keys', {
      method: 'POST',
      body: { name: form.label, environment: form.environment },
      credentials: 'include',
    })
    closeCreate()
    await load()
    showToast('API key berhasil dibuat')
  } catch (e: any) {
    showToast('Gagal: ' + (e?.data?.error || e.message), 'error')
  } finally { creating.value = false }
}

async function regenerate(k: any) {
  try {
    await $fetch(`/api/user/api-keys/${k.id}/regenerate`, {
      method: 'POST',
      credentials: 'include',
    })
    await load()
    revealedId.value = k.id
    showToast('Key berhasil di-regenerate')
  } catch (e: any) {
    showToast('Gagal: ' + (e?.data?.error || e.message), 'error')
  }
}

async function remove(k: any) {
  try {
    await $fetch(`/api/user/api-keys/${k.id}`, { method: 'DELETE', credentials: 'include' })
    await load()
    showToast('Key dihapus')
  } catch (e: any) {
    showToast('Gagal: ' + (e?.data?.error || e.message), 'error')
  }
}

async function copy(t: string, id: number | string) {
  if (!t) { showToast('Kosong', 'error'); return }
  try {
    await navigator.clipboard.writeText(t)
    copiedId.value = id
    showToast('Copied!')
    setTimeout(() => { if (copiedId.value === id) copiedId.value = null }, 1800)
  } catch {
    showToast('Gagal copy - coba manual', 'error')
  }
}

function formatDate(s: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style scoped>
* { box-sizing: border-box; }
.page { width: 100%; max-width: 1200px; margin: 0 auto; padding-bottom: 60px; color: var(--txt); font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
.head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 12px; flex-wrap: wrap; }
.head-text { min-width: 0; }
h1 { font-size: 13px; font-weight: 700; color: var(--txt); letter-spacing: -0.02em; }
.sub { font-size: 13px; color: var(--dim); margin-top: 5px; line-height: 1.55; }

.btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; background: var(--grad, var(--vio)); color: #ffffff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; flex-shrink: 0; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); white-space: nowrap; }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

.btn-ghost { padding: 11px 20px; background: var(--card); border: 1px solid var(--line-2); border-radius: 8px; font-size: 13px; font-weight: 650; cursor: pointer; color: var(--dim); transition: all 0.15s; font-family: inherit; }
.btn-ghost:hover { border-color: var(--line); color: var(--txt); }

.empty-state { text-align: center; padding: 60px 24px; color: var(--dim); background: var(--card); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.empty-icon { width: 60px; height: 60px; border-radius: 8px; background: var(--bg-soft, var(--soft)); border: 1px solid var(--line); color: var(--vio); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
.empty-icon svg { width: 26px; height: 26px; }
.empty-title { font-size: 13px; font-weight: 750; color: var(--txt); margin-bottom: 6px; }
.empty-sub { font-size: 12.5px; color: var(--dim); margin-bottom: 22px; }

.key-list { display: flex; flex-direction: column; gap: 14px; width: 100%; }
.key-card { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 22px; transition: all 0.2s; width: 100%; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.key-card:hover { border-color: rgba(var(--vio-rgb),0.25); }
.key-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
.key-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.key-title h3 { font-size: 13px; font-weight: 750; color: var(--txt); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }

.badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; white-space: nowrap; }
.badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.badge-sandbox { background: rgba(13,148,136,0.08); border: 1px solid rgba(13,148,136,0.22); color: #0d9488; }
.badge-production { background: rgba(var(--vio-rgb),0.08); border: 1px solid rgba(var(--vio-rgb),0.22); color: var(--vio); }

.key-actions { display: flex; gap: 6px; flex-shrink: 0; }
.btn-icon { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; font-size: 12px; font-weight: 650; cursor: pointer; color: var(--dim); transition: all 0.15s; font-family: inherit; white-space: nowrap; }
.btn-icon svg { width: 13px; height: 13px; flex-shrink: 0; }
.btn-icon:hover { border-color: var(--vio-2); color: var(--vio); }
.btn-icon.danger:hover { border-color: rgba(225,29,72,0.35); color: var(--bad, #e11d48); }

.key-field { margin-bottom: 14px; width: 100%; }
.key-field label { display: block; font-size: 10.5px; font-weight: 700; color: var(--dim); margin-bottom: 8px; }
.field-row { display: flex; gap: 8px; align-items: stretch; width: 100%; flex-wrap: wrap; }
.key-display { flex: 1; padding: 12px 14px; background: var(--bg-soft, var(--soft)); border: 1px solid var(--line); border-radius: 8px; font-size: 12.5px; font-family: ui-monospace, 'SF Mono', monospace; word-break: break-all; color: var(--dim); min-width: 0; letter-spacing: 0.02em; font-weight: 650; line-height: 1.5; transition: all 0.2s; }
.key-display.revealed { border-color: rgba(var(--vio-rgb),0.35); background: var(--card); color: var(--vio-ink); font-weight: 700; }

.btn-reveal, .btn-copy { display: inline-flex; align-items: center; gap: 6px; padding: 12px 16px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; font-size: 12px; font-weight: 650; cursor: pointer; color: var(--dim); white-space: nowrap; flex-shrink: 0; transition: all 0.18s; font-family: inherit; }
.btn-reveal svg, .btn-copy svg { width: 13px; height: 13px; flex-shrink: 0; }
.btn-reveal:hover, .btn-copy:hover { border-color: var(--vio-2); color: var(--vio); }
.btn-copy.copied { background: var(--grad, var(--vio)); border-color: transparent; color: #ffffff; }

.key-meta { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--dim); margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); }
.meta-icon { width: 12px; height: 12px; flex-shrink: 0; color: var(--vio); }

/* ===== MODAL ===== */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42, 0.45);  display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
.modal { background: var(--card); border: 1px solid var(--line); border-radius: 8px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; color: var(--txt); font-family: 'Inter', -apple-system, sans-serif; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.modal-head { padding: 22px 24px 18px; border-bottom: 1px solid var(--line); }
.modal-eyebrow { font-size: 10.5px; font-weight: 700; color: var(--vio); margin-bottom: 8px; }
.modal-head h2 { font-size: 13px; font-weight: 700; color: var(--txt); letter-spacing: -0.02em; }
.modal-body { padding: 22px 24px; }
.modal-foot { padding: 16px 24px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; gap: 8px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 12px; font-weight: 700; color: var(--txt); margin-bottom: 8px; }
.form-group input, .form-group select { width: 100%; padding: 12px 14px; border: 1px solid var(--line-2); border-radius: 8px; font-size: 13px; background: var(--card); color: var(--txt); outline: none; transition: all 0.18s; font-family: inherit; }
.form-group input::placeholder { color: var(--dim); opacity: 0.55; }
.form-group input:focus, .form-group select:focus { border-color: var(--vio); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.hint { font-size: 11.5px; color: var(--dim); margin-top: 8px; line-height: 1.55; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.22s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }

/* ===== TOAST ===== */
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 10px; padding: 13px 20px; background: var(--txt); border-radius: 8px; color: #ffffff; font-size: 13px; font-weight: 700; font-family: 'Inter', sans-serif; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); z-index: 10000; max-width: calc(100% - 40px); }
.toast svg { width: 16px; height: 16px; flex-shrink: 0; }
.toast-success svg { color: #34d399; }
.toast-error svg { color: #fb7185; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 12px); }

@media (max-width: 640px) {
  h1 { font-size: 13px; }
  .sub { font-size: 12px; }
  .key-card { padding: 18px 16px; border-radius: 8px; }
  .key-head { gap: 10px; }
  .key-actions { width: 100%; }
  .btn-icon { flex: 1; justify-content: center; }
  .field-row { flex-wrap: wrap; }
  .key-display { flex: 1 1 100%; font-size: 11.5px; }
  .btn-reveal, .btn-copy { flex: 1; justify-content: center; }
  .empty-state { padding: 44px 20px; }
  .empty-icon { width: 52px; height: 52px; }
  .modal { border-radius: 8px; max-width: 100%; }
  .modal-head { padding: 18px 20px 16px; }
  .modal-body { padding: 18px 20px; }
  .modal-foot { padding: 14px 20px; }
}
.env-tabs { display: flex; gap: 6px; margin-bottom: 14px; overflow-x: auto; scrollbar-width: none; }
.env-tabs button { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); font-size: 13px; font-weight: 600; color: var(--dim); white-space: nowrap; font-family: inherit; cursor: pointer; }
.env-tabs button span { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: var(--bg-soft, var(--soft)); }
.env-tabs button.on { background: var(--txt); border-color: var(--txt); color: #fff; }
.env-tabs button.on span { background: rgba(255,255,255,.18); color: #fff; }
.env-note { margin: 0 0 14px; padding: 10px 14px; border-radius: 8px; font-size: 12.5px; line-height: 1.6; overflow-wrap: anywhere; }
.env-note.sbx { background: rgba(13,148,136,.08); color: #5eead4; border: 1px solid rgba(13,148,136,.22); }
.env-note.prod { background: rgba(var(--vio-rgb),.07); color: var(--vio-ink); border: 1px solid rgba(var(--vio-rgb),.2); }
.env-empty { padding: 28px 12px; text-align: center; color: var(--dim); font-size: 13px; }
</style>