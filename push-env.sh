#!/usr/bin/env bash
# Push variabel dari .env ke Vercel (production + preview + development).
# Aman: hapus dulu di SEMUA environment (penyebab error "already exists"),
# lalu tambah ulang; gagal ya dilaporkan, bukan disembunyikan.
# Token GoBiz TIDAK disentuh — disimpan di database (tabel meta), jadi awet.
set -u
ENVS=(production preview development)
SKIP_RE='^(VERCEL_|NX_|TURBO_|GOPAY_ACCESS_TOKEN$|GOPAY_MERCHANT_ID$)'
fail=0
while IFS= read -r line || [ -n "$line" ]; do
   line="${line%$'\r'}"
   [ -z "$line" ] && continue
   case "$line" in \#*) continue ;; esac
   key="${line%%=*}"; val="${line#*=}"
   val="${val%\"}"; val="${val#\"}"
   [ -z "$key" ] && continue
   [ -z "$val" ] && continue
   [[ "$key" =~ $SKIP_RE ]] && continue
   printf '>> %s\n' "$key"
   yes | vercel env rm "$key" >/dev/null 2>&1          # tanpa target = hapus dari semua env
   for e in "${ENVS[@]}"; do
      if ! printf '%s' "$val" | vercel env add "$key" "$e" >/dev/null 2>&1; then
         echo "   !! GAGAL $key -> $e"; fail=1
      fi
   done
done < .env
[ $fail -eq 0 ] && echo "== Selesai, semua sukses. Cek: vercel env ls ==" || echo "== Selesai dengan error di atas =="
echo "Catatan: redeploy (vercel --prod) agar NUXT_PUBLIC_* ikut ter-build."
