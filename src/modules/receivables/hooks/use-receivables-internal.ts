import dayjs from 'dayjs'
import Papa from 'papaparse'
import { useEffect, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { InvoiceTableColumn, useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import { invoicePaymentTypeMapper } from '../../common/invoice-payment-type'
import {
  useArchiveReceivable,
  useBulkArchiveReceivables,
  useBulkCancelReceivables,
  useBulkDeleteReceivables,
  useBulkRestoreAsDraftReceivable,
  useCancelReceivable,
  useDeleteReceivable,
  useRestoreAsDraftReceivable,
} from '../api/mutations'
import {
  useReceivableMetricsByStatusQuery,
  useReceivablesQuery,
  useReceivableStatusTabsMetricsQuery,
  useRecurringReceivablesQuery,
} from '../api/queries'
import { ReceivablesTableAction } from '../components/receivables-table/constants'
import { useReceivablesFilterStore } from '../stores/receivables-filter-store'
import { ReceivablesContextValue, ReceivablesProps } from '../types'

export function useReceivablesInternal(receivableProps: ReceivablesProps) {
  const mercoaSession = useMercoaSession()
  const { queryOptions } = receivableProps
  const initialQueryOptions = queryOptions?.isInitial ? queryOptions : undefined
  const currentQueryOptions = queryOptions?.isInitial ? undefined : queryOptions
  const { getFilters, setFilters } = useReceivablesFilterStore()
  const { selectedStatusFilters, dateRange, dateType } = getFilters('receivables')
  const [activeInvoiceAction, setActiveInvoiceAction] = useState<{
    invoiceId: string[] | string
    action: ReceivablesTableAction
    mode: 'single' | 'multiple'
  } | null>(null)

  const memoizedStatusFilters = useMemo(() => selectedStatusFilters || [], [selectedStatusFilters])
  const [currentStatuses, setCurrentStatuses] = useState<Mercoa.InvoiceStatus[]>(
    initialQueryOptions?.currentStatuses || [Mercoa.InvoiceStatus.Draft],
  )
  const [search, setSearch] = useState(initialQueryOptions?.search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [startDate, setStartDate] = useState(initialQueryOptions?.startDate)
  const [endDate, setEndDate] = useState(initialQueryOptions?.endDate)
  const [orderBy, setOrderBy] = useState(initialQueryOptions?.orderBy || Mercoa.InvoiceOrderByField.CreatedAt)
  const [orderDirection, setOrderDirection] = useState(
    initialQueryOptions?.orderDirection || Mercoa.OrderDirection.Desc,
  )
  const [resultsPerPage, setResultsPerPage] = useState(initialQueryOptions?.resultsPerPage || 10)
  const [page, setPage] = useState(0)
  const [selectedInvoices, setSelectedInvoices] = useState<Mercoa.InvoiceResponse[]>([])

  const [selectedColumns, setSelectedColumns] = useState<InvoiceTableColumn[]>([
    { title: 'Payer Name', field: 'payer', orderBy: Mercoa.InvoiceOrderByField.PayerName },
    { title: 'Invoice Number', field: 'invoiceNumber', orderBy: Mercoa.InvoiceOrderByField.InvoiceNumber },
    { title: 'Due Date', field: 'dueDate', orderBy: Mercoa.InvoiceOrderByField.DueDate },
    { title: 'Invoice Date', field: 'invoiceDate', orderBy: Mercoa.InvoiceOrderByField.InvoiceDate },
    { title: 'Amount', field: 'amount', orderBy: Mercoa.InvoiceOrderByField.Amount },
    { title: 'Status', field: 'status' },
  ])

  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isError,
  } = useReceivablesQuery({
    currentStatuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    orderBy: currentQueryOptions?.orderBy ? currentQueryOptions.orderBy : orderBy,
    orderDirection: currentQueryOptions?.orderDirection ? currentQueryOptions.orderDirection : orderDirection,
    resultsPerPage: currentQueryOptions?.resultsPerPage ? currentQueryOptions.resultsPerPage : resultsPerPage,
  })

  const { data: recurringReceivablesData, isLoading: isRecurringReceivablesLoading } = useRecurringReceivablesQuery({
    resultsPerPage: 100,
  })

  const { data: metricsData, isLoading: isMetricsLoading } = useReceivableMetricsByStatusQuery({
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    statuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    returnByDate: Mercoa.InvoiceMetricsPerDateGroupBy.CreationDate,
    excludePayables: true,
  })

  const { data: statusTabsMetrics, isLoading: isStatusTabsMetricsLoading } = useReceivableStatusTabsMetricsQuery({
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    statuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    excludePayables: true,
  })

  const { mutate: deleteReceivable, isPending: isDeleteReceivableLoading } = useDeleteReceivable()
  const { mutate: bulkDeleteReceivables, isPending: isBulkDeleteReceivableLoading } = useBulkDeleteReceivables()
  const { mutate: restoreAsDraft, isPending: isRestoreAsDraftReceivableLoading } = useRestoreAsDraftReceivable()
  const { mutate: bulkRestoreAsDraft, isPending: isBulkRestoreAsDraftReceivableLoading } =
    useBulkRestoreAsDraftReceivable()
  const { mutate: archiveReceivable, isPending: isArchiveReceivableLoading } = useArchiveReceivable()
  const { mutate: bulkArchiveReceivables, isPending: isBulkArchiveReceivablesLoading } = useBulkArchiveReceivables()
  const { mutate: cancelReceivable, isPending: isCancelReceivableLoading } = useCancelReceivable()
  const { mutate: bulkCancelReceivables, isPending: isBulkCancelReceivablesLoading } = useBulkCancelReceivables()

  const currentPageData = useMemo(() => {
    return data?.pages[page]?.invoices || []
  }, [data?.pages, page])

  const allFetchedInvoices = useMemo(() => {
    return data?.pages.flatMap((page) => page.invoices) || []
  }, [data?.pages])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [search])

  useEffect(() => {
    setSelectedInvoices([])
    setPage(0)
  }, [
    currentQueryOptions?.currentStatuses,
    currentQueryOptions?.search,
    currentQueryOptions?.startDate,
    currentQueryOptions?.endDate,
    currentQueryOptions?.dateType,
    currentQueryOptions?.orderBy,
    currentQueryOptions?.orderDirection,
    currentQueryOptions?.resultsPerPage,
    debouncedSearch,
    dateRange.startDate,
    dateRange.endDate,
    dateType,
    orderBy,
    orderDirection,
    resultsPerPage,
    memoizedStatusFilters,
  ])

  const handleOrderByChange = (field: Mercoa.InvoiceOrderByField) => {
    if (orderBy === field) {
      setOrderDirection((prevDirection) =>
        prevDirection === Mercoa.OrderDirection.Asc ? Mercoa.OrderDirection.Desc : Mercoa.OrderDirection.Asc,
      )
    } else {
      setOrderBy(field)
      setOrderDirection(Mercoa.OrderDirection.Asc)
    }
  }

  const tableData = useMemo(() => {
    if (!currentPageData) {
      return []
    }
    return currentPageData.map((invoice) => ({
      select: '',
      id: invoice.id,
      invoice: invoice,
      payer: invoice.payer?.name,
      invoiceNumber: invoice.invoiceNumber,
      currencyCode: invoice.currency,
      payerName: invoice.payer?.name,
      payerEmail: invoice.payer?.email,
      amount: invoice.amount,
      status: invoice.status,
      invoiceId: invoice.id,
      dueDate: invoice.dueDate,
      invoiceDate: invoice.invoiceDate,
      paymentDestination: invoice.paymentDestination,
      invoiceType: (invoice.paymentSchedule?.type === Mercoa.PaymentType.OneTime ? 'invoice' : 'invoiceTemplate') as
        | 'invoice'
        | 'invoiceTemplate',
      failureType: invoice.failureType,
      vendorId: invoice.vendorId,
      payerId: invoice.payerId,
      paymentDestinationId: invoice.paymentDestinationId,
      paymentSourceId: invoice.paymentSourceId,
    }))
  }, [currentPageData])

  const isAllSelected =
    allFetchedInvoices.length > 0 &&
    allFetchedInvoices.every((invoice) => selectedInvoices.map((e) => e.id).includes(invoice.id))

  const handleSelectAll = () => {
    setSelectedInvoices((prev) => {
      const existingIds = prev.map((e) => e.id)
      const areAllSelected = allFetchedInvoices.every((fetchedInvoice) => existingIds.includes(fetchedInvoice.id))

      return areAllSelected ? [] : allFetchedInvoices
    })
  }

  const handleSelectRow = (invoice: Mercoa.InvoiceResponse) => {
    setSelectedInvoices((prev) => {
      console.log('invoice', invoice)
      console.log('prev', prev)
      if (prev.some((e) => e.id === invoice.id)) {
        return prev.filter((e) => e.id !== invoice.id)
      }
      return [...prev, invoice]
    })
  }

  const goToNextPage = () => {
    if (isFetchingNextPage) {
      return
    }
    if (data?.pages && page === data.pages.length - 1 && hasNextPage) {
      fetchNextPage()
    }
    setPage((prev) => prev + 1)
  }

  const goToPreviousPage = () => {
    if (page > 0) {
      setPage((prev) => prev - 1)
    }
  }

  const isNextDisabled = isFetchingNextPage || !data?.pages || (page === data.pages.length - 1 && !hasNextPage)
  const isPrevDisabled = page === 0

  const toggleSelectedColumn = (field: any) => {
    setSelectedColumns((prevColumns) =>
      prevColumns.some((column) => column.field === field)
        ? prevColumns.filter((column) => column.field !== field)
        : [...prevColumns, { field, title: '' }],
    )
  }

  const toggleSelectedStatus = (status: Mercoa.InvoiceStatus) => {
    setCurrentStatuses((prevStatuses) =>
      prevStatuses.includes(status) ? prevStatuses.filter((s) => s !== status) : [...prevStatuses, status],
    )
  }

  const handleResultsPerPage = (rpp: number) => {
    setResultsPerPage(rpp)
    setPage(0)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['receivables'] })
    queryClient.invalidateQueries({ queryKey: ['recurringReceivables'] })
    queryClient.invalidateQueries({ queryKey: ['receivableMetrics'] })
    queryClient.invalidateQueries({ queryKey: ['receivableStatusTabsMetrics'] })
    setPage(0)
  }

  const downloadInvoicesAsCSV = async () => {
    let allInvoicePages = data?.pages ?? []
    while (allInvoicePages[allInvoicePages.length - 1].nextCursor) {
      const resp = await fetchNextPage()
      allInvoicePages = resp.data?.pages ?? []
    }
    const allInvoices = allInvoicePages.flatMap((page) => page.invoices)
    const csv = Papa.unparse(
      allInvoices.map((invoice) => {
        return {
          'Invoice ID': invoice.id,
          'Invoice Number': invoice.invoiceNumber,
          Status: invoice.status,
          Amount: invoice.amount,
          Currency: invoice.currency,
          Note: invoice.noteToSelf,
          'Payer ID': invoice.payer?.id,
          'Payer Foreign ID': invoice.payer?.foreignId,
          'Payer Email': invoice.payer?.email,
          'Payer Name': invoice.payer?.name,
          'Vendor ID': invoice.vendor?.id,
          'Vendor Foreign ID': invoice.vendor?.foreignId,
          'Vendor Email': invoice.vendor?.email,
          'Vendor Name': invoice.vendor?.name,
          'Payment Type': invoicePaymentTypeMapper(invoice),
          Metadata: JSON.stringify(invoice.metadata),
          'Due Date': invoice.dueDate ? dayjs(invoice.dueDate).format('YYYY-MM-DD') : undefined,
          'Deduction Date': invoice.deductionDate ? dayjs(invoice.deductionDate).format('YYYY-MM-DD') : undefined,
          'Processed At': invoice.processedAt ? dayjs(invoice.processedAt).format('YYYY-MM-DD') : undefined,
          'Created At': invoice.createdAt ? dayjs(invoice.createdAt).format('YYYY-MM-DD') : undefined,
          'Updated At': invoice.updatedAt ? dayjs(invoice.updatedAt).format('YYYY-MM-DD') : undefined,
        }
      }),
    )
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('mercoa-hidden', '')
    a.setAttribute('href', url)
    a.setAttribute(
      'download',
      `receivable-invoice-export-${dayjs(startDate).format('YYYY-MM-DD')}-to-${dayjs(endDate).format(
        'YYYY-MM-DD',
      )}.csv`,
    )
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  useEffect(() => {
    setFilters('receivables', {
      selectedStatusFilters: currentStatuses,
    })
  }, [currentStatuses])

  const out: ReceivablesContextValue = {
    propsContextValue: {
      ...receivableProps,
    },

    dataContextValue: {
      tableData,
      infiniteData: data,
      allFetchedInvoices,
      isDataLoading: isLoading && !!mercoaSession.entityId,
      isFetching,
      isFetchingNextPage,
      isFetchingPreviousPage,
      isLoading,
      isError,
      isRefreshLoading: isFetching,
      handleRefresh,
      recurringReceivablesData,
      isRecurringReceivablesLoading,
      metricsData,
      isMetricsLoading,
      statusTabsMetrics,
      isStatusTabsMetricsLoading,
    },

    filtersContextValue: {
      search,
      setSearch,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      currentStatuses,
      setCurrentStatuses,
      toggleSelectedStatus,
    },

    sortingContextValue: {
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      handleOrderByChange,
    },

    paginationContextValue: {
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      resultsPerPage,
      setResultsPerPage: handleResultsPerPage,
      page,
      totalEntries: data?.pages[0]?.count || 0,
      goToNextPage,
      goToPreviousPage,
      isNextDisabled,
      isPrevDisabled,
      handleOrderByChange,
    },

    selectionContextValue: {
      selectedInvoices,
      setSelectedInvoices,
      isAllSelected,
      handleSelectAll,
      handleSelectRow,
      selectedColumns,
      setSelectedColumns,
      toggleSelectedColumn,
    },

    actionsContextValue: {
      deleteReceivable,
      isDeleteReceivableLoading,
      bulkDeleteReceivables,
      isBulkDeleteReceivableLoading,
      activeInvoiceAction,
      setActiveInvoiceAction,
      downloadInvoicesAsCSV,
      restoreAsDraft,
      isBulkRestoreAsDraftReceivableLoading,
      bulkRestoreAsDraft,
      isRestoreAsDraftReceivableLoading,
      archiveReceivable,
      isArchiveReceivableLoading,
      bulkArchiveReceivables,
      isBulkArchiveReceivablesLoading,
      cancelReceivable,
      isCancelReceivableLoading,
      bulkCancelReceivables,
      isBulkCancelReceivablesLoading,
    },
  }

  return out
}
