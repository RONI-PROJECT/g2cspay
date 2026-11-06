-- Hapus logo/favicon/OG custom lama dari DB supaya brand baru (public/*) langsung dipakai.
-- Alternatif tanpa psql:  npm run brand:reset   (butuh DATABASE_URL)
DELETE FROM app_assets   WHERE key IN ('logo','favicon','og');
DELETE FROM app_settings WHERE key IN ('logo_url','favicon_url','og_url');
