# Integrasi PHP — G2CSPAY

1. Import `schema.sql` ke MySQL.
2. Isi `config.php`:
   - `G2CSPAY_BASE_URL`: domain G2CSPAY
   - `G2CSPAY_API_KEY`: Dashboard > Kredensial (1 credential aja)
   - `G2CSPAY_WEBHOOK_SECRET`: Dashboard > Callback
3. Set URL notifikasi di Dashboard > Callback ke `https://tokomu.com/callback.php`.

Alur: `checkout.php` memanggil `POST /api/v1/charge`, lalu redirect ke `payment_url`.
`callback.php` menerima notifikasi dan memverifikasi
`signature_key = SHA512(order_id + status_code + gross_amount + secret)`.
Balas HTTP 200 agar notifikasi tidak dikirim ulang.
