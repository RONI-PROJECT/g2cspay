-- Tambah kolom ip_whitelist di tabel api_keys
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS ip_whitelist text[] DEFAULT NULL;

-- Kolom buat response format konsisten (opsional)
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS "updatedAt" text DEFAULT NULL;
