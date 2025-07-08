import { Combobox, Dialog, Listbox, Transition } from '@headlessui/react'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  MinusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import useResizeObserver from '@react-hook/resize-observer'
import dayjs from 'dayjs'
import { jwtDecode } from 'jwt-decode'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import {
  ChangeEvent,
  FocusEvent,
  Fragment,
  HTMLAttributes,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import DatePicker from 'react-datepicker'
import { Control, Controller, FieldErrors, UseFormRegister, useForm, useFormContext } from 'react-hook-form'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { toast } from 'react-toastify'
import { Mercoa, MercoaClient } from '@mercoa/javascript'
import { classNames, getEndpoint } from '../lib/lib'
import { canadaStates, countries, usaStates } from '../lib/locations'
import { MercoaSession, TokenOptions, useMercoaSession } from './index'

import React from 'react'

export interface MercoaButtonProps extends HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
  isEmphasized: boolean
  hideOutline?: boolean
  tooltip?: string
  disabledTooltipText?: string
  className?: string
  color?: 'red' | 'green' | 'blue' | 'indigo' | 'yellow' | 'gray' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  [x: string]: any
}
export const MercoaButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, MercoaButtonProps>(
  (
    { children, tooltip, disabledTooltipText, isEmphasized, hideOutline, className, color, icon, size, ...props },
    ref,
  ) => {
    let classNameInternal = `
    disabled:mercoa-bg-gray-300 disabled:mercoa-text-gray-600
    mercoa-items-center mercoa-rounded-mercoa
    mercoa-font-medium 
    ${
      hideOutline
        ? ''
        : `mercoa-shadow-sm mercoa-border 
    focus:mercoa-outline-none focus:mercoa-ring-1 
    focus:mercoa-ring-offset-2`
    }`

    switch (size) {
      case 'sm':
        classNameInternal += ' mercoa-px-2.5 mercoa-py-1.5 mercoa-text-xs'
        break
      case 'md':
        classNameInternal += ' mercoa-px-3 mercoa-py-2 mercoa-text-sm'
      case 'lg':
      default:
        classNameInternal += ' mercoa-px-4 mercoa-py-2'
    }

    const classNameIsEmphasized =
      color === 'secondary'
        ? `
    mercoa-bg-mercoa-secondary
    mercoa-text-mercoa-secondary-text-invert
    mercoa-border-transparent
    hover:mercoa-bg-mercoa-secondary-dark
    focus:mercoa-ring-mercoa-secondary-light
  `
        : `
    mercoa-bg-mercoa-primary
    mercoa-text-mercoa-primary-text-invert
    mercoa-border-transparent
    hover:mercoa-bg-mercoa-primary-dark
    focus:mercoa-ring-mercoa-primary-light 
  `
    const classNameIsNotEmphasized =
      color === 'secondary'
        ? `
    mercoa-text-mercoa-secondary-text
    ${
      hideOutline
        ? ''
        : `mercoa-bg-white mercoa-border-mercoa-secondary-light
    hover:mercoa-border-mercoa-secondary-dark
    focus:mercoa-ring-mercoa-secondary-light
    hover:mercoa-bg-white`
    }
    hover:mercoa-text-mercoa-secondary-dark
  `
        : `
    mercoa-text-mercoa-primary-text
    ${
      hideOutline
        ? ''
        : `mercoa-bg-white mercoa-border-mercoa-primary-light
    hover:mercoa-border-mercoa-primary-dark
    focus:mercoa-ring-mercoa-primary-light
    hover:mercoa-bg-white`
    }
    hover:mercoa-text-mercoa-primary-dark
  `

    let colorOverride = hideOutline ? '' : 'mercoa-bg-white'
    let colorOverrideIsEmphasized = ''
    if (color === 'red') {
      colorOverride += `
      mercoa-text-red-600
      ${
        hideOutline
          ? ''
          : `mercoa-border-red-600
      hover:mercoa-border-red-700
      focus:mercoa-ring-red-500`
      }
      hover:mercoa-text-red-700
    `
      colorOverrideIsEmphasized += `
      mercoa-bg-red-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-red-700
      focus:mercoa-ring-red-500
    `
    } else if (color === 'green') {
      colorOverride += `
      mercoa-text-green-600
      ${
        hideOutline
          ? ''
          : `mercoa-border-green-600
      hover:mercoa-border-green-700
      focus:mercoa-ring-green-500`
      }
      hover:mercoa-text-green-700
    `
      colorOverrideIsEmphasized += `
      mercoa-bg-green-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-green-700
      focus:mercoa-ring-green-500
    `
    } else if (color === 'blue') {
      colorOverride += `
      mercoa-text-blue-600
      ${
        hideOutline
          ? ''
          : `mercoa-border-blue-600
      hover:mercoa-border-blue-700
      focus:mercoa-ring-blue-500`
      }
      hover:mercoa-text-blue-700
    `
      colorOverrideIsEmphasized += `
      mercoa-bg-blue-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-blue-700
      focus:mercoa-ring-blue-500
    `
    } else if (color === 'indigo') {
      colorOverride += `
      mercoa-text-indigo-600
      ${
        hideOutline
          ? ''
          : `mercoa-border-indigo-600
      hover:mercoa-border-indigo-700
      focus:mercoa-ring-indigo-500`
      }
      hover:mercoa-text-indigo-700
    `
      colorOverrideIsEmphasized += `
      mercoa-bg-indigo-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-indigo-700
      focus:mercoa-ring-indigo-500
    `
    } else if (color === 'yellow') {
      colorOverride += `
      mercoa-text-yellow-600
      ${
        hideOutline
          ? ''
          : `mercoa-border-yellow-600
      hover:mercoa-border-yellow-700
      focus:mercoa-ring-yellow-500`
      }
      hover:mercoa-text-yellow-700
    `
      colorOverrideIsEmphasized += `
      mercoa-bg-yellow-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-yellow-700
      focus:mercoa-ring-yellow-500
    `
    } else if (color === 'gray') {
      colorOverride += `
      mercoa-text-gray-600
      ${
        hideOutline
          ? ''
          : `mercoa-border-gray-600
      hover:mercoa-border-gray-700
      focus:mercoa-ring-gray-500`
      }
      hover:mercoa-text-gray-700
    `
      colorOverrideIsEmphasized += `
      mercoa-bg-gray-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-gray-700
      focus:mercoa-ring-gray-500
    `
    }

    let classNameFinal = classNameInternal
    if (color && color !== 'secondary') {
      classNameFinal = `${classNameInternal} ${isEmphasized ? colorOverrideIsEmphasized : colorOverride}`
    } else {
      classNameFinal = `${classNameInternal} ${isEmphasized ? classNameIsEmphasized : classNameIsNotEmphasized}`
    }

    const button =
      props.type === 'link' ? (
        <a ref={ref as Ref<HTMLAnchorElement>} className={`${classNameFinal} ${className ?? ''}`} {...props}>
          {children}
        </a>
      ) : (
        <button ref={ref as Ref<HTMLButtonElement>} className={`${classNameFinal} ${className ?? ''}`} {...props}>
          {children}
        </button>
      )

    if (tooltip) {
      return (
        <Tooltip title="Please add at least one representative who is a controller" offset={50}>
          {button}
        </Tooltip>
      )
    }

    if (props.disabled && disabledTooltipText) {
      return (
        <Tooltip title={disabledTooltipText} offset={50} horizontalOffset={0}>
          {button}
        </Tooltip>
      )
    }

    return button
  },
)

MercoaButton.displayName = 'MercoaButton'

