<template>
  <div class="bell-wrap">
    <button class="icon-btn" @click="toggle" title="Notifikasi">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span v-if="unread > 0" class="badge">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="notif-overlay" @click="open = false"></div>
      <div v-if="open" class="notif-panel" @click.stop>
        <div class="panel-head">
          <h3>Notifikasi</h3>
          <div class="panel-actions">
            <button v-if="unread > 0" class="btn-mini" @click="markRead">Tandai dibaca</button>
            <button v-if="items.length" class="btn-mini" @click="clear">Hapus</button>
          </div>
        </div>

        <div v-if="items.length === 0" class="empty">
          <p>Belum ada notifikasi</p>
        </div>

        <div v-else class="list">
          <div v-for="n in items" :key="n.id" class="item" :class="{ unread: !n.isRead }">
            <div class="item-dot" :class="dotClass(n.type)"></div>
            <div class="item-body">
              <div class="item-head">
                <strong>{{ n.title }}</strong>
                <span class="item-time">{{ fmtTime(n.createdAt) }}</span>
              </div>
              <p class="item-msg">{{ n.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const open = ref(false)
const items = ref<any[]>([])
const unread = ref(0)

async function load() {
  try {
    const r: any = await $fetch('/api/user/notifications?limit=20', { credentials: 'include' })
    items.value = r.data?.items || []
    unread.value = r.data?.unread || 0
  } catch {}
}

async function markRead() {
  await $fetch('/api/user/notifications/read', { method: 'POST', credentials: 'include' })
  await load()
}

async function clear() {
  if (!confirm('Hapus semua notifikasi?')) return
  await $fetch('/api/user/notifications', { method: 'DELETE', credentials: 'include' })
  await load()
}

function toggle() {
  open.value = !open.value
  if (open.value) load()
}

function dotClass(t: string) {
  if (t === 'payment') return 'ok'
  if (t === 'withdrawal') return 'warn'
  if (t === 'withdrawal_paid') return 'ok'
  return ''
}

function fmtTime(s: string) {
  if (!s) return ''
  const diff = Date.now() - new Date(s).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} menit lalu`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} hari lalu`
  return new Date(s).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short' })
}

let pollTimer: any = null
onMounted(() => {
  load()
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') load()
  }, 15000)
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.bell-wrap { position: relative; }

.icon-btn {
  position: relative;
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

.badge {
  position: absolute;
  top: -4px; right: -4px;
  min-width: 16px; height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--grad);
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
</style>

<style>
.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: transparent;
}

.notif-panel {
  position: fixed;
  top: 72px;
  right: 16px;
  width: 340px;
  max-width: calc(100vw - 32px);
  max-height: 70vh;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  overflow: hidden;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--txt);
}

.notif-panel * { box-sizing: border-box; }

.notif-panel .panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  gap: 8px;
}
.notif-panel .panel-head h3 {
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  margin: 0;
}
.notif-panel .panel-actions { display: flex; gap: 6px; }
.notif-panel .btn-mini {
  padding: 5px 10px;
  background: var(--card);
  border: 1px solid var(--line-2);
  border-radius: 8px;
  font-size: 10.5px;
  font-weight: 650;
  color: var(--dim);
  cursor: pointer;
  font-family: inherit;
  transition: all .15s;
}
.notif-panel .btn-mini:hover {
  border-color: var(--vio-2);
  color: var(--vio);
  background: var(--bg-soft);
}

.notif-panel .empty {
  padding: 44px 20px;
  text-align: center;
  color: var(--dim);
  font-size: 12.5px;
}

.notif-panel .list { overflow-y: auto; max-height: calc(70vh - 60px); }

.notif-panel .item {
  display: flex;
  gap: 10px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  transition: background 0.15s;
}
.notif-panel .item:last-child { border-bottom: none; }
.notif-panel .item.unread { background: rgba(var(--vio-rgb),0.04); }
.notif-panel .item:hover { background: var(--bg-soft); }
.notif-panel .item.unread:hover { background: rgba(var(--vio-rgb),0.07); }

.notif-panel .item-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--line-2);
  flex-shrink: 0;
  margin-top: 6px;
}
.notif-panel .item-dot.ok { background: #10b981; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.notif-panel .item-dot.warn { background: #f59e0b; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

.notif-panel .item-body { flex: 1; min-width: 0; }

.notif-panel .item-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.notif-panel .item-head strong {
  font-size: 12.5px;
  color: var(--txt);
  font-weight: 700;
  line-height: 1.3;
}
.notif-panel .item.unread .item-head strong { color: var(--vio-ink); }
.notif-panel .item-time {
  font-size: 10px;
  color: var(--dim);
  flex-shrink: 0;
  white-space: nowrap;
}

.notif-panel .item-msg {
  font-size: 11.5px;
  color: var(--dim);
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
}

@media (max-width: 640px) {
  .notif-panel {
    top: 68px;
    right: 12px;
    left: 12px;
    width: auto;
    max-width: none;
    max-height: 65vh;
  }
}
</style>