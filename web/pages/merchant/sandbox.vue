<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>Sandbox</h1>
        <p class="sub">Uji integrasi tanpa uang sungguhan. Data terpisah dari production.</p>
      </div>
      <NuxtLink to="/merchant/docs" class="btn">Dokumentasi</NuxtLink>
    </div>

    <div class="card">
      <div class="grid">
        <div class="f wide">
          <label>API Key sandbox</label>
          <select v-if="sbKeys.length" v-model="key">
            <option v-for="k in sbKeys" :key="k.id" :value="k.key">{{ k.name || 'Sandbox' }} - {{ mask(k.key) }}</option>
          </select>
          <input v-else v-model="key" placeholder="SB-CSPay-API-xxxxxxxx" autocomplete="off">
          <p v-if="loaded && !sbKeys.length" class="hint">Belum ada key sandbox. Buat di menu <NuxtLink to="/merchant/api-key">Kredensial</NuxtLink> dengan environment sandbox.</p>
        </div>
        <div class="f"><label>Order ID</label><input v-model="orderId" placeholder="otomatis"></div>
        <div class="f"><label>Gross amount</label><input v-model.number="amount" type="number" min="1000"></div>
      </div>
      <div class="btns">
        <button class="btn pri" :disabled="busy" @click="charge">Charge</button>
        <button class="btn" :disabled="busy" @click="act('status', 'GET')">Status</button>
        <button class="btn" :disabled="busy" @click="act('pay', 'POST')">Simulasi bayar</button>
        <button class="btn" :disabled="busy" @click="act('expire', 'POST')">Simulasi expire</button>
        <button class="btn" :disabled="busy" @click="act('cancel', 'POST')">Cancel</button>
        <button class="btn" :disabled="busy" @click="act('notification/resend', 'POST')">Notifikasi</button>
      </div>
    </div>

    <div class="card out">
      <div class="qr">
        <img v-if="qr" :src="qr" alt="QR">
        <span v-else>QR</span>
      </div>
      <div class="res">
        <div class="line">Status <span class="chip">{{ status || '-' }}</span><span v-if="current" class="mono">{{ current }}</span></div>
        <pre>{{ result || 'Belum ada request.' }}</pre>
      </div>
    </div>

    <div class="card">
      <div class="t">Endpoint</div>
      <table>
        <thead><tr><th>Method</th><th>Path</th></tr></thead>
        <tbody>
          <tr v-for="e in endpoints" :key="e[1]"><td>{{ e[0] }}</td><td class="mono">{{ base }}{{ e[1] }}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const config = useRuntimeConfig()
const { siteName } = useSiteSettings()
useHead({ title: 'Sandbox - ' + (siteName.value || 'G2CSPAY') })

const base = computed(() => {
  const url = (config.public.publicUrl || config.public.apiBaseUrl || '') as string
  if (url) return String(url).replace(/\/+$/, '')
  return import.meta.client ? window.location.origin : ''
})

const endpoints = [
  ['POST', '/api/sandbox/charge'],
  ['GET', '/api/sandbox/transaction/{order_id}/status'],
  ['GET', '/api/sandbox/transaction/{order_id}/qr'],
  ['POST', '/api/sandbox/transaction/{order_id}/pay'],
  ['POST', '/api/sandbox/transaction/{order_id}/expire'],
  ['POST', '/api/sandbox/transaction/{order_id}/cancel'],
  ['POST', '/api/sandbox/transaction/{order_id}/notification/resend'],
]

const sbKeys = ref<any[]>([])
const loaded = ref(false)
const key = ref('')
const orderId = ref('')
const amount = ref(10000)
const busy = ref(false)
const current = ref('')
const status = ref('')
const result = ref('')
const qr = ref('')

const mask = (k: string) => (k ? k.slice(0, 16) + '••••' + k.slice(-4) : '')