export function TableOrderHeader({
  orderDirection,
  isSelected,
  setOrder,
  title,
}: {
  orderDirection: Mercoa.OrderDirection
  isSelected: boolean
  title: string
  setOrder: (orderDirection: Mercoa.OrderDirection) => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        setOrder(orderDirection === Mercoa.OrderDirection.Asc ? Mercoa.OrderDirection.Desc : Mercoa.OrderDirection.Asc)
      }}
      className="mercoa-group mercoa-inline-flex mercoa-items-center"
    >
      {title}
      <span
        className={`${
          isSelected
            ? 'mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert group-hover:mercoa-opacity-75'
            : 'mercoa-bg-gray-100 mercoa-text-gray-900 group-hover:mercoa-bg-gray-200'
        } mercoa-ml-2 mercoa-flex-none mercoa-rounded`}
      >
        {isSelected ? (
          orderDirection === Mercoa.OrderDirection.Asc ? (
            <ChevronDownIcon className="mercoa-size-5" aria-hidden="true" />
          ) : (
            <ChevronUpIcon className="mercoa-size-5" aria-hidden="true" />
          )
        ) : (
          <MinusIcon className="mercoa-size-5" aria-hidden="true" />
        )}
      </span>
    </button>
  )
}

export function TableNavigation({
  count,
  resultsPerPage,
  setResultsPerPage,
  page,
  hasMore,
  setPage,
  setStartingAfter,
  startingAfter,
  data,
  downloadAll,
  pageSizes,
}: {
  count: number
  resultsPerPage: number
  setResultsPerPage: (value: number) => void
  page: number
  hasMore: boolean
  setPage: (value: number) => void
  setStartingAfter: (value: string[]) => void
  startingAfter: string[]
  data: Array<{ id: string }>
  downloadAll?: () => void
  pageSizes?: number[]
}) {
  const pageOptions = pageSizes ?? [10, 20, 50, 100]

  function setResultsPerPageWrapper(value: number) {
    setResultsPerPage(value)
    setPage(1)
    setStartingAfter([])
  }

  function nextPage() {
    if (!data) return
    setPage(page + 1)
    setStartingAfter([...startingAfter, data[data.length - 1].id])
  }

  function prevPage() {
    setPage(Math.max(1, page - 1))
    setStartingAfter(startingAfter.slice(0, startingAfter.length - 1))
  }

  return (
    <nav
      className="mercoa-flex mercoa-items-center mercoa-justify-between mercoa-border-t mercoa-border-gray-200 mercoa-bg-white mercoa-px-2 mercoa-py-3 sm:mercoa-px-3"
      aria-label="Pagination"
    >
      <div>
        <Listbox value={resultsPerPage} onChange={setResultsPerPageWrapper}>
          {({ open }) => (
            <div className="mercoa-flex mercoa-items-center mercoa-mb-2">
              <Listbox.Label className="mercoa-block mercoa-text-xs mercoa-text-gray-900">
                Results per Page
              </Listbox.Label>
              <div className="mercoa-relative mercoa-mx-2">
                <Listbox.Button className="mercoa-relative mercoa-w-24 mercoa-cursor-default mercoa-rounded-mercoa mercoa-bg-white mercoa-py-1 mercoa-pl-3 mercoa-pr-10 mercoa-text-left mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 focus:mercoa-outline-none focus:mercoa-ring-1 focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6">
                  <span className="mercoa-block mercoa-truncate">{resultsPerPage}</span>
                  <span className="mercoa-pointer-events-none mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-pr-2">
                    <ChevronUpDownIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="mercoa-transition mercoa-ease-in mercoa-duration-100"
                  leaveFrom="mercoa-opacity-100"
                  leaveTo="mercoa-opacity-0"
                >
                  <Listbox.Options className="mercoa-absolute mercoa-z-10 mercoa-mt-1 mercoa-max-h-60 mercoa-w-full mercoa-overflow-auto mercoa-rounded-mercoa mercoa-bg-white mercoa-py-1 mercoa-text-base mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none sm:mercoa-text-sm">
                    {pageOptions.map((num) => (
                      <Listbox.Option
                        key={num}
                        className={({ active }) =>
                          `${
                            active ? 'mercoa-bg-mercoa-primary mercoa-text-white' : 'mercoa-text-gray-900'
                          } mercoa-relative mercoa-cursor-default mercoa-select-none mercoa-py-2 mercoa-pl-3 mercoa-pr-9`
                        }
                        value={num}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={`${
                                selected ? 'mercoa-font-semibold' : 'mercoa-font-normal'
                              } mercoa-block mercoa-truncate`}
                            >
                              {num}
                            </span>

                            {selected ? (
                              <span
                                className={`${
                                  active ? 'mercoa-text-white' : 'mercoa-text-mercoa-primary-text'
                                } mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-pr-4`}
                              >
                                <CheckIcon className="mercoa-size-5" aria-hidden="true" />
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
        <div className="mercoa-hidden sm:mercoa-block">
          <p className="mercoa-text-sm mercoa-text-gray-700">
            Showing <span className="mercoa-font-medium">{Math.min((page - 1) * resultsPerPage + 1, count)}</span> to{' '}
            <span className="mercoa-font-medium">{Math.min(page * resultsPerPage, count)}</span> of{' '}
            <span className="mercoa-font-medium">{count}</span> results
          </p>
        </div>
      </div>
      <div className="mercoa-flex mercoa-flex-1 mercoa-justify-between sm:mercoa-justify-end">
        {downloadAll && (
          <button
            type="button"
            onClick={downloadAll}
            className="mercoa-relative mercoa-ml-3 mercoa-inline-flex mercoa-items-center mercoa-rounded-mercoa mercoa-bg-white mercoa-px-3 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 focus-visible:mercoa-outline-offset-0 disabled:mercoa-opacity-50 disabled:mercoa-cursor-not-allowed"
          >
            Download CSV
          </button>
        )}
        <button
          disabled={page === 1}
          type="button"
          onClick={prevPage}
          className="mercoa-relative mercoa-ml-3 mercoa-inline-flex mercoa-items-center mercoa-rounded-mercoa mercoa-bg-white mercoa-px-3 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 focus-visible:mercoa-outline-offset-0 disabled:mercoa-opacity-50 disabled:mercoa-cursor-not-allowed"
        >
          Previous
        </button>
        <button
          disabled={!hasMore}
          type="button"
          onClick={nextPage}
          className="mercoa-relative mercoa-ml-3 mercoa-inline-flex mercoa-items-center mercoa-rounded-mercoa mercoa-bg-white mercoa-px-3 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 focus-visible:mercoa-outline-offset-0 disabled:mercoa-opacity-50 disabled:mercoa-cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </nav>
  )
}
export function Tooltip({
  children,
  title,
  offset,
  horizontalOffset,
  position,
  showArrow = false,
}: {
  children: React.ReactNode
  title: React.ReactNode
  offset?: number
  horizontalOffset?: number
  position?: 'top' | 'bottom' | 'left' | 'right'
  showArrow?: boolean
}) {
  let positionString = 'mercoa-left-1/2 -mercoa-translate-x-1/2'
  if (position === 'right') {
    positionString = 'mercoa-left-full mercoa-translate-x-2'
  } else if (position === 'left') {
    positionString = 'mercoa-right-full -mercoa-translate-x-2'
  }

  return (
    <span className="mercoa-group mercoa-relative">
      <span
        className={`mercoa-pointer-events-none mercoa-absolute mercoa-whitespace-pre mercoa-rounded mercoa-bg-white mercoa-px-2 mercoa-py-1
        mercoa-text-gray-700 mercoa-opacity-0 mercoa-shadow-sm mercoa-border mercoa-border-gray-100 mercoa-transition-opacity mercoa-duration-200 
        group-hover:mercoa-opacity-100 mercoa-text-xs ${positionString}
        ${
          showArrow
            ? `before:mercoa-content-[''] before:mercoa-absolute before:mercoa-w-2 before:mercoa-h-2 before:mercoa-bg-white before:mercoa-rotate-45
        before:mercoa-border-l before:mercoa-border-t before:mercoa-border-gray-100 before:mercoa-left-[calc(50%-4px)] before:mercoa-bottom-[-5px]`
            : ''
        }
        `}
        style={{
          top: -1 * (offset ?? 30),
          left: horizontalOffset !== undefined ? `${horizontalOffset}px` : undefined,
        }}
      >
        {title}
      </span>
      {children}
    </span>
  )
}

export function Skeleton({ rows, height }: { rows?: number; height?: number }) {
  if (!rows) rows = 1
  if (!height) height = 24
  return (
    <div className="mercoa-flex mercoa-flex-col mercoa-space-y-2 mercoa-animate-pulse">
      {[...Array(rows)].map((key) => (
        <div
          key={Math.random()}
          className={`mercoa-w-full mercoa-rounded-mercoa mercoa-bg-gray-100`}
          style={{ height: height + 'px' }}
        ></div>
      ))}
    </div>
  )
}

export function DefaultPaymentMethodIndicator({
  paymentMethod,
}: {
  paymentMethod: { id: string; isDefaultSource: boolean }
}) {
  const mercoaSession = useMercoaSession()
  return (
    <>
      {paymentMethod?.isDefaultSource ? (
        <Tooltip title="This is the default payment method for your account">
          <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-green-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-green-800">
            Default
          </span>
        </Tooltip>
      ) : (
        <MercoaButton
          isEmphasized={false}
          onClick={async (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            if (mercoaSession.token && mercoaSession.entity?.id && paymentMethod?.id) {
              await mercoaSession.client?.entity.paymentMethod.update(mercoaSession.entity?.id, paymentMethod?.id, {
                type: 'bankAccount',
                defaultSource: true,
              })
              mercoaSession.refresh()
            }
          }}
          size="sm"
          className="mercoa-mr-2"
        >
          Make Default
        </MercoaButton>
      )}
    </>
  )
}

export function PaymentMethodConfirmationDialog({
  show,
  onClose,
  account,
}: {
  show: boolean
  onClose: () => void
  account: Mercoa.PaymentMethodResponse
}) {
  const mercoaSession = useMercoaSession()
  const [schema, setSchema] = useState<Mercoa.CustomPaymentMethodSchemaResponse | null>(null)
  const [error, setError] = useState('')
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      routingNumber: '',
      accountNumber: '',
    },
  })

  useEffect(() => {
    if (
      mercoaSession.token &&
      mercoaSession.entity?.id &&
      account.id &&
      account.type === Mercoa.PaymentMethodType.Custom
    ) {
      mercoaSession.client?.customPaymentMethodSchema.get(account.schemaId).then((resp) => {
        setSchema(resp)
      })
    }
  }, [mercoaSession.token, mercoaSession.entity?.id, account.id, account.type])

  const onSubmit = async (data: { routingNumber: string; accountNumber: string }) => {
    if (account.type === Mercoa.PaymentMethodType.BankAccount) {
      if (data.routingNumber !== account.routingNumber || data.accountNumber !== account.accountNumber) {
        setError('The routing number or account number does not match')
        return
      }
    }

    if (mercoaSession.token && mercoaSession.entity?.id && account.id) {
      try {
        await mercoaSession.client?.entity.paymentMethod.update(mercoaSession.entity?.id, account.id, {
          confirmedByEntity: true,
          type: account.type,
        })
        toast.success('Account verified')
        await mercoaSession.refresh()
        onClose()
      } catch (e: any) {
        toast.error('Error verifying account')
        console.error(e.body)
      }
    }
  }

  return (
    <AddDialog
      show={show}
      onClose={() => {
        reset()
        setError('')
        onClose()
      }}
      component={
        <form onSubmit={handleSubmit(onSubmit)} className="mercoa-space-y-4">
          <h3 className="mercoa-text-lg mercoa-font-medium mercoa-text-gray-900">Payment Method Details</h3>
          {account.type === Mercoa.PaymentMethodType.BankAccount && (
            <div className="mercoa-space-y-4">
              <div className="mercoa-text-sm mercoa-text-gray-600">
                Please verify your bank account by entering the routing and account numbers.
              </div>
              <div className="mercoa-space-y-2">
                <MercoaInput
                  label="Routing Number"
                  type="text"
                  name="routingNumber"
                  register={register}
                  placeholder="Enter routing number"
                />
                <MercoaInput
                  label={account.accountNumber.length < 5 ? 'Last 4 Digits of Account Number' : 'Account Number'}
                  type="text"
                  name="accountNumber"
                  register={register}
                  placeholder={
                    account.accountNumber.length < 5 ? 'Enter last 4 digits of account number' : 'Enter account number'
                  }
                />
                {error && <div className="mercoa-text-sm mercoa-text-red-600">{error}</div>}
              </div>
            </div>
          )}
          {account.type === Mercoa.PaymentMethodType.Check && (
            <div className="mercoa-space-y-2 mercoa-bg-gray-50 mercoa-p-4 mercoa-rounded-lg mercoa-border mercoa-border-gray-200">
              <div className="mercoa-grid mercoa-grid-cols-2">
                <div className="mercoa-col-span-2 mercoa-mb-2">
                  <span className="mercoa-font-semibold mercoa-text-gray-700">Check Information</span>
                </div>
                <div>
                  <span className="mercoa-font-medium mercoa-text-gray-600">Pay To The Order Of:</span>
                </div>
                <div>{account.payToTheOrderOf}</div>
                <div className="mercoa-col-span-2 mercoa-mt-2">
                  <span className="mercoa-font-medium mercoa-text-gray-600">Mailing Address:</span>
                </div>
                <div className="mercoa-col-span-2 mercoa-pl-2">
                  <div>{account.addressLine1}</div>
                  {account.addressLine2 && <div>{account.addressLine2}</div>}
                  <div>
                    {account.city && <span>{account.city}</span>}
                    {account.stateOrProvince && <span>, {account.stateOrProvince}</span>}
                    {account.postalCode && <span> {account.postalCode}</span>}
                  </div>
                  {account.country && <div>{account.country}</div>}
                </div>
              </div>
            </div>
          )}
          {account.type === Mercoa.PaymentMethodType.Custom && (
            <div className="mercoa-space-y-2 mercoa-bg-gray-50 mercoa-p-4 mercoa-rounded-lg mercoa-border mercoa-border-gray-200">
              <div className="mercoa-grid mercoa-grid-cols-2">
                <div className="mercoa-col-span-2 mercoa-mb-2">
                  <span className="mercoa-font-semibold mercoa-text-gray-700">{schema?.name}</span>
                </div>
                <div>
                  <span className="mercoa-font-medium mercoa-text-gray-600">Account Name:</span>
                </div>
                <div>{account.accountName}</div>
                {account.accountNumber && (
                  <>
                    <div>
                      <span className="mercoa-font-medium mercoa-text-gray-600">Account Number:</span>
                    </div>
                    <div>••••{account.accountNumber.slice(-4)}</div>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="mercoa-mt-6 mercoa-flex mercoa-justify-end mercoa-gap-x-3">
            <MercoaButton isEmphasized={false} onClick={onClose} size="sm" color="gray" hideOutline>
              Cancel
            </MercoaButton>
            <MercoaButton isEmphasized type="submit" size="sm">
              Confirm Details
            </MercoaButton>
          </div>
        </form>
      }
    />
  )
}

export function PaymentMethodConfirmationPill({
  showEntityConfirmation,
  editEntityConfirmation,
  account,
}: {
  showEntityConfirmation?: boolean
  editEntityConfirmation?: boolean
  account: Mercoa.PaymentMethodResponse
}) {
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Mercoa.PaymentMethodResponse | null>(null)

  let content = null
  if (showEntityConfirmation && account.confirmedByEntity) {
    content = (
      <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-green-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-green-800">
        Confirmed
      </span>
    )
  } else if (editEntityConfirmation && !account.confirmedByEntity) {
    content = (
      <div className="mercoa-flex mercoa-items-center mercoa-justify-center">
        <MercoaButton
          isEmphasized={false}
          size="sm"
          onClick={() => {
            setSelectedAccount(account)
            setShowConfirmationDialog(true)
          }}
        >
          <p>Confirm </p>
          <p>Details</p>
        </MercoaButton>
      </div>
    )
  } else if (showEntityConfirmation && !account.confirmedByEntity) {
    content = (
      <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-indigo-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-indigo-800">
        Unconfirmed
      </span>
    )
  }
  return (
    <>
      {content}
      {selectedAccount && (
        <PaymentMethodConfirmationDialog
          show={showConfirmationDialog}
          onClose={() => {
            setShowConfirmationDialog(false)
            setSelectedAccount(null)
          }}
          account={selectedAccount}
        />
      )}
    </>
  )
}

export function PaymentMethodList({
  accounts,
  showDelete,
  addAccount,
  formatAccount,
}: {
  accounts?: Mercoa.PaymentMethodResponse[]
  showDelete?: boolean
  addAccount?: ReactNode
  formatAccount: (account: any) => JSX.Element | JSX.Element[] | null
}) {
  const mercoaSession = useMercoaSession()
  const hasAccounts = accounts && accounts.length > 0

  return (
    <>
      <h3>Payment Methods</h3>
      {/* List of payment methods if provided */}
      {hasAccounts &&
        accounts.map((account) => (
          <div className="mercoa-mt-2 mercoa-flex" key={account.id}>
            <div className="mercoa-flex-grow">{formatAccount(account)}</div>
            {showDelete && (
              <button
                onClick={async () => {
                  const del = confirm('Are you sure you want to remove this account? This action cannot be undone.')
                  if (del && mercoaSession.token && mercoaSession.entity?.id && account.id) {
                    try {
                      await mercoaSession.client?.entity.paymentMethod.delete(mercoaSession.entity?.id, account.id)
                      toast.success('Account removed')
                    } catch (e: any) {
                      toast.error('Error removing account')
                      console.error(e.body)
                    }
                    mercoaSession.refresh()
                  }
                }}
                className="mercoa-ml-2 mercoa-text-mercoa-secondary hover:mercoa-text-mercoa-secondary-dark"
              >
                <Tooltip title="Remove Account">
                  <TrashIcon className="mercoa-size-5" />
                </Tooltip>
              </button>
            )}
          </div>
        ))}
      {/* Add account button */}
      {addAccount && (
        <div className="mercoa-mt-2 mercoa-flex">
          <div className="mercoa-flex-grow">{addAccount}</div>
          {showDelete && hasAccounts && <div className="mercoa-ml-2 mercoa-size-5" />}
        </div>
      )}
      {/* Empty state rendering (no accounts + no add account button provided) */}
      {!hasAccounts && !addAccount && (
        <div className="mercoa-mt-2 mercoa-flex">
          <div className="mercoa-flex-grow">
            <PaymentMethodButton
              icon={<ExclamationTriangleIcon className="mercoa-size-5" />}
              text="No payment methods found"
            />
          </div>
        </div>
      )}
    </>
  )
}

export function MercoaSwitch({
  register,
  name,
  label,
  tooltip,
  disabled,
  className,
  errors,
}: {
  register: Function
  name: string
  label: ReactNode
  tooltip?: ReactNode
  disabled?: boolean
  className?: string
  errors?: FieldErrors<any>
}) {
  return (
    <label
      className={`mercoa-relative mercoa-inline-flex mercoa-cursor-pointer mercoa-items-center mercoa-mt-2 ${className}`}
    >
      <input {...register(name)} type="checkbox" value="" className="mercoa-peer mercoa-sr-only" disabled={disabled} />
      <div
        className="mercoa-peer mercoa-h-6 mercoa-w-11 mercoa-rounded-full mercoa-bg-gray-300 after:mercoa-absolute after:mercoa-top-0.5 after:mercoa-left-[2px]
                after:mercoa-h-5 after:mercoa-w-5 after:mercoa-rounded-full
                after:border after:mercoa-border-gray-300 after:mercoa-bg-white after:mercoa-transition-all after:mercoa-content-[''] peer-checked:mercoa-bg-mercoa-primary peer-checked:after:mercoa-translate-x-full
                peer-checked:after:mercoa-border-white peer-focus:mercoa-ring-4 peer-focus:mercoa-ring-mercoa-primary peer-disabled:mercoa-bg-red-100 peer-disabled:after:mercoa-bg-red-50"
      />
      <span className="mercoa-ml-3 mercoa-flex mercoa-items-center mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">
        {tooltip ? (
          <Tooltip position="right" title={tooltip} offset={70}>
            {label}
          </Tooltip>
        ) : (
          label
        )}
      </span>
    </label>
  )
}

export function DebouncedSearch({
  onSettle,
  placeholder,
  leadingIcon,
  children,
}: {
  onSettle: (value: string) => void
  placeholder?: string
  leadingIcon?: ReactNode
  children?: ({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => JSX.Element
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useRef(debounce(onSettle, 200)).current

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm])

  if (children) {
    return children({ onChange: (e) => setSearchTerm(e.target.value) })
  }

  return (
    <div className="mercoa-w-full">
      <MercoaInput
        onChange={(e) => setSearchTerm(e.target.value)}
        type="text"
        placeholder={placeholder}
        leadingIcon={leadingIcon}
      />
    </div>
  )
}

export function StatCard({
  title,
  value,
  icon,
  size,
}: {
  title: string
  value: string | number | ReactNode
  icon?: ReactNode
  size?: 'xs' | 'sm' | 'md'
}) {
  const padding =
    size === 'xs'
      ? 'mercoa-px-3 mercoa-py-2'
      : size === 'sm'
        ? 'mercoa-px-3 mercoa-py-2'
        : 'mercoa-px-4 mercoa-py-5 sm:mercoa-p-6'
  const titleFontSize = size === 'xs' ? 'mercoa-text-xs' : size === 'sm' ? 'mercoa-text-xs' : 'mercoa-text-sm'
  const valueFontSize = size === 'xs' ? 'mercoa-text-sm' : size === 'sm' ? 'mercoa-text-md' : 'mercoa-text-3xl'
  return (
    <div
      key={title}
      className={`mercoa-overflow-hidden mercoa-rounded-mercoa mercoa-bg-white ${padding} mercoa-shadow`}
    >
      <dt className={`mercoa-truncate ${titleFontSize} mercoa-font-medium mercoa-text-gray-500`}>{title}</dt>
      <dd className={`mercoa-mt-1 ${valueFontSize} mercoa-font-semibold mercoa-tracking-tight mercoa-text-gray-900`}>
        {value}
      </dd>
    </div>
  )
}

export function MercoaCombobox({
  onChange,
  onRawChange,
  options,
  value,
  label,
  placeholder,
  disabledText,
  displayIndex,
  secondaryDisplayIndex,
  className,
  labelClassName,
  inputClassName: suppliedInputClassName,
  showAllOptions,
  multiple,
  freeText,
  showClear,
  displaySelectedAs,
  readOnly,
  direction,
}: {
  onChange: (val: any) => any
  onRawChange?: (val: any) => any
  options: { value: any; disabled?: boolean; color?: string }[]
  value?: any // TODO: why was this required? and why were we passing a function to it???
  label?: string
  placeholder?: string
  displayIndex?: string
  secondaryDisplayIndex?: string | string[]
  disabledText?: string
  className?: string
  labelClassName?: string
  inputClassName?: string
  showAllOptions?: boolean
  multiple?: boolean
  freeText?: boolean
  showClear?: boolean
  displaySelectedAs?: 'input' | 'pill'
  readOnly?: boolean
  direction?: 'down' | 'up'
}) {
  if (!options) {
    options = []
  }

  function displayInputValue(value: any) {
    if (multiple && Array.isArray(value)) {
      return value?.length > 0
        ? value
            .map((value: any) => {
              const toDisplay = (displayIndex ? value?.[displayIndex] : value) ?? ''
              return toDisplay
            })
            ?.join(', ')
        : ''
    } else {
      const toDisplay = (displayIndex ? value?.[displayIndex] : value) ?? ''
      return toDisplay
    }
  }

  const [query, setQuery] = useState(showAllOptions || multiple ? '' : displayInputValue(value))
  const [selectedValue, setSelectedValue] = useState(value ?? (multiple ? [] : ''))

  if (!displaySelectedAs) {
    displaySelectedAs = 'input'
  }

  useEffect(() => {
    setSelectedValue(value ?? (multiple ? [] : ''))
    if (!(showAllOptions || multiple)) setQuery(displayInputValue(value))
  }, [value, multiple, showAllOptions])

  useEffect(() => {
    onRawChange?.(query)
    if (freeText && query !== '') {
      setSelectedValue(query)
    }
  }, [query, freeText])

  const filteredOptions =
    query === ''
      ? options
      : [
          ...options.filter((option) => {
            const value = displayIndex ? option.value?.[displayIndex] : option.value
            return value?.toLowerCase().includes(query.toLowerCase())
          }),
          ...(freeText ? [{ value: query, disabled: false }] : []),
        ]

  const filteredOptionsLimited = filteredOptions.slice(0, 100)

  function displayPillValue(value: any) {
    if (!Array.isArray(value)) {
      value = [value]
    }

    if (!value[0] && placeholder) return placeholder

    return value.map((value: any, index: number) => {
      // find color
      const option = options.find((option) => {
        const optionValue = displayIndex ? option.value[displayIndex] : option.value
        return optionValue === value
      })
      if (typeof value === 'object' && displayIndex) {
        value = value[displayIndex]
      }
      if (!value) return <Fragment key={index}></Fragment>
      return (
        <span
          key={index}
          className="mercoa-m-0.5 mercoa-inline-flex mercoa-items-center mercoa-rounded-mercoa mercoa-px-2 mercoa-py-1 mercoa-text-xs mercoa-font-medium mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-500/10"
          style={{ backgroundColor: option?.color ?? '#E5E7EB' }}
        >
          {value}
        </span>
      )
    })
  }

  function toString(value: string | string[]) {
    if (Array.isArray(value)) {
      return value.join(', ')
    } else {
      return value
    }
  }

  const inputBoxClass = suppliedInputClassName ?? inputClassName({ align: 'left' })

  const children = (
    <>
      {label && (
        <Combobox.Label
          className={
            labelClassName ?? 'mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900'
          }
        >
          {label}
        </Combobox.Label>
      )}
      <div className={`mercoa-relative ${label ? 'mercoa-mt-2' : ''}`}>
        <Combobox.Button className="mercoa-relative mercoa-w-full mercoa-bg-white" as="div">
          {({ open }) => {
            const showInput = displaySelectedAs === 'input' || freeText || (open && !multiple)
            return (
              <>
                <div className={!showInput ? inputBoxClass : ' '}>
                  {!showInput && displayPillValue(selectedValue)}
                  <Combobox.Input
                    placeholder={placeholder}
                    autoComplete="off"
                    className={
                      showInput
                        ? inputBoxClass
                        : `${
                            selectedValue && suppliedInputClassName
                              ? 'mercoa-hidden'
                              : 'mercoa-invisible mercoa-h-[0px] mercoa-p-0'
                          }`
                    }
                    onChange={(event) => setQuery(event.target.value)}
                    displayValue={displayInputValue}
                    onClick={(e: any) => {
                      if (open) e.stopPropagation()
                    }}
                  />
                </div>
                {!readOnly && (
                  <div className="mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-rounded-r-md mercoa-px-2 focus:mercoa-outline-none">
                    <ChevronUpDownIcon className="mercoa-size-5 mercoa-text-gray-400" aria-hidden="true" />
                  </div>
                )}
              </>
            )
          }}
        </Combobox.Button>

        {filteredOptionsLimited.length > 0 && (
          <Combobox.Options
            className={
              'mercoa-absolute mercoa-z-10 mercoa-mt-1 mercoa-max-h-60 mercoa-w-full mercoa-overflow-auto mercoa-rounded-mercoa mercoa-bg-white mercoa-py-1 mercoa-text-base mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none sm:mercoa-text-sm ' +
              (direction === 'up' ? 'mercoa-bottom-10' : '')
            }
          >
            {filteredOptionsLimited.map(({ value, disabled }) => (
              <Combobox.Option
                key={value?.id ?? (displayIndex ? value[displayIndex] : value)}
                value={value}
                disabled={disabled}
                className={({ active }) =>
                  classNames(
                    'mercoa-relative mercoa-cursor-default mercoa-select-none mercoa-py-2 mercoa-pl-3 mercoa-pr-9',
                    active ? 'mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert' : 'mercoa-text-gray-900',
                    disabled ? 'mercoa-bg-gray-200 mercoa-text-gray-600' : '',
                  )
                }
              >
                {({ active, selected, disabled }) => {
                  let secondaryText = ''
                  if (disabled) {
                    secondaryText = disabledText ?? 'Disabled'
                  } else if (secondaryDisplayIndex) {
                    if (Array.isArray(secondaryDisplayIndex)) {
                      secondaryText = secondaryDisplayIndex.map((index) => toString(value[index])).join(' - ')
                    } else {
                      secondaryText = toString(value[secondaryDisplayIndex])
                    }
                  }
                  return (
                    <>
                      <div className="mercoa-flex">
                        <span className={classNames('mercoa-truncate', selected && 'mercoa-font-semibold')}>
                          {toString(displayIndex ? value[displayIndex] : value)}
                        </span>
                        {secondaryDisplayIndex && (
                          <span
                            className={classNames(
                              'mercoa-ml-2 mercoa-truncate',
                              active ? 'mercoa-text-mercoa-primary-text-invert' : 'mercoa-text-gray-500',
                              disabled ? 'mercoa-text-gray-600' : '',
                            )}
                          >
                            {secondaryText}
                          </span>
                        )}
                      </div>

                      {selected && (
                        <span
                          className={classNames(
                            'mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-pr-4',
                            active ? 'mercoa-text-mercoa-primary-text-invert' : 'mercoa-text-mercoa-primary',
                          )}
                        >
                          <CheckIcon className="mercoa-size-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )
                }}
              </Combobox.Option>
            ))}
            {showClear && (
              <Combobox.Option
                value={undefined}
                className={({ active }) =>
                  classNames(
                    'mercoa-relative mercoa-cursor-default mercoa-select-none mercoa-py-2 mercoa-pl-3 mercoa-pr-9',
                    active ? 'mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert' : 'mercoa-text-gray-900',
                  )
                }
              >
                {({ active, selected, disabled }) => {
                  return (
                    <div className="mercoa-flex">
                      <span className={classNames('mercoa-truncate', selected && 'mercoa-font-semibold')}>
                        Clear Selection
                      </span>
                    </div>
                  )
                }}
              </Combobox.Option>
            )}
            {filteredOptionsLimited.length != filteredOptions.length && (
              <Combobox.Option
                className="mercoa-relative mercoa-cursor-default mercoa-select-none mercoa-py-2 mercoa-pl-3 mercoa-pr-9 mercoa-bg-gray-200 mercoa-text-gray-600"
                disabled
                value=""
              >
                <div className="mercoa-flex mercoa-justify-center mercoa-py-2">
                  <span className="mercoa-text-gray-500">
                    Showing first 100 results. Please type to search all results.
                  </span>
                </div>
              </Combobox.Option>
            )}
          </Combobox.Options>
        )}
      </div>
    </>
  )

  return multiple ? (
    <Combobox
      disabled={readOnly}
      as="div"
      value={selectedValue}
      onChange={(value: any) => {
        setSelectedValue(value)
        onChange(value)
      }}
      multiple
      className={className}
    >
      {children}
    </Combobox>
  ) : (
    <Combobox
      disabled={readOnly}
      as="div"
      value={selectedValue}
      onChange={(value: any) => {
        setSelectedValue(value)
        onChange(value)
      }}
      className={className}
    >
      {children}
    </Combobox>
  )
}

export function TokenVerification({
  token,
  children,
}: {
  token?: string
  children: (value: TokenOptions, rawToken: string) => React.ReactNode
}) {
  // get query params from url
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.search)
  }, [])

  const urlParams = new URLSearchParams(url)
  const params = Object.fromEntries(urlParams.entries())

  const passedToken = token ?? params.t ?? params.token ?? ''
  if (!passedToken) {
    return <LoadingSpinner />
  }

  const parsedToken = jwtDecode(String(passedToken)) as TokenOptions

  if (parsedToken.exp * 1000 < Date.now()) {
    return (
      <main className="mercoa-grid mercoa-min-h-full place-mercoa-items-center mercoa-bg-white mercoa-px-6 mercoa-py-24 sm:mercoa-py-32 lg:mercoa-px-8">
        <div className="mercoa-text-center">
          <h1 className="mercoa-mt-4 mercoa-text-3xl mercoa-font-bold mercoa-tracking-tight mercoa-text-gray-900 sm:mercoa-text-5xl">
            Link expired
          </h1>
          <p className="mercoa-mt-6 mercoa-text-base mercoa-leading-7 mercoa-text-gray-600">
            This link was set to expire after a certain amount of time. Please contact the person who shared this link
            with you.
          </p>
        </div>
      </main>
    )
  } else if (!parsedToken.organizationId) {
    return (
      <main className="mercoa-grid mercoa-min-h-full place-mercoa-items-center mercoa-bg-white mercoa-px-6 mercoa-py-24 sm:mercoa-py-32 lg:mercoa-px-8">
        <div className="mercoa-text-center">
          <h1 className="mercoa-mt-4 mercoa-text-3xl mercoa-font-bold mercoa-tracking-tight mercoa-text-gray-900 sm:mercoa-text-5xl">
            Link Invalid
          </h1>
          <p className="mercoa-mt-6 mercoa-text-base mercoa-leading-7 mercoa-text-gray-600">
            This link is invalid. Please contact the person who shared this link with you.
          </p>
        </div>
      </main>
    )
  } else if (!parsedToken.entityId && !parsedToken.userId && !parsedToken.invoiceId && !parsedToken.counterpartyId) {
    return (
      <main className="mercoa-grid mercoa-min-h-full place-mercoa-items-center mercoa-bg-white mercoa-px-6 mercoa-py-24 sm:mercoa-py-32 lg:mercoa-px-8">
        <div className="mercoa-text-center">
          <h1 className="mercoa-mt-4 mercoa-text-3xl mercoa-font-bold mercoa-tracking-tight mercoa-text-gray-900 sm:mercoa-text-5xl">
            Link Invalid
          </h1>
          <p className="mercoa-mt-6 mercoa-text-base mercoa-leading-7 mercoa-text-gray-600">
            This link is invalid. Please contact the person who shared this link with you.
          </p>
        </div>
      </main>
    )
  }

  return (
    <MercoaSession googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS} endpoint={getEndpoint()} token={passedToken}>
      {children(parsedToken, passedToken)}
    </MercoaSession>
  )
}
export function LoadingSpinner({ absolute }: { absolute?: boolean }) {
  return (
    <div
      style={{
        position: absolute ? 'absolute' : 'fixed',
        margin: 'auto',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        height: '1px',
        width: '1px',
      }}
    >
      <LoadingSpinnerIcon />
    </div>
  )
}

export function LoadingSpinnerIcon() {
  return (
    <div role="status">
      <svg
        className="mercoa-mr-2 mercoa-inline mercoa-h-8 mercoa-w-8 mercoa-animate-spin mercoa-fill-mercoa-primary mercoa-text-gray-200 dark:mercoa-text-gray-300"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="mercoa-sr-only">Loading...</span>
    </div>
  )
}

export const useDebounce = (obj: any = null, wait: number = 1000) => {
  const [state, setState] = useState(obj)

  const setDebouncedState = (_val: any) => {
    debounceCallback(_val)
  }

  const debounceCallback = useCallback(
    debounce((_prop: string) => {
      setState(_prop)
    }, wait),
    [],
  )

  return [state, setDebouncedState]
}

export function AddDialog({ show, onClose, component }: { show: boolean; onClose: Function; component: ReactNode }) {
  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={() => onClose()}>
        <Transition.Child
          as={Fragment}
          enter="mercoa-ease-out mercoa-duration-300"
          enterFrom="mercoa-opacity-0"
          enterTo="mercoa-opacity-100"
          leave="mercoa-ease-in mercoa-duration-200"
          leaveFrom="mercoa-opacity-100"
          leaveTo="mercoa-opacity-0"
        >
          <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-opacity-75 mercoa-transition-opacity" />
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
              <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-md sm:mercoa-p-6">
                {component}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export function stopPropagate(callback: () => void) {
  return (e: { stopPropagation: () => void; preventDefault: () => void }) => {
    console.log(e)
    e.stopPropagation()
    e.preventDefault()
    callback()
  }
}

export function inputClassName({
  leadingIcon,
  trailingIcon,
  leadingIconSize,
  noBorder,
  align,
  width,
}: {
  leadingIcon?: boolean
  leadingIconSize?: 'sm' | 'md'
  trailingIcon?: boolean
  noBorder?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}) {
  let pl = 'mercoa-pl-2'
  if (leadingIcon) {
    pl = 'mercoa-pl-5'
    if (leadingIconSize === 'md') {
      pl = 'mercoa-pl-10'
    }
  }
  return `mercoa-block ${width ?? 'mercoa-w-full'} mercoa-flex-1 mercoa-rounded-mercoa mercoa-py-1.5 ${pl} ${
    trailingIcon ? 'mercoa-pr-[3.7rem]' : 'mercoa-pr-2'
  } mercoa-text-gray-900 sm:mercoa-text-sm sm:mercoa-leading-6
  ${noBorder ? 'mercoa-border-0' : 'mercoa-border mercoa-border-gray-300 focus:mercoa-border-mercoa-primary'}
  ${align === 'left' ? 'mercoa-text-left' : ''}
  ${align === 'right' ? 'mercoa-text-right' : ''}
  ${align === 'center' ? 'mercoa-text-center' : ''}
  mercoa-outline-0 mercoa-ring-0 focus:mercoa-ring-0 focus:mercoa-outline-0 mercoa-overflow-hidden`
}

export function MercoaInputLabel({ label, name }: { label: string; name?: string }) {
  return (
    <div className="mercoa-flex mercoa-justify-between">
      <label
        htmlFor={name}
        className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-whitespace-nowrap"
      >
        {label}
      </label>
    </div>
  )
}

export function MercoaInput({
  type,
  label,
  onChange,
  onBlur,
  required,
  readOnly,
  ref,
  register,
  control,
  disabled,
  placeholder,
  optional,
  name,
  className,
  leadingIcon,
  trailingIcon,
  errors,
  dateOptions,
  min,
  max,
  step,
  noBorder,
  inputMask,
}: {
  type?: 'text' | 'password' | 'email' | 'number' | 'date' | 'currency'
  label?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  required?: boolean
  readOnly?: boolean
  ref?: Ref<any>
  register?: UseFormRegister<any>
  control?: Control<any>
  disabled?: boolean
  placeholder?: string
  optional?: boolean
  name?: string
  className?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  errors?: FieldErrors<any>
  dateOptions?: {
    minDate?: Date
    maxDate?: Date
    filterDate?: (date: Date) => boolean
  }
  min?: string | number
  max?: string | number
  step?: string | number
  noBorder?: boolean
  inputMask?: string
}) {
  const useWidth = (target: any) => {
    const [width, setWidth] = useState<number>(0)

    useLayoutEffect(() => {
      setWidth(target?.current?.getBoundingClientRect()?.width ?? 0)
    }, [target])

    useResizeObserver(target, (entry) => setWidth(entry.contentRect.width))

    return width
  }

  const leadingIconRef = useRef(null)
  const leadingIconWidth = useWidth(leadingIconRef)

  const inClassName = inputClassName({
    leadingIcon: !!leadingIcon,
    trailingIcon: !!trailingIcon,
    noBorder: !!noBorder,
    leadingIconSize: leadingIconWidth < 10 ? 'sm' : 'md',
  })

  let props = {
    type,
    placeholder,
    disabled,
    name,
    onChange,
    onBlur,
    readOnly,
    required,
    ref,
    className: inClassName,
    min,
    max,
    step,
  }

  // TODO: This erroneously sets `type='number'` fields to string types, must be fixed
  if (register && name) {
    props = {
      ...props,
      ...register(name, {
        setValueAs: (value?: string) => (value?.trim ? value.trim() : value),
      }),
    }
  }

  let input = <input {...props} />

  if (type === 'date' && control && name) {
    input = (
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DatePicker
            className={inClassName}
            placeholderText={placeholder}
            onChange={(date) => field.onChange(date)}
            selected={field.value ? dayjs(field.value).toDate() : null}
            minDate={dateOptions?.minDate}
            maxDate={dateOptions?.maxDate}
            filterDate={dateOptions?.filterDate}
            readOnly={readOnly}
            required={required}
            peekNextMonth
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
          />
        )}
      />
    )
  } else if (inputMask && control && name) {
    input = (
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, name, value } }) => (
          <PatternFormat
            format={inputMask}
            allowEmptyFormatting
            mask="_"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={inClassName}
            readOnly={readOnly}
          />
        )}
      />
    )
  } else if (type === 'currency' && control && name) {
    input = (
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, name, value } }) => (
          <NumericFormat
            decimalScale={2}
            thousandSeparator
            fixedDecimalScale
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={inClassName}
            readOnly={readOnly}
          />
        )}
      />
    )
  } else if (type === 'currency') {
    type = 'text'
  }

  const inputContainer = (
    <div className="mercoa-relative">
      {leadingIcon && (
        <div
          className="mercoa-pointer-events-none mercoa-absolute mercoa-inset-y-0 mercoa-left-0 mercoa-flex mercoa-items-center mercoa-pl-2"
          ref={leadingIconRef}
        >
          {leadingIcon}
        </div>
      )}
      {input}
      {trailingIcon && (
        <div className="mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center">
          {trailingIcon}
        </div>
      )}
    </div>
  )

  const errorContainer = (
    <>
      {name && get(errors, name)?.message && (
        <p className="mercoa-text-sm mercoa-text-red-500 mercoa-text-left">{get(errors, name)?.message?.toString()}</p>
      )}
    </>
  )

  if (!label) {
    if (className) {
      return (
        <div className={className}>
          {inputContainer}
          {errorContainer}
        </div>
      )
    }
    return (
      <>
        {inputContainer}
        {errorContainer}
      </>
    )
  }

  return (
    <div className={className}>
      <MercoaInputLabel label={label} name={name} />
      <div className="mercoa-mt-1">{inputContainer}</div>
      {errorContainer}
    </div>
  )
}

