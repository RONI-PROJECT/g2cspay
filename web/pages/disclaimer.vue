<template>
  <div class="legal-page">
    <header class="nav">
      <div class="nav-inner">
        <NuxtLink to="/" class="brand">
          <SiteLogo />
        </NuxtLink>
        <nav class="nav-links">
          <NuxtLink to="/tos">Syarat</NuxtLink>
          <NuxtLink to="/privacy">Privasi</NuxtLink>
          <NuxtLink to="/disclaimer" class="active">Disclaimer</NuxtLink>
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
        <h1>Disclaimer</h1>
        <p class="updated">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="updated-icon">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Terakhir diperbarui: 2 Oktober 2026
        </p>
      </div>

      <div class="banner">
        <div class="banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div class="banner-title">Bukan Penyelenggara Jasa Pembayaran Resmi</div>
          <p class="banner-desc">{{ siteName }} BUKAN bank, BUKAN penyelenggara jasa pembayaran, dan TIDAK memiliki izin PJP dari Bank Indonesia. Kami hanya perangkat lunak pihak ketiga.</p>
        </div>
      </div>

      <div class="prose">
        <section>
          <h2><span class="h-num">1</span> Sifat Layanan</h2>
          <p>{{ siteName }} adalah alat bantu perangkat lunak yang memfasilitasi pembuatan QRIS dan pemantauan transaksi. Seluruh pemrosesan dana dilakukan oleh GoBiz (PT GoTo Gojek Tokopedia), bukan oleh kami.</p>
        </section>

        <section>
          <h2><span class="h-num">2</span> "As Is" &amp; "As Available"</h2>
          <p>Layanan disediakan "as is" dan "as available" - tanpa jaminan apapun, baik tersurat maupun tersirat. Kami tidak menjamin:</p>
          <ul>
            <li>Layanan bebas dari error atau bug.</li>
            <li>Layanan tersedia 100% tanpa downtime.</li>
            <li>Hasil tertentu dari penggunaan Layanan.</li>
          </ul>
        </section>

        <section>
          <h2><span class="h-num">3</span> Risiko Suspensi GoBiz</h2>
          <p>Layanan ini beroperasi di atas platform GoBiz. Kami <strong>tidak bertanggung jawab</strong> jika akun GoBiz Anda di-suspend, dibekukan, atau dinonaktifkan oleh pihak Gojek/GoTo karena melanggar Syarat &amp; Ketentuan mereka.</p>
          <div class="warn">
            <div class="warn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p>Pengguna menanggung sepenuhnya risiko ini. Dana yang tertahan akibat suspensi GoBiz bukan tanggung jawab {{ siteName }}.</p>
          </div>
        </section>

        <section>
          <h2><span class="h-num">4</span> Kerugian Tidak Langsung</h2>
          <p>Dalam keadaan apapun, {{ siteName }} tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial, termasuk namun tidak terbatas pada kehilangan keuntungan, kehilangan data, atau kerusakan reputasi bisnis.</p>
        </section>

        <section>
          <h2><span class="h-num">5</span> Ketersediaan Data</h2>
          <p>Kami berupaya menjaga ketersediaan data dengan backup berkala, namun tidak menjamin data Anda tidak akan hilang. Kami sangat menyarankan Anda menyimpan catatan transaksi penting secara mandiri.</p>
        </section>

        <section>
          <h2><span class="h-num">6</span> Tautan Eksternal</h2>
          <p>Layanan kami dapat berisi tautan ke situs pihak ketiga (misalnya GoBiz atau bank). Kami tidak bertanggung jawab atas konten, kebijakan privasi, atau praktik situs pihak ketiga tersebut.</p>
        </section>

        <section>
          <h2><span class="h-num">7</span> Perubahan Layanan</h2>
          <p>Kami berhak mengubah, menangguhkan, atau menghentikan sebagian atau seluruh Layanan kapan saja, dengan atau tanpa pemberitahuan sebelumnya.</p>
        </section>

        <section>
          <h2><span class="h-num">8</span> Kontak</h2>
          <p>Untuk pertanyaan mengenai disclaimer ini, silakan hubungi kami melalui email yang terdaftar di dashboard.</p>
        </section>
      </div>

      <div class="footer-links">
        <NuxtLink to="/tos">Syarat &amp; Ketentuan →</NuxtLink>
        <NuxtLink to="/privacy">Kebijakan Privasi →</NuxtLink>
      </div>
    </main>

    <SiteCopyright />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const { siteName } = useSiteSettings()
useHead({ title: 'Disclaimer - ' + (siteName.value || 'G2CSPAY') })
</script>

<style scoped>
* { box-sizing: border-box; }

.legal-page {
  min-height: 100vh;
  background: var(--bg, #ffffff);
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ===== NAVBAR ===== */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(7,13,34,0.85);
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

/* ===== BANNER ===== */
.banner {
  display: flex;
  gap: 14px;
  padding: 18px 20px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-left: 3px solid #d97706;
  border-radius: 14px;
  margin-bottom: 40px;
}
.banner-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.banner-icon svg { width: 18px; height: 18px; }
.banner-title {
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}
.banner-desc {
  font-size: 13.5px;
  color: #fbbf24;
  line-height: 1.6;
  margin: 0;
}

/* ===== PROSE ===== */
.prose section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--line);
}
.prose section:last-child { border-bottom: none; padding-bottom: 0; }

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
  .banner { padding: 14px 16px; }
  .banner-icon { width: 34px; height: 34px; }
  .prose h2 { font-size: 15.5px; gap: 10px; }
  .h-num { width: 26px; height: 26px; font-size: 11px; }
  .prose p, .prose ul li { font-size: 13px; }
  .warn { padding: 12px 14px; }
  .warn p { font-size: 13px !important; }
  .footer-links a { padding: 9px 14px; font-size: 12.5px; }
}
</style>