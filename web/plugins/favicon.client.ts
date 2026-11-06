export default defineNuxtPlugin(() => {
  function setFavicon(url: string) {
    if (!url) return
    document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove())
    const icon = document.createElement('link')
    icon.rel = 'icon'
    icon.type = url.includes('.ico') ? 'image/x-icon' : url.includes('.svg') ? 'image/svg+xml' : 'image/png'
    icon.href = url
    document.head.appendChild(icon)
    const apple = document.createElement('link')
    apple.rel = 'apple-touch-icon'
    apple.href = url
    document.head.appendChild(apple)
  }
  onNuxtReady(async () => {
    try {
      const { settings, load, loaded } = useSiteSettings()
      if (!loaded.value) await load(true)
      // Cuma timpa favicon G2 bawaan kalau ada upload custom di panel.
      const custom = settings.value.favicon_url || settings.value.logo_url
      if (custom) setFavicon(custom)
      watch(() => settings.value.favicon_url || settings.value.logo_url, (v) => { if (v) setFavicon(v) })
    } catch {}
  })
})
