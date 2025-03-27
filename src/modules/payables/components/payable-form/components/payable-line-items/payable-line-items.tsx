import { EyeIcon, EyeSlashIcon, PlusCircleIcon, PlusIcon } from '@heroicons/react/24/outline'
import { ReactNode, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { MercoaButton, Tooltip, useMercoaSession, usePayableDetails } from '../../../../../../components'
import { LineItemOptions } from './line-item-options'
import { LineItemRows } from './line-item-rows'

export function PayableLineItems({ readOnly, children }: { readOnly?: boolean; children?: ReactNode }) {
  const mercoaSession = useMercoaSession()
  const [isHidden, setIsHidden] = useState<boolean>(false)

  const { formContextValue } = usePayableDetails()
  const { lineItemsContextValue, formMethods } = formContextValue
  const { lineItems, addItem } = lineItemsContextValue

  const { watch } = formMethods

  const status = watch('status')

  readOnly = readOnly || (!!status && status !== Mercoa.InvoiceStatus.Draft)

  if (children) {
    return <>{children}</>
  }

  if (mercoaSession.iframeOptions?.options?.invoice?.lineItems === Mercoa.LineItemAvailabilities.Disabled) return <></>
  return (
    <div
      className={`mercoa-col-span-full mercoa-grid mercoa-gap-2 mercoa-border mercoa-border-gray-900/10 mercoa-px-2 mercoa-py-6 mercoa-rounded-mercoa`}
    >
      {/* HEADER */}
      <div className="mercoa-flex mercoa-items-center mercoa-col-span-full">
        <h2 className="mercoa-text-lg mercoa-font-semibold mercoa-leading-6 mercoa-text-gray-700">
          Line Items{' '}
          <span className="mercoa-font-medium mercoa-text-gray-500 mercoa-text-base">({lineItems?.length ?? 0})</span>
        </h2>
        {!isHidden && !readOnly && (
          <MercoaButton isEmphasized={false} size="sm" hideOutline color="gray" onClick={addItem} type="button">
            <Tooltip title="Add line item">
              <PlusCircleIcon
                className="mercoa-size-5 mercoa-text-gray-400 hover:mercoa-opacity-75"
                aria-hidden="true"
              />
            </Tooltip>
            <span className="mercoa-sr-only">Add line item</span>
          </MercoaButton>
        )}
        <div className="mercoa-flex-1" />
        <MercoaButton
          isEmphasized={false}
          size="sm"
          hideOutline
          type="button"
          onClick={() => {
            setIsHidden(!isHidden)
          }}
        >
          {isHidden ? (
            <span className="mercoa-flex mercoa-items-center">
              Show Line Items <EyeSlashIcon className="mercoa-ml-2 mercoa-size-5" />
            </span>
          ) : (
            <span className="mercoa-flex mercoa-items-center">
              Hide Line Items <EyeIcon className="mercoa-ml-2 mercoa-size-5" />
            </span>
          )}
        </MercoaButton>
      </div>

      {/* ROWS */}
      {!isHidden && <LineItemRows readOnly={readOnly} />}
      {!isHidden && !readOnly && (lineItems?.length ?? 0) > 0 && (
        <div className="mercoa-col-span-full mercoa-gap-2 mercoa-flex">
          <div className="mercoa-flex-1" />
          <MercoaButton isEmphasized size="sm" onClick={addItem} type="button">
            <div className="mercoa-flex mercoa-items-center">
              Add Line Item
              <PlusIcon className="mercoa-ml-1 mercoa-size-4" aria-hidden="true" />
            </div>
          </MercoaButton>
          <LineItemOptions />
        </div>
      )}
    </div>
  )
}
