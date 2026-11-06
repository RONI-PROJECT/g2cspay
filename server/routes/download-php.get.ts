import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
   const baseDir = resolve(process.cwd(), 'public/download/php-integration')
   const files = [
      'README.md', 'config.php', 'schema.sql',
      'index.php', 'checkout.php', 'callback.php',
   ]

   const { default: JSZip } = await import('jszip')
   const zip = new JSZip()

   for (const f of files) {
      try {
         const content = readFileSync(resolve(baseDir, f), 'utf-8')
         zip.file(f, content)
      } catch (e) {
         console.error(`[zip] skip ${f}:`, e)
      }
   }

   const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
   })

   setHeader(event, 'Content-Type', 'application/zip')
   setHeader(event, 'Content-Disposition', 'attachment; filename="cspay-php-integration.zip"')
   setHeader(event, 'Content-Length', String(buffer.length))

   return buffer
})
