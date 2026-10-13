// Formatação compartilhada (moeda, datas, links). Fonte única — não recriar formatadores nos componentes.

/** R$ 1.234,50 sem separador de milhar, como o app sempre exibiu: "R$ 1234,50". */
export const money = (value: number | string | null | undefined): string =>
  'R$ ' + Number(value || 0).toFixed(2).replace('.', ',')

/** Mesmo que `money`, a partir de centavos (usado na cobrança das assinaturas). */
export const moneyCents = (cents: number | null | undefined): string => money(Number(cents || 0) / 100)

export const fmtDate = (iso?: string | null): string => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—')

/** Dias (arredondados para cima) entre agora e a data informada. */
export const daysLeft = (iso?: string | null): number =>
  iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000) : 0

export const slugify = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)

/** Link wa.me para um número brasileiro (acrescenta 55 quando faltar) com texto opcional. */
export const whatsappUrl = (phone: string | null | undefined, text?: string): string => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  const number = digits.startsWith('55') ? digits : '55' + digits
  return `https://wa.me/${number}` + (text ? `?text=${encodeURIComponent(text)}` : '')
}
