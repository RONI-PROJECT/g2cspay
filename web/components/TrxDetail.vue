<script setup lang="ts">
/**
 * Transaction detail drawer.
 *
 * Exists mainly for one field: `webhook.lastError`. "attempts: 4" only says a
 * webhook is failing - the error says *how*, and `ECONNREFUSED` (consumer down)
 * and `HTTP 500` (consumer up, throwing) need completely different fixes.
 */
const props = defineProps<{ trx: any }>()
defineEmits<{ close: []; cancel: [any]; replay: [any] }>()

const wh = computed(() => props.trx?.webhook)

/** Diagnose the failure class from the driver's error string. */
const errorHint = computed(() => {
  const e = wh.value?.lastError
  if (!e) return ''
  if (/ECONNREFUSED|ENOTFOUND|EAI_AGAIN|fetch failed/i.test(e)) {
    return 'Consumer-nya tidak bisa dihubungi - URL salah, atau servermu mati.'
  }
  if (/ETIMEDOUT|TimeoutError|aborted/i.test(e)) {
    return 'Consumer menerima request tapi tidak menjawab dalam WEBHOOK_TIMEOUT_MS.'
  }
  if (/HTTP 4\d\d/i.test(e)) {
    return 'Consumer menolak payload-nya - cek verifikasi signature dan bentuk body di sisimu.'
  }
  if (/HTTP 5\d\d/i.test(e)) {
    return 'Consumer hidup tapi error saat memproses - bug ada di handler webhook-mu.'
  }
  return ''
})

const timeline = computed(() => {
  const t = props.trx
  if (!t) return []
  return [
    { label: 'Dibuat', at: t.createdAt },
    { label: 'Kadaluarsa', at: t.expiresAt },
    { label: 'Lunas', at: t.paidAt },
    { label: 'Webhook berikutnya', at: wh.value?.nextAttemptAt },
  ].filter((r) => r.at)
})

const metadataText = computed(() =>
  props.trx?.metadata == null ? null : JSON.stringify(props.trx.metadata, null, 2),
)
</script>

<template>
  <!-- Backdrop closes on click; Escape is wired by the parent's keydown. -->
  <div v-if="trx" class="backdrop" @click.self="$emit('close')">
    <aside class="drawer" role="dialog" aria-modal="true" :aria-label="`Detail ${trx.trxId}`">
      <header class="drawer-head">
        <span class="pill" :class="trx.status">{{ trx.status }}</span>
        <code class="trx-code">{{ trx.trxId }}</code>
        <span class="spacer" />
        <button class="btn-close" aria-label="Tutup" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
          </svg>
        </button>
      </header>

      <div class="amount-strip">
        <div class="as-item">
          <div class="label">Harga</div>
          <div class="mono as-val">{{ rp(trx.amount) }}</div>
        </div>
        <div class="as-item">
          <div class="label">Fee</div>
          <div class="mono as-val">{{ rp(trx.fee) }}</div>
        </div>
        <div class="as-item as-item--main">
          <div class="label">Dibayar</div>
          <div class="mono as-val">{{ rp(trx.amountToPay) }}</div>
        </div>
      </div>

      <h2 class="sec-title">Waktu</h2>
      <div class="card rows">
        <div v-for="row in timeline" :key="row.label" class="row-item">
          <span class="label row-label">{{ row.label }}</span>
          <span class="mono">{{ clock(row.at) }}</span>
        </div>
      </div>

      <h2 class="sec-title">Webhook</h2>
      <div class="card rows">
        <template v-if="wh">
          <div class="row-item">
            <span class="label row-label">Status</span>
            <span class="mono">
              {{ wh.state }} - {{ wh.attempts }}× percobaan
            </span>
          </div>
          <div v-if="trx.callbackUrl" class="row-item">
            <span class="label row-label">Tujuan</span>
            <span class="mono wrap">{{ trx.callbackUrl }}</span>
          </div>
          <div v-if="wh.lastError" class="err-block">
            <div class="label">Error terakhir</div>
            <code class="err">{{ wh.lastError }}</code>
            <p v-if="errorHint" class="hint">
              {{ errorHint }}
            </p>
          </div>
        </template>
        <span v-else class="muted">Belum ada webhook untuk transaksi ini.</span>
      </div>

      <template v-if="metadataText">
        <h2 class="sec-title">Metadata</h2>
        <pre class="card meta">{{ metadataText }}</pre>
      </template>

      <h2 class="sec-title">QR</h2>
      <div class="card">
        <a class="qr-link" :href="trx.qrImageUrl" target="_blank" rel="noopener">
          Buka gambar QRIS
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
        <pre class="card meta" style="margin-top: 10px">{{ trx.qrString }}</pre>
      </div>

      <div class="actions">
        <button v-if="trx.status === 'PENDING'" class="btn-outline" @click="$emit('cancel', trx)">
          Batalkan
        </button>
        <button v-if="wh?.state === 'PENDING'" class="btn-grad" @click="$emit('replay', trx)">
          Kirim ulang webhook
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42, 0.4);
  
  display: flex;
  justify-content: flex-end;
  z-index: 50;
}

