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

const ITEM_KEYS = ['items', 'itens', 'products', 'dishes', 'itemsList']
const GROUP_KEYS = ['variations', 'choices', 'optionGroups', 'complements', 'modifierGroups']
const OPTION_KEYS = ['options', 'garnishItens', 'garnishItems', 'items', 'itens']
const firstArr = (o: any, keys: string[]) => keys.map(k => o?.[k]).find(Array.isArray)

/** Procura (em qualquer profundidade) a lista de seções do cardápio. */
function findSections(node: any, depth = 0): any[] | null {
  if (!node || typeof node !== 'object' || depth > 6) return null
  if (Array.isArray(node)) {
    if (node.length && node.every((x: any) => x && typeof x === 'object' && firstArr(x, ITEM_KEYS))) return node
    for (const x of node) { const r = findSections(x, depth + 1); if (r) return r }
    return null
  }
  if (Array.isArray(node.menu)) { const r = findSections(node.menu, depth + 1); if (r) return r }
  for (const k of Object.keys(node)) { const r = findSections(node[k], depth + 1); if (r) return r }
  return null
}

const pickPrice = (o: any) => Number(o?.price ?? o?.unitPrice ?? o?.startingPrice ?? o?.value ?? 0) || 0
const pickImage = (o: any) => {
  const v = o?.image ?? o?.imageUrl ?? o?.logoUrl ?? o?.mainImage?.url ?? o?.images?.[0]?.url ?? o?.images?.[0] ?? ''
  return typeof v === 'string' ? v : ''
}

/** Aceita a resposta completa da API (pede.ai, iFood…) ou só o objeto da loja / o array menu. */
export function parseMenu(json: any): { merchantName: string; sections: ImportSection[] } {
  if (json?.notFound) throw new Error('Loja não encontrada nessa fonte.')
  const root = json?.data?.data ?? json?.data ?? json
  const menu = findSections(root)
  if (!menu) throw new Error('Não encontrei o cardápio nessa resposta. Cole um exemplo para eu ajustar o formato.')
  const sections: ImportSection[] = menu
    .map((sec: any, si: number) => ({
      id: String(sec.sectionId ?? sec.id ?? si),
      name: String(sec.name || sec.title || sec.description || 'Sem categoria'),
      items: (firstArr(sec, ITEM_KEYS) || [])
        .filter((it: any) => it && (it.name || it.description) && !it.hidden)
        .map((it: any, ii: number): ImportItem => {
          const hasName = !!it.name
          const price = pickPrice(it)
          const addOns: ImportItem['addOns'] = []
          for (const g of firstArr(it, GROUP_KEYS) || []) {
            for (const o of firstArr(g, OPTION_KEYS) || []) {
              const oname = o?.name || o?.description
              if (oname && !o.outOfStock && !o.unavailable && pickPrice(o) > 0) {
                addOns.push({ id: `a${si}_${ii}_${addOns.length}`, name: String(oname), price: pickPrice(o) })
              }
            }
          }
          return {
            key: `${si}:${it.itemId ?? it.id ?? ii}`,
            name: String(hasName ? it.name : it.description),
            description: String(hasName ? it.description || '' : it.details || ''),
            image: pickImage(it),
            price,
            addOns,
            available: !(it.outOfStock || it.unavailable || it.available === false),
            startingPrice: !!it.hasStartingPrice || (it.price == null && it.unitPrice == null),
          }
        }),
    }))
    .filter((s: ImportSection) => s.items.length > 0)
  if (!sections.length) throw new Error('O cardápio veio vazio. Cole um exemplo da resposta para eu ajustar o formato.')
  return { merchantName: String(root?.name || root?.merchant?.name || ''), sections }
}

export async function fetchMenuByUrl(apiKey: string, url: string, target = 'ifood.com.br') {
  const json = await call(apiKey, { target, type: 'pdp', url: url.trim() })
  return parseMenu(json)
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
