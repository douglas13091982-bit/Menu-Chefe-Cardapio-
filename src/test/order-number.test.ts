import { describe, it, expect } from 'vitest'
import { formatOrderNumber } from '../tratto/orderNumber'

describe('formatOrderNumber', () => {
  it('formata com 4 dígitos', () => {
    expect(formatOrderNumber({ id: '#ABC', number: 1 })).toBe('#0001')
    expect(formatOrderNumber({ id: '#ABC', number: 12345 })).toBe('#12345')
  })
  it('usa o id antigo sem número', () => {
    expect(formatOrderNumber({ id: '#ABC' })).toBe('#ABC')
    expect(formatOrderNumber({ id: 'X', number: 0 })).toBe('X')
  })
})
