// @ts-nocheck
import { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import { searchMerchants, fetchMenu, parseMenu, buildImport } from '../../geckoImport'

const KEY = 'tratto_gecko_key'
const lsGet = (k) => { try { return localStorage.getItem(k) || '' } catch { return '' } }
const lsSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k) } catch {} }
const money = (n) => 'R$ ' + Number(n).toFixed(2).replace('.', ',')
const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm'

export default function CatalogImport({ onClose }) {
  const { categories, products, addCategory, addProduct } = useStore()
  const [apiKey, setApiKey] = useState(lsGet(KEY))
  const [remember, setRemember] = useState(!!lsGet(KEY))
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

  const persistKey = () => lsSet(KEY, remember ? apiKey.trim() : '')
  const run = async (fn) => {
    setError(''); setDone(''); setLoading(true)
    try { await fn() } catch (e) { setError(e.message || 'Erro inesperado.') } finally { setLoading(false) }
  }
  const load = (m) => {
    setMenu(m)
    setSelected(new Set(m.sections.flatMap(s => s.items.map(i => i.key))))
  }

  const doSearch = () => run(async () => {
    persistKey()
    const r = await searchMerchants(apiKey, zip)
    setHits(r)
    if (!r.length) throw new Error('Nenhuma loja encontrada para esse CEP.')
  })
  const doFetch = () => run(async () => {
    persistKey()
    load(await fetchMenu(apiKey, merchantId, zip))
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
            <p className="text-xs text-gray-500">Puxa o cardápio de uma loja do pede.ai usando o GeckoAPI.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100" aria-label="Fechar">✕</button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {done && <p className="text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg p-3">{done}</p>}
          {error && <p className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg p-3">{error}</p>}

          {!menu && (
            <>
              <label className="block text-sm">Chave da API (GeckoAPI)
                <input type="password" className={inputCls} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Cole sua chave" autoComplete="off" />
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                Lembrar a chave neste navegador
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-sm">CEP da região
                  <input className={inputCls} value={zip} onChange={e => setZip(e.target.value)} placeholder="89200-000" inputMode="numeric" />
                </label>
                <label className="block text-sm">ID da loja (merchantId)
                  <input className={inputCls} value={merchantId} onChange={e => setMerchantId(e.target.value)} placeholder="Ex.: 35275" />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button disabled={loading || !apiKey || !zip || !merchantId} onClick={doFetch}
                  className="bg-green-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm font-semibold">
                  {loading ? 'Buscando…' : 'Buscar cardápio'}
                </button>
                <button disabled={loading || !apiKey || !zip} onClick={doSearch}
                  className="border rounded-lg px-4 py-2 text-sm disabled:opacity-50">Não sei o ID: listar lojas do CEP</button>
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
                  {showPaste ? 'Esconder' : 'Colar JSON'} (alternativa se o navegador bloquear a conexão)
                </button>
                {showPaste && (
                  <div className="mt-2 space-y-2">
                    <textarea className={inputCls + ' h-32 font-mono text-xs'} value={pasted} onChange={e => setPasted(e.target.value)} placeholder="Cole aqui a resposta JSON do GeckoAPI (pede.ai, type pdp)" />
                    <button disabled={loading || !pasted.trim()} onClick={doParse}
                      className="border rounded-lg px-4 py-2 text-sm disabled:opacity-50">Ler JSON</button>
                  </div>
                )}
              </div>
            </>
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

        {menu && (
          <div className="p-4 border-t flex gap-2 justify-end">
            <button onClick={() => setMenu(null)} className="border rounded-lg px-4 py-2 text-sm">Voltar</button>
            <button disabled={selected.size === 0} onClick={doImport} className="bg-green-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm font-semibold">
              Importar {selected.size} item(ns)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
