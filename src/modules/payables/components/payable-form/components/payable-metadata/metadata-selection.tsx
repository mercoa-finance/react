import { useEffect, useMemo, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { MercoaCombobox, MercoaInput, useMercoaSession, usePayableDetails } from '../../../../../../components'
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
  const { formContextValue } = usePayableDetails()
  const { formMethods, metadataContextValue } = formContextValue
  const { getSchemaMetadataValues } = metadataContextValue

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
  setValue: (e: string | string[]) => void
  value?: string | string[]
  values: string[]
  readOnly: boolean
}) {

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


  const valueState = useMemo(() => {
    if (!value) return undefined

    if (schema.type === Mercoa.MetadataType.KeyValue) {
      if (schema.allowMultiple) {
        const selectedValues = (value as string[]).map((key) => {
          const foundValue = (options as { value: { key: string } }[]).find((option) => option.value.key === key)?.value
          return foundValue
        })
        return selectedValues
      } else {
        const foundValue = (options as { value: { key: string } }[]).find((option) => option.value.key === value)?.value
        return foundValue
      }
    } else {
      let comboboxValue: string | string[] | undefined = value

      if (schema.allowMultiple) {
        if (Array.isArray(value)) comboboxValue = value
        else comboboxValue = value?.split(',')
      }

      return comboboxValue
    }
  }, [value, values, schema, options])


  if (schema.type === Mercoa.MetadataType.KeyValue) {
    return (
      <MercoaCombobox
        options={options}
        onChange={(value) => {
          if (Array.isArray(value)) {
            const finalValue = value.map((e: any) => {
              return e?.key
            })
            setValue(JSON.stringify(finalValue))
          } else {
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
        if (Array.isArray(value)) {
          const finalValue = value.includes(undefined) ? '[]' : JSON.stringify(value)
          setValue(finalValue)
        } else {
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
