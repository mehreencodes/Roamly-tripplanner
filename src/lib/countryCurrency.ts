import type { CurrencyCode } from './money'

const EURO_COUNTRIES = [
  'greece',
  'france',
  'italy',
  'spain',
  'germany',
  'netherlands',
  'portugal',
  'austria',
  'ireland',
  'finland',
  'belgium',
  'croatia',
  'slovenia',
  'slovakia',
  'estonia',
  'latvia',
  'lithuania',
  'luxembourg',
  'malta',
  'cyprus',
]

const BY_COUNTRY: Partial<Record<string, CurrencyCode>> = {
  ...Object.fromEntries(EURO_COUNTRIES.map((c) => [c, 'EUR' as const])),
  pakistan: 'PKR',
  japan: 'JPY',
  indonesia: 'IDR',
  uae: 'AED',
  'united arab emirates': 'AED',
  thailand: 'THB',
  turkey: 'TRY',
  turkiye: 'TRY',
  türkiye: 'TRY',
  switzerland: 'CHF',
  malaysia: 'MYR',
  singapore: 'SGD',
  india: 'INR',
  egypt: 'EGP',
  maldives: 'MVR',
  canada: 'CAD',
  australia: 'AUD',
  'united kingdom': 'GBP',
  uk: 'GBP',
  england: 'GBP',
  scotland: 'GBP',
  'united states': 'USD',
  'united states of america': 'USD',
  usa: 'USD',
  us: 'USD',
    'south africa': 'ZAR',
  peru: 'PEN',
  'new zealand': 'NZD',
}

/** Mulk ke naam se uski currency. Na mile to null (phir profile ki currency istemal hoti hai) */
export function currencyForCountry(country: string | undefined): CurrencyCode | null {
  if (!country) return null
  const key = country.trim().toLowerCase().replace(/\./g, '')
  return BY_COUNTRY[key] ?? null
}