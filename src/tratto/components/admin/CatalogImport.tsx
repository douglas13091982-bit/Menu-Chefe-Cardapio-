// @ts-nocheck
import { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import { searchMerchants, fetchMenu, fetchMenuByUrl, parseMenu, buildImport } from '../../geckoImport'

const money = (n) => 'R$ ' + Number(n).toFixed(2).replace('.', ',')
const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm'

export default function CatalogImport({ onClose }) {
  const { categories, products, addCategory, addProduct } = useStore()
  const [source, setSource] = useState('ifood')
  const [storeUrl, setStoreUrl] = useState('')
  const [zip, setZip] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [hits, setHits] = useState([])
  const [pasted, setPasted] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menu, setMenu] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [done, setDone] = useState('')
  const [csvCatalog, setCsvCatalog] = useState(null)
  const [csvFilename, setCsvFilename] = useState('')

  const run = async (fn) => {
    setError(''); setDone(''); setLoading(true)
    try { await fn() } catch (e) { setError(e.message || 'Erro inesperado.') } finally { setLoading(false) }
  }
  const load = (m) => {
    setMenu(m)
    setSelected(new Set(m.sections.flatMap(s => s.items.map(i => i.key))))
  }

  // Importação direta do CSV exportado pelo Cardápio Web.
  const parseCsv = (text) => {
    const sample = text.split(/\\r?\\n/, 1)[0] || ''
    const delimiter = (sample.match(/;/g) || []).length > (sample.match(/,/g) || []).length ? ';' : ','
    const rows = []
    let row = [], cell = '', quoted = false
    const input = text.replace(/^\\uFEFF/, '')
    for (let i = 0; i < input.length; i++) {
      const ch = input[i]
      if (ch === '"' && quoted && input[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = !quoted
      else if (ch === delimiter && !quoted) { row.push(cell); cell = '' }
      else if ((ch === '\\n' || ch === '\\r') && !quoted) {
        if (ch === '\\r' && input[i + 1] === '\\n') i++
        row.push(cell); cell = ''
        if (row.some(v => String(v).trim())) rows.push(row)
        row = []
      } else cell += ch
    }
    row.push(cell)
    if (row.some(v => String(v).trim())) rows.push(row)
    if (rows.length < 2) throw new Error('O CSV não contém linhas de produtos.')
    const headers = rows.shift().map(h => String(h).trim().toLowerCase())
    return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, String(values[i] ?? '').trim()])))
  }
  const loadCsv = async (file) => run(async () => {
    if (!file) return
    const text = await file.text()
    const rows = parseCsv(text)
    const required = ['produto_id', 'categoria_id', 'categoria', 'produto', 'preco', 'status']
    const missing = required.filter(k => !(k in (rows[0] || {})))
    if (missing.length) throw new Error('Este arquivo não parece ser a exportação esperada do Cardápio Web. Campos ausentes: ' + missing.join(', '))
    const categoryMap = new Map()
    rows.forEach((r, index) => {
      const id = r.categoria_id || ('sem-categoria-' + index)
      if (!categoryMap.has(id)) categoryMap.set(id, {
        sourceId: id,
        name: r.categoria || 'Outros',
        description: r.categoria_descricao || '',
        image: r.categoria_foto_url || '',
        order: categoryMap.size + 1
      })
    })
    const parsePrice = (value) => {
      const raw = String(value ?? '').trim()
      if (!raw) return NaN
      const normalized = raw.includes(',') ? raw.replace(/\\./g, '').replace(',', '.') : raw
      return Number(normalized)
    }
    const parsedProducts = rows.map((r, index) => {
      const price = parsePrice(r.preco || '0') || 0
      const promo = parsePrice(r.preco_promocional)
      const promoActive = ['sim', 'true', '1', 'yes'].includes(String(r.promocao_ativa || '').toLowerCase()) && Number.isFinite(promo) && promo > 0
      return {
        sourceId: r.produto_id || String(index + 1),
        name: r.produto || 'Produto sem nome',
        description: r.descricao || '',
        price: promoActive ? promo : price,
        image: r.foto_url || r.miniatura_url || '',
        categorySourceId: r.categoria_id || ('sem-categoria-' + index),
        categoryName: r.categoria || 'Outros',
        available: String(r.status || '').toUpperCase() === 'ACTIVE',
        popular: ['sim', 'true', '1', 'yes'].includes(String(r.destaque || '').toLowerCase()) || String(r.selo || '').toLowerCase() === 'best_seller'
      }
    })
    setCsvCatalog({ categories: [...categoryMap.values()], products: parsedProducts })
    setCsvFilename(file.name)
    setMenu(null)
    setDone('')
  })

  const doSearch = () => run(async () => {
    const r = await searchMerchants(zip)
    setHits(r)
    if (!r.length) throw new Error('Nenhuma loja encontrada para esse CEP.')
  })
  const doFetch = () => run(async () => {
    load(source === 'ifood' ? await fetchMenuByUrl(storeUrl) : await fetchMenu(merchantId, zip))
  })
  const doParse = () => run(async () => {
    let json
    try { json = JSON.parse(pasted) } catch { throw new Error('O texto colado não é um JSON válido.') }
    load(parseMenu(json))
  })

  const toggle = (key) => setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  const toggleSection = (sec) => setSelected(prev => {
    const n = new Set(prev)
    const all = sec.items.every(i => n.has(i.key))
    sec.items.forEach(i => all ? n.delete(i.key) : n.add(i.key))
    return n
  })

  const doImport = () => {
    if (csvCatalog) {
      const categoryBySource = new Map()
      let categoryCount = 0
      csvCatalog.categories.forEach((sourceCategory, index) => {
        const existing = categories.find(c => c.name.trim().toLowerCase() === sourceCategory.name.trim().toLowerCase())
        const id = existing?.id || ('cw-cat-' + sourceCategory.sourceId)
        categoryBySource.set(sourceCategory.sourceId, id)
        if (!existing) {
          addCategory({ id, name: sourceCategory.name, icon: '', order: sourceCategory.order || index + 1 })
          categoryCount++
        }
      })
      let productCount = 0, skipped = 0
      csvCatalog.products.forEach((sourceProduct) => {
        const categoryId = categoryBySource.get(sourceProduct.categorySourceId)
        const exists = products.some(p => p.name.trim().toLowerCase() === sourceProduct.name.trim().toLowerCase() && p.categoryId === categoryId)
        if (exists) { skipped++; return }
        addProduct({
          id: 'cw-prod-' + sourceProduct.sourceId,
          name: sourceProduct.name,
          description: sourceProduct.description,
          price: sourceProduct.price,
          image: sourceProduct.image,
          categoryId,
          popular: sourceProduct.popular,
          available: sourceProduct.available
        })
        productCount++
      })
      setDone(`${productCount} produto(s) e ${categoryCount} categoria(s) importados do Cardápio Web.${skipped ? ` ${skipped} produto(s) já existentes foram ignorados.` : ''}`)
      setCsvCatalog(null)
      return
    }
    const { newCategories, newProducts, skipped } = buildImport(menu.sections, selected, categories, products)
    newCategories.forEach(addCategory)
    newProducts.forEach(addProduct)
    setDone(`${newProducts.length} produto(s) e ${newCategories.length} categoria(s) importados.${skipped ? ` ${skipped} já existiam e foram ignorados.` : ''}`)
    setMenu(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Importar catálogo</h2>
            <p className="text-xs text-gray-500">Importe por link (iFood/pede.ai) ou por arquivo CSV do Cardápio Web.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100" aria-label="Fechar">✕</button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {done && <p className="text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg p-3">{done}</p>}
          {error && <p className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg p-3">{error}</p>}

          {!menu && !csvCatalog && (
            <>
              <section className="rounded-xl border border-dashed border-[#d9273f]/50 bg-red-50/40 p-4 space-y-2">
                <h3 className="font-semibold text-sm text-gray-800">Importar exportação do Cardápio Web</h3>
                <p className="text-xs text-gray-600">Selecione o CSV exportado no painel. Categorias, descrições, preços, disponibilidade e links de imagens serão mapeados para esta loja.</p>
                <input type="file" accept=".csv,text/csv" disabled={loading} onChange={e => { const f = e.target.files?.[0]; if (f) loadCsv(f); e.target.value = '' }} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 border rounded-lg bg-white" />
              </section>
              <div className="flex gap-2 text-sm">
                {[['ifood', 'iFood (link da loja)'], ['pedeai', 'pede.ai (CEP + ID)']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setSource(v)}
                    className={`px-3 py-1.5 rounded-full border ${source === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white'}`}>{l}</button>
                ))}
              </div>
              {source === 'ifood' ? (
                <label className="block text-sm">Link da loja no iFood
                  <input className={inputCls} value={storeUrl} onChange={e => setStoreUrl(e.target.value)} placeholder="https://www.ifood.com.br/delivery/..." />
                </label>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-sm">CEP da região
                    <input className={inputCls} value={zip} onChange={e => setZip(e.target.value)} placeholder="89200-000" inputMode="numeric" />
                  </label>
                  <label className="block text-sm">ID da loja (merchantId)
                    <input className={inputCls} value={merchantId} onChange={e => setMerchantId(e.target.value)} placeholder="Ex.: 35275" />
                  </label>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button disabled={loading || (source === 'ifood' ? !/^https?:\/\//.test(storeUrl.trim()) : !zip || !merchantId)} onClick={doFetch}
                  className="bg-green-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm font-semibold">
                  {loading ? 'Buscando…' : 'Buscar cardápio'}
                </button>
                {source === 'pedeai' && (
                  <button disabled={loading || !zip} onClick={doSearch}
                    className="border rounded-lg px-4 py-2 text-sm disabled:opacity-50">Não sei o ID: listar lojas do CEP</button>
                )}
              </div>

              {hits.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {hits.map(h => (
                    <button key={h.merchantId} onClick={() => setMerchantId(h.merchantId)}
                      className={`w-full text-left px-3 py-2 text-sm flex justify-between hover:bg-gray-50 ${merchantId === h.merchantId ? 'bg-green-50' : ''}`}>
                      <span>{h.name}</span><span className="text-xs text-gray-500">ID {h.merchantId}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t pt-3">
                <button onClick={() => setShowPaste(v => !v)} className="text-sm text-gray-600 underline">
                  {showPaste ? 'Esconder' : 'Colar JSON'} (alternativa se a importação automática falhar)
                </button>
                {showPaste && (
                  <div className="mt-2 space-y-2">
                    <textarea className={inputCls + ' h-32 font-mono text-xs'} value={pasted} onChange={e => setPasted(e.target.value)} placeholder="Cole aqui a resposta JSON do GeckoAPI (cardápio da loja)" />
                    <button disabled={loading || !pasted.trim()} onClick={doParse}
                      className="border rounded-lg px-4 py-2 text-sm disabled:opacity-50">Ler JSON</button>
                  </div>
                )}
              </div>
            </>
          )}

          {csvCatalog && (
            <section className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <strong>Arquivo validado:</strong> {csvFilename}<br />
                {csvCatalog.categories.length} categorias e {csvCatalog.products.length} produtos encontrados. {csvCatalog.products.filter(p => p.available).length} disponíveis e {csvCatalog.products.filter(p => !p.available).length} indisponíveis.
              </div>
              <div className="max-h-72 overflow-y-auto rounded-lg border divide-y">
                {csvCatalog.categories.map(cat => {
                  const items = csvCatalog.products.filter(p => p.categorySourceId === cat.sourceId)
                  return <div key={cat.sourceId} className="p-3"><div className="font-semibold text-sm">{cat.name} <span className="text-gray-500 font-normal">({items.length})</span></div>{items.slice(0, 3).map(p => <div key={p.sourceId} className="flex items-center gap-3 py-2 text-sm">{p.image && <img src={p.image} alt="" className="w-10 h-10 rounded object-cover" loading="lazy" />}<span className="min-w-0 flex-1"><span className="block truncate">{p.name}</span><span className="text-xs text-gray-500">{p.available ? 'Disponível' : 'Indisponível'}</span></span><span className="whitespace-nowrap">{money(p.price)}</span></div>)}{items.length > 3 && <p className="text-xs text-gray-500">e mais {items.length - 3} produto(s)…</p>}</div>
                })}
              </div>
              <p className="text-xs text-gray-500">Os produtos serão gravados somente na loja aberta neste painel. Produtos com o mesmo nome e categoria serão ignorados para evitar duplicações.</p>
            </section>
          )}

          {menu && (
            <>
              <p className="text-sm text-gray-600">
                {menu.merchantName && <strong>{menu.merchantName} — </strong>}
                {selected.size} de {menu.sections.reduce((n, s) => n + s.items.length, 0)} itens selecionados. Itens que já existem na mesma categoria são ignorados.
              </p>
              <div className="space-y-3">
                {menu.sections.map(sec => (
                  <div key={sec.id} className="border rounded-lg">
                    <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 font-semibold text-sm rounded-t-lg">
                      <input type="checkbox" checked={sec.items.every(i => selected.has(i.key))} onChange={() => toggleSection(sec)} />
                      {sec.name} <span className="text-xs text-gray-500 font-normal">({sec.items.length})</span>
                    </label>
                    <div className="divide-y">
                      {sec.items.map(it => (
                        <label key={it.key} className="flex items-start gap-3 px-3 py-2 text-sm">
                          <input type="checkbox" className="mt-1" checked={selected.has(it.key)} onChange={() => toggle(it.key)} />
                          {it.image && <img src={it.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" loading="lazy" />}
                          <span className="flex-1 min-w-0">
                            <span className="block font-medium">{it.name}</span>
                            {it.description && <span className="block text-xs text-gray-500 line-clamp-2">{it.description}</span>}
                            {it.addOns.length > 0 && <span className="block text-xs text-gray-500">{it.addOns.length} adicional(is)</span>}
                            {!it.available && <span className="text-xs text-red-600">indisponível</span>}
                          </span>
                          <span className="whitespace-nowrap">{it.startingPrice && it.price > 0 ? 'a partir de ' : ''}{money(it.price)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {(menu || csvCatalog) && (
          <div className="p-4 border-t flex gap-2 justify-end">
            <button onClick={() => { setMenu(null); setCsvCatalog(null) }} className="border rounded-lg px-4 py-2 text-sm">Voltar</button>
            <button disabled={loading || (csvCatalog ? csvCatalog.products.length === 0 : selected.size === 0)} onClick={doImport} className="bg-green-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm font-semibold">
              {csvCatalog ? `Importar ${csvCatalog.products.length} produtos` : `Importar ${selected.size} item(ns)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
