import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../components'
import { useInfiniteQuery } from '../../../lib/react-query/use-infinite-query'

export interface CounterpartiesResponse {
  count: number
  counterparties: Mercoa.CounterpartyResponse[]
  nextCursor?: string
}

export function useCounterpartiesQuery(
  entityId: string,
  type: 'payor' | 'payee',
  requestOptions?:
    | Mercoa.entity.counterparty.FindPayeeCounterpartiesRequest
    | Mercoa.entity.counterparty.FindPayorCounterpartiesRequest,
) {
  const mercoaSession = useMercoaSession()

  return useInfiniteQuery<CounterpartiesResponse, string>({
    queryKey: ['counterparties', entityId, requestOptions],
    queryFn: async ({ pageParam = undefined }) => {
      if (!mercoaSession || !mercoaSession.client) {
        return {
          count: 0,
          counterparties: [],
          nextCursor: undefined,
        }
      }

      const response = await (type === 'payee'
        ? mercoaSession.client.entity.counterparty.findPayees(entityId, {
            ...requestOptions,
            startingAfter: pageParam,
          })
        : mercoaSession.client.entity.counterparty.findPayors(entityId, {
            ...requestOptions,
            startingAfter: pageParam,
          }))

      return {
        count: response?.count ?? 0,
        counterparties: response?.data || [],
        nextCursor:
          response?.data.length > 0 && response.hasMore ? response?.data[response?.data.length - 1].id : undefined,
      }
    },
    options: {
      enabled: !!entityId,
      initialPageParam: undefined,
      refetchInterval: !mercoaSession || !mercoaSession.client || !mercoaSession.entity?.id ? 4000 : undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
      getPreviousPageParam: (_, allPages) => {
        return allPages.length > 1 ? allPages[allPages.length - 2].nextCursor : undefined
      },
    },
  })
}