onMounted(async () => {
  try {
    const r: any = await $fetch('/api/user/api-keys', { credentials: 'include' })
    sbKeys.value = (r?.data || []).filter((k: any) => k.environment === 'sandbox' && k.status === 'active')
    if (sbKeys.value.length) key.value = sbKeys.value[0].key
  } catch {}
  loaded.value = true
})

async function call(path: string, method: string, body?: any) {
  const r = await fetch('/api/sandbox' + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key.value },
    body: body ? JSON.stringify(body) : undefined,
  })
  return r
}

async function run(fn: () => Promise<any>) {
  if (!key.value) { result.value = 'Pilih atau isi API Key sandbox terlebih dahulu.'; return }
  busy.value = true
  try { await fn() } catch (e: any) { result.value = String(e?.message || e) } finally { busy.value = false }
}

function show(d: any) {
  result.value = JSON.stringify(d, null, 2)
  if (d?.transaction_status) status.value = d.transaction_status
}

async function loadQr() {
  const r = await call('/transaction/' + encodeURIComponent(current.value) + '/qr', 'GET')
  if (r.ok) qr.value = URL.createObjectURL(await r.blob())
}

const charge = () => run(async () => {
  const oid = orderId.value.trim() || 'ORD-' + Date.now()
  orderId.value = oid
  const d = await (await call('/charge', 'POST', {
    payment_type: 'qris',
    transaction_details: { order_id: oid, gross_amount: Number(amount.value) },
  })).json()
  show(d)
  if (d.order_id) { current.value = d.order_id; await loadQr() }
})

const act = (name: string, method: string) => run(async () => {
  const id = current.value || orderId.value.trim()
  if (!id) { result.value = 'Isi order id atau lakukan charge dulu.'; return }
  show(await (await call('/transaction/' + encodeURIComponent(id) + '/' + name, method)).json())
})
</script>

<style scoped>
.page { width: 100%; max-width: 960px; margin: 0 auto; padding-bottom: 48px; color: var(--txt); font-size: 13px; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
h1 { font-size: 16px; font-weight: 600; margin: 0 0 2px; }
.sub { margin: 0; color: #737373; }
.card { background: var(--card); border: 1px solid #e5e5e5; border-radius: 6px; padding: 14px; margin-bottom: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.f.wide { grid-column: 1 / -1; }
label { display: block; font-size: 12px; color: #525252; margin-bottom: 3px; }
input, select { width: 100%; height: 32px; border: 1px solid #d4d4d4; border-radius: 4px; padding: 0 9px; background: var(--card); font-size: 13px; }
input:focus, select:focus { outline: none; border-color: var(--vio); }
.hint { margin: 6px 0 0; color: #737373; font-size: 12px; }
.hint a { text-decoration: underline; }
.btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.btn { display: inline-flex; align-items: center; height: 30px; padding: 0 12px; border: 1px solid #d4d4d4; border-radius: 4px; background: var(--card); color: var(--txt); font-size: 13px; }
.btn:hover { background: #fafafa; color: var(--txt); }
.btn.pri { background: var(--vio); border-color: var(--vio); color: #fff; }
.btn:disabled { opacity: .5; cursor: default; }
.out { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 14px; }
.qr { width: 180px; height: 180px; border: 1px solid #e5e5e5; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #a3a3a3; }
.qr img { width: 100%; height: 100%; }
.line { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.chip { padding: 1px 8px; border: 1px solid #d4d4d4; border-radius: 999px; font-size: 12px; }
.mono { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: #737373; }
pre { margin: 0; padding: 10px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 4px; max-height: 300px; overflow: auto; font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; }
.t { font-weight: 600; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; display: block; overflow-x: auto; }
th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #f0f0f0; white-space: nowrap; }
th { color: #737373; font-weight: 500; font-size: 12px; background: #fafafa; }
@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
  .out { grid-template-columns: 1fr; }
  .qr { margin: 0 auto; }
  .btns .btn { flex: 1 1 calc(50% - 6px); justify-content: center; }
}
</style>
