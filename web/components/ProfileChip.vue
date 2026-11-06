<template>
  <component :is="to ? 'NuxtLink' : 'div'" :to="to || undefined" class="pc">
    <span class="pc-av">{{ initials }}</span>
    <span class="pc-tx">
      <b>{{ name }}</b>
      <small>{{ sub }}</small>
    </span>
  </component>
</template>

<script setup lang="ts">
const props = defineProps<{ to?: string; fixedName?: string; fixedSub?: string }>()
const { user, fetchMe } = useAuth()
onMounted(() => { if (!props.fixedName && !user.value) fetchMe() })
const name = computed(() => props.fixedName || user.value?.name || user.value?.email?.split('@')[0] || 'Akun')
const sub = computed(() => props.fixedSub || (user.value as any)?.storeName || user.value?.email || '')
const initials = computed(() => String(name.value).split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'A')
</script>

<style scoped>
.pc { display: flex; align-items: center; gap: 9px; padding: 4px 10px 4px 4px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); transition: border-color .15s; max-width: 220px; }
a.pc:hover { border-color: var(--line-2); color: inherit; }
.pc-av { width: 28px; height: 28px; border-radius: 50%; background: var(--grad); color: #fff; font-size: 11px; font-weight: 600; display: grid; place-items: center; flex-shrink: 0; }
.pc-tx { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
.pc-tx b { font-size: 12.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-tx small { font-size: 11px; color: var(--dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 700px) { .pc-tx { display: none; } .pc { padding: 3px; } }
</style>
