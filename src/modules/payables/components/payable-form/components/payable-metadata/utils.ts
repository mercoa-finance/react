import { Mercoa } from '@mercoa/javascript'
const dJSON = require('dirty-json')

export function filterMetadataValues(entityMetadata: string[], schema: Mercoa.MetadataSchema) {
  if (entityMetadata) {
    if (schema.type === Mercoa.MetadataType.KeyValue) {
      entityMetadata = entityMetadata.map((e) => {
        try {
          const parsedValue = dJSON.parse(e) as {
            key: string
            value:
              | string
              | {
                  title?: string
                  subtitle?: string
                  value: string
                }
          }
          if (parsedValue.key && parsedValue.value) {
            return JSON.stringify(parsedValue)
          }
        } catch (e) {
          console.error(e)
        }
        return ''
      })
    }
    entityMetadata = entityMetadata.filter((e) => e)
    if (entityMetadata?.length === 0) {
      return undefined
    } else {
      return entityMetadata
    }
  }
}

export function showMetadata({
  schema,
  hasDocument,
  hasNoLineItems,
  entityMetadata,
  lineItem,
  paymentDestinationType,
  paymentSourceType,
}: {
  schema: Mercoa.MetadataSchema
  hasDocument: boolean
  hasNoLineItems: boolean
  entityMetadata?: string[]
  lineItem?: boolean
  paymentDestinationType?: Mercoa.PaymentMethodType
  paymentSourceType?: Mercoa.PaymentMethodType
}) {
  if (schema.showConditions?.hasDocument && !hasDocument) {
    return false
  }

  if (schema.showConditions?.hasNoLineItems && !hasNoLineItems) {
    return false
  }

  if (schema.type === Mercoa.MetadataType.KeyValue && (!entityMetadata || entityMetadata.length === 0)) {
    return false
  }

  if (schema.showConditions?.hasOptions && (!entityMetadata || entityMetadata.length === 0)) {
    return false
  }

  if (schema.lineItem && !lineItem) {
    return false
  }

  if (schema.showConditions?.paymentDestinationTypes && schema.showConditions.paymentDestinationTypes.length > 0) {
    if (!paymentDestinationType) return false
    if (schema.showConditions.paymentDestinationTypes.includes('custom')) {
      if (!paymentDestinationType.startsWith('cpms_')) return false
      if (!schema.showConditions?.paymentDestinationCustomSchemaIds?.includes(paymentDestinationType)) return false
    } else if (!schema.showConditions.paymentDestinationTypes.includes(paymentDestinationType)) {
      return false
    }
  }

  if (schema.showConditions?.paymentSourceTypes && schema.showConditions.paymentSourceTypes.length > 0) {
    if (!paymentSourceType) return false
    if (schema.showConditions.paymentSourceTypes.includes('custom')) {
      if (!paymentSourceType.startsWith('cpms_')) return false
      if (!schema.showConditions?.paymentSourceCustomSchemaIds?.includes(paymentSourceType)) return false
    } else if (!schema.showConditions.paymentSourceTypes.includes(paymentSourceType)) {
      return false
    }
  }

  return true
}
