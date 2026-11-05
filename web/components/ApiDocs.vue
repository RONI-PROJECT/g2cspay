<!-- components/ApiDocs.vue - dokumentasi API (dipakai /docs dan /merchant/docs) -->
<template>
  <div class="ad" :class="{ embedded }">
    <aside class="toc">
      <div class="toc-t">Dokumentasi</div>
      <a v-for="s in toc" :key="s.id" :href="'#' + s.id" :class="{ on: active === s.id }" @click="active = s.id">{{ s.label }}</a>
    </aside>

    <article class="doc">
      <section id="pengenalan" class="intro">
        <h1>API {{ siteName }}</h1>
        <p>REST API untuk menerima pembayaran QRIS. Request dan response berformat JSON, UTF-8. Semua nominal berupa string dengan dua desimal, mata uang IDR.</p>
        <dl class="kv">
          <dt>Base URL</dt><dd><code>{{ apiBase }}/api</code></dd>
          <dt>Content-Type</dt><dd><code>application/json</code></dd>
          <dt>Zona waktu</dt><dd>WIB (UTC+7), format <code>YYYY-MM-DD HH:mm:ss</code></dd>
          <dt>Contoh</dt><dd><code>POST {{ apiBase }}/api/charge</code></dd>
        </dl>
      </section>

      <section id="autentikasi">
        <h2>Autentikasi</h2>
        <p>Gunakan <b>API Key</b> dari menu Kredensial. Kirim sebagai HTTP Basic Auth (key sebagai username, password dikosongkan), atau sebagai Bearer token. Jangan pernah menaruh API Key di kode sisi klien.</p>
        <Code :tabs="authTabs" />
        <table>
          <thead><tr><th>Lingkungan</th><th>API Key</th><th>Base path</th></tr></thead>
          <tbody>
            <tr><td>Production</td><td><code>CSPay-API-xxxx</code></td><td><code>/api</code></td></tr>
            <tr><td>Sandbox</td><td><code>SB-CSPay-API-xxxx</code></td><td><code>/api/sandbox</code></td></tr>
          </tbody>
        </table>
        <p class="note">API Key = satu-satunya credential (full akses) untuk memanggil API dari server kamu. Ada di menu Kredensial.</p>
      </section>

      <section id="charge">
        <h2>Buat transaksi</h2>
        <div class="ep"><span class="m">POST</span><code>/charge</code></div>
        <p>Membuat transaksi QRIS dinamis. Nominal yang harus dibayar pelanggan (<code>pay_amount</code>) bisa berbeda dari <code>gross_amount</code> karena kode unik untuk pencocokan otomatis.</p>
        <h3>Parameter</h3>
        <table>
          <thead><tr><th>Field</th><th>Tipe</th><th>Wajib</th><th>Keterangan</th></tr></thead>
          <tbody>
            <tr><td><code>payment_type</code></td><td>string</td><td>Tidak</td><td>Selalu <code>qris</code>.</td></tr>
            <tr><td><code>transaction_details.order_id</code></td><td>string</td><td>Tidak</td><td>ID order kamu, 1-64 karakter (huruf, angka, <code>_ . -</code>). Diisi otomatis jika kosong.</td></tr>
            <tr><td><code>transaction_details.gross_amount</code></td><td>integer</td><td>Ya</td><td>Nominal dalam Rupiah.</td></tr>
            <tr><td><code>customer_details.first_name</code></td><td>string</td><td>Tidak</td><td>Nama pelanggan.</td></tr>
            <tr><td><code>customer_details.email</code></td><td>string</td><td>Tidak</td><td>Email pelanggan.</td></tr>
            <tr><td><code>custom_expiry.expiry_duration</code></td><td>integer</td><td>Tidak</td><td>Masa berlaku, default 30 menit.</td></tr>
            <tr><td><code>custom_expiry.unit</code></td><td>string</td><td>Tidak</td><td><code>minute</code>, <code>hour</code>, atau <code>day</code>.</td></tr>
            <tr><td><code>callback_url</code></td><td>string</td><td>Tidak</td><td>URL notifikasi khusus transaksi ini. Default: URL di menu Callback.</td></tr>
            <tr><td><code>metadata</code></td><td>object</td><td>Tidak</td><td>Data bebas, dikembalikan apa adanya.</td></tr>
          </tbody>
        </table>
        <p class="note">Kirim header <code>Idempotency-Key</code> untuk mencegah transaksi ganda saat request diulang.</p>
        <h3>Contoh request</h3>
        <Code :tabs="chargeTabs" />
        <h3>Response <span class="http">201 Created</span></h3>
        <Code :tabs="[{ name: 'JSON', code: chargeRes }]" />
        <table>
          <thead><tr><th>Field</th><th>Keterangan</th></tr></thead>
          <tbody>
            <tr><td><code>transaction_id</code></td><td>ID transaksi G2CSPAY.</td></tr>
            <tr><td><code>order_id</code></td><td>ID order dari sisi kamu.</td></tr>
            <tr><td><code>gross_amount</code></td><td>Nominal order.</td></tr>
            <tr><td><code>fee_amount</code> / <code>net_amount</code></td><td>Biaya transaksi dan saldo bersih yang kamu terima.</td></tr>
            <tr><td><code>pay_amount</code></td><td>Nominal persis yang harus dibayar pelanggan.</td></tr>
            <tr><td><code>qr_string</code></td><td>String QRIS, bisa dirender ke QR code sendiri.</td></tr>
            <tr><td><code>payment_url</code></td><td>Halaman pembayaran siap pakai untuk pelanggan.</td></tr>
            <tr><td><code>actions[]</code></td><td>Tautan gambar QR (PNG).</td></tr>
          </tbody>
        </table>
      </section>

      <section id="status">
        <h2>Cek status</h2>
        <div class="ep"><span class="m g">GET</span><code>/transaction/{order_id}/status</code></div>
        <p><code>order_id</code> boleh berisi order ID kamu atau <code>transaction_id</code>. Endpoint ini juga memicu pengecekan pembayaran, jadi aman dipakai untuk polling dengan interval minimal 5 detik.</p>
        <Code :tabs="statusTabs" />
        <Code :tabs="[{ name: 'Response 200', code: statusRes }]" />
      </section>

      <section id="cancel">
        <h2>Batalkan transaksi</h2>
        <div class="ep"><span class="m">POST</span><code>/transaction/{order_id}/cancel</code></div>
        <p>Hanya bisa untuk transaksi berstatus <code>pending</code>. Transaksi yang sudah dibayar, dibatalkan, atau kedaluwarsa dibalas <code>412</code>. Notifikasi <code>cancel</code> dikirim ke callback URL.</p>
        <Code :tabs="cancelTabs" />
        <Code :tabs="[{ name: 'Response 200', code: cancelRes }]" />
      </section>

      <section id="callback">
        <h2>Notifikasi (callback)</h2>
        <p>Saat status berubah menjadi <code>settlement</code>, <code>expire</code>, atau <code>cancel</code>, G2CSPAY mengirim <code>POST</code> ke callback URL kamu. Atur URL dan secret di menu Callback.</p>
        <Code :tabs="[{ name: 'Body notifikasi', code: notifBody }]" />
        <h3>Verifikasi signature</h3>
        <p>Hitung <code>SHA512(order_id + status_code + gross_amount + secret)</code> dan bandingkan dengan <code>signature_key</code>. Tolak notifikasi yang tidak cocok. Setelah itu, konfirmasi ulang status lewat endpoint status sebelum mengubah order.</p>
        <Code :tabs="verifyTabs" />
        <h3>Respons dari server kamu</h3>
        <p>Balas HTTP <code>200</code> (body bebas). Selain 200, atau jika timeout 10 detik, notifikasi dikirim ulang hingga 12 kali dengan jeda yang makin panjang. Proses notifikasi secara idempoten karena bisa tiba lebih dari sekali.</p>
        <p>Kirim ulang manual:</p>
        <div class="ep"><span class="m">POST</span><code>/transaction/{order_id}/notification/resend</code></div>
        <Code :tabs="[{ name: 'Response 200', code: resendRes }]" />
      </section>

      <section id="status-code">
        <h2>Status transaksi</h2>
        <table>
          <thead><tr><th>transaction_status</th><th>status_code</th><th>Arti</th></tr></thead>
          <tbody>
            <tr><td><code>pending</code></td><td>201</td><td>Menunggu pembayaran.</td></tr>
            <tr><td><code>settlement</code></td><td>200</td><td>Sudah dibayar, saldo masuk.</td></tr>
            <tr><td><code>cancel</code></td><td>202</td><td>Dibatalkan oleh merchant.</td></tr>
            <tr><td><code>expire</code></td><td>407</td><td>Melewati batas waktu.</td></tr>
          </tbody>
        </table>
      </section>

      <section id="error">
        <h2>Error</h2>
        <p>Error memakai HTTP status yang sesuai dan body berikut:</p>
        <Code :tabs="[{ name: 'Response 400', code: errRes }]" />
        <table>
          <thead><tr><th>HTTP</th><th>Penyebab</th></tr></thead>
          <tbody>
            <tr><td>400</td><td>Parameter tidak valid.</td></tr>
            <tr><td>401</td><td>API Key salah atau tidak dikirim.</td></tr>
            <tr><td>403</td><td>IP tidak ada di whitelist.</td></tr>
            <tr><td>404</td><td>Transaksi tidak ditemukan.</td></tr>
            <tr><td>406</td><td><code>order_id</code> sudah dipakai.</td></tr>
            <tr><td>412</td><td>Status transaksi tidak mengizinkan aksi ini.</td></tr>
            <tr><td>503</td><td>Kode unik pembayaran habis, coba lagi sebentar.</td></tr>
          </tbody>
        </table>
      </section>

      <section id="sandbox">
        <h2>Sandbox</h2>
        <p>Uji integrasi tanpa uang sungguhan. Gunakan API Key sandbox (<code>SB-CSPay-API-xxxxxxxx</code>) dengan base path <code>/api/sandbox</code>. Format request dan response sama dengan production. Data terpisah, saldo tidak berubah, dan tidak ada notifikasi ke callback production. Saldo uji bisa dicek lewat <code>GET /api/sandbox/balance</code> dan tidak pernah bisa ditarik: <code>POST /api/sandbox/withdraw</code> selalu ditolak 403.</p>
        <table>
          <thead><tr><th>Method</th><th>Endpoint</th><th>Fungsi</th></tr></thead>
          <tbody>
            <tr><td>POST</td><td><code>/api/sandbox/charge</code></td><td>Buat transaksi sandbox.</td></tr>
            <tr><td>GET</td><td><code>/api/sandbox/transaction/{order_id}/status</code></td><td>Cek status.</td></tr>
            <tr><td>GET</td><td><code>/api/sandbox/transaction/{order_id}/qr</code></td><td>Gambar QR (PNG).</td></tr>
            <tr><td>POST</td><td><code>/api/sandbox/transaction/{order_id}/pay</code></td><td>Simulasi pembayaran berhasil (settlement).</td></tr>
            <tr><td>POST</td><td><code>/api/sandbox/transaction/{order_id}/expire</code></td><td>Simulasi kedaluwarsa.</td></tr>
            <tr><td>POST</td><td><code>/api/sandbox/transaction/{order_id}/cancel</code></td><td>Batalkan transaksi pending.</td></tr>
            <tr><td>POST</td><td><code>/api/sandbox/transaction/{order_id}/notification/resend</code></td><td>Bentuk ulang payload notifikasi lengkap dengan <code>signature_key</code>.</td></tr>
          </tbody>
        </table>
        <h3>Contoh alur</h3>
        <Code :tabs="sandboxTabs" />
        <p class="note">Alat uji interaktif tersedia di <code>/test</code> dan menu Sandbox di dashboard.</p>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
