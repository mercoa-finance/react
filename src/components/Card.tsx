import { CreditCardIcon, PlusIcon } from '@heroicons/react/24/outline'
import { ReactNode, useEffect, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { capitalize } from '../lib/lib'
import {
  AddDialog,
  DefaultPaymentMethodIndicator,
  LoadingSpinnerIcon,
  MercoaButton,
  NoSession,
  PaymentMethodButton,
  PaymentMethodList,
  useMercoaSession,
} from './index'

export function Cards({
  children,
  onSelect,
  showAdd,
  showEdit,
  showDelete,
  hideIndicators,
}: {
  children?: Function
  onSelect?: (value?: Mercoa.PaymentMethodResponse.Card) => void
  showAdd?: boolean
  showEdit?: boolean
  showDelete?: boolean
  hideIndicators?: boolean
}) {
  const [cards, setCards] = useState<Array<Mercoa.PaymentMethodResponse.Card>>()
  const [showDialog, setShowDialog] = useState(false)

  const mercoaSession = useMercoaSession()
  useEffect(() => {
    if (mercoaSession.token && mercoaSession.entity?.id) {
      mercoaSession.client?.entity.paymentMethod.getAll(mercoaSession.entity?.id, { type: 'card' }).then((resp) => {
        setCards(
          resp
            .filter((e) => {
              return e
            })
            .map((e) => e as Mercoa.PaymentMethodResponse.Card),
        )
      })
    }
  }, [mercoaSession.entity?.id, mercoaSession.token, showDialog, mercoaSession.refreshId])

  const onClose = (account: Mercoa.PaymentMethodResponse.Card) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  if (!mercoaSession.client) return <NoSession componentName="CreditCards" />

  if (children) return children({ bankAccounts: cards })
  else {
    return (
      <>
        {!cards && (
          <div className="mercoa-p-9 mercoa-text-center">
            <LoadingSpinnerIcon />
          </div>
        )}
        <PaymentMethodList
          accounts={cards}
          showDelete={showDelete || showEdit}
          addAccount={
            cards && showAdd ? (
              <div>
                <AddDialog
                  show={showDialog}
                  onClose={onClose}
                  component={
                    <AddCard
                      onSubmit={(data: Mercoa.PaymentMethodResponse.Card) => {
                        onClose(data)
                      }}
                    />
                  }
                />
                <Card onSelect={() => setShowDialog(true)} />
              </div>
            ) : undefined
          }
          formatAccount={(account: Mercoa.PaymentMethodResponse.Card) => (
            <Card account={account} onSelect={onSelect} showEdit={showEdit} hideDefaultIndicator={hideIndicators} />
          )}
        />
      </>
    )
  }
}

export function AddCard({
  onSubmit,
  title,
  actions,
}: {
  onSubmit: (data: Mercoa.PaymentMethodResponse.Card) => void
  title?: ReactNode
  actions?: ReactNode
}) {
  const mercoaSession = useMercoaSession()

  // useEffect(() => {
  //   if (!mercoaSession.entityId || !mercoaSession.moovToken || !mercoaSession.moovAccountId) return

  //   const root = document.documentElement
  //   for (let variable in moovCssVariables) root.style.setProperty(variable, moovCssVariables[variable])

  //   const cardInput = document.querySelector('moov-card-link')
  //   if (!cardInput) return

  //   cardInput.setAttribute('oauth-token', mercoaSession.moovToken)
  //   cardInput.setAttribute('account-id', mercoaSession.moovAccountId)

  //   const successCallback = async (card: {
  //     cardType: Mercoa.CardType
  //     brand: string
  //     lastFourCardNumber: string
  //     expiration: { month: string; year: string }
  //     cardID: string
  //   }) => {
  //     const resp = await mercoaSession.client?.entity.paymentMethod.create(mercoaSession?.entityId ?? '', {
  //       type: 'card',
  //       cardType: card.cardType,
  //       cardBrand: card.brand.replace(' ', '') as Mercoa.CardBrand,
  //       lastFour: card.lastFourCardNumber,
  //       expMonth: card.expiration.month,
  //       expYear: card.expiration.year,
  //       token: card.cardID,
  //     })
  //     if (!resp) {
  //       throw new Error('Failed to create payment method')
  //     }
  //     onSubmit(resp as Mercoa.PaymentMethodResponse.Card)
  //   }

  //   // @ts-ignore
  //   cardInput.onSuccess = successCallback
  // }, [mercoaSession.moovToken, mercoaSession.moovAccountId, mercoaSession.entityId])

  if (!mercoaSession.client) return <NoSession componentName="AddCreditCard" />
  return (
    <div className="mercoa-space-y-3 mercoa-text-left">
      {title || (
        <h3 className="mercoa-text-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          Add Card
        </h3>
      )}
      <div className="mercoa-flex mercoa-items-center mercoa-justify-center">
        {/* @ts-ignore */}
        <MercoaButton
          isEmphasized
          onClick={() => {
            //const cardInput = document.querySelector('moov-card-link')
            // @ts-ignore
            //cardInput.submit()
          }}
        >
          Add
        </MercoaButton>
      </div>
      {actions && <div className="mercoa-flex mercoa-justify-between">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  account,
  onSelect,
  showEdit,
  selected,
  hideDefaultIndicator,
}: {
  children?: Function
  account?: Mercoa.PaymentMethodResponse.Card
  onSelect?: (value?: Mercoa.PaymentMethodResponse.Card) => void
  selected?: boolean
  showEdit?: boolean
  hideDefaultIndicator?: boolean
}) {
  const mercoaSession = useMercoaSession()

  if (!mercoaSession.client) return <NoSession componentName="CreditCardComponent" />

  if (!mercoaSession.organization?.paymentMethods?.payerPayments?.find((e) => e.type === 'card' && e.active))
    return <></>

  let brand = account?.cardBrand as any
  if (brand === 'AmericanExpress') brand = 'Amex'

  if (account) {
    return (
      <div className={account.frozen ? 'mercoa-line-through pointer-events-none' : ''}>
        <div
          onClick={() => {
            if (onSelect) onSelect(account)
          }}
          key={`${account?.id}`}
          className={`mercoa-relative mercoa-flex mercoa-items-center mercoa-space-x-3 mercoa-rounded-mercoa mercoa-border ${
            selected ? 'mercoa-border-gray-600' : 'mercoa-border-gray-300'
          } mercoa-bg-white mercoa-px-6 mercoa-py-5 mercoa-shadow-sm focus-within:mercoa-ring-2 focus-within:mercoa-ring-mercoa-primary focus-within:mercoa-ring-offset-2 ${
            onSelect ? 'mercoa-cursor-pointer  hover:mercoa-border-gray-400' : ''
          }`}
        >
          <div
            className={`mercoa-flex-shrink-0 mercoa-rounded-full mercoa-p-1 ${
              selected
                ? 'mercoa-text-mercoa-primary-text-invert mercoa-bg-mercoa-primary-light'
                : 'mercoa-bg-gray-200 mercoa-text-gray-600'
            }`}
          >
            <CreditCardIcon className="mercoa-size-5" />
          </div>
          <div className="mercoa-flex mercoa-min-w-0 mercoa-flex-1 mercoa-justify-between">
            <div>
              {!showEdit && <span className="mercoa-absolute mercoa-inset-0" aria-hidden="true" />}
              <p
                className={`mercoa-text-sm mercoa-font-medium mercoa-text-gray-900 ${
                  selected ? 'mercoa-underline' : ''
                }`}
              >{`${capitalize(brand)} ••••${account?.lastFour}`}</p>
            </div>
          </div>
          {showEdit && (
            <>
              {!hideDefaultIndicator && (
                <div className="mercoa-flex">
                  <DefaultPaymentMethodIndicator paymentMethod={account} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  } else {
    return (
      <PaymentMethodButton
        onSelect={onSelect}
        account={account}
        selected={selected}
        icon={<PlusIcon className="mercoa-size-5" />}
        text="Add new card"
      />
    )
  }
}
