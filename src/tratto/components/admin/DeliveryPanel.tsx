// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, X, Wallet, MapPin, Zap, Lightbulb, CheckCircle2 } from 'lucide-react'
import { getMapboxToken, MAPBOX_TOKEN_EVENT } from '../../mapboxToken'
import { geocodeAddress } from '../../freight'
import { useStore } from '../../context/StoreContext'
import { DeliveryZone } from '../../types'
import { money } from '../../format'

// Joinville coordinates
const DEFAULT_CENTER = { lat: -26.30, lng: -48.85 }
const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

function DeliveryPanel() {
  const { config, setConfig, deliveryZones, addDeliveryZone, updateDeliveryZone, deleteDeliveryZone } = useStore()
  const fixedEnabled = config.fixedZoneFeesEnabled === true
  const mapboxEnabled = config.mapboxFreightEnabled !== false
  const pickupEnabled = config.pickupEnabled !== false
  const [showForm, setShowForm] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState({ name: '', price: '', estimatedTime: '' })

  const resetForm = () => {
    setFormData({ name: '', price: '', estimatedTime: '' })
    setEditingZone(null)
    setShowForm(false)
  }

  const openEditForm = (zone: DeliveryZone) => {
    setEditingZone(zone)
    setFormData({ name: zone.name, price: zone.price.toString(), estimatedTime: zone.estimatedTime })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const zone: DeliveryZone = {
      id: editingZone?.id || Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      estimatedTime: formData.estimatedTime,
      coordinates: editingZone?.coordinates || generateRandomZone()
    }
    if (editingZone) {
      updateDeliveryZone(zone)
    } else {
      addDeliveryZone(zone)
    }
    resetForm()
  }

  const generateRandomZone = () => {
    const centerLat = DEFAULT_CENTER.lat + (Math.random() - 0.5) * 0.03
    const centerLng = DEFAULT_CENTER.lng + (Math.random() - 0.5) * 0.03
    const size = 0.005
    return [
      { lat: centerLat - size, lng: centerLng - size },
      { lat: centerLat - size, lng: centerLng + size },
      { lat: centerLat + size, lng: centerLng + size },
      { lat: centerLat + size, lng: centerLng - size },
      { lat: centerLat - size, lng: centerLng - size },
    ]
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Zonas de Entrega</h1>
          <p className="text-gray-500 text-sm">Configure as áreas de entrega e taxas usando MapBox</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
        >
          <span>+</span> Nova Zona
        </button>
      </div>

      {/* Retirada no local */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <label className="flex items-start justify-between gap-4 cursor-pointer">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={18} className="text-[#d9273f]" /> Retirada no local
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {pickupEnabled
                ? 'O cliente pode escolher retirar o pedido na loja (sem taxa de entrega).'
                : 'Desligada: o cliente só consegue pedir entrega.'}
            </p>
            {pickupEnabled && !(config.address || '').trim() && (
              <p className="text-xs text-amber-700 mt-1">Dica: preencha o endereço da loja em Configurações para ele aparecer na retirada.</p>
            )}
          </div>
          <span className="relative inline-flex items-center flex-shrink-0">
            <input
              type="checkbox"
              checked={pickupEnabled}
              onChange={e => setConfig({ ...config, pickupEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <span className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:left-[22px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></span>
          </span>
        </label>
      </div>

      {/* Como cobrar a entrega */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Wallet size={18} className="text-[#d9273f]" /> Como cobrar a entrega
          </h3>
          <p className="text-xs text-gray-500 mt-1">Ligue ou desligue cada forma de cobrança. Vale para os pedidos de entrega do cardápio.</p>
        </div>

        <label className="flex items-start justify-between gap-4 cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-800">Taxas fixas por bairro</p>
            <p className="text-xs text-gray-500 mt-0.5">Cobra a taxa da zona cujo nome é igual ao bairro do cliente (zonas abaixo).</p>
          </div>
          <span className="relative inline-flex items-center flex-shrink-0">
            <input
              type="checkbox"
              checked={fixedEnabled}
              onChange={e => setConfig({ ...config, fixedZoneFeesEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <span className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:left-[22px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></span>
          </span>
        </label>

        <label className="flex items-start justify-between gap-4 cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-800">Cálculo automático pelo Mapbox</p>
            <p className="text-xs text-gray-500 mt-0.5">Calcula o frete pela distância da rota (taxa base + valor por km, definidos em Configurações).</p>
          </div>
          <span className="relative inline-flex items-center flex-shrink-0">
            <input
              type="checkbox"
              checked={mapboxEnabled}
              onChange={e => setConfig({ ...config, mapboxFreightEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <span className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:left-[22px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></span>
          </span>
        </label>

        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
          {fixedEnabled && mapboxEnabled && 'Se o bairro do cliente estiver nas zonas abaixo, vale a taxa fixa da zona. Se não estiver, o frete é calculado pelo Mapbox.'}
          {fixedEnabled && !mapboxEnabled && 'Só vale a taxa fixa por bairro. Clientes de bairros que não estão nas zonas abaixo não conseguem pedir entrega.'}
          {!fixedEnabled && mapboxEnabled && 'O frete é calculado pela distância da rota. As taxas das zonas abaixo não são cobradas.'}
          {!fixedEnabled && !mapboxEnabled && `Frete único: taxa base de ${money(Number(config.deliveryFee || 0))} para qualquer endereço (altere em Configurações).`}
        </p>
      </div>

      {/* MapBox Map */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={18} className="text-[#d9273f]" /> Mapa de Cobertura - MapBox
            </h3>
            <p className="text-xs text-gray-500 mt-1">Visualize as zonas de entrega no mapa interativo</p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">MapBox GL</span>
        </div>
        <div className="relative h-[400px]">
          <MapComponent zones={deliveryZones} colors={colors} address={config.address} />
        </div>
        {/* Legend */}
        <div className="p-4 border-t flex flex-wrap gap-3">
          {deliveryZones.map((zone, idx) => (
            <div key={zone.id} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[idx % colors.length], opacity: 0.7 }}></div>
              <span className="text-xs text-gray-700 font-medium">{zone.name}</span>
              <span className="text-xs text-gray-400">{money(zone.price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MapBox Config Info */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Zap size={18} className="text-[#d9273f]" /> Configuração MapBox
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-500"><CheckCircle2 size={16} /></span>
            <span className="text-gray-700">MapBox GL JS integrado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500"></span>
            <span className="text-gray-700">Zonas de entrega renderizadas como polígonos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500"></span>
            <span className="text-gray-700">Marcador do restaurante</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500"></span>
            <span className="text-gray-700">Popups com informações de cada zona</span>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
               <strong>Para usar com seu token MapBox:</strong> Configure sua chave no painel MapBox Studio para criar zonas personalizadas com coordenadas reais. O mapa acima usa um token demo para visualização.
            </p>
          </div>
        </div>
      </div>

      {/* Zones List */}
      <div className="space-y-3">
        {deliveryZones.map((zone, idx) => (
          <div key={zone.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: colors[idx % colors.length] }}>
              {idx + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{zone.name}</h4>
              <p className="text-xs text-gray-500">{zone.estimatedTime} • {zone.coordinates.length} pontos</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-700">{money(zone.price)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditForm(zone)}
                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 text-xs"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => { if (confirm('Excluir zona?')) deleteDeliveryZone(zone.id) }}
                className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 text-xs"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {deliveryZones.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl">
          <span className="text-4xl block mb-2"></span>
          <p>Nenhuma zona de entrega configurada</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingZone ? 'Editar Zona' : 'Nova Zona de Entrega'}
                </h3>
                <button onClick={resetForm} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Zona *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ex: Centro, Saguaçu, Boa Vista"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de entrega (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="5.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tempo estimado *</label>
                  <input
                    type="text"
                    required
                    value={formData.estimatedTime}
                    onChange={e => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ex: 25-35 min"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                     <strong>MapBox:</strong> As zonas são exibidas automaticamente no mapa acima. 
                    Configure seu token MapBox para definir zonas com coordenadas reais.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={resetForm} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm">
                    {editingZone ? 'Salvar' : 'Criar Zona'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mapa Mapbox: cria o mapa uma única vez por token e só sincroniza as zonas/marcador depois.
// O fallback (grade SVG) só aparece se o mapa nunca chegar a carregar.
function MapComponent({ zones, colors, address }: { zones: DeliveryZone[]; colors: string[]; address?: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<any>(null)
  const gl = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const addedIds = useRef<string[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [mapboxToken, setMapboxToken] = useState(getMapboxToken())
  const [center, setCenter] = useState(DEFAULT_CENTER)

  // Atualiza o mapa quando o token é salvo/removido no painel
  useEffect(() => {
    const onChange = () => {
      const t = getMapboxToken()
      setMapboxToken(prev => (prev === t ? prev : t))
    }
    window.addEventListener(MAPBOX_TOKEN_EVENT, onChange)
    return () => window.removeEventListener(MAPBOX_TOKEN_EVENT, onChange)
  }, [])

  // Centraliza no endereço da loja (se informado); senão usa o centro padrão
  useEffect(() => {
    let cancelled = false
    const q = (address || '').trim()
    if (!q || !mapboxToken) { setCenter(DEFAULT_CENTER); return }
    geocodeAddress(q, mapboxToken, 'address,street,place')
      .then(p => { if (!cancelled && p) setCenter(p) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [address, mapboxToken])

  // Cria o mapa (uma vez por token)
  useEffect(() => {
    if (!mapRef.current) return
    let cancelled = false
    let loaded = false
    let timer: any = null
    let map: any = null
    setMapReady(false)
    setUseFallback(false)

    ;(async () => {
      try {
        const mod: any = await import('mapbox-gl')
        await import('mapbox-gl/dist/mapbox-gl.css')
        if (cancelled || !mapRef.current) return
        const mapboxgl = mod.default || mod
        gl.current = mapboxgl
        mapboxgl.accessToken = mapboxToken
        map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
          zoom: 12,
        })
        mapObj.current = map
        map.addControl(new mapboxgl.NavigationControl(), 'top-right')
        map.on('load', () => {
          loaded = true
          clearTimeout(timer)
          map.resize()
          if (!cancelled) setMapReady(true)
        })
        // Erros de tile/recurso depois que o mapa carregou são normais: só cai no fallback se nunca carregou.
        map.on('error', (e: any) => {
          console.warn('Mapbox:', e?.error?.message || e)
          if (!loaded && !cancelled) setUseFallback(true)
        })
        timer = setTimeout(() => { if (!loaded && !cancelled) setUseFallback(true) }, 15000)
      } catch (err) {
        console.error('MapBox init error:', err)
        if (!cancelled) setUseFallback(true)
      }
    })()

    return () => {
      cancelled = true
      clearTimeout(timer)
      try { markerRef.current?.remove() } catch {}
      markerRef.current = null
      addedIds.current = []
      try { map?.remove() } catch {}
      mapObj.current = null
      setMapReady(false)
    }
  }, [mapboxToken])

  // Sincroniza zonas (adicionar/editar/excluir) sem recriar o mapa
  useEffect(() => {
    const map = mapObj.current
    const mapboxgl = gl.current
    if (!mapReady || !map || !mapboxgl) return
    for (const id of addedIds.current) {
      ;['fill', 'line'].forEach(k => { if (map.getLayer(`zone-${k}-${id}`)) map.removeLayer(`zone-${k}-${id}`) })
      if (map.getSource(`zone-${id}`)) map.removeSource(`zone-${id}`)
    }
    addedIds.current = []
    zones.forEach((zone, idx) => {
      const coordinates = (zone.coordinates || []).map(c => [c.lng, c.lat])
      if (coordinates.length < 3) return
      const first = coordinates[0], last = coordinates[coordinates.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) coordinates.push(first)
      try {
        map.addSource(`zone-${zone.id}`, {
          type: 'geojson',
          data: { type: 'Feature', properties: { name: zone.name, price: zone.price }, geometry: { type: 'Polygon', coordinates: [coordinates] } },
        })
        const color = colors[idx % colors.length]
        map.addLayer({ id: `zone-fill-${zone.id}`, type: 'fill', source: `zone-${zone.id}`, paint: { 'fill-color': color, 'fill-opacity': 0.3 } })
        map.addLayer({ id: `zone-line-${zone.id}`, type: 'line', source: `zone-${zone.id}`, paint: { 'line-color': color, 'line-width': 2, 'line-opacity': 0.8 } })
        map.on('click', `zone-fill-${zone.id}`, (e: any) => {
          const el = document.createElement('div')
          el.style.padding = '4px'
          const t = document.createElement('strong'); t.textContent = zone.name
          el.append(t, document.createElement('br'), `Taxa: ${money(Number(zone.price))}`, document.createElement('br'), String(zone.estimatedTime || ''))
          new mapboxgl.Popup().setLngLat(e.lngLat).setDOMContent(el).addTo(map)
        })
        addedIds.current.push(zone.id)
      } catch (err) {
        console.warn('Error adding zone layer:', err)
      }
    })
  }, [zones, mapReady, colors])

  // Marcador do restaurante + centro do mapa
  useEffect(() => {
    const map = mapObj.current
    const mapboxgl = gl.current
    if (!mapReady || !map || !mapboxgl) return
    map.jumpTo({ center: [center.lng, center.lat] })
    if (markerRef.current) markerRef.current.remove()
    markerRef.current = new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([center.lng, center.lat])
      .setPopup(new mapboxgl.Popup().setText('Restaurante'))
      .addTo(map)
  }, [center, mapReady])

  if (useFallback) {
    return <MapFallback zones={zones} colors={colors} />
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Carregando mapa MapBox...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// SVG Fallback Map
function MapFallback({ zones, colors }: { zones: DeliveryZone[]; colors: string[] }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Zone representations */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 p-8">
        {zones.map((zone, idx) => (
          <div
            key={zone.id}
            className="rounded-xl border-2 p-4 text-center min-w-[120px] transition-transform hover:scale-105"
            style={{ borderColor: colors[idx % colors.length], backgroundColor: `${colors[idx % colors.length]}15` }}
          >
            <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: colors[idx % colors.length] }}>
              {idx + 1}
            </div>
            <p className="font-semibold text-sm text-gray-800">{zone.name}</p>
            <p className="text-xs text-gray-500 mt-1">{zone.estimatedTime}</p>
            <p className="font-bold text-sm mt-1" style={{ color: colors[idx % colors.length] }}>
              {money(zone.price)}
            </p>
          </div>
        ))}

        {/* Restaurant marker */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-lg"></span>
          <span className="text-xs font-medium text-gray-700">Restaurante - Joinville</span>
        </div>
      </div>

      {zones.length === 0 && (
        <div className="text-center text-gray-400">
          <span className="text-4xl block mb-2"></span>
          <p className="text-sm">Adicione zonas de entrega</p>
        </div>
      )}
    </div>
  )
}

export default DeliveryPanel
