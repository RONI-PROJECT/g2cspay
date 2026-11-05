<!-- components/SiteLogo.vue -->
<template>
  <img
    v-if="logoUrl && !logoFailed"
    :src="logoUrl"
    :alt="alt || siteName"
    :class="$attrs.class"
    :style="imgOk ? '' : 'opacity:0'"
    @load="imgOk = true"
    @error="logoFailed = true"
  />
  <img
    v-else-if="!staticFailed"
    src="/logo.svg"
    :alt="alt || 'G2CSPAY'"
    :class="$attrs.class"
    @error="staticFailed = true"
  />
  <span v-else class="logo-fallback">{{ siteName || 'G2CSPAY' }}</span>
</template>

<script setup lang="ts">
defineProps<{ alt?: string }>()
const { logoUrl, siteName, load } = useSiteSettings()
const logoFailed = ref(false)
const staticFailed = ref(false)
const imgOk = ref(false)
const ready = ref(false)
onMounted(async () => { await load(); ready.value = true })
</script>

<style scoped>
.logo-fallback {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.02em;
  color: var(--txt);
  white-space: nowrap;
}
img { height: 30px; width: auto; display: block; transition: opacity .25s ease; }
</style>
