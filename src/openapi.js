const PORT = process.env.PORT || '3000';
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

const SERVERS = [
   ...(PUBLIC_URL ? [{ url: PUBLIC_URL, description: 'Public' }] : []),
   { url: '/', description: 'This host (relative)' },
   { url: 'http://localhost:' + PORT, description: 'Local' },
];

const Transaction = {
   type: 'object',
   properties: {
      status_code: { type: 'string', example: '201' },
      status_message: { type: 'string', example: 'Menunggu pembayaran' },
      transaction_id: { type: 'string', example: 'CSP-7HKM4XQ2R9' },
      order_id: { type: 'string', example: 'ORDER-1001' },
      gross_amount: { type: 'string', example: '25000.00' },
      fee_amount: { type: 'string', example: '450.00' },
      net_amount: { type: 'string', example: '24550.00' },
      pay_amount: { type: 'string', example: '25037.00' },
      currency: { type: 'string', example: 'IDR' },
      payment_type: { type: 'string', example: 'qris' },
      transaction_time: { type: 'string', example: '2026-11-05 16:08:12' },
      transaction_status: { type: 'string', enum: ['pending', 'settlement', 'cancel', 'expire'] },
      fraud_status: { type: 'string', example: 'accept' },
      expiry_time: { type: 'string', example: '2026-11-05 16:23:12' },
      settlement_time: { type: 'string' },
      qr_string: { type: 'string' },
      payment_url: { type: 'string' },
      actions: { type: 'array', items: { type: 'object' } },
   },
};

const ErrorBody = {
   type: 'object',
   properties: {
      status_code: { type: 'string', example: '404' },
      status_message: { type: 'string', example: 'Transaksi tidak ditemukan' },
   },
};

const json = (schema) => ({ content: { 'application/json': { schema } } });
const orderParam = { name: 'order_id', in: 'path', required: true, schema: { type: 'string' }, description: 'order_id atau transaction_id' };

export const openApiSpec = {
   openapi: '3.0.3',
   info: {
      title: 'G2CSPAY API',
      version: '1.0.0',
      description: 'Payment gateway QRIS. Autentikasi: HTTP Basic (API Key sebagai username) atau Bearer.',
   },
   servers: SERVERS,
   components: {
      securitySchemes: {
         BasicAuth: { type: 'http', scheme: 'basic' },
         BearerAuth: { type: 'http', scheme: 'bearer' },
      },
      schemas: { Transaction, Error: ErrorBody },
   },
   security: [{ BasicAuth: [] }, { BearerAuth: [] }],
   paths: {
      '/api/v1/charge': {
         post: {
            summary: 'Buat transaksi QRIS',
            requestBody: {
               required: true,
               ...json({
                  type: 'object',
                  properties: {
                     payment_type: { type: 'string', example: 'qris' },
                     transaction_details: {
                        type: 'object',
                        properties: { order_id: { type: 'string' }, gross_amount: { type: 'integer', example: 25000 } },
                     },
                     customer_details: { type: 'object', properties: { first_name: { type: 'string' }, email: { type: 'string' } } },
                     custom_expiry: { type: 'object', properties: { expiry_duration: { type: 'integer' }, unit: { type: 'string', enum: ['minute', 'hour', 'day'] } } },
                     callback_url: { type: 'string' },
                     metadata: { type: 'object' },
                  },
               }),
            },
            responses: { 201: { description: 'Dibuat', ...json({ $ref: '#/components/schemas/Transaction' }) }, 400: { description: 'Parameter tidak valid' }, 401: { description: 'Unauthorized' }, 406: { description: 'order_id sudah dipakai' } },
         },
      },
      '/api/v1/transaction/{order_id}/status': {
         get: { summary: 'Cek status', parameters: [orderParam], responses: { 200: { description: 'OK', ...json({ $ref: '#/components/schemas/Transaction' }) }, 404: { description: 'Tidak ditemukan' } } },
      },
      '/api/v1/transaction/{order_id}/cancel': {
         post: { summary: 'Batalkan transaksi pending', parameters: [orderParam], responses: { 200: { description: 'Dibatalkan', ...json({ $ref: '#/components/schemas/Transaction' }) }, 412: { description: 'Status tidak mengizinkan' } } },
      },
      '/api/v1/transaction/{order_id}/qr': {
         get: { summary: 'Gambar QR (PNG)', security: [], parameters: [orderParam], responses: { 200: { description: 'image/png' } } },
      },
      '/api/v1/transaction/{order_id}/notification/resend': {
         post: { summary: 'Kirim ulang notifikasi', parameters: [orderParam], responses: { 200: { description: 'Terkirim' }, 412: { description: 'Masih pending' } } },
      },
   },
};
