// A migração do Tratto trouxe o código sem tipos; a correção de severidade alta não
// dependia da tipagem completa. Revalidar com `tsc` ao longo das próximas iterações.
import { useState, useRef, useEffect } from 'react'
import { formatBRL, generateId } from '../../utils'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getMapboxToken, MAPBOX_TOKEN_EVENT } from '../../mapboxToken'
import { useStore } from '../../context/StoreContext'
import { DeliveryZone } from '../../types'

// Joinville coordinates
const DEFAULT_CENTER = { lat: -26.30, lng: -48.85 }

function DeliveryPanel() {
  const { deliveryZones, addDeliveryZone, updateDeliveryZone, deleteDeliveryZone } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState({ name: '', price: '', estimatedTime: '' })
  // Token em tempo real (lê direto do storage) — evita usar o token demo quando há um salvo.
  const [mapboxToken, setMapboxToken] = useState(getMapboxToken())

  useEffect(() => {
    const onChange = () => setMapboxToken(getMapboxToken())
    window.addEventListener(MAPBOX_TOKEN_EVENT, onChange)
    return () => window.removeEventListener(MAPBOX_TOKEN_EVENT, onChange)
  }, [])

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
      id: editingZone?.id || generateId('zona-'),
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

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

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

      {/* MapBox Map */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span>🗺️</span> Mapa de Cobertura - MapBox
            </h3>
            <p className="text-xs text-gray-500 mt-1">Visualize as zonas de entrega no mapa interativo</p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">MapBox GL</span>
        </div>
        <div className="relative h-[400px]">
          <MapComponent zones={deliveryZones} colors={colors} />
        </div>
        {/* Legend */}
        <div className="p-4 border-t flex flex-wrap gap-3">
          {deliveryZones.map((zone, idx) => (
            <div key={zone.id} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[idx % colors.length], opacity: 0.7 }}></div>
              <span className="text-xs text-gray-700 font-medium">{zone.name}</span>
              <span className="text-xs text-gray-400">{formatBRL(zone.price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MapBox Config Info */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>⚡</span> Configuração MapBox
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">MapBox GL JS integrado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">Zonas de entrega renderizadas como polígonos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">Marcador do restaurante</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">Popups com informações de cada zona</span>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 <strong>Para usar com seu token MapBox:</strong> Configure sua chave no painel MapBox Studio para criar zonas personalizadas com coordenadas reais. O mapa acima usa um token demo para visualização.
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
              <p className="font-bold text-green-700">{formatBRL(zone.price)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditForm(zone)}
                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 text-xs"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => { if (confirm('Excluir zona?')) deleteDeliveryZone(zone.id) }}
                className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 text-xs"
                title="Excluir"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {deliveryZones.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl">
          <span className="text-4xl block mb-2">🗺️</span>
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
                <button onClick={resetForm} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">✕</button>
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
                    💡 <strong>MapBox:</strong> As zonas são exibidas automaticamente no mapa acima. 
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

// Map Component with SVG fallback
function MapComponent({ zones, colors }: { zones: DeliveryZone[]; colors: string[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [mapboxToken, setMapboxToken] = useState(getMapboxToken())

  // Atualiza o mapa quando o token é salvo/removido no painel
  useEffect(() => {
    const onChange = () => { setUseFallback(false); setMapLoaded(false); setMapboxToken(getMapboxToken()) }
    window.addEventListener(MAPBOX_TOKEN_EVENT, onChange)
    return () => window.removeEventListener(MAPBOX_TOKEN_EVENT, onChange)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    let map: any = null

    const initMap = async () => {
      try {
        const mapboxgl = await import('mapbox-gl')
        // Token MapBox configurado via variável de ambiente
        mapboxgl.default.accessToken = mapboxToken

        map = new mapboxgl.default.Map({
          container: mapRef.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
          zoom: 12
        })

        map.addControl(new mapboxgl.default.NavigationControl(), 'top-right')

        map.on('load', () => {
          setMapLoaded(true)

          zones.forEach((zone, idx) => {
            const coordinates = zone.coordinates.map(c => [c.lng, c.lat])
            const first = coordinates[0]
            const last = coordinates[coordinates.length - 1]
            if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
              coordinates.push(first)
            }

            try {
              map.addSource(`zone-${zone.id}`, {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: { name: zone.name, price: zone.price },
                  geometry: { type: 'Polygon', coordinates: [coordinates] }
                }
              })

              map.addLayer({
                id: `zone-fill-${zone.id}`,
                type: 'fill',
                source: `zone-${zone.id}`,
                paint: {
                  'fill-color': colors[idx % colors.length],
                  'fill-opacity': 0.3
                }
              })

              map.addLayer({
                id: `zone-line-${zone.id}`,
                type: 'line',
                source: `zone-${zone.id}`,
                paint: {
                  'line-color': colors[idx % colors.length],
                  'line-width': 2,
                  'line-opacity': 0.8
                }
              })

              map.on('click', `zone-fill-${zone.id}`, (e: any) => {
                new mapboxgl.default.Popup()
                  .setLngLat(e.lngLat)
                  .setHTML(`<div style="padding:4px"><strong>${zone.name}</strong><br>Taxa: ${formatBRL(zone.price)}<br>${zone.estimatedTime}</div>`)
                  .addTo(map)
              })
            } catch (err) {
              console.warn('Error adding zone layer:', err)
            }
          })

          // Restaurant marker
          new mapboxgl.default.Marker({ color: '#ef4444' })
            .setLngLat([DEFAULT_CENTER.lng, DEFAULT_CENTER.lat])
            .setPopup(new mapboxgl.default.Popup().setHTML('<div style="padding:4px"><strong>🍔 Restaurante</strong></div>'))
            .addTo(map)
        })

        map.on('error', () => {
          setUseFallback(true)
        })

        // Timeout fallback
        setTimeout(() => {
          if (!mapLoaded) setUseFallback(true)
        }, 8000)

      } catch (err) {
        console.error('MapBox init error:', err)
        setUseFallback(true)
      }
    }

    initMap()

    return () => {
      if (map) map.remove()
    }
  }, [mapboxToken])

  if (useFallback) {
    return <MapFallback zones={zones} colors={colors} />
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && !useFallback && (
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
              {formatBRL(zone.price)}
            </p>
          </div>
        ))}

        {/* Restaurant marker */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-lg">📍</span>
          <span className="text-xs font-medium text-gray-700">Restaurante - Joinville</span>
        </div>
      </div>

      {zones.length === 0 && (
        <div className="text-center text-gray-400">
          <span className="text-4xl block mb-2">🗺️</span>
          <p className="text-sm">Adicione zonas de entrega</p>
        </div>
      )}
    </div>
  )
}

export default DeliveryPanel