.drawer {
  width: min(560px, 100%);
  height: 100%;
  overflow-y: auto;
  background: var(--bg-soft, var(--soft));
  border-left: 1px solid var(--line);
  padding: 20px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  animation: slideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes slideIn {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: none; opacity: 1; }
}

/* ===== HEAD ===== */
.drawer-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.trx-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--txt);
  overflow-wrap: anywhere;
}
.spacer { flex: 1; }
.btn-close {
  width: 34px; height: 34px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.btn-close:hover {
  border-color: rgba(var(--vio-rgb),0.35);
  color: var(--vio);
}
.btn-close svg { width: 15px; height: 15px; }

/* Status pill */
.pill {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}
.pill.PAID { background: rgba(16,185,129,0.09); color: #059669; border-color: rgba(16,185,129,0.25); }
.pill.PENDING { background: rgba(245,158,11,0.09); color: #d97706; border-color: rgba(245,158,11,0.25); }
.pill.EXPIRED { background: var(--bg-soft, var(--soft)); color: var(--dim); border-color: var(--line-2); }
.pill.CANCELED { background: rgba(225,29,72,0.06); color: #e11d48; border-color: rgba(225,29,72,0.18); }

/* ===== AMOUNT STRIP ===== */
.amount-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}
.as-item {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.as-item--main {
  background: var(--grad, var(--vio));
  border-color: transparent;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.as-item--main .label { color: rgba(255,255,255,0.75); }
.as-item--main .as-val { color: #fff; }
.label {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  margin-bottom: 5px;
  display: block;
}
.as-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* ===== SECTION ===== */
.sec-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--vio);
  margin: 24px 0 10px;
}
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.rows { display: flex; flex-direction: column; gap: 0; }
.row-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
}
.row-item:last-child { border-bottom: none; padding-bottom: 2px; }
.row-item:first-child { padding-top: 2px; }
.row-label { min-width: 130px; flex-shrink: 0; }

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  color: var(--txt);
}
.wrap { overflow-wrap: anywhere; }

/* ===== ERROR ===== */
.err-block {
  padding-top: 10px;
  margin-top: 4px;
  border-top: 1px dashed rgba(225,29,72,0.2);
}
.err {
  display: block;
  color: var(--bad, #e11d48);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
  margin-top: 6px;
  padding: 10px 12px;
  background: rgba(225,29,72,0.05);
  border: 1px solid rgba(225,29,72,0.15);
  border-radius: 8px;
}
.hint {
  font-size: 12px;
  color: var(--dim);
  margin: 10px 0 0;
  line-height: 1.6;
  padding: 10px 12px;
  background: var(--bg-soft, var(--soft));
  border-radius: 8px;
}

/* ===== META / QR ===== */
.meta {
  margin: 0;
  padding: 11px 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: var(--bg-soft, var(--soft));
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  max-height: 220px;
  overflow-y: auto;
}
.qr-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--vio);
  text-decoration: none;
  padding: 4px 0;
}
.qr-link:hover { text-decoration: underline; }
.qr-link svg { width: 13px; height: 13px; }

.muted { color: var(--dim); font-size: 12.5px; }

/* ===== ACTIONS ===== */
.actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
  padding-bottom: 10px;
  flex-wrap: wrap;
}
.btn-outline {
  flex: 1;
  min-width: 140px;
  padding: 11px 18px;
  background: var(--card);
  border: 1px solid rgba(225,29,72,0.3);
  color: var(--bad, #e11d48);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-outline:hover { background: rgba(225,29,72,0.05); }
.btn-grad {
  flex: 1;
  min-width: 160px;
  padding: 11px 18px;
  background: var(--grad, var(--vio));
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  font-family: inherit;
}
.btn-grad:hover {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

@media (max-width: 480px) {
  .drawer { padding: 16px 14px; }
  .amount-strip { grid-template-columns: 1fr 1fr; }
  .as-item--main { grid-column: 1 / -1; }
  .row-label { min-width: 110px; font-size: 9.5px; }
}
</style>