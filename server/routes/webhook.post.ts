export default defineEventHandler(async (event) => {
   const rawBody = await readRawBody(event)
   const signature = getHeader(event, 'x-signature') || ''

   let payload: any = null
   try { payload = JSON.parse(rawBody || '{}') } catch {}

   console.log('')
   console.log('═══════════════════════════════════════════')
   console.log('WEBHOOK RECEIVED')
   console.log('═══════════════════════════════════════════')
   console.log('  Waktu     :', new Date().toLocaleString('id-ID'))
   console.log('  Event     :', payload?.event || 'unknown')
   console.log('  TrxID     :', payload?.trxId || '-')
   console.log('  Amount    :', payload?.amount || '-')
   console.log('  Signature :', signature ? signature.slice(0, 30) + '...' : '-')
   console.log('═══════════════════════════════════════════')
   console.log('')

   return {
      success: true,
      received: true,
      message: 'Webhook received',
      timestamp: new Date().toISOString(),
      event: payload?.event || null,
      trxId: payload?.trxId || null,
   }
})
