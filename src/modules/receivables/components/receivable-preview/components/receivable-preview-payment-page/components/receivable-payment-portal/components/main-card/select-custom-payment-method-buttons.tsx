import { Dispatch, SetStateAction, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import {
  AddCustomPaymentMethod,
  AddDialog,
  CustomPaymentMethod,
} from '../../../../../../../../../../components'
import { PaymentMethodList } from '../payment-method-list'

export function SelectCustomPaymentMethodButtonsV2({
  isPreview,
  schema,
  customPaymentMethods,
  setCustomPaymentMethods,
  selectedPaymentMethodId,
  setSelectedPaymentMethodId,
}: {
  isPreview?: boolean
  schema: Mercoa.CustomPaymentMethodSchemaResponse
  customPaymentMethods: Array<Mercoa.PaymentMethodResponse.Custom>
  setCustomPaymentMethods: Dispatch<SetStateAction<Mercoa.PaymentMethodResponse.Custom[]>>
  selectedPaymentMethodId: string | undefined
  setSelectedPaymentMethodId: Dispatch<SetStateAction<string | undefined>>
}) {
  const [showDialog, setShowDialog] = useState(false)

  const onClose = (account?: Mercoa.PaymentMethodResponse.Custom) => {
    setShowDialog(false)
    if (!account) return
    setCustomPaymentMethods((prev) => {
      if (prev.find((e) => e.id === account.id)) return prev
      return [...prev, account]
    })
    setSelectedPaymentMethodId(account.id)
  }

  const addAccountButton = isPreview ? (
    <CustomPaymentMethod schema={schema} />
  ) : (
    <div>
      <AddDialog
        show={showDialog}
        onClose={onClose}
        component={
          <AddCustomPaymentMethod
            schema={schema}
            onSubmit={(data?: Mercoa.PaymentMethodResponse.Custom) => {
              if (data) onClose(data)
            }}
          />
        }
      />
      <CustomPaymentMethod schema={schema} onSelect={() => setShowDialog(true)} />
    </div>
  )

  return (
    <PaymentMethodList
      accounts={customPaymentMethods}
      showDelete
      formatAccount={(account) => (
        <CustomPaymentMethod
          key={account.id}
          account={account}
          schema={schema}
          selected={account.id === selectedPaymentMethodId}
          onSelect={() => {
            setSelectedPaymentMethodId(account.id)
          }}
          hideDefaultIndicator
        />
      )}
      addAccount={addAccountButton}
    />
  )
}
