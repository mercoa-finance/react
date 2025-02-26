import dayjs from 'dayjs'
import Papa from 'papaparse'
import { useEffect, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { InvoiceTableColumn, useMercoaSession } from '../../../components'
import { queryClient } from '../../../lib/react-query/query-client-provider'
import {
  useApprovePayableN as useApprovePayable,
  useBulkApprovePayables,
  useBulkDeletePayables,
  useBulkSchedulePayment,
  useDeletePayable,
  useSchedulePayment,
} from '../api/mutations'
import {
  usePayableApprovalPoliciesQuery,
  usePayableMetricsByStatus,
  usePayableStatusTabsMetricsQuery,
  usePayables as usePayablesQuery,
  useRecurringPayables,
} from '../api/queries'
import { PayableAction } from '../components/payables-table/constants'
import { PayablesProps } from '../components/payables/types'
import { usePayablesFilterStore } from '../stores/payables-filter-store'

export function usePayablesInternal(payableProps: PayablesProps) {
  const { queryOptions } = payableProps
  const initialQueryOptions = queryOptions?.isInitial ? queryOptions : undefined
  const currentQueryOptions = queryOptions?.isInitial ? undefined : queryOptions
  const mercoaSession = useMercoaSession()
  const { getFilters } = usePayablesFilterStore()
  const { selectedStatusFilters, dateRange, dateType, selectedApprovers } = getFilters('payables')
  const [activeInvoiceAction, setActiveInvoiceAction] = useState<{
    invoiceId: string[] | string
    action: PayableAction
    mode: 'single' | 'multiple'
  } | null>(null)

  const memoizedStatusFilters = useMemo(() => selectedStatusFilters || [], [selectedStatusFilters])
  const memoizedApprovers = useMemo(() => selectedApprovers || [], [selectedApprovers])
  const [currentStatuses, setCurrentStatuses] = useState<Mercoa.InvoiceStatus[]>(
    initialQueryOptions?.currentStatuses || [],
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
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])

  const [selectedColumns, setSelectedColumns] = useState<InvoiceTableColumn[]>([
    { title: 'Vendor Name', field: 'vendor', orderBy: Mercoa.InvoiceOrderByField.VendorName },
    { title: 'Invoice Number', field: 'invoiceNumber', orderBy: Mercoa.InvoiceOrderByField.InvoiceNumber },
    { title: 'Due Date', field: 'dueDate', orderBy: Mercoa.InvoiceOrderByField.DueDate },
    { title: 'Invoice Date', field: 'invoiceDate', orderBy: Mercoa.InvoiceOrderByField.InvoiceDate },
    { title: 'Deduction Date', field: 'deductionDate', orderBy: Mercoa.InvoiceOrderByField.DeductionDate },
    { title: 'Amount', field: 'amount', orderBy: Mercoa.InvoiceOrderByField.Amount },
    { title: 'Status', field: 'status' },
    { title: 'Approvers', field: 'approvers' },
  ])

  const {
    data,
    isFetching,
    fetchNextPage,
    fetchPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isError,
  } = usePayablesQuery({
    currentStatuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    orderBy: currentQueryOptions?.orderBy ? currentQueryOptions.orderBy : orderBy,
    orderDirection: currentQueryOptions?.orderDirection ? currentQueryOptions.orderDirection : orderDirection,
    resultsPerPage: currentQueryOptions?.resultsPerPage ? currentQueryOptions.resultsPerPage : resultsPerPage,
    approverId: memoizedApprovers.includes('current') ? mercoaSession.user?.id : undefined,
    approverAction: memoizedApprovers.includes('current') ? Mercoa.ApproverAction.None : undefined,
    excludeReceivables: true,
  })

  const { data: recurringPayablesData, isLoading: isRecurringPayablesLoading } = useRecurringPayables({
    resultsPerPage: 100,
  })

  const { data: metricsData, isLoading: isMetricsLoading } = usePayableMetricsByStatus({
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    statuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    excludeReceivables: true,
  })

  const { data: approvalPolicies, isLoading: isApprovalPoliciesLoading } = usePayableApprovalPoliciesQuery()
  const { data: statusTabsMetrics, isLoading: isStatusTabsMetricsLoading } = usePayableStatusTabsMetricsQuery({
    search: currentQueryOptions?.search ? currentQueryOptions.search : debouncedSearch,
    statuses: currentQueryOptions?.currentStatuses ? currentQueryOptions.currentStatuses : memoizedStatusFilters,
    startDate: currentQueryOptions?.startDate ? currentQueryOptions.startDate : dateRange.startDate ?? undefined,
    endDate: currentQueryOptions?.endDate ? currentQueryOptions.endDate : dateRange.endDate ?? undefined,
    dateType: currentQueryOptions?.dateType ? currentQueryOptions.dateType : dateType,
    excludeReceivables: true,
  })

  const [isExporting, setIsExporting] = useState(false)
  const { mutate: deletePayable, isPending: isDeletePayableLoading } = useDeletePayable()
  const { mutate: bulkDeletePayables, isPending: isBulkDeletePayableLoading } = useBulkDeletePayables()

  const { mutate: approvePayable, isPending: isApprovePayableLoading } = useApprovePayable()
  const { mutate: bulkApprovePayables, isPending: isBulkApprovePayablesLoading } = useBulkApprovePayables()

  const { mutate: schedulePayment, isPending: isSchedulePaymentLoading } = useSchedulePayment()
  const { mutate: bulkSchedulePayment, isPending: isBulkSchedulePaymentLoading } = useBulkSchedulePayment()

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
    setSelectedInvoiceIds([])
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
      invoiceNumber: invoice.invoiceNumber,
      currencyCode: invoice.currency,
      vendorName: invoice.vendor?.name,
      vendorEmail: invoice.vendor?.email,
      amount: invoice.amount,
      status: invoice.status,
      invoiceId: invoice.id,
      dueDate: invoice.dueDate,
      invoiceDate: invoice.invoiceDate,
      deductionDate: invoice.deductionDate,
      paymentDestination: invoice.paymentDestination,
      invoiceType: invoice.paymentSchedule?.type === Mercoa.PaymentType.OneTime ? 'One Time' : 'Recurring',
      failureType: invoice.failureType,
      vendorId: invoice.vendorId,
      payerId: invoice.payerId,
      paymentDestinationId: invoice.paymentDestinationId,
      paymentSourceId: invoice.paymentSourceId,
      approvers: invoice.approvers,
    }))
  }, [currentPageData])

  const isAllSelected =
    allFetchedInvoices.length > 0 && allFetchedInvoices.every((invoice) => selectedInvoiceIds.includes(invoice.id))

  const handleSelectAll = () => {
    setSelectedInvoiceIds((prev) => {
      const allIds = allFetchedInvoices.map((invoice) => invoice.id)
      const areAllSelected = allIds.every((id) => prev.includes(id))

      return areAllSelected ? [] : allIds
    })
  }

  const handleSelectRow = (invoiceId: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId],
    )
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
    queryClient.invalidateQueries({ queryKey: ['payables'] })
    queryClient.invalidateQueries({ queryKey: ['recurringPayables'] })
    queryClient.invalidateQueries({ queryKey: ['payableStatusTabsMetrics'] })
    queryClient.invalidateQueries({ queryKey: ['payableMetrics'] })
    setPage(0)
  }

  const invoicePaymentTypeMapper = (invoice: Mercoa.InvoiceResponse) => {
    if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.BankAccount) {
      if (
        invoice.paymentDestinationOptions?.type === Mercoa.PaymentMethodType.BankAccount &&
        invoice.paymentDestinationOptions?.delivery === Mercoa.BankDeliveryMethod.AchStandard
      ) {
        return 'ACH_STANDARD'
      } else if (
        !invoice.paymentDestinationOptions ||
        (invoice.paymentDestinationOptions.type === Mercoa.PaymentMethodType.BankAccount &&
          invoice.paymentDestinationOptions.delivery !== Mercoa.BankDeliveryMethod.AchStandard)
      ) {
        return 'ACH_SAME_DAY'
      } else {
        return 'UNKNOWN'
      }
    } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Check) {
      return 'CHECK'
    } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Custom) {
      return 'CUSTOM'
    } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.OffPlatform) {
      return 'OFF_PLATFORM'
    } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Card) {
      return 'CARD'
    } else if (invoice.paymentDestination?.type === Mercoa.PaymentMethodType.Utility) {
      return 'UTILITY'
    } else {
      return 'UNKNOWN'
    }
  }

  const fetchAllInvoices = async () => {
    // Calculate remaining pages to fetch
    const totalPages = Math.ceil((data?.pages[0]?.count || 0) / resultsPerPage)
    const loadedPages = data?.pages?.length || 0
    const remainingPages = totalPages - loadedPages

    // Fetch remaining pages
    for (let i = 0; i < remainingPages; i++) {
      await fetchNextPage()
    }
  }

  const downloadInvoicesAsCSV = async () => {
    setIsExporting(true)
    await fetchAllInvoices()
  }

  useEffect(() => {
    if (!data?.pages) return
    if (!isExporting) return

    const exportInvoicesAsCSV = () => {
      const allInvoices = data?.pages.flatMap((page) => page.invoices) || []

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

            'Due Date': dayjs(invoice.dueDate).format('YYYY-MM-DD'),
            'Deduction Date': dayjs(invoice.deductionDate).format('YYYY-MM-DD'),
            'Processed At': dayjs(invoice.processedAt).format('YYYY-MM-DD'),
            'Created At': dayjs(invoice.createdAt).format('YYYY-MM-DD'),
            'Updated At': dayjs(invoice.updatedAt).format('YYYY-MM-DD'),
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
        `mercoa-invoice-export-${dayjs(startDate).format('YYYY-MM-DD')}-to-${dayjs(endDate).format('YYYY-MM-DD')}.csv`,
      )
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }

    const totalPages = Math.ceil((data.pages[0]?.count || 0) / resultsPerPage)
    const loadedPages = data.pages.length

    if (totalPages === loadedPages) {
      exportInvoicesAsCSV()
      setIsExporting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pages, isExporting, resultsPerPage])

  return {
    infiniteData: data,
    data: tableData,
    isFetching,
    allFetchedInvoices,
    isDataLoading: isLoading && !!mercoaSession.entityId,
    totalItems: data?.pages[0]?.count || 0,
    currentStatuses,
    setCurrentStatuses,
    search,
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    orderBy,
    setOrderBy,
    orderDirection,
    setOrderDirection,
    resultsPerPage,
    setResultsPerPage: handleResultsPerPage,
    page,
    goToNextPage,
    goToPreviousPage,
    totalEntries: data?.pages[0]?.count || 0,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
    isError,
    isNextDisabled,
    isPrevDisabled,
    selectedInvoiceIds,
    setSelectedInvoiceIds,
    isAllSelected,
    handleSelectAll,
    handleSelectRow,
    selectedColumns,
    setSelectedColumns,
    toggleSelectedColumn,
    toggleSelectedStatus,
    handleOrderByChange,
    deletePayable,
    isDeletePayableLoading,
    bulkDeletePayables,
    isBulkDeletePayableLoading,
    schedulePayment,
    isSchedulePaymentLoading,
    bulkSchedulePayment,
    isBulkSchedulePaymentLoading,
    activeInvoiceAction,
    setActiveInvoiceAction,
    approvePayable,
    isApprovePayableLoading,
    bulkApprovePayables,
    isBulkApprovePayablesLoading,
    handleRefresh,
    isRefreshLoading: isFetching,
    downloadInvoicesAsCSV,
    recurringPayablesData,
    isRecurringPayablesLoading,
    metricsData,
    isMetricsLoading,
    approvalPolicies,
    isApprovalPoliciesLoading,
    statusTabsMetrics,
    isStatusTabsMetricsLoading,
    ...payableProps,
  }
}
