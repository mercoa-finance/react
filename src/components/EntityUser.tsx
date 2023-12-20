import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import dayjs from 'dayjs'
import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { currencyCodeToSymbol } from '../lib/currency'
import { LoadingSpinnerIcon, useMercoaSession } from './index'

const notificationTypeToText = {
  [Mercoa.NotificationType.InvoiceEmailed]: 'Invoice Email Received',
  [Mercoa.NotificationType.InvoiceCreated]: 'Invoice Created',
  [Mercoa.NotificationType.InvoicePaid]: 'Invoice Paid',
  [Mercoa.NotificationType.InvoiceScheduled]: 'Invoice Scheduled',
  [Mercoa.NotificationType.InvoiceApprovalNeeded]: 'Invoice Approval Needed',
  [Mercoa.NotificationType.InvoiceApproved]: 'Invoice Approved',
  [Mercoa.NotificationType.InvoiceCanceled]: 'Invoice Canceled',
  [Mercoa.NotificationType.InvoiceRejected]: 'Invoice Rejected',
  [Mercoa.NotificationType.InvoicePending]: 'Invoice Payment Initiated',
  [Mercoa.NotificationType.InvoiceFailed]: 'Invoice Payment Failed',
}

export function EntityUserNotificationTable({
  entityId,
  userId,
  onClick,
}: {
  entityId: Mercoa.EntityId
  userId: Mercoa.EntityUserId
  onClick?: ({
    entityId,
    userId,
  }: {
    entityId: Mercoa.EntityId
    userId: Mercoa.EntityUserId
    invoiceId?: Mercoa.InvoiceId
  }) => void
}) {
  const mercoaSession = useMercoaSession()

  const [notifications, setNotifications] = useState<Mercoa.NotificationResponse[]>()
  const [invoices, setInvoices] = useState<Mercoa.InvoiceResponse[]>()
  const [startingAfter, setStartingAfter] = useState<string[]>([])
  const [resultsPerPage, setResultsPerPageLocal] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [count, setCount] = useState<number>(0)

  function setResultsPerPage(value: number) {
    setResultsPerPageLocal(value)
    setPage(1)
    setStartingAfter([])
  }

  function nextPage() {
    if (!notifications) return
    setPage(page + 1)
    setStartingAfter([...startingAfter, notifications[notifications.length - 1].id])
  }

  function prevPage() {
    setPage(Math.max(1, page - 1))
    setStartingAfter(startingAfter.slice(0, startingAfter.length - 1))
  }

  const { watch, register, handleSubmit } = useForm({
    defaultValues: {},
  })

  useEffect(() => {
    mercoaSession.client?.entity.user.notifications
      .find(entityId, userId, {
        limit: resultsPerPage,
        startingAfter: startingAfter[startingAfter.length - 1],
      })
      .then((e) => {
        if (e) {
          setHasMore(e.hasMore)
          setCount(e.count)
          setNotifications(e.data)
        }
      })
  }, [mercoaSession.client, startingAfter, resultsPerPage])

  useEffect(() => {
    mercoaSession.client?.entity.invoice
      .find(entityId, {
        invoiceId: notifications?.filter((e) => e.invoiceId).map((e) => `${e.invoiceId}`) ?? [],
        limit: resultsPerPage,
      })
      .then((e) => {
        if (e) {
          setInvoices(e.data)
        }
      })
  }, [mercoaSession.client, entityId, notifications])

  return (
    <div>
      <div className="flex flex-col">
        <form
          className="grid items-center grid-cols-3 mb-3"
          onSubmit={handleSubmit((e) => {
            console.log(e)
          })}
        >
          <div className="hidden md:block md:col-span-2" />
          <div className="mt-2 flex w-full rounded-md shadow-sm mr-2 col-span-3 md:col-span-1"></div>
        </form>
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Action
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Vendor
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Invoice ID
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {!notifications && (
                    <tr>
                      <td colSpan={5} className="p-9 text-center">
                        <LoadingSpinnerIcon />
                      </td>
                    </tr>
                  )}
                  {notifications &&
                    notifications.map((notification, index) => (
                      <tr
                        onClick={() => onClick?.({ entityId, userId, invoiceId: notification.invoiceId })}
                        key={notification.id}
                        className={`hover:bg-gray-100 ${index % 2 === 0 ? undefined : 'bg-gray-50'}`}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {notificationTypeToText[notification.type]}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {' '}
                          {dayjs(notification.createdAt).format('MM/DD/YY')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {invoices?.find((e) => notification.invoiceId === e.id)?.vendor?.name ?? ''}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {accounting.formatMoney(
                            invoices?.find((e) => notification.invoiceId === e.id)?.amount ?? '',
                            currencyCodeToSymbol(invoices?.find((e) => notification.invoiceId === e.id)?.currency),
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{notification.invoiceId}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <nav
        className="flex items-center justify-between border-t border-gray-200 bg-white px-2 py-3 sm:px-3"
        aria-label="Pagination"
      >
        <div>
          <Listbox value={resultsPerPage} onChange={setResultsPerPage}>
            {({ open }) => (
              <div className="flex items-center mb-2">
                <Listbox.Label className="block text-xs text-gray-900">Results per Page</Listbox.Label>
                <div className="relative mx-2">
                  <Listbox.Button className="relative w-24 cursor-default rounded-md bg-white py-1 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6">
                    <span className="block truncate">{resultsPerPage}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {[10, 20, 50, 100].map((num) => (
                        <Listbox.Option
                          key={num}
                          className={({ active }) =>
                            `${
                              active ? 'bg-primary text-white' : 'text-gray-900'
                            } relative cursor-default select-none py-2 pl-3 pr-9`
                          }
                          value={num}
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`${selected ? 'font-semibold' : 'font-normal'} block truncate`}>
                                {num}
                              </span>

                              {selected ? (
                                <span
                                  className={`${
                                    active ? 'text-white' : 'text-primary-text'
                                  } absolute inset-y-0 right-0 flex items-center pr-4`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </div>
            )}
          </Listbox>
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * resultsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * resultsPerPage, count)}</span> of{' '}
              <span className="font-medium">{count}</span> results
            </p>
          </div>
        </div>
        <div className="flex flex-1 justify-between sm:justify-end">
          <button
            disabled={page === 1}
            type="button"
            onClick={prevPage}
            className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            disabled={!hasMore}
            type="button"
            onClick={nextPage}
            className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </nav>
    </div>
  )
}
