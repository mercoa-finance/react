import { Mercoa, MercoaClient } from '@mercoa/javascript'
import { Moov, loadMoov } from '@moovio/moov-js'
import { jwtDecode } from 'jwt-decode'
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { TokenOptions } from '.'
import { EntityPortal } from './index'

export interface MercoaContext {
  token?: string
  entityId?: string
  entity: Mercoa.EntityResponse | undefined
  user: Mercoa.EntityUserResponse | undefined
  users: Mercoa.EntityUserResponse[]
  selectedInvoice: Mercoa.InvoiceResponse | undefined
  setSelectedInvoice: Function
  client: MercoaClient | undefined
  refresh: Function
  refreshId: number
  organization: Mercoa.OrganizationResponse | undefined
  moov: Moov | undefined
  moovToken: string | undefined
  moovAccountId: string | undefined
  iframeOptions: TokenOptions | undefined
  setIframeOptions: Function
  getNewToken: Function
  googleMapsApiKey?: string
}
const sessionContext = createContext<MercoaContext>({
  token: '',
  entityId: '',
  entity: undefined,
  user: undefined,
  users: [],
  selectedInvoice: undefined,
  setSelectedInvoice: () => {},
  client: undefined,
  refresh: () => {},
  refreshId: 0,
  organization: undefined,
  moov: undefined,
  moovToken: undefined,
  moovAccountId: undefined,
  iframeOptions: undefined,
  setIframeOptions: () => {},
  getNewToken: (expiresIn?: string) => {},
  googleMapsApiKey: undefined,
})

// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useSession().
export function MercoaSession({
  children,
  entityId,
  entityUserId,
  token,
  endpoint,
  isAdmin,
  googleMapsApiKey,
}: {
  children?: ReactNode
  entityId?: Mercoa.EntityId
  entityUserId?: Mercoa.EntityUserId
  token: string
  endpoint?: string
  isAdmin?: boolean
  googleMapsApiKey?: string
}) {
  return (
    <sessionContext.Provider
      value={useProvideSession({ token, entityId, entityUserId, endpoint, isAdmin, googleMapsApiKey })}
    >
      {children || <EntityPortal token={token} />}
    </sessionContext.Provider>
  )
}

// Hook for child components to get the auth object ...
// ... and re-render when it changes.
export const useMercoaSession = () => {
  return useContext(sessionContext)
}

// Provider hook that creates auth object and handles state
function useProvideSession({
  token,
  entityId,
  entityUserId,
  endpoint,
  isAdmin,
  googleMapsApiKey,
}: {
  token: string
  entityId?: Mercoa.EntityId
  entityUserId?: Mercoa.EntityUserId
  endpoint?: string
  isAdmin?: boolean
  googleMapsApiKey?: string
}) {
  const [entity, setEntity] = useState<Mercoa.EntityResponse>()
  const [user, setUser] = useState<Mercoa.EntityUserResponse>()
  const [users, setUsers] = useState<Mercoa.EntityUserResponse[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Mercoa.InvoiceResponse>()
  const [organization, setOrganization] = useState<Mercoa.OrganizationResponse>()
  const [refreshId, setRefreshId] = useState(0)
  const [moov, setMoov] = useState<Moov>()
  const [moovAccountId, setMoovAccountId] = useState<string>()
  const [moovToken, setMoovToken] = useState<string>()
  const [tokenLocal, setToken] = useState<string>(token)
  const [iframeOptions, setIframeOptions] = useState<TokenOptions>()

  const client = useMemo(() => {
    return new MercoaClient({
      environment: endpoint ?? 'https://api.mercoa.com',
      token: tokenLocal,
    })
  }, [tokenLocal])

  async function refresh() {
    if (!token) return
    let eid = entityId
    if (!eid) {
      try {
        const { entityId } = jwtDecode(String(token)) as TokenOptions
        eid = entityId
      } catch (e) {
        console.error(e)
      }
    }
    if (eid === 'undefined') return
    client.organization
      .get({
        paymentMethods: true,
        emailProvider: true,
        colorScheme: true,
        payeeOnboardingOptions: true,
        payorOnboardingOptions: true,
        metadataSchema: true,
      })
      .then((o) => {
        setOrganization(o)
      })
    if (eid === 'all') return
    if (eid) {
      client.entity.get(eid).then((e) => {
        setEntity(e)
        setRefreshId(Math.random())
      })
      let uid = entityUserId
      if (!uid) {
        try {
          const { userId } = jwtDecode(String(token)) as TokenOptions
          uid = userId
        } catch (e) {
          console.error(e)
        }
      }
      if (uid) {
        client.entity.user.get(eid, uid).then((u) => {
          setUser(u)
        })
      }
      client.entity.user.getAll(eid).then((u) => {
        setUsers(u)
      })
      if (!moov && !isAdmin) {
        client.entity.getToken(eid, {}).then(async (e) => {
          setToken(e)
          const { moov } = jwtDecode(String(e)) as { moov: { token: string; accountId: string } }
          setMoovAccountId(moov.accountId)
          setMoovToken(moov.token)
          try {
            const m = await loadMoov(moov.token)
            if (m) setMoov(m)
          } catch (e) {
            console.error(e)
          }
        })
      }
    }
  }

  async function getNewToken(expiresIn?: string) {
    const options = iframeOptions || {
      options: {
        expiresIn: expiresIn ?? '12hr',
      },
    }
    if (!options.options) options.options = {}
    options.options.expiresIn = expiresIn ?? '12hr'
    if (!entity?.id) return
    let newToken = ''
    if (user?.id) {
      newToken = await client.entity.user.getToken(entity.id, user.id, { ...options.options })
    } else {
      newToken = await client.entity.getToken(entity.id, { ...options.options })
    }
    setToken(newToken)
  }

  // Set C1-defined color theming
  useEffect(() => {
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

    const primary = organization?.colorScheme?.primaryColor || '#4f46e5' // default is indigo-600
    const primaryLight = organization?.colorScheme?.primaryColor
      ? adjustBrightness(organization?.colorScheme?.primaryColor, 40)
      : '#6366f1' //default is indigo-500
    const primaryDark = organization?.colorScheme?.primaryColor
      ? adjustBrightness(organization?.colorScheme?.primaryColor, -40)
      : '#4338ca' //default is indigo-700

    let primaryText = primary
    let primaryTextInvert = '#ffffff'
    // hardcode colors for white theme
    if (primary === '#f8fafc') {
      primaryText = '#111827' // black
      primaryTextInvert = '#111827' // black
    }

    document.documentElement.style.setProperty('--mercoa-primary', primary)
    document.documentElement.style.setProperty('--mercoa-primary-light', primaryLight)
    document.documentElement.style.setProperty('--mercoa-primary-dark', primaryDark)
    document.documentElement.style.setProperty('--mercoa-primary-text', primaryText)
    document.documentElement.style.setProperty('--mercoa-primary-text-invert', primaryTextInvert)
  }, [organization?.colorScheme?.primaryColor])

  useEffect(() => {
    refresh()
  }, [token, entityId])

  // Return the user object and auth methods
  return {
    refresh,
    refreshId,
    token,
    entityId: entityId ?? entity?.id,
    entity,
    user,
    users,
    selectedInvoice,
    setSelectedInvoice,
    client,
    organization,
    moov,
    moovAccountId,
    moovToken,
    iframeOptions,
    setIframeOptions,
    getNewToken,
    googleMapsApiKey,
  }
}
