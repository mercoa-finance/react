import { useEffect, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { useCounterpartiesQuery } from '../api/queries'

export const useCounterpartiesTable = (
  entityId: string,
  type: 'payor' | 'payee',
  initialRequestOptions?:
    | Mercoa.entity.counterparty.FindPayeeCounterpartiesRequest
    | Mercoa.entity.counterparty.FindPayorCounterpartiesRequest,
  currentRequestOptions?:
    | Mercoa.entity.counterparty.FindPayeeCounterpartiesRequest
    | Mercoa.entity.counterparty.FindPayorCounterpartiesRequest,
) => {
  const [page, setPage] = useState(0)
  const [resultsPerPage, setResultsPerPage] = useState(initialRequestOptions?.limit || 10)
  const [search, setSearch] = useState(initialRequestOptions?.search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useCounterpartiesQuery(entityId, type, {
    limit: currentRequestOptions?.limit ?? resultsPerPage,
    search: currentRequestOptions?.search ?? debouncedSearch,
    paymentMethods: currentRequestOptions?.paymentMethods ?? initialRequestOptions?.paymentMethods ?? true,
    invoiceMetrics: currentRequestOptions?.invoiceMetrics ?? initialRequestOptions?.invoiceMetrics ?? true,
    networkType: currentRequestOptions?.networkType ??
      initialRequestOptions?.networkType ?? [Mercoa.CounterpartyNetworkType.Entity],
  })

  const currentPageData = useMemo(() => {
    return data?.pages[page]?.counterparties || []
  }, [data?.pages, page])

  const allFetchedCounterparties = useMemo(() => {
    return data?.pages.flatMap((page) => page.counterparties) || []
  }, [data?.pages])

  const tableData = useMemo(() => {
    if (currentPageData) {
      return currentPageData.map((counterparty) => ({
        select: '',
        id: counterparty.id,
        name: counterparty.name,
        email: counterparty.email,
        type: counterparty.accountType,
        counterparty: counterparty,
      }))
    }
    return []
  }, [currentPageData])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [search])

  const goToNextPage = () => {
    if (data?.pages ? page === data?.pages.length - 1 && hasNextPage && !isFetchingNextPage : false) {
      fetchNextPage()
    }
    setPage((prev) => prev + 1)
  }

  const goToPreviousPage = () => {
    if (page > 0) {
      setPage((prev) => prev - 1)
    }
  }

  const isNextDisabled = data?.pages ? page === data?.pages.length - 1 && !hasNextPage : true
  const isPrevDisabled = page === 0

  return {
    data: tableData,
    dataLoading: isLoading,
    search,
    setSearch,
    resultsPerPage,
    setResultsPerPage,
    page,
    setPage,
    goToNextPage,
    goToPreviousPage,
    isNextDisabled,
    isPrevDisabled,
    isFetchingNextPage,
  }
}
