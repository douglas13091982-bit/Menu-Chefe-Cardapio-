import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PasswordInput from '../tratto/components/PasswordInput'

describe('PasswordInput', () => {
  it('começa oculto e o olho mostra/oculta o que foi digitado', () => {
    render(<PasswordInput aria-label="senha" defaultValue="abc123" />)
    const input = screen.getByLabelText('senha') as HTMLInputElement
    expect(input.type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(input.type).toBe('text')
    expect(input.value).toBe('abc123')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(input.type).toBe('password')
  })
})
