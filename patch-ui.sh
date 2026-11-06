#!/bin/bash
set -e
python3 - <<'PY'
import re
G_A="radial-gradient(circle, rgba(var(--vio-rgb),.38), transparent 70%)"
G_B="radial-gradient(circle, rgba(var(--vio-rgb),.26), transparent 70%)"
R="linear-gradient(160deg, rgba(var(--vio-rgb),.16), rgba(var(--vio-rgb),.03) 70%)"
P="radial-gradient(900px 500px at 12% -10%, rgba(var(--vio-rgb),.28), transparent 60%), radial-gradient(800px 500px at 100% 110%, rgba(var(--vio-rgb),.2), transparent 60%), var(--bg)"
def sub(path, fn):
    s=open(path,encoding='utf-8').read(); n=fn(s)
    open(path,'w',encoding='utf-8').write(n); print('ok',path, s!=n)
def blk(sel, val):
    def f(s): return re.sub(r'(\n\s*'+re.escape(sel)+r'\s*\{[^}]*?)background:\s*none;', lambda m:m.group(1)+'background: '+val+';', s, count=1)
    return f
def chain(*fs):
    def f(s):
        for x in fs: s=x(s)
        return s
    return f
sub('web/pages/login.vue', chain(blk('.glow-a',G_A),blk('.glow-b',G_B),blk('.auth-right',R)))
sub('web/pages/register.vue', chain(
  lambda s: s.replace('top: -200px; left: -140px; background: none;','top: -200px; left: -140px; background: '+G_A+';'),
  lambda s: s.replace('top: 20%; right: -240px; background: none;','top: 20%; right: -240px; background: '+G_B+';'),
  lambda s: s.replace('border-left: 1px solid var(--line); background: none; }','border-left: 1px solid var(--line); background: '+R+'; }')))
sub('web/pages/panel/login.vue', chain(blk('.page',P),blk('.glow-a',G_A),blk('.glow-b',G_B)))
def nav(s):
    s=s.replace('''        <nav class="links">
          <a href="#api">API</a>
          <a href="#fitur">Fitur</a>
          <a href="#biaya">Biaya</a>
          <a href="#alur">Alur</a>
          <NuxtLink to="/docs">Docs</NuxtLink>
        </nav>
        <NuxtLink to="/" class="brand"><SiteLogo /></NuxtLink>''','''        <NuxtLink to="/" class="brand"><SiteLogo /></NuxtLink>
        <nav class="links">
          <a href="#api">API</a>
          <a href="#fitur">Fitur</a>
          <a href="#biaya">Biaya</a>
          <a href="#alur">Alur</a>
          <NuxtLink to="/docs">Docs</NuxtLink>
        </nav>''')
    s=s.replace('grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; }','grid-template-columns: auto 1fr auto; align-items: center; gap: 16px; }')
    s=s.replace('flex-shrink: 0; justify-self: center; }','flex-shrink: 0; justify-self: start; }')
    s=s.replace('color: var(--dim); justify-self: start; }','color: var(--dim); justify-self: center; }')
    s=s.replace('.nav-in { grid-template-columns: 1fr auto 1fr; padding: 0 14px; gap: 8px; height: 60px; }\n  .brand { grid-column: 2; }','.nav-in { grid-template-columns: auto 1fr auto; padding: 0 14px; gap: 8px; height: 60px; }\n  .brand { grid-column: 1; justify-self: start; }')
    return s
sub('web/pages/index.vue', nav)
PY
cat >> web/assets/css/main.css <<'CSS'

/* Turnstile: wadah & loading ikut tema */
.turnstile-el, .ts-el {
  position: relative; width: 100%; max-width: 300px; min-height: 65px; margin-inline: auto;
  border: 1px solid var(--line-2); border-radius: 12px; overflow: hidden;
  background: rgba(var(--vio-rgb), .10);
}
.turnstile-el::before, .ts-el::before {
  content: ''; position: absolute; inset: 0; z-index: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(var(--vio-rgb), .28) 50%, transparent 100%);
  background-size: 200% 100%; animation: tsShimmer 1.4s linear infinite;
}
.turnstile-el iframe, .ts-el iframe { position: relative; z-index: 1; display: block; max-width: 100%; }
@keyframes tsShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
CSS
echo SELESAI
