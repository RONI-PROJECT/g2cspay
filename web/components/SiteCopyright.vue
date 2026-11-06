<template>
  <div class="copyright-wrap">
    <div class="copyright-inner">
      <div class="copy-row">
        <div class="copy-left">
          <div class="copy-brand">
            <img v-if="logoUrl" :src="logoUrl" :alt="siteName" />
            <span v-else class="brand-text">{{ siteName }}</span>
          </div>
          <p class="copy-desc">{{ settings.footer_text }}</p>
        </div>

        <div class="copy-badges">
          <div class="badge-item">
            <div class="badge-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div class="badge-title">SSL Encrypted</div>
              <div class="badge-desc">Koneksi aman 256-bit</div>
            </div>
          </div>

          <div class="badge-item">
            <div class="badge-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <div class="badge-title">Auto Matching</div>
              <div class="badge-desc">Pembayaran terdeteksi otomatis</div>
            </div>
          </div>

          <div class="badge-item">
            <div class="badge-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div class="badge-title">Real-time Webhook</div>
              <div class="badge-desc">Notifikasi instan ke server</div>
            </div>
          </div>
        </div>
      </div>

      <div class="copy-bottom">
        <div class="copy-legal">
          <NuxtLink to="/tos">Syarat &amp; Ketentuan</NuxtLink>
          <span class="dot">·</span>
          <NuxtLink to="/privacy">Kebijakan Privasi</NuxtLink>
          <span class="dot">·</span>
          <NuxtLink to="/disclaimer">Disclaimer</NuxtLink>
        </div>
        <div class="copy-text">
          © {{ year }} {{ siteName }}. Seluruh hak cipta dilindungi undang-undang.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
const { settings, logoUrl, siteName } = useSiteSettings()
</script>

<style scoped>
.copyright-wrap {
  border-top: 1px solid var(--line);
  background: var(--bg-soft);
  padding: 56px 0 32px;
}
.copyright-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

.copy-row {
  display: grid;
  grid-template-columns: 1.4fr 2fr;
  gap: 48px;
  margin-bottom: 40px;
}
@media (max-width: 900px) { .copy-row { grid-template-columns: 1fr; gap: 32px; } }

.copy-brand { margin-bottom: 16px; }
.copy-brand img { height: 34px; width: auto; }
.brand-text {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--txt);
}
.copy-desc { font-size: 13px; color: var(--dim); line-height: 1.7; max-width: 340px; }

.copy-badges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 640px) { .copy-badges { grid-template-columns: 1fr; } }

.badge-item {
  display: flex; gap: 12px; align-items: center;
  padding: 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  transition: all .2s;
}
.badge-item:hover { border-color: var(--line-2); box-shadow: var(--shadow-md); }

.badge-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.badge-icon svg { width: 16px; height: 16px; }

.badge-title { font-size: 12.5px; font-weight: 700; color: var(--txt); margin-bottom: 2px; }
.badge-desc { font-size: 11px; color: var(--dim); }

.copy-bottom {
  display: flex; justify-content: space-between; align-items: center;
  gap: 20px; padding-top: 28px;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
}
.copy-legal { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.copy-legal a { font-size: 12.5px; color: var(--dim); text-decoration: none; transition: color .15s; }
.copy-legal a:hover { color: var(--vio); }
.copy-legal .dot { color: var(--line-2); font-size: 12px; }
.copy-text { font-size: 12px; color: var(--dim); letter-spacing: 0.01em; }

@media (max-width: 640px) {
  .copyright-wrap { padding: 40px 0 24px; }
  .copy-bottom { flex-direction: column; text-align: center; }
  .copy-legal { justify-content: center; }
}
</style>