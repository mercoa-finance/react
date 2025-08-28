import { XCircleIcon } from '@heroicons/react/24/outline'
import useResizeObserver from '@react-hook/resize-observer'
import accounting from 'accounting'
import { useLayoutEffect, useRef, useState } from 'react'
import { Control, useFieldArray, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { MercoaButton, MercoaInput } from '../../../../../components'
import { currencyCodeToSymbol } from '../../../../../lib/currency'

// Custom hook for tracking element width
function useWidth(target: any) {
  const [width, setWidth] = useState<number>(0)

  useLayoutEffect(() => {
    if (target.current) {
      setWidth(target.current.getBoundingClientRect().width)
    }
  }, [target])

  useResizeObserver(target, (entry: any) => setWidth(entry.contentRect.width))
  return width
}

interface LineItemsProps {
  control: Control<any>
  register: UseFormRegister<any>
  setValue: UseFormSetValue<any>
  watch: UseFormWatch<any>
  notDraft: boolean
  currency: string
}

export function LineItems({ control, register, setValue, watch, notDraft, currency }: LineItemsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  })

  const wrapperDiv = useRef(null)
  const width = useWidth(wrapperDiv)

  // Line items responsive grid - more granular for better mobile experience
  let nameCol = 'mercoa-col-span-6'
  let priceCol = 'mercoa-col-span-3'
  let quantityCol = 'mercoa-col-span-3'
  if (width && width > 370) {
    nameCol = 'mercoa-col-span-3'
    priceCol = 'mercoa-col-span-2'
    quantityCol = 'mercoa-col-span-1'
  }

  return (
    <div>
      <div className="mercoa-mt-6 mercoa-flex mercoa-items-center mercoa-justify-between">
        <h3 className="mercoa-text-lg mercoa-font-semibold mercoa-text-gray-900">Line Items</h3>
        {!notDraft && (
          <MercoaButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                id: 'new',
                description: '',
                quantity: 1,
                unitPrice: 0,
                amount: 0,
                currency: 'USD',
                createdAt: new Date(),
                updatedAt: new Date(),
                showDescription: false,
              })
            }
          >
            + Add Item
          </MercoaButton>
        )}
      </div>

      {fields.length === 0 ? (
        <div
          className="mercoa-mt-4 mercoa-text-center mercoa-py-8 mercoa-px-4 mercoa-border-2 mercoa-border-dashed mercoa-border-gray-300 mercoa-rounded-lg mercoa-cursor-pointer hover:mercoa-border-gray-400 hover:mercoa-bg-gray-50 mercoa-transition-colors"
          onClick={() => {
            if (!notDraft) {
              append({
                id: 'new',
                description: '',
                quantity: 1,
                unitPrice: 0,
                amount: 0,
                currency: 'USD',
                createdAt: new Date(),
                updatedAt: new Date(),
                showDescription: false,
              })
            }
          }}
        >
          <p className="mercoa-text-gray-500 mercoa-text-sm">No line items added yet</p>
          <p className="mercoa-text-gray-400 mercoa-text-xs mercoa-mt-1">
            {!notDraft ? 'Click here or "Add Item" to get started' : 'Click "Add Item" to get started'}
          </p>
        </div>
      ) : (
        <div className="mercoa-mt-4 mercoa-space-y-3">
          {/* Line Items */}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mercoa-bg-white mercoa-border mercoa-border-gray-200 mercoa-rounded-lg mercoa-p-4 mercoa-shadow-sm mercoa-relative"
            >
              {/* Delete button in upper right corner */}
              {!notDraft && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mercoa-absolute mercoa-top-1 mercoa-right-1 mercoa-p-1 mercoa-text-gray-400 hover:mercoa-text-red-500 hover:mercoa-bg-red-50 mercoa-rounded-full mercoa-transition-colors"
                >
                  <XCircleIcon className="mercoa-w-5 mercoa-h-5" />
                </button>
              )}

              <div className={`mercoa-grid mercoa-grid-cols-6 mercoa-gap-3 mercoa-items-start`} ref={wrapperDiv}>
                {/* Item Name - Responsive width */}
                <div className={nameCol}>
                  <MercoaInput
                    name={`lineItems.${index}.name`}
                    label="Item Name"
                    placeholder="Enter item name"
                    type="text"
                    register={register}
                    readOnly={notDraft}
                    labelClassName="mercoa-text-xs mercoa-text-gray-700"
                  />
                </div>

                {/* Unit Price - Responsive width */}
                <div className={priceCol}>
                  <MercoaInput
                    name={`lineItems.${index}.unitPrice`}
                    label="Unit Price"
                    placeholder="0.00"
                    type="currency"
                    control={control}
                    readOnly={notDraft}
                    leadingIcon={
                      <span className="mercoa-text-gray-500 mercoa-text-sm">{currencyCodeToSymbol(currency)}</span>
                    }
                    labelClassName="mercoa-text-xs mercoa-text-gray-700"
                  />
                </div>

                {/* Quantity - Responsive width */}
                <div className={quantityCol}>
                  <MercoaInput
                    name={`lineItems.${index}.quantity`}
                    label="Qty"
                    placeholder="1"
                    type="number"
                    step="any"
                    register={register}
                    readOnly={notDraft}
                    labelClassName="mercoa-text-xs mercoa-text-gray-700"
                  />
                </div>
              </div>

              {/* Description and Total Section - Same line */}
              <div className="mercoa-mt-3 mercoa-flex mercoa-items-center mercoa-justify-between">
                {/* Description Section - Left side */}
                <div className="mercoa-flex-1 mercoa-min-w-0">
                  {watch(`lineItems.${index}.showDescription`) ? (
                    <>
                      <div className="mercoa-min-w-[200px]">
                        <MercoaInput
                          name={`lineItems.${index}.description`}
                          label="Description"
                          placeholder="Enter item description"
                          type="text"
                          register={register}
                          labelClassName="mercoa-text-xs mercoa-text-gray-700"
                        />
                      </div>
                      {!notDraft && (
                        <button
                          type="button"
                          onClick={() => {
                            setValue(`lineItems.${index}.showDescription`, false)
                            setValue(`lineItems.${index}.description`, '')
                          }}
                          className="mercoa-text-xs mercoa-text-gray-500 hover:mercoa-text-gray-700 hover:mercoa-underline mercoa-whitespace-nowrap mercoa-ml-1"
                        >
                          Remove Description
                        </button>
                      )}
                    </>
                  ) : (
                    !notDraft && (
                      <button
                        type="button"
                        onClick={() => setValue(`lineItems.${index}.showDescription`, true)}
                        className="mercoa-text-xs mercoa-text-gray-500 hover:mercoa-text-gray-700 hover:mercoa-underline mercoa-whitespace-nowrap"
                      >
                        + Add description
                      </button>
                    )
                  )}
                </div>

                {/* Total Amount - Always right-aligned */}
                <div className="mercoa-flex-shrink-0 mercoa-text-right mercoa-ml-4">
                  <label className="mercoa-block mercoa-text-xs mercoa-font-medium mercoa-text-gray-700 mercoa-mb-1">
                    Item Total
                  </label>
                  <div className="mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900">
                    {accounting.formatMoney(watch(`lineItems.${index}.amount`) || 0, currencyCodeToSymbol(currency))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
