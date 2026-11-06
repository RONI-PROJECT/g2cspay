<template>
  <div class="page">
    <div class="head">
      <div>
        <h1>Pengaturan Sistem</h1>
        <p class="sub">Kelola tampilan, branding, dan status layanan</p>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs-wrap">
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'maintenance' }" @click="tab = 'maintenance'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <span>Maintenance</span>
          <span v-if="maintenance" class="tab-dot"></span>
        </button>
        <button class="tab" :class="{ active: tab === 'branding' }" @click="tab = 'branding'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>
          </svg>
          <span>Branding</span>
        </button>
        <button class="tab" :class="{ active: tab === 'finance' }" @click="tab = 'finance'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke-linecap="round"/>
          </svg>
          <span>Keuangan</span>
        </button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="state">
      <div class="spinner"></div>
      <p>Memuat pengaturan</p>
    </div>

    <template v-else>
      <!-- TAB MAINTENANCE -->
      <div v-if="tab === 'maintenance'">
        <div class="card" :class="{ 'card-on': maintenance }">
          <div class="card-head">
            <div class="card-icon" :class="{ on: maintenance }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div class="card-info">
              <div class="card-title">Mode Pemeliharaan</div>
              <div class="card-desc">
                {{ maintenance ? 'Layanan sedang tidak tersedia untuk pengguna umum' : 'Layanan beroperasi normal untuk semua pengguna' }}
              </div>
            </div>
            <button class="toggle" :class="{ on: maintenance }" @click="toggleMaintenance" :disabled="saving" aria-label="Toggle maintenance">
              <span class="knob"></span>
            </button>
          </div>

          <div v-if="maintenance" class="alert-on">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Mode pemeliharaan aktif</strong>
              <p>Pengguna akan diarahkan ke halaman pemeliharaan saat mengakses dashboard.</p>
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-title">Apa yang terjadi saat mode pemeliharaan aktif?</div>
          <ul class="info-list">
            <li>Pengguna yang sedang login akan diarahkan ke halaman pemeliharaan</li>
            <li>Transaksi pembayaran (QRIS) tetap berjalan seperti biasa</li>
            <li>Notifikasi webhook dan integrasi API tetap normal</li>
            <li>Halaman pembayaran publik tetap dapat diakses</li>
            <li>Akses panel admin tidak terpengaruh</li>
          </ul>
        </div>
      </div>

      <!-- TAB BRANDING -->
      <div v-if="tab === 'branding'">
        <div class="card">
          <div class="card-head">
            <div class="card-info">
              <div class="card-title">Identitas Website</div>
              <div class="card-desc">Nama, judul, deskripsi, dan keywords</div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Nama Website</label>
              <input v-model="form.site_name" placeholder="G2CSPAY" />
            </div>

            <div class="form-group full">
              <label>Logo Website</label>
              <ImageUpload v-model="form.logo_url" asset-key="logo" label="Logo utama" hint="PNG transparan, tampil di navbar, login, dan dashboard." :max-size="640" />
            </div>

            <div class="form-group full">
              <label>Judul Halaman (title tag)</label>
              <input v-model="form.site_title" placeholder="G2CSPAY - Payment Gateway QRIS" />
            </div>

            <div class="form-group full">
              <label>Deskripsi Meta</label>
              <textarea v-model="form.site_description" rows="2" placeholder="Deskripsi singkat untuk SEO"></textarea>
            </div>

            <div class="form-group full">
              <label>Keywords (pisahkan dengan koma)</label>
              <input v-model="form.site_keywords" placeholder="qris, payment gateway, indonesia" />
            </div>

            <div class="form-group full">
              <label>Favicon</label>
              <ImageUpload v-model="form.favicon_url" asset-key="favicon" label="Ikon tab browser" hint="PNG persegi, minimal 64 x 64 px. ICO juga boleh." :max-size="128" />
            </div>
            <div class="form-group full">
              <label>Gambar Share (Open Graph)</label>
              <ImageUpload v-model="form.og_url" asset-key="og" label="Preview link di WhatsApp / sosmed" hint="Disarankan 1200 x 630 px." :max-size="1200" />
            </div>

            <div class="form-group">
              <label>Copyright Footer</label>
              <input v-model="form.footer_copyright" placeholder="© 2026 G2CSPAY" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-info">
              <div class="card-title">Hero Landing Page</div>
              <div class="card-desc">Judul dan deskripsi utama di halaman depan</div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group full">
              <label>Judul Hero (bisa pakai HTML)</label>
              <textarea v-model="form.hero_title" rows="2" placeholder="Terima pembayaran QRIS tanpa ribet"></textarea>
            </div>

            <div class="form-group full">
              <label>Deskripsi Hero</label>
              <textarea v-model="form.hero_lead" rows="3" placeholder="Satu dashboard untuk merchant"></textarea>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-info">
              <div class="card-title">Logo &amp; Tampilan Bank</div>
              <div class="card-desc">Ukuran logo header, bentuk dan warna logo bank di marquee, penarikan, dan halaman lain.</div>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group full">
              <label>Tinggi logo header: {{ form.logo_height }}px</label>
              <input type="range" min="20" max="56" step="2" v-model.number="form.logo_height" />
            </div>
            <div class="form-group">
              <label>Bentuk logo bank</label>
              <select v-model="form.bank_logo_shape">
                <option value="rounded">Kotak membulat</option>
                <option value="circle">Lingkaran</option>
                <option value="square">Kotak tajam</option>
              </select>
            </div>
            <div class="form-group">
              <label>Warna logo bank</label>
              <select v-model="form.bank_logo_gray">
                <option :value="false">Berwarna</option>
                <option :value="true">Abu-abu (grayscale)</option>
              </select>
            </div>
          </div>
          <div class="logo-prev">
            <SiteLogo />
            <span v-for="c in ['BCA','BRI','DANA','OVO']" :key="c" class="logo-prev-b"><img :src="bankBadge(c)" :alt="c" /></span>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-info">
              <div class="card-title">Warna Tema</div>
              <div class="card-desc">Pilih warna utama website (landing, dashboard, docs, chart). Simpan untuk menerapkan.</div>
            </div>
          </div>
          <div class="theme-grid">
            <button v-for="t in THEMES" :key="t.key" type="button" class="theme-opt" :class="{ on: form.theme_color === t.key }" @click="form.theme_color = t.key">
              <span class="theme-dot" :style="{ background: t.hex }"></span>{{ t.name }}
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-info">
              <div class="card-title">Marquee Bank</div>
              <div class="card-desc">Text dan daftar bank yang tampil di landing page</div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group full">
              <label>Label Marquee</label>
              <input v-model="form.marquee_text" placeholder="Didukung berbagai bank & e-wallet" />
            </div>

            <div class="form-group full">
              <label>Daftar Bank (pisahkan dengan koma)</label>
              <textarea v-model="form.marquee_items" rows="2" placeholder="BCA,Mandiri,BNI,GoPay"></textarea>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-info">
              <div class="card-title">Footer</div>
              <div class="card-desc">Text deskripsi di bagian bawah</div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group full">
              <label>Deskripsi Footer</label>
              <textarea v-model="form.footer_text" rows="2"></textarea>
            </div>
          </div>
        </div>

        <div class="action-row">
          <button class="btn-primary" @click="saveBranding" :disabled="saving">
            <span v-if="saving" class="btn-loading">
              <span class="btn-spinner"></span>
              Menyimpan
            </span>
            <span v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Simpan Perubahan
            </span>
          </button>
        </div>
      </div>

      <!-- TAB KEUANGAN -->
      <div v-if="tab === 'finance'">
        <div class="card">
          <div class="card-head">
            <div class="card-info">
              <div class="card-title">Fee Transaksi QRIS</div>
              <div class="card-desc">Dipotong dari setiap pembayaran QRIS yang berhasil</div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group full">
              <label>Fee per Transaksi (%)</label>
              <input v-model.number="form.fee_transaction_percent" type="number" min="0" step="0.1" placeholder="1.8" />
              <p class="hint">Dipotong dari nominal. Contoh: 1.8% dari Rp 20.000 = Rp 360</p>
            </div>
          </div>

          <div class="preview-box">
            <div class="preview-title">Contoh Perhitungan</div>
            <div class="preview-rows">
              <div class="pv-row">
                <span>Nominal transaksi</span>
                <strong>Rp 20.000</strong>
              </div>
              <div class="pv-row">
                <span>Fee ({{ form.fee_transaction_percent }}%)</span>
                <strong class="fee-val">-Rp {{ feePreview.toLocaleString('id-ID') }}</strong>
              </div>
              <div class="pv-row total">
                <span>Masuk saldo user</span>
                <strong>{{ rupiah(netPreview) }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-info">
              <div class="card-title">Penarikan Dana</div>
              <div class="card-desc">Atur minimum dan biaya admin untuk user</div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Minimum Penarikan (Rp)</label>
              <input v-model.number="form.wd_min" type="number" min="0" placeholder="65000" />
              <p class="hint">Nominal paling kecil yang bisa ditarik user</p>
            </div>

            <div class="form-group">
              <label>Biaya Admin (%)</label>
              <input v-model.number="form.wd_fee_percent" type="number" min="0" step="0.1" placeholder="2.5" />
              <p class="hint">Persentase dari nominal penarikan</p>
            </div>

            <div class="form-group full">
              <label>Biaya Tetap (Rp)</label>
              <input v-model.number="form.wd_fee_flat" type="number" min="0" placeholder="4500" />
              <p class="hint">Tambahan biaya flat per transaksi penarikan</p>
            </div>
          </div>

          <div class="preview-box">
            <div class="preview-title">Contoh Perhitungan</div>
            <div class="preview-rows">
              <div class="pv-row">
                <span>User tarik</span>
                <strong>Rp 100.000</strong>
              </div>
              <div class="pv-row">
                <span>Biaya admin</span>
                <strong class="fee-val">-Rp {{ wdFeePreview.toLocaleString('id-ID') }}</strong>
              </div>
              <div class="pv-row total">
                <span>Diterima user</span>
                <strong>{{ rupiah(wdNetPreview) }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="action-row">
          <button class="btn-primary" @click="saveFinance" :disabled="saving">
            <span v-if="saving" class="btn-loading">
              <span class="btn-spinner"></span>
              Menyimpan
            </span>
            <span v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Simpan Perubahan
            </span>
          </button>
        </div>
      </div>
    </template>

    <Transition name="toast">
      <div v-if="saved" class="toast">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>{{ savedMsg }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'panel' })

const tab = ref('maintenance')
const maintenance = ref(false)
const saving = ref(false)
const saved = ref(false)
const savedMsg = ref('Tersimpan')
const loading = ref(true)

import { bankBadge } from '~/utils/bankLogo'
const THEMES = [
  { key: 'navy', name: 'Biru Tua', hex: '#1e40af' },
  { key: 'teal', name: 'Teal', hex: '#0d9488' }, { key: 'emerald', name: 'Emerald', hex: '#059669' },
  { key: 'blue', name: 'Biru', hex: '#2563eb' }, { key: 'indigo', name: 'Indigo', hex: '#4f46e5' },
  { key: 'violet', name: 'Ungu', hex: '#7c3aed' }, { key: 'rose', name: 'Rose', hex: '#e11d48' },
  { key: 'amber', name: 'Amber', hex: '#d97706' }, { key: 'slate', name: 'Slate', hex: '#334155' },
]
const form = reactive({
  theme_color: 'navy',
  logo_height: 30,
  bank_logo_shape: 'rounded',
  bank_logo_gray: false,
  site_name: '',
  site_title: '',
  site_description: '',
  site_keywords: '',
  hero_title: '',
  hero_lead: '',
  favicon_url: '',
  footer_copyright: '',
  logo_url: '',
  og_url: '',
  marquee_text: '',
  marquee_items: '',
  footer_text: '',
  wd_min: 65000,
  wd_fee_percent: 2.5,
  wd_fee_flat: 4500,
  fee_transaction_percent: 1.8,
})

function rupiah(n: number) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}

