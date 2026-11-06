import { fromNodeMiddleware } from 'h3';
// @ts-expect-error — plain JS, no type declarations
import { apiApp } from '#src/server.js';

const handleWithExpress = fromNodeMiddleware(apiApp);

export default defineEventHandler(async (event) => {
   const path = event.path.split('?')[0];

   // Cuma /api/* yang diterusin ke Express
   if (!path.startsWith('/api')) return;

   // Cegah conditional request → Express nggak akan balikin 304,
   // penyebab "Cannot set properties of undefined (setting 'content-type')"
   delete event.node.req.headers['if-none-match'];
   delete event.node.req.headers['if-modified-since'];


   try {
      return await handleWithExpress(event);
   } catch (e: any) {
      console.error('[api-middleware] error:', e.message, e.stack);
      return new Response(
         JSON.stringify({ success: false, error: 'middleware crashed', detail: e.message }),
         { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
   }
});