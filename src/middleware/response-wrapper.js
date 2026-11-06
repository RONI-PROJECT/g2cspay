/**
 * Response Wrapper Middleware
 * Wrap semua response JSON dengan format standard:
 * { success, code, message, data, timestamp }
 *
 * Compatible dengan frontend lama (success + data tetep ada)
 */

export function responseWrapper() {
   return (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = (body) => {
         // Skip kalau response kosong / bukan object
         if (body === null || body === undefined) {
            return originalJson(body);
         }

         // Skip kalau udah di-wrap (punya timestamp)
         if (typeof body === 'object' && body.timestamp && body.success !== undefined && body.code !== undefined) {
            return originalJson(body);
         }

         const statusCode = res.statusCode;
         const isSuccess = statusCode < 400 && body?.success !== false;

         // Extract message & data
         let message = 'OK';
         let data = null;
         let errorField = undefined;

         if (typeof body === 'object' && body !== null) {
            // Prioritas message dari body
            message = body.message || body.error || (isSuccess ? 'OK' : 'Error');

            if (isSuccess) {
               // Kalau body punya 'data', pakai itu
               // Kalau nggak, pakai seluruh body sebagai data
               data = 'data' in body ? body.data : body;

               // Kalau body punya fields tambahan (merchant_code, dll), merge ke data
               if ('data' in body) {
                  const extras = {};
                  for (const [k, v] of Object.entries(body)) {
                     if (k !== 'success' && k !== 'data' && k !== 'message' && k !== 'timestamp' && k !== 'code') {
                        extras[k] = v;
                     }
                  }
                  if (Object.keys(extras).length > 0 && typeof data === 'object' && data !== null) {
                     data = { ...data, ...extras };
                  }
               }
            } else {
               errorField = body.error || body.message || 'Error';
               message = errorField;
            }
         } else {
            data = body;
            message = isSuccess ? 'OK' : 'Error';
         }

         const wrapped = {
            success: isSuccess,
            code: statusCode,
            message,
            data: isSuccess ? data : null,
            timestamp: new Date().toISOString(),
         };

         if (!isSuccess) {
            wrapped.error = errorField || message;
         }

         return originalJson(wrapped);
      };

      next();
   };
}
