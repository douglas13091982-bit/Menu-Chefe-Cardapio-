// Pix "copia e cola" (BR Code estático) gerado no navegador. Sem integração com banco.
const f = (id: string, v: string) => id + String(v.length).padStart(2, '0') + v
const clean = (s: string, max: number) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().trim().slice(0, max)

function crc16(str: string) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function pixPayload(key: string, holder: string, city: string, cents: number, txid = '***') {
  const amount = cents > 0 ? (cents / 100).toFixed(2) : ''
  const body =
    f('00', '01') + f('01', '12') +
    f('26', f('00', 'br.gov.bcb.pix') + f('01', key.trim())) +
    f('52', '0000') + f('53', '986') + (amount ? f('54', amount) : '') +
    f('58', 'BR') + f('59', clean(holder, 25) || 'LOJA') + f('60', clean(city, 15) || 'BRASIL') +
    f('62', f('05', txid)) + '6304'
  return body + crc16(body)
}
