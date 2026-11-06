#!/data/data/com.termux/files/usr/bin/bash
set -e
SRC=~/g2cspay
DEST=/sdcard/g2cspay-backup
OUT=$DEST/$(date +%Y-%m-%d_%H-%M)
mkdir -p "$OUT"
cd "$SRC"

echo "▶ env"
tar -czf "$OUT/env.tar.gz" $(ls -A .env .env.local .env.vercel .env.example website/.env 2>/dev/null)
echo "  ✔ env.tar.gz"

echo "▶ source"
tar -czf "$OUT/source.tar.gz" -C ~ \
  --exclude='g2cspay/node_modules' --exclude='g2cspay/.nuxt' \
  --exclude='g2cspay/.output' --exclude='g2cspay/.vercel' \
  --exclude='g2cspay/.env*' --exclude='g2cspay/website/.env' \
  g2cspay
echo "  ✔ source.tar.gz"

echo "▶ database"
DBURL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
[ -z "$DBURL" ] && { echo "  ✘ DATABASE_URL kosong di .env"; exit 1; }
command -v pg_dump >/dev/null || pkg install -y postgresql
pg_dump "$DBURL" --no-owner --no-acl -f "$OUT/database.sql"
gzip -f "$OUT/database.sql"
echo "  ✔ database.sql.gz"

echo "▶ cleanup (simpan 7 terakhir)"
cd "$DEST" && ls -1dt */ | tail -n +8 | xargs -r rm -rf

echo; echo "SELESAI -> $OUT"; ls -lh "$OUT"
