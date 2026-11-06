export const BANK_DOMAINS: Record<string, string> = {
  BCA: 'bca.co.id',
  BNI: 'bni.co.id',
  BRI: 'bri.co.id',
  MANDIRI: 'bankmandiri.co.id',
  CIMB: 'cimbniaga.co.id',
  PERMATA: 'permatabank.com',
  DANAMON: 'danamon.co.id',
  BSI: 'bankbsi.co.id',
  BTN: 'btn.co.id',
  OCBC: 'ocbcnisp.com',
  MAYBANK: 'maybank.co.id',
  PANIN: 'panin.co.id',
  MEGA: 'bankmega.com',
  BJB: 'bankbjb.co.id',
  DKI: 'bankdki.co.id',
  JAGO: 'jago.com',
  SEABANK: 'seabank.co.id',
  NEO: 'bankneo.co.id',
  BLU: 'blubybcadigital.id',
  JENIUS: 'jenius.com',
  GOPAY: 'gopay.co.id',
  OVO: 'ovo.id',
  DANA: 'dana.id',
  SHOPEEPAY: 'shopeepay.co.id',
  LINKAJA: 'linkaja.id',
}

export function getBankLogo(bankCode: string, customLogos?: Record<string, string>): string {
  if (!bankCode) return ''
  const code = bankCode.toUpperCase()
  if (customLogos && customLogos[code]) return customLogos[code]
  return bankBadge(code)
}

// Warna merek tiap bank/e-wallet (dipakai badge lokal; tidak butuh internet / API pihak ketiga)
export const BANK_COLORS: Record<string, [string, string]> = {
  BCA: ['#0060af', '#003f7d'], BNI: ['#f26b21', '#d94f00'], BRI: ['#00529c', '#003a70'], MANDIRI: ['#0a3d91', '#082a66'],
  CIMB: ['#b3122d', '#7d0d20'], PERMATA: ['#7ab800', '#4f7a00'], DANAMON: ['#0057a8', '#003c75'], BSI: ['#00a39d', '#00736f'],
  BTN: ['#f9a11b', '#d17f00'], OCBC: ['#e60012', '#a8000d'], MAYBANK: ['#f7b500', '#c28e00'], PANIN: ['#0b5fae', '#073f75'],
  MEGA: ['#0d5ea6', '#09416f'], BJB: ['#0072bc', '#004f85'], DKI: ['#c8102e', '#8f0b20'], JAGO: ['#ffb400', '#c98f00'],
  SEABANK: ['#ff6a00', '#c75000'], NEO: ['#ffb300', '#c78a00'], BLU: ['#1d4ed8', '#1e3a8a'], JENIUS: ['#00a6d6', '#0078a0'],
  GOPAY: ['#00aed6', '#00799a'], OVO: ['#4c2a86', '#341c5e'], DANA: ['#118eea', '#0b63a8'], SHOPEEPAY: ['#ee4d2d', '#b83820'],
  LINKAJA: ['#e8112d', '#a80c20'],
}

export function bankBadge(bankCode: string): string {
  const code = (bankCode || '').toUpperCase()
  const [c1, c2] = BANK_COLORS[code] || ['#0d9488', '#0f766e']
  const txt = (code.length <= 3 ? code : code.slice(0, 2)).replace(/[^A-Z0-9]/g, '')
  const fs = txt.length >= 3 ? 26 : 32
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="${fs >= 32 ? 42 : 40}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="${fs}" fill="#fff" letter-spacing="-1">${txt}</text></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

export function parseBankLogos(raw: string | undefined | null): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}
