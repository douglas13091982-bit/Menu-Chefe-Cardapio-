// Importação de catálogo via GeckoAPI (https://geckoapi.com.br/docs/) — fonte pede.ai
import type { Product, Category } from './types'

const ENDPOINT = 'https://api.geckoapi.com.br/v1/extract'

export interface ImportItem {
  key: string
  name: string
  description: string
  image: string
  price: number
  addOns: { id: string; name: string; price: number }[]
  available: boolean
  startingPrice: boolean
}
export interface ImportSection { id: string; name: string; items: ImportItem[] }
export interface MerchantHit { merchantId: string; name: string; isOpen: boolean }

const norm = (s: string) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

async function call(apiKey: string, body: any) {
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Não foi possível conectar ao GeckoAPI pelo navegador (possível bloqueio de CORS). Use a opção "Colar JSON" abaixo.')
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const code = json?.errorCode || res.status
    const msg: Record<string, string> = {
      UNAUTHORIZED: 'Chave da API inválida.',
      INSUFFICIENT_CREDITS: 'Sem créditos no GeckoAPI.',
      INVALID_PAYLOAD: 'Dados inválidos (confira ID da loja e CEP).',
      RATE_LIMIT_EXCEEDED: 'Muitas requisições. Tente de novo em instantes.',
    }
    throw new Error(msg[code] || `Erro do GeckoAPI (${code}).`)
  }
  return json
}

export async function searchMerchants(apiKey: string, zipCode: string): Promise<MerchantHit[]> {
  const json = await call(apiKey, { target: 'pede.ai', type: 'plp', zipCode })
  const items = json?.data?.items || []
  return items.map((i: any) => ({ merchantId: String(i.merchantId), name: i.name, isOpen: !!i.isOpen }))
}

export async function fetchMenu(apiKey: string, merchantId: string, zipCode: string) {
  const json = await call(apiKey, { target: 'pede.ai', type: 'pdp', merchantId: String(merchantId).trim(), zipCode })
  return parseMenu(json)
}

/** Aceita a resposta completa da API ({data:{data:{menu}}}) ou só o objeto da loja / o array menu. */
export function parseMenu(json: any): { merchantName: string; sections: ImportSection[] } {
  if (json?.notFound) throw new Error('Loja não encontrada nessa fonte.')
  const root = json?.data?.data ?? json?.data ?? json
  const menu = Array.isArray(root) ? root : root?.menu
  if (!Array.isArray(menu)) throw new Error('Formato não reconhecido: não encontrei o cardápio (menu) no JSON.')
  const sections: ImportSection[] = menu
    .map((sec: any, si: number) => ({
      id: String(sec.sectionId ?? si),
      name: String(sec.name || 'Sem categoria'),
      items: (sec.items || [])
        .filter((it: any) => it && it.name && !it.hidden)
        .map((it: any, ii: number): ImportItem => {
          const price = Number(it.price ?? it.startingPrice ?? 0) || 0
          const addOns: ImportItem['addOns'] = []
          for (const g of it.variations || []) {
            for (const o of g.options || []) {
              if (o?.name && !o.outOfStock && Number(o.price) > 0) {
                addOns.push({ id: `a${si}_${ii}_${addOns.length}`, name: String(o.name), price: Number(o.price) })
              }
            }
          }
          return {
            key: `${si}:${it.itemId ?? ii}`,
            name: String(it.name),
            description: String(it.description || ''),
            image: String(it.image || ''),
            price,
            addOns,
            available: !it.outOfStock,
            startingPrice: !!it.hasStartingPrice || it.price == null,
          }
        }),
    }))
    .filter((s: ImportSection) => s.items.length > 0)
  return { merchantName: String(root?.name || ''), sections }
}

/** Monta as categorias/produtos novos, pulando o que já existe (mesmo nome na mesma categoria). */
export function buildImport(
  sections: ImportSection[],
  selected: Set<string>,
  categories: Category[],
  products: Product[],
) {
  const stamp = Date.now().toString(36)
  let seq = 0
  let order = Math.max(0, ...categories.map(c => c.order || 0))
  const newCategories: Category[] = []
  const newProducts: Product[] = []
  let skipped = 0
  const allCats = [...categories]

  for (const sec of sections) {
    const picked = sec.items.filter(i => selected.has(i.key))
    if (!picked.length) continue
    let cat = allCats.find(c => norm(c.name) === norm(sec.name))
    if (!cat) {
      cat = { id: `imp${stamp}c${seq++}`, name: sec.name, icon: '🍽️', order: ++order }
      newCategories.push(cat)
      allCats.push(cat)
    }
    for (const it of picked) {
      const exists = [...products, ...newProducts].some(p => p.categoryId === cat!.id && norm(p.name) === norm(it.name))
      if (exists) { skipped++; continue }
      newProducts.push({
        id: `imp${stamp}p${seq++}`,
        name: it.name,
        description: it.description,
        price: it.price,
        image: it.image,
        categoryId: cat.id,
        available: it.available,
        addOns: it.addOns.length ? it.addOns : undefined,
      })
    }
  }
  return { newCategories, newProducts, skipped }
}
