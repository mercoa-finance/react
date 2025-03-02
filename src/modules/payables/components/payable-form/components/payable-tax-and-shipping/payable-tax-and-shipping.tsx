import useResizeObserver from '@react-hook/resize-observer'
import { useLayoutEffect, useRef, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { MercoaInput, usePayableDetails } from '../../../../../../components'
import { currencyCodeToSymbol } from '../../../../../../lib/currency'

export type PayableTaxAndShippingChildrenProps = {
  readOnly?: boolean
  taxAmount?: number
  setTaxAmount?: (taxAmount: number) => void
  shippingAmount?: number
  setShippingAmount?: (shippingAmount: number) => void
}

export function PayableTaxAndShipping({
  readOnly,
  children,
}: {
  readOnly?: boolean
  children?: (props: PayableTaxAndShippingChildrenProps) => JSX.Element
}) {
  const { formContextValue } = usePayableDetails()
  const { formMethods, taxAndShippingContextValue } = formContextValue
  const { taxAmount, shippingAmount, setTaxAmount, setShippingAmount } = taxAndShippingContextValue
  const {
    control,
    formState: { errors },
    watch,
  } = formMethods

  const currency = watch('currency')
  const status = watch('status')

  const notDraft = !!status && status !== Mercoa.InvoiceStatus.Draft

  const useWidth = (target: any) => {
    const [width, setWidth] = useState<number>(0)

    useLayoutEffect(() => {
      if (target.current) {
        setWidth(target.current.getBoundingClientRect().width)
      }
    }, [target])

    useResizeObserver(target, (entry) => setWidth(entry.contentRect.width))
    return width
  }

  const wrapperDiv = useRef(null)
  const width = useWidth(wrapperDiv)

  if (children) {
    return children({
      readOnly,
      taxAmount,
      setTaxAmount,
      shippingAmount,
      setShippingAmount,
    })
  }

  let formCols = 'mercoa-grid-cols-1'
  if (width && width > 300) {
    formCols = 'mercoa-grid-cols-2'
  }
  if (width && width > 500) {
    formCols = 'mercoa-grid-cols-3'
  }
  if (width && width > 700) {
    formCols = 'mercoa-grid-cols-4'
  }
  if (width && width > 900) {
    formCols = 'mercoa-grid-cols-5'
  }

  return (
    <div className={`mercoa-grid ${formCols} mercoa-col-span-full md:mercoa-gap-4 mercoa-gap-2`} ref={wrapperDiv}>
      {/*  TAX AMOUNT */}
      <MercoaInput
        control={control}
        name="taxAmount"
        label="Tax"
        type="currency"
        readOnly={readOnly || notDraft}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        leadingIcon={<span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>}
        errors={errors}
      />

      {/*  SHIPPING AMOUNT */}
      <MercoaInput
        control={control}
        name="shippingAmount"
        label="Shipping"
        type="currency"
        readOnly={readOnly || notDraft}
        className="md:mercoa-col-span-1 mercoa-col-span-full"
        leadingIcon={<span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>}
        errors={errors}
      />
    </div>
  )
}
