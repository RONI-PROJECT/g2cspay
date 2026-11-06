<!-- pages/index.vue (landing) -->
<template>
  <div class="landing">
    <header class="nav" :class="{ 'nav-on': isScrolled }">
      <div class="nav-in">
        <nav class="links">
          <a href="#api">API</a>
          <a href="#fitur">Fitur</a>
          <a href="#biaya">Biaya</a>
          <a href="#alur">Alur</a>
          <NuxtLink to="/docs">Docs</NuxtLink>
        </nav>
        <NuxtLink to="/" class="brand"><SiteLogo /></NuxtLink>
        <div class="cta-nav">
          <NuxtLink to="/login" class="btn-soft">Masuk</NuxtLink>
          <NuxtLink to="/register" class="btn-grad">Daftar</NuxtLink>
        </div>
      </div>
    </header>

    <!-- HERO 3D -->
    <section class="hero">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="wrap hero-in">
        <div class="hero-copy">
          <div class="chip"><i class="dot"></i> QRIS aktif, deteksi otomatis</div>
          <h1 class="h1">{{ titleParts[0] }}<span v-if="titleParts[1]" class="mark">{{ titleParts[1] }}</span>{{ titleParts[2] }}</h1>
          <p class="sub">{{ heroLead }}</p>
          <div class="hero-cta">
            <NuxtLink to="/register" class="btn-grad btn-xl">Buat akun sekarang</NuxtLink>
            <a href="#api" class="btn-ghost btn-xl">Lihat contoh API</a>
          </div>
          <dl class="hero-stats">
            <div><dt>{{ feeTransactionPercent }}%</dt><dd>Fee per transaksi</dd></div>
            <div><dt>7 dtk</dt><dd>Interval deteksi</dd></div>
            <div><dt>12x</dt><dd>Retry callback</dd></div>
          </dl>
        </div>

        <div class="vis" aria-hidden="true">
          <div class="v-paid">
            <div class="v-paid-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div><b>Pembayaran diterima</b><span>CSP-10001 &middot; Rp 25.000</span></div>
          </div>

          <div class="v-card">
            <div class="v-top"><i></i><i></i><i></i><span>Dashboard</span></div>
            <div class="v-bal">
              <span>Saldo tersedia</span>
              <b>Rp 4.820.000</b>
              <em>+12,4% minggu ini</em>
            </div>
            <svg class="v-chart" viewBox="0 0 300 96" preserveAspectRatio="xMidYMid meet">
              <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--vio-mid)" stop-opacity=".45"/><stop offset="1" style="stop-color:var(--vio-mid)" stop-opacity="0"/></linearGradient></defs>
              <path d="M0 74 L40 60 L80 66 L120 38 L160 48 L200 22 L240 32 L300 8 L300 96 L0 96Z" fill="url(#vg)"/>
              <path d="M0 74 L40 60 L80 66 L120 38 L160 48 L200 22 L240 32 L300 8" fill="none" style="stroke:var(--vio-2)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
          </div>

          <div class="v-qr">
            <svg viewBox="0 0 25 25" shape-rendering="crispEdges"><path :d="qrPath" fill="currentColor" fill-rule="evenodd"/></svg>
            <span>Scan QRIS</span>
          </div>
        </div>
      </div>
    </section>

    <!-- MARQUEE BANK -->
    <section class="mq" v-if="marquee.length">
      <p class="mq-t">{{ marqueeText }}</p>
      <div class="mq-view">
        <div class="mq-track" :style="{ '--n': marquee.length }">
          <template v-for="r in 2" :key="r">
            <div v-for="b in marquee" :key="r + b.code" class="mq-item" :aria-hidden="r === 2">
              <img v-if="b.logo" class="mq-logo" :src="b.logo" :alt="b.name" decoding="async" height="48" />
              <span v-else class="mq-chip"><img class="mq-badge" :src="b.badge" :alt="b.name" width="40" height="40" decoding="async" /><b>{{ b.name }}</b></span>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- API -->
    <section id="api" class="api">
      <div class="wrap">
        <div class="api-head" v-reveal>
          <div>
            <span class="tag">API</span>
            <h2>Integrasi <em>5 menit</em> beres</h2>
          </div>
          <NuxtLink to="/docs" class="btn-ghost-d">Baca dokumentasi</NuxtLink>
        </div>

        <div class="api-shell" v-reveal>
          <div class="api-tabs">
            <button v-for="t in Object.keys(snippets)" :key="t" class="api-tab" :class="{ active: tab === t }" @click="tab = t">{{ t }}</button>
            <button class="api-copy" @click="copyCode">{{ copied ? 'Tersalin' : 'Salin' }}</button>
          </div>
          <pre class="api-code"><code>{{ snippets[tab] }}</code></pre>
        </div>

        <div class="api-grid">
          <div class="api-item" v-reveal>
            <span class="method post">POST</span><code>/api/v2/charge</code>
            <p>Buat QRIS dinamis dengan nominal bebas.</p>
          </div>
          <div class="api-item" v-reveal>
            <span class="method get">GET</span><code>/api/v1/transaction/{order_id}/status</code>
            <p>Cek status pembayaran real-time.</p>
          </div>
          <div class="api-item" v-reveal>
            <span class="method post">POST</span><code>/api/v1/transaction/{order_id}/cancel</code>
            <p>Batalkan transaksi yang masih pending.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FITUR -->
    <section id="fitur" class="sec">
      <div class="wrap">
        <div class="head" v-reveal>
          <span class="tag">FITUR</span>
          <h2>Bangun sistem bayar <em>tanpa drama</em></h2>
          <p>Satu API, semua kebutuhan payment merchant Indonesia.</p>
        </div>
        <div class="bento">
          <article v-for="f in features" :key="f.t" class="cell" :class="{ 'c-wide': f.wide }" v-reveal>
            <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="f.i"></svg></div>
            <h3>{{ f.t }}</h3>
            <p>{{ f.d }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- BIAYA -->
    <section id="biaya" class="sec sec-alt">
      <div class="wrap">
        <div class="head" v-reveal>
          <span class="tag">BIAYA</span>
          <h2>Tarif jelas, <em>tanpa biaya bulanan</em></h2>
        </div>
        <div class="fees">
          <div class="fee" v-reveal><span>Transaksi QRIS</span><b>{{ feeTransactionPercent }}%</b><p>Dipotong dari nominal yang berhasil dibayar.</p></div>
          <div class="fee" v-reveal><span>Penarikan dana</span><b>{{ wdFeePercent }}% + {{ rp(wdFeeFlat) }}</b><p>Biaya ditampilkan di depan sebelum kamu mengajukan.</p></div>
          <div class="fee" v-reveal><span>Minimal tarik</span><b>{{ rp(wdMin) }}</b><p>Saldo di atas batas ini bisa ditarik kapan saja.</p></div>
        </div>
      </div>
    </section>

    <!-- ALUR -->
    <section id="alur" class="sec">
      <div class="wrap">
        <div class="head" v-reveal>
          <span class="tag">ALUR</span>
          <h2>Empat langkah, langsung jalan</h2>
        </div>
        <div class="flow">
          <div class="fstep" v-reveal v-for="(st, i) in steps" :key="i">
            <span class="fnum">{{ st.n }}</span>
            <h3>{{ st.t }}</h3>
            <p>{{ st.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="sec sec-last">
      <div class="wrap">
        <div class="cta-card" v-reveal>
          <div class="cta-glow" aria-hidden="true"></div>
          <h2>Mulai terima QRIS <em>hari ini</em></h2>
          <p>Gratis, tanpa biaya bulanan. Cukup daftar dan ambil API key.</p>
          <NuxtLink to="/register" class="btn-white-xl">Daftar sekarang, gratis</NuxtLink>
          <span class="cta-foot">Sekitar 30 detik sampai dashboard aktif</span>
        </div>
      </div>
    </section>

    <SiteCopyright />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const config = useRuntimeConfig()

const apiBase = computed(() => {
  const url = config.public.publicUrl || config.public.apiBaseUrl || ''
  if (url) return String(url).replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
})

const { heroTitle, heroLead, marqueeText, marqueeItems, marqueeBanks, bankLogos, feeTransactionPercent, wdFeePercent, wdFeeFlat, wdMin, load: loadSettings } = useSiteSettings()

import { bankBadge } from '~/utils/bankLogo'
const BANK_NAMES: Record<string, string> = {
  BCA: 'BCA', BNI: 'BNI', BRI: 'BRI', MANDIRI: 'Mandiri', CIMB: 'CIMB Niaga', PERMATA: 'Permata', DANAMON: 'Danamon',
  BSI: 'BSI', BTN: 'BTN', OCBC: 'OCBC NISP', MAYBANK: 'Maybank', PANIN: 'Panin', MEGA: 'Mega', BJB: 'BJB', DKI: 'Bank DKI',
  JAGO: 'Jago', SEABANK: 'SeaBank', NEO: 'Neo Commerce', BLU: 'blu', JENIUS: 'Jenius', GOPAY: 'GoPay', OVO: 'OVO',
  DANA: 'DANA', SHOPEEPAY: 'ShopeePay', LINKAJA: 'LinkAja',
}
const marquee = computed(() => {
  let codes = marqueeBanks.value.split(',').map(x => x.trim().toUpperCase()).filter(Boolean)
  if (!codes.length) codes = Object.keys(bankLogos.value)
  if (!codes.length) codes = marqueeItems.value.split(',').map(x => x.trim().toUpperCase().replace(/\s+/g, '')).filter(Boolean)
  return codes.map(c => ({ code: c, name: BANK_NAMES[c] || c, logo: bankLogos.value[c] || '', badge: bankBadge(c) }))
})
const rp = (n: number) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const titleParts = computed(() => {
  const t = heroTitle.value || 'Terima pembayaran QRIS tanpa ribet'
  const i = t.toUpperCase().indexOf('QRIS')
  return i < 0 ? [t, '', ''] : [t.slice(0, i), t.slice(i, i + 4), t.slice(i + 4)]
})

// QR dekoratif (deterministik)
const qrPath = (() => {
  const N = 25; let seed = 20261105
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
  let d = ''
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!inFinder(x, y) && rnd() > 0.52) d += `M${x} ${y}h1v1h-1z`
  }
  for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
    d += `M${fx} ${fy}h7v7h-7z M${fx + 1} ${fy + 1}v5h5v-5z M${fx + 2} ${fy + 2}h3v3h-3z`
  }
  return d
})()


