export function capitalize(str: string | undefined) {
  if (!str) str = ''
  return str?.[0]?.toUpperCase() + str?.substring(1)?.toLowerCase()
}

export function invertColor(hex: string, bw?: boolean) {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1)
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.')
  }
  let r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16)
  if (bw) {
    // http://stackoverflow.com/a/3943023/112731
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF'
  }
  // invert color components
  let r2 = (255 - r).toString(16)
  let g2 = (255 - g).toString(16)
  let b2 = (255 - b).toString(16)
  // pad each with zeros and return
  return '#' + padZero(r2) + padZero(g2) + padZero(b2)
  function padZero(str: string, len?: number) {
    len = len || 2
    var zeros = new Array(len).join('0')
    return (zeros + str).slice(-len)
  }
}

export function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

export function constructFullName(
  firstName: string,
  lastName: string,
  middleName?: string | null,
  suffix?: string | null,
) {
  const fullName = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}${suffix ? ' ' + suffix : ''}`

  return fullName
}

export const prettyPaymentMethodTypes = {
  custom: 'Custom',
  check: 'Check',
  bankAccount: 'Bank Account',
  na: 'N/A',
  card: 'Card',
  bnpl: 'BNPL',
  virtualCard: 'Virtual Card',
}

export const prettyBusinessTypes = {
  SoleProprietorship: 'Sole Proprietorship',
  UnincorporatedAssociation: 'Unincorporated Association',
  Trust: 'Trust',
  PublicCorporation: 'Public Corporation',
  PrivateCorporation: 'Private Corporation',
  Llc: 'LLC',
  Partnership: 'Partnership',
  UnincorporatedNonProfit: 'Unincorporated Nonprofit',
  IncorporatedNonProfit: 'Incorporated Nonprofit',
}
