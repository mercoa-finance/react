import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/20/solid'
import { Mercoa, MercoaClient } from '@mercoa/javascript'
import { jwtDecode } from 'jwt-decode'
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ToastContainer } from 'react-toastify'
import { EntityPortal, TokenOptions, getAllUsers } from './index'

export interface MercoaContext {
  token?: string
  entityId?: string
  entityGroupId?: string
  entity: Mercoa.EntityResponse | undefined
  entityGroup: Mercoa.EntityGroupResponse | undefined
  entities: Mercoa.EntityResponse[] | undefined
  setEntity: (entity?: Mercoa.EntityResponse) => void
  user: Mercoa.EntityUserResponse | undefined
  users: Mercoa.EntityUserResponse[]
  customPaymentMethodSchemas: Mercoa.CustomPaymentMethodSchemaResponse[]
  selectedInvoice: Mercoa.InvoiceResponse | undefined
  setSelectedInvoice: Function
  client: MercoaClient | undefined
  refresh: () => Promise<void>
  refreshId: number
  organization: Mercoa.OrganizationResponse | undefined
  iframeOptions: TokenOptions | undefined
  setIframeOptions: Function
  getNewToken: () => Promise<void>
  googleMapsApiKey?: string
  heightOffset: number
  setHeightOffset: Function
  debug: Function
  fetchMetadata?: string[] | boolean
}
const sessionContext = createContext<MercoaContext>({
  token: '',
  entityId: '',
  entityGroupId: '',
  entity: undefined,
  entityGroup: undefined,
  entities: undefined,
  setEntity: () => {},
  user: undefined,
  users: [],
  customPaymentMethodSchemas: [],
  selectedInvoice: undefined,
  setSelectedInvoice: () => {},
  client: undefined,
  refresh: async () => {},
  refreshId: 0,
  organization: undefined,
  iframeOptions: undefined,
  setIframeOptions: () => {},
  getNewToken: async (expiresIn?: string) => {},
  googleMapsApiKey: undefined,
  heightOffset: 100,
  setHeightOffset: () => {},
  debug: () => {},
  fetchMetadata: undefined,
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
  entityGroupId,
  token,
  endpoint,
  googleMapsApiKey,
  disableToastContainer,
  heightOffset,
  debug,
  fetchMetadata,
}: {
  children?: ReactNode
  entityId?: Mercoa.EntityId
  entityUserId?: Mercoa.EntityUserId
  entityGroupId?: Mercoa.EntityGroupId
  token: string
  endpoint?: string
  googleMapsApiKey?: string
  disableToastContainer?: boolean
  heightOffset?: number
  debug?: boolean
  fetchMetadata?: string[]
}) {
  return (
    <sessionContext.Provider
      value={useProvideSession({
        token,
        entityId,
        entityUserId,
        entityGroupId,
        endpoint,
        googleMapsApiKey,
        heightOffset: heightOffset ?? 100,
        debug: debug ?? false,
        fetchMetadata: fetchMetadata,
      })}
    >
      {disableToastContainer ? (
        <></>
      ) : (
        <ToastContainer
          toastClassName={(options) => {
            const type = options?.type || 'default'
            return `${contextClass[type]} mercoa-relative mercoa-flex mercoa-p-1 mercoa-min-h-10 mercoa-rounded-mercoa mercoa-justify-between mercoa-overflow-hidden mercoa-cursor-pointer`
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
                    <XCircleIcon className="mercoa-size-5 mercoa-text-red-400" aria-hidden="true" />
                  </div>
                )
              case 'info':
                return (
                  <div className="mercoa-flex-shrink-0">
                    <InformationCircleIcon className="mercoa-size-5 mercoa-text-blue-400" aria-hidden="true" />
                  </div>
                )
              case 'success':
                return (
                  <div className="mercoa-flex-shrink-0">
                    <CheckCircleIcon className="mercoa-size-5 mercoa-text-green-400" aria-hidden="true" />
                  </div>
                )
              case 'warning':
                return (
                  <div className="mercoa-flex-shrink-0">
                    <ExclamationTriangleIcon className="mercoa-size-5 mercoa-text-yellow-400" aria-hidden="true" />
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
  entityGroupId,
  endpoint,
  googleMapsApiKey,
  heightOffset,
  debug,
  fetchMetadata,
}: {
  token: string
  entityId?: Mercoa.EntityId
  entityUserId?: Mercoa.EntityUserId
  entityGroupId?: Mercoa.EntityGroupId
  endpoint?: string
  googleMapsApiKey?: string
  heightOffset: number
  debug?: boolean
  fetchMetadata?: string[]
}) {
  const [entity, setEntity] = useState<Mercoa.EntityResponse>()
  const [user, setUser] = useState<Mercoa.EntityUserResponse>()
  const [users, setUsers] = useState<Mercoa.EntityUserResponse[]>([])
  const [customPaymentMethodSchemas, setCustomPaymentMethodSchemas] =
    useState<Mercoa.CustomPaymentMethodSchemaResponse[]>()
  const [selectedInvoice, setSelectedInvoice] = useState<Mercoa.InvoiceResponse>()
  const [organization, setOrganization] = useState<Mercoa.OrganizationResponse>()
  const [refreshId, setRefreshId] = useState(0)
  const [tokenLocal, setToken] = useState<string>(token)
  const [iframeOptions, setIframeOptions] = useState<TokenOptions>()
  const [heightOffsetLocal, setHeightOffset] = useState<number>(heightOffset)
  const [entityGroup, setEntityGroup] = useState<Mercoa.EntityGroupResponse>()

  useEffect(() => {
    setHeightOffset(heightOffset)
  }, [heightOffset])

  useEffect(() => {
    setToken(token)
  }, [token])

  let defaultEndpoint = 'https://api.mercoa.com'

  const client = useMemo(() => {
    if (typeof window !== 'undefined' && window && window.location && window.location.href) {
      if (window.location.href.includes('staging.mercoa.com')) {
        defaultEndpoint = 'https://api.staging.mercoa.com'
      }
    }

    // validate token
    if (tokenLocal && tokenLocal.indexOf('.') > -1) {
      try {
        const token = jwtDecode(String(tokenLocal)) as TokenOptions
        if (!token.organizationId) {
          throw new Error('Invalid token')
        }
        if (!token.entityId && !token.userId && !token.invoiceId && !token.counterpartyId && !token.entityGroupId) {
          throw new Error('Invalid token')
        }
        if (Date.now() >= token.exp * 1000) {
          throw new Error('Token expired')
        }
      } catch (e) {
        console.error(e)
        throw new Error('Invalid token')
      }
    }

    return new MercoaClient({
      environment: endpoint ?? defaultEndpoint,
      token: tokenLocal,
    })
  }, [tokenLocal])

  async function refresh() {
    setRefreshId(Math.random())
    if (!tokenLocal) return

    // Get org data
    try {
      const o = await client.organization.get({
        paymentMethods: true,
        emailProvider: true,
        externalAccountingSystemProvider: true,
        colorScheme: true,
        payeeOnboardingOptions: true,
        payorOnboardingOptions: true,
        metadataSchema: true,
      })
      const schemas = await client.customPaymentMethodSchema.getAll()
      setOrganization(o)
      setCustomPaymentMethodSchemas(schemas)
    } catch (e) {
      console.error(e)
      console.error('Failed to get organization data')
    }

    if (entityId) {
      await refreshEntity(entityId)
      return
    }
    try {
      const { entityId: tokenEid, entityGroupId } = jwtDecode(String(tokenLocal)) as TokenOptions
      if (tokenEid && !entityGroupId) {
        await refreshEntity(tokenEid)
        return
      } else if (entityGroupId) {
        await refreshEntityGroup()
        return
      }
    } catch (e) {
      console.error(e)
    }
    if (entityGroupId) {
      await refreshEntityGroup()
      return
    }
  }

  async function refreshEntity(eid?: string) {
    // get entity Id from passed prop or token
    if (!eid) {
      try {
        const { entityId } = jwtDecode(String(tokenLocal)) as TokenOptions
        eid = entityId
      } catch (e) {
        console.error(e)
      }
    }
    if (eid === 'undefined') return

    // Get org data
    try {
      const o = await client.organization.get({
        paymentMethods: true,
        emailProvider: true,
        externalAccountingSystemProvider: true,
        colorScheme: true,
        payeeOnboardingOptions: true,
        payorOnboardingOptions: true,
        metadataSchema: true,
      })
      const schemas = await client.customPaymentMethodSchema.getAll()
      setOrganization(o)
      setCustomPaymentMethodSchemas(schemas)
    } catch (e) {
      console.error(e)
      console.error('Failed to get organization data')
    }

    if (eid === 'all') return

    // Get entity data
    if (eid) {
      try {
        const e = await client.entity.get(eid, {
          returnMetadata: fetchMetadata,
        })
        setEntity(e)
      } catch (e) {
        console.error(e)
        console.error('Failed to get entity ' + eid)
      }

      // get entity user id from passed prop or token
      let uid = entityUserId
      if (!uid) {
        try {
          const { userId } = jwtDecode(String(tokenLocal)) as TokenOptions
          uid = userId
        } catch (e) {
          console.error(e)
        }
      }

      // get user data
      try {
        const allUsers = await getAllUsers(client, eid)
        setUsers(allUsers)
        if (uid) {
          setUser(allUsers.find((u) => u.id === uid))
        }
      } catch (e) {
        console.error(e)
        console.error('Failed to get users for entity ' + eid)
      }
    }
  }

  async function refreshEntityGroup() {
    let egi = entityGroupId
    if (!egi) {
      const { entityGroupId } = jwtDecode(String(tokenLocal)) as TokenOptions
      egi = entityGroupId
    }
    // Get entity data
    if (egi && egi !== 'all') {
      try {
        const group = await client.entityGroup.get(egi, {
          returnEntityMetadata: fetchMetadata,
        })
        setEntityGroup(group)
      } catch (e) {
        console.error(e)
        console.error('Failed to get entity group ' + egi)
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
    document.documentElement.style.setProperty(
      '--mercoa-border-radius',
      (organization.colorScheme.roundedCorners ?? 6) + 'px',
    )
  }, [organization?.colorScheme?.primaryColor])

  useEffect(() => {
    refresh()
  }, [token, entityId])

  // Return the user object and auth methods
  return {
    refresh,
    refreshId,
    token: tokenLocal,
    entityId: entityId ?? entity?.id,
    entityGroupId,
    entity,
    entityGroup,
    entities: entityGroup?.entities,
    setEntity: (entity?: Mercoa.EntityResponse) => {
      setEntity(entity)
      refresh()
    },
    user,
    users,
    customPaymentMethodSchemas: customPaymentMethodSchemas ?? [],
    selectedInvoice,
    setSelectedInvoice,
    client,
    organization,
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
