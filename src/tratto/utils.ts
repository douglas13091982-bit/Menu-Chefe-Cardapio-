// Utilitários compartilhados do domínio Tratto.

/**
 * Gera um id único e monotônico para entidades criadas no painel.
 * Combina timestamp + contador + aleatoriedade para evitar colisões
 * quando duas entidades são criadas no mesmo milissegundo
 * (falha conhecida do padrão `Date.now().toString()`).
 */
let idCounter = 0
export function generateId(prefix = ''): string {
  idCounter = (idCounter + 1) % 1e6
  const random = Math.floor(Math.random() * 1e6)
    .toString(36)
    .padStart(4, '0')
  return `${prefix}${Date.now().toString(36)}-${idCounter.toString(36)}-${random}`
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB — limite exibido na UI de uploads

/**
 * Lê uma imagem selecionada pelo usuário como data URL, validando tipo e
 * tamanho antes de aceitar. Retorna `{ ok: true, dataUrl }` ou
 * `{ ok: false, error }` com mensagem amigável em pt-BR.
 *
 * Centraliza a validação usada nos uploads de logo (Configurações) e de foto
 * de produto, evitando duplicação e uploads silenciosamente inválidos que
 * estourariam a cota do localStorage.
 */
export async function readImageFileAsDataUrl(
  file: File | undefined | null,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (!file) return { ok: false, error: 'Nenhum arquivo selecionado.' }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Por favor, selecione um arquivo de imagem (PNG, JPG...).' }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'Imagem muito grande. O limite é 5MB.' }
  }
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo.'))
      reader.readAsDataURL(file)
    })
    // Data URLs ocupam ~4/3 do tamanho original; revalida após a conversão.
    if (dataUrl.length > MAX_UPLOAD_BYTES * 1.4) {
      return { ok: false, error: 'Imagem muito grande após conversão. Escolha uma imagem menor.' }
    }
    return { ok: true, dataUrl }
  } catch {
    return { ok: false, error: 'Não foi possível ler a imagem. Tente novamente.' }
  }
}
