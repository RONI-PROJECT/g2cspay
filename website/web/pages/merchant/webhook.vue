<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>Callback</h1>
        <p class="sub">Terima notifikasi event pembayaran secara real-time</p>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title-row">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/>
              <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/>
              <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>
            </svg>
          </div>
          <div>
            <h2>Endpoint</h2>
            <p class="card-sub">Kami akan mengirim POST ke URL ini setiap ada event pembayaran</p>
          </div>
        </div>
        <button v-if="!editing && webhookUrl" class="btn-edit" @click="editing = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
      </div>

      <div v-if="webhookUrl && !editing" class="url-display">
        <div class="url-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </div>
        <div class="url-text">
          <code>{{ webhookUrl }}</code>
        </div>
      </div>

      <div v-if="!webhookUrl || editing" class="form-group">
        <label>URL Endpoint</label>
        <input
          v-model="urlInput"
          type="url"
          placeholder="https://tokoku.com/webhook"
          :disabled="saving"
          @keyup.enter="save"
        />
        <p class="hint">URL HTTPS di server Anda yang menerima notifikasi. Balas HTTP 200 agar tidak dikirim ulang. Signature: SHA512(order_id + status_code + gross_amount + secret).</p>
      </div>

      <div class="events-section">
        <label>Status yang dikirim sebagai notifikasi</label>
        <div class="event-list">
          <span class="event-badge">
            <span class="event-dot"></span>
            settlement
          </span>
          <span class="event-badge">
            <span class="event-dot"></span>
            expire
          </span>
          <span class="event-badge">
            <span class="event-dot"></span>
            cancel
          </span>
        </div>
      </div>

      <div v-if="errorMsg" class="alert err">{{ errorMsg }}</div>
      <div v-if="successMsg" class="alert ok">{{ successMsg }}</div>

      <div class="actions">
        <button v-if="!webhookUrl || editing" class="btn-primary" @click="save" :disabled="saving || !urlInput.trim()">
          {{ saving ? 'Menyimpan' : 'Simpan' }}
        </button>
        <button v-if="editing" class="btn-ghost" @click="cancelEdit" :disabled="saving">
          Batal
        </button>
        <button v-if="webhookUrl && !editing" class="btn-secondary" @click="testWebhook" :disabled="testing">
          {{ testing ? 'Mengirim' : 'Test Webhook' }}
        </button>
        <button v-if="webhookUrl && !editing" class="btn-secondary danger" @click="removeEndpoint" :disabled="saving">
          Hapus URL
        </button>
      </div>
    </div>

    <div v-if="testResult" class="card">
      <div class="card-head">
        <div>
          <h2>Hasil Test</h2>
          <p class="card-sub">Response dari endpoint Anda</p>
        </div>
        <button class="btn-icon" @click="testResult = null">Tutup</button>
      </div>
      <div class="result-status" :class="testResult.success ? 'ok' : 'err'">
        <strong>{{ testResult.success ? 'Berhasil' : 'Gagal' }}</strong>
        <span v-if="testResult.success"> - HTTP {{ testResult.data.status }} · {{ testResult.data.durationMs }}ms</span>
        <span v-else> - {{ testResult.error }}</span>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h2>Log Pengiriman</h2>
          <p class="card-sub">{{ logs.length }} pengiriman terakhir</p>
        </div>
        <div class="head-actions">
          <button class="btn-icon" @click="load" :disabled="loading" title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spinning: loading }">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button v-if="logs.length > 0" class="btn-icon" @click="clearLogs" title="Bersihkan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="loading" class="state">
        <div class="spinner"></div>
        <p>Memuat</p>
      </div>

      <div v-else-if="logs.length === 0" class="empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <p>Belum ada log pengiriman</p>
      </div>

      <div v-else class="log-table">
        <div class="log-header">
          <span>Event</span>
          <span>URL</span>
          <span>HTTP</span>
          <span>Latensi</span>
          <span>Status</span>
          <span>Waktu</span>
        </div>
        <div v-for="l in logs" :key="l.id" class="log-row">
          <span class="log-event" :title="l.event || 'settlement'">{{ l.event || 'settlement' }}</span>
          <span class="log-url" :title="l.url">{{ shortUrl(l.url) }}</span>
          <span class="log-http">{{ l.httpStatus || '-' }}</span>
          <span class="log-latency">{{ l.latencyMs ? l.latencyMs + 'ms' : '-' }}</span>
          <span>
            <span class="log-status" :class="l.status === 'delivered' ? 'ok' : 'fail'">
              {{ l.status === 'delivered' ? 'Terkirim' : 'Gagal' }}
            </span>
          </span>
          <span class="log-time">{{ formatLogDate(l.sentAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const webhookUrl = ref('')
const urlInput = ref('')
const editing = ref(false)
const saving = ref(false)
const testing = ref(false)
const loading = ref(true)
const errorMsg = ref('')
const successMsg = ref('')
const testResult = ref<any>(null)
const logs = ref<any[]>([])

async function load() {
  loading.value = true
  try {
    const [w, l]: any = await Promise.all([
      $fetch('/api/user/webhook', { credentials: 'include' }).catch(() => ({ data: {} })),
      $fetch('/api/user/webhook/logs?limit=30', { credentials: 'include' }).catch(() => ({ data: [] })),
    ])
    webhookUrl.value = w.data?.webhookUrl || ''
    urlInput.value = webhookUrl.value
    logs.value = l.data || []
  } finally {
    loading.value = false
  }
}

function cancelEdit() {
  editing.value = false
  urlInput.value = webhookUrl.value
  errorMsg.value = ''
}

async function save() {
  errorMsg.value = ''
  successMsg.value = ''
  saving.value = true
  try {
    await $fetch('/api/user/webhook', {
      method: 'POST',
      body: { webhookUrl: urlInput.value.trim() || null },
      credentials: 'include',
    })
    webhookUrl.value = urlInput.value.trim()
    editing.value = false
    successMsg.value = 'URL tersimpan'
    setTimeout(() => successMsg.value = '', 2500)
  } catch (e: any) {
    errorMsg.value = e?.data?.error || e.message
  } finally {
    saving.value = false
  }
}

async function testWebhook() {
  testing.value = true
  testResult.value = null
  try {
    const r: any = await $fetch('/api/user/webhook-test/test', { method: 'POST', credentials: 'include' })
    testResult.value = r
    await load()
  } catch (e: any) {
    testResult.value = { success: false, error: e?.data?.error || e.message }
    await load()
  } finally {
    testing.value = false
  }
}

async function removeEndpoint() {
  if (!confirm('Hapus URL webhook?')) return
  urlInput.value = ''
  await save()
  await load()
}

async function clearLogs() {
  if (!confirm('Hapus semua log?')) return
  await $fetch('/api/user/webhook/logs', { method: 'DELETE', credentials: 'include' })
  logs.value = []
}

function shortUrl(u: string) {
  if (!u) return '-'
  try {
    const url = new URL(u)
    return url.hostname + url.pathname
  } catch {
    return u
  }
}

function formatLogDate(s: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' })
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
h1 { font-size: 13px; font-weight: 700; color: var(--txt); letter-spacing: -0.02em; }
.sub { font-size: 13px; color: var(--dim); margin-top: 5px; }

.card {
  padding: 22px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  gap: 12px;
  flex-wrap: wrap;
}

.card-title-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-width: 0;
}

.card-icon {
  width: 42px; height: 42px;
  border-radius: 8px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.card-icon svg { width: 20px; height: 20px; }

.card h2 { font-size: 13px; font-weight: 750; color: var(--txt); }
.card-sub { font-size: 12.5px; color: var(--dim); margin-top: 4px; line-height: 1.5; }

.btn-edit {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 650;
  color: var(--dim);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  flex-shrink: 0;
}
.btn-edit:hover {
  border-color: var(--vio-2);
  color: var(--vio);
}
.btn-edit svg { width: 13px; height: 13px; }

.url-display {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line-2);
  border-radius: 8px;
  margin-bottom: 18px;
  min-width: 0;
}
.url-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.url-icon svg { width: 15px; height: 15px; }
.url-text { flex: 1; min-width: 0; }
.url-text code {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  color: var(--vio-ink);
  word-break: break-all;
  font-weight: 700;
}

.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.form-group label { font-size: 12px; font-weight: 700; color: var(--txt); }
.form-group input {
  width: 100%;
  padding: 12px 14px;
  background: var(--card);
  border: 1px solid var(--line-2);
  border-radius: 8px;
  font-size: 13px;
  color: var(--txt);
  font-family: ui-monospace, monospace;
  outline: none;
  transition: all 0.18s;
}
.form-group input::placeholder { color: var(--dim); opacity: 0.55; }
.form-group input:focus {
  border-color: var(--vio);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.hint { font-size: 11.5px; color: var(--dim); line-height: 1.55; margin-top: 4px; }

.events-section { margin-bottom: 18px; }
.events-section > label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--txt);
  margin-bottom: 10px;
}
.event-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.event-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(var(--vio-rgb),0.06);
  border: 1px solid rgba(var(--vio-rgb),0.18);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  font-family: ui-monospace, monospace;
  color: var(--vio-ink);
  white-space: nowrap;
}
.event-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--vio);
  flex-shrink: 0;
}

