/**
 * Semua JSON di /api/v1 ikut gaya Midtrans: selalu ada status_code (string) + status_message.
 * Field lama (success, data, meta, dll) TIDAK dihapus, jadi dashboard & integrasi lama tetap jalan.
 */
export function midtransCompat() {
   return (req, res, next) => {
      const json = res.json.bind(res);
      res.json = (body) => {
         if (body && typeof body === 'object' && !Array.isArray(body) && body.status_code === undefined) {
            const code = res.statusCode || 200;
            const ok = code < 400 && body.success !== false;
            body = {
               status_code: String(code),
               status_message: body.status_message || body.message || body.error || (ok ? 'Success' : 'Error'),
               ...body,
            };
         }
         return json(body);
      };
      next();
   };
}
