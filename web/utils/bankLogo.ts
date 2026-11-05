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
  const domain = BANK_DOMAINS[code]
  if (domain) return `https://logo.clearbit.com/${domain}?size=64`
  return ''
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
