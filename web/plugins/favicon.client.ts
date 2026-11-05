export default defineNuxtPlugin(() => {
  function setFavicon(url: string) {
    if (!url) return
    document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove())
    const icon = document.createElement('link')
    icon.rel = 'icon'
    icon.type = url.endsWith('.ico') ? 'image/x-icon' : 'image/png'
    icon.href = url
    document.head.appendChild(icon)

    const apple = document.createElement('link')
    apple.rel = 'apple-touch-icon'
    apple.href = url
    document.head.appendChild(apple)
    console.log('[favicon] set to:', url)
  }

  onNuxtReady(async () => {
    try {
      const { faviconUrl, load, loaded } = useSiteSettings()
      if (!loaded.value) await load(true)
      if (faviconUrl.value) {
        setFavicon(faviconUrl.value)
      } else {
        console.log('[favicon] no custom url, using static /favicon.ico')
      }
      watch(faviconUrl, (v) => { if (v) setFavicon(v) })
    } catch (e) {
      console.log('[favicon] plugin error:', e)
    }
  })
})
