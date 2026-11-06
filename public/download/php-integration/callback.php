<?php
/**
 * Callback — terima webhook dari G2CSPAY
 */
require 'config.php';

$logFile = __DIR__ . '/webhook.log';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

$rawBody = file_get_contents('php://input');
$data    = json_decode($rawBody, true);

writeLog($logFile, '--- Notifikasi diterima ---');
writeLog($logFile, 'Body: ' . $rawBody);

if (!$data) {
    http_response_code(400);
    exit(json_encode(['status_message' => 'Invalid JSON']));
}

// Verifikasi signature_key = SHA512(order_id + status_code + gross_amount + secret)
$expected = hash('sha512', $data['order_id'] . $data['status_code'] . $data['gross_amount'] . G2CSPAY_WEBHOOK_SECRET);
if (!hash_equals($expected, $data['signature_key'] ?? '')) {
    writeLog($logFile, 'Signature TIDAK VALID');
    http_response_code(403);
    exit(json_encode(['status_message' => 'Invalid signature']));
}

$status  = $data['transaction_status'];
$orderId = $data['order_id'];
writeLog($logFile, "Status: $status | Order: $orderId");

try {
    if ($status === 'settlement') {
        handlePaid($orderId, $logFile);
    } elseif (in_array($status, ['expire', 'cancel'], true)) {
        handleClosed($orderId, $status, $logFile);
    }
    http_response_code(200);
    echo json_encode(['status_message' => 'OK']);
} catch (Exception $e) {
    writeLog($logFile, 'Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status_message' => $e->getMessage()]);
}

function handlePaid($trxId, $logFile) {
    $stmt = db()->prepare('SELECT status FROM orders WHERE order_id = ?');
    $stmt->execute([$trxId]);
    $order = $stmt->fetch();

    if (!$order) {
        writeLog($logFile, "Order $trxId tidak ditemukan");
        return;
    }
    if ($order['status'] === 'paid') {
        writeLog($logFile, "Order $trxId sudah PAID, skip");
        return;
    }

    $stmt = db()->prepare('UPDATE orders SET status = "paid", paid_at = NOW() WHERE order_id = ?');
    $stmt->execute([$trxId]);
    writeLog($logFile, "Order $trxId updated to PAID");
}

function handleClosed($orderId, $status, $logFile) {
    $stmt = db()->prepare('UPDATE orders SET status = ? WHERE order_id = ? AND status = "pending"');
    $stmt->execute([$status === 'cancel' ? 'canceled' : 'expired', $orderId]);
    writeLog($logFile, "Order $orderId ditutup ($status)");
}
