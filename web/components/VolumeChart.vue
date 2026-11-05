<template>
  <div class="chart-wrap">
    <!-- HEADER -->
    <div class="chart-head">
      <div class="head-left">
        <h3 class="chart-title">Volume Transaksi</h3>
        <div class="chart-sub">
          <span class="live-dot" :class="{ on: realtime }"></span>
          <span>{{ realtime ? 'Live' : 'Diperbarui' }} · {{ lastUpdateLabel }}</span>
        </div>
      </div>

      <div class="range-toggle">
        <span
          class="range-pill"
          :style="{ transform: `translateX(${rangeIndex * 100}%)` }"
        ></span>
        <button
          v-for="r in ranges"
          :key="r.value"
          class="range-btn"
          :class="{ active: range === r.value }"
          @click="range = r.value"
        >
          {{ r.label }}
        </button>
      </div>
    </div>

    <!-- SUMMARY -->
    <div class="chart-summary">
      <strong class="sum-total">{{ rupiah(grandTotal) }}</strong>
      <span class="sum-meta">{{ totalCount }} transaksi · {{ range }} hari</span>
    </div>

    <!-- CHART -->
    <div class="chart-body" ref="bodyEl">
      <svg
        :viewBox="`0 0 ${VB_W} ${VB_H}`"
        class="chart-svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision"
        @mousemove="onMove"
        @mouseleave="hoverIdx = null"
        @touchstart="onTouch"
        @touchmove="onTouch"
        @touchend="hoverIdx = null"
      >
        <defs>
          <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style="stop-color:var(--vio)" stop-opacity="0.22" />
            <stop offset="45%" style="stop-color:var(--vio-mid)" stop-opacity="0.07" />
            <stop offset="100%" style="stop-color:var(--vio)" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" style="stop-color:var(--vio)" />
            <stop offset="60%" style="stop-color:var(--vio-mid)" />
            <stop offset="100%" style="stop-color:var(--vio)" />
          </linearGradient>
          <radialGradient id="dotGrad">
            <stop offset="0%" style="stop-color:var(--vio-mid)" />
            <stop offset="100%" style="stop-color:var(--vio)" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- GRID + Y LABEL -->
        <g>
          <line
            v-for="(g, i) in gridLines"
            :key="'g' + i"
            x1="0" :y1="g.y"
            :x2="VB_W" :y2="g.y"
            style="stroke:rgba(var(--shadow-rgb),.12)"
            stroke-dasharray="2 5"
          />
          <text
            v-for="(g, i) in gridLines"
            :key="'gt' + i"
            :x="4" :y="g.y - 4"
            font-size="11"
            style="fill:var(--dim)"
            font-family="ui-monospace, monospace"
          >
            {{ g.label }}
          </text>
        </g>

        <!-- AREA + LINE -->
        <path :d="areaPath" fill="url(#mountainGrad)" class="area-anim" />
        <path
          :d="linePath"
          fill="none"
          stroke="url(#lineGrad)"
          stroke-width="3"
          stroke-linejoin="round"
          stroke-linecap="round"
          class="line-anim"
        />

        <!-- HOVER GUIDELINE -->
        <line
          v-if="hoverIdx !== null && points[hoverIdx]"
          :x1="points[hoverIdx].x" y1="0"
          :x2="points[hoverIdx].x" :y2="VB_H - 20"
          style="stroke:rgba(var(--vio-rgb),.35)"
          stroke-width="1"
          stroke-dasharray="3 3"
        />

        <!-- HOVER POINT -->
        <g v-if="hoverIdx !== null && points[hoverIdx]">
          <circle :cx="points[hoverIdx].x" :cy="points[hoverIdx].y" r="9" style="fill:rgba(var(--vio-rgb),.16)" />
          <circle
            :cx="points[hoverIdx].x" :cy="points[hoverIdx].y" r="4.5"
            style="fill:var(--vio);stroke:var(--card)" stroke-width="2"
          />
        </g>

        <!-- LAST POINT -->
        <circle
          v-if="points.length && hoverIdx !== points.length - 1"
          :cx="points[points.length - 1].x"
          :cy="points[points.length - 1].y"
          r="3.5"
          style="fill:var(--vio-mid);stroke:var(--card)"
          stroke-width="1.5"
        />

        <!-- X LABEL -->
        <g>
          <text
            v-for="(p, i) in labelPoints"
            :key="'lbl' + i"
            :x="p.x" :y="VB_H - 6"
            font-size="11"
            :style="{ fill: hoverIdx === p.idx ? 'var(--vio)' : 'var(--dim)' }"
            text-anchor="middle"
            font-family="ui-monospace, monospace"
            :font-weight="hoverIdx === p.idx ? '800' : '500'"
          >
            {{ p.label }}
          </text>
        </g>
      </svg>

      <!-- EMPTY STATE -->
      <div v-if="isEmpty" class="chart-empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <p>Belum ada transaksi</p>
        <span>Data akan muncul di sini</span>
      </div>

      <!-- TOOLTIP -->
      <div
        v-if="hoverIdx !== null && points[hoverIdx]"
        class="chart-tooltip"
        :style="{ left: tooltipLeft, top: tooltipTop }"
        :class="{ flip: flipTooltip }"
      >
        <div class="tt-date">{{ points[hoverIdx].fullLabel }}</div>
        <div class="tt-row">
          <span>Total</span>
          <strong>{{ rupiah(points[hoverIdx].value) }}</strong>
        </div>
        <div v-if="points[hoverIdx].count > 0" class="tt-row">
          <span>Transaksi</span>
          <strong>{{ points[hoverIdx].count }}x</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SeriesPoint {
  label?: string
  date?: string
  fullLabel?: string
  value?: number
  paidAmount?: number
  amount?: number
  total?: number
  count?: number
}

const props = withDefaults(defineProps<{
  series: SeriesPoint[]
  realtime?: boolean
  refreshMs?: number
}>(), {
  realtime: false,
  refreshMs: 30000,
})

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const hoverIdx = ref<number | null>(null)
const range = ref<number>(7)
const lastUpdate = ref<number>(Date.now())

const ranges = [
  { label: '7H', value: 7 },
  { label: '30H', value: 30 },
  { label: '90H', value: 90 },
]

const rangeIndex = computed(() =>
  Math.max(ranges.findIndex(r => r.value === range.value), 0)
)

const VB_W = ref(600)
const VB_H = ref(200)
const bodyEl = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!bodyEl.value || typeof ResizeObserver === 'undefined') return
  ro = new ResizeObserver(([e]) => {
    const w = Math.round(e.contentRect.width), h = Math.round(e.contentRect.height)
    if (w > 40) VB_W.value = w
    if (h > 40) VB_H.value = h
  })
  ro.observe(bodyEl.value)
})
onBeforeUnmount(() => ro?.disconnect())
const PAD_X = 44
const PAD_TOP = 16
const PAD_BOTTOM = 28

const lastUpdateLabel = computed(() => {
  const d = new Date(lastUpdate.value)
  return d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
})

function rupiah(n: number) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}

function shortRupiah(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'M'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'jt'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'rb'
  return String(n)
}

function extractValue(p: any): number {
  if (!p) return 0
  return Number(p.value ?? p.paidAmount ?? p.amount ?? p.total ?? 0)
}
function extractCount(p: any): number {
  if (!p) return 0
  return Number(p.count ?? p.paid ?? 0)
}

const WIB = 'Asia/Jakarta'
// tanggal hari ini di Jakarta (YYYY-MM-DD), bukan tanggal timezone browser/server
function jakartaToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: WIB })
}
function shiftDay(iso: string, back: number): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - back))
}

const series = computed(() => {
  const dataMap = new Map<string, SeriesPoint>()

  if (props.series && Array.isArray(props.series)) {
    for (const p of props.series) {
      if (p?.date) {
        dataMap.set(String(p.date).slice(0, 10), p)
      }
    }
  }

  const result = []
  const todayIso = jakartaToday()

  for (let i = range.value - 1; i >= 0; i--) {
    const d = shiftDay(todayIso, i)
    const isoKey = d.toISOString().slice(0, 10)
    const found = dataMap.get(isoKey)

    result.push({
      label: `${isoKey.slice(8, 10)}/${isoKey.slice(5, 7)}`,
      fullLabel: d.toLocaleDateString('id-ID', {
        timeZone: 'UTC',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      value: found ? extractValue(found) : 0,
      count: found ? extractCount(found) : 0,
    })
  }
  return result
})

const grandTotal = computed(() =>
  series.value.reduce((a, s) => a + s.value, 0)
)
const totalCount = computed(() =>
  series.value.reduce((a, s) => a + s.count, 0)
)
const isEmpty = computed(() => grandTotal.value === 0 && totalCount.value === 0)

const maxVal = computed(() => {
  const m = Math.max(...series.value.map(s => s.value), 0)
  if (m === 0) return 1000
  const pow = Math.pow(10, Math.floor(Math.log10(m)))
  return Math.ceil((m * 1.1) / pow) * pow
})

const points = computed(() => {
  const n = series.value.length
  const stepX = (VB_W.value - PAD_X * 2) / Math.max(n - 1, 1)
  const usableH = VB_H.value - PAD_TOP - PAD_BOTTOM
  return series.value.map((s, i) => {
    const x = PAD_X + i * stepX
    const ratio = maxVal.value > 0 ? s.value / maxVal.value : 0
    const y = PAD_TOP + (1 - ratio) * usableH
    return {
      x,
      y,
      value: s.value,
      label: s.label,
      fullLabel: s.fullLabel,
      count: s.count,
    }
  })
})

// Label tanggal - jumlah label menyesuaikan range biar gak numpuk
const labelPoints = computed(() => {
  const pts = points.value
  const n = pts.length
  const targetLabels = range.value <= 7 ? n : range.value <= 30 ? 8 : 6
  if (n <= targetLabels) {
    return pts.map((p, i) => ({ x: p.x, label: p.label, idx: i }))
  }
  const step = Math.ceil(n / targetLabels)
  return pts
    .map((p, i) => ({ x: p.x, label: p.label, idx: i }))
    .filter((_, i) => i % step === 0 || i === n - 1)
})

const linePath = computed(() => {
  const p = points.value
  if (p.length < 2) return ''
  let d = `M ${p[0].x.toFixed(2)},${p[0].y.toFixed(2)}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
})

const areaPath = computed(() => {
  const p = points.value
  if (p.length < 2) return ''
  const line = linePath.value
  const lastX = p[p.length - 1].x
  const firstX = p[0].x
  const baseY = VB_H.value - PAD_BOTTOM
  return `${line} L${lastX.toFixed(2)},${baseY.toFixed(2)} L${firstX.toFixed(2)},${baseY.toFixed(2)} Z`
})

const gridLines = computed(() => {
  const lines = []
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4
    const value = maxVal.value * (1 - ratio)
    const y = PAD_TOP + ratio * (VB_H.value - PAD_TOP - PAD_BOTTOM)
    lines.push({ y, label: 'Rp ' + shortRupiah(value) })
  }
  return lines
})

const flipTooltip = computed(() => {
  if (hoverIdx.value === null) return false
  return hoverIdx.value > points.value.length / 2
})

const tooltipLeft = computed(() => {
  if (hoverIdx.value === null || !points.value[hoverIdx.value]) return '0'
  return `${(points.value[hoverIdx.value].x / VB_W.value) * 100}%`
})
const tooltipTop = computed(() => {
  if (hoverIdx.value === null || !points.value[hoverIdx.value]) return '0'
  return `${(points.value[hoverIdx.value].y / VB_H.value) * 100}%`
})

function pickIndex(clientX: number, rect: DOMRect) {
  const relX = ((clientX - rect.left) / rect.width) * VB_W.value
  let closest = 0
  let minDist = Infinity
  points.value.forEach((p, i) => {
    const d = Math.abs(p.x - relX)
    if (d < minDist) { minDist = d; closest = i }
  })
  return closest
}

function onMove(e: MouseEvent) {
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
  hoverIdx.value = pickIndex(e.clientX, rect)
}
function onTouch(e: TouchEvent) {
  if (e.touches.length === 0) return
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
  hoverIdx.value = pickIndex(e.touches[0].clientX, rect)
}

watch(range, () => { hoverIdx.value = null })
watch(() => props.series, () => { lastUpdate.value = Date.now() }, { deep: true })

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (props.realtime) {
    timer = setInterval(() => {
      lastUpdate.value = Date.now()
      emit('refresh')
    }, props.refreshMs)
  }
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.chart-wrap {
  position: relative;
  width: 100%;
  background: #ffffff;
  border: 1px solid var(--line, #efe4e5);
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
  font-family: 'Inter', system-ui, sans-serif;
  box-shadow: 0 1px 2px rgba(15,23,42,.06);
}

/* HEAD */
.chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.chart-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--txt, #0f172a);
  letter-spacing: -0.01em;
}
.chart-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 10.5px;
  color: var(--dim, #64748b);
  font-weight: 500;
}
.live-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--line-2, #e2cfd1);
}
.live-dot.on {
  background: #10b981;
  box-shadow: 0 1px 2px rgba(15,23,42,.06);
  animation: pulse 1.8s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 1px 2px rgba(15,23,42,.06); }
  70% { box-shadow: 0 1px 2px rgba(15,23,42,.06); }
  100% { box-shadow: 0 1px 2px rgba(15,23,42,.06); }
}

/* RANGE TOGGLE - 3 tombol */
.range-toggle {
  position: relative;
  display: inline-flex;
  background: var(--bg-soft, #f8fafc);
  border: 1px solid var(--line, #efe4e5);
  border-radius: 8px;
  padding: 3px;
}
.range-pill {
  position: absolute;
  top: 3px; left: 3px;
  width: calc((100% - 6px) / 3);
  height: calc(100% - 6px);
  background: var(--grad, #0d9488);
  border-radius: 7px;
  transition: transform 0.25s cubic-bezier(.5,.1,.2,1);
  pointer-events: none;
  box-shadow: 0 1px 2px rgba(15,23,42,.06);
}
.range-btn {
  position: relative;
  z-index: 1;
  padding: 5px 14px;
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 700;
  color: var(--dim, #64748b);
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.03em;
  transition: color 0.2s;
  border-radius: 7px;
}
.range-btn:hover { color: var(--txt, #0f172a); }
.range-btn.active { color: #ffffff; }

/* SUMMARY - tanpa delta */
.chart-summary {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  padding: 0 2px;
}
.sum-total {
  font-size: 13px;
  font-weight: 700;
  color: var(--txt, #0f172a);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.sum-meta {
  font-size: 11.5px;
  color: var(--dim, #64748b);
  font-weight: 550;
}

/* CHART BODY */
.chart-body {
  position: relative;
  width: 100%;
  height: 200px;
}
.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
  overflow: visible;
}

.area-anim { animation: fadeIn 0.4s ease; }
.line-anim {
  stroke-dasharray: 3000;
  stroke-dashoffset: 3000;
  animation: draw 0.9s cubic-bezier(.4,0,.2,1) forwards;
}
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* EMPTY */
.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
  pointer-events: none;
}
.empty-icon {
  width: 44px; height: 44px;
  border-radius: 8px;
  background: var(--bg-soft, #f8fafc);
  border: 1px solid var(--line, #efe4e5);
  color: var(--vio, #0d9488);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.empty-icon svg { width: 20px; height: 20px; }
.chart-empty p {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--dim, #64748b);
}
.chart-empty span {
  font-size: 10.5px;
  color: var(--dim, #64748b);
  opacity: 0.7;
}

/* TOOLTIP */
.chart-tooltip {
  position: absolute;
  transform: translate(-50%, calc(-100% - 14px));
  background: #ffffff;
  border: 1px solid rgba(13,148,136,0.25);
  color: var(--txt, #0f172a);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 1px 2px rgba(15,23,42,.06);
  pointer-events: none;
  white-space: nowrap;
  transition: left 0.1s ease, top 0.1s ease;
  z-index: 10;
  min-width: 140px;
}
.chart-tooltip.flip {
  transform: translate(-100%, calc(-100% - 14px));
}
.tt-date {
  font-size: 11.5px;
  color: var(--dim, #64748b);
  margin-bottom: 6px;
  font-weight: 600;
}
.tt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  font-size: 13px;
  margin-top: 3px;
}
.tt-row span { color: var(--dim, #64748b); font-size: 11.5px; }
.tt-row strong { color: var(--vio-deep, #134e4a); font-weight: 700; font-size: 13px; }

/* RESPONSIVE */
@media (max-width: 420px) {
  .chart-wrap { padding: 14px 12px; border-radius: 8px; }
  .sum-total { font-size: 13px; }
  .chart-body { height: 180px; }
  .range-btn { padding: 5px 10px; font-size: 10.5px; }
}
</style>