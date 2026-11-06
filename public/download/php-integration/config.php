<?php
/**
 * Konfigurasi G2CSPAY
 * Ganti nilai-nilai di bawah dengan punya kamu.
 */

// API G2CSPAY
define('G2CSPAY_BASE_URL', 'https://g2cspay.example.com');
define('G2CSPAY_API_KEY', 'rp_live_xxxxxxxxxxxxxxxx');   // 1 credential — Dashboard > Kredensial
define('G2CSPAY_WEBHOOK_SECRET', 'whsec_xxxxxxxxxx');

// Database MySQL
define('DB_HOST', 'localhost');
define('DB_NAME', 'tokoku');
define('DB_USER', 'root');
define('DB_PASS', '');

// Base URL toko kamu
define('APP_URL', 'https://tokoku.com');

// ═══ Helper ═══

function db() {
    static $pdo;
    if (!$pdo) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    return $pdo;
}

function writeLog($file, $msg) {
    file_put_contents($file, '[' . date('Y-m-d H:i:s') . '] ' . $msg . "\n", FILE_APPEND);
}

function g2cspayRequest($method, $path, $body = null) {
    $ch = curl_init(G2CSPAY_BASE_URL . $path);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_USERPWD        => G2CSPAY_API_KEY . ':',
        CURLOPT_HTTPHEADER     => ['Accept: application/json', 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => $body ? json_encode($body) : null,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}
