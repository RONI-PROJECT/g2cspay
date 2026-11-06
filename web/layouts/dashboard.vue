<template>
  <div class="layout" :class="{ 'sidebar-open': sidebarOpen }">
    <div class="overlay" @click="sidebarOpen = false"></div>

    <aside class="sidebar">
      <div class="sidebar-head">
        <NuxtLink to="/merchant" class="sidebar-brand">
          <SiteLogo />
        </NuxtLink>
        <div class="sidebar-badge">Portal Merchant</div>
        <button class="sidebar-close" @click="sidebarOpen = false" aria-label="Tutup menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <div class="nav-group-label">Utama</div>

          <NuxtLink to="/merchant" class="nav-item" :class="{ active: $route.path === '/merchant' }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            <span>Dashboard</span>
          </NuxtLink>

          <NuxtLink to="/merchant/qris" class="nav-item" :class="{ active: $route.path.startsWith('/merchant/qris') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round"/>
            </svg>
            <span>Buat QRIS</span>
          </NuxtLink>

          <NuxtLink to="/merchant/transaction" class="nav-item" :class="{ active: $route.path.startsWith('/merchant/transaction') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Transaksi</span>
          </NuxtLink>
        </div>

        <div class="nav-group">
          <div class="nav-group-label">Keuangan</div>

          <NuxtLink to="/merchant/withdrawals" class="nav-item" :class="{ active: $route.path.startsWith('/merchant/withdrawals') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke-linecap="round"/>
            </svg>
            <span>Tarik Dana</span>
          </NuxtLink>
        </div>

        <div class="nav-group">
          <div class="nav-group-label">Developer</div>

          <NuxtLink to="/merchant/webhook" class="nav-item" :class="{ active: $route.path.startsWith('/merchant/webhook') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/>
              <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/>
              <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>
            </svg>
            <span>Webhook</span>
          </NuxtLink>

          <NuxtLink to="/merchant/api-key" class="nav-item" :class="{ active: $route.path.startsWith('/merchant/api-key') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke-linecap="round"/>
            </svg>
            <span>Kredensial</span>
          </NuxtLink>

          <NuxtLink to="/merchant/sandbox" class="nav-item" :class="{ active: $route.path.startsWith('/merchant/sandbox') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M10 2v7.31"/>
              <path d="M14 9.3V1.99"/>
              <path d="M8.5 2h7"/>
              <path d="M14 9.3a6.5 6.5 0 1 1-4 0"/>
              <path d="M5.52 16h12.96"/>
            </svg>
            <span>Sandbox</span>
          </NuxtLink>
        </div>

        <div class="nav-group">
          <div class="nav-group-label">Lainnya</div>

          <NuxtLink to="/merchant/settings" class="nav-item" :class="{ active: $route.path.startsWith('/merchant/settings') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profile</span>
          </NuxtLink>

          <NuxtLink to="/merchant/docs" class="nav-item" :class="{ active: $route.path.startsWith('/merchant/docs') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>Dokumentasi</span>
          </NuxtLink>
        </div>

        <div class="nav-group nav-group-exit">
          <button type="button" class="nav-item nav-exit" @click="doLogout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </nav>
    </aside>

    <div class="main">
      <header class="header">
        <button class="hamburger" @click="sidebarOpen = !sidebarOpen" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6" stroke-linecap="round"/>
            <line x1="3" y1="12" x2="21" y2="12" stroke-linecap="round"/>
            <line x1="3" y1="18" x2="21" y2="18" stroke-linecap="round"/>
          </svg>
        </button>

        <h1 class="header-title">{{ pageTitle }}</h1>

        <div class="header-actions">
          <HeaderClock />
          <NotificationBell />
          <ProfileChip to="/merchant/settings" />
          <button class="icon-btn" @click="doLogout" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="content">
        <slot />
      </main>
    </div>
  </div>

  <TwoFactorWidget />
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)

const route = useRoute()
watch(() => route.path, () => { sidebarOpen.value = false })

// lock body scroll saat sidebar buka (mobile)
watch(sidebarOpen, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})

const pageTitle = computed(() => {
  const p = route.path
  if (p === '/merchant') return 'Dashboard'
  if (p.startsWith('/merchant/qris')) return 'Buat QRIS'
  if (p.startsWith('/merchant/transaction')) return 'Transaksi'
  if (p.startsWith('/merchant/withdrawals')) return 'Tarik Dana'
  if (p.startsWith('/merchant/webhook')) return 'Webhook'
  if (p.startsWith('/merchant/api-key')) return 'Kredensial'
  if (p.startsWith('/merchant/sandbox')) return 'Sandbox'
  if (p.startsWith('/merchant/settings')) return 'Profile'
  if (p.startsWith('/merchant/docs')) return 'Dokumentasi'
  return 'Dashboard'
})

