<!-- components/Code.vue - blok kode berwarna (JSON / curl / PHP / JS), tab bahasa, status response -->
<template>
  <div class="code" :class="status ? 'has-st s' + String(status)[0] : ''">
    <div class="bar">
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <button v-for="(t, i) in tabs" :key="t.name" :class="{ on: i === cur }" @click="cur = i">{{ t.name }}</button>
      <span v-if="status" class="st" :class="'s' + String(status)[0]">{{ status }} {{ statusText }}</span>
      <button class="copy" @click="copy">{{ done ? 'Tersalin' : 'Salin' }}</button>
    </div>
    <pre><code v-html="html"></code></pre>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tabs: { name: string; code: string }[] }>()
const cur = ref(0)
const done = ref(false)

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// bungkus token; jika token lintas baris, tutup & buka lagi di tiap baris supaya nomor baris aman
const wrap = (cls: string, t: string) => `<span class="${cls}">${t.replace(/\n/g, `</span>\n<span class="${cls}">`)}</span>`

const JSON_RE = /("(?:\\.|[^"\\\n])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],]/g
const isUrl = (s: string) => /^["'`]https?:\/\//.test(s)
const BR = ['t-b0', 't-b1', 't-b2', 't-b3']

// JSON: kunci per kedalaman, string, angka, boolean, null, URL, tanggal — semua beda warna
function jsonHl(code: string) {
  let depth = 0
  return esc(code).replace(JSON_RE, (m, str, colon, bool) => {
    if (str) {
      if (colon) return wrap('t-key t-k' + (Math.min(depth, 4) % 4), str) + wrap('t-p', colon)
      if (isUrl(str)) return wrap('t-url', str)
      if (/^"\d{4}-\d{2}-\d{2}[ T]/.test(str)) return wrap('t-date', str)
      if (/^"(rp_live_|SB-|sk_|pk_)/i.test(str)) return wrap('t-secret', str)
      if (/^"\d+\.\d{2}"$/.test(str)) return wrap('t-money', str)
      return wrap('t-str', str)
    }
    if (bool) return wrap(m === 'true' ? 't-true' : 't-false', m)
    if (m === 'null') return wrap('t-null', m)
    if (m === '{' || m === '[') { const c = BR[depth % 4]; depth++; return wrap(c, m) }
    if (m === '}' || m === ']') { depth = Math.max(0, depth - 1); return wrap(BR[depth % 4], m) }
    if (m === ',') return wrap('t-p', m)
    return wrap('t-num', m)
  })
}

// cURL: perintah, flag, method, URL, header, body JSON di dalam '...'
function curlHl(code: string) {
  const re = /(\\\n)|(\bcurl\b)|(\s)(-{1,2}[A-Za-z][\w-]*)|\b(GET|POST|PUT|PATCH|DELETE)\b|('(?:[^'\\]|\\.)*')|("(?:\\.|[^"\\])*")|(https?:\/\/[^\s'"\\]+)|(\$\{?[A-Za-z_]\w*\}?)|(#[^\n]*)/g
  let out = ''
  let last = 0
  for (const mt of code.matchAll(re)) {
    out += esc(code.slice(last, mt.index))
    last = mt.index! + mt[0].length
    const [m, cont, cmd, sp, flag, meth, sq, dq, url, vr, com] = mt
    if (cont) out += wrap('t-p', '\\') + '\n'
    else if (cmd) out += wrap('t-cmd', m)
    else if (flag) out += esc(sp) + wrap('t-flag', flag)
    else if (meth) out += wrap('t-m t-' + meth.toLowerCase(), m)
    else if (sq) {
      const inner = sq.slice(1, -1)
      out += wrap('t-p', "'") + (/^\s*[\[{]/.test(inner) ? jsonHl(inner) : wrap('t-str', esc(inner))) + wrap('t-p', "'")
    } else if (dq) {
      const inner = dq.slice(1, -1)
      const h = inner.match(/^([A-Za-z-]+)(:\s*)(.*)$/s)
      if (h) out += wrap('t-p', '"') + wrap('t-hk', esc(h[1])) + wrap('t-p', esc(h[2])) + wrap('t-hv', esc(h[3])) + wrap('t-p', '"')
      else out += isUrl(dq) ? wrap('t-url', esc(dq)) : wrap('t-str', esc(dq))
    } else if (url) out += wrap('t-url', esc(m))
    else if (vr) out += wrap('t-var', esc(m))
    else if (com) out += wrap('t-com', esc(m))
  }
  return out + esc(code.slice(last))
}

const GEN_RE = /((?<![:\w"'`])\/\/[^\n]*|(?<![\w$&"'`])#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(\$[A-Za-z_]\w*)|\b(GET|POST|PUT|PATCH|DELETE)\b|\b(function|return|const|let|var|if|else|echo|new|use|require|import|from|await|async|try|catch|throw|exit|isset|foreach|as|def|print|for|in|true|false|null|None|True|False)\b|\b([A-Za-z_]\w*)(?=\()|\b(\d+(?:\.\d+)?)\b/g
function genHl(code: string) {
  return esc(code).replace(GEN_RE, (m, com, str, vr, meth, kw, fn, num) => {
    if (com) return wrap('t-com', m)
    if (str) return isUrl(str) ? wrap('t-url', m) : wrap('t-str', m)
    if (vr) return wrap('t-var', m)
    if (meth) return wrap('t-m t-' + meth.toLowerCase(), m)
    if (kw) return wrap('t-kw', m)
    if (fn) return wrap('t-fn', m)
    if (num) return wrap('t-num', m)
    return m
  })
}

const html = computed(() => {
  const t = props.tabs[cur.value]
  const code = t?.code || ''
  const looksJson = /^\s*[\[{]/.test(code)
  const looksCurl = /^\s*curl\b/.test(code)
  const body = looksJson ? jsonHl(code) : looksCurl ? curlHl(code) : genHl(code)
  return body.split('\n').map(l => `<span class="ln">${l}</span>`).join('')
})

const status = computed(() => {
  const m = (props.tabs[cur.value]?.name || '').match(/\b([1-5]\d\d)\b/)
  return m ? Number(m[1]) : 0
})
const statusText = computed(() => ({ 200: 'OK', 201: 'Created', 202: 'Accepted', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 412: 'Precondition Failed', 429: 'Too Many Requests', 500: 'Server Error' } as Record<number, string>)[status.value] || '')

function legacyCopy(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
  document.body.appendChild(ta); ta.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch {}
  document.body.removeChild(ta)
  return ok
}
async function copy() {
  const text = props.tabs[cur.value]?.code || ''
  let ok = false
  try { await navigator.clipboard.writeText(text); ok = true } catch { ok = legacyCopy(text) }
  if (ok) { done.value = true; setTimeout(() => (done.value = false), 1400) }
}
</script>

<style scoped>
/* Blok kode gelap — biru tua */
.code { position: relative; background: #0a122b; margin: 14px 0 22px; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.05), 0 10px 28px rgba(var(--shadow-rgb),.07); max-width: 100%; }
.code.has-st { border-left: 4px solid var(--line-2); }
.code.has-st.s2 { border-left-color: #059669; }
.code.has-st.s4 { border-left-color: #d97706; }
.code.has-st.s5 { border-left-color: #e11d48; }
.bar { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 10px 12px; background: var(--card); border-bottom: 1px solid var(--line); }
.dots { display: inline-flex; gap: 6px; margin-right: 8px; }
.dots i { width: 9px; height: 9px; border-radius: 50%; background: #f87171; }
.dots i:nth-child(2) { background: #fbbf24; } .dots i:nth-child(3) { background: #34d399; }
.bar button { padding: 5px 11px; font-size: 11.5px; font-weight: 600; color: var(--dim); border-radius: 8px; border: 1px solid transparent; }
.bar button:hover { color: var(--txt); background: var(--card); border-color: var(--line); }
.bar button.on { color: #fff; background: var(--vio); }
.bar .copy { margin-left: auto; color: var(--vio); border-color: rgba(var(--vio-rgb),.25); background: rgba(var(--vio-rgb),.06); }
.bar .copy:hover { color: #fff; background: var(--vio); border-color: var(--vio); }
.st { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 999px; margin-left: 6px; letter-spacing: .2px; }
.st.s2 { color: #34d399; background: rgba(5,150,105,.1); border: 1px solid rgba(5,150,105,.35); }
.st.s4 { color: #fbbf24; background: rgba(217,119,6,.1); border: 1px solid rgba(217,119,6,.35); }
.st.s5 { color: #fb7185; background: rgba(225,29,72,.08); border: 1px solid rgba(225,29,72,.35); }
pre { margin: 0; padding: 14px 6px 16px 0; overflow-x: auto; -webkit-overflow-scrolling: touch; tab-size: 2; font-size: 12.5px; line-height: 1.7; color: var(--txt); counter-reset: ln; font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; }
pre code { display: block; min-width: max-content; }
:deep(.ln) { display: block; padding-left: 52px; position: relative; white-space: pre; counter-increment: ln; }
:deep(.ln::before) { content: counter(ln); position: absolute; left: 0; width: 38px; text-align: right; color: #5b6b93; user-select: none; }
:deep(.t-key) { font-weight: 600; }
:deep(.t-k0) { color: #5eead4; }
:deep(.t-k1) { color: #67e8f9; }
:deep(.t-k2) { color: #a5b4fc; }
:deep(.t-k3) { color: #f0abfc; }
:deep(.t-str) { color: #86efac; }
:deep(.t-money) { color: #fcd34d; font-weight: 600; }
:deep(.t-date) { color: #fdba74; }
:deep(.t-secret) { color: #fda4af; }
:deep(.t-num) { color: #fbbf24; }
:deep(.t-true) { color: #4ade80; font-weight: 700; }
:deep(.t-false) { color: #fb7185; font-weight: 700; }
:deep(.t-bool) { color: #f9a8d4; font-weight: 700; }
:deep(.t-null) { color: #c4b5fd; font-style: italic; }
:deep(.t-p) { color: #94a3c7; }
:deep(.t-b0) { color: #fbbf24; font-weight: 700; }
:deep(.t-b1) { color: #f472b6; font-weight: 700; }
:deep(.t-b2) { color: #60a5fa; font-weight: 700; }
:deep(.t-b3) { color: #34d399; font-weight: 700; }
:deep(.t-com) { color: #64748b; font-style: italic; }
:deep(.t-kw) { color: #f9a8d4; font-weight: 600; }
:deep(.t-fn) { color: #93c5fd; }
:deep(.t-cmd) { color: #fb923c; font-weight: 800; }
:deep(.t-var) { color: #fdba74; }
:deep(.t-flag) { color: #c084fc; font-weight: 700; }
:deep(.t-hk) { color: #67e8f9; font-weight: 600; }
:deep(.t-hv) { color: #86efac; }
:deep(.t-url) { color: #7dd3fc; font-weight: 600; text-decoration: underline; text-decoration-color: rgba(125,211,252,.4); text-underline-offset: 3px; }
:deep(.t-m) { font-weight: 800; border-radius: 5px; padding: 0 5px; }
:deep(.t-get) { color: #34d399; background: rgba(5,150,105,.14); }
:deep(.t-post) { color: #fbbf24; background: rgba(217,119,6,.16); }
:deep(.t-put), :deep(.t-patch) { color: #5eead4; background: rgba(13,148,136,.14); }
:deep(.t-delete) { color: #fb7185; background: rgba(225,29,72,.14); }
@media (max-width: 640px) {
  .code { border-radius: 12px; margin: 12px -4px 18px; }
  .bar { gap: 3px; padding: 8px; }
  .bar button { padding: 5px 9px; font-size: 11px; }
  .dots { display: none; }
  pre { font-size: 11.5px; line-height: 1.65; }
  :deep(.ln) { padding-left: 40px; }
  :deep(.ln::before) { width: 28px; }
}
</style>
