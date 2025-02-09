import { Mercoa } from '@mercoa/javascript'

export function currencySymbolToCode(symbol?: string) {
  if (!symbol) return Mercoa.CurrencyCode.Usd
  symbol = symbol.trim()
  switch (symbol) {
    case '$':
      return Mercoa.CurrencyCode.Usd
    case '€':
      return Mercoa.CurrencyCode.Eur
    case '£':
      return Mercoa.CurrencyCode.Gbp
    case '¥':
      return Mercoa.CurrencyCode.Jpy
    case '₹':
      return Mercoa.CurrencyCode.Inr
    case '₽':
      return Mercoa.CurrencyCode.Rub
    case '₩':
      return Mercoa.CurrencyCode.Krw
    case '₪':
      return Mercoa.CurrencyCode.Ils
    case '₫':
      return Mercoa.CurrencyCode.Vnd
    case '₭':
      return Mercoa.CurrencyCode.Lak
    case '₮':
      return Mercoa.CurrencyCode.Mnt
    case '₱':
      return Mercoa.CurrencyCode.Php
    case '₲':
      return Mercoa.CurrencyCode.Pyg
    case '₴':
      return Mercoa.CurrencyCode.Uah
    case '₺':
      return Mercoa.CurrencyCode.Try
    case '₼':
      return Mercoa.CurrencyCode.Azn
    case '₾':
      return Mercoa.CurrencyCode.Gel
    case '﷼':
      return Mercoa.CurrencyCode.Irr
    case 'Fr.':
    case 'CHf':
    case 'SFr.':
      return Mercoa.CurrencyCode.Chf
    case 'kr.':
      return Mercoa.CurrencyCode.Dkk
    default:
      return symbol as Mercoa.CurrencyCode
  }
}

export function currencyCodeToSymbol(code?: string | Mercoa.CurrencyCode) {
  if (!code) return '$'
  code = code.trim()
  switch (code) {
    case 'USD':
    case 'Usd':
    case Mercoa.CurrencyCode.Usd:
    case 'CAD':
    case 'Cad':
    case Mercoa.CurrencyCode.Cad:
    case 'AUD':
    case 'Aud':
    case Mercoa.CurrencyCode.Aud:
    case 'HKD':
    case 'Hkd':
    case Mercoa.CurrencyCode.Hkd:
      return '$'
    case 'EUR':
    case 'Eur':
    case Mercoa.CurrencyCode.Eur:
      return '€'
    case 'GBP':
    case 'Gbp':
    case Mercoa.CurrencyCode.Gbp:
      return '£'
    case 'JPY':
    case 'Jpy':
    case Mercoa.CurrencyCode.Jpy:
      return '¥'
    case 'INR':
    case 'Inr':
    case Mercoa.CurrencyCode.Inr:
      return '₹'
    case 'RUB':
    case 'Rub':
    case Mercoa.CurrencyCode.Rub:
      return '₽'
    case 'KRW':
    case 'Krw':
    case Mercoa.CurrencyCode.Krw:
      return '₩'
    case 'ILS':
    case 'Ils':
    case Mercoa.CurrencyCode.Ils:
      return '₪'
    case 'VND':
    case 'Vnd':
    case Mercoa.CurrencyCode.Vnd:
      return '₫'
    case 'LAK':
    case 'Lak':
    case Mercoa.CurrencyCode.Lak:
      return '₭'
    case 'MNT':
    case 'Mnt':
    case Mercoa.CurrencyCode.Mnt:
      return '₮'
    case 'PHP':
    case 'Php':
    case Mercoa.CurrencyCode.Php:
      return '₱'
    case 'PYG':
    case 'Pyg':
    case Mercoa.CurrencyCode.Pyg:
      return '₲'
    case 'UAH':
    case 'Uah':
    case Mercoa.CurrencyCode.Uah:
      return '₴'
    case 'TRY':
    case 'Try':
    case Mercoa.CurrencyCode.Try:
      return '₺'
    case 'AZN':
    case 'Azn':
    case Mercoa.CurrencyCode.Azn:
      return '₼'
    case 'GEL':
    case 'Gel':
    case Mercoa.CurrencyCode.Gel:
      return '₾'
    case 'IRR':
    case 'Irr':
    case Mercoa.CurrencyCode.Irr:
      return '﷼'
    case 'CHF':
    case 'Chf':
    case Mercoa.CurrencyCode.Chf:
      return 'Fr.'
    case 'DKK':
    case 'Dkk':
    case Mercoa.CurrencyCode.Dkk:
    case 'SEK':
    case 'Sek':
    case Mercoa.CurrencyCode.Sek:
    case 'NOK':
    case 'Nok':
    case Mercoa.CurrencyCode.Nok:
      return 'kr.'
    default:
      return code
  }
}