defineProps<{ embedded?: boolean }>()
const config = useRuntimeConfig()
const { siteName } = useSiteSettings()
const apiBase = computed(() => {
  const url = config.public.publicUrl || config.public.apiBaseUrl || ''
  if (url) return String(url).replace(/\/+$/, '')
  return import.meta.client ? window.location.origin : ''
})

const toc = [
  { id: 'pengenalan', label: 'Pengenalan' },
  { id: 'autentikasi', label: 'Autentikasi' },
  { id: 'charge', label: 'Buat transaksi' },
  { id: 'status', label: 'Cek status' },
  { id: 'cancel', label: 'Batalkan transaksi' },
  { id: 'callback', label: 'Notifikasi' },
  { id: 'status-code', label: 'Status transaksi' },
  { id: 'error', label: 'Error' },
  { id: 'sandbox', label: 'Sandbox' },
]
const active = ref('pengenalan')
onMounted(() => {
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) active.value = e.target.id })
  }, { rootMargin: '-10% 0px -80% 0px' })
  toc.forEach(t => { const el = document.getElementById(t.id); if (el) obs.observe(el) })
})

const B = computed(() => apiBase.value)
const KEY = 'CSPay-API-xxxxxxxxxxxxxxxx'

const authTabs = computed(() => [
  { name: 'cURL', code: `curl ${B.value}/api/transaction/ORDER-1001/status \\\n  -u ${KEY}:` },
  { name: 'Header', code: `Authorization: Basic base64("${KEY}:")\n# atau\nAuthorization: Bearer ${KEY}` },
])

