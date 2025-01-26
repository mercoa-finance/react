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

const moovCssVariables: { [key: string]: string } = {
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
  entityId,
}: {
  onSubmit: (data: Mercoa.PaymentMethodResponse.Card) => void
  title?: ReactNode
  actions?: ReactNode
  entityId?: Mercoa.EntityId
}) {
  const mercoaSession = useMercoaSession()

  const [moovScriptLoaded, setMoovScriptLoaded] = useState(false)
  const [moovToken, setMoovToken] = useState<Mercoa.CardLinkTokenResponse | null>(null)

  const entityIdFinal = entityId ?? mercoaSession.entityId

  const cardInput = document.querySelector("[id^='moov-card-link']") as HTMLFormElement

  useEffect(() => {
    if (window && document) {
      if (document.getElementById('moov-script')) {
        setMoovScriptLoaded(true)
        return
      }
      const root = document.documentElement
      for (let variable in moovCssVariables) root.style.setProperty(variable, moovCssVariables[variable])
      const script = document.createElement('script')
      const body = document.getElementsByTagName('body')[0]
      script.src = 'https://js.moov.io/v1'
      script.id = 'moov-script'
      body.appendChild(script)
      script.addEventListener('load', () => {
        setMoovScriptLoaded(true)
      })
    }
  }, [])

  useEffect(() => {
    if (!entityIdFinal || !mercoaSession.client) return
    mercoaSession.client?.entity.paymentMethod.cardLinkToken(entityIdFinal).then((resp) => {
      setMoovToken(resp)
    })
  }, [mercoaSession, entityIdFinal])

  useEffect(() => {
    if (!entityIdFinal || !moovToken || !moovScriptLoaded || !cardInput) return

    const { token, accountId } = moovToken

    cardInput.setAttribute('oauth-token', token)
    cardInput.setAttribute('account-id', accountId)

    const successCallback = async (card: {
      cardType: Mercoa.CardType
      brand: string
      lastFourCardNumber: string
      expiration: { month: string; year: string }
      cardID: string
    }) => {
      const resp = await mercoaSession.client?.entity.paymentMethod.create(entityIdFinal, {
        type: 'card',
        cardType: card.cardType,
        cardBrand: card.brand.replace(' ', '') as Mercoa.CardBrand,
        lastFour: card.lastFourCardNumber,
        expMonth: card.expiration.month,
        expYear: card.expiration.year,
        token: card.cardID,
      })
      if (!resp) {
        throw new Error('Failed to create payment method')
      }
      onSubmit(resp as Mercoa.PaymentMethodResponse.Card)
      mercoaSession.refresh()
    }

    // @ts-ignore
    cardInput.onSuccess = successCallback
  }, [entityIdFinal, moovToken, moovScriptLoaded, cardInput])

  if (!mercoaSession.client) return <NoSession componentName="AddCreditCard" />
  return (
    <div className="mercoa-space-y-3 mercoa-text-left">
      {title || (
        <h3 className="mercoa-text-center mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900">
          Add Card
        </h3>
      )}
      {moovScriptLoaded && (
        <div className="mercoa-flex mercoa-items-center mercoa-justify-center mercoa-space-x-2">
          {/* @ts-ignore */}
          <moov-card-link />
          <MercoaButton
            isEmphasized
            onClick={() => {
              const cardInput = document.querySelector("[id^='moov-card-link']") as HTMLFormElement
              cardInput.submit()
            }}
          >
            Add
          </MercoaButton>
        </div>
      )}
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

export function AddCardButton({
  entityId,
  onSelect,
  card,
}: {
  entityId?: Mercoa.EntityId
  onSelect?: Function
  card?: Mercoa.PaymentMethodResponse.Card
}) {
  const [showDialog, setShowDialog] = useState(false)

  const onClose = (account?: Mercoa.PaymentMethodResponse) => {
    setShowDialog(false)
    if (onSelect && account) onSelect(account)
  }

  return (
    <div>
      <AddDialog
        show={showDialog}
        onClose={onClose}
        component={
          <AddCard
            onSubmit={(data) => {
              onClose(data)
            }}
            entityId={entityId}
          />
        }
      />
      <Card onSelect={() => setShowDialog(true)} />
    </div>
  )
}
