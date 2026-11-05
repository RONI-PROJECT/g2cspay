<template>
  <div class="layout" :class="{ 'sidebar-open': sidebarOpen }">
    <div class="overlay" @click="sidebarOpen = false"></div>

    <aside class="sidebar">
      <div class="sidebar-head">
        <NuxtLink to="/panel" class="sidebar-brand">
          <SiteLogo />
          <span class="badge-admin">Panel</span>
        </NuxtLink>
        <button class="sidebar-close" @click="sidebarOpen = false" aria-label="Tutup menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <div class="nav-group-label">Overview</div>
          <NuxtLink to="/panel" class="nav-item" :class="{ active: $route.path === '/panel' }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            <span>Dashboard</span>
          </NuxtLink>
        </div>

        <div class="nav-group">
          <div class="nav-group-label">Operasional</div>
          <NuxtLink to="/panel/withdrawals" class="nav-item" :class="{ active: $route.path.startsWith('/panel/withdrawals') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke-linecap="round"/>
            </svg>
            <span>Tarik Dana</span>
            <span v-if="pendingWd > 0" class="nav-badge">{{ pendingWd }}</span>
          </NuxtLink>

          <NuxtLink to="/panel/transactions" class="nav-item" :class="{ active: $route.path.startsWith('/panel/transactions') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Transaksi</span>
          </NuxtLink>

          <NuxtLink to="/panel/users" class="nav-item" :class="{ active: $route.path.startsWith('/panel/users') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Users</span>
          </NuxtLink>
        </div>

        <div class="nav-group">
          <div class="nav-group-label">Sistem</div>
          <NuxtLink to="/panel/settings" class="nav-item" :class="{ active: $route.path.startsWith('/panel/settings') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>Pengaturan</span>
          </NuxtLink>
          <NuxtLink to="/panel/bank-logos" class="nav-item" :class="{ active: $route.path.startsWith('/panel/bank-logos') }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>Logo Bank</span>
          </NuxtLink>
        </div>

        <div class="nav-group">
          <div class="nav-group-label">Lainnya</div>
          <NuxtLink to="/merchant" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Dashboard User</span>
          </NuxtLink>
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
          <ProfileChip fixed-name="Admin" fixed-sub="Panel G2CSPAY" />
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
</template>

<script setup lang="ts">

const sidebarOpen = ref(false)
const pendingWd = ref(0)

const route = useRoute()
watch(() => route.path, () => { sidebarOpen.value = false })

const pageTitle = computed(() => {
  const p = route.path
  if (p === '/panel') return 'Panel Admin'
  if (p.startsWith('/panel/withdrawals')) return 'Kelola Tarik Dana'
  if (p.startsWith('/panel/transactions')) return 'Semua Transaksi'
  if (p.startsWith('/panel/users')) return 'Kelola Users'
  if (p.startsWith('/panel/settings')) return 'Pengaturan Sistem'
  if (p.startsWith('/panel/bank-logos')) return 'Logo Bank'
  return 'Panel'
})

async function loadBadges() {
  try {
    const r: any = await $fetch('/api/admin-panel/stats', { credentials: 'include' }).catch(() => null)
    if (r?.success) pendingWd.value = Number(r.data.withdrawals?.pendingCount || 0)
  } catch {}
}

let badgeTimer: any = null

onMounted(() => {
  loadBadges()
  badgeTimer = setInterval(loadBadges, 15000)
})

onBeforeUnmount(() => {
  if (badgeTimer) clearInterval(badgeTimer)
})

async function doLogout() {
  try {
    await $fetch('/api/admin-panel/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
  } catch {}
  navigateTo('/panel/login')
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
}
.overlay {
  display: none;
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45);
  z-index: 40;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s;
}

.sidebar {
  width: 252px; flex-shrink: 0;
  background: var(--bg-soft);
  border-right: 1px solid var(--line);
  display: flex; flex-direction: column;
  position: sticky; top: 0;
  height: 100vh;
  height: 100dvh;
  z-index: 50;
}

.sidebar-head {
  padding: 18px 20px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 72px;
  background: var(--card);
}
.sidebar-brand {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none;
}
.sidebar-brand :deep(img) {
  height: 32px; width: auto;
  display: block;
}
.badge-admin {
  padding: 3px 10px;
  background: var(--grad);
  border: none;
  border-radius: 999px;
  font-size: 9.5px; font-weight: 700;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.sidebar-close {
  display: none;
  width: 34px; height: 34px;
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
  border-color: rgba(var(--vio-rgb),0.35);
  color: var(--vio);
}
.sidebar-close svg { width: 16px; height: 16px; }

.sidebar-nav {
  flex: 1;
  padding: 12px 12px 24px;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--line-2) transparent;
}
.nav-group { display: flex; flex-direction: column; gap: 2px; }
.nav-group-label {
  font-size: 9.5px; font-weight: 700;
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
  font-size: 13px; font-weight: 600;
  transition: all 0.15s;
  position: relative;
  border: 1px solid transparent;
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
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 18px;
  background: var(--grad);
  border-radius: 0 3px 3px 0;
}
.nav-badge {
  margin-left: auto;
  padding: 1px 8px;
  background: var(--grad);
  border-radius: 999px;
  font-size: 10px; font-weight: 700;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.header {
  height: 64px;
  display: flex; align-items: center; gap: 14px;
  padding: 0 20px;
  border-bottom: 1px solid var(--line);
  background: rgba(255,255,255,0.8);
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
}
.hamburger:hover { border-color: var(--vio-2); color: var(--vio); }
.hamburger svg { width: 18px; height: 18px; }
.header-title {
  flex: 1;
  font-size: 13px; font-weight: 750;
  color: var(--txt);
  margin: 0;
}
.header-actions { display: flex; gap: 8px; align-items: center; }
.icon-btn {
  width: 38px; height: 38px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.icon-btn:hover {
  border-color: var(--vio-2);
  color: var(--vio);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.icon-btn svg { width: 16px; height: 16px; }
.content { flex: 1; padding: 28px 24px 40px; }

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0; top: 0; bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.22,1,0.36,1);
    box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
    background: var(--bg-soft);
  }
  .layout.sidebar-open .sidebar { transform: translateX(0); }
  .layout.sidebar-open .overlay { opacity: 1; pointer-events: auto; display: block; }
  .overlay { display: block; }
  .hamburger { display: flex; }
  .sidebar-close { display: flex; }
  .content { padding: 20px 14px 32px; }
}
</style>