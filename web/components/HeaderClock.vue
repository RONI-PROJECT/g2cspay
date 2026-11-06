<template>
  <div class="clk" v-if="ready">
    <span class="clk-d">{{ date }}</span>
    <span class="clk-t">{{ time }}</span>
    <span class="clk-z">WIB</span>
  </div>
</template>

<script setup lang="ts">
const TZ = 'Asia/Jakarta'
const dateFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })

const ready = ref(false)
const date = ref('')
const time = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

function tick() {
  const d = new Date()
  date.value = dateFmt.format(d)
  time.value = timeFmt.format(d)
  ready.value = true
  // jadwalkan di detik berikutnya biar tidak geser (setInterval 1000ms lama-lama telat)
  timer = setTimeout(tick, 1000 - (d.getTime() % 1000) + 5)
}

function onVisible() { if (document.visibilityState === 'visible') { if (timer) clearTimeout(timer); tick() } }

onMounted(() => { tick(); document.addEventListener('visibilitychange', onVisible) })
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<style scoped>
.clk { display: flex; align-items: baseline; gap: 8px; font-size: 12px; color: var(--dim); white-space: nowrap; }
.clk-t { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; font-weight: 500; color: var(--txt); font-variant-numeric: tabular-nums; min-width: 8ch; }
.clk-z { font-size: 11px; }
@media (max-width: 900px) { .clk-d, .clk-z { display: none; } }
</style>
