import { useMemo } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { useInfiniteQuery } from '../../../lib/react-query/use-infinite-query'
import { useQuery } from '../../../lib/react-query/use-query'
import { getInvoiceClient } from '../../common/utils'

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

export function useReceivablesQuery({
  currentStatuses,
  search,
  startDate,
  endDate,
  orderBy = Mercoa.InvoiceOrderByField.CreatedAt,
  orderDirection = Mercoa.OrderDirection.Desc,
  excludePayables = true,
  resultsPerPage = 5,
  paymentType,
  metadata,
  dateType = Mercoa.InvoiceDateFilter.CreatedAt,
}: UseReceivablesRequestOptions) {
  const mercoaSession = useMercoaSession()

  return useInfiniteQuery<ReceivablesResponse, string>({
    queryKey: [
      'receivables',
      mercoaSession?.entityId,
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
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entityId) {
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

      const response = await mercoaSession.client.entity.invoice.find(mercoaSession.entityId, filter)

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

export function useRecurringReceivablesQuery({
  currentStatuses,
  search,
  startDate,
  endDate,
  orderBy = Mercoa.InvoiceOrderByField.CreatedAt,
  orderDirection = Mercoa.OrderDirection.Desc,
  resultsPerPage,
  paymentType,
  metadata,
  dateType = Mercoa.InvoiceDateFilter.CreatedAt,
}: UseReceivablesRequestOptions) {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.InvoiceTemplateResponse[] | undefined>({
    queryKey: [
      'recurringReceivables',
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
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entity?.id) {
        return undefined
      }

      // TODO: Replace with the entity-level invoice template endpoint once it exists to use excludePayables
      // Entity > Invoice > Get All and Get Metrics currently exist
      // Entity > Invoice Template > Get All and Get Metrics should be added
      const filter: Mercoa.invoiceTemplate.GetAllInvoiceTemplatesRequest = {
        vendorId: mercoaSession.entity.id, // Functionally the same as entityId + excludePayables
        status: currentStatuses,
        search,
        startDate,
        endDate,
        orderBy,
        orderDirection,
        limit: resultsPerPage,
        metadata: metadata,
        paymentType: paymentType,
        dateType: dateType,
      }

      const response = await mercoaSession.client.invoiceTemplate.find(filter)

      return response.data
    },
    options: {
      enabled: !!mercoaSession?.client && !!mercoaSession?.entity?.id,
    },
  })
}

export const useReceivableMetricsByStatusQuery = ({
  startDate,
  endDate,
  dateType,
  search,
  statuses,
  returnByDate,
  excludePayables = true,
}: {
  startDate?: Date
  endDate?: Date
  dateType?: Mercoa.InvoiceDateFilter
  search?: string
  statuses?: Mercoa.InvoiceStatus[]
  returnByDate?: Mercoa.InvoiceMetricsPerDateGroupBy | undefined
  excludePayables?: boolean
}) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.InvoiceMetricsResponse[] | undefined>({
    queryKey: [
      'receivableMetrics',
      search,
      statuses,
      returnByDate,
      excludePayables,
      mercoaSession?.entityId,
      startDate,
      endDate,
      dateType,
    ],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entityId) {
        return undefined
      }

      const response = await mercoaSession.client.entity.invoice.metrics(mercoaSession.entityId, {
        search,
        status: statuses,
        startDate,
        endDate,
        dateType,
        returnByDate,
        excludePayables,
        groupBy: ['STATUS'],
      })

      return response
    },
    options: {
      enabled: !!mercoaSession?.client && !!mercoaSession?.entityId,
    },
  })
}

