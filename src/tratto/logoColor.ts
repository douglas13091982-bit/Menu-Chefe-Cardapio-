// Descobre a cor de fundo do banner a partir do logo enviado pela loja.
// - Logo com fundo sólido (ex.: quadrado preto): usa exatamente a cor da borda, para o logo se fundir ao banner.
// - Logo com fundo transparente: usa um tom escuro (se o logo é claro) ou claro (se o logo é escuro) da cor principal do logo.

const cache = new Map<string, string | null>()

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
const rgbString = (r: number, g: number, b: number) => `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

function hslString(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

// `data` = pixels RGBA de uma imagem quadrada `size` x `size`
export function backgroundFromPixels(data: ArrayLike<number>, size: number): string | null {
  const ring = Math.max(2, Math.round(size / 20))
  let borderTotal = 0
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!(x < ring || y < ring || x >= size - ring || y >= size - ring)) continue
      borderTotal++
      const i = (y * size + x) * 4
      if (data[i + 3] < 200) continue
      const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3)
      const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 }
      b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]
      buckets.set(key, b)
    }
  }

  let opaqueBorder = 0
  let best: { n: number; r: number; g: number; b: number } | null = null
  buckets.forEach(b => { opaqueBorder += b.n; if (!best || b.n > best.n) best = b })

  // fundo sólido: a borda é majoritariamente opaca
  if (best && borderTotal > 0 && opaqueBorder / borderTotal >= 0.5) {
    return rgbString(best.r / best.n, best.g / best.n, best.b / best.n)
  }

  // fundo transparente: deriva a cor do próprio desenho do logo
  let count = 0, lumSum = 0, vx = 0, vy = 0, weight = 0
  for (let i = 0; i < size * size * 4; i += 4) {
    if (data[i + 3] < 200) continue
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
    count++
    lumSum += l
    if (s > 0.25 && l > 0.15 && l < 0.85) {
      vx += Math.cos((h * Math.PI) / 180) * s
      vy += Math.sin((h * Math.PI) / 180) * s
      weight += s
    }
  }
  if (count === 0) return null
  const meanL = lumSum / count
  const hue = weight > 0 ? ((Math.atan2(vy, vx) * 180) / Math.PI + 360) % 360 : 0
  const sat = weight > 0 ? 0.35 : 0
  return meanL >= 0.55 ? hslString(hue, sat, 0.12) : hslString(hue, sat > 0 ? 0.45 : 0, 0.93)
}

function computeBackground(img: HTMLImageElement): string | null {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, size, size)
  return backgroundFromPixels(ctx.getImageData(0, 0, size, size).data, size)
}

export function extractLogoBackground(src: string): Promise<string | null> {
  if (cache.has(src)) return Promise.resolve(cache.get(src) ?? null)
  return new Promise(resolve => {
    const img = new Image()
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous'
    img.onload = () => {
      let result: string | null = null
      try { result = computeBackground(img) } catch { result = null }
      cache.set(src, result)
      resolve(result)
    }
    img.onerror = () => { cache.set(src, null); resolve(null) }
    img.src = src
  })
}
