-- G2CSPAY: schema lengkap (idempotent, aman dijalankan berulang). Jalankan di SQL editor Neon atau: psql $DATABASE_URL -f migrations/schema.sql

   CREATE TABLE IF NOT EXISTS users (
      id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email             TEXT UNIQUE NOT NULL,
      password          TEXT NOT NULL,
      name              TEXT,
      phone             TEXT,
      role              TEXT NOT NULL DEFAULT 'user',
      status            TEXT NOT NULL DEFAULT 'active',
      balance           BIGINT NOT NULL DEFAULT 0,
      "webhookUrl"      TEXT,
      "webhookSecret"   TEXT,
      "createdAt"       TEXT NOT NULL,
      "lastLoginAt"     TEXT,
      totp_enabled      BOOLEAN DEFAULT false,
      totp_secret       TEXT,
      totp_backup_codes TEXT,
      totp_verified_at  TEXT,
      "isAdmin"         BOOLEAN DEFAULT false,
      "adminBalance"    BIGINT NOT NULL DEFAULT 0
   );

   ALTER TABLE users ADD COLUMN IF NOT EXISTS store_name TEXT;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS merchant_code TEXT;

   CREATE TABLE IF NOT EXISTS transactions (
      "trxId"            TEXT PRIMARY KEY,
      "userId"           TEXT,
      status             TEXT NOT NULL,
      amount             BIGINT NOT NULL,
      fee                BIGINT NOT NULL DEFAULT 0,
      net                BIGINT NOT NULL DEFAULT 0,
      "merchantAmount"   BIGINT NOT NULL DEFAULT 0,
      "feePercent"       NUMERIC NOT NULL DEFAULT 0,
      total              BIGINT NOT NULL,
      "payAmount"        BIGINT NOT NULL,
      "qrString"         TEXT NOT NULL,
      "qrImageUrl"       TEXT,
      "callbackUrl"      TEXT,
      "callbackSecret"   TEXT,
      "idempotencyKey"   TEXT,
      metadata           JSONB,
      "createdAt"        TEXT NOT NULL,
      "expiresAt"        TEXT NOT NULL,
      "paidAt"           TEXT,
      entry              JSONB,
      "webhookState"     TEXT,
      "webhookAttempts"  INTEGER NOT NULL DEFAULT 0,
      "webhookNextAt"    TEXT,
      "webhookLastError" TEXT
   );
   CREATE INDEX IF NOT EXISTS idx_status ON transactions(status);
   CREATE INDEX IF NOT EXISTS idx_created ON transactions("createdAt" DESC);
   CREATE INDEX IF NOT EXISTS idx_pay_amount ON transactions("payAmount");
   CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency ON transactions("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;
   CREATE INDEX IF NOT EXISTS idx_webhook_due ON transactions("webhookNextAt") WHERE "webhookState" = 'PENDING';
   CREATE INDEX IF NOT EXISTS idx_pending_expiry ON transactions("expiresAt") WHERE status = 'PENDING';

   CREATE TABLE IF NOT EXISTS gobiz_history (
      "gobizId"      TEXT PRIMARY KEY,
      amount         BIGINT NOT NULL,
      time           TEXT,
      "matchedTrxId" TEXT,
      raw            JSONB,
      "seenAt"       TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_hist_matched ON gobiz_history("matchedTrxId");
   CREATE INDEX IF NOT EXISTS idx_hist_seen ON gobiz_history("seenAt" DESC);

   CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL
   );

   CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      "userId"    TEXT NOT NULL,
      "createdAt" TEXT NOT NULL,
      "expiresAt" TEXT NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT
   );
   CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions("userId");
   CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions("expiresAt");

   CREATE TABLE IF NOT EXISTS api_keys (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"     TEXT NOT NULL,
      name         TEXT,
      key          TEXT UNIQUE NOT NULL,
      secret       TEXT,
      status       TEXT NOT NULL DEFAULT 'active',
      environment  TEXT NOT NULL DEFAULT 'production',
      "lastUsedAt" TEXT,
      "createdAt"  TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys("userId");

   CREATE TABLE IF NOT EXISTS withdrawals (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "wdrId"       TEXT UNIQUE NOT NULL,
      "userId"      TEXT NOT NULL,
      amount        BIGINT NOT NULL,
      fee           BIGINT NOT NULL DEFAULT 0,
      received      BIGINT NOT NULL,
      bank          TEXT,
      account       TEXT,
      status        TEXT NOT NULL DEFAULT 'PENDING',
      note          TEXT,
      "createdAt"   TEXT NOT NULL,
      "processedAt" TEXT
   );

   CREATE TABLE IF NOT EXISTS notifications (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"    TEXT NOT NULL,
      type        TEXT,
      title       TEXT,
      body        TEXT,
      data        JSONB,
      read        BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications("userId", "createdAt" DESC);

   CREATE TABLE IF NOT EXISTS webhook_logs (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id     TEXT,
      trx_id      TEXT,
      event       TEXT,
      url         TEXT,
      http_status INTEGER,
      latency_ms  INTEGER,
      status      TEXT,
      error       TEXT,
      sent_at     TEXT
   );
   CREATE INDEX IF NOT EXISTS idx_wh_logs_trx ON webhook_logs(trx_id);

   CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT
   );

   CREATE TABLE IF NOT EXISTS app_assets (
      key         TEXT PRIMARY KEY,
      mime        TEXT NOT NULL,
      data        TEXT NOT NULL,
      "updatedAt" TEXT DEFAULT (now())::text
   );

   ALTER TABLE users ADD COLUMN IF NOT EXISTS store_name TEXT;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS merchant_code TEXT;
   DO $$ BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_merchant_code ON users (merchant_code) WHERE merchant_code IS NOT NULL;
   EXCEPTION WHEN OTHERS THEN NULL;
   END $$;

   ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS ip_whitelist TEXT[] DEFAULT NULL;
   ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS "updatedAt" TEXT;

   -- notifications: kode memakai message / meta / "isRead"
   ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
   ALTER TABLE notifications ADD COLUMN IF NOT EXISTS meta JSONB;
   ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

   CREATE TABLE IF NOT EXISTS admin_sessions (
      token        TEXT PRIMARY KEY,
      username     TEXT,
      "createdAt"  TIMESTAMPTZ DEFAULT NOW(),
      "expiresAt"  TEXT NOT NULL,
      "lastSeenAt" TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX IF NOT EXISTS idx_admin_sessions_exp ON admin_sessions("expiresAt");

   ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS "updatedAt" TEXT DEFAULT (now())::text;
   INSERT INTO app_settings (key, value) VALUES
      ('maintenance_mode', 'false'), ('wd_min', '65000'), ('wd_fee_percent', '2.5'), ('wd_fee_flat', '4500'),
      ('fee_transaction_percent', '1.8'),
      ('bg_effect', 'aurora'), ('bg_effect_intensity', '1.0')
   ON CONFLICT (key) DO NOTHING;

   CREATE TABLE IF NOT EXISTS transactions_sandbox (
      "trxId"         TEXT PRIMARY KEY,
      "userId"        TEXT NOT NULL,
      status          TEXT NOT NULL,
      amount          BIGINT NOT NULL,
      fee             BIGINT NOT NULL DEFAULT 0,
      total           BIGINT NOT NULL,
      "amountToPay"   BIGINT NOT NULL,
      "qrString"      TEXT NOT NULL,
      "qrImageUrl"    TEXT,
      "createdAt"     TEXT NOT NULL,
      "expiresAt"     TEXT NOT NULL,
      "paidAt"        TEXT,
      "orderId"       TEXT,
      "customerName"  TEXT,
      "customerEmail" TEXT
   );
   CREATE INDEX IF NOT EXISTS idx_sbx_user_order ON transactions_sandbox("userId", "orderId");
   CREATE INDEX IF NOT EXISTS idx_sbx_created ON transactions_sandbox("createdAt" DESC);
