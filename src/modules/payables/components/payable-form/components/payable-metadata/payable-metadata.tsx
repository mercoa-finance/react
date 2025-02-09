import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from '../../../../../../components'
import { usePayableDetailsContext } from '../../../../providers/payables-detail-provider'
import { MetadataSelection } from './metadata-selection'

export function PayableMetadata({ skipValidation, readOnly }: { skipValidation?: boolean; readOnly?: boolean }) {

  const { formMethods, metadataSchemas } = usePayableDetailsContext()
  const { watch } = formMethods
  const status = watch('status')

  readOnly = readOnly || (!!status && status !== Mercoa.InvoiceStatus.Draft)

  return (
    <div className="mercoa-col-span-full mercoa-grid-cols-1 mercoa-gap-4 mercoa-hidden has-[div]:mercoa-grid ">
      <label className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-700">
        Additional Invoice Details
      </label>
      {metadataSchemas?.map((schema) => (
        <MetadataSelection
          readOnly={readOnly}
          key={schema.key}
          schema={schema}
          skipValidation={skipValidation}
          field={'metadata.' + schema.key}
        />
      ))}
    </div>
  )
}
