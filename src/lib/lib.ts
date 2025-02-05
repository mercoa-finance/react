import { Mercoa } from '@mercoa/javascript'

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

export function removeThousands(_value: any, originalValue: string | number) {
  return typeof originalValue === 'string' ? Number(originalValue?.replace(/,/g, '')) : originalValue
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
  offPlatform: 'Off Platform',
  utility: 'Utility',
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

export function getEndpoint() {
  if (typeof window !== 'undefined' && window && window.location && window.location.href) {
    if (window.location.href.includes('staging.mercoa.com')) {
      return 'https://api.staging.mercoa.com'
    } else if (
      window &&
      window.location &&
      window.location.href &&
      (window.location.href.includes('localhost') || window.location.href.includes('ngrok'))
    ) {
      if (process.env.NEXT_PUBLIC_ENABLE_HTTPS) {
        return 'https://api-mercoa.ngrok.io'
      }
      return 'http://localhost:8080'
    }
  }
  return 'https://api.mercoa.com'
}

export function circularReplacer() {
  const seen = new WeakSet()
  return (key: any, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}

export function setStyle({ colorScheme }: { colorScheme?: Mercoa.ColorSchemeResponse }) {
  type FontSizeConfig = {
    [key: string]: number
  }

  const scalingFactors: FontSizeConfig = {
    xs: 0.75,
    sm: 0.875,
    base: 1,
    lg: 1.125,
    xl: 1.25,
    '2xl': 1.5,
    '3xl': 2,
    '4xl': 2.5,
    '5xl': 3,
    '6xl': 3.75,
    '7xl': 4.5,
    '8xl': 6,
    '9xl': 8,
  }

  /**
   * Updates CSS variables for font sizes based on a base size and scaling factors.
   *
   * @param baseSize - The base size as a string (e.g., "1rem", "16px").
   */
  function updateFontSizeVariables(baseSize: string): void {
    const match = baseSize.match(/^([\d.]+)([a-z%]+)$/)
    if (!match) {
      console.error("Invalid base size format. Expected a number followed by a unit (e.g., '1rem').")
      return
    }

    const [, baseValueStr, unit] = match
    const baseValue = parseFloat(baseValueStr)

    // Update the CSS variables using the scaling factors
    Object.entries(scalingFactors).forEach(([key, scale]) => {
      const calculatedSize = baseValue * scale
      document.documentElement.style.setProperty(`--mercoa-font-size-${key}`, `${calculatedSize}${unit}`)
    })
  }

  const adjustBrightness = (col: string, amt: number) => {
    col = col.replace(/^#/, '')
    if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2]

    let [r, g, b] = col.match(/.{2}/g) as [any, any, any]
    ;[r, g, b] = [parseInt(r, 16) + amt, parseInt(g, 16) + amt, parseInt(b, 16) + amt]

    r = Math.max(Math.min(255, r), 0).toString(16)
    g = Math.max(Math.min(255, g), 0).toString(16)
    b = Math.max(Math.min(255, b), 0).toString(16)

    const rr = (r.length < 2 ? '0' : '') + r
    const gg = (g.length < 2 ? '0' : '') + g
    const bb = (b.length < 2 ? '0' : '') + b

    return `#${rr}${gg}${bb}`
  }

  const logoBackground = colorScheme?.logoBackgroundColor || 'transparent' // default is transparent
  const primary = colorScheme?.primaryColor || '#4f46e5' // default is indigo-600
  const primaryLight = adjustBrightness(primary, 40)
  const primaryDark = adjustBrightness(primary, -40)
  let primaryText = primary
  let primaryTextInvert = '#ffffff'
  // hardcode colors for white theme
  if (primary === '#f8fafc') {
    primaryText = '#111827' // black
    primaryTextInvert = '#111827' // black
  }

  const secondary = colorScheme?.secondaryColor || '#ef4444' // default is red-500
  const secondaryLight = adjustBrightness(secondary, 40)
  const secondaryDark = adjustBrightness(secondary, -40)
  let secondaryText = secondary
  let secondaryTextInvert = '#ffffff'
  // hardcode colors for white theme
  if (secondary === '#f8fafc') {
    secondaryText = '#111827' // black
    secondaryTextInvert = '#111827' // black
  }

  document.documentElement.style.setProperty('--mercoa-logo-background', logoBackground)

  document.documentElement.style.setProperty('--mercoa-primary', primary)
  document.documentElement.style.setProperty('--mercoa-primary-light', primaryLight)
  document.documentElement.style.setProperty('--mercoa-primary-dark', primaryDark)
  document.documentElement.style.setProperty('--mercoa-primary-text', primaryText)
  document.documentElement.style.setProperty('--mercoa-primary-text-invert', primaryTextInvert)

  document.documentElement.style.setProperty('--mercoa-secondary', secondary)
  document.documentElement.style.setProperty('--mercoa-secondary-light', secondaryLight)
  document.documentElement.style.setProperty('--mercoa-secondary-dark', secondaryDark)
  document.documentElement.style.setProperty('--mercoa-secondary-text', secondaryText)
  document.documentElement.style.setProperty('--mercoa-secondary-text-invert', secondaryTextInvert)

  document.documentElement.style.setProperty('--mercoa-border-radius', (colorScheme?.roundedCorners ?? 6) + 'px')
  if (colorScheme?.fontFamily) {
    document.documentElement.style.setProperty('--mercoa-font-family', `${colorScheme?.fontFamily}`)
  }
  if (colorScheme?.fontSize) {
    updateFontSizeVariables(colorScheme?.fontSize)
  }
}
