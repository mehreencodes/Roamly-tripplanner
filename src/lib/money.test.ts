import { describe, expect, it } from 'vitest'
import { formatInput, formatMoney, isCurrencyCode, parseAmount } from './money'

describe('parseAmount', () => {
  it('converts decimals to integer minor units', () => {
    expect(parseAmount('1250', 'USD')).toBe(125000)
    expect(parseAmount('1,250.50', 'USD')).toBe(125050)
    expect(parseAmount('1,250,000.5', 'USD')).toBe(125000050)
    expect(parseAmount('0.07', 'USD')).toBe(7)
    expect(parseAmount('.5', 'USD')).toBe(50)
  })

  it('avoids floating point errors', () => {
    expect(parseAmount('1.15', 'USD')).toBe(115)
    expect(parseAmount('0.29', 'USD')).toBe(29)
    expect(parseAmount('19.99', 'USD')).toBe(1999)
  })

  it('respects currencies without decimals', () => {
    expect(parseAmount('1500', 'JPY')).toBe(1500)
    expect(parseAmount('1500.5', 'JPY')).toBeNull()
  })

  it('rejects too many decimals instead of silently rounding', () => {
    expect(parseAmount('1.005', 'USD')).toBeNull()
  })

  it('rejects invalid input', () => {
    for (const bad of ['', '  ', '.', 'abc', '-5', '1.2.3', '12abc', '1e5', '1,2', '12,34']) {
      expect(parseAmount(bad, 'USD')).toBeNull()
    }
  })

  it('rejects amounts beyond the safe integer range', () => {
    expect(parseAmount('99999999999999999999', 'USD')).toBeNull()
  })
})

describe('formatInput', () => {
  it('gives an editable plain string', () => {
    expect(formatInput(125050, 'USD')).toBe('1250.50')
    expect(formatInput(7, 'USD')).toBe('0.07')
    expect(formatInput(0, 'USD')).toBe('0.00')
    expect(formatInput(1500, 'JPY')).toBe('1500')
  })

  it('round-trips with parseAmount', () => {
    for (const minor of [0, 1, 99, 100, 101, 123456789]) {
      expect(parseAmount(formatInput(minor, 'USD'), 'USD')).toBe(minor)
    }
  })
})

describe('formatMoney', () => {
  it('hides decimals for whole amounts and shows them otherwise', () => {
    expect(formatMoney(125000, 'USD', 'en-US')).toBe('$1,250')
    expect(formatMoney(125050, 'USD', 'en-US')).toBe('$1,250.50')
    expect(formatMoney(-2000, 'USD', 'en-US')).toBe('-$20')
  })

  it('formats currencies without decimals', () => {
    expect(formatMoney(1500, 'JPY', 'en-US')).toContain('1,500')
  })
})

describe('isCurrencyCode', () => {
  it('accepts supported codes only', () => {
    expect(isCurrencyCode('PKR')).toBe(true)
    expect(isCurrencyCode('XYZ')).toBe(false)
  })
})