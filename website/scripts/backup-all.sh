#!/data/data/com.termux/files/usr/bin/bash
# ═══════════════════════════════════════════════════════════
# Full backup CSPay ke /sdcard
# ═══════════════════════════════════════════════════════════

set -e

SRC=~/gateway
DEST=/sdcard/cspay-backup
DATE=$(date +%Y-%m-%d_%H-%M)
STAMP_DIR=$DEST/$DATE

echo "═══════════════════════════════════════════════════════════"
echo "  CSPay Full Backup"
echo "  Source: $SRC"
echo "  Dest:   $STAMP_DIR"
echo "═══════════════════════════════════════════════════════════"

mkdir -p "$STAMP_DIR"

# ─── 1. SOURCE CODE (tanpa node_modules & .nuxt) ───
echo ""
echo "▶ [1/4] Backup source code..."
tar -czf "$STAMP_DIR/source.tar.gz" \
  -C ~ \
  --exclude='gateway/node_modules' \
  --exclude='gateway/.nuxt' \
  --exclude='gateway/.output' \
  --exclude='gateway/.git' \
  --exclude='gateway/backups' \
  gateway
echo "  ✔ source.tar.gz — $(du -h "$STAMP_DIR/source.tar.gz" | cut -f1)"

# ─── 2. ENV & CONFIG (sensitive, dipisah) ───
echo ""
echo "▶ [2/4] Backup .env & config..."
tar -czf "$STAMP_DIR/env-config.tar.gz" \
  -C ~/gateway \
  .env \
  nuxt.config.ts \
  package.json \
  package-lock.json \
  2>/dev/null || true
echo "  ✔ env-config.tar.gz — $(du -h "$STAMP_DIR/env-config.tar.gz" | cut -f1)"

# ─── 3. DATABASE DUMP ───
echo ""
echo "▶ [3/4] Backup database..."

# Cek apakah ada DATABASE_URL
if [ -f ~/gateway/.env ]; then
  source ~/gateway/.env 2>/dev/null || true
fi

if [ -n "$DATABASE_URL" ] && command -v pg_dump &>/dev/null; then
  echo "  → pg_dump dari Neon..."
  pg_dump "$DATABASE_URL" --no-owner --no-acl > "$STAMP_DIR/database.sql" 2>/dev/null && \
    echo "  ✔ database.sql — $(du -h "$STAMP_DIR/database.sql" | cut -f1)" || \
    echo "  ⚠ pg_dump gagal — cek koneksi DB"
elif [ -d ~/gateway/data/pglite ]; then
  echo "  → PGlite local (tar folder)"
  tar -czf "$STAMP_DIR/pglite-data.tar.gz" -C ~/gateway data
  echo "  ✔ pglite-data.tar.gz"
else
  echo "  ⚠ Gak nemu DB. Skip."
  echo "  → Coba install postgres-client: pkg install postgresql"
fi

# ─── 4. MANIFEST ───
echo ""
echo "▶ [4/4] Bikin manifest..."
cat > "$STAMP_DIR/MANIFEST.txt" << MANIFEST
═══════════════════════════════════════════════════════════
  CSPay Backup
═══════════════════════════════════════════════════════════
Date:        $(date)
Hostname:    $(hostname)
Termux Home: $HOME
Gateway Dir: $SRC

Files:
$(ls -la "$STAMP_DIR")

Source size (excluded node_modules):
$(du -sh "$STAMP_DIR/source.tar.gz")

Database:
$(ls -la "$STAMP_DIR/database.sql" 2>/dev/null || echo "  no database.sql")
$(ls -la "$STAMP_DIR/pglite-data.tar.gz" 2>/dev/null || echo "")

Restore instructions:
═══════════════════════════════════════════════════════════
1. Extract source:
   cd ~
   tar -xzf $STAMP_DIR/source.tar.gz
2. Extract env:
   cd ~/gateway
   tar -xzf $STAMP_DIR/env-config.tar.gz
3. Restore database:
   psql "\$DATABASE_URL" < $STAMP_DIR/database.sql
   OR (PGlite):
   tar -xzf $STAMP_DIR/pglite-data.tar.gz -C ~/gateway
4. Install deps:
   cd ~/gateway
   npm install
5. Run:
   npm run dev
═══════════════════════════════════════════════════════════
MANIFEST

echo "  ✔ MANIFEST.txt"

# ─── BERSIHIN BACKUP LAMA (simpen 7 terakhir) ───
echo ""
echo "▶ Cleanup backup lama (simpen 7 terakhir)..."
cd "$DEST"
ls -1dt */ 2>/dev/null | tail -n +8 | xargs -r rm -rf
BACKUP_COUNT=$(ls -1d */ 2>/dev/null | wc -l)
echo "  ✔ Total backup sekarang: $BACKUP_COUNT"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ BACKUP SELESAI"
echo "  📁 $STAMP_DIR"
echo "  📊 Total size: $(du -sh "$STAMP_DIR" | cut -f1)"
echo "═══════════════════════════════════════════════════════════"
echo ""
ls -lh "$STAMP_DIR"