const isScrolled = ref(false)
let scrollHandler: any = null

const tab = ref('cURL')
const copied = ref(false)

const snippets = computed<Record<string, string>>(() => ({
  cURL: `curl -X POST ${apiBase.value}/api/v2/charge \\
  -u rp_live_xxxxxxxx: \\
  -H "Content-Type: application/json" \\
  -d '{
    "payment_type": "qris",
    "transaction_details": {
      "order_id": "ORDER-1001",
      "gross_amount": 25000
    },
    "callback_url": "https://tokoku.id/callback"
  }'`,

  Node: `const res = await fetch("${apiBase.value}/api/v2/charge", {
  method: "POST",
  headers: {
    Authorization: "Basic " + Buffer.from("rp_live_xxxxxxxx:").toString("base64"),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    payment_type: "qris",
    transaction_details: { order_id: "ORDER-1001", gross_amount: 25000 },
  }),
});

const trx = await res.json();
console.log(trx.payment_url);`,

  PHP: `$ch = curl_init("${apiBase.value}/api/v2/charge");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_USERPWD => "rp_live_xxxxxxxx:",
  CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
  CURLOPT_POSTFIELDS => json_encode([
    "payment_type" => "qris",
    "transaction_details" => ["order_id" => "ORDER-1001", "gross_amount" => 25000],
  ]),
]);
$trx = json_decode(curl_exec($ch), true);
echo $trx["payment_url"];`,

  Python: `import requests

r = requests.post(
  "${apiBase.value}/api/v2/charge",
  auth=("rp_live_xxxxxxxx", ""),
  json={
    "payment_type": "qris",
    "transaction_details": {"order_id": "ORDER-1001", "gross_amount": 25000},
  },
)
print(r.json()["payment_url"])`,
}))

