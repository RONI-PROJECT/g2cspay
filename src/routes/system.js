import express from 'express';
import { config } from '../config.js';
import { openApiSpec } from '../openapi.js';
import { counts } from '../db/transactions.js';
import { isAuthenticated } from '../security.js';
import { sessionHealth } from '../services/session.js';

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function systemRoutes() {
   const router = express.Router();
   router.get('/openapi.json', (req, res) => res.json(openApiSpec));
   return router;
}

export function healthRoutes() {
   const router = express.Router();
   router.get('/health', wrap(async (req, res) => {
      const session = await sessionHealth();
      const degraded = session.ok === false;
      const data = { session: {
         ok: session.ok, lastCheckAt: session.lastCheckAt, lastOkAt: session.lastOkAt,
         consecutiveFailures: session.consecutiveFailures, reauths: session.reauths,
         lastError: session.lastError,
      }};
      if (isAuthenticated(req, config.apiKey)) {
         const tally = await counts();
         Object.assign(data, tally);
      }
      res.status(degraded ? 503 : 200).json({ success: !degraded, data });
   }));
   return router;
}