const chargeBody = `{
  "payment_type": "qris",
  "transaction_details": {
    "order_id": "ORDER-1001",
    "gross_amount": 25000
  },
  "customer_details": {
    "first_name": "Budi",
    "email": "budi@example.com"
  },
  "custom_expiry": { "expiry_duration": 15, "unit": "minute" },
  "callback_url": "https://tokomu.com/callback"
}`
const chargeTabs = computed(() => [
  { name: 'cURL', code: `curl -X POST ${B.value}/api/charge \\\n  -u ${KEY}: \\\n  -H "Content-Type: application/json" \\\n  -d '${chargeBody}'` },
  { name: 'Node.js', code: `const res = await fetch("${B.value}/api/charge", {
  method: "POST",
  headers: {
    "Authorization": "Basic " + Buffer.from("${KEY}:").toString("base64"),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    payment_type: "qris",
    transaction_details: { order_id: "ORDER-1001", gross_amount: 25000 },
    callback_url: "https://tokomu.com/callback",
  }),
});
const trx = await res.json();
console.log(trx.payment_url);` },
  { name: 'PHP', code: `$ch = curl_init("${B.value}/api/charge");
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD        => "${KEY}:",
    CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
    CURLOPT_POSTFIELDS     => json_encode([
        "payment_type"        => "qris",
        "transaction_details" => ["order_id" => "ORDER-1001", "gross_amount" => 25000],
        "callback_url"        => "https://tokomu.com/callback",
    ]),
]);
$trx = json_decode(curl_exec($ch), true);
header("Location: " . $trx["payment_url"]);` },
  { name: 'Python', code: `import requests

r = requests.post(
    "${B.value}/api/charge",
    auth=("${KEY}", ""),
    json={
        "payment_type": "qris",
        "transaction_details": {"order_id": "ORDER-1001", "gross_amount": 25000},
        "callback_url": "https://tokomu.com/callback",
    },
)
print(r.json()["payment_url"])` },
])

