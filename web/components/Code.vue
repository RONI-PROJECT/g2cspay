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
const GEN_RE = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(\$[A-Za-z_]\w*)|(\s--?[A-Za-z][\w-]*)|\b(GET|POST|PUT|PATCH|DELETE)\b|\b(function|return|const|let|var|if|else|echo|new|use|require|import|from|await|async|curl_init|curl_setopt|json_encode|json_decode|http_response_code|hash_hmac|hash_equals|fetch|try|catch|throw|exit|header|isset|foreach|as)\b|\b(\d+(?:\.\d+)?)\b/g
const isUrl = (s: string) => /^["'`]https?:\/\//.test(s)

function jsonHl(code: string) {
  return esc(code).replace(JSON_RE, (m, str, colon, bool) => {
    if (str) {
      if (colon) return wrap('t-key', str) + wrap('t-p', colon)
      return isUrl(str) ? wrap('t-url', str) : wrap('t-str', str)
    }
    if (bool) return wrap('t-bool', m)
    if (m === 'null') return wrap('t-null', m)
    if (/^[{}\[\],]$/.test(m)) return wrap('t-p', m)
    return wrap('t-num', m)
  })
}
function genHl(code: string) {
  return esc(code).replace(GEN_RE, (m, com, str, vr, flag, meth, kw, num) => {
    if (com) return wrap('t-com', m)
    if (str) return isUrl(str) ? wrap('t-url', m) : wrap('t-str', m)
    if (vr) return wrap('t-var', m)
    if (flag) return m.charAt(0) + wrap('t-flag', m.slice(1))
    if (meth) return wrap('t-m t-' + meth.toLowerCase(), m)
    if (kw) return wrap('t-kw', m)
    if (num) return wrap('t-num', m)
    return m
  })
}

const html = computed(() => {
  const t = props.tabs[cur.value]
  const code = t?.code || ''
  const looksJson = /^\s*[\[{]/.test(code)
  const body = looksJson ? jsonHl(code) : genHl(code)
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
/* Blok kode terang — senada kartu halaman Webhook (putih + biru) */
.code { position: relative; margin: 14px 0 22px; border-radius: 14px; overflow: hidden; background: var(--card); border: 1px solid var(--line); box-shadow: 0 1px 2px rgba(var(--shadow-rgb),.05), 0 10px 28px rgba(var(--shadow-rgb),.07); max-width: 100%; }
.code.has-st { border-left: 4px solid var(--line-2); }
.code.has-st.s2 { border-left-color: #059669; }
.code.has-st.s4 { border-left-color: #d97706; }
.code.has-st.s5 { border-left-color: #e11d48; }
.bar { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 10px 12px; background: var(--bg-soft); border-bottom: 1px solid var(--line); }
.dots { display: inline-flex; gap: 6px; margin-right: 8px; }
.dots i { width: 9px; height: 9px; border-radius: 50%; background: #f87171; }
.dots i:nth-child(2) { background: #fbbf24; } .dots i:nth-child(3) { background: #34d399; }
.bar button { padding: 5px 11px; font-size: 11.5px; font-weight: 600; color: var(--dim); border-radius: 8px; border: 1px solid transparent; }
.bar button:hover { color: var(--txt); background: var(--card); border-color: var(--line); }
.bar button.on { color: #fff; background: var(--vio); }
.bar .copy { margin-left: auto; color: var(--vio); border-color: rgba(var(--vio-rgb),.25); background: rgba(var(--vio-rgb),.06); }
.bar .copy:hover { color: #fff; background: var(--vio); border-color: var(--vio); }
.st { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 999px; margin-left: 6px; letter-spacing: .2px; }
.st.s2 { color: #047857; background: rgba(5,150,105,.1); border: 1px solid rgba(5,150,105,.35); }
.st.s4 { color: #b45309; background: rgba(217,119,6,.1); border: 1px solid rgba(217,119,6,.35); }
.st.s5 { color: #be123c; background: rgba(225,29,72,.08); border: 1px solid rgba(225,29,72,.35); }
pre { margin: 0; padding: 14px 6px 16px 0; overflow-x: auto; -webkit-overflow-scrolling: touch; tab-size: 2; font-size: 12.5px; line-height: 1.7; color: #1e293b; counter-reset: ln; font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; }
pre code { display: block; min-width: max-content; }
:deep(.ln) { display: block; padding-left: 52px; position: relative; white-space: pre; counter-increment: ln; }
:deep(.ln::before) { content: counter(ln); position: absolute; left: 0; width: 38px; text-align: right; color: #94a3b8; user-select: none; }
:deep(.t-key) { color: #0f766e; font-weight: 600; }
:deep(.t-str) { color: #047857; }
:deep(.t-num) { color: #b45309; }
:deep(.t-bool) { color: #be185d; font-weight: 700; }
:deep(.t-null) { color: #6d28d9; font-style: italic; }
:deep(.t-p) { color: #64748b; }
:deep(.t-com) { color: #94a3b8; font-style: italic; }
:deep(.t-kw) { color: #be185d; font-weight: 600; }
:deep(.t-var) { color: #c2410c; }
:deep(.t-flag) { color: #0369a1; font-weight: 600; }
:deep(.t-url) { color: #0369a1; font-weight: 700; text-decoration: underline; text-decoration-color: rgba(3,105,161,.5); text-underline-offset: 3px; background: rgba(3,105,161,.08); border-radius: 5px; padding: 1px 4px; }
:deep(.t-m) { font-weight: 800; border-radius: 5px; padding: 0 5px; }
:deep(.t-get) { color: #047857; background: rgba(5,150,105,.1); }
:deep(.t-post) { color: #b45309; background: rgba(217,119,6,.12); }
:deep(.t-put), :deep(.t-patch) { color: #0f766e; background: rgba(13,148,136,.1); }
:deep(.t-delete) { color: #be123c; background: rgba(225,29,72,.1); }
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
