import { describe, expect, it } from 'vitest'
import { currencyForCountry } from './countryCurrency'

describe('currencyForCountry', () => {
  it('maps common countries', () => {
    expect(currencyForCountry('Japan')).toBe('JPY')
    expect(currencyForCountry('Pakistan')).toBe('PKR')
    expect(currencyForCountry('Greece')).toBe('EUR')
  })

  it('handles spelling variants and spacing', () => {
    expect(currencyForCountry('UAE')).toBe('AED')
    expect(currencyForCountry('United Arab Emirates')).toBe('AED')
    expect(currencyForCountry('U.A.E.')).toBe('AED')
    expect(currencyForCountry('  japan ')).toBe('JPY')
  })

  it('returns null for unknown or missing countries', () => {
    expect(currencyForCountry('Atlantis')).toBeNull()
    expect(currencyForCountry(undefined)).toBeNull()
  })
})