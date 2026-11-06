CREATE TABLE IF NOT EXISTS orders (
   id              INT AUTO_INCREMENT PRIMARY KEY,
   order_id        VARCHAR(100) UNIQUE NOT NULL,
   trx_id          VARCHAR(100) UNIQUE,
   amount          BIGINT NOT NULL,
   status          ENUM('pending','paid','expired') DEFAULT 'pending',
   customer_email  VARCHAR(200),
   metadata        JSON,
   created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
   paid_at         DATETIME NULL
);

CREATE INDEX idx_orders_trx ON orders(trx_id);
CREATE INDEX idx_orders_status ON orders(status);
