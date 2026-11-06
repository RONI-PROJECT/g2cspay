#!/data/data/com.termux/files/usr/bin/bash
set -e
SRC=~/g2cspay
OUT=/sdcard/g2cspay-backup/$(date +%Y-%m-%d_%H-%M)
mkdir -p "$OUT"
cd "$SRC"

echo "▶ env"
ENVS=$(ls -A .env .env.local .env.vercel .env.example 2>/dev/null | tr '\n' ' ')
tar -czf "$OUT/env.tar.gz" $ENVS
echo "  ✔ $ENVS"

echo "▶ source"
tar -czf "$OUT/source.tar.gz" -C ~ \
  --exclude='g2cspay/node_modules' --exclude='g2cspay/.nuxt' \
  --exclude='g2cspay/.output' --exclude='g2cspay/.vercel' --exclude='g2cspay/.git' \
  g2cspay
echo "  ✔ source.tar.gz"

echo "▶ database"
DBURL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
if [ -z "$DBURL" ]; then echo "  ✘ DATABASE_URL kosong di .env"; exit 1; fi
command -v pg_dump >/dev/null || pkg install -y postgresql
pg_dump "$DBURL" --no-owner --no-acl -f "$OUT/database.sql"
echo "  ✔ database.sql"

echo; echo "SELESAI -> $OUT"; ls -lh "$OUT"
