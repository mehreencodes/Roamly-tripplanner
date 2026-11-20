export const CURRENCIES = {
  PKR: { digits: 2, name: 'Pakistani rupee' },
  USD: { digits: 2, name: 'US dollar' },
  EUR: { digits: 2, name: 'Euro' },
  GBP: { digits: 2, name: 'British pound' },
  AED: { digits: 2, name: 'UAE dirham' },
  JPY: { digits: 0, name: 'Japanese yen' },
  IDR: { digits: 0, name: 'Indonesian rupiah' },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[]

export const isCurrencyCode = (value: string): value is CurrencyCode => value in CURRENCIES

const formatters = new Map<string, Intl.NumberFormat>()

function formatterFor(currency: CurrencyCode, fractionDigits: number, locale?: string) {
  const key = `${locale ?? ''}|${currency}|${fractionDigits}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    formatters.set(key, formatter)
  }
  return formatter
}

/** Screen par dikhane ke liye. Poori raqam ho to ".00" nahi dikhata. */
export function formatMoney(minor: number, currency: CurrencyCode, locale?: string) {
  const digits = CURRENCIES[currency].digits
  const factor = 10 ** digits
  const whole = minor % factor === 0
  return formatterFor(currency, whole ? 0 : digits, locale).format(minor / factor)
}

/** Input box ke liye saaf string (grouping ke baghair): 125050 -> "1250.50". Bilkul exact, float nahi. */
export function formatInput(minor: number, currency: CurrencyCode) {
  const digits = CURRENCIES[currency].digits
  const sign = minor < 0 ? '-' : ''
  const padded = String(Math.abs(minor)).padStart(digits + 1, '0')
  if (digits === 0) return `${sign}${padded}`
  return `${sign}${padded.slice(0, -digits)}.${padded.slice(-digits)}`
}

/**
 * User ka likha hua text -> integer minor units. Float kabhi istemal nahi hota.
 * Ghalat input, zyada decimals ya bohat bari raqam par null (chupke se round nahi karta).
 */
export function parseAmount(input: string, currency: CurrencyCode): number | null {
  const digits = CURRENCIES[currency].digits
  const raw = input.trim()

  // Comma sirf hazaron ke separator ke taur par qabool: "1,250.50" theek, "1,2" ghalat
  const plain = raw.includes(',')
    ? /^\d{1,3}(,\d{3})+(\.\d*)?$/.test(raw)
      ? raw.replace(/,/g, '')
      : null
    : raw
  if (plain === null) return null

  const match = /^(\d*)(?:\.(\d*))?$/.exec(plain)
  if (!match) return null

  const whole = match[1] ?? ''
  const fraction = match[2] ?? ''
  if (whole === '' && fraction === '') return null
  if (fraction.length > digits) return null

  const minor = Number((whole || '0') + fraction.padEnd(digits, '0'))
  return Number.isSafeInteger(minor) ? minor : null
}