import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { Mercoa, MercoaClient } from '@mercoa/javascript'
import { Moov, loadMoov } from '@moovio/moov-js'
import { jwtDecode } from 'jwt-decode'
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ToastContainer } from 'react-toastify'
import { EntityPortal, TokenOptions } from './index'
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
  heightOffset: number
  setHeightOffset: Function
  debug: Function
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
  heightOffset: 70,
  setHeightOffset: () => {},
  debug: () => {},
})

interface contextClassType {
  [key: string]: string
}
const contextClass: contextClassType = {
  success: 'mercoa-bg-green-50 mercoa-text-green-700',
  error: 'mercoa-bg-red-50 mercoa-text-red-700',
  info: 'mercoa-bg-blue-50 mercoa-text-blue-700',
  warning: 'mercoa-bg-yellow-50 mercoa-text-yellow-700',
  default: 'mercoa-bg-indigo-600 mercoa-text-white',
  dark: 'mercoa-bg-white-600 mercoa-font-gray-300',
}

export function MercoaSession({
  children,
  entityId,
  entityUserId,
  token,
  endpoint,
  isAdmin,
  googleMapsApiKey,
  disableToastContainer,
  heightOffset,
  debug,
}: {
  children?: ReactNode
  entityId?: Mercoa.EntityId
  entityUserId?: Mercoa.EntityUserId
  token: string
  endpoint?: string
  isAdmin?: boolean
  googleMapsApiKey?: string
  disableToastContainer?: boolean
  heightOffset?: number
  debug?: boolean
}) {
  return (
    <sessionContext.Provider
      value={useProvideSession({
        token,
        entityId,
        entityUserId,
        endpoint,
        isAdmin,
        googleMapsApiKey,
        heightOffset: heightOffset ?? 70,
        debug: debug ?? false,
      })}
    >
      {disableToastContainer ? (
        <></>
      ) : (
        <ToastContainer
          toastClassName={(options) => {
            const type = options?.type || 'default'
            return (
              contextClass[type] +
              ' mercoa-relative mercoa-flex mercoa-p-1 mercoa-min-h-10 mercoa-rounded-md mercoa-justify-between mercoa-overflow-hidden mercoa-cursor-pointer '
            )
          }}
          bodyClassName={() =>
            'mercoa-text-sm mercoa-font-medium mercoa-p-3 mercoa-m-0 mercoa-flex mercoa-items-center'
          }
          position={'top-center'}
          autoClose={3000}
          hideProgressBar
          icon={({ theme, type }) => {
            switch (type) {
              case 'error':
                return (
                  <div className="mercoa-flex-shrink-0">
                    <XCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-red-400" aria-hidden="true" />
                  </div>
                )
              case 'info':
                return (
                  <div className="mercoa-flex-shrink-0">
                    <InformationCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-blue-400" aria-hidden="true" />
                  </div>
                )
              case 'success':
                return (
                  <div className="mercoa-flex-shrink-0">
                    <CheckCircleIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-green-400" aria-hidden="true" />
                  </div>
                )
              case 'warning':
                return (
                  <div className="mercoa-flex-shrink-0">
                    <ExclamationTriangleIcon
                      className="mercoa-h-5 mercoa-w-5 mercoa-text-yellow-400"
                      aria-hidden="true"
                    />
                  </div>
                )
              case 'default':
                return <div className="mercoa-flex-shrink-0"></div>
            }
          }}
        />
      )}
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
  heightOffset,
  debug,
}: {
  token: string
  entityId?: Mercoa.EntityId
  entityUserId?: Mercoa.EntityUserId
  endpoint?: string
  isAdmin?: boolean
  googleMapsApiKey?: string
  heightOffset: number
  debug?: boolean
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
  const [heightOffsetLocal, setHeightOffset] = useState<number>(heightOffset)

  useEffect(() => {
    setHeightOffset(heightOffset)
  }, [heightOffset])

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
      .then((o: Mercoa.OrganizationResponse) => {
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
          if (!moov || !moov.token || moov.token === 'sandbox') return
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
    if (!organization?.colorScheme) return
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

    const logoBackground = organization.colorScheme.logoBackgroundColor || 'transparent' // default is transparent
    const primary = organization.colorScheme.primaryColor || '#4f46e5' // default is indigo-600
    const primaryLight = adjustBrightness(primary, 40)
    const primaryDark = adjustBrightness(primary, -40)

    let primaryText = primary
    let primaryTextInvert = '#ffffff'
    // hardcode colors for white theme
    if (primary === '#f8fafc') {
      primaryText = '#111827' // black
      primaryTextInvert = '#111827' // black
    }

    document.documentElement.style.setProperty('--mercoa-logo-background', logoBackground)
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
    setHeightOffset,
    heightOffset: heightOffsetLocal,
    debug: (val: any) => {
      if (debug) {
        console.log(val)
      }
    },
  }
}
