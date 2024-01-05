import { Combobox } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon, MinusIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { jwtDecode } from 'jwt-decode'
import debounce from 'lodash/debounce'
import { HTMLAttributes, ReactNode, useEffect, useRef, useState } from 'react'
import { TokenOptions } from '.'
import { classNames } from '../lib/lib'
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
    disabled:bg-gray-300 disabled:text-gray-600
    items-center rounded-md border 
    font-medium 
    shadow-sm  
    focus:outline-none focus:ring-2 
    focus:ring-offset-2`

  switch (size) {
    case 'sm':
      classNameInternal += ' px-2.5 py-1.5 text-xs'
      break
    case 'md':
      classNameInternal += ' px-3 py-2 text-sm'
    case 'lg':
    default:
      classNameInternal += ' px-4 py-2'
  }

  const classNameIsEmphasized = `
    bg-mercoa-primary
    text-mercoa-primary-text-invert
    border-transparent
    hover:bg-mercoa-primary-dark
    focus:ring-mercoa-primary-light 
  `
  const classNameIsNotEmphasized = `
    bg-white
    text-mercoa-primary-text
    border-mercoa-primary-light
    hover:border-mercoa-primary-dark
    hover:bg-white
    hover:text-mercoa-primary-text
    focus:ring-mercoa-primary-light 
  `

  let colorOverride = ''
  let colorOverrideIsEmphasized = ''
  if (color === 'red') {
    colorOverride = `
      bg-white
      text-red-600
      border-red-600
      hover:text-red-700
      hover:border-red-700
      focus:ring-red-500
    `
    colorOverrideIsEmphasized = `
      bg-red-600
      text-white
      border-transparent
      hover:bg-red-700
      focus:ring-red-500
    `
  } else if (color === 'green') {
    colorOverride = `
      bg-white
      text-green-600
      border-green-600
      hover:text-green-700
      hover:border-green-700
      focus:ring-green-500
    `
    colorOverrideIsEmphasized = `
      bg-green-600
      text-white
      border-transparent
      hover:bg-green-700
      focus:ring-green-500
    `
  } else if (color === 'blue') {
    colorOverride = `
      bg-white
      text-blue-600
      border-blue-600
      hover:text-blue-700
      hover:border-blue-700
      focus:ring-blue-500
    `
    colorOverrideIsEmphasized = `
      bg-blue-600
      text-white
      border-transparent
      hover:bg-blue-700
      focus:ring-blue-500
    `
  } else if (color === 'indigo') {
    colorOverride = `
      bg-white
      text-indigo-600
      border-indigo-600
      hover:text-indigo-700
      hover:border-indigo-700
      focus:ring-indigo-500
    `
    colorOverrideIsEmphasized = `
      bg-indigo-600
      text-white
      border-transparent
      hover:bg-indigo-700
      focus:ring-indigo-500
    `
  } else if (color === 'yellow') {
    colorOverride = `
      bg-white
      text-yellow-600
      border-yellow-600
      hover:border-yellow-800
      focus:ring-yellow-500
    `
    colorOverrideIsEmphasized = `
      bg-yellow-600
      text-white
      border-transparent
      hover:bg-yellow-700
      focus:ring-yellow-500
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
      className="group inline-flex items-center"
    >
      {title}
      <span
        className={`${
          isSelected
            ? 'bg-mercoa-primary text-mercoa-primary-text-invert group-hover:opacity-75'
            : 'bg-gray-100 text-gray-900 group-hover:bg-gray-200'
        } ml-2 flex-none rounded`}
      >
        {isSelected ? (
          orderDirection === Mercoa.OrderDirection.Asc ? (
            <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
          )
        ) : (
          <MinusIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </span>
    </button>
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
    <span className="group relative">
      <span
        className={`pointer-events-none absolute -top-10 left-1/4 
        -translate-x-1/2 whitespace-pre rounded bg-gray-600 px-2 py-1 
        text-white opacity-0 transition group-hover:opacity-100
        text-sm font-medium`}
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
    <div className="flex flex-col space-y-2 animate-pulse">
      {[...Array(rows)].map((key) => (
        <div key={key} className={`w-full rounded-md bg-gray-200`} style={{ height: height + 'px' }}></div>
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
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 mr-2">
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
          className="mr-2"
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
    <label className="relative inline-flex cursor-pointer items-center mt-2">
      <input {...register(name)} type="checkbox" value="" className="peer sr-only" disabled={disabled} />
      <div
        className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:top-0.5 after:left-[2px]
                after:h-5 after:w-5 after:rounded-full
                after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full
                peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-blue-300 peer-disabled:bg-red-100 peer-disabled:after:bg-red-50"
      />
      <span className="ml-3 flex items-center text-sm font-medium text-gray-900">{label}</span>
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
      className="block w-48 flex-1 rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6"
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
  const padding = size === 'sm' ? 'px-3 py-2' : 'px-4 py-5 sm:p-6'
  const titleFontSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const valueFontSize = size === 'sm' ? 'text-md' : 'text-3xl'
  return (
    <div key={title} className={`overflow-hidden rounded-lg bg-white ${padding} shadow`}>
      <dt className={`truncate ${titleFontSize} font-medium text-gray-500`}>{title}</dt>
      <dd className={`mt-1 ${valueFontSize} font-semibold tracking-tight text-gray-900`}>{value}</dd>
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
        <Combobox.Label className={labelClassName ?? 'block text-sm font-medium leading-6 text-gray-900'}>
          {label}
        </Combobox.Label>
      )}
      <div className="relative mt-2">
        <Combobox.Button className="relative w-full">
          {({ open }) => (
            <>
              <Combobox.Input
                autoComplete="off"
                className={
                  'w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-mercoa-primary sm:text-sm sm:leading-6 ' +
                  inputClassName
                }
                onChange={(event) => setQuery(event.target.value)}
                displayValue={displayValue}
                onClick={(e: any) => {
                  if (open) e.stopPropagation()
                }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
            </>
          )}
        </Combobox.Button>

        {filteredOptions.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ">
            {filteredOptions.map(({ value, disabled }) => (
              <Combobox.Option
                key={value?.id ?? (displayIndex ? value[displayIndex] : value)}
                value={value}
                disabled={disabled}
                className={({ active }) =>
                  classNames(
                    'relative cursor-default select-none py-2 pl-3 pr-9',
                    active ? 'bg-mercoa-primary text-mercoa-primary-text-invert' : 'text-gray-900',
                    disabled ? 'bg-gray-200 text-gray-600' : '',
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
                      <div className="flex">
                        <span className={classNames('truncate', selected && 'font-semibold')}>
                          {toString(displayIndex ? value[displayIndex] : value)}
                        </span>
                        {secondaryDisplayIndex && (
                          <span
                            className={classNames(
                              'ml-2 truncate',
                              active ? 'text-mercoa-primary-text-invert' : 'text-gray-500',
                              disabled ? 'text-gray-600' : '',
                            )}
                          >
                            {secondaryText}
                          </span>
                        )}
                      </div>

                      {selected && (
                        <span
                          className={classNames(
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                            active ? 'text-mercoa-primary-text-invert' : 'text-mercoa-primary',
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )
                }}
              </Combobox.Option>
            ))}
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
  children: (value: TokenOptions) => React.ReactNode
}) {
  // get query params from url
  const url = typeof window !== 'undefined' ? window.location.search : ''
  const urlParams = new URLSearchParams(url)
  const params = Object.fromEntries(urlParams.entries())

  let { t } = params
  const passedToken = token ?? t ?? ''
  if (!passedToken) {
    return <LoadingSpinner />
  }

  const parsedToken = jwtDecode(String(passedToken)) as TokenOptions & {
    exp: number
    iat: number
  }

  if (parsedToken.exp * 1000 < Date.now()) {
    return (
      <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Link expired</h1>
          <p className="mt-6 text-base leading-7 text-gray-600">
            This link was set to expire after a certain amount of time. Please contact the person who shared this link
            with you.
          </p>
        </div>
      </main>
    )
  }
  return <MercoaSession token={passedToken}>{children(parsedToken)}</MercoaSession>
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
        className="mr-2 inline h-8 w-8 animate-spin fill-indigo-400 text-gray-200 dark:text-gray-300"
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
      <span className="sr-only">Loading...</span>
    </div>
  )
}