const chargeRes = computed(() => `{
  "status_code": "201",
  "status_message": "Transaksi berhasil dibuat",
  "transaction_id": "CSP-7HKM4XQ2R9",
  "order_id": "ORDER-1001",
  "gross_amount": "25000.00",
  "fee_amount": "450.00",
  "net_amount": "24550.00",
  "pay_amount": "25037.00",
  "currency": "IDR",
  "payment_type": "qris",
  "transaction_time": "2026-11-05 16:08:12",
  "transaction_status": "pending",
  "fraud_status": "accept",
  "expiry_time": "2026-11-05 16:23:12",
  "qr_string": "00020101021226xxxx6304A1B2",
  "payment_url": "${B.value}/pay/CSP-7HKM4XQ2R9",
  "actions": [
    {
      "name": "generate-qr-code",
      "method": "GET",
      "url": "${B.value}/api/transaction/CSP-7HKM4XQ2R9/qr"
    }
  ]
}`)

const statusTabs = computed(() => [
  { name: 'cURL', code: `curl ${B.value}/api/transaction/ORDER-1001/status \\\n  -u ${KEY}:` },
  { name: 'Node.js', code: `const res = await fetch("${B.value}/api/transaction/ORDER-1001/status", {\n  headers: { Authorization: "Basic " + Buffer.from("${KEY}:").toString("base64") },\n});\nconst trx = await res.json();` },
])
const statusRes = `{
  "status_code": "200",
  "status_message": "Transaksi berhasil dibayar",
  "transaction_id": "CSP-7HKM4XQ2R9",
  "order_id": "ORDER-1001",
  "gross_amount": "25000.00",
  "fee_amount": "450.00",
  "net_amount": "24550.00",
  "pay_amount": "25037.00",
  "currency": "IDR",
  "payment_type": "qris",
  "transaction_time": "2026-11-05 16:08:12",
  "transaction_status": "settlement",
  "settlement_time": "2026-11-05 16:09:40",
  "fraud_status": "accept"
}`

const cancelTabs = computed(() => [
  { name: 'cURL', code: `curl -X POST ${B.value}/api/transaction/ORDER-1001/cancel \\\n  -u ${KEY}:` },
])
const cancelRes = `{
  "status_code": "202",
  "status_message": "Transaksi berhasil dibatalkan",
  "transaction_id": "CSP-7HKM4XQ2R9",
  "order_id": "ORDER-1001",
  "gross_amount": "25000.00",
  "transaction_status": "cancel"
}`

