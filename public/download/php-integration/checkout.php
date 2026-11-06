<?php
/**
 * Checkout — user klik "Bayar"
 */
require 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

$orderId = 'ORD-' . time() . '-' . rand(1000, 9999);
$amount  = (int) ($_POST['amount'] ?? 0);
$email   = $_POST['email'] ?? '';

if ($amount < 1000) exit('Minimal Rp 1.000');

try {
    // 1. Simpan order
    $stmt = db()->prepare('
        INSERT INTO orders (order_id, amount, status, customer_email)
        VALUES (?, ?, "pending", ?)
    ');
    $stmt->execute([$orderId, $amount, $email]);

    // 2. Buat transaksi di G2CSPAY
    $res = g2cspayRequest('POST', '/api/v1/charge', [
        'payment_type'        => 'qris',
        'transaction_details' => ['order_id' => $orderId, 'gross_amount' => $amount],
        'customer_details'    => ['email' => $email],
        'callback_url'        => APP_URL . '/callback.php',
    ]);

    if (($res['status_code'] ?? '') !== '201') {
        exit('API Error: ' . ($res['status_message'] ?? 'unknown'));
    }

    // 3. Simpan transaction_id
    $stmt = db()->prepare('UPDATE orders SET trx_id = ? WHERE order_id = ?');
    $stmt->execute([$res['transaction_id'], $orderId]);

    // 4. Redirect ke halaman pembayaran
    header('Location: ' . $res['payment_url']);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    exit('Error: ' . $e->getMessage());
}