export function CountPill({ count, selected }: { count: number; selected: boolean }) {
  return (
    <span
      className={`${
        selected
          ? 'mercoa-bg-mercoa-primary mercoa-text-mercoa-primary-text-invert'
          : 'mercoa-bg-gray-100 mercoa-text-gray-800'
      } mercoa-inline-flex mercoa-items-center mercoa-rounded-full  mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium`}
    >
      {' '}
      {count}
    </span>
  )
}

export async function getAllEntityUsers(client: MercoaClient, entityId: string) {
  const userResp: Mercoa.EntityUserResponse[] = []
  let hasMore = true
  while (hasMore) {
    const resp = await client?.entity.user.find(entityId, {
      limit: 100,
      startingAfter: userResp.length > 0 ? userResp[userResp.length - 1].id : undefined,
    })
    if (resp) {
      userResp.push(...resp.data)
      hasMore = resp.hasMore
    } else {
      hasMore = false
    }
  }
  return userResp
}

export async function getAllEntityGroupUsers(client: MercoaClient, entityGroupId: string) {
  const userResp: Mercoa.EntityGroupUserResponse[] = []
  let hasMore = true
  while (hasMore) {
    const resp = await client?.entityGroup.user.find(entityGroupId, {
      limit: 100,
      startingAfter: userResp.length > 0 ? userResp[userResp.length - 1].foreignId : undefined,
    })
    if (resp) {
      userResp.push(...resp.data)
      hasMore = resp.hasMore
    } else {
      hasMore = false
    }
  }
  return userResp
}

