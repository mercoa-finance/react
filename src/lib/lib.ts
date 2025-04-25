import { Mercoa } from '@mercoa/javascript'

export function capitalize(str: string | undefined) {
  if (!str) str = ''
  return str?.[0]?.toUpperCase() + str?.substring(1)?.toLowerCase()
}

export function getOrdinalSuffix(n: number) {
  const enOrdinalRules = new Intl.PluralRules('en-US', { type: 'ordinal' })
  const suffixes = new Map([
    ['one', 'st'],
    ['two', 'nd'],
    ['few', 'rd'],
    ['other', 'th'],
  ])
  const rule = enOrdinalRules.select(n)
  return suffixes.get(rule)
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
  wallet: 'Wallet',
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

export type RBACPermissions = {
  invoice: {
    all: boolean
    view: {
      all: boolean
      statuses: Mercoa.InvoiceStatus[]
    }
    create: {
      all: boolean
      statuses: Mercoa.InvoiceStatus[]
    }
    update: {
      all: boolean
      statuses: Mercoa.InvoiceStatus[]
    }
    delete: boolean
    comment: {
      view: boolean
      create: boolean
    }
    approver: {
      override: boolean
    }
    check: {
      print: boolean
    }
  }
  paymentMethod: {
    all: boolean
    view: boolean
    create: boolean
    update: boolean
    delete: boolean
  }
}
export function buildRbacPermissions(permissions: Mercoa.Permission[]): RBACPermissions {
  // If no permissions provided, return all true
  if (!permissions || permissions.length === 0) {
    return {
      invoice: {
        all: true,
        view: {
          all: true,
          statuses: [
            Mercoa.InvoiceStatus.Draft,
            Mercoa.InvoiceStatus.New,
            Mercoa.InvoiceStatus.Approved,
            Mercoa.InvoiceStatus.Scheduled,
            Mercoa.InvoiceStatus.Pending,
            Mercoa.InvoiceStatus.Paid,
            Mercoa.InvoiceStatus.Archived,
            Mercoa.InvoiceStatus.Refused,
            Mercoa.InvoiceStatus.Failed,
          ],
        },
        create: {
          all: true,
          statuses: [
            Mercoa.InvoiceStatus.Draft,
            Mercoa.InvoiceStatus.New,
            Mercoa.InvoiceStatus.Approved,
            Mercoa.InvoiceStatus.Scheduled,
            Mercoa.InvoiceStatus.Pending,
            Mercoa.InvoiceStatus.Paid,
            Mercoa.InvoiceStatus.Canceled,
          ],
        },
        update: {
          all: true,
          statuses: [
            Mercoa.InvoiceStatus.Draft,
            Mercoa.InvoiceStatus.New,
            Mercoa.InvoiceStatus.Approved,
            Mercoa.InvoiceStatus.Scheduled,
            Mercoa.InvoiceStatus.Pending,
            Mercoa.InvoiceStatus.Paid,
            Mercoa.InvoiceStatus.Archived,
            Mercoa.InvoiceStatus.Canceled,
          ],
        },
        delete: true,
        comment: {
          view: true,
          create: true,
        },
        approver: {
          override: true,
        },
        check: {
          print: true,
        },
      },
      paymentMethod: {
        all: true,
        view: true,
        create: true,
        update: true,
        delete: true,
      },
    }
  }

  const rbac: RBACPermissions = {
    invoice: {
      all: false,
      view: {
        all: false,
        statuses: [],
      },
      create: {
        all: false,
        statuses: [],
      },
      update: {
        all: false,
        statuses: [],
      },
      delete: false,
      comment: {
        view: false,
        create: false,
      },
      approver: {
        override: false,
      },
      check: {
        print: false,
      },
    },
    paymentMethod: {
      all: false,
      view: false,
      create: false,
      update: false,
      delete: false,
    },
  }

  permissions.forEach((permission) => {
    if (permission === Mercoa.Permission.InvoiceAll) rbac.invoice.all = true
    else if (permission === Mercoa.Permission.InvoiceViewAll) rbac.invoice.view.all = true
    else if (permission === Mercoa.Permission.InvoiceViewDraft)
      rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.Draft)
    else if (permission === Mercoa.Permission.InvoiceViewNew) rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.New)
    else if (permission === Mercoa.Permission.InvoiceViewApproved)
      rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.Approved)
    else if (permission === Mercoa.Permission.InvoiceViewScheduled)
      rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.Scheduled)
    else if (permission === Mercoa.Permission.InvoiceViewPending)
      rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.Pending)
    else if (permission === Mercoa.Permission.InvoiceViewPaid)
      rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.Paid)
    else if (permission === Mercoa.Permission.InvoiceViewArchived)
      rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.Archived)
    else if (permission === Mercoa.Permission.InvoiceViewRefused)
      rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.Refused)
    else if (permission === Mercoa.Permission.InvoiceViewCanceled)
      rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.Canceled)
    else if (permission === Mercoa.Permission.InvoiceViewFailed)
      rbac.invoice.view.statuses.push(Mercoa.InvoiceStatus.Failed)
    else if (permission === Mercoa.Permission.InvoiceCreateAll) rbac.invoice.create.all = true
    else if (permission === Mercoa.Permission.InvoiceCreateDraft)
      rbac.invoice.create.statuses.push(Mercoa.InvoiceStatus.Draft)
    else if (permission === Mercoa.Permission.InvoiceCreateNew)
      rbac.invoice.create.statuses.push(Mercoa.InvoiceStatus.New)
    else if (permission === Mercoa.Permission.InvoiceCreateApproved)
      rbac.invoice.create.statuses.push(Mercoa.InvoiceStatus.Approved)
    else if (permission === Mercoa.Permission.InvoiceCreateScheduled)
      rbac.invoice.create.statuses.push(Mercoa.InvoiceStatus.Scheduled)
    else if (permission === Mercoa.Permission.InvoiceCreateArchived)
      rbac.invoice.create.statuses.push(Mercoa.InvoiceStatus.Archived)
    else if (permission === Mercoa.Permission.InvoiceCreateCancel)
      rbac.invoice.create.statuses.push(Mercoa.InvoiceStatus.Canceled)
    else if (permission === Mercoa.Permission.InvoiceUpdateAll) rbac.invoice.update.all = true
    else if (permission === Mercoa.Permission.InvoiceUpdateDraft)
      rbac.invoice.update.statuses.push(Mercoa.InvoiceStatus.Draft)
    else if (permission === Mercoa.Permission.InvoiceUpdateNew)
      rbac.invoice.update.statuses.push(Mercoa.InvoiceStatus.New)
    else if (permission === Mercoa.Permission.InvoiceUpdateApproved)
      rbac.invoice.update.statuses.push(Mercoa.InvoiceStatus.Approved)
    else if (permission === Mercoa.Permission.InvoiceUpdateScheduled)
      rbac.invoice.update.statuses.push(Mercoa.InvoiceStatus.Scheduled)
    else if (permission === Mercoa.Permission.InvoiceUpdateArchived)
      rbac.invoice.update.statuses.push(Mercoa.InvoiceStatus.Archived)
    else if (permission === Mercoa.Permission.InvoiceUpdateCancel)
      rbac.invoice.update.statuses.push(Mercoa.InvoiceStatus.Canceled)
    else if (permission === Mercoa.Permission.InvoiceDelete) rbac.invoice.delete = true
    else if (permission === Mercoa.Permission.InvoiceCommentView) rbac.invoice.comment.view = true
    else if (permission === Mercoa.Permission.InvoiceCommentCreate) rbac.invoice.comment.create = true
    else if (permission === Mercoa.Permission.InvoiceApproverOverride) rbac.invoice.approver.override = true
    else if (permission === Mercoa.Permission.InvoiceCheckPrint) {
      rbac.invoice.check.print = true
      rbac.invoice.create.statuses.push(Mercoa.InvoiceStatus.Paid)
    } else if (permission === Mercoa.Permission.PaymentMethodAll) {
      rbac.paymentMethod.view = true
      rbac.paymentMethod.create = true
      rbac.paymentMethod.update = true
      rbac.paymentMethod.delete = true
    } else if (permission === Mercoa.Permission.PaymentMethodView) rbac.paymentMethod.view = true
    else if (permission === Mercoa.Permission.PaymentMethodCreate) rbac.paymentMethod.create = true
    else if (permission === Mercoa.Permission.PaymentMethodUpdate) rbac.paymentMethod.update = true
    else if (permission === Mercoa.Permission.PaymentMethodDelete) rbac.paymentMethod.delete = true
  })

  return rbac
}

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
