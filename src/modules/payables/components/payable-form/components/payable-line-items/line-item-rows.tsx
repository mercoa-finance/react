import { XCircleIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { MercoaButton, MercoaInput, usePayableDetailsContext } from '../../../../../../components'
import { currencyCodeToSymbol } from '../../../../../../lib/currency'
import { MetadataSelection } from '../payable-metadata/metadata-selection'

export function LineItemRows({ readOnly }: { readOnly?: boolean }) {
  const { filteredMetadata, lineItems, currency, removeItem, formMethods } = usePayableDetailsContext()
  const { register, control } = formMethods

  return (
    <>
      {lineItems.map((lineItem, lineItemIndex) => (
        <Fragment key={`${lineItem.id}`}>
          <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-my-4" />
          <div className="mercoa-flex mercoa-items-start">
            {/*  INVOICE NUMBER */}
            <MercoaInput
              name={`lineItems.${lineItemIndex}.description`}
              placeholder="Description"
              label="Description"
              register={register}
              type="text"
              readOnly={readOnly}
              className="mercoa-flex-1"
            />
            {/*  INVOICE AMOUNT */}
            <MercoaInput
              control={control}
              name={`lineItems.${lineItemIndex}.amount`}
              label="Amount"
              type="currency"
              readOnly={readOnly}
              className="mercoa-max-w-[100px] mercoa-ml-2"
              leadingIcon={
                <span className="mercoa-text-gray-500 sm:mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>
              }
            />
            {/*  Remove Button */}
            {!readOnly && (
              <MercoaButton
                isEmphasized={false}
                size="sm"
                hideOutline
                type="button"
                color="gray"
                onClick={() => {
                  removeItem(lineItemIndex)
                }}
                className="mercoa-ml-1"
              >
                <XCircleIcon className="mercoa-size-5 hover:mercoa-opacity-75" />
                <span className="mercoa-sr-only">Remove Line Item</span>
              </MercoaButton>
            )}
          </div>
          <div className={`mercoa-grid ${filteredMetadata.length > 1 ? 'mercoa-grid-cols-2' : 'mercoa-grid-cols-1'}`}>
            {filteredMetadata.map((schema) => (
              <MetadataSelection
                schema={schema}
                lineItem
                key={schema.key}
                readOnly={readOnly}
                field={
                  schema.key === 'glAccountId'
                    ? `lineItems[${lineItemIndex}].${schema.key}`
                    : `lineItems[${lineItemIndex}].metadata.${schema.key}`
                }
              />
            ))}
          </div>
          {lineItems.length - 1 === lineItemIndex && (
            <div className="mercoa-border-b mercoa-border-gray-900/10 mercoa-my-4" />
          )}
        </Fragment>
      ))}
    </>
  )
}
