<!-- components/SiteLogo.vue — logo selalu versi terbaru, tanpa kedip logo lama -->
<template>
  <img
    v-if="src"
    :key="src"
    :src="src"
    :alt="alt || siteName || 'G2CSPAY'"
    :class="$attrs.class"
    data-logo
    width="120" height="30"
    decoding="async"
    fetchpriority="high"
    @error="onError"
  />
  <span v-else class="logo-ph" aria-hidden="true"></span>
</template>

<script setup lang="ts">
defineProps<{ alt?: string }>()
// BRAND_V dinaikkan tiap logo bawaan berubah -> cache browser lama otomatis dibuang
const BRAND_V = 7
const { logoUrl, siteName, loaded } = useSiteSettings()
const failed = ref(false)
const fallback = `/logo.svg?v=${BRAND_V}`
// Logo custom (upload panel) dipakai kalau ada & valid; selain itu logo bawaan baru.
// tunggu settings dari panel dimuat dulu; logo.svg bawaan cuma dipakai kalau panel memang belum upload logo
const src = computed(() => (logoUrl.value && !failed.value ? logoUrl.value : (loaded.value || failed.value ? fallback : '')))
function onError() { failed.value = true }
watch(logoUrl, () => { failed.value = false })
</script>

<style scoped>
.logo-ph { display: block; width: 120px; height: var(--logo-h, 30px); }
.logo-ph { display: block; width: 120px; height: var(--logo-h, 30px); }
.logo-ph { display: block; width: 120px; height: var(--logo-h, 30px); }
.logo-ph { display: block; width: 120px; height: var(--logo-h, 30px); }
img { height: var(--logo-h, 30px); width: auto; display: block; image-rendering: auto; }
</style>
