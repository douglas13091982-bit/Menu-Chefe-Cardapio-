// Cálculo de frete por distância usando a API do Mapbox (geocodificação + rota de carro)

export interface LatLng {
  lat: number
  lng: number
}

const geocodeCache = new Map<string, LatLng | null>()

// Converte um endereço em coordenadas. `proximity` ajuda o Mapbox a priorizar resultados perto da loja.
export async function geocodeAddress(
  query: string,
  token: string,
  types: string,
  proximity?: LatLng
): Promise<LatLng | null> {
  const key = `${query}|${types}|${proximity ? `${proximity.lat},${proximity.lng}` : ''}`
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null
  const url =
    'https://api.mapbox.com/search/geocode/v6/forward' +
    `?q=${encodeURIComponent(query)}&country=br&language=pt&limit=1&types=${types}` +
    (proximity ? `&proximity=${proximity.lng},${proximity.lat}` : '') +
    `&access_token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('geocode ' + res.status)
  const data = await res.json()
  const coords = data?.features?.[0]?.geometry?.coordinates
  const point = Array.isArray(coords) ? { lng: Number(coords[0]), lat: Number(coords[1]) } : null
  geocodeCache.set(key, point)
  return point
}

// Distância em km pela rota de carro entre dois pontos.
export async function drivingDistanceKm(a: LatLng, b: LatLng, token: string): Promise<number | null> {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${a.lng},${a.lat};${b.lng},${b.lat}` +
    `?overview=false&access_token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('directions ' + res.status)
  const data = await res.json()
  const meters = data?.routes?.[0]?.distance
  return typeof meters === 'number' ? meters / 1000 : null
}

export const roundMoney = (v: number) => Math.round(v * 100) / 100
