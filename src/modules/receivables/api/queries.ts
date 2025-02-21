import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { useInfiniteQuery } from '../../../lib/react-query/use-infinite-query'
import { useQuery } from '../../../lib/react-query/use-query'

export interface ReceivablesResponse {
  count: number
  invoices: Mercoa.InvoiceResponse[]
  nextCursor?: string
}

export interface UseReceivablesRequestOptions {
  currentStatuses?: Mercoa.InvoiceStatus[]
  search?: string
  startDate?: Date
  endDate?: Date
  orderBy?: Mercoa.InvoiceOrderByField
  orderDirection?: Mercoa.OrderDirection
  excludePayables?: boolean
  resultsPerPage: number
  paymentType?: Mercoa.PaymentType[]
  metadata?: Mercoa.MetadataFilter | Mercoa.MetadataFilter[]
  dateType?: Mercoa.InvoiceDateFilter
}

export function useReceivables({
  currentStatuses,
  search,
  startDate,
  endDate,
  orderBy = Mercoa.InvoiceOrderByField.CreatedAt,
  orderDirection = Mercoa.OrderDirection.Desc,
  excludePayables = false,
  resultsPerPage = 5,
  paymentType,
  metadata,
  dateType = Mercoa.InvoiceDateFilter.CreatedAt,
}: UseReceivablesRequestOptions) {
  const mercoaSession = useMercoaSession()

  return useInfiniteQuery<ReceivablesResponse, string>({
    queryKey: [
      'receivables',
      mercoaSession?.entity?.id,
      currentStatuses,
      search,
      startDate,
      endDate,
      orderBy,
      orderDirection,
      resultsPerPage,
      paymentType,
      dateType,
    ],
    queryFn: async ({ pageParam = undefined }) => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entity?.id) {
        return {
          count: 0,
          invoices: [],
          nextCursor: undefined,
        }
      }

      const filter: Mercoa.entity.EntityGetInvoicesRequest = {
        status: currentStatuses,
        search,
        startDate,
        endDate,
        orderBy,
        orderDirection,
        limit: resultsPerPage,
        startingAfter: pageParam,
        excludePayables,
        metadata: metadata,
        paymentType: paymentType,
        dateType: dateType,
      }

      const response = await mercoaSession.client.entity.invoice.find(mercoaSession.entity.id, filter)

      return {
        count: response?.count ?? 0,
        invoices: response?.data || [],
        nextCursor:
          response?.data.length > 0 && response.hasMore ? response?.data[response?.data.length - 1].id : undefined,
      }
    },
    options: {
      initialPageParam: undefined,
      refetchInterval: 30000,
      getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
      getPreviousPageParam: (_, allPages) => {
        return allPages.length > 1 ? allPages[allPages.length - 2].nextCursor : undefined
      },
    },
  })
}

export const useReceivableDetailQuery = (invoiceId?: string) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.InvoiceResponse | undefined>({
    queryKey: ['receivableDetail', invoiceId],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !invoiceId) {
        throw new Error('Mercoa session or invoiceId is missing')
      }

      let response
      try {
        response = await mercoaSession.client.invoice.get(invoiceId)
      } catch (error) {
        console.error('Error fetching invoice:', error)
        throw error
      }
      return response
    },
    options: {
      enabled: !!invoiceId && !!mercoaSession?.client,
      throwOnError: true,
    },
  })
}

export const usePaymentMethods = ({ entityId, type }: { entityId?: string; type?: Mercoa.PaymentMethodType }) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Array<Mercoa.PaymentMethodResponse>>({
    queryKey: ['receivablePaymentMethods', entityId, type],
    queryFn: async () => {
      if (!mercoaSession?.client || !entityId) {
        throw new Error('Missing required parameters')
      }
      return await mercoaSession.client.entity.paymentMethod.getAll(entityId, { type })
    },
    options: {
      enabled: !!mercoaSession?.client && !!entityId,
    },
  })
}

export const usePaymentLink = (invoiceId?: Mercoa.InvoiceId) => {
  const mercoaSession = useMercoaSession()

  return useQuery<string | undefined>({
    queryKey: ['paymentLink', invoiceId],
    queryFn: async () => {
      if (!mercoaSession?.client || !invoiceId) {
        return undefined
      }
      return await mercoaSession.client.invoice.paymentLinks.getPayerLink(invoiceId)
    },
    options: {
      enabled: !!mercoaSession?.client && !!invoiceId,
    },
  })
}

export const useSupportedCurrencies = () => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.CurrencyCode[]>({
    queryKey: ['supportedCurrencies'],
    queryFn: async () => {
      if (!mercoaSession?.client || !mercoaSession.organization) {
        throw new Error('Missing required parameters')
      }

      let supportedCurrencies: Mercoa.CurrencyCode[] = []

      // Check if Mercoa payment rails are enabled
      const hasMercoaPaymentRails = mercoaSession.organization.paymentMethods?.payerPayments.some(
        (p) => p.active && (p.type === 'bankAccount' || p.type === 'card'),
      )

      if (hasMercoaPaymentRails) {
        supportedCurrencies.push('USD')
      }

      // Get custom payment method schemas and their supported currencies
      const schemas = await mercoaSession.client.customPaymentMethodSchema.getAll()
      schemas.forEach((schema) => {
        if (schema.supportedCurrencies) {
          supportedCurrencies = [...new Set([...supportedCurrencies, ...schema.supportedCurrencies])]
        }
      })

      return supportedCurrencies
    },
    options: {
      enabled: !!mercoaSession?.client && !!mercoaSession.organization,
    },
  })
}
