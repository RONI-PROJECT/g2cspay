<template>
  <div class="legal-page">
    <header class="nav">
      <div class="nav-inner">
        <NuxtLink to="/" class="brand">
          <SiteLogo />
        </NuxtLink>
        <nav class="nav-links">
          <NuxtLink to="/tos">Syarat</NuxtLink>
          <NuxtLink to="/privacy" class="active">Privasi</NuxtLink>
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
        <h1>Kebijakan Privasi</h1>
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
          <h2><span class="h-num">1</span> Pendahuluan</h2>
          <p>Kebijakan Privasi ini menjelaskan bagaimana {{ siteName }} mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan Layanan. Kami berkomitmen menjaga privasi Anda sesuai peraturan perundang-undangan yang berlaku di Indonesia.</p>
        </section>

        <section>
          <h2><span class="h-num">2</span> Data yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan data berikut:</p>
          <ul>
            <li><strong>Identitas:</strong> email, nama lengkap.</li>
            <li><strong>Keamanan:</strong> password (dienkripsi dengan bcrypt), backup code 2FA.</li>
            <li><strong>Transaksi:</strong> jumlah, waktu, status pembayaran, ID transaksi.</li>
            <li><strong>Teknis:</strong> alamat IP, user agent browser, waktu login terakhir.</li>
          </ul>
        </section>

        <section>
          <h2><span class="h-num">3</span> Cara Kami Menggunakan Data</h2>
          <ul>
            <li>Menyediakan dan memelihara Layanan.</li>
            <li>Memproses transaksi dan penarikan dana.</li>
            <li>Mengirim notifikasi terkait akun dan transaksi.</li>
            <li>Mencegah penipuan dan aktivitas ilegal.</li>
            <li>Meningkatkan kualitas layanan.</li>
          </ul>
        </section>

        <section>
          <h2><span class="h-num">4</span> Penyimpanan Data</h2>
          <p>Data disimpan pada server cloud pihak ketiga (Neon PostgreSQL) yang berlokasi di wilayah Amerika Serikat. Kami menggunakan enkripsi SSL untuk melindungi data saat transit. Password Anda di-hash dengan algoritma bcrypt dan tidak dapat dibaca oleh kami.</p>
        </section>

        <section>
          <h2><span class="h-num">5</span> Berbagi Data dengan Pihak Ketiga</h2>
          <p>Kami tidak menjual atau menyewakan data Anda. Kami dapat membagikan data dalam kondisi berikut:</p>
          <ul>
            <li>Kepada penyedia infrastruktur (hosting, database) untuk keperluan operasional.</li>
            <li>Jika diwajibkan oleh hukum atau perintah pengadilan.</li>
            <li>Untuk mencegah penipuan atau melindungi hak dan keamanan pengguna lain.</li>
          </ul>
        </section>

        <section>
          <h2><span class="h-num">6</span> Hak Anda</h2>
          <p>Anda memiliki hak untuk:</p>
          <ul>
            <li>Mengakses data pribadi Anda yang kami simpan.</li>
            <li>Meminta koreksi data yang tidak akurat.</li>
            <li>Meminta penghapusan akun dan data Anda.</li>
            <li>Menarik persetujuan atas pemrosesan data.</li>
          </ul>
          <p>Untuk menggunakan hak-hak tersebut, hubungi kami melalui email yang terdaftar di dashboard.</p>
        </section>

        <section>
          <h2><span class="h-num">7</span> Cookie &amp; Session</h2>
          <p>Kami menggunakan cookie session untuk mengautentikasi login Anda. Cookie ini bersifat <code>httpOnly</code>, artinya tidak dapat diakses oleh JavaScript di browser Anda. Cookie session akan kedaluwarsa setelah 7 hari.</p>
        </section>

        <section>
          <h2><span class="h-num">8</span> Keamanan</h2>
          <p>Kami menerapkan langkah-langkah keamanan teknis seperti enkripsi password, HTTPS, autentikasi 2FA opsional, dan pembatasan akses ke database. Meski demikian, kami tidak dapat menjamin keamanan 100% - Anda tetap bertanggung jawab menjaga kerahasiaan kredensial akun Anda.</p>
        </section>

        <section>
          <h2><span class="h-num">9</span> Perubahan Kebijakan</h2>
          <p>Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Versi terbaru akan selalu dipublikasikan di halaman ini dengan tanggal pembaruan.</p>
        </section>
      </div>

      <div class="footer-links">
        <NuxtLink to="/tos">Syarat &amp; Ketentuan →</NuxtLink>
        <NuxtLink to="/disclaimer">Disclaimer →</NuxtLink>
      </div>
    </main>

    <SiteCopyright />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const { siteName } = useSiteSettings()
useHead({ title: 'Kebijakan Privasi - ' + (siteName.value || 'G2CSPAY') })
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

/* CODE */
.prose code {
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 13px;
  font-family: ui-monospace, monospace;
  color: var(--vio-ink);
  font-weight: 700;
}

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
  .footer-links a { padding: 9px 14px; font-size: 12.5px; }
}
</style>