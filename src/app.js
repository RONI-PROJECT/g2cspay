import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config.js';
import { log, dim, fg, useColor } from './logger.js';
import { securityHeaders, requireApiKey, rateLimit } from './security.js';
import { paymentRoutes } from './routes/payments.js';
import { historyRoutes } from './routes/history.js';
import { adminRoutes } from './routes/admin.js';
import { adminPanelRoutes } from './routes/admin-panel.js';
import { systemRoutes, healthRoutes } from './routes/system.js';
import authRoutes from './routes/auth.js';
import { webhookLogRoutes } from './routes/webhook-log.js';
import { webhookTestRoutes } from './routes/webhook-test.js';
import { sandboxRoutes } from './routes/sandbox.js';
import { cronRoutes } from './routes/cron.js';
import { publicRoutes } from './routes/public.js';
import { userExtraRoutes } from './routes/user-extra.js';
import { userPaymentRoutes } from './routes/user-payments.js';
import { responseWrapper } from './middleware/response-wrapper.js';

const logHttp = log('http');

const statusColor = (status) => {
   if (!useColor) return status;
   const n = parseInt(status, 10);
   const color = n >= 500 ? 31 : n >= 400 ? 33 : n >= 300 ? 36 : 32;
   return '\x1b[1;' + color + 'm' + status + '\x1b[0m';
};

function requestLogger() {
   morgan.token('ts', () => new Date().toTimeString().slice(0, 8));
   return morgan((tokens, req, res) => [
      dim('[' + tokens.ts() + ']'),
      statusColor(tokens.status(req, res) || '---'),
      tokens.url(req, res),
      dim('|'),
      useColor ? fg(35, tokens.method(req, res).padEnd(4)) : tokens.method(req, res).padEnd(4),
      dim('-'),
      dim((tokens['response-time'](req, res) || '0') + 'ms'),
   ].join(' '));
}

/**
 * Daftar endpoint POST-only. Request GET/HEAD ke path ini dibales 405
 * (method not allowed), bukan 404, biar jelas bugnya di mana.
 */
const POST_ONLY_PATHS = [
   '/api/v1/charge',
   '/api/auth/login',
   '/api/auth/register',
   '/api/auth/logout',
   '/api/auth/2fa/setup',
   '/api/auth/2fa/verify-setup',
   '/api/auth/2fa/disable',
];

export function createApp({ merchant = null } = {}) {
   const app = express();

   app.set('trust proxy', /^\d+$/.test(config.trustProxy) ? Number(config.trustProxy) : config.trustProxy);

   app.use(requestLogger());
   app.use(rateLimit({
      max: config.rateMax,
      skip: (req) => {
         const skipPaths = ['/api/public/settings', '/api/public/stats', '/api/public/live', '/api/health'];
         return skipPaths.some((p) => req.path.startsWith(p));
      },
   }));

   app.use('/api/admin-panel/upload', express.json({ limit: '3mb' }));
   app.use(express.json({ limit: '64kb' }));
   // app.use(responseWrapper());
   app.use(cookieParser());

   app.get('/', (req, res) => res.json({ status: 'up' }));
   app.get('/api', (req, res) => res.json({
      status: 'up',
      docs: '/docs',
      health: '/api/health',
   }));

   app.use(systemRoutes());
   app.use(securityHeaders);

   // ═══ Method guard: POST-only endpoint yang diakses pakai GET ═══
   app.use((req, res, next) => {
      if ((req.method === 'GET' || req.method === 'HEAD') && POST_ONLY_PATHS.includes(req.path)) {
         const host = `${req.protocol}://${req.get('host')}`;
         return res.status(405).json({
            success: false,
            error: 'method_not_allowed',
            message: 'Endpoint ini hanya bisa diakses lewat aplikasi, bukan dibuka di browser.',
         });
      }
      next();
   });

   const guard = requireApiKey(config.apiKey);

   app.use('/api', healthRoutes());
   app.use('/api/cron', cronRoutes(merchant));
   app.use('/api/auth', authRoutes);
   app.use('/api/user/webhook', webhookLogRoutes());
   app.use('/api/user/webhook-test', webhookTestRoutes());
   app.use('/api/sandbox', sandboxRoutes());
   app.use('/api/public', publicRoutes());
   app.use('/api/user', userExtraRoutes());
   app.use('/api/user/payment', userPaymentRoutes());
   app.use('/api/admin', adminRoutes(guard, merchant));
   app.use('/api/admin-panel', adminPanelRoutes());
   app.use('/api/v1', paymentRoutes(guard, merchant));
   app.use('/api/v1', adminRoutes(guard, merchant));
   app.use('/api', paymentRoutes(guard, merchant)); // base URL: domain/api
   app.use('/api', historyRoutes(guard));

   // 404 — format konsisten
   app.use((req, res) => res.status(404).json({
      success: false,
      error: 'not_found',
      message: `Endpoint ${req.method} ${req.path} tidak ditemukan.`,
   }));

   // Error handler — format konsisten
   app.use((err, req, res, next) => {
      logHttp.error(req.method + ' ' + req.originalUrl + ' -> ' + (err.stack || err.message));
      if (res.headersSent) return next(err);
      const badBody = err.type === 'entity.parse.failed' || err.type === 'entity.too.large';
      res.status(badBody ? 400 : 500).json({
         success: false,
         error: badBody ? 'invalid_json_body' : 'internal_error',
         message: badBody ? 'Body request bukan JSON valid.' : 'Terjadi kesalahan di server.',
      });
   });

   return app;
}
