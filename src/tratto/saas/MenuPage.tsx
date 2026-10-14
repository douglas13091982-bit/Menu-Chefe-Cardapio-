// @ts-nocheck
import { useEffect } from 'react'
import { StoreProvider, useStore } from '../context/StoreContext'
import MenuView from '../components/MenuView'
import { trackMenuPageView } from '../marketing'
import { BRAND } from './brand'

function Inner() {
  const store = useStore()
  const { storeState, dataReady, storeId } = store
  const storeConfig = store?.config ?? {}

  useEffect(() => {
    if (storeState === 'ready' && storeId) trackMenuPageView(storeId)
  }, [storeState, storeId])
  useEffect(() => {
    if (dataReady && storeConfig.name) document.title = `${storeConfig.name} - Cardápio`
  }, [dataReady, storeConfig.name])

  if (storeState === 'notfound') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 text-center">
        <div><h1 className="text-xl font-bold text-gray-900">Loja não encontrada</h1>
          <p className="text-sm text-gray-500 mt-2">Confira o endereço do cardápio.</p>
          <a href="/" className="inline-block mt-4 text-sm text-[#d9273f] underline">Conheça o {BRAND}</a></div>
      </div>
    )
  }
  if (storeState === 'unavailable') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 text-center">
        <div><h1 className="text-xl font-bold text-gray-900">Cardápio temporariamente indisponível</h1>
          <p className="text-sm text-gray-500 mt-2">Esta loja está fora do ar no momento. Tente novamente mais tarde.</p></div>
      </div>
    )
  }
  if (storeState === 'loading' || !dataReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">Carregando cardápio…</div>
  }
  return (
    <>
      <MenuView />
      <p className="text-center text-xs text-gray-400 py-6 bg-[#f3f4f6]">
        Cardápio criado com <a href="/" className="underline">{BRAND}</a>
      </p>
    </>
  )
}

export default function MenuPage({ slug }) {
  return (
    <StoreProvider slug={slug}>
      <Inner />
    </StoreProvider>
  )
}
