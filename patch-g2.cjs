// patch-g2.js — jalankan dari folder project (yang ada web/ di dalamnya)
const fs = require('fs'), path = require('path')
let root = process.cwd()
if (!fs.existsSync(path.join(root, 'web')) && fs.existsSync(path.join(root, 'website', 'web'))) root = path.join(root, 'website')
if (!fs.existsSync(path.join(root, 'web'))) { console.error('Folder web/ tidak ketemu. Jalankan dari folder project.'); process.exit(1) }

let ok = 0, fail = 0
function edit(file, pairs) {
  const p = path.join(root, file)
  let s = fs.readFileSync(p, 'utf8'), changed = false
  for (const [from, to, all] of pairs) {
    if (!s.includes(from)) { console.log('  GAGAL  ' + file + '  <- ' + from.slice(0, 55).replace(/\n/g, ' ')); fail++; continue }
    s = all ? s.split(from).join(to) : s.replace(from, () => to)
    changed = true; ok++
  }
  if (changed) fs.writeFileSync(p, s)
}

// 1) HEADER putih -> navy glass
edit('web/layouts/dashboard.vue', [['background: rgba(255,255,255,0.86);', 'background: rgba(7,13,34,0.86);']])
edit('web/layouts/panel.vue', [['background: rgba(255,255,255,0.8);', 'background: rgba(7,13,34,0.86);\n  -webkit-backdrop-filter: saturate(160%) blur(10px);\n  backdrop-filter: saturate(160%) blur(10px);']])
for (const f of ['privacy', 'tos', 'disclaimer'])
  edit('web/pages/' + f + '.vue', [['background: rgba(255,255,255,0.85);', 'background: rgba(7,13,34,0.85);']])

// 2) BOX PUTIH (background var(--txt) + teks putih): tab aktif, tombol Simpan, avatar, toast
for (const f of ['components/ProfileChip.vue', 'pages/merchant/api-key.vue', 'pages/merchant/settings.vue',
  'pages/panel/users.vue', 'pages/panel/withdrawals.vue', 'pages/panel/bank-logos.vue', 'pages/panel/settings.vue'])
  edit('web/' + f, [['background: var(--txt)', 'background: var(--grad)', true]])
edit('web/pages/merchant/api-key.vue', [['border-color: var(--txt); color: #fff;', 'border-color: var(--vio); color: #fff;']])

// 3) KARTU PROFIL sewarna kartu Detail Akun
edit('web/pages/merchant/settings.vue', [['  padding: 26px;\n  background: none;', '  padding: 26px;\n  background: var(--card);\n  box-shadow: var(--shadow-sm);']])

// 4) KOTAK KODE API satu warna (docs + landing #api)
edit('web/components/Code.vue', [
  ['background: #08102a;', 'background: var(--card);'],
  ['padding: 10px 12px; background: var(--bg-soft); border-bottom', 'padding: 10px 12px; background: var(--card); border-bottom'],
])
edit('web/pages/index.vue', [
  ['background: #060b1d; border: 1px solid var(--line);', 'background: var(--card); border: 1px solid var(--line);'],
  ['border-bottom: 1px solid rgba(255,255,255,.08); overflow-x: auto;', 'border-bottom: 1px solid var(--line); overflow-x: auto;'],
  ['background: rgba(45,212,191,.16); color: #fff;', 'background: rgba(var(--vio-rgb),.28); color: #fff;'],
  ['background: #060b1d; margin-left: auto;', 'background: var(--card); margin-left: auto;'],
  ['color: #99f6e4; border: 1px solid rgba(45,212,191,.25);', 'color: var(--vio-ink); border: 1px solid rgba(var(--vio-rgb),.3);'],
  ['.api-copy:hover { background: rgba(45,212,191,.12); }', '.api-copy:hover { background: rgba(var(--vio-rgb),.16); }'],
])

// 5) TOMBOL SALIN di Base URL
edit('web/components/ApiDocs.vue', [
  ['<dd><code>{{ apiBase }}</code></dd>', '<dd class="cp-row"><code>{{ apiBase }}</code><button type="button" class="copy-base" @click="copyBase">{{ baseCopied ? \'Tersalin\' : \'Salin\' }}</button></dd>'],
  ['const B = computed(() => apiBase.value)\n', `const B = computed(() => apiBase.value)
const baseCopied = ref(false)
async function copyBase() {
  const text = apiBase.value
  let done = false
  try { await navigator.clipboard.writeText(text); done = true } catch {
    const ta = document.createElement('textarea')
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    try { done = document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
  }
  if (done) { baseCopied.value = true; setTimeout(() => (baseCopied.value = false), 1400) }
}
`],
  ['.intro { text-align: center; }', `.cp-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.copy-base { padding: 3px 12px; font-size: 11.5px; font-weight: 700; color: var(--vio-ink); border: 1px solid rgba(var(--vio-rgb),.3); background: rgba(var(--vio-rgb),.08); border-radius: 8px; }
.copy-base:hover { background: var(--vio); border-color: var(--vio); color: #fff; }
.intro { text-align: center; }`],
])

// 6) LOGO ikut upload Panel Admin (jangan flash logo.svg bawaan), favicon ikut logo panel
edit('web/components/SiteLogo.vue', [
  ['  <img\n    :key="src"', '  <img\n    v-if="src"\n    :key="src"'],
  ['  />\n</template>', '  />\n  <span v-else class="logo-ph" aria-hidden="true"></span>\n</template>'],
  ['const { logoUrl, siteName } = useSiteSettings()', 'const { logoUrl, siteName, loaded } = useSiteSettings()'],
  ['const src = computed(() => (logoUrl.value && !failed.value ? logoUrl.value : fallback))',
   '// tunggu settings dari panel dimuat dulu; logo.svg bawaan cuma dipakai kalau panel memang belum upload logo\nconst src = computed(() => (logoUrl.value && !failed.value ? logoUrl.value : (loaded.value || failed.value ? fallback : \'\')))'],
  ['<style scoped>\n', '<style scoped>\n.logo-ph { display: block; width: 120px; height: var(--logo-h, 30px); }\n'],
])
edit('web/composables/useSiteSettings.ts', [
  ["settings.value.favicon_url || '/favicon.svg?v=7'", "settings.value.favicon_url || settings.value.logo_url || '/favicon.svg?v=7'"],
])
edit('web/plugins/favicon.client.ts', [
  ['const custom = settings.value.favicon_url', 'const custom = settings.value.favicon_url || settings.value.logo_url'],
  ['watch(() => settings.value.favicon_url, (v) => { if (v) setFavicon(v) })', 'watch(() => settings.value.favicon_url || settings.value.logo_url, (v) => { if (v) setFavicon(v) })'],
])

console.log('\nSelesai: ' + ok + ' perubahan OK, ' + fail + ' gagal.')
if (fail) console.log('Yang GAGAL = teks aslinya beda dari zip v10.1, kabarin gua baris mana.')
