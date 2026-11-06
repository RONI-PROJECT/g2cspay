<!-- app.vue -->
<template>
  <div class="app-root">
    <div class="app-bg" aria-hidden="true">
    </div>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()

const {
  siteTitle, siteName, siteDescription, siteKeywords,
  logoUrl, faviconUrl, maintenance, load, settings, themeColor,
} = useSiteSettings()

const THEME_HEX: Record<string, string> = { navy: '#070d22', teal: '#0d9488', emerald: '#059669', blue: '#2563eb', indigo: '#4f46e5', violet: '#7c3aed', rose: '#e11d48', amber: '#d97706', slate: '#334155' }

const siteUrl = computed(() =>
  (config.public.publicUrl || 'http://localhost:3000').replace(/\/$/, '')
)

const favicon = computed(() => faviconUrl.value || '/favicon.ico')

const ogImage = computed(() => {
  const l = settings.value.og_url || logoUrl.value || faviconUrl.value
  if (!l) return `${siteUrl.value}/og-image.png?v=7`
  return l.startsWith('http') ? l : siteUrl.value + l
})

const MAINTENANCE_ALLOWED = [
  '/maintenance', '/panel', '/api', '/_nuxt', '/favicon.ico', '/docs-assets',
]

function checkMaintenance() {
  if (!maintenance?.value) return
  const allowed = MAINTENANCE_ALLOWED.some(
    p => route.path === p || route.path.startsWith(p + '/')
  )
  if (!allowed) navigateTo('/maintenance')
}

onMounted(async () => {
  // Buka logo anti-kedip SEKARANG: cache localStorage udah dibaca sinkron saat module init,
  // jadi SiteLogo udah render src logo asli. Jangan tunggu fetch settings (bisa lambat).
  document.documentElement.removeAttribute('data-has-logo')
  // settings dimuat di background - UI langsung render, nggak nunggu API
  await load(true)
  checkMaintenance()
})

watch(() => route.path, checkMaintenance)

// Pengaturan logo dari panel -> CSS variable (juga dipasang dari cache oleh script inline di nuxt.config)
const BANK_R: Record<string, string> = { rounded: '12px', circle: '999px', square: '4px' }
function applyLogoVars() {
  if (!import.meta.client) return
  const st = document.documentElement.style
  const h = Math.min(64, Math.max(20, Number(settings.value.logo_height) || 30))
  st.setProperty('--logo-h', h + 'px')
  st.setProperty('--bank-r', BANK_R[settings.value.bank_logo_shape || 'rounded'] || '12px')
  st.setProperty('--bank-filter', settings.value.bank_logo_gray ? 'grayscale(1) opacity(.8)' : 'none')
}
watch(() => [settings.value.logo_height, settings.value.bank_logo_shape, settings.value.bank_logo_gray], applyLogoVars, { immediate: true })

useHead(() => {
  const name = siteName.value || 'G2CSPAY'
  const title = siteTitle.value || `${name} - Payment Gateway QRIS`
  const desc = siteDescription.value || 'Payment gateway QRIS untuk merchant Indonesia.'
  const url = siteUrl.value
  const img = ogImage.value

  const jsonLd = (data: Record<string, unknown>) =>
    JSON.stringify({ '@context': 'https://schema.org', ...data })

  return {
    htmlAttrs: { lang: 'id', 'data-theme': themeColor.value },
    title,
    link: [
      { rel: 'icon', href: favicon.value },
      { rel: 'apple-touch-icon', href: settings.value.favicon_url || '/apple-touch-icon.png?v=7' },
      { rel: 'canonical', href: url + route.path },
    ],
    meta: [
      { name: 'description', content: desc },
      { name: 'keywords', content: siteKeywords.value },
      { name: 'theme-color', content: THEME_HEX[themeColor.value] || '#070d22' },
      { name: 'google-site-verification', content: 'V5yjNGmuNCCgyMGhIZ4y69cfTgFO7BahxbN_Fcm_Vmk' },

      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: name },
      { property: 'og:title', content: title },
      { property: 'og:description', content: desc },
      { property: 'og:image', content: img },
      { property: 'og:image:secure_url', content: img },
      { property: 'og:url', content: url + route.path },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: desc },
      { name: 'twitter:image', content: img },
    ],
    script: [
      { type: 'application/ld+json', innerHTML: jsonLd({ '@type': 'Organization', name, url, logo: img, description: desc }) },
      { type: 'application/ld+json', innerHTML: jsonLd({ '@type': 'WebSite', name, url, potentialAction: { '@type': 'SearchAction', target: `${url}/?s={search_term_string}`, 'query-input': 'required name=search_term_string' } }) },
      { type: 'application/ld+json', innerHTML: jsonLd({ '@type': 'SoftwareApplication', name: 'G2CSPAY', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', url, description: desc, offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' } }) },
    ],
  }
})
</script>

<style>

.app-root { position: relative; min-height: 100vh; overflow-x: hidden; }
.app-content { position: relative; z-index: 1; }

.app-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

</style>