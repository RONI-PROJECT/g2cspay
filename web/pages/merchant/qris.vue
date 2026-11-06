<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>Buat QRIS</h1>
        <p class="sub">Masukkan nominal, sistem akan generate QRIS dinamis</p>
      </div>
    </div>

    <div class="layout">
      <div class="card">
        <div class="card-head">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <h2>Nominal Pembayaran</h2>
            <p class="card-sub">Masukkan nominal sesuai transaksi</p>
          </div>
        </div>

        <div class="amount-display">
          <span class="currency">Rp</span>
          <input
            v-model.number="amount"
            type="number"
            placeholder="0"
            :disabled="loading"
            class="amount-input"
            @keyup.enter="onSubmit"
          />
        </div>

        <div v-if="amount && amount > 0" class="amount-preview">
          {{ formatFull(amount) }}
        </div>

        <div v-if="error" class="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ error }}</span>
        </div>

        <button
          type="button"
          class="btn-submit"
          @click="onSubmit"
          :disabled="loading || !amount || amount <= 0"
        >
          <span v-if="loading" class="btn-loading">
            <span class="btn-spinner"></span>
            Memproses
          </span>
          <span v-else>Buat QRIS</span>
        </button>

        <div class="info-box">
          <div class="info-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="info-text">
            <strong>Setelah dibuat</strong>
            <p>Anda akan diarahkan ke halaman pembayaran. Bagikan link ke pembeli atau scan QR sendiri.</p>
          </div>
        </div>
      </div>

      <div class="side">
        <div class="side-card">
          <div class="side-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <div class="side-title">Deteksi Otomatis</div>
            <div class="side-desc">Pembayaran terdeteksi otomatis dari QRIS dinamis</div>
          </div>
        </div>

        <div class="side-card">
          <div class="side-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div class="side-title">Berlaku 5 Menit</div>
            <div class="side-desc">Setelah itu, transaksi otomatis kadaluwarsa</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const amount = ref<number | null>(null)
const loading = ref(false)
const error = ref('')

function formatFull(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

async function onSubmit() {
  error.value = ''
  if (!amount.value || amount.value <= 0) {
    error.value = 'Masukkan nominal terlebih dahulu'
    return
  }

  loading.value = true
  try {
    const r: any = await $fetch('/api/user/payment/create', {
      method: 'POST',
      body: { amount: amount.value },
      credentials: 'include',
    })
    navigateTo(`/pay/${r.data.trxId}`)
  } catch (e: any) {
    error.value = e?.data?.error || e.message || 'Gagal membuat QRIS'
    loading.value = false
  }
}
</script>

<style scoped>
* { box-sizing: border-box; }

.page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 60px;
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.head { margin-bottom: 24px; }
h1 { font-size: 13px; font-weight: 700; color: var(--txt); letter-spacing: -0.02em; }
.sub { font-size: 13px; color: var(--dim); margin-top: 5px; }

.layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  align-items: start;
}
@media (max-width: 800px) {
  .layout { grid-template-columns: 1fr; }
}

.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 26px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: var(--grad, var(--vio));
}
.card > * { position: relative; z-index: 1; }

.card-head {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.card-icon {
  width: 44px; height: 44px;
  border-radius: 8px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.card-icon svg { width: 18px; height: 18px; }
.card h2 { font-size: 13px; font-weight: 750; color: var(--txt); }
.card-sub { font-size: 12.5px; color: var(--dim); margin-top: 3px; }

.amount-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line-2);
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.18s;
}
.amount-display:focus-within {
  border-color: var(--vio);
  background: var(--card);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.currency {
  font-size: 13px;
  font-weight: 750;
  color: var(--dim);
  flex-shrink: 0;
}
.amount-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  font-weight: 700;
  color: var(--txt);
  font-family: inherit;
  width: 100%;
  min-width: 0;
}
.amount-input::placeholder {
  color: var(--line-2);
  font-size: 13px;
  font-weight: 700;
}
.amount-input::-webkit-outer-spin-button,
.amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.amount-input[type=number] { -moz-appearance: textfield; }

.amount-preview {
  text-align: right;
  font-size: 12.5px;
  color: var(--vio);
  font-weight: 700;
  margin-bottom: 16px;
  padding-right: 4px;
}

.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  margin-bottom: 16px;
  line-height: 1.5;
}
.alert svg { width: 16px; height: 16px; flex-shrink: 0; }
.alert-error {
  background: rgba(225,29,72,0.05);
  color: var(--bad, #e11d48);
  border: 1px solid rgba(225,29,72,0.18);
  font-weight: 600;
}

.btn-submit {
  width: 100%;
  padding: 13px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  margin-bottom: 14px;
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.btn-loading { display: inline-flex; align-items: center; gap: 8px; }
.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.info-box {
  display: flex;
  gap: 12px;
  padding: 13px 15px;
  background: rgba(var(--vio-rgb),0.04);
  border: 1px solid rgba(var(--vio-rgb),0.14);
  border-radius: 8px;
}
.info-icon {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: rgba(var(--vio-rgb),0.08);
  border: 1px solid rgba(var(--vio-rgb),0.18);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.info-icon svg { width: 13px; height: 13px; }
.info-text { flex: 1; min-width: 0; }
.info-text strong {
  display: block;
  font-size: 12.5px;
  font-weight: 750;
  color: var(--txt);
  margin-bottom: 3px;
}
.info-text p {
  font-size: 12px;
  color: var(--dim);
  line-height: 1.55;
  margin: 0;
}

.side { display: flex; flex-direction: column; gap: 10px; }
.side-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  transition: all 0.2s;
}
.side-card:hover { border-color: rgba(var(--vio-rgb),0.25); }
.side-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: rgba(var(--vio-rgb),0.07);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  color: var(--vio);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.side-icon svg { width: 16px; height: 16px; }
.side-title { font-size: 13px; font-weight: 750; color: var(--txt); margin-bottom: 3px; }
.side-desc { font-size: 11.5px; color: var(--dim); line-height: 1.5; }

@media (max-width: 640px) {
  .page { padding-bottom: 40px; }
  .card { padding: 20px; border-radius: 8px; }
  .amount-input { font-size: 13px; }
  .amount-input::placeholder { font-size: 13px; }
  .currency { font-size: 13px; }
  h1 { font-size: 13px; }
}
</style>