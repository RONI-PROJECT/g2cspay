<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>Logo Bank &amp; Marquee</h1>
        <p class="sub">Unggah logo tiap bank. Yang dicentang tampil di marquee halaman utama.</p>
      </div>
      <button class="btn-primary" @click="saveMarquee" :disabled="saving">
        {{ saving ? 'Menyimpan' : 'Simpan Marquee' }}
      </button>
    </div>

    <div class="info-card">
      <span><strong>Tips:</strong> pakai PNG transparan, rasio mendekati persegi panjang. Gambar otomatis diperkecil di browser sebelum diunggah. Bank tanpa logo otomatis memakai badge berwarna. Bentuk & warna logo diatur di Pengaturan > Logo.</span>
    </div>

    <div class="list">
      <div v-for="bank in banks" :key="bank.code" class="row">
        <label class="pick">
          <input type="checkbox" :value="bank.code" v-model="selected" />
        </label>
        <ImageUpload v-model="logos[bank.code]" :asset-key="'bank-' + bank.code" :fallback="bank.code" compact :max-size="320" />
        <div class="bank-info">
          <div class="bank-name">{{ bank.name }}</div>
          <div class="bank-code">{{ bank.code }}</div>
        </div>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="saved" class="toast"><span>Tersimpan</span></div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'panel' })

const BANKS = [
  { code: 'BCA', name: 'Bank Central Asia' },
  { code: 'BNI', name: 'Bank Negara Indonesia' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia' },
  { code: 'MANDIRI', name: 'Bank Mandiri' },
  { code: 'CIMB', name: 'CIMB Niaga' },
  { code: 'PERMATA', name: 'Bank Permata' },
  { code: 'DANAMON', name: 'Bank Danamon' },
  { code: 'BSI', name: 'Bank Syariah Indonesia' },
  { code: 'BTN', name: 'Bank Tabungan Negara' },
  { code: 'OCBC', name: 'OCBC NISP' },
  { code: 'MAYBANK', name: 'Maybank Indonesia' },
  { code: 'PANIN', name: 'Bank Panin' },
  { code: 'MEGA', name: 'Bank Mega' },
  { code: 'BJB', name: 'Bank Jabar Banten' },
  { code: 'DKI', name: 'Bank DKI' },
  { code: 'JAGO', name: 'Bank Jago' },
  { code: 'SEABANK', name: 'SeaBank' },
  { code: 'NEO', name: 'Bank Neo Commerce' },
  { code: 'BLU', name: 'Blu BCA Digital' },
  { code: 'JENIUS', name: 'Jenius' },
  { code: 'GOPAY', name: 'GoPay' },
  { code: 'OVO', name: 'OVO' },
  { code: 'DANA', name: 'DANA' },
  { code: 'SHOPEEPAY', name: 'ShopeePay' },
  { code: 'LINKAJA', name: 'LinkAja' },
]

const banks = BANKS
const logos = reactive<Record<string, string>>({})
const selected = ref<string[]>([])
const saving = ref(false)
const saved = ref(false)

async function load() {
  try {
    const r: any = await $fetch('/api/admin-panel/settings', { credentials: 'include' })
    if (r?.success) {
      try { Object.assign(logos, JSON.parse(r.data.bank_logos || '{}')) } catch {}
      selected.value = (r.data.marquee_banks || '').split(',').map((x: string) => x.trim()).filter(Boolean)
    }
  } catch {}
}

async function saveMarquee() {
  saving.value = true
  try {
    await $fetch('/api/admin-panel/settings', {
      method: 'POST', credentials: 'include',
      body: { marquee_banks: banks.map(b => b.code).filter(c => selected.value.includes(c)).join(',') },
    })
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (e: any) {
    alert('Gagal: ' + (e?.data?.error || e.message))
  } finally { saving.value = false }
}

onMounted(load)
</script>

<style scoped>
* { box-sizing: border-box; }
.page {
  width: 100%; max-width: 900px;
  margin: 0 auto; padding-bottom: 140px;
  color: var(--txt);
  font-family: 'Inter', -apple-system, sans-serif;
}
.head {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
}
h1 { font-size: 13px; font-weight: 700; color: var(--txt); letter-spacing: -0.02em; }
.sub { font-size: 13px; color: var(--dim); margin-top: 5px; }

.info-card {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 13px 16px;
  background: rgba(var(--vio-rgb),0.05);
  border: 1px solid rgba(var(--vio-rgb),0.15);
  border-radius: 8px;
  font-size: 12.5px; color: var(--dim);
  line-height: 1.6; margin-bottom: 16px;
}
.info-card strong { color: var(--vio-ink); }
.info-icon {
  width: 15px; height: 15px;
  color: var(--vio);
  flex-shrink: 0;
  margin-top: 2px;
}

.list { display: flex; flex-direction: column; gap: 8px; }
.row {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.row:hover { border-color: var(--line-2); }

.pick { display:flex; align-items:center; margin:0; } .pick input { width:18px; height:18px; accent-color: var(--vio); }
.bank-info { display: flex; align-items: center; gap: 12px; min-width: 180px; }
.bank-logo-wrap {
  width: 40px; height: 40px; border-radius: 8px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  padding: 5px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; overflow: hidden;
}
.bank-logo-img { width: 100%; height: 100%; object-fit: contain; }
.bank-logo-empty {
  font-size: 13px;
  font-weight: 700;
  color: var(--vio);
}
.bank-name { font-size: 13px; font-weight: 700; color: var(--txt); }
.bank-code {
  font-family: ui-monospace, monospace;
  font-size: 11px; color: var(--dim); margin-top: 2px;
}

.bank-input {
  flex: 1; padding: 10px 14px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 12.5px; color: var(--txt);
  font-family: inherit; min-width: 0;
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
}
.bank-input::placeholder { color: var(--dim); opacity: 0.55; }
.bank-input:focus {
  border-color: var(--vio);
  background: var(--card);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}

.btn-primary {
  padding: 10px 20px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  border: none; border-radius: 8px;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  transition: all 0.2s;
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }

.toast {
  position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  background: var(--txt); color: #ffffff;
  border-radius: 8px; font-size: 13px; font-weight: 700;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  z-index: 850; display: flex; align-items: center; gap: 8px;
}
.toast svg { width: 15px; height: 15px; color: #34d399; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

@media (max-width: 640px) {
  .row { flex-direction: column; align-items: stretch; }
  .bank-info { min-width: 0; }
}
</style>