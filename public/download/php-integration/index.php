<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Demo G2CSPAY</title>
<style>
   body { font-family: system-ui, sans-serif; background: #fafafa; padding: 20px; }
   .card { max-width: 400px; margin: 40px auto; background: white; border: 1px solid #f0f0f0; border-radius: 14px; padding: 24px; }
   h1 { font-size: 20px; font-weight: 800; }
   label { display: block; font-size: 12px; font-weight: 600; color: #404040; margin-bottom: 6px; margin-top: 14px; }
   input { width: 100%; padding: 10px 14px; border: 1px solid #e5e5e5; border-radius: 10px; font-size: 14px; box-sizing: border-box; }
   button { width: 100%; padding: 12px; background: #0a0a0a; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; margin-top: 20px; cursor: pointer; }
   .info { font-size: 12px; color: #737373; margin-top: 12px; }
</style>
</head>
<body>
   <div class="card">
      <h1>Demo Checkout</h1>
      <p class="info">Isi form, klik Bayar, diarahkan ke halaman pembayaran G2CSPAY</p>
      <form action="checkout.php" method="POST">
         <label>Email</label>
         <input type="email" name="email" value="customer@example.com" required>
         <label>Nominal (Rp)</label>
         <input type="number" name="amount" value="10000" min="1000" required>
         <button type="submit">Bayar Sekarang</button>
      </form>
      <p class="info">Setelah bayar, cek callback.php untuk terima webhook.</p>
   </div>
</body>
</html>
