<template>
  <div class="dp">
    <header class="top">
      <div class="top-in">
        <NuxtLink to="/" class="brand"><SiteLogo /></NuxtLink>
        <nav>
          <NuxtLink to="/docs" class="on">Dokumentasi</NuxtLink>
          <NuxtLink to="/tos">Syarat</NuxtLink>
          <NuxtLink to="/privacy">Privasi</NuxtLink>
        </nav>
        <div class="act">
          <NuxtLink to="/login">Masuk</NuxtLink>
          <NuxtLink to="/register" class="reg">Daftar</NuxtLink>
        </div>
      </div>
    </header>
    <ApiDocs />
    <SiteCopyright />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteSettings()
useHead(() => ({ title: `Dokumentasi API - ${siteName.value}` }))
</script>

<style scoped>
.dp { min-height: 100vh; background: var(--card); }
.top { position: sticky; top: 0; z-index: 20; background: var(--card); border-bottom: 1px solid var(--line); }
.top-in { max-width: 1080px; margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; gap: 28px; }
.brand { display: flex; align-items: center; flex-shrink: 0; }
.brand :deep(img) { height: 26px; width: auto; }
nav { display: flex; gap: 22px; font-size: 13px; color: var(--dim); }
nav a { padding: 4px 0; border-bottom: 2px solid transparent; }
nav a:hover { color: var(--txt); }
nav a.on { color: var(--vio); border-bottom-color: var(--vio); font-weight: 600; }
.act { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.act a { display: inline-flex; align-items: center; height: 32px; padding: 0 14px; border-radius: 6px; font-size: 13px; font-weight: 600; border: 1px solid var(--line-2); color: var(--txt); background: var(--card); }
.act a:hover { border-color: var(--vio); color: var(--vio); }
.act a.reg { background: var(--vio); border-color: var(--vio); color: #fff; }
.act a.reg:hover { background: var(--vio-deep); border-color: var(--vio-deep); color: #fff; }
@media (max-width: 640px) { .top-in { padding: 0 16px; gap: 12px; } nav { display: none; } .act a { height: 30px; padding: 0 12px; } }
</style>
