import { CheckCircle2, MapPin,  useState } from 'react'
import { getSavedMapboxToken, setSavedMapboxToken } from '../../mapboxToken'

function MapboxIntegration() {
  const [token, setToken] = useState(getSavedMapboxToken())
  const [savedToken, setSavedToken] = useState(getSavedMapboxToken())
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')

  const flash = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSave = () => {
    const t = token.trim()
    setSavedMapboxToken(t)
    setSavedToken(t)
    flash(t ? 'Token do Mapbox salvo!' : 'Token do Mapbox removido!')
  }

  const handleRemove = () => {
    setSavedMapboxToken('')
    setToken('')
    setSavedToken('')
    flash('Token do Mapbox removido!')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Integrações</h2>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={18} className="text-[#d9273f]" /> Mapbox (mapa de entrega)
          </h3>
          {savedToken ? (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={14} className="inline mr-1" /> Mapbox conectado </span>
          ) : (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Mapbox não configurado</span>
          )}
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">Token público do Mapbox</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={token}
            onChange={e => setToken(e.target.value.slice(0, 500))}
            className="w-full border rounded-lg px-4 py-2.5 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="pk.eyJ1Ijoi..."
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1"
          >
            {show ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Crie ou copie seu token público (começa com pk.) em{' '}
          <a href="https://account.mapbox.com/access-tokens" target="_blank" rel="noopener noreferrer" className="text-red-600 underline">
            account.mapbox.com/access-tokens
          </a>
        </p>

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={!savedToken}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  )
}

export default MapboxIntegration
