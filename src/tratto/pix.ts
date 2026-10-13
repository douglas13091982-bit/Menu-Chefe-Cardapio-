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

function validCpf(d: string) {
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  for (const n of [9, 10]) {
    let sum = 0
    for (let i = 0; i < n; i++) sum += Number(d[i]) * (n + 1 - i)
    if (((sum * 10) % 11) % 10 !== Number(d[n])) return false
  }
  return true
}

// Ajusta a chave para o formato que o Pix exige (CPF/CNPJ só números, celular com +55, e-mail e aleatória como estão).
export function normalizePixKey(raw: string) {
  const k = String(raw || '').trim()
  if (k.includes('@')) return k.toLowerCase()
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)) return k.toLowerCase()
  const d = k.replace(/\D/g, '')
  if (k.startsWith('+')) return '+' + d
  if (d.length === 14) return d
  if (d.length === 11 && validCpf(d) && !/[() ]/.test(k)) return d
  if (d.length === 13 && d.startsWith('55')) return '+' + d
  if (d.length === 10 || d.length === 11) return '+55' + d
  return d || k
}

export function pixPayload(key: string, holder: string, city: string, cents: number, txid = '***') {
  const amount = cents > 0 ? (cents / 100).toFixed(2) : ''
  const body =
    f('00', '01') +
    f('26', f('00', 'br.gov.bcb.pix') + f('01', normalizePixKey(key))) +
    f('52', '0000') + f('53', '986') + (amount ? f('54', amount) : '') +
    f('58', 'BR') + f('59', clean(holder, 25) || 'LOJA') + f('60', clean(city, 15) || 'BRASIL') +
    f('62', f('05', txid)) + '6304'
  return body + crc16(body)
}