export function NoSession({ componentName }: { componentName: string }) {
  return (
    <div className="mercoa-text-red-700">
      ERROR: The <pre className="mercoa-inline mercoa-text-red-900">{componentName}</pre> component needs to be wrapped
      in a <pre className="mercoa-inline mercoa-text-red-900">MercoaSession</pre>. See{' '}
      <a
        href="https://docs.mercoa.com/sdks/react#usage"
        target="_blank"
        className="mercoa-text-blue-300 mercoa-underline"
      >
        documentation
      </a>{' '}
      for more information.
    </div>
  )
}

export function PayablesInlineForm({
  name,
  saveAsStatus,
  addNewButton,
  form,
}: {
  name: string
  saveAsStatus: string
  addNewButton: ReactNode
  form: ReactNode
}) {
  const [open, setOpen] = useState(false)

  const { setValue, watch } = useFormContext()

  const status = watch('saveAsStatus')

  useEffect(() => {
    if (status === 'CLOSE_INLINE_FORM') {
      setOpen(false)
    }
  }, [status])

  return (
    <div className={'mercoa-bg-gray-100 mercoa-rounded-mercoa mercoa-border-gray-200'}>
      {open ? (
        <>
          <div className="mercoa-flex mercoa-flex-row-reverse -mercoa-mb-2">
            <MercoaButton
              isEmphasized={false}
              color="gray"
              type="button"
              size="sm"
              hideOutline
              onClick={() => {
                setOpen(false)
              }}
            >
              <span className="mercoa-sr-only">Close</span>
              <XMarkIcon className="mercoa-size-5" aria-hidden="true" />
            </MercoaButton>
          </div>
          <div className={'mercoa-px-2 mercoa-pb-2'}>
            {form}
            <MercoaButton
              size="md"
              className="mercoa-mt-2"
              isEmphasized
              onClick={() => {
                setValue('saveAsStatus', saveAsStatus)
              }}
            >
              Add {name}
            </MercoaButton>
          </div>
        </>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mercoa-w-full">
          {addNewButton}
        </button>
      )}
    </div>
  )
}