const features = [
  { wide: true, t: 'QRIS Dinamis', d: 'Nominal bebas, kode unik per transaksi, terdeteksi otomatis lewat polling. Tidak ada saldo mengambang.', i: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20v.01M20 20h-3v-3"/>' },
  { t: 'Callback Otomatis', d: 'Notifikasi ke server kamu saat lunas, auto-retry sampai 12 kali kalau gagal.', i: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>' },
  { t: 'Dashboard Live', d: 'Transaksi, grafik omzet, dan saldo yang diperbarui real-time.', i: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>' },
  { t: 'Multi API Key', d: 'Isolasi per project. Rotate key tanpa downtime.', i: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2"/>' },
  { wide: true, t: 'Penarikan Dana', d: 'Ajukan withdraw kapan saja. Biaya jelas di depan, status jelas di dashboard.', i: '<path d="M12 3v14M6 11l6 6 6-6"/><path d="M4 21h16"/>' },
]

const steps = [
  { n: '01', t: 'Daftar merchant', d: 'Akun gratis, aktif dalam 30 detik.' },
  { n: '02', t: 'Ambil API key', d: 'Generate langsung dari dashboard.' },
  { n: '03', t: 'Integrasi', d: 'Satu endpoint POST, contoh kode tersedia.' },
  { n: '04', t: 'Terima & tarik', d: 'Dana mengalir sesuai settlement.' },
]

async function copyCode() {
  const text = snippets[tab.value]
  let ok = false
  try { await navigator.clipboard.writeText(text); ok = true } catch {
    const ta = document.createElement('textarea')
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    try { ok = document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
  }
  if (ok) { copied.value = true; setTimeout(() => (copied.value = false), 1500) }
}

const vReveal = {
  mounted(el: HTMLElement) {
    el.classList.add('rv')
    const obs = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) { el.classList.add('rv-in'); obs.unobserve(el) }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
    obs.observe(el)
  },
}

onMounted(() => {
  loadSettings()
  scrollHandler = () => { isScrolled.value = window.scrollY > 20 }
  window.addEventListener('scroll', scrollHandler, { passive: true })
  scrollHandler()
})
onBeforeUnmount(() => {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.landing { position: relative; min-height: 100vh; color: var(--txt); background: var(--card); -webkit-font-smoothing: antialiased; overflow-x: clip; }
.wrap { max-width: 1160px; margin: 0 auto; padding: 0 24px; }

/* NAV — logo di tengah (grid 3 kolom), bening di atas, glass blur tipis saat scroll */
.nav { position: sticky; top: 0; z-index: 100; background: transparent; border-bottom: 1px solid transparent; transition: background .3s ease, border-color .3s, box-shadow .3s; }
.nav-on { background: rgba(7,13,34,.72); backdrop-filter: blur(10px) saturate(150%); -webkit-backdrop-filter: blur(10px) saturate(150%); border-bottom-color: var(--line); box-shadow: 0 6px 24px -16px rgba(var(--shadow-rgb),.35); }
.nav-in { max-width: 1160px; margin: 0 auto; padding: 0 24px; height: 66px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; }
.brand { display: flex; align-items: center; flex-shrink: 0; justify-self: center; }
.brand :deep(img) { height: 32px; width: auto; display: block; }
.links { display: flex; gap: 28px; font-size: 13.5px; font-weight: 600; color: var(--dim); justify-self: start; }
.links a:hover { color: var(--vio); }
.cta-nav { display: flex; gap: 8px; align-items: center; justify-self: end; }
.cta-nav .btn-soft, .cta-nav .btn-grad { box-sizing: border-box; height: 40px; padding: 0 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 13.5px; font-weight: 700; line-height: 1; border-radius: 10px; white-space: nowrap; }
.btn-soft { padding: 9px 16px; font-size: 13px; font-weight: 700; border-radius: 10px; color: var(--txt); border: 1px solid var(--line-2); background: rgba(255,255,255,.03); transition: background .2s, border-color .2s, color .2s; }
.btn-soft:hover { background: rgba(var(--vio-rgb),.14); border-color: var(--vio-mid); color: #fff; }
.btn-grad { display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; font-size: 13px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #1e40af, var(--vio-mid)); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; box-shadow: 0 8px 22px -8px rgba(var(--vio-rgb),.7); transition: transform .2s, box-shadow .2s; }
.btn-grad:hover { color: #fff; transform: translateY(-2px); box-shadow: 0 14px 30px -10px rgba(var(--vio-rgb),.85); }
.btn-ghost { display: inline-flex; align-items: center; padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: 10px; border: 1px solid rgba(255,255,255,.22); color: #fff; transition: background .2s; }
.btn-ghost:hover { background: rgba(255,255,255,.08); color: #fff; }
.btn-ghost-d { display: inline-flex; padding: 10px 18px; font-size: 13px; font-weight: 700; border-radius: 10px; border: 1px solid var(--line-2); color: var(--txt); }
.btn-ghost-d:hover { border-color: var(--vio); }
.btn-xl { padding: 14px 24px; font-size: 14.5px; border-radius: 12px; }

/* HERO */
.hero { position: relative; color: #fff; overflow: hidden; padding: 72px 0 96px; background: linear-gradient(180deg, color-mix(in srgb, var(--vio-deep) 62%, #020617) 0%, #020617 100%); }
.hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(var(--vio-rgb),.12) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--vio-rgb),.12) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 80% 70% at 65% 35%, #000 20%, transparent 78%); -webkit-mask-image: radial-gradient(ellipse 80% 70% at 65% 35%, #000 20%, transparent 78%); }
.hero-glow { position: absolute; width: 760px; height: 760px; right: -200px; top: -260px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(var(--vio-rgb),.34), transparent 68%); }
.hero-in { position: relative; display: grid; grid-template-columns: 1.02fr 1fr; gap: 24px; align-items: center; }
.chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--vio-2); background: rgba(var(--vio-rgb),.16); border: 1px solid rgba(var(--vio-rgb),.38); }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--vio-2); box-shadow: 0 0 0 4px rgba(var(--vio-rgb),.25); animation: pulse 2s infinite; }
@keyframes pulse { 50% { box-shadow: 0 0 0 7px rgba(var(--vio-rgb),0); } }
.h1 { margin-top: 22px; font-size: clamp(36px, 5.2vw, 62px); line-height: 1.04; font-weight: 800; letter-spacing: -0.035em; }
.mark { background: linear-gradient(120deg, var(--vio-2), var(--vio-mid)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.sub { margin-top: 20px; max-width: 490px; font-size: 16.5px; line-height: 1.65; color: #94a3b8; }
.hero-cta { margin-top: 32px; display: flex; gap: 12px; flex-wrap: wrap; }
.hero-stats { margin-top: 44px; display: flex; gap: 36px; }
.hero-stats dt { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
.hero-stats dd { margin-top: 2px; font-size: 12px; color: #94a3b8; }

/* 3D STAGE */
/* Visual hero: 2D, tajam (tanpa rotasi 3D / blur) */
.vis { position: relative; width: 100%; max-width: 480px; height: 400px; margin-left: auto; -webkit-font-smoothing: antialiased; }
.v-card { position: absolute; left: 0; right: 28px; top: 70px; padding: 18px 20px 14px; border-radius: 20px; background: #0a2423; background: color-mix(in srgb, var(--vio-deep) 48%, #06121a); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 30px 60px -28px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.08); }
.v-top { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-size: 11px; color: rgba(255,255,255,.55); }
.v-top i { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.22); }
.v-top span { margin-left: 8px; font-weight: 600; letter-spacing: .02em; }
.v-bal { display: flex; flex-direction: column; gap: 3px; }
.v-bal span { font-size: 12px; color: rgba(255,255,255,.6); }
.v-bal b { font-size: 28px; line-height: 1.1; letter-spacing: -.025em; color: #fff; }
.v-bal em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--vio-2); }
.v-chart { display: block; width: 100%; height: 104px; margin-top: 10px; overflow: visible; }
.v-paid { position: absolute; right: 0; top: 0; z-index: 2; display: flex; align-items: center; gap: 11px; padding: 12px 18px 12px 12px; border-radius: 16px; background: var(--card); color: var(--txt); box-shadow: 0 18px 40px -14px rgba(0,0,0,.55); }
.v-paid b { display: block; font-size: 13px; }
.v-paid span { font-size: 11.5px; color: var(--dim); }
.v-paid-ic { width: 34px; height: 34px; border-radius: 11px; background: var(--vio); color: #fff; display: grid; place-items: center; flex-shrink: 0; }
.v-paid-ic svg { width: 18px; height: 18px; }
.v-qr { position: absolute; right: 0; bottom: 0; width: 138px; padding: 12px 12px 10px; border-radius: 18px; background: #fff; color: var(--vio-deep); text-align: center; box-shadow: 0 18px 40px -14px rgba(0,0,0,.55); }
.v-qr svg { display: block; width: 100%; height: auto; }
.v-qr span { display: block; margin-top: 8px; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--dim); }

/* MARQUEE */
.mq { padding: 48px 0 44px; border-bottom: 1px solid var(--line); background: var(--card); }
.mq-t { text-align: center; font-size: 13px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--dim); margin-bottom: 28px; }
.mq-view { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.mq-track { display: flex; width: max-content; align-items: center; animation: mq calc(var(--n) * 3.8s) linear infinite; }
.mq-view:hover .mq-track { animation-play-state: paused; }
.mq-item { height: 76px; min-width: 150px; margin: 0 22px; display: flex; align-items: center; justify-content: center; }
.mq-logo { height: 48px; width: auto; max-width: 200px; object-fit: contain; object-position: center; border-radius: var(--bank-r); filter: var(--bank-filter); opacity: .95; transition: opacity .2s, transform .2s; }
.mq-item:hover .mq-logo { opacity: 1; transform: translateY(-2px); }
.mq-chip { display: inline-flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 20px 10px 12px; background: var(--card); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.05); transition: transform .2s, box-shadow .2s, border-color .2s; }
.mq-chip:hover { transform: translateY(-2px); border-color: var(--vio); box-shadow: 0 8px 20px rgba(var(--shadow-rgb),.10); }
.mq-badge { width: 40px; height: 40px; border-radius: var(--bank-r); flex: none; filter: var(--bank-filter); }
.mq-chip b { font-size: 17px; font-weight: 800; letter-spacing: -.01em; color: var(--txt); white-space: nowrap; }
@keyframes mq { to { transform: translateX(-50%); } }

/* SECTIONS */
.sec { padding: 96px 0; }
.sec-alt { background: var(--bg-soft); border-block: 1px solid var(--line); }
.sec-last { padding-bottom: 72px; }
.head { text-align: center; max-width: 620px; margin: 0 auto 52px; }
.tag { display: inline-block; font-size: 11.5px; font-weight: 800; letter-spacing: .14em; color: var(--vio); }
.head h2, .api-head h2 { margin-top: 10px; font-size: clamp(28px, 3.6vw, 40px); line-height: 1.12; font-weight: 800; letter-spacing: -0.03em; }
.head p { margin-top: 12px; color: var(--dim); font-size: 15.5px; }
em { font-style: normal; background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* API */
.api { padding: 88px 0; background: var(--card); }
.api-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
.api-shell { border-radius: 18px; overflow: hidden; background: var(--card); border: 1px solid var(--line); box-shadow: 0 30px 70px -24px rgba(var(--shadow-rgb),.5); }
.api-tabs { display: flex; align-items: center; gap: 4px; padding: 10px 12px; border-bottom: 1px solid var(--line); overflow-x: auto; scrollbar-width: none; }
.api-tabs::-webkit-scrollbar { display: none; }
.api-tab { flex: none; }
.api-tab { padding: 7px 14px; font-size: 12.5px; font-weight: 700; color: #94a3b8; border-radius: 8px; transition: all .15s; }
.api-tab:hover { color: #fff; }
.api-tab.active { background: rgba(var(--vio-rgb),.28); color: #fff; }
.api-copy { flex: none; position: sticky; right: 0; background: var(--card); margin-left: auto; padding: 7px 14px; font-size: 12px; font-weight: 700; color: var(--vio-ink); border: 1px solid rgba(var(--vio-rgb),.3); border-radius: 8px; }
.api-copy:hover { background: rgba(var(--vio-rgb),.16); }
.api-code { padding: 22px 24px; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 13px; line-height: 1.7; color: #e2e8f0; }
.api-grid { margin-top: 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.api-item { padding: 18px 20px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); transition: border-color .2s, transform .2s; }
.api-item:hover { border-color: var(--vio-2); transform: translateY(-3px); }
.method { font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 6px; margin-right: 8px; }
.method.post { background: rgba(var(--vio-rgb),.1); color: var(--vio); }
.method.get { background: rgba(13,148,136,.1); color: var(--ok); }
.api-item { min-width: 0; }
.api-item code { font-size: 12.5px; font-weight: 600; overflow-wrap: anywhere; word-break: break-word; }
.api-item p { margin-top: 10px; font-size: 13px; color: var(--dim); }

/* BENTO */
.bento { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.cell { padding: 28px; border: 1px solid var(--line); border-radius: 20px; background: var(--card); transition: transform .25s, box-shadow .25s, border-color .25s; }
.cell:hover { transform: translateY(-4px); border-color: var(--vio-2); box-shadow: var(--shadow-md); }
.c-wide { grid-column: span 2; }
.ic { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--grad); color: #fff; box-shadow: 0 10px 22px -10px rgba(var(--vio-rgb),.7); }
.ic svg { width: 22px; height: 22px; }
.cell h3 { margin-top: 18px; font-size: 18px; font-weight: 800; letter-spacing: -0.01em; }
.cell p { margin-top: 8px; font-size: 14px; line-height: 1.65; color: var(--dim); }

/* BIAYA */
.fees { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.fee { padding: 28px; border-radius: 20px; background: var(--card); border: 1px solid var(--line); }
.fee span { font-size: 12.5px; font-weight: 700; color: var(--dim); }
.fee b { display: block; margin: 10px 0 8px; font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
.fee p { font-size: 13px; color: var(--dim); line-height: 1.6; }

/* ALUR */
.flow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; position: relative; }
.fstep { padding: 24px; border-radius: 18px; border: 1px solid var(--line); background: var(--card); }
.fnum { font-size: 13px; font-weight: 800; color: var(--vio); letter-spacing: .06em; }
.fstep h3 { margin-top: 12px; font-size: 16px; font-weight: 800; }
.fstep p { margin-top: 6px; font-size: 13.5px; color: var(--dim); line-height: 1.6; }

/* CTA */
.cta-card { position: relative; overflow: hidden; text-align: center; padding: 72px 24px; border-radius: 28px; color: #fff; background: #070d1f; }
.cta-glow { position: absolute; inset: auto -10% -60% -10%; height: 90%; background: radial-gradient(ellipse at center, rgba(var(--vio-rgb),.65), transparent 70%); }
.cta-card > * { position: relative; }
.cta-card h2 { font-size: clamp(28px, 4vw, 42px); font-weight: 800; letter-spacing: -0.03em; }
.cta-card p { margin: 12px 0 28px; color: #94a3b8; }
.btn-white-xl { display: inline-block; padding: 14px 28px; border-radius: 12px; background: var(--card); color: var(--txt); font-weight: 800; font-size: 14.5px; transition: transform .2s; }
.btn-white-xl:hover { transform: translateY(-2px); color: var(--vio); }
.cta-foot { display: block; margin-top: 16px; font-size: 12px; color: #94a3b8; }

/* REVEAL */
.rv { opacity: 0; transform: translateY(22px); transition: opacity .6s ease, transform .6s cubic-bezier(.2,.8,.2,1); }
.rv-in { opacity: 1; transform: none; }

@media (max-width: 960px) {
  .api-grid { grid-template-columns: 1fr; }
  .api-code { padding: 16px; font-size: 12px; }
  .links { display: none; }
  .nav-in { grid-template-columns: 1fr auto 1fr; padding: 0 14px; gap: 8px; height: 60px; }
  .brand { grid-column: 2; }
  .cta-nav { grid-column: 3; gap: 6px; }
  .cta-nav .btn-soft, .cta-nav .btn-grad { height: 36px; padding: 0 13px; font-size: 12.5px; border-radius: 9px; }
  .hero { padding: 48px 0 64px; }
  .hero-in { grid-template-columns: 1fr; }
  .vis { height: auto; max-width: 440px; margin: 28px auto 0; display: grid; gap: 12px; }
  .v-card, .v-paid { position: static; }
  .v-paid { order: 0; }
  .v-qr { display: none; }
  .bento, .fees, .api-grid { grid-template-columns: 1fr; }
  .c-wide { grid-column: auto; }
  .flow { grid-template-columns: 1fr 1fr; }
  .hero-stats { gap: 22px; }
}
@media (max-width: 960px) {
  .mq { padding: 42px 0 38px; }
  .mq-item { height: 64px; min-width: 130px; margin: 0 16px; }
  .mq-logo { height: 40px; max-width: 160px; }
}
@media (max-width: 480px) {
  .flow { grid-template-columns: 1fr; }
  .v-bal b { font-size: 24px; }
  .v-chart { height: 88px; }
  .mq { padding: 36px 0 32px; }
  .mq-t { margin-bottom: 22px; font-size: 12.5px; }
  .mq-item { height: 54px; min-width: 110px; margin: 0 12px; }
  .mq-logo { height: 34px; max-width: 135px; }
  .mq-chip { gap: 9px; padding: 8px 14px 8px 9px; border-radius: 14px; }
  .mq-badge { width: 32px; height: 32px; }
  .mq-chip b { font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .mq-track, .dot { animation: none !important; }
  .rv { opacity: 1; transform: none; transition: none; }
}
</style>
