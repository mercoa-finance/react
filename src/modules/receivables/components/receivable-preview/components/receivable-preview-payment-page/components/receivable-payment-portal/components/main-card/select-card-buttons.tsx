import { Dispatch, SetStateAction } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { AddCardButton, Card } from '../../../../../../../../../../components'
import { PaymentMethodList } from '../payment-method-list'

export function SelectCardButtonsV2({
  isPreview,
  cards,
  setCards,
  selectedPaymentMethodId,
  setSelectedPaymentMethodId,
}: {
  isPreview?: boolean
  cards: Array<Mercoa.PaymentMethodResponse.Card>
  setCards: Dispatch<SetStateAction<Mercoa.PaymentMethodResponse.Card[]>>
  selectedPaymentMethodId: string | undefined
  setSelectedPaymentMethodId: Dispatch<SetStateAction<string | undefined>>
}) {
  const addAccountButton = isPreview ? (
    <Card />
  ) : (
    <AddCardButton
      onSelect={(card: Mercoa.PaymentMethodResponse.Card) => {
        if (!cards.find((e) => e.lastFour === card.lastFour)) {
          setCards((prevCards) => (prevCards ? [...prevCards, card] : [card]))
          setSelectedPaymentMethodId(card.id)
        }
      }}
    />
  )

  return (
    <PaymentMethodList
      accounts={cards}
      showDelete
      formatAccount={(card) => (
        <Card
          key={card.id}
          showEdit
          account={card}
          selected={card.id === selectedPaymentMethodId}
          onSelect={() => {
            setSelectedPaymentMethodId(card.id)
          }}
          hideDefaultIndicator
        />
      )}
      addAccount={addAccountButton}
    />
  )
}
