import { Combobox, Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon, MinusIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { jwtDecode } from 'jwt-decode'
import debounce from 'lodash/debounce'
import { Fragment, HTMLAttributes, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { TokenOptions } from '.'
import { classNames, getEndpoint } from '../lib/lib'
import { MercoaSession, useMercoaSession } from './Mercoa'

export interface MercoaButtonProps extends HTMLAttributes<HTMLButtonElement> {
  isEmphasized: boolean
  tooltip?: string
  className?: string
  color?: 'red' | 'green' | 'blue' | 'indigo' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  [x: string]: any
}

export function MercoaButton({
  children,
  tooltip,
  isEmphasized,
  className,
  color,
  icon,
  size,
  ...props
}: MercoaButtonProps) {
  let classNameInternal = `
    disabled:mercoa-bg-gray-300 disabled:mercoa-text-gray-600
    mercoa-items-center mercoa-rounded-md mercoa-border 
    mercoa-font-medium 
    mercoa-shadow-sm  
    focus:mercoa-outline-none focus:mercoa-ring-2 
    focus:mercoa-ring-offset-2`

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

  const classNameIsEmphasized = `
    mercoa-bg-mercoa-primary
    mercoa-text-mercoa-primary-text-invert
    mercoa-border-transparent
    hover:mercoa-bg-mercoa-primary-dark
    focus:mercoa-ring-mercoa-primary-light 
  `
  const classNameIsNotEmphasized = `
    mercoa-bg-white
    mercoa-text-mercoa-primary-text
    mercoa-border-mercoa-primary-light
    hover:mercoa-border-mercoa-primary-dark
    hover:mercoa-bg-white
    hover:mercoa-text-mercoa-primary-text
    focus:mercoa-ring-mercoa-primary-light 
  `

  let colorOverride = ''
  let colorOverrideIsEmphasized = ''
  if (color === 'red') {
    colorOverride = `
      mercoa-bg-white
      mercoa-text-red-600
      mercoa-border-red-600
      hover:mercoa-text-red-700
      hover:mercoa-border-red-700
      focus:mercoa-ring-red-500
    `
    colorOverrideIsEmphasized = `
      mercoa-bg-red-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-red-700
      focus:mercoa-ring-red-500
    `
  } else if (color === 'green') {
    colorOverride = `
      mercoa-bg-white
      mercoa-text-green-600
      mercoa-border-green-600
      hover:mercoa-text-green-700
      hover:mercoa-border-green-700
      focus:mercoa-ring-green-500
    `
    colorOverrideIsEmphasized = `
      mercoa-bg-green-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-green-700
      focus:mercoa-ring-green-500
    `
  } else if (color === 'blue') {
    colorOverride = `
      mercoa-bg-white
      mercoa-text-blue-600
      mercoa-border-blue-600
      hover:mercoa-text-blue-700
      hover:mercoa-border-blue-700
      focus:mercoa-ring-blue-500
    `
    colorOverrideIsEmphasized = `
      mercoa-bg-blue-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-blue-700
      focus:mercoa-ring-blue-500
    `
  } else if (color === 'indigo') {
    colorOverride = `
      mercoa-bg-white
      mercoa-text-indigo-600
      mercoa-border-indigo-600
      hover:mercoa-text-indigo-700
      hover:mercoa-border-indigo-700
      focus:mercoa-ring-indigo-500
    `
    colorOverrideIsEmphasized = `
      mercoa-bg-indigo-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-indigo-700
      focus:mercoa-ring-indigo-500
    `
  } else if (color === 'yellow') {
    colorOverride = `
      mercoa-bg-white
      mercoa-text-yellow-600
      mercoa-border-yellow-600
      hover:mercoa-border-yellow-800
      focus:mercoa-ring-yellow-500
    `
    colorOverrideIsEmphasized = `
      mercoa-bg-yellow-600
      mercoa-text-white
      mercoa-border-transparent
      hover:mercoa-bg-yellow-700
      focus:mercoa-ring-yellow-500
    `
  }

  let classNameFinal = classNameInternal
  if (color) {
    classNameFinal = `${classNameInternal} ${isEmphasized ? colorOverrideIsEmphasized : colorOverride}`
  } else {
    classNameFinal = `${classNameInternal} ${isEmphasized ? classNameIsEmphasized : classNameIsNotEmphasized}`
  }

  const button = (
    <button className={`${classNameFinal} ${className ?? ''}`} {...props}>
      {children}
    </button>
  )
  return tooltip ? (
    <Tooltip title="Please add at least one representative who is a controller" offset={50}>
      {button}
    </Tooltip>
  ) : (
    button
  )
}

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
            <ChevronDownIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
          ) : (
            <ChevronUpIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
          )
        ) : (
          <MinusIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
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
}) {
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
                <Listbox.Button className="mercoa-relative mercoa-w-24 mercoa-cursor-default mercoa-rounded-md mercoa-bg-white mercoa-py-1 mercoa-pl-3 mercoa-pr-10 mercoa-text-left mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 focus:mercoa-outline-none focus:mercoa-ring-2 focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6">
                  <span className="mercoa-block mercoa-truncate">{resultsPerPage}</span>
                  <span className="mercoa-pointer-events-none mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-pr-2">
                    <ChevronUpDownIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="mercoa-transition mercoa-ease-in mercoa-duration-100"
                  leaveFrom="mercoa-opacity-100"
                  leaveTo="mercoa-opacity-0"
                >
                  <Listbox.Options className="mercoa-absolute mercoa-z-10 mercoa-mt-1 mercoa-max-h-60 mercoa-w-full mercoa-overflow-auto mercoa-rounded-md mercoa-bg-white mercoa-py-1 mercoa-text-base mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none sm:mercoa-text-sm">
                    {[10, 20, 50, 100].map((num) => (
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
                                <CheckIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
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
            Showing <span className="mercoa-font-medium">{(page - 1) * resultsPerPage + 1}</span> to{' '}
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
            className="mercoa-relative mercoa-ml-3 mercoa-inline-flex mercoa-items-center mercoa-rounded-md mercoa-bg-white mercoa-px-3 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 focus-visible:mercoa-outline-offset-0 disabled:mercoa-opacity-50 disabled:mercoa-cursor-not-allowed"
          >
            Download CSV
          </button>
        )}
        <button
          disabled={page === 1}
          type="button"
          onClick={prevPage}
          className="mercoa-relative mercoa-ml-3 mercoa-inline-flex mercoa-items-center mercoa-rounded-md mercoa-bg-white mercoa-px-3 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 focus-visible:mercoa-outline-offset-0 disabled:mercoa-opacity-50 disabled:mercoa-cursor-not-allowed"
        >
          Previous
        </button>
        <button
          disabled={!hasMore}
          type="button"
          onClick={nextPage}
          className="mercoa-relative mercoa-ml-3 mercoa-inline-flex mercoa-items-center mercoa-rounded-md mercoa-bg-white mercoa-px-3 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50 focus-visible:mercoa-outline-offset-0 disabled:mercoa-opacity-50 disabled:mercoa-cursor-not-allowed"
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
}: {
  children: React.ReactNode
  title: React.ReactNode
  offset?: number
}) {
  return (
    <span className="mercoa-group mercoa-relative">
      <span
        className={`mercoa-pointer-events-none mercoa-absolute -mercoa-top-10 mercoa-left-1/4 
        -mercoa-translate-x-1/2 mercoa-whitespace-pre mercoa-rounded mercoa-bg-gray-600 mercoa-px-2 mercoa-py-1 
        mercoa-text-white mercoa-opacity-0 transition group-hover:mercoa-opacity-100
        mercoa-text-sm mercoa-font-medium`}
        style={{ top: -1 * (offset ?? 40) }}
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
          key={key}
          className={`mercoa-w-full mercoa-rounded-md mercoa-bg-gray-200`}
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
        <span className="mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-bg-green-100 mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium mercoa-text-green-800 mercoa-mr-2">
          Default Payment Method
        </span>
      ) : (
        <MercoaButton
          isEmphasized={false}
          onClick={async (e) => {
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

export function Switch({
  register,
  name,
  label,
  disabled,
}: {
  register: Function
  name: string
  label: ReactNode
  disabled?: boolean
}) {
  return (
    <label className="mercoa-relative mercoa-inline-flex mercoa-cursor-pointer  mercoa-items-center mercoa-mt-2">
      <input {...register(name)} type="checkbox" value="" className="mercoa-peer mercoa-sr-only" disabled={disabled} />
      <div
        className="mercoa-peer mercoa-h-6 mercoa-w-11 mercoa-rounded-full mercoa-bg-gray-300 after:mercoa-absolute after:mercoa-top-0.5 after:mercoa-left-[2px]
                after:mercoa-h-5 after:mercoa-w-5 after:mercoa-rounded-full
                after:border after:mercoa-border-gray-300 after:mercoa-bg-white after:mercoa-transition-all after:mercoa-content-[''] peer-checked:mercoa-bg-blue-600 peer-checked:after:mercoa-translate-x-full
                peer-checked:after:mercoa-border-white peer-focus:mercoa-ring-4 peer-focus:mercoa-ring-blue-300 peer-disabled:mercoa-bg-red-100 peer-disabled:after:mercoa-bg-red-50"
      />
      <span className="mercoa-ml-3 mercoa-flex mercoa-items-center mercoa-text-sm mercoa-font-medium mercoa-text-gray-900">
        {label}
      </span>
    </label>
  )
}

export function DebouncedSearch({ onSettle, placeholder }: { onSettle: (...args: any) => any; placeholder: string }) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useRef(debounce(onSettle, 200)).current

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm])

  return (
    <input
      onChange={(e) => setSearchTerm(e.target.value)}
      type="text"
      placeholder={placeholder}
      className="mercoa-block mercoa-w-48 mercoa-flex-1 mercoa-rounded-md mercoa-border-0 mercoa-py-1.5 mercoa-text-gray-900 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 sm:mercoa-text-sm sm:mercoa-leading-6"
    />
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
  size?: 'sm' | 'md'
}) {
  const padding = size === 'sm' ? 'mercoa-px-3 mercoa-py-2' : 'mercoa-px-4 mercoa-py-5 sm:mercoa-p-6'
  const titleFontSize = size === 'sm' ? 'mercoa-text-xs' : 'mercoa-text-sm'
  const valueFontSize = size === 'sm' ? 'mercoa-text-md' : 'mercoa-text-3xl'
  return (
    <div key={title} className={`mercoa-overflow-hidden mercoa-rounded-lg mercoa-bg-white ${padding} mercoa-shadow`}>
      <dt className={`mercoa-truncate ${titleFontSize} mercoa-font-medium mercoa-text-gray-500`}>{title}</dt>
      <dd className={`mercoa-mt-1 ${valueFontSize} mercoa-font-semibold mercoa-tracking-tight mercoa-text-gray-900`}>
        {value}
      </dd>
    </div>
  )
}

export function MercoaCombobox({
  onChange,
  options,
  value,
  label,
  disabledText,
  displayIndex,
  secondaryDisplayIndex,
  multiple,
  className,
  labelClassName,
  inputClassName,
  freeText,
}: {
  onChange: (val: any) => any
  options: { value: any; disabled: boolean }[]
  value: any
  label?: string
  displayIndex?: string
  secondaryDisplayIndex?: string | string[]
  disabledText?: string
  multiple?: boolean
  className?: string
  labelClassName?: string
  inputClassName?: string
  freeText?: boolean
}) {
  const [query, setQuery] = useState('')
  const [selectedValue, setSelectedValue] = useState(value)

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  useEffect(() => {
    if (freeText && query !== '') {
      setSelectedValue(query)
    }
  }, [query, freeText])

  const filteredOptions =
    query === ''
      ? options
      : [
          ...options.filter((option) => {
            const value = displayIndex ? option.value[displayIndex] : option.value
            return value?.toLowerCase().includes(query.toLowerCase())
          }),
          ...(freeText ? [{ value: query, disabled: false }] : []),
        ]

  const filteredOptionsLimited = filteredOptions.slice(0, 100)

  function displayValue(value: any) {
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

  function toString(value: string | string[]) {
    if (Array.isArray(value)) {
      return value.join(', ')
    } else {
      return value
    }
  }

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
        <Combobox.Button className="mercoa-relative mercoa-w-full">
          {({ open }) => (
            <>
              <Combobox.Input
                autoComplete="off"
                className={
                  'mercoa-w-full mercoa-rounded-md mercoa-border-0 mercoa-bg-white mercoa-py-1.5 mercoa-pl-3 mercoa-pr-12 mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 focus:mercoa-ring-2 focus:mercoa-ring-inset focus:mercoa-ring-mercoa-primary sm:mercoa-text-sm sm:mercoa-leading-6 ' +
                  inputClassName
                }
                onChange={(event) => setQuery(event.target.value)}
                displayValue={displayValue}
                onClick={(e: any) => {
                  if (open) e.stopPropagation()
                }}
              />
              <div className="mercoa-absolute mercoa-inset-y-0 mercoa-right-0 mercoa-flex mercoa-items-center mercoa-rounded-r-md mercoa-px-2 focus:mercoa-outline-none">
                <ChevronUpDownIcon className="mercoa-h-5 mercoa-w-5 mercoa-text-gray-400" aria-hidden="true" />
              </div>
            </>
          )}
        </Combobox.Button>

        {filteredOptionsLimited.length > 0 && (
          <Combobox.Options className="mercoa-absolute mercoa-z-10 mercoa-mt-1 mercoa-max-h-60 mercoa-w-full mercoa-overflow-auto mercoa-rounded-md mercoa-bg-white mercoa-py-1 mercoa-text-base mercoa-shadow-lg mercoa-ring-1 mercoa-ring-black mercoa-ring-opacity-5 focus:mercoa-outline-none sm:mercoa-text-sm ">
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
                      console.log(secondaryDisplayIndex)
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
                          <CheckIcon className="mercoa-h-5 mercoa-w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )
                }}
              </Combobox.Option>
            ))}
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
  const url = typeof window !== 'undefined' ? window.location.search : ''
  const urlParams = new URLSearchParams(url)
  const params = Object.fromEntries(urlParams.entries())

  const passedToken = token ?? params.t ?? params.token ?? ''
  if (!passedToken) {
    return <LoadingSpinner />
  }

  const parsedToken = jwtDecode(String(passedToken)) as TokenOptions & {
    exp: number
    iat: number
  }

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
    dbnc(_val)
  }

  const dbnc = useCallback(
    debounce((_prop: string) => {
      setState(_prop)
    }, wait),
    [],
  )

  return [state, setDebouncedState]
}
