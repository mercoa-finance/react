import { Dialog, Transition } from '@headlessui/react'
import { EnvelopeIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import accounting from 'accounting'
import dayjs from 'dayjs'
import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { currencyCodeToSymbol } from '../lib/currency'
import { LoadingSpinnerIcon, MercoaButton, MercoaCombobox, TableNavigation, Tooltip, useMercoaSession } from './index'

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
  const [resultsPerPage, setResultsPerPage] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [count, setCount] = useState<number>(0)

  const { handleSubmit } = useForm({
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
      <div className="mercoa-flex mercoa-flex-col">
        <form
          className="mercoa-grid mercoa-items-center mercoa-grid-cols-3 mercoa-mb-3"
          onSubmit={handleSubmit((e) => {
            console.log(e)
          })}
        >
          <div className="mercoa-hidden md:mercoa-block md:mercoa-col-span-2" />
          <div className="mercoa-mt-2 mercoa-flex mercoa-w-full mercoa-rounded-md mercoa-shadow-sm mercoa-mr-2 mercoa-col-span-3 md:mercoa-col-span-1"></div>
        </form>
        <div className="-mercoa-my-2 -mercoa-mx-4 mercoa-overflow-x-auto sm:-mercoa-mx-6 lg:-mercoa-mx-8">
          <div className="mercoa-inline-block mercoa-min-w-full mercoa-py-2 mercoa-align-middle md:mercoa-px-6 lg:mercoa-px-8">
            <div className="mercoa-overflow-hidden mercoa-shadow mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 md:mercoa-rounded-lg">
              <table className="mercoa-min-w-full mercoa-divide-y mercoa-divide-gray-300">
                <thead className="mercoa-bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="mercoa-py-3.5 mercoa-pl-4 mercoa-pr-3 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 sm:mercoa-pl-6"
                    >
                      Action
                    </th>
                    <th
                      scope="col"
                      className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
                    >
                      Vendor
                    </th>
                    <th
                      scope="col"
                      className="mercoa-px-3 mercoa-py-3.5 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="mercoa-py-3.5 mercoa-pl-4 mercoa-pr-3 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 sm:mercoa-pl-6"
                    >
                      Invoice ID
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="mercoa-bg-white">
                  {!notifications && (
                    <tr>
                      <td colSpan={5} className="mercoa-p-9 mercoa-text-center">
                        <LoadingSpinnerIcon />
                      </td>
                    </tr>
                  )}
                  {notifications &&
                    notifications.map((notification, index) => (
                      <tr
                        onClick={() => onClick?.({ entityId, userId, invoiceId: notification.invoiceId })}
                        key={notification.id}
                        className={`hover:mercoa-bg-gray-100 ${index % 2 === 0 ? undefined : 'mercoa-bg-gray-50'}`}
                      >
                        <td className="mercoa-whitespace-nowrap mercoa-py-4 mercoa-pl-4 mercoa-pr-3 mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 sm:mercoa-pl-6">
                          {notificationTypeToText[notification.type]}
                        </td>
                        <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900">
                          {' '}
                          {dayjs(notification.createdAt).format('MM/DD/YY')}
                        </td>
                        <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900">
                          {invoices?.find((e) => notification.invoiceId === e.id)?.vendor?.name ?? ''}
                        </td>
                        <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900">
                          {accounting.formatMoney(
                            invoices?.find((e) => notification.invoiceId === e.id)?.amount ?? '',
                            currencyCodeToSymbol(invoices?.find((e) => notification.invoiceId === e.id)?.currency),
                          )}
                        </td>
                        <td className="mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900">
                          {notification.invoiceId}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {notifications && (
        <TableNavigation
          data={notifications}
          page={page}
          setPage={setPage}
          hasMore={hasMore}
          startingAfter={startingAfter}
          setStartingAfter={setStartingAfter}
          count={count}
          resultsPerPage={resultsPerPage}
          setResultsPerPage={setResultsPerPage}
        />
      )}
    </div>
  )
}

export function EntityUsersTable({
  openNotificationPreferences,
}: {
  openNotificationPreferences?: ({
    entityId,
    userId,
  }: {
    entityId: Mercoa.EntityId
    userId: Mercoa.EntityUserId
  }) => void
}) {
  const [users, setUsers] = useState<Mercoa.EntityUserResponse[]>()
  const [userNotificationPreferences, setUserNotificationPreferences] = useState<{
    [key: Mercoa.EntityUserId]: Mercoa.UserNotificationPolicyResponse[]
  }>({})
  const [roles, setRoles] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<Mercoa.EntityUserResponse>()
  const mercoaSession = useMercoaSession()

  useEffect(() => {
    if (!mercoaSession.token || !mercoaSession.entity?.id) return
    mercoaSession.client?.entity.user.getAll(mercoaSession.entity.id).then((resp) => {
      if (resp) {
        setUsers(resp)
        const roles = new Set<string>()
        resp.forEach((user) => {
          user.roles.forEach((role) => {
            roles.add(role)
          })
        })
        setRoles(Array.from(roles))
      }
    })
  }, [mercoaSession.entity?.id, mercoaSession.refreshId, mercoaSession.token])

  function EditUser({ user }: { user: Mercoa.EntityUserResponse }) {
    const { register, handleSubmit, setValue, watch } = useForm({
      defaultValues: {
        id: user?.id,
        roles: user?.roles.join(', '),
        email: user?.email,
        name: user?.name,
        foreignId: user?.foreignId,
      },
    })

    return (
      <form
        onSubmit={handleSubmit(async (data) => {
          if (!mercoaSession.entity?.id) return
          const update: Mercoa.EntityUserRequest = {
            roles: [
              ...new Set(
                data?.roles
                  ?.trim()
                  ?.split(',')
                  .filter((e) => e)
                  .map((e: string) => e.trim()),
              ),
            ],
            email: data.email,
            name: data.name,
            foreignId: data.foreignId,
          }
          if (user?.id && user?.id != 'new') {
            await mercoaSession.client?.entity.user.update(mercoaSession.entity.id, user.id, update)
          } else {
            await mercoaSession.client?.entity.user.create(mercoaSession.entity.id, update)
          }
          setSelectedUser(undefined)
          toast('User Saved!', { type: 'success' })
          mercoaSession.refresh()
        })}
      >
        <div className="mercoa-mt-2 mercoa-w-96">
          <label htmlFor="email" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700">
            Email
          </label>
          <div className="mercoa-mt-1">
            <input
              {...register(`email`, { required: true })}
              type="text"
              placeholder="person@yourcustomer.com"
              className="mercoa-w-full mercoa-border mercoa-border-gray-300 mercoa-rounded-md mercoa-shadow-sm focus:mercoa-ring-indigo-500 focus:mercoa-border-indigo-500 sm:mercoa-text-sm"
            />
          </div>
        </div>
        <div className="mercoa-mt-2">
          <label htmlFor="name" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700">
            Name
          </label>
          <div className="mercoa-mt-1">
            <input
              {...register(`name`, { required: true })}
              type="text"
              placeholder="Your User's Full Name"
              className="mercoa-w-full mercoa-border mercoa-border-gray-300 mercoa-rounded-md mercoa-shadow-sm focus:mercoa-ring-indigo-500 focus:mercoa-border-indigo-500 sm:mercoa-text-sm"
            />
          </div>
        </div>
        <div className="mercoa-mt-2">
          <label htmlFor="roles" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700">
            Roles
          </label>
          <div className="mercoa-mt-1 mercoa-flex mercoa-items-center mercoa-gap-x-1">
            <div className="mercoa-flex-grow">
              <MercoaCombobox
                options={roles.map((e) => ({
                  disabled: false,
                  value: e,
                }))}
                onChange={(e: string[]) => {
                  if (e.length == 0) return
                  setValue('roles', e.filter((e) => e).join(','), {
                    shouldDirty: true,
                  })
                }}
                value={watch('roles').split(',')}
                multiple
              />
            </div>
            <button
              className="mercoa-mt-1"
              onClick={() => {
                const newRole = prompt('Create a new role')
                if (newRole) {
                  setRoles([...roles, newRole])
                }
              }}
            >
              {' '}
              <Tooltip title="Create a new role">
                <PlusCircleIcon className="mercoa-h-6 mercoa-w-6 mercoa-text-gray-400" />{' '}
              </Tooltip>
            </button>
          </div>
        </div>
        <div className="mercoa-mt-2">
          <label htmlFor="foreignId" className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-text-gray-700">
            Foreign ID
          </label>
          <div className="mercoa-mt-1">
            <input
              {...register(`foreignId`, { required: true })}
              type="text"
              placeholder="The ID of the user in your system"
              className="mercoa-w-full mercoa-border mercoa-border-gray-300 mercoa-rounded-md mercoa-shadow-sm focus:mercoa-ring-indigo-500 focus:mercoa-border-indigo-500 sm:mercoa-text-sm"
            />
          </div>
        </div>
        <MercoaButton isEmphasized={true} color="green" className="mercoa-mt-5 mercoa-w-full">
          Save
        </MercoaButton>
      </form>
    )
  }

  return (
    <>
      <div className="mercoa-rounded-md mercoa-bg-gray-100 mercoa-p-8">
        <ul
          role="list"
          className="mercoa-divide-y mercoa-divide-gray-100 mercoa-overflow-hidden mercoa-bg-white mercoa-shadow-sm mercoa-ring-1 mercoa-ring-gray-900/5 sm:mercoa-rounded-xl"
        >
          {users?.map((user, i) => (
            <li
              onClick={() => setSelectedUser(user)}
              key={user?.id ?? i}
              className="mercoa-relative mercoa-flex mercoa-gap-x-6 mercoa-px-4 mercoa-py-5 hover:mercoa-bg-gray-50 sm:mercoa-px-6 mercoa-cursor-pointer "
            >
              <div className="mercoa-flex mercoa-gap-x-4 mercoa-w-full">
                <div className="mercoa-flex mercoa-justify-left">
                  <span className="mercoa-inline-flex mercoa-h-16 mercoa-w-16 mercoa-items-center mercoa-justify-center mercoa-rounded-full mercoa-bg-gray-500">
                    <span className="mercoa-mt-0.5 mercoa-text-xl mercoa-font-medium mercoa-leading-none mercoa-text-white">
                      {user.name?.charAt(0) ?? 'N/A'}
                      {user.name?.split(' ')?.[1]?.charAt(0) ?? ''}
                    </span>
                  </span>
                </div>
                <div>
                  <p className="mercoa-text-sm mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-900">
                    <a>{user.name}</a>
                  </p>
                  <p className="mercoa-mt-1 mercoa-flex mercoa-text-xs mercoa-leading-5 mercoa-text-gray-600">
                    {user.email}
                  </p>
                  <p className="mercoa-mt-1 mercoa-flex mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
                    {user.id}
                  </p>
                </div>
                <div className="mercoa-flex mercoa-items-center mercoa-gap-x-2 grow">
                  {user?.roles?.map((role) => {
                    return (
                      <span
                        className="mercoa-inline-flex mercoa-items-center mercoa-px-2.5 mercoa-py-0.5 mercoa-rounded-full mercoa-text-xs mercoa-font-medium mercoa-bg-green-100 mercoa-text-green-800"
                        key={role}
                      >
                        {role}
                      </span>
                    )
                  })}
                </div>
                <div
                  className="mercoa-flex mercoa-items-center mercoa-rounded-md mercoa-p-2 hover:mercoa-bg-gray-200"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (openNotificationPreferences && mercoaSession.entity?.id && user.id) {
                      openNotificationPreferences({
                        entityId: mercoaSession.entity.id,
                        userId: user.id,
                      })
                    }
                  }}
                >
                  {userNotificationPreferences[user.id] && (
                    <div className="mercoa-flex mercoa-flex-col mercoa-items-center mercoa-gap-y-2">
                      {userNotificationPreferences[user.id]?.every((e) => e.disabled) ? (
                        <span className="mercoa-inline-flex mercoa-items-center mercoa-px-2.5 mercoa-py-0.5 mercoa-rounded-full mercoa-text-xs mercoa-font-medium mercoa-bg-red-100 mercoa-text-red-800">
                          Notifications Disabled
                        </span>
                      ) : (
                        <span className="mercoa-inline-flex mercoa-items-center mercoa-px-2.5 mercoa-py-0.5 mercoa-rounded-full mercoa-text-xs mercoa-font-medium mercoa-bg-green-100 mercoa-text-green-800">
                          Notifications Enabled
                        </span>
                      )}
                      {userNotificationPreferences[user.id]?.every((e) => e.digest) && (
                        <span className="mercoa-inline-flex mercoa-items-center mercoa-px-2.5 mercoa-py-0.5 mercoa-rounded-full mercoa-text-xs mercoa-font-medium mercoa-bg-blue-100 mercoa-text-blue-800">
                          Daily Digest Enabled
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mercoa-flex mercoa-gap-3">
                  <button
                    onMouseOver={(e) => {
                      if (!mercoaSession.entity?.id || !user.id) return
                      mercoaSession.client?.entity.user.notificationPolicy
                        .getAll(mercoaSession.entity?.id, user.id)
                        .then((resp) => {
                          if (resp) {
                            setUserNotificationPreferences((e) => ({
                              ...e,
                              [user.id]: resp,
                            }))
                          }
                        })
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (openNotificationPreferences && mercoaSession.entity?.id && user.id) {
                        openNotificationPreferences({
                          entityId: mercoaSession.entity.id,
                          userId: user.id,
                        })
                      }
                    }}
                  >
                    <EnvelopeIcon className="mercoa-p-2 mercoa-rounded-xl mercoa-h-10 mercoa-w-10 mercoa-text-gray-400 hover:mercoa-text-gray-500 hover:mercoa-bg-gray-200" />
                  </button>

                  <button
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (confirm('Are you sure you want to delete this user?')) {
                        if (!mercoaSession.entity?.id) return
                        if (user?.id && user?.id != 'new') {
                          try {
                            await mercoaSession.client?.entity.user.delete(mercoaSession.entity.id, user.id)
                          } catch (e: any) {
                            toast.error(e.body)
                            return
                          }
                        }
                        mercoaSession.refresh()
                      }
                    }}
                  >
                    <TrashIcon className="mercoa-p-2 mercoa-rounded-xl mercoa-h-10 mercoa-w-10 mercoa-text-gray-400 hover:mercoa-text-gray-500 hover:mercoa-bg-gray-200" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          <li
            className="mercoa-relative mercoa-flex mercoa-gap-x-6 mercoa-px-4 mercoa-py-5 hover:mercoa-bg-gray-50 sm:mercoa-px-6 mercoa-cursor-pointer mercoa-items-center mercoa-justify-center mercoa-align-center"
            onClick={() => {
              setSelectedUser({
                id: '',
                roles: [''],
                email: '',
                name: '',
                foreignId: '',
                createdAt: new Date(),
                updatedAt: new Date(),
              })
            }}
          >
            <PlusCircleIcon className="mercoa-h-6 mercoa-w-6 mercoa-text-gray-400" />
            <div className="mercoa-text-sm mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-900">Add User</div>
          </li>
        </ul>
      </div>
      <Transition.Root show={!!selectedUser} as={Fragment}>
        <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={() => setSelectedUser(undefined)}>
          <Transition.Child
            as={Fragment}
            enter="mercoa-ease-out mercoa-duration-300"
            enterFrom="mercoa-opacity-0"
            enterTo="mercoa-opacity-100"
            leave="mercoa-ease-in mercoa-duration-200"
            leaveFrom="mercoa-opacity-100"
            leaveTo="mercoa-opacity-0"
          >
            <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-mercoa-opacity-75 mercoa-transition-opacity" />
          </Transition.Child>

          <div className="mercoa-fixed mercoa-inset-0 mercoa-z-10 mercoa-overflow-y-auto">
            <div className="mercoa-flex mercoa-min-h-full mercoa-items-end mercoa-justify-center mercoa-p-4 mercoa-text-center sm:mercoa-items-center sm:mercoa-p-0">
              <Transition.Child
                as={Fragment}
                enter="mercoa-ease-out mercoa-duration-300"
                enterFrom="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
                enterTo="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
                leave="mercoa-ease-in mercoa-duration-200"
                leaveFrom="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
                leaveTo="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
              >
                <Dialog.Panel
                  className={`mercoa-relative mercoa-transform mercoa-rounded-lg mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-max-w-lg sm:mercoa-p-6`}
                >
                  {selectedUser && <EditUser user={selectedUser} />}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