const notifBody = `{
  "transaction_time": "2026-11-05 16:08:12",
  "transaction_status": "settlement",
  "transaction_id": "CSP-7HKM4XQ2R9",
  "status_message": "Transaksi berhasil dibayar",
  "status_code": "200",
  "signature_key": "9f2c...e81a",
  "payment_type": "qris",
  "order_id": "ORDER-1001",
  "gross_amount": "25000.00",
  "fee_amount": "450.00",
  "net_amount": "24550.00",
  "pay_amount": "25037.00",
  "currency": "IDR",
  "fraud_status": "accept",
  "settlement_time": "2026-11-05 16:09:40",
  "expiry_time": "2026-11-05 16:23:12"
}`
const verifyTabs = [
  { name: 'Node.js', code: `import crypto from "node:crypto";

app.post("/callback", express.json(), (req, res) => {
  const n = req.body;
  const expected = crypto.createHash("sha512")
    .update(n.order_id + n.status_code + n.gross_amount + process.env.G2CSPAY_SECRET)
    .digest("hex");

  if (expected !== n.signature_key) return res.sendStatus(403);

  if (n.transaction_status === "settlement") {
    // tandai order n.order_id sebagai lunas (idempoten)
  }
  res.sendStatus(200);
});` },
  { name: 'PHP', code: `$n = json_decode(file_get_contents("php://input"), true);
$expected = hash("sha512", $n["order_id"] . $n["status_code"] . $n["gross_amount"] . G2CSPAY_SECRET);

if (!hash_equals($expected, $n["signature_key"])) {
    http_response_code(403);
    exit;
}

if ($n["transaction_status"] === "settlement") {
    // tandai order $n["order_id"] sebagai lunas (idempoten)
}
http_response_code(200);` },
  { name: 'Python', code: `import hashlib

def valid(n, secret):
    raw = n["order_id"] + n["status_code"] + n["gross_amount"] + secret
    return hashlib.sha512(raw.encode()).hexdigest() == n["signature_key"]` },
]
const resendRes = `{
  "status_code": "200",
  "status_message": "Notifikasi dikirim ulang",
  "order_id": "ORDER-1001",
  "notification_state": "sent"
}`
const sandboxTabs = computed(() => [
  { name: 'cURL', code: `# 1. buat transaksi\ncurl -X POST ${B.value}/api/sandbox/charge \\\n  -u SB-CSPay-API-xxxx: \\\n  -H "Content-Type: application/json" \\\n  -d '{"payment_type":"qris","transaction_details":{"order_id":"TEST-1","gross_amount":10000}}'\n\n# 2. simulasi bayar\ncurl -X POST ${B.value}/api/sandbox/transaction/TEST-1/pay -u SB-CSPay-API-xxxx:\n\n# 3. cek status\ncurl ${B.value}/api/sandbox/transaction/TEST-1/status -u SB-CSPay-API-xxxx:` },
])
const errRes = `{
  "status_code": "400",
  "status_message": "gross_amount harus bilangan bulat 1 - 10000000",
  "validation_messages": ["gross_amount harus bilangan bulat 1 - 10000000"]
}`
</script>

<style scoped>
/* Dokumentasi API — gaya kartu terang senada halaman Webhook (putih + biru) */
.ad { max-width: 1080px; margin: 0 auto; padding: 36px 24px 96px; display: grid; grid-template-columns: 188px minmax(0, 1fr); gap: 56px; color: var(--txt); font-size: 13.5px; line-height: 1.7; }
.ad.embedded { padding: 8px 0 80px; max-width: 1000px; }
.doc { min-width: 0; }