export const useReceivableStatusTabsMetricsQuery = ({
  search,
  statuses,
  startDate,
  endDate,
  dateType,
  excludePayables = true,
}: {
  search?: string
  statuses: Mercoa.InvoiceStatus[]
  startDate?: Date
  endDate?: Date
  dateType?: Mercoa.InvoiceDateFilter
  excludePayables?: boolean
}) => {
  const mercoaSession = useMercoaSession()
  const { userPermissionConfig } = mercoaSession

  const statusesByUser = useMemo(() => {
    return [
      Mercoa.InvoiceStatus.Draft,
      Mercoa.InvoiceStatus.New,
      Mercoa.InvoiceStatus.Approved,
      Mercoa.InvoiceStatus.Scheduled,
      Mercoa.InvoiceStatus.Pending,
      Mercoa.InvoiceStatus.Paid,
      Mercoa.InvoiceStatus.Canceled,
      Mercoa.InvoiceStatus.Refused,
      Mercoa.InvoiceStatus.Failed,
    ].filter((status) =>
      userPermissionConfig
        ? userPermissionConfig?.invoice.view.statuses.includes(status) ||
          userPermissionConfig?.invoice.view.all ||
          userPermissionConfig?.invoice.all
        : true,
    )
  }, [userPermissionConfig])

  return useQuery<{ [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse } | undefined>({
    queryKey: [
      'receivableStatusTabsMetrics',
      search,
      statusesByUser,
      excludePayables,
      mercoaSession?.entityId,
      startDate,
      endDate,
      dateType,
    ],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !mercoaSession.entityId) {
        return undefined
      }

      const metrics = await mercoaSession.client.entity.invoice.metrics(mercoaSession.entityId, {
        search,
        status: statusesByUser,
        startDate,
        endDate,
        dateType,
        excludePayables,
        groupBy: ['STATUS'],
      })

      const results = statusesByUser.map((status) => {
        const metric: Mercoa.InvoiceMetricsResponse = {
          totalAmount: 0,
          totalCount: 0,
          averageAmount: 0,
          currency: 'USD',
        }
        metrics.forEach((e) => {
          if (e.group?.some((e) => e.status === status)) {
            metric.totalAmount += Number(e.totalAmount)
            metric.totalCount += Number(e.totalCount)
          }
        })
        return [status, metric]
      })

      return Object.fromEntries(results) as { [key in Mercoa.InvoiceStatus]: Mercoa.InvoiceMetricsResponse }
    },
    options: {
      enabled: !!mercoaSession?.client && !!mercoaSession?.entityId,
    },
  })
}

export const useReceivableDetailQuery = (
  invoiceId?: string,
  invoiceType: 'invoice' | 'invoiceTemplate' = 'invoice',
) => {
  const mercoaSession = useMercoaSession()

  return useQuery<Mercoa.InvoiceResponse | undefined>({
    queryKey: ['receivableDetail', invoiceId, invoiceType],
    queryFn: async () => {
      if (!mercoaSession || !mercoaSession.client || !invoiceId) {
        throw new Error('MercoaSession or invoiceId is missing')
      }

      let response: Mercoa.InvoiceResponse | Mercoa.InvoiceTemplateResponse | undefined = undefined
      try {
        response = await getInvoiceClient(mercoaSession, invoiceType)?.get(invoiceId)
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

export const usePaymentMethodsQuery = ({ entityId, type }: { entityId?: string; type?: Mercoa.PaymentMethodType }) => {
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

// NOTE: Confirm that we should not return a payment link for invoice templates
export const usePaymentLinkQuery = (
  invoiceId?: Mercoa.InvoiceId,
  invoiceType: 'invoice' | 'invoiceTemplate' = 'invoice',
) => {
  const mercoaSession = useMercoaSession()

  return useQuery<string | undefined>({
    queryKey: ['paymentLink', invoiceId],
    queryFn: async () => {
      if (!mercoaSession?.client || !invoiceId || invoiceType === 'invoiceTemplate') {
        return undefined
      }
      return await mercoaSession.client.invoice.paymentLinks.getPayerLink(invoiceId)
    },
    options: {
      enabled: !!mercoaSession?.client && !!invoiceId,
    },
  })
}

export const useSupportedCurrenciesQuery = () => {
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
