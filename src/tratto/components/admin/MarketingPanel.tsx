import { useState, useEffect } from 'react'
import { loadMarketing, saveMarketing } from '../../marketing'

function MarketingPanel() {
  const [pixelId, setPixelId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [savedPixelId, setSavedPixelId] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    loadMarketing().then(m => {
      if (!active) return
      setPixelId(m.pixelId)
      setAccessToken(m.accessToken)
      setSavedPixelId(m.pixelId)
      setLoaded(true)
    })
    return () => { active = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError('')
    const data = { pixelId: pixelId.trim(), accessToken: accessToken.trim() }
    const err = await saveMarketing(data)
    if (err) {
      setSaveError('Não foi possível salvar: ' + err)
      return
    }
    setSavedPixelId(data.pixelId)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const pixelActive = savedPixelId.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Marketing</h1>
        <p className="text-gray-500 text-sm">Configure as integrações de marketing do seu restaurante</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 flex items-center gap-2">
          <span></span>
          <span className="text-sm font-medium">Configurações de marketing salvas!</span>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-center gap-2">
          <span></span>
          <span className="text-sm font-medium">{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span></span> Facebook / Meta
            </h3>
            {pixelActive ? (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Pixel ativo </span>
            ) : (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Pixel não configurado</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pixel ID do Facebook</label>
              <input
                type="text"
                inputMode="numeric"
                value={pixelId}
                onChange={e => setPixelId(e.target.value.replace(/\D/g, '').slice(0, 20))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ex: 123456789012345"
              />
              <p className="text-xs text-gray-500 mt-1">
                No Gerenciador de Eventos do Meta, selecione seu Pixel em "Fontes de dados" — o ID aparece abaixo do nome.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Token de acesso (API de Conversões)</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value.slice(0, 500))}
                  className="w-full border rounded-lg px-4 py-2.5 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Cole aqui o token do Facebook"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1"
                >
                  {showToken ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                No Gerenciador de Eventos, abra seu Pixel → "Configurações" → "API de Conversões" → "Gerar token de acesso".
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!loaded}
          className="w-full bg-red-500 disabled:opacity-50 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm transition-all"
        >
          Salvar
        </button>
      </form>
    </div>
  )
}

export default MarketingPanel