// Live preview computed
const feePreview = computed(() => {
  return Math.round(20000 * (Number(form.fee_transaction_percent) || 0) / 100)
})
const netPreview = computed(() => {
  return 20000 - feePreview.value
})
const wdFeePreview = computed(() => {
  const pct = Number(form.wd_fee_percent) || 0
  const flat = Number(form.wd_fee_flat) || 0
  return Math.round(100000 * pct / 100 + flat)
})
const wdNetPreview = computed(() => {
  return 100000 - wdFeePreview.value
})

async function load() {
  loading.value = true
  try {
    const r: any = await $fetch('/api/admin-panel/settings', { credentials: 'include' })
    if (r?.success) {
      maintenance.value = r.data.maintenance_mode === 'true'
      form.site_name = r.data.site_name || 'G2CSPAY'
      form.site_title = r.data.site_title || ''
      form.site_description = r.data.site_description || ''
      form.site_keywords = r.data.site_keywords || ''
      form.logo_url = r.data.logo_url || ''
      form.theme_color = r.data.theme_color || 'navy'
      form.logo_height = Number(r.data.logo_height) || 30
      form.bank_logo_shape = r.data.bank_logo_shape || 'rounded'
      form.bank_logo_gray = r.data.bank_logo_gray === true || r.data.bank_logo_gray === 'true'
      form.marquee_text = r.data.marquee_text || ''
      form.marquee_items = r.data.marquee_items || ''
      form.footer_text = r.data.footer_text || ''
      form.hero_title = r.data.hero_title || ''
      form.hero_lead = r.data.hero_lead || ''
      form.footer_copyright = r.data.footer_copyright || ''
      form.favicon_url = r.data.favicon_url || ''
      form.og_url = r.data.og_url || ''
      form.wd_min = Number(r.data.wd_min || 65000)
      form.wd_fee_percent = Number(r.data.wd_fee_percent || 2.5)
      form.wd_fee_flat = Number(r.data.wd_fee_flat || 4500)
      form.fee_transaction_percent = Number(r.data.fee_transaction_percent || 1.8)
    }
  } catch (e) {
    console.error('load settings error:', e)
  } finally {
    loading.value = false
  }
}

async function toggleMaintenance() {
  saving.value = true
  try {
    const newVal = !maintenance.value
    await $fetch('/api/admin-panel/maintenance', {
      method: 'POST',
      body: { enabled: newVal },
      credentials: 'include',
    })
    maintenance.value = newVal
    flashSaved(newVal ? 'Maintenance aktif' : 'Maintenance nonaktif')
  } catch (e: any) {
    alert('Gagal: ' + (e?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

async function saveBranding() {
  saving.value = true
  try {
    await $fetch('/api/admin-panel/settings', {
      method: 'POST',
      body: {
        site_name: form.site_name,
        site_title: form.site_title,
        site_description: form.site_description,
        site_keywords: form.site_keywords,
        logo_url: form.logo_url,
        theme_color: form.theme_color,
        logo_height: form.logo_height,
        bank_logo_shape: form.bank_logo_shape,
        bank_logo_gray: form.bank_logo_gray,
        marquee_text: form.marquee_text,
        marquee_items: form.marquee_items,
        footer_text: form.footer_text,
        hero_title: form.hero_title,
        hero_lead: form.hero_lead,
        footer_copyright: form.footer_copyright,
        favicon_url: form.favicon_url,
        og_url: form.og_url,
      },
      credentials: 'include',
    })
    flashSaved('Branding tersimpan')
    const { load: reload } = useSiteSettings()
    await reload()
  } catch (e: any) {
    alert('Gagal: ' + (e?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

async function saveFinance() {
  saving.value = true
  try {
    await $fetch('/api/admin-panel/settings', {
      method: 'POST',
      body: {
        wd_min: String(form.wd_min),
        wd_fee_percent: String(form.wd_fee_percent),
        wd_fee_flat: String(form.wd_fee_flat),
        fee_transaction_percent: String(form.fee_transaction_percent),
      },
      credentials: 'include',
    })
    flashSaved('Pengaturan keuangan tersimpan')
    const { load: reload } = useSiteSettings()
    await reload()
  } catch (e: any) {
    alert('Gagal: ' + (e?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

function flashSaved(msg = 'Tersimpan') {
  savedMsg.value = msg
  saved.value = true
  setTimeout(() => saved.value = false, 2200)
}

onMounted(load)
</script>

<style scoped>
.logo-prev { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 14px; padding: 14px; border: 1px dashed var(--line-2); border-radius: 12px; background: var(--bg-soft); }
.logo-prev-b { width: 40px; height: 40px; display: grid; place-items: center; }
.logo-prev-b img { width: 40px; height: 40px; border-radius: var(--bank-r); filter: var(--bank-filter); }
.theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; padding: 4px 2px 6px; }
.theme-opt { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); font-size: 13px; font-weight: 600; color: var(--txt); transition: all .15s; }
.theme-opt:hover { border-color: var(--vio); }
.theme-opt.on { border-color: var(--vio); box-shadow: 0 0 0 3px rgba(var(--vio-rgb), .15); }
.theme-dot { width: 18px; height: 18px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(255,255,255,.5); }
* { box-sizing: border-box; }

.page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 140px;
  color: var(--txt);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.head { margin-bottom: 24px; }
h1 { font-size: 13px; font-weight: 700; color: var(--txt); letter-spacing: -0.02em; }
.sub { font-size: 13px; color: var(--dim); margin-top: 5px; }

/* ===== STATE ===== */
.state {
  text-align: center;
  padding: 60px 20px;
  color: var(--dim);
  font-size: 13px;
}
.spinner {
  width: 28px; height: 28px;
  border: 3px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 14px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== TABS ===== */
.tabs-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 18px;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.tabs-wrap::-webkit-scrollbar { display: none; }
.tabs {
  display: flex;
  gap: 6px;
  min-width: fit-content;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 650;
  color: var(--dim);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}
.tab svg { width: 16px; height: 16px; }
.tab:hover { border-color: var(--line-2); color: var(--txt); }
.tab.active {
  background: var(--grad, var(--vio));
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
/* TAB DOT - notif kalau maintenance aktif */
.tab-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  animation: pulse 2s infinite;
  flex-shrink: 0;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ===== CARD ===== */
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px;
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.card.card-on {
  border-color: rgba(251,191,36,0.4);
  background: linear-gradient(135deg, rgba(245,158,11,0.10), var(--card) 60%);
  box-shadow: 0 0 0 3px rgba(245,158,11,0.06);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 4px;
}
.card-icon {
  width: 48px; height: 48px;
  border-radius: 8px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  color: var(--dim);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}
.card-icon.on {
  background: rgba(245,158,11,0.14);
  border-color: rgba(251,191,36,0.45);
  color: #fbbf24;
}
.card-icon svg { width: 22px; height: 22px; }

.card-info { flex: 1; min-width: 0; }
.card-title { font-size: 13px; font-weight: 750; color: var(--txt); margin-bottom: 4px; }
.card-desc { font-size: 12.5px; color: var(--dim); line-height: 1.5; }

/* ===== TOGGLE ===== */
.toggle {
  position: relative;
  width: 52px; height: 30px;
  border-radius: 999px;
  background: var(--line);
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
  flex-shrink: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}
.toggle.on {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow: 0 0 0 3px rgba(251,191,36,0.18), 0 4px 14px rgba(245,158,11,0.35);
}
.toggle.on .knob { background: #fff; }
.toggle:disabled { opacity: 0.5; cursor: not-allowed; }
.knob {
  position: absolute;
  top: 50%;
  left: 3px;
  transform: translateY(-50%);
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--card);
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.toggle.on .knob {
  left: 25px;
}

/* ===== ALERT ===== */
.alert-on {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  margin-top: 18px;
  background: rgba(245,158,11,0.07);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 8px;
}
.alert-on svg { width: 18px; height: 18px; color: #fbbf24; flex-shrink: 0; margin-top: 2px; }
.alert-on strong { display: block; font-size: 13px; font-weight: 750; color: #fbbf24; margin-bottom: 4px; }
.alert-on p { font-size: 12.5px; color: var(--dim); line-height: 1.55; margin: 0; }

/* ===== INFO CARD ===== */
.info-card {
  padding: 22px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
}
.info-title { font-size: 13px; font-weight: 750; color: var(--txt); margin-bottom: 14px; }
.info-list { list-style: none; padding: 0; margin: 0; }
.info-list li {
  position: relative;
  padding-left: 22px;
  font-size: 12.5px;
  color: var(--dim);
  line-height: 1.75;
  margin-bottom: 6px;
}
.info-list li::before {
  content: '';
  position: absolute;
  left: 4px; top: 9px;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--vio);
  opacity: 0.7;
}

/* ===== FORM ===== */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 16px;
}
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 12px; font-weight: 700; color: var(--txt); }
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 11px 14px;
  background: var(--bg-soft, var(--soft));
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  color: var(--txt);
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
}
.form-group input::placeholder,
.form-group textarea::placeholder { color: var(--dim); opacity: 0.55; }
.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--vio);
  background: var(--card);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.hint {
  font-size: 11.5px;
  color: var(--dim);
  margin: 0;
  line-height: 1.5;
  opacity: 0.8;
}

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; gap: 12px; }
}

/* ===== PREVIEW ===== */
.preview-box {
  margin-top: 18px;
  padding: 16px;
  background: rgba(var(--vio-rgb),0.04);
  border: 1px solid rgba(var(--vio-rgb),0.14);
  border-radius: 8px;
}
.preview-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--vio);
  margin-bottom: 12px;
}
.preview-rows { display: flex; flex-direction: column; }
.pv-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
  color: var(--dim);
}
.pv-row strong {
  color: var(--txt);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
  text-align: right;
}
.pv-row strong.fee-val { color: #d97706; font-weight: 700; }
.pv-row.total {
  border-top: 1px solid rgba(var(--vio-rgb),0.15);
  margin-top: 6px;
  padding-top: 10px;
}
.pv-row.total strong { font-size: 13px; color: var(--vio-ink); font-weight: 700; }

/* ===== ACTION ===== */
.action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  position: sticky;
  bottom: 16px;
  z-index: 5;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  background: var(--grad, var(--vio));
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
}
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06); }
.btn-primary svg { width: 14px; height: 14px; }
.btn-loading { display: inline-flex; align-items: center; gap: 8px; }
.btn-spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ===== TOAST ===== */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  background: var(--grad);
  color: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.06);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 850;
  max-width: calc(100% - 32px);
}
.toast svg { width: 15px; height: 15px; flex-shrink: 0; color: #34d399; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.22,1,0.36,1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 20px); }

/* ===== MOBILE ===== */
@media (max-width: 640px) {
  .page { padding-bottom: 100px; }
  h1 { font-size: 13px; }
  .card { padding: 18px; }
  .card-head { gap: 12px; flex-wrap: wrap; }
  .card-icon { width: 42px; height: 42px; }
  .card-icon svg { width: 20px; height: 20px; }
  .card-title { font-size: 13px; }
  .card-desc { font-size: 12px; }
  .tab { padding: 9px 14px; font-size: 12.5px; }
  .tab svg { width: 14px; height: 14px; }
  .info-card { padding: 18px; }
  .preview-box { padding: 14px; }
  .pv-row { font-size: 12.5px; }
  .action-row { justify-content: stretch; }
  .btn-primary { width: 100%; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .spinner, .btn-spinner, .tab-dot {
    animation: none !important;
  }
}
</style>

