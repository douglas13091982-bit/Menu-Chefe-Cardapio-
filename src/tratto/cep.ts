// Consulta de endereço por CEP (ViaCEP; Mapbox como reserva). Sem estado de UI — quem chama aplica o resultado.

export interface CepAddress {
  street: string
  neighborhood: string
  city: string
  /** ViaCEP traz rua completa; Mapbox só localiza em parte. */
  source: 'viacep' | 'mapbox'
}

async function fromViaCep(digits: string, isStale: () => boolean): Promise<CepAddress | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!res.ok) return null
    const data = await res.json()
    if (isStale() || !data || data.erro) return null
    return {
      street: (data.logradouro || '').trim(),
      neighborhood: (data.bairro || '').trim(),
      city: data.localidade && data.uf ? `${data.localidade} - ${data.uf}` : data.localidade || '',
      source: 'viacep',
    }
  } catch {
    return null
  }
}

async function fromMapbox(digits: string, token: string, isStale: () => boolean): Promise<CepAddress | null> {
  try {
    const formatted = digits.slice(0, 5) + '-' + digits.slice(5)
    const url =
      'https://api.mapbox.com/search/geocode/v6/forward' +
      `?q=${encodeURIComponent(formatted)}&country=br&language=pt&limit=1&types=postcode,street,address` +
      `&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    if (isStale() || !res.ok) return null
    const data = await res.json()
    if (isStale()) return null
    const ctx = data?.features?.[0]?.properties?.context || {}
    const street = ctx.address?.street_name || ctx.street?.name || ''
    const neighborhood = ctx.neighborhood?.name || ctx.locality?.name || ''
    const cityName = ctx.place?.name || ctx.district?.name || ''
    const uf = ctx.region?.region_code || ''
    const city = cityName && uf ? `${cityName} - ${uf}` : cityName
    return street || neighborhood || city ? { street, neighborhood, city, source: 'mapbox' } : null
  } catch {
    return null
  }
}

/** Retorna o endereço do CEP (8 dígitos) ou `null` se nada foi encontrado. */
export async function fetchAddressByCep(
  digits: string,
  mapboxToken: string | null | undefined,
  isStale: () => boolean = () => false,
): Promise<CepAddress | null> {
  const viaCep = await fromViaCep(digits, isStale)
  if (viaCep || isStale()) return viaCep
  return mapboxToken ? fromMapbox(digits, mapboxToken, isStale) : null
}
