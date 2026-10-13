/**
 * Compressão e conversão automática de imagens para WebP no cliente.
 * Usado em uploads de produtos, logo, banner e identidade da plataforma.
 */

export type CompressImageOptions = {
  /** Largura máxima em pixels (mantém proporção). Default: 1600 */
  maxWidth?: number
  /** Altura máxima em pixels (mantém proporção). Default: 1600 */
  maxHeight?: number
  /** Qualidade WebP 0–1. Default: 0.82 */
  quality?: number
  /** Se true, retorna Blob em vez de data URL. Default: false */
  asBlob?: boolean
  /** Nome base do arquivo quando asBlob=true (sem extensão). */
  fileName?: string
}

export type CompressImageResult =
  | { dataUrl: string; blob?: undefined; file?: undefined; width: number; height: number; bytesApprox: number }
  | { dataUrl?: undefined; blob: Blob; file: File; width: number; height: number; bytesApprox: number }

function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Falha ao gerar o arquivo comprimido.'))
      },
      type,
      quality,
    )
  })
}

/**
 * Redimensiona (se necessário), comprime e converte para WebP.
 * Fallback para JPEG se o navegador não suportar WebP no canvas.
 */
export async function compressImageToWebP(
  file: File | Blob,
  options: CompressImageOptions = {},
): Promise<CompressImageResult> {
  const maxWidth = options.maxWidth ?? 1600
  const maxHeight = options.maxHeight ?? 1600
  const quality = options.quality ?? 0.82
  const asBlob = options.asBlob ?? false

  if (!(file instanceof Blob)) {
    throw new Error('Arquivo de imagem inválido.')
  }

  // Limite de segurança: 15 MB de entrada
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 15 MB.')
  }

  const img = await loadImageFromFile(file)
  const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height)
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem.')

  // Fundo branco para PNGs com transparência ao converter (evita fundo preto em WebP opaco)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  // Tenta WebP; se o navegador não suportar, cai para JPEG
  let mime = 'image/webp'
  let blob = await canvasToBlob(canvas, 'image/webp', quality)
  if (!blob || blob.type !== 'image/webp' || blob.size === 0) {
    mime = 'image/jpeg'
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  }

  const bytesApprox = blob.size

  if (asBlob) {
    const base = (options.fileName || 'image').replace(/\.[^.]+$/, '') || 'image'
    const ext = mime === 'image/webp' ? 'webp' : 'jpg'
    const fileOut = new File([blob], `${base}.${ext}`, { type: mime })
    return { blob, file: fileOut, width, height, bytesApprox }
  }

  // data URL (compatível com o armazenamento atual em base64 no config/produtos)
  const dataUrl =
    mime === 'image/webp'
      ? canvas.toDataURL('image/webp', quality)
      : canvas.toDataURL('image/jpeg', quality)

  return { dataUrl, width, height, bytesApprox }
}

/** Helper síncrono de validação de tipo de arquivo de imagem. */
export function isImageFile(file: File): boolean {
  return Boolean(file && file.type && file.type.startsWith('image/'))
}