export const zeroDecimalCurrencies: Mercoa.CurrencyCode[] = [
  Mercoa.CurrencyCode.Bif,
  Mercoa.CurrencyCode.Clp,
  Mercoa.CurrencyCode.Djf,
  Mercoa.CurrencyCode.Gnf,
  Mercoa.CurrencyCode.Jpy,
  Mercoa.CurrencyCode.Kmf,
  Mercoa.CurrencyCode.Krw,
  Mercoa.CurrencyCode.Mga,
  Mercoa.CurrencyCode.Pyg,
  Mercoa.CurrencyCode.Rwf,
  Mercoa.CurrencyCode.Ugx,
  Mercoa.CurrencyCode.Vnd,
  Mercoa.CurrencyCode.Vuv,
  Mercoa.CurrencyCode.Xaf,
  Mercoa.CurrencyCode.Xof,
  Mercoa.CurrencyCode.Xpf,
]
export const threeDecimalCurrencies: Mercoa.CurrencyCode[] = [
  Mercoa.CurrencyCode.Bhd,
  Mercoa.CurrencyCode.Jod,
  Mercoa.CurrencyCode.Kwd,
  Mercoa.CurrencyCode.Omr,
  Mercoa.CurrencyCode.Tnd,
]

// $12.34 -> 1234
export function majorCurrencyToMinor(amount: number | null, currency?: Mercoa.CurrencyCode): string {
  if (!amount) return '0'

  let amountString = amount.toString()

  if (!currency) {
    // move decimal to the right, assume USD
    amountString = move_decimal(amount, 2)
  } else if (zeroDecimalCurrencies.includes(currency)) {
    amountString = move_decimal(amount, 0)
  } else if (threeDecimalCurrencies.includes(currency)) {
    // move decimal to the right
    amountString = move_decimal(amount, 3)
  }

  // move decimal to the right
  amountString = move_decimal(amount, 2)

  // truncate to integer
  amountString = amountString.split('.')[0]

  return amountString
}

// 1234 -> $12.34
export function minorCurrencyToMajor(amount: bigint | null, currency?: Mercoa.CurrencyCode): string {
  if (!amount) return '0'

  if (!currency) {
    // move decimal to the left, assume USD
    return move_decimal(amount, -2)
  }

  if (zeroDecimalCurrencies.includes(currency)) {
    return move_decimal(amount, 0)
  }

  if (threeDecimalCurrencies.includes(currency)) {
    // move decimal to the left
    return move_decimal(amount, -3)
  }

  // move decimal to the left
  return move_decimal(amount, -2)
}

// https://github.com/shesek/move-decimal-point
export function move_decimal(num: number | bigint, n: number) {
  const zeros = function (n: number) {
    return new Array(n + 1).join('0')
  }

  var frac, int, neg, ref
  if (n === 0) {
    return String(num)
  }
  ;(ref = ('' + num).split('.')), (int = ref[0]), (frac = ref[1])
  int || (int = '0')
  frac || (frac = '0')
  neg = int[0] === '-' ? '-' : ''
  if (neg) {
    int = int.slice(1)
  }
  if (n > 0) {
    if (n > frac.length) {
      frac += zeros(n - frac.length)
    }
    int += frac.slice(0, n)
    frac = frac.slice(n)
  } else {
    n = n * -1
    if (n > int.length) {
      int = zeros(n - int.length) + int
    }
    frac = int.slice(n * -1) + frac
    int = int.slice(0, n * -1)
  }
  while (int[0] === '0') {
    int = int.slice(1)
  }
  while (frac[frac.length - 1] === '0') {
    frac = frac.slice(0, -1)
  }
  return neg + (int || '0') + (frac.length ? '.' + frac : '')
}

;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}
