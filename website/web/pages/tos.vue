<template>
  <div class="legal-page">
    <header class="nav">
      <div class="nav-inner">
        <NuxtLink to="/" class="brand">
          <SiteLogo />
        </NuxtLink>
        <nav class="nav-links">
          <NuxtLink to="/tos" class="active">Syarat</NuxtLink>
          <NuxtLink to="/privacy">Privasi</NuxtLink>
          <NuxtLink to="/disclaimer">Disclaimer</NuxtLink>
        </nav>
        <div class="nav-actions">
          <NuxtLink to="/login" class="btn-ghost">Masuk</NuxtLink>
          <NuxtLink to="/register" class="btn-grad">Daftar</NuxtLink>
        </div>
      </div>
    </header>

    <main class="content">
      <div class="doc-head">
        <div class="eyebrow">
          <span class="eyebrow-dot"></span>
          Legal
        </div>
        <h1>Syarat &amp; Ketentuan</h1>
        <p class="updated">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="updated-icon">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Terakhir diperbarui: 2 Oktober 2026
        </p>
      </div>

      <div class="prose">
        <section>
          <h2><span class="h-num">1</span> Penerimaan Ketentuan</h2>
          <p>Dengan mengakses atau menggunakan layanan {{ siteName }} ("Layanan"), Anda ("Pengguna") menyatakan telah membaca, memahami, dan menyetujui seluruh Syarat &amp; Ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan Layanan.</p>
        </section>

        <section>
          <h2><span class="h-num">2</span> Deskripsi Layanan</h2>
          <p>{{ siteName }} adalah layanan perangkat lunak pihak ketiga yang membantu merchant membuat QRIS dinamis, memantau transaksi masuk, dan menerima notifikasi pembayaran. Layanan beroperasi di atas platform GoBiz (PT GoTo Gojek Tokopedia).</p>
          <div class="warn">
            <div class="warn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p><strong>Penting:</strong> {{ siteName }} bukan penyelenggara jasa pembayaran resmi dan tidak memiliki izin PJP (Penyelenggara Jasa Pembayaran) dari Bank Indonesia. Dana pembayaran diproses oleh GoBiz, bukan oleh kami.</p>
          </div>
        </section>

        <section>
          <h2><span class="h-num">3</span> Akun Pengguna</h2>
          <ul>
            <li>Anda wajib memberikan informasi yang akurat saat mendaftar.</li>
            <li>Anda bertanggung jawab menjaga kerahasiaan password dan API key.</li>
            <li>Satu akun tidak boleh digunakan untuk aktivitas ilegal atau penipuan.</li>
            <li>Kami berhak menonaktifkan akun jika ditemukan pelanggaran.</li>
          </ul>
        </section>

        <section>
          <h2><span class="h-num">4</span> Biaya Layanan</h2>
          <p>{{ siteName }} dapat mengenakan biaya layanan berupa persentase dari transaksi atau biaya tetap. Besaran biaya ditampilkan secara transparan di dashboard dan dapat berubah dengan pemberitahuan sebelumnya.</p>
        </section>

        <section>
          <h2><span class="h-num">5</span> Penarikan Dana</h2>
          <ul>
            <li>Penarikan minimum Rp {{ wdMin.toLocaleString('id-ID') }} per transaksi.</li>
            <li>Penarikan diproses maksimal 24 jam kerja setelah disetujui admin.</li>
            <li>Kami tidak bertanggung jawab atas keterlambatan yang disebabkan oleh bank tujuan.</li>
          </ul>
        </section>

        <section>
          <h2><span class="h-num">6</span> Batasan Tanggung Jawab</h2>
          <p>Kami tidak bertanggung jawab atas:</p>
          <ul>
            <li>Suspensi atau pembekuan akun GoBiz oleh pihak Gojek/GoTo.</li>
            <li>Kerugian akibat downtime, error server, atau gangguan jaringan.</li>
            <li>Sengketa antara merchant dan pembeli.</li>
            <li>Kehilangan data akibat force majeure atau serangan siber.</li>
          </ul>
        </section>

        <section>
          <h2><span class="h-num">7</span> Penghentian Layanan</h2>
          <p>Kami dapat menghentikan atau menangguhkan akses Anda ke Layanan kapan saja jika ditemukan pelanggaran terhadap Syarat &amp; Ketentuan ini, tanpa pemberitahuan sebelumnya.</p>
        </section>

        <section>
          <h2><span class="h-num">8</span> Perubahan Ketentuan</h2>
          <p>Kami dapat mengubah Syarat &amp; Ketentuan ini dari waktu ke waktu. Perubahan akan diumumkan melalui dashboard atau email. Penggunaan Layanan setelah perubahan berarti Anda menyetujui ketentuan yang baru.</p>
        </section>

        <section>
          <h2><span class="h-num">9</span> Hukum yang Berlaku</h2>
          <p>Syarat &amp; Ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa yang timbul akan diselesaikan secara musyawarah terlebih dahulu.</p>
        </section>
      </div>

      <div class="footer-links">
        <NuxtLink to="/privacy">Kebijakan Privasi →</NuxtLink>
        <NuxtLink to="/disclaimer">Disclaimer →</NuxtLink>
      </div>
    </main>

    <SiteCopyright />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const { siteName, wdMin } = useSiteSettings()
useHead({ title: 'Syarat & Ketentuan - ' + (siteName.value || 'G2CSPAY') })
</script>

<style scoped>
* { box-sizing: border-box; }

.legal-page {
  min-height: 100vh;
  background: var(--bg, #ffffff);
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ===== NAVBAR ===== */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line);
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.brand { display: flex; }
.brand :deep(img) {
  height: 30px;
  width: auto;
  display: block;
}

.nav-links {
  display: flex;
  gap: 20px;
  flex: 1;
  justify-content: center;
}
.nav-links a {
  font-size: 13px;
  font-weight: 600;
  color: var(--dim);
  text-decoration: none;
  transition: color 0.15s;
  padding: 6px 0;
  position: relative;
  white-space: nowrap;
}
.nav-links a:hover { color: var(--txt); }
.nav-links a.active { color: var(--vio); }
.nav-links a.active::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: var(--grad, var(--vio));
  border-radius: 2px;
}

.nav-actions { display: flex; gap: 8px; align-items: center; }
.btn-ghost {
  padding: 8px 14px;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--txt);
  text-decoration: none;
  border: 1px solid var(--line);
  background: var(--card);
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-ghost:hover { border-color: var(--line-2); color: var(--vio); }
.btn-grad {
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: 750;
  background: var(--grad, var(--vio));
  color: #ffffff;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 6px 20px -6px rgba(var(--vio-rgb),0.5);
}
.btn-grad:hover { transform: translateY(-1px); box-shadow: 0 12px 28px -8px rgba(var(--vio-rgb),0.6); }

/* ===== CONTENT ===== */
.content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 40px;
}

/* ===== DOC HEAD ===== */
.doc-head { margin-bottom: 32px; }
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--vio);
  margin-bottom: 12px;
  padding: 6px 12px;
  background: rgba(var(--vio-rgb),0.06);
  border: 1px solid rgba(var(--vio-rgb),0.18);
  border-radius: 999px;
}
.eyebrow-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--vio);
  box-shadow: 0 0 0 3px rgba(var(--vio-rgb),0.15);
}
.doc-head h1 {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--txt);
  margin-bottom: 12px;
  line-height: 1.15;
}
.updated {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--dim);
}
.updated-icon { width: 13px; height: 13px; flex-shrink: 0; }

/* ===== PROSE ===== */
.prose section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--line);
}
.prose section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.prose h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 750;
  color: var(--txt);
  margin-bottom: 14px;
  letter-spacing: -0.01em;
}
.h-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border-radius: 9px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  font-size: 12px;
  font-weight: 700;
  font-family: ui-monospace, monospace;
  flex-shrink: 0;
}

.prose p {
  font-size: 14.5px;
  color: var(--dim);
  line-height: 1.75;
  margin-bottom: 12px;
}
.prose ul {
  list-style: none;
  padding: 0;
  margin: 12px 0;
}
.prose ul li {
  position: relative;
  padding-left: 22px;
  font-size: 14.5px;
  color: var(--dim);
  line-height: 1.75;
  margin-bottom: 8px;
}
.prose ul li::before {
  content: '';
  position: absolute;
  left: 4px; top: 11px;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--vio);
  opacity: 0.55;
}
.prose strong { color: var(--txt); font-weight: 700; }

/* ===== WARN BOX ===== */
.warn {
  display: flex;
  gap: 12px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-left: 3px solid #d97706;
  padding: 14px 16px;
  border-radius: 12px;
  margin-top: 14px;
}
.warn-icon {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #d97706;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.warn-icon svg { width: 13px; height: 13px; }
.warn p {
  margin: 0 !important;
  font-size: 13.5px !important;
  color: #fbbf24 !important;
  line-height: 1.65 !important;
}
.warn strong { color: #fbbf24 !important; }

/* ===== FOOTER LINKS ===== */
.footer-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
}
.footer-links a {
  padding: 10px 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 11px;
  font-size: 13px;
  font-weight: 650;
  color: var(--txt);
  text-decoration: none;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),0.04);
}
.footer-links a:hover {
  border-color: rgba(var(--vio-rgb),0.3);
  color: var(--vio);
}

/* ===== MOBILE ===== */
@media (max-width: 900px) {
  .nav-inner { padding: 12px 16px; gap: 10px; }
  .nav-links { gap: 14px; }
  .nav-links a { font-size: 12px; }
}

@media (max-width: 640px) {
  .nav-inner { padding: 10px 14px; }
  .nav-links { display: none; }
  .nav-actions .btn-ghost { display: none; }
  .content { padding: 32px 16px 32px; }
  .doc-head h1 { font-size: 19px; }
  .eyebrow { font-size: 9.5px; padding: 5px 10px; }
  .prose h2 { font-size: 15.5px; gap: 10px; }
  .h-num { width: 26px; height: 26px; font-size: 11px; }
  .prose p, .prose ul li { font-size: 13px; }
  .warn { padding: 12px 14px; }
  .warn p { font-size: 13px !important; }
  .footer-links a { padding: 9px 14px; font-size: 12.5px; }
}
</style>