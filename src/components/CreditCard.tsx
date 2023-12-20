import { CreditCardIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { ReactNode, useEffect, useState } from 'react'
import { capitalize } from '../lib/lib'
import { AddDialog, DefaultPaymentMethodIndicator, LoadingSpinnerIcon, useMercoaSession } from './index'

const moovCssVariables: any = {
  '--moov-color-background': '#FFFFFF',
  '--moov-color-background-secondary': '#F5F6F9',
  '--moov-color-background-tertiary': '#E7E7F1',
  '--moov-color-mercoa-primary': '#4A5CF5',
  '--moov-color-secondary': '#3D50EC',
  '--moov-color-tertiary': '#B9BBC3',
  '--moov-color-info': '#94CBFF',
  '--moov-color-warn': '#EB5757',
  '--moov-color-danger': '#EA0F43',
  '--moov-color-success': '#62E599',
  '--moov-color-low-contrast': '#5B5D6A',
  '--moov-color-medium-contrast': '#494A57',
  '--moov-color-high-contrast': '#000000',
  '--moov-color-graphic-1': '#3D50EC',
  '--moov-color-graphic-2': '#3D50EC',
  '--moov-color-graphic-3': '#3D50EC',
}

export function CreditCards({
  children,
  onSelect,
  showAdd,
  showEdit,
}: {
  children?: Function
  onSelect?: Function
  showAdd?: boolean
  showEdit?: boolean
}) {
  const [cards, setCards] = useState<Array<Mercoa.CardResponse>>()
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
            .map((e) => e as Mercoa.CardResponse),
        )
      })
    }
  }, [mercoaSession.entity?.id, mercoaSession.token, showDialog, mercoaSession.refreshId])

  const onClose = (account: Mercoa.PaymentMethodRequest) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  if (children) return children({ bankAccounts: cards })
  else {
    return (
      <>
        {!cards && (
          <div className="p-9 text-center">
            <LoadingSpinnerIcon />
          </div>
        )}
        {cards &&
          cards.map((account) => (
            <div className="mt-2" key={account.id}>
              <CreditCardComponent account={account} onSelect={onSelect} showEdit={showEdit} />
            </div>
          ))}
        {cards && showAdd && (
          <div className="mt-2">
            <AddDialog
              show={showDialog}
              onClose={onClose}
              component={
                <AddCreditCard
                  onSubmit={(data: Mercoa.PaymentMethodRequest) => {
                    onClose(data)
                  }}
                />
              }
            />
            <CreditCardComponent onSelect={() => setShowDialog(true)} />
          </div>
        )}
      </>
    )
  }
}

export function AddCreditCard({
  onSubmit,
  title,
  actions,
}: {
  onSubmit?: Function
  title?: ReactNode
  actions?: ReactNode
}) {
  const mercoaSession = useMercoaSession()

  useEffect(() => {
    if (!mercoaSession.entityId || !mercoaSession.moovToken || !mercoaSession.moovAccountId) return

    const root = document.documentElement
    for (let variable in moovCssVariables) root.style.setProperty(variable, moovCssVariables[variable])

    const cardInput = document.querySelector('moov-card-link')
    if (!cardInput) return

    cardInput.setAttribute('oauth-token', mercoaSession.moovToken)
    cardInput.setAttribute('account-id', mercoaSession.moovAccountId)

    const successCallback = async (card: {
      cardType: Mercoa.CardType
      brand: string
      lastFourCardNumber: string
      expiration: { month: string; year: string }
      cardID: string
    }) => {
      const resp = mercoaSession.client?.entity.paymentMethod.create(mercoaSession?.entityId ?? '', {
        type: 'card',
        cardType: card.cardType,
        cardBrand: card.brand.replace(' ', '') as Mercoa.CardBrand,
        lastFour: card.lastFourCardNumber,
        expMonth: card.expiration.month,
        expYear: card.expiration.year,
        token: card.cardID,
      })
      if (!onSubmit) return
      if (resp) onSubmit(resp)
      else onSubmit()
    }

    // @ts-ignore
    cardInput.onSuccess = successCallback
  }, [mercoaSession.moovToken, mercoaSession.moovAccountId, mercoaSession.entityId])

  return (
    <div className="space-y-3 text-left">
      {title || <h3 className="text-center text-lg font-medium leading-6 text-gray-900">Add Card</h3>}
      <div className="flex items-center justify-center">
        {/* @ts-ignore */}
        <moov-card-link />
      </div>
      <div className="flex justify-between">
        {actions || (
          <button
            className="ml-3 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => {
              const cardInput = document.querySelector('moov-card-link')
              // @ts-ignore
              cardInput.submit()
            }}
          >
            Add
          </button>
        )}
      </div>
    </div>
  )
}

export function CreditCardComponent({
  children,
  account,
  onSelect,
  showEdit,
  selected,
}: {
  children?: Function
  account?: Mercoa.CardResponse
  onSelect?: Function
  selected?: boolean
  showEdit?: boolean
}) {
  const mercoaSession = useMercoaSession()

  if (!mercoaSession.organization?.paymentMethods?.payerPayments?.find((e) => e.type === 'card' && e.active))
    return <></>

  let brand = account?.cardBrand as any
  if (brand === 'AmericanExpress') brand = 'Amex'

  if (account) {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(account)
        }}
        key={`${account?.id}`}
        className={`relative flex items-center space-x-3 rounded-lg border ${
          selected ? 'border-indigo-300' : 'border-gray-300'
        } bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
          onSelect ? 'cursor-pointer hover:border-gray-400' : ''
        }`}
      >
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-1 text-gray-600">
          <CreditCardIcon className={`h-5 w-5 ${selected ? 'text-indigo-400' : ''}`} />
        </div>
        <div className="flex min-w-0 flex-1 justify-between">
          <div>
            {!showEdit && <span className="absolute inset-0" aria-hidden="true" />}
            <p className={`text-sm font-medium text-gray-900 ${selected ? 'underline' : ''}`}>{`${capitalize(
              brand,
            )} ••••${account?.lastFour}`}</p>
          </div>
        </div>
        {showEdit && (
          <div className="flex cursor-pointer">
            <DefaultPaymentMethodIndicator paymentMethod={account} />
          </div>
        )}
      </div>
    )
  } else {
    return (
      <div
        onClick={() => {
          if (onSelect) onSelect(account)
        }}
        className={`relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 ${
          onSelect ? 'cursor-pointer' : ''
        }`}
      >
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-1 text-gray-600">
          <PlusIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="absolute inset-0" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-900">Add new card</p>
          <p className="truncate text-sm text-gray-500"></p>
        </div>
      </div>
    )
  }
}