export function PaymentMethodButton({
  onSelect,
  account,
  selected,
  icon,
  text,
}: {
  onSelect?: (account?: any) => void
  account?: Mercoa.PaymentMethodResponse
  selected?: boolean
  icon?: ReactNode
  text: string | ReactNode
}) {
  return (
    <div
      onClick={() => {
        if (onSelect) onSelect(account)
      }}
      className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border ${
        selected ? `mercoa-border-mercoa-primary` : `mercoa-border-gray-300`
      } mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2 ${
        onSelect ? 'mercoa-cursor-pointer hover:mercoa-border-mercoa-primary-dark' : ''
      }`}
    >
      {icon && (
        <div
          className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
            selected
              ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
              : 'mercoa-bg-gray-200 mercoa-text-gray-600'
          }`}
        >
          {icon}
        </div>
      )}
      <div className="mercoa-min-w-0 mercoa-flex-1">
        <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />
        <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">{text}</p>
        <p className="mercoa-truncate mercoa-text-sm mercoa-text-gray-500"></p>
      </div>
    </div>
  )
}

export function canAddToPaymentBatch({
  existingBatch,
  newInvoice,
}: {
  existingBatch: Mercoa.InvoiceResponse[]
  newInvoice: Mercoa.InvoiceResponse
}): { canAdd: boolean; reason?: string } {
  if (existingBatch.length === 0) return { canAdd: true }

  const previousInvoice = existingBatch[existingBatch.length - 1]

  // check payerId
  if (previousInvoice.payerId !== newInvoice.payerId) {
    return { canAdd: false, reason: 'Cannot add invoice to batch with different payerId' }
  }

  // check vendorId
  if (previousInvoice.vendorId !== newInvoice.vendorId) {
    return { canAdd: false, reason: 'Cannot add invoice to batch with different vendorId' }
  }

  // check paymentSourceId
  if (previousInvoice.paymentSourceId !== newInvoice.paymentSourceId) {
    return { canAdd: false, reason: 'Cannot add invoice to batch with different paymentSourceId' }
  }

  // check paymentDestinationId
  if (previousInvoice.paymentDestinationId !== newInvoice.paymentDestinationId) {
    return { canAdd: false, reason: 'Cannot add invoice to batch with different paymentDestinationId' }
  }

  // check paymentDestinationOptions
  if (newInvoice.paymentDestinationOptions || previousInvoice.paymentDestinationOptions) {
    const previousPaymentDestinationOptions = previousInvoice.paymentDestinationOptions ?? {
      type: 'bankAccount',
      delivery: 'ACH_SAME_DAY',
    }

    const newPaymentDestinationOptions = newInvoice.paymentDestinationOptions ?? {
      type: 'bankAccount',
      delivery: 'ACH_SAME_DAY',
    }

    if (newPaymentDestinationOptions.type !== 'bankAccount' && newPaymentDestinationOptions.type !== 'check') {
      return {
        canAdd: false,
        reason: 'Cannot batch invoices with non-bankAccount or non-check paymentDestinationOptions.type',
      }
    }

    if (previousPaymentDestinationOptions.type !== newPaymentDestinationOptions?.type) {
      return { canAdd: false, reason: 'Cannot add invoice to batch with different paymentDestinationOptions.type' }
    }

    // make sure print description is the same
    if (
      previousPaymentDestinationOptions.type === 'check' &&
      newPaymentDestinationOptions.type === 'check' &&
      previousPaymentDestinationOptions.printDescription !== newPaymentDestinationOptions.printDescription
    ) {
      return { canAdd: false, reason: 'Cannot add invoice to batch with different printDescription' }
    }

    if (!('delivery' in previousPaymentDestinationOptions && 'delivery' in newPaymentDestinationOptions)) {
      return { canAdd: false, reason: 'Cannot add invoice to batch with missing paymentDestinationOptions.delivery' }
    } else if (previousPaymentDestinationOptions.delivery !== newPaymentDestinationOptions?.delivery) {
      return { canAdd: false, reason: 'Cannot add invoice to batch with different paymentDestinationOptions.delivery' }
    }
  }

  // check deductionDate
  if (!dayjs(previousInvoice.deductionDate).startOf('day').isSame(dayjs(newInvoice.deductionDate).startOf('day'))) {
    return { canAdd: false, reason: 'Cannot add invoice to batch with different deductionDate' }
  }

  return { canAdd: true }
}

export function addToPaymentBatch({
  existingBatch,
  newInvoice,
}: {
  existingBatch: Mercoa.InvoiceResponse[]
  newInvoice: Mercoa.InvoiceResponse
}): Mercoa.InvoiceResponse[] {
  const result = canAddToPaymentBatch({ existingBatch, newInvoice })

  if (!result.canAdd) {
    throw new Error(result.reason)
  }

  return [...existingBatch, newInvoice]
}

export function StateDropdown({
  value,
  setValue,
  country,
}: {
  value: string | null
  setValue: (value: string) => void
  country?: 'US' | 'CA'
}) {
  const [random] = useState(() => Math.floor(Math.random() * 1000).toString())

  const randomInput = 'select-state-input' + random

  const states = country === 'CA' ? canadaStates : usaStates

  useEffect(() => {
    const input = document.querySelector('.' + randomInput) as HTMLInputElement
    return input.addEventListener('change', (e: any) => {
      // search for the state in the list of states
      const state = states.find(
        (state) =>
          state.abbreviation.toLowerCase() === e.target.value.toLowerCase() ||
          state.name.toLowerCase() === e.target.value.toLowerCase(),
      )
      if (state) {
        setValue(state.abbreviation)
        input.value = state.name
      }
    })
  }, [])

  return (
    <MercoaCombobox
      value={states.find((state) => state.abbreviation === value)}
      onChange={(e) => {
        setValue(e.abbreviation)
      }}
      displayIndex="name"
      options={states.map((state) => ({
        value: {
          name: state.name,
          abbreviation: state.abbreviation,
        },
        disabled: false,
      }))}
      placeholder={country === 'CA' ? 'Province' : 'State'}
      label={country === 'CA' ? 'Province' : 'State'}
      inputClassName={inputClassName({ align: 'left' }) + ' ' + randomInput}
      labelClassName="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 -mercoa-mb-1"
      showAllOptions
    />
  )
}

export function CountryDropdown({ value, setValue }: { value: string | null; setValue: (value: string) => void }) {
  return (
    <MercoaCombobox
      value={countries.find((country) => country.code === value)}
      onChange={(e) => {
        setValue(e.abbreviation)
      }}
      displayIndex="name"
      options={countries.map((country) => ({
        value: {
          name: country.name,
          abbreviation: country.code,
        },
        disabled: false,
      }))}
      placeholder="Country"
      label="Country"
      inputClassName={inputClassName({ align: 'left' })}
      labelClassName="mercoa-block mercoa-text-left mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 -mercoa-mb-1"
      showAllOptions
    />
  )
}

export function ButtonLoadingSpinner({ children, isLoading }: { children: ReactNode; isLoading: boolean }) {
  if (!isLoading) return <>{children}</>
  return (
    <div className="mercoa-relative mercoa-inline-flex mercoa-items-center mercoa-justify-center">
      <div className="mercoa-invisible">{children}</div>
      <div
        className="mercoa-absolute mercoa-animate-spin mercoa-inline-block mercoa-w-[18px] mercoa-h-[18px] mercoa-border-2 mercoa-border-current mercoa-border-t-transparent mercoa-rounded-full mercoa-text-gray-400"
        aria-label="Loading"
      />
    </div>
  )
}