/* Daftar isi */
.toc { position: sticky; top: 24px; align-self: start; display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.toc-t { font-size: 11px; font-weight: 700; color: var(--dim); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
.toc a { padding: 5px 10px; margin-left: -10px; border-left: 2px solid transparent; color: var(--dim); border-radius: 0 7px 7px 0; transition: color 0.15s, background 0.15s; }
.toc a:hover { color: var(--txt); background: rgba(var(--vio-rgb),.04); }
.toc a.on { color: var(--vio); font-weight: 650; border-left-color: var(--vio); background: rgba(var(--vio-rgb),.06); }

/* Artikel */
.doc section { padding-bottom: 40px; margin-bottom: 40px; border-bottom: 1px solid var(--line); scroll-margin-top: 80px; }
.doc section:last-child { border-bottom: none; }
h1 { font-size: 24px; font-weight: 750; letter-spacing: -0.02em; margin-bottom: 10px; color: var(--txt); }
h2 { font-size: 17px; font-weight: 750; letter-spacing: -0.01em; margin-bottom: 12px; color: var(--txt); }
h3 { font-size: 13.5px; font-weight: 700; margin: 22px 0 8px; color: var(--txt); }
p { margin-bottom: 12px; color: #1e293b; max-width: 680px; }
.note { padding: 12px 14px; background: rgba(var(--vio-rgb),.05); border-left: 3px solid var(--vio); border-radius: 10px; color: #1e293b; }
.http { font-weight: 800; font-size: 11px; color: #047857; margin-left: 8px; padding: 2px 10px; border-radius: 999px; background: rgba(5,150,105,.08); border: 1px solid rgba(5,150,105,.3); }
.kv { display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; margin-top: 16px; padding: 16px 0 0; margin-bottom: 4px; border-top: 1px solid var(--line); }
.kv dt { color: var(--dim); font-weight: 600; }
.kv dd { min-width: 0; overflow-wrap: anywhere; color: #1e293b; }

/* Inline code & endpoint */
code { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 12px; overflow-wrap: anywhere; word-break: break-word; background: rgba(var(--vio-rgb),.05); border: 1px solid rgba(var(--vio-rgb),.14); padding: 1px 6px; border-radius: 6px; color: var(--vio-deep); }
.ep { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 6px 10px; margin: 4px 0 14px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-soft); }
.ep code { background: none; border: none; padding: 0; font-size: 12.5px; color: var(--txt); }
.m { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; font-weight: 800; color: #b45309; background: rgba(217,119,6,.1); border: 1px solid rgba(217,119,6,.3); border-radius: 6px; padding: 1px 8px; min-width: 44px; text-align: center; }
.m.g { color: #047857; background: rgba(5,150,105,.08); border-color: rgba(5,150,105,.3); }

/* Tabel */
table { margin: 14px 0 6px; font-size: 12.5px; border: 1px solid var(--line); border-radius: 10px; width: 100%; border-collapse: separate; border-spacing: 0; table-layout: auto; overflow: hidden; }
thead th { background: var(--bg-soft); color: var(--dim); font-size: 10.5px; padding: 9px 12px; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--line); }
thead th:first-child { border-top-left-radius: 10px; }
thead th:last-child { border-top-right-radius: 10px; }
tbody td { padding: 9px 12px; color: #1e293b; vertical-align: top; overflow-wrap: anywhere; border-top: 1px solid var(--line); }
tbody tr:first-child td { border-top: none; }
tbody tr:last-child td:first-child { border-bottom-left-radius: 10px; }
tbody tr:last-child td:last-child { border-bottom-right-radius: 10px; }
tbody tr { transition: background 0.15s; }
tbody tr:hover { background: rgba(var(--vio-rgb),.03); }

.intro { text-align: center; }
.intro p { margin-left: auto; margin-right: auto; }
.intro .kv { text-align: left; max-width: 520px; margin-left: auto; margin-right: auto; }

@media (max-width: 860px) {
  .ad { grid-template-columns: minmax(0, 1fr); gap: 0; padding: 0 16px 120px; }
  .ad.embedded { padding: 0 0 64px; }
  .toc { position: sticky; top: 54px; z-index: 10; flex-direction: row; gap: 4px; margin: 0 -16px 20px; padding: 0 16px; background: var(--card); border-bottom: 1px solid var(--line); overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .toc::-webkit-scrollbar { display: none; }
  .toc a { flex: none; margin: 0; padding: 11px 8px; border-left: none; border-bottom: 2px solid transparent; }
  .toc a.on { border-bottom-color: var(--vio); }
  .ad.embedded .toc { top: 0; }
  .toc-t { display: none; }
  .doc section { scroll-margin-top: 112px; padding-bottom: 28px; margin-bottom: 28px; }
  h1 { font-size: 20px; }
  .ep code { overflow-wrap: anywhere; }
  table { font-size: 12px; }
  thead th, tbody td { padding: 8px; }
  .kv { grid-template-columns: minmax(0, 1fr); gap: 2px 0; }
  .kv dd { margin-bottom: 10px; }
}
</style>