async function doLogout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
  } catch {}
  navigateTo('/login')
}
</script>

<style scoped>
* { box-sizing: border-box; }

.layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--txt);
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
}

.overlay {
  display: none;
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(15,23,42,0.45);
  z-index: 40;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.28s ease;
}

/* ===== SIDEBAR ===== */
.sidebar {
  width: 252px;
  flex-shrink: 0;
  background: var(--bg-soft);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  z-index: 50;
}

.sidebar-head {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  position: relative;
  min-height: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: var(--card);
}
.sidebar-brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  line-height: 0;
  transition: opacity 0.15s;
  max-width: 100%;
}
.sidebar-brand:hover { opacity: 0.85; }
.sidebar-brand :deep(img) {
  height: 36px;
  max-width: 180px;
  width: auto;
  object-fit: contain;
  display: block;
}
.sidebar-badge {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--vio);
  padding: 4px 10px;
  background: rgba(var(--vio-rgb),0.06);
  border: 1px solid rgba(var(--vio-rgb),0.18);
  border-radius: 999px;
  white-space: nowrap;
}

.sidebar-close {
  display: none;
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px; height: 32px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.sidebar-close:hover {
  border-color: var(--vio-2);
  color: var(--vio);
}
.sidebar-close svg { width: 15px; height: 15px; }

.sidebar-nav {
  flex: 1;
  padding: 12px 12px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--line-2) transparent;
}
.sidebar-nav::-webkit-scrollbar { width: 6px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: var(--line-2); border-radius: 3px; }

.nav-group { display: flex; flex-direction: column; gap: 2px; }
.nav-group-exit {
  margin-top: auto;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
.nav-exit { width: 100%; color: var(--err); }
.nav-exit:hover { background: rgba(225,29,72,0.06); color: var(--err); border-color: rgba(225,29,72,0.22); }
.nav-exit svg { color: var(--err); }
.nav-group-label {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--dim);
  opacity: 0.7;
  padding: 12px 12px 6px;
}

.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--dim);
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  position: relative;
  border: 1px solid transparent;
  -webkit-tap-highlight-color: transparent;
}
.nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
.nav-item:hover { background: var(--card); color: var(--txt); border-color: var(--line); }
.nav-item.active {
  background: var(--card);
  color: var(--vio);
  border-color: rgba(var(--vio-rgb),0.22);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 18px;
  background: var(--grad);
  border-radius: 0 3px 3px 0;
}

/* ===== MAIN ===== */
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

.header {
  height: 64px;
  display: flex; align-items: center; gap: 14px;
  padding: 0 20px;
  border-bottom: 1px solid var(--line);
  background: rgba(255,255,255,0.86);
  -webkit-backdrop-filter: saturate(160%) blur(10px);
  backdrop-filter: saturate(160%) blur(10px);
  position: sticky; top: 0;
  z-index: 30;
}
.hamburger {
  display: none;
  width: 38px; height: 38px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--txt);
  align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}
.hamburger:hover { border-color: var(--vio-2); color: var(--vio); }
.hamburger:active { background: var(--bg-soft); }
.hamburger svg { width: 18px; height: 18px; }
.header-title {
  flex: 1;
  font-size: 16px; font-weight: 700;
  color: var(--txt);
  letter-spacing: -0.01em;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; min-width: 0; }
.icon-btn {
  width: 38px; height: 38px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.icon-btn:hover {
  border-color: var(--vio-2);
  color: var(--vio);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.icon-btn svg { width: 16px; height: 16px; }

.content {
  flex: 1;
  padding: 28px 28px 120px;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  min-width: 0;
  overflow-x: clip;
  box-sizing: border-box;
}

/* ===== MOBILE ===== */
@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0; top: 0; bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
    background: var(--bg-soft);
    width: 280px;
  }
  .layout.sidebar-open .sidebar { transform: translateX(0); }
  .layout.sidebar-open .overlay { opacity: 1; pointer-events: auto; display: block; }
  .overlay { display: block; }
  .hamburger { display: flex; }
  .sidebar-close { display: flex; }

  .content { padding: 18px 14px 100px; }
  .header { padding: 0 14px; gap: 10px; }
}

@media (max-width: 480px) {
  .content { padding: 14px 12px 90px; }
  .header { height: 58px; padding: 0 12px; gap: 8px; }
  .header-title { font-size: 15px; }
  .header-actions { gap: 6px; }
  .icon-btn, .hamburger { width: 36px; height: 36px; }
  .sidebar { width: 260px; }
}
</style>
