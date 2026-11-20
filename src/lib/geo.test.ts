import { describe, expect, it } from 'vitest'
import { haversineKm } from './geo'

describe('haversineKm', () => {
  it('is 0 for the same point', () => {
    expect(haversineKm({ lat: 31.5, lng: 74.3 }, { lat: 31.5, lng: 74.3 })).toBe(0)
  })

  it('measures one degree of longitude on the equator', () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111.19, 1)
  })

  it('is symmetric', () => {
    const a = { lat: 35.0, lng: 135.7 }
    const b = { lat: 35.1, lng: 135.8 }
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10)
  })
})