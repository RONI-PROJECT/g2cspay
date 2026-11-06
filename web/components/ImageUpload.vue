<!-- components/ImageUpload.vue - upload gambar ke admin panel (resize di browser, simpan ke DB) -->
<template>
  <div class="iu" :class="{ compact }">
    <div class="iu-prev" :style="{ background: dark ? '#0f172a' : '#f8fafc' }">
      <img v-if="modelValue" :src="modelValue" :alt="label" @error="broken = true" />
      <span v-else class="iu-empty">{{ fallback || 'Kosong' }}</span>
    </div>
    <div class="iu-body">
      <div v-if="label && !compact" class="iu-label">{{ label }}</div>
      <div class="iu-actions">
        <button type="button" class="iu-btn" :disabled="busy" @click="pick">
          {{ busy ? 'Mengunggah' : modelValue ? 'Ganti' : 'Unggah' }}
        </button>
        <button v-if="modelValue" type="button" class="iu-btn iu-del" :disabled="busy" @click="remove">Hapus</button>
      </div>
      <div v-if="hint && !compact" class="iu-hint">{{ hint }}</div>
      <div v-if="err" class="iu-err">{{ err }}</div>
    </div>
    <input ref="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,.ico" hidden @change="onFile" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  assetKey: string          // logo | favicon | og | bank-BCA
  label?: string
  hint?: string
  fallback?: string
  maxSize?: number          // sisi terpanjang hasil resize (px)
  compact?: boolean
  dark?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const file = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const err = ref('')
const broken = ref(false)

function pick() { err.value = ''; file.value?.click() }

function toDataUrl(f: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const isIco = /icon/.test(f.type) || /\.ico$/i.test(f.name)
    const rd = new FileReader()
    rd.onerror = () => reject(new Error('Gagal membaca file'))
    rd.onload = () => {
      const src = String(rd.result)
      if (isIco || f.type === 'image/gif') return resolve(src)
      const img = new Image()
      img.onerror = () => reject(new Error('File bukan gambar valid'))
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
        const cx = c.getContext('2d')!
        cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high'
        cx.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL(f.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9))
      }
      img.src = src
    }
    rd.readAsDataURL(f)
  })
}

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!f) return
  busy.value = true; err.value = ''
  try {
    const dataUrl = await toDataUrl(f, props.maxSize || 512)
    const r: any = await $fetch('/api/admin-panel/upload', {
      method: 'POST', credentials: 'include',
      body: { key: props.assetKey, dataUrl },
    })
    broken.value = false
    emit('update:modelValue', r.url)
  } catch (ex: any) {
    err.value = ex?.data?.error || ex?.message || 'Gagal mengunggah'
  } finally { busy.value = false }
}

async function remove() {
  busy.value = true; err.value = ''
  try {
    await $fetch('/api/admin-panel/upload/' + props.assetKey, { method: 'DELETE', credentials: 'include' })
    emit('update:modelValue', '')
  } catch (ex: any) {
    err.value = ex?.data?.error || 'Gagal menghapus'
  } finally { busy.value = false }
}
</script>

<style scoped>
.iu { display: flex; align-items: center; gap: 14px; }
.iu-prev {
  width: 84px; height: 84px; flex-shrink: 0; border-radius: 8px;
  border: 1px dashed var(--line-2); display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.compact .iu-prev { width: 44px; height: 44px; border-radius: 8px; }
.iu-prev img { max-width: 80%; max-height: 80%; object-fit: contain; }
.iu-empty { font-size: 11px; color: var(--dim); font-weight: 700; text-align: center; padding: 0 4px; }
.iu-body { min-width: 0; }
.iu-label { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.iu-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.iu-btn {
  padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;
  background: var(--card); border: 1px solid var(--line-2); color: var(--txt); transition: all .15s;
}
.iu-btn:hover:not(:disabled) { border-color: var(--vio); color: var(--vio); }
.iu-btn:disabled { opacity: .5; cursor: wait; }
.iu-del { color: var(--err); }
.iu-del:hover:not(:disabled) { border-color: var(--err); color: var(--err); }
.iu-hint { font-size: 11.5px; color: var(--dim); margin-top: 8px; line-height: 1.5; }
.iu-err { font-size: 11.5px; color: var(--err); margin-top: 6px; }
</style>
