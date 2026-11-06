#!/usr/bin/env bash
# Push semua variabel dari .env ke Vercel (Production) — timpa yang lama.
while IFS= read -r line || [ -n "$line" ]; do
   line="${line%$'\r'}"
   [ -z "$line" ] && continue
   case "$line" in \#*) continue ;; esac
   key="${line%%=*}"
   val="${line#*=}"
   val="${val%\"}"; val="${val#\"}"     # buang kutip
   [ -z "$key" ] && continue
   [ -z "$val" ] && continue            # skip yang kosong
   printf '>> %s\n' "$key"
   yes | vercel env remove "$key" production >/dev/null 2>&1
   printf '%s' "$val" | vercel env add "$key" --environment production >/dev/null
done < .env
echo "== Selesai. Cek: vercel env ls production =="
