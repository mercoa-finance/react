import { BuildingLibraryIcon, CreditCardIcon, EnvelopeIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { Fragment, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  AddBankViaPlaidOrManual,
  AddCheck,
  AddCustomPaymentMethod,
  BankAccount,
  Check,
  CustomPaymentMethod,
  LoadingSpinnerIcon,
  MercoaButton,
  NoSession,
  useMercoaSession,
} from './index'

export function DisbursementMethods({
  type,
  entity,
  onSelect,
  goToPreviousStep,
}: {
  type: 'payment' | 'disbursement'
  entity: Mercoa.EntityResponse
  onSelect: (method: Mercoa.PaymentMethodResponse) => void
  goToPreviousStep?: () => void
}) {
  const mercoaSession = useMercoaSession()

  const [selectedMethod, setSelectedMethod] = useState<Mercoa.PaymentRailResponse>()
  const [existingMethods, setExistingMethods] = useState<Array<Mercoa.PaymentMethodResponse>>()
  const [paymentMethodSchemas, setPaymentMethodSchemas] = useState<Array<Mercoa.CustomPaymentMethodSchemaResponse>>()

  // Get Payment Method Schemas
  useEffect(() => {
    if (type === 'payment') {
      if (
        !mercoaSession.organization?.paymentMethods?.payerPayments.filter(
          (e) => e.active && e.type === Mercoa.PaymentMethodType.Custom,
        ).length
      ) {
        setPaymentMethodSchemas([])
        return
      } else {
        mercoaSession.client?.customPaymentMethodSchema.getAll().then((resp) => {
          if (resp) setPaymentMethodSchemas(resp.filter((e) => e.isSource))
          else setPaymentMethodSchemas([])
        })
      }
    } else {
      if (
        !mercoaSession.organization?.paymentMethods?.vendorDisbursements.filter(
          (e) => e.active && e.type === Mercoa.PaymentMethodType.Custom,
        ).length
      ) {
        setPaymentMethodSchemas([])
        return
      } else {
        mercoaSession.client?.customPaymentMethodSchema.getAll().then((resp) => {
          if (resp) setPaymentMethodSchemas(resp.filter((e) => e.isDestination))
          else setPaymentMethodSchemas([])
        })
      }
    }
  }, [mercoaSession.organization?.paymentMethods?.vendorDisbursements, mercoaSession.refreshId, type])

  // Get Existing Payment Methods
  useEffect(() => {
    mercoaSession.client?.entity.paymentMethod.getAll(entity.id).then((resp) => {
      if (resp) setExistingMethods(resp)
      else setExistingMethods([])
    })
  }, [entity, mercoaSession.refreshId])

  if (!mercoaSession.client) return <NoSession componentName="DisbursementMethods" />
  return (
    <>
      {selectedMethod ? (
        <>
          <p className="mercoa-mb-4">
            {selectedMethod.type === Mercoa.PaymentMethodType.Custom
              ? paymentMethodSchemas?.find((e) => e.id === selectedMethod.name)?.name
              : selectedMethod.name}
          </p>
          <DisbursementMethodDetails />
        </>
      ) : (
        <>
          <p className="mercoa-mb-4">
            {' '}
            {type === 'disbursement' ? 'How would you like to get paid?' : 'Add Payment Method'}
          </p>
          <div className={`m-auto mercoa-grid  mercoa-grid-cols-1 mercoa-gap-4`}>
            {type === 'disbursement'
              ? mercoaSession.organization?.paymentMethods?.vendorDisbursements
                  .filter((e) => e.active)
                  .map((method) => <DisbursementMethod method={method} key={method.name} />)
              : mercoaSession.organization?.paymentMethods?.payerPayments
                  .filter((e) => e.active)
                  .map((method) => <DisbursementMethod method={method} key={method.name} />)}
          </div>
          {goToPreviousStep && (
            <div className="mercoa-mt-5 mercoa-flex sm:mercoa-mt-6">
              <MercoaButton isEmphasized={false} onClick={() => goToPreviousStep()} type="button" size="md">
                Back
              </MercoaButton>
            </div>
          )}
        </>
      )}
    </>
  )

  function DisbursementMethod({ method }: { method: Mercoa.PaymentRailResponse }) {
    let icon = <BuildingLibraryIcon className="mercoa-size-5" />
    if (method.type === Mercoa.PaymentMethodType.BankAccount) {
      icon = <BuildingLibraryIcon className="mercoa-size-5" />
    } else if (method.type === Mercoa.PaymentMethodType.Check) {
      icon = <EnvelopeIcon className="mercoa-size-5" />
    } else if (method.type === Mercoa.PaymentMethodType.VirtualCard) {
      icon = <CreditCardIcon className="mercoa-size-5" />
    } else if (method.type === Mercoa.PaymentMethodType.OffPlatform) {
      icon = <QuestionMarkCircleIcon className="mercoa-size-5" />
    }

    return (
      <button
        className="mercoa-cursor-pointer  mercoa-rounded-mercoa mercoa-border mercoa-border-gray-100 mercoa-bg-white mercoa-shadow-lg hover:mercoa-shadow-xl"
        onClick={async () => {
          if (method.type === Mercoa.PaymentMethodType.OffPlatform) {
            const pm = await mercoaSession.client?.entity.paymentMethod.create(entity.id, {
              type: Mercoa.PaymentMethodType.OffPlatform,
            })
            if (pm) {
              onSelect(pm)
            } else {
              toast.error('There was an issue adding your payment details. Please try again later.')
            }
          } else {
            setSelectedMethod(method)
          }
        }}
      >
        <div className="mercoa-px-4 mercoa-py-5 mercoa-text-center sm:mercoa-p-6">
          <p className="mercoa-flex mercoa-items-center mercoa-justify-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
            <div className="mercoa-mr-1 mercoa-flex-shrink-0 mercoa-rounded-full mercoa-bg-gray-200 mercoa-p-1 mercoa-text-gray-600">
              {icon}
            </div>
            {method.type === Mercoa.PaymentMethodType.Custom
              ? paymentMethodSchemas?.find((e) => e.id === method.name)?.name
              : method.name}
          </p>
          {/*<p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-500 mercoa-mt-2">{method.time}</p>*/}
          {/* <p className="mercoa-text-sm mercoa-font-medium mercoa-text-gray-500">{method.markup?.amount}</p>*/}
        </div>
      </button>
    )
  }

  function DisbursementMethodDetails() {
    const [selectedExisting, setSelectedExisting] = useState<Mercoa.PaymentMethodResponse | string>()

    if (typeof existingMethods === 'undefined') {
      return <LoadingSpinnerIcon />
    } else if (selectedExisting === 'new') {
      return <AddDisbursementMethod />
    } else if (existingMethods.filter((e) => e.type === selectedMethod?.type).length > 0) {
      return (
        <div className="mercoa-m-auto mercoa-w-96 mercoa-space-y-2 mercoa-text-left">
          <ExistingDisbursementMethod existingMethods={existingMethods} />
          <div className="mercoa-mt-5 mercoa-flex sm:mercoa-mt-6">
            <MercoaButton isEmphasized={false} onClick={() => setSelectedMethod(undefined)} type="button" size="md">
              Back
            </MercoaButton>
            <div className="mercoa-flex-1" />
            {selectedExisting && (
              <MercoaButton
                isEmphasized
                size="md"
                onClick={() => onSelect(selectedExisting as Mercoa.PaymentMethodResponse)}
              >
                Confirm
              </MercoaButton>
            )}
          </div>
        </div>
      )
    } else {
      return <AddDisbursementMethod />
    }

    function ExistingDisbursementMethod({ existingMethods }: { existingMethods: Array<Mercoa.PaymentMethodResponse> }) {
      return (
        <>
          {existingMethods
            .filter((e) => e.type === selectedMethod?.type)
            .map((method) => (
              <Fragment key={method.id}>
                {method.type === Mercoa.PaymentMethodType.BankAccount && (
                  <BankAccount
                    account={method}
                    onSelect={(e) => {
                      setSelectedExisting(e)
                    }}
                    selected={method.id === (selectedExisting as Mercoa.PaymentMethodResponse)?.id}
                  />
                )}
                {method.type === Mercoa.PaymentMethodType.Check && (
                  <Check
                    account={method}
                    onSelect={(e) => {
                      setSelectedExisting(e)
                    }}
                    selected={method.id === (selectedExisting as Mercoa.PaymentMethodResponse)?.id}
                  />
                )}
                {method.type === Mercoa.PaymentMethodType.Custom && method.schemaId === selectedMethod?.name && (
                  <CustomPaymentMethod
                    account={method}
                    onSelect={(e: Mercoa.PaymentMethodResponse) => {
                      setSelectedExisting(e)
                    }}
                    selected={method.id === (selectedExisting as Mercoa.PaymentMethodResponse)?.id}
                    schema={paymentMethodSchemas?.find((e) => e.id === selectedMethod?.name)}
                  />
                )}
              </Fragment>
            ))}
          {selectedMethod?.type === Mercoa.PaymentMethodType.BankAccount && (
            <BankAccount
              onSelect={() => {
                setSelectedExisting('new')
              }}
            />
          )}
          {selectedMethod?.type === Mercoa.PaymentMethodType.Check && (
            <Check
              onSelect={() => {
                setSelectedExisting('new')
              }}
            />
          )}
          {selectedMethod?.type === Mercoa.PaymentMethodType.Custom && (
            <CustomPaymentMethod
              onSelect={() => {
                setSelectedExisting('new')
              }}
              schema={paymentMethodSchemas?.find((e) => e.id === selectedMethod.name)}
            />
          )}
        </>
      )
    }
  }

  function AddDisbursementMethod() {
    async function onNewPMSubmit(data: Mercoa.PaymentMethodResponse) {
      if (data.id) {
        onSelect(data)
      } else {
        toast.error('There was an issue adding your payment details. Please try again later.')
      }
    }

    const actions = (
      <div className="mercoa-mt-5 mercoa-flex sm:mercoa-mt-6 mercoa-w-full">
        <MercoaButton isEmphasized={false} onClick={() => setSelectedMethod(undefined)} type="button" size="md">
          Back
        </MercoaButton>
        <div className="mercoa-flex-1" />
        <MercoaButton isEmphasized size="md">
          Confirm
        </MercoaButton>
      </div>
    )

    const schema = paymentMethodSchemas?.find((e) => e.id === selectedMethod?.name)

    return (
      <div className="mercoa-m-auto mercoa-w-96 mercoa-text-left">
        <div
          className="mercoa-mt-3 mercoa-rounded-mercoa mercoa-bg-white mercoa-p-5 mercoa-text-center mercoa-shadow-lg"
          style={{ minHeight: '300px' }}
        >
          {selectedMethod?.type === Mercoa.PaymentMethodType.BankAccount && (
            <AddBankViaPlaidOrManual title={<></>} actions={actions} onSubmit={onNewPMSubmit} />
          )}
          {selectedMethod?.type === Mercoa.PaymentMethodType.Check && (
            <AddCheck
              title={<></>}
              actions={actions}
              onSubmit={(e) => {
                if (e) onNewPMSubmit(e)
              }}
            />
          )}
          {schema && selectedMethod?.type === Mercoa.PaymentMethodType.Custom && (
            <AddCustomPaymentMethod title={<></>} actions={actions} onSubmit={onNewPMSubmit} schema={schema} />
          )}
        </div>
      </div>
    )
  }
}
