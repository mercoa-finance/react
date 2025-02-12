import { useEffect, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { MercoaCombobox, MercoaInput, useMercoaSession } from '../../../../../../components'
import { usePayableDetailsContext } from '../../../../providers/payables-detail-provider'
import { showMetadata } from '../../utils'

export function MetadataSelection({
  schema,
  field,
  skipValidation,
  readOnly,
  lineItem,
  hideLabel,
  renderCustom,
}: {
  schema: Mercoa.MetadataSchema
  field: string
  skipValidation?: boolean
  readOnly?: boolean
  lineItem?: boolean
  hideLabel?: boolean
  renderCustom?: {
    metadataCombobox: (props: {
      schema: Mercoa.MetadataSchema
      setValue: (value: string) => void
      value: string
      values: string[]
    }) => JSX.Element
  }
}) {
  const mercoaSession = useMercoaSession()
  const { formMethods, getSchemaMetadataValues } = usePayableDetailsContext()

  const [entityMetadata, setEntityMetadata] = useState<string[]>()

  const { watch, register, setValue, control } = formMethods

  const hasDocument = watch('hasDocuments')
  const paymentDestinationType = watch('paymentDestinationType')
  const paymentSourceType = watch('paymentSourceType')
  const lineItems = watch('lineItems')

  useEffect(() => {
    if (!mercoaSession.entityId) return
    getSchemaMetadataValues(schema).then((e) => {
      setEntityMetadata(e)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mercoaSession.entityId, schema.key])

  if (
    !skipValidation &&
    !showMetadata({
      schema,
      entityMetadata,
      hasDocument,
      hasNoLineItems: lineItems.length === 0,
      paymentDestinationType,
      paymentSourceType,
      lineItem,
    })
  ) {
    return null
  }

  return (
    <div>
      {!hideLabel && (
        <h3 className="mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          {schema.displayName}
        </h3>
      )}
      <>
        {((!entityMetadata && schema.type === Mercoa.MetadataType.String) ||
          schema.type === Mercoa.MetadataType.Number) && (
          <MercoaInput
            readOnly={readOnly}
            type={schema.type === Mercoa.MetadataType.Number ? 'number' : 'text'}
            name={field}
            register={register}
          />
        )}
        {entityMetadata &&
          (schema.type === Mercoa.MetadataType.String || schema.type === Mercoa.MetadataType.KeyValue) &&
          (entityMetadata.length > 0 ? (
            <>
              {renderCustom?.metadataCombobox ? (
                renderCustom.metadataCombobox({
                  schema: schema,
                  value: watch(field),
                  setValue: (e) => {
                    setValue(field, e)
                  },
                  values: entityMetadata,
                })
              ) : (
                <>
                  <MetadataCombobox
                    schema={schema}
                    values={entityMetadata}
                    value={watch(field)}
                    setValue={(e) => {
                      setValue(field, e)
                    }}
                    readOnly={readOnly ?? false}
                  />
                </>
              )}
            </>
          ) : (
            <>No Options Available</>
          ))}
        {schema.type === Mercoa.MetadataType.Boolean && (
          <MetadataBoolean
            value={watch(field)}
            setValue={(e) => {
              setValue(field, e)
            }}
            readOnly={readOnly}
          />
        )}
        {schema.type === Mercoa.MetadataType.Date && (
          <MercoaInput
            name={field}
            type="date"
            readOnly={readOnly}
            className="md:mercoa-col-span-1 mercoa-col-span-full"
            control={control}
          />
        )}
      </>
    </div>
  )
}

function MetadataCombobox({
  schema,
  setValue,
  value,
  values,
  readOnly = false,
}: {
  schema: Mercoa.MetadataSchema
  setValue: (e: string) => void
  value?: string
  values: string[]
  readOnly: boolean
}) {
  const mercoaSession = useMercoaSession()
  const valueState = useMemo(() => {
    if (!value) return undefined

    if (schema.type === Mercoa.MetadataType.KeyValue) {
      if (schema.allowMultiple) {
        const parsedValue = (value ? JSON.parse(value) : []) as Array<any>
        // Handle multiple key-value pairs
        if (mercoaSession.debug) {
          console.log('inside:parsedValue', parsedValue)
        }
        const parsedValues = parsedValue.map((val) => {
          if (mercoaSession.debug) {
            console.log('inside:val2', val)
          }
          const foundValue = JSON.parse(
            values.find((e) => {
              let parsedValue = { key: '' }
              try {
                parsedValue = JSON.parse(e) as { key: string }
                parsedValue.key = `${parsedValue.key}`
              } catch (e) {
                console.error(e)
              }
              return parsedValue?.key === `${val}`
            }) ?? '{}',
          ) as any
          if (mercoaSession.debug) {
            console.log('inside:foundValue', foundValue)
          }
          try {
            const valueParsed = JSON.parse(foundValue.value) as { value: string; title?: string; subtitle?: string }
            if (valueParsed.value) {
              foundValue.value = valueParsed.title ?? valueParsed.value
            }
          } catch (e) {}

          if (mercoaSession.debug) {
            console.log('inside:foundValue2', foundValue)
          }
          return foundValue.value ? foundValue.value : foundValue
        })

        if (mercoaSession.debug) {
          console.log('inside:parsedValues', parsedValues)
        }
        return parsedValues
      } else {
        const foundValue = JSON.parse(
          values.find((e) => {
            let parsedValue = { key: '' }
            try {
              parsedValue = JSON.parse(e) as { key: string }
              parsedValue.key = `${parsedValue.key}`
            } catch (e) {
              console.error(e)
            }
            return parsedValue?.key === `${value ?? ''}`
          }) ?? '{}',
        ) as any

        try {
          const valueParsed = JSON.parse(foundValue.value) as { value: string; title?: string; subtitle?: string }
          if (valueParsed.value) {
            foundValue.value = valueParsed.title ?? valueParsed.value
          }
        } catch (e) {}

        return foundValue.value ? foundValue.value : foundValue
      }
    } else {
      let comboboxValue: string | string[] | undefined = value

      if (schema.allowMultiple) {
        // Metadata is stored as a comma separated string, but comboboxes expect an array
        if (Array.isArray(value)) comboboxValue = value
        else comboboxValue = value?.split(',')
      }

      return comboboxValue
    }
  }, [value, values, schema])

  const options = useMemo(() => {
    if (schema.type === Mercoa.MetadataType.KeyValue) {
      return values.map((value) => {
        let parsedValue = {
          key: '',
          value: '' as any,
          subtitle: '' as any,
        }
        try {
          parsedValue = JSON.parse(value) as { key: string; value: string; subtitle: string }
          parsedValue.key = `${parsedValue.key}`
          try {
            const value = parsedValue.value.value
              ? parsedValue.value
              : (JSON.parse(parsedValue.value) as {
                  value: string
                  title?: string
                  subtitle?: string
                })
            if (value.value) {
              parsedValue.value = value.title ?? value.value
              parsedValue.subtitle = value.subtitle
            } else {
              parsedValue.value = `${parsedValue.value}`
            }
          } catch (e) {
            parsedValue.value = `${parsedValue.value}`
          }
        } catch (e) {
          console.error(e)
        }
        return { value: parsedValue, disabled: false }
      })
    } else {
      return values.map((value) => {
        return { value: value, disabled: false }
      })
    }
  }, [values, schema.type])

  if (mercoaSession.debug) {
    console.log('outside:value', values, options, value, valueState)
  }

  if (schema.type === Mercoa.MetadataType.KeyValue) {
    return (
      <MercoaCombobox
        options={options}
        onChange={(value) => {
          if (mercoaSession.debug) {
            console.log('valueKv', value)
          }
          if (Array.isArray(value)) {
            const finalValue = value.map((e: any) => {
              return e?.key
            })
            if (mercoaSession.debug) {
              console.log('valueKvfinalValue', finalValue)
            }
            setValue(JSON.stringify(finalValue))
          } else {
            if (mercoaSession.debug) {
              console.log('valueKv', value?.key)
            }
            setValue(value?.key)
          }
        }}
        showAllOptions
        displayIndex="value"
        secondaryDisplayIndex="subtitle"
        value={(() => {
          let finalValue
          try {
            finalValue = JSON.parse(valueState as string)
          } catch (e) {
            finalValue = valueState
          }
          if (mercoaSession.debug) {
            console.log('finalValue', finalValue)
          }
          return finalValue
        })()}
        multiple={schema.allowMultiple}
        displaySelectedAs="pill"
        showClear
        readOnly={readOnly}
      />
    )
  }
  return (
    <MercoaCombobox
      options={options}
      onChange={(value) => {
        if (mercoaSession.debug) {
          console.log('valueString', value)
        }
        if (Array.isArray(value)) {
          const finalValue = value.includes(undefined) ? '[]' : JSON.stringify(value)
          setValue(finalValue)
        } else {
          if (mercoaSession.debug) {
            console.log('valueString final', value)
          }
          setValue(value)
        }
      }}
      showAllOptions
      value={(() => {
        let finalValue
        try {
          finalValue = JSON.parse(valueState as string)
        } catch (e) {
          finalValue = valueState
        }
        return finalValue
      })()}
      multiple={schema.allowMultiple}
      freeText={!schema.allowMultiple}
      displaySelectedAs="pill"
      showClear
      readOnly={readOnly}
    />
  )
}

function MetadataBoolean({
  setValue,
  value,
  readOnly,
}: {
  setValue: (e: string) => void
  value?: string
  readOnly?: boolean
}) {
  console.log('valueBoolean', value)
  return (
    <div className="mercoa-space-y-4 sm:mercoa-flex sm:mercoa-items-center sm:mercoa-space-x-10 sm:mercoa-space-y-0">
      <div className="mercoa-flex mercoa-items-center">
        <input
          readOnly={readOnly}
          type="radio"
          checked={value === 'true'}
          className="mercoa-size-4 mercoa-border-gray-300 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary checked:mercoa-bg-mercoa-primary"
          onChange={() => setValue('true')}
        />
        <label className="mercoa-ml-3 mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          Yes
        </label>
      </div>

      <div className="mercoa-flex mercoa-items-center">
        <input
          readOnly={readOnly}
          type="radio"
          checked={value === 'false'}
          className="mercoa-size-4 mercoa-border-gray-300 mercoa-text-mercoa-primary focus:mercoa-ring-mercoa-primary checked:mercoa-bg-mercoa-primary"
          onChange={() => setValue('false')}
        />
        <label className="mercoa-ml-3 mercoa-block mercoa-text-sm mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          No
        </label>
      </div>
    </div>
  )
}