.alert {
  padding: 11px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  margin-bottom: 14px;
  line-height: 1.5;
  font-weight: 600;
}
.alert.err {
  background: rgba(225,29,72,0.05);
  color: var(--bad, #e11d48);
  border: 1px solid rgba(225,29,72,0.18);
}
.alert.ok {
  background: rgba(16,185,129,0.07);
  color: #059669;
  border: 1px solid rgba(16,185,129,0.25);
}

.actions { display: flex; gap: 8px; flex-wrap: wrap; }

.btn-primary {
  padding: 11px 20px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

.btn-secondary {
  padding: 11px 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 650;
  color: var(--txt);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.btn-secondary:hover:not(:disabled) {
  border-color: var(--vio-2);
  color: var(--vio);
}
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary.danger { color: var(--bad, #e11d48); border-color: rgba(225,29,72,0.25); }
.btn-secondary.danger:hover:not(:disabled) {
  color: var(--bad, #e11d48);
  border-color: rgba(225,29,72,0.45);
  background: rgba(225,29,72,0.04);
}

.btn-ghost {
  padding: 11px 16px;
  background: var(--card);
  border: 1px solid var(--line-2);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 650;
  color: var(--dim);
  cursor: pointer;
  font-family: inherit;
}
.btn-ghost:hover { border-color: var(--line); color: var(--txt); }

.btn-icon {
  width: 34px; height: 34px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
  font-family: inherit;
}
.btn-icon:hover:not(:disabled) {
  border-color: var(--vio-2);
  color: var(--vio);
}
.btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon svg { width: 15px; height: 15px; }
.btn-icon svg.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.head-actions { display: flex; gap: 6px; }

.result-status {
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 600;
}
.result-status.ok {
  background: rgba(16,185,129,0.07);
  border: 1px solid rgba(16,185,129,0.25);
  color: #059669;
}
.result-status.ok strong { color: #059669; }
.result-status.err {
  background: rgba(225,29,72,0.05);
  border: 1px solid rgba(225,29,72,0.18);
  color: var(--bad, #e11d48);
}
.result-status.err strong { color: var(--bad, #e11d48); }

.state {
  text-align: center;
  padding: 40px 20px;
  color: var(--dim);
  font-size: 13px;
}
.spinner {
  width: 26px; height: 26px;
  border: 3px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--dim);
  font-size: 13px;
}
.empty-icon {
  width: 52px; height: 52px;
  border-radius: 8px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
}
.empty-icon svg { width: 22px; height: 22px; }

.log-table { width: 100%; }
.log-header, .log-row {
  display: grid;
  grid-template-columns: minmax(140px, 1.2fr) minmax(160px, 1.5fr) 70px 90px 100px minmax(120px, 1fr);
  gap: 16px;
  padding: 14px 4px;
  align-items: center;
}
.log-header {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--dim);
  border-bottom: 1px solid var(--line);
}
.log-row {
  border-bottom: 1px solid var(--line);
  font-size: 12.5px;
}
.log-row:last-child { border-bottom: none; }
.log-row:hover { background: var(--bg-soft, var(--soft)); }

.log-event,
.log-url {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.log-event {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--vio-ink);
  font-weight: 700;
}
.log-url {
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  color: var(--dim);
}
.log-http {
  font-family: ui-monospace, monospace;
  font-weight: 700;
  font-size: 12.5px;
  color: var(--txt);
}
.log-latency {
  color: var(--dim);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
}
.log-status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
}
.log-status.ok {
  background: rgba(16,185,129,0.09);
  border: 1px solid rgba(16,185,129,0.25);
  color: #059669;
}
.log-status.fail {
  background: rgba(225,29,72,0.06);
  border: 1px solid rgba(225,29,72,0.18);
  color: var(--bad, #e11d48);
}
.log-time {
  font-size: 11.5px;
  color: var(--dim);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .log-header, .log-row {
    grid-template-columns: 1.3fr 1fr 70px 90px;
    gap: 10px;
    font-size: 12px;
  }
  .log-header span:nth-child(2),
  .log-row span:nth-child(2),
  .log-header span:nth-child(4),
  .log-row span:nth-child(4) { display: none; }
}

@media (max-width: 640px) {
  .page { padding-bottom: 40px; }
  .card { padding: 16px; }
  h1 { font-size: 13px; }

  .log-header, .log-row {
    grid-template-columns: 1.2fr 70px 90px;
    gap: 8px;
    font-size: 11.5px;
    padding: 10px 2px;
  }
  .log-header span:nth-child(6),
  .log-row span:nth-child(6) { display: none; }

  .url-display { flex-direction: column; align-items: flex-start; gap: 8px; }
  .url-icon { display: none; }
  .event-list { gap: 6px; }
  .event-badge { padding: 6px 10px; font-size: 11px; }
}
</style>