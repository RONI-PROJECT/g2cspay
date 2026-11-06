<template>
  <div class="page">
    <div class="glow glow-a" aria-hidden="true"></div>
    <div class="glow glow-b" aria-hidden="true"></div>

    <div class="brand">
      <SiteLogo />
    </div>

    <div class="card">
      <div class="icon-wrap">
        <div class="icon-rings">
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
        </div>
        <div class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
      </div>

      <div class="badge">
        <span class="dot"></span>
        Sedang Pemeliharaan
      </div>

      <h1>Kami sedang melakukan<br />pemeliharaan sistem</h1>

      <p class="msg">
        Untuk memberikan layanan yang lebih baik, kami sedang melakukan
        pembaruan pada sistem. Kami akan kembali secepatnya.
      </p>

      <div class="notice">
        <div class="notice-bar"></div>
        <div class="notice-text">
          <strong>Mohon maaf atas ketidaknyamanan ini</strong>
          <span>Sistem akan kembali normal dalam waktu dekat.</span>
        </div>
      </div>

      <div class="status-list">
        <div class="status-item">
          <div class="status-icon ok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="status-text">
            <div class="status-title">Pembayaran QRIS</div>
            <div class="status-desc">Tetap berjalan normal</div>
          </div>
        </div>
        <div class="status-item">
          <div class="status-icon ok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="status-text">
            <div class="status-title">Notifikasi &amp; Integrasi</div>
            <div class="status-desc">Tetap aktif</div>
          </div>
        </div>
        <div class="status-item">
          <div class="status-icon clock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="status-text">
            <div class="status-title">Dashboard</div>
            <div class="status-desc">Kembali dalam waktu dekat</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="auto-refresh">
          <div class="refresh-dot"></div>
          <span>Auto-refresh tiap {{ refreshIntervalSec }} detik</span>
        </div>
        <div class="last-checked" v-if="lastChecked">
          <span class="muted">Terakhir diperiksa:</span>
          <span class="time">{{ lastChecked }}</span>
        </div>
        <div class="copyright">
          <span class="brand-name">{{ siteName }}</span>
          <span class="sep">·</span>
          <span>{{ year }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { siteName } = useSiteSettings()
const year = new Date().getFullYear()
const refreshIntervalSec = 30
const lastChecked = ref('')

let refreshTimer: any = null

async function checkStatus() {
  try {
    const r: any = await $fetch(`/api/public/settings?_=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' },
    }).catch(() => null)

    lastChecked.value = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    if (r?.data?.maintenance === false) {
      if (refreshTimer) clearInterval(refreshTimer)
      navigateTo('/')
    }
  } catch {
    // silent
  }
}

onMounted(() => {
  setTimeout(() => checkStatus(), 3000)
  refreshTimer = setInterval(checkStatus, refreshIntervalSec * 1000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
* { box-sizing: border-box; }

.page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(700px 400px at 20% 0%, rgba(var(--vio-rgb),0.08), transparent 60%),
    radial-gradient(600px 400px at 90% 100%, rgba(14,165,233,0.06), transparent 60%),
    var(--bg, #ffffff);
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  position: relative;
  overflow: hidden;
}

/* ===== BG GLOW ===== */
.glow {
  position: fixed;
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
  filter: blur(140px);
}
.glow-a {
  width: 600px; height: 600px;
  top: -240px; left: -180px;
  background: radial-gradient(circle, rgba(var(--vio-rgb),0.12), transparent 70%);
}
.glow-b {
  width: 700px; height: 700px;
  bottom: -280px; right: -240px;
  background: radial-gradient(circle, rgba(14,165,233,0.08), transparent 70%);
}

/* ===== BRAND ===== */
.brand {
  position: relative;
  z-index: 1;
  margin-bottom: 32px;
}
.brand :deep(img) {
  height: 36px;
  width: auto;
  display: block;
}

/* ===== CARD ===== */
.card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  padding: 48px 36px 32px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 28px;
  box-shadow:
    0 4px 8px rgba(var(--shadow-rgb),0.04),
    0 40px 90px -30px rgba(var(--shadow-rgb),0.2);
  text-align: center;
  animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== ICON ===== */
.icon-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 28px;
}
.icon-rings { position: absolute; inset: 0; }
.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(var(--vio-rgb),0.3);
  animation: ripple 3s ease-out infinite;
  opacity: 0;
}
.ring-2 { animation-delay: 1s; }
.ring-3 { animation-delay: 2s; }
@keyframes ripple {
  0% { transform: scale(0.7); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: scale(1.3); opacity: 0; }
}
.icon {
  position: absolute;
  inset: 14px;
  border-radius: 50%;
  background: var(--grad, linear-gradient(135deg, var(--vio), #0f766e));
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 36px -10px rgba(var(--vio-rgb),0.6);
}
.icon svg {
  width: 28px;
  height: 28px;
  animation: spinSlow 8s linear infinite;
}
@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== BADGE ===== */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 20px;
}
.badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.85); }
}

/* ===== TEXT ===== */
h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--txt);
  line-height: 1.2;
  margin-bottom: 14px;
}
.msg {
  font-size: 14px;
  color: var(--dim);
  line-height: 1.7;
  max-width: 360px;
  margin: 0 auto 24px;
}

/* ===== NOTICE ===== */
.notice {
  display: flex;
  align-items: stretch;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 12px;
  margin-bottom: 20px;
  text-align: left;
}
.notice-bar {
  width: 3px;
  border-radius: 3px;
  background: var(--grad, linear-gradient(135deg, var(--vio), #0f766e));
  flex-shrink: 0;
}
.notice-text { flex: 1; min-width: 0; }
.notice-text strong {
  display: block;
  font-size: 12.5px;
  font-weight: 750;
  color: var(--txt);
  margin-bottom: 3px;
}
.notice-text span {
  font-size: 11.5px;
  color: var(--dim);
  line-height: 1.5;
}

/* ===== STATUS LIST ===== */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 16px;
  margin-bottom: 20px;
  text-align: left;
}
.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 4px;
}
.status-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.status-icon.ok {
  background: rgba(16, 185, 129, 0.09);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #059669;
}
.status-icon.clock {
  background: rgba(var(--vio-rgb), 0.07);
  border: 1px solid rgba(var(--vio-rgb), 0.18);
  color: var(--vio);
}
.status-icon svg { width: 15px; height: 15px; }
.status-text { flex: 1; min-width: 0; }
.status-title {
  font-size: 13px;
  font-weight: 750;
  color: var(--txt);
  margin-bottom: 1px;
}
.status-desc {
  font-size: 11.5px;
  color: var(--dim);
}

/* ===== FOOTER ===== */
.footer {
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.auto-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: var(--dim);
  margin-bottom: 8px;
}
.refresh-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  animation: pulse 1.6s ease-in-out infinite;
}

.last-checked {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: var(--dim);
  margin-bottom: 10px;
  opacity: 0.75;
}
.last-checked .time {
  font-family: ui-monospace, 'SF Mono', monospace;
  color: var(--dim);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}

.copyright {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: var(--dim);
  opacity: 0.8;
}
.brand-name { font-weight: 750; color: var(--dim); }
.sep { opacity: 0.5; }

/* ===== MOBILE ===== */
@media (max-width: 480px) {
  .page { padding: 16px; }
  .card { padding: 40px 24px 28px; border-radius: 24px; }
  .brand { margin-bottom: 24px; }
  .brand :deep(img) { height: 30px; }
  h1 { font-size: 22px; }
  .msg { font-size: 13.5px; }
  .icon-wrap { width: 88px; height: 88px; }
  .icon svg { width: 24px; height: 24px; }
  .status-list { padding: 14px; }
  .status-icon { width: 30px; height: 30px; }
}

@media (prefers-reduced-motion: reduce) {
  .ring,
  .icon svg,
  .badge .dot,
  .refresh-dot,
  .card {
    animation: none !important;
  }
}
</style>