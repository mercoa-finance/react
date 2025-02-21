import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { PaymentMethodButton, Tooltip, useMercoaSession } from '../../../../../../../../../../src/components'

export function PaymentMethodList({
  accounts,
  showDelete,
  addAccount,
  formatAccount,
}: {
  accounts?: Mercoa.PaymentMethodResponse[]
  showDelete?: boolean
  addAccount?: JSX.Element
  formatAccount: (account: any) => JSX.Element | JSX.Element[] | null
}) {
  const mercoaSession = useMercoaSession()
  const hasAccounts = accounts && accounts.length > 0
  return (
    <>
      {/* List of payment methods if provided */}
      {hasAccounts &&
        accounts.map((account) => (
          <div className="mercoa-mt-2 mercoa-flex" key={account.id}>
            <div className="mercoa-flex-grow">{formatAccount(account)}</div>
            {showDelete && (
              <button
                onClick={async () => {
                  const del = confirm('Are you sure you want to remove this account? This action cannot be undone.')
                  if (del && mercoaSession.token && mercoaSession.entity?.id && account.id) {
                    try {
                      await mercoaSession.client?.entity.paymentMethod.delete(mercoaSession.entity?.id, account.id)
                      toast.success('Account removed')
                    } catch (e: any) {
                      toast.error('Error removing account')
                      console.error(e.body)
                    }
                    mercoaSession.refresh()
                  }
                }}
                className="mercoa-ml-2 mercoa-text-mercoa-secondary hover:mercoa-text-mercoa-secondary-dark"
              >
                <Tooltip title="Remove Account">
                  <TrashIcon className="mercoa-size-5" />
                </Tooltip>
              </button>
            )}
          </div>
        ))}
      {/* Add account button */}
      {addAccount && (
        <div className="mercoa-mt-2 mercoa-flex">
          <div className="mercoa-flex-grow">{addAccount}</div>
          {showDelete && hasAccounts && <div className="mercoa-ml-2 mercoa-size-5" />}
        </div>
      )}
      {/* Empty state rendering (no accounts + no add account button provided) */}
      {!hasAccounts && !addAccount && (
        <div className="mercoa-mt-2 mercoa-flex">
          <div className="mercoa-flex-grow">
            <PaymentMethodButton
              icon={<ExclamationTriangleIcon className="mercoa-size-5" />}
              text="No payment methods found"
            />
          </div>
        </div>
      )}
    </>
  )
}
