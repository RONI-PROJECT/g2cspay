ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS merchant_code text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_merchant_code
  ON public.users (merchant_code) WHERE merchant_code IS NOT NULL;
