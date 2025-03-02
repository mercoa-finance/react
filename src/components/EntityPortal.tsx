import {
  ArrowLeftIcon,
  BuildingLibraryIcon,
  ClockIcon,
  EnvelopeIcon,
  IdentificationIcon,
  InboxArrowDownIcon,
  LockClosedIcon,
  LockOpenIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react'
import { Mercoa } from '@mercoa/javascript'
import { PayableDetails } from '../modules/payables/components/payable-details'
import {
  AcceptToSButton,
  ApprovalPolicies,
  Counterparties,
  EntityEmailLogs,
  EntityInboxEmail,
  EntityOnboardingForm,
  EntityUserNotificationTable,
  LoadingSpinner,
  MercoaButton,
  NoSession,
  PayableDetailsV1,
  Payables,
  PayablesV1,
  PaymentMethods,
  Representatives,
  TokenOptions,
  VerifyOwnersButton,
  entityDetailsForMercoaPaymentsCompleted,
  useMercoaSession,
} from './index'

export function EntityPortal({ token }: { token: string }) {
  const mercoaSession = useMercoaSession()

  const url = typeof window !== 'undefined' ? window.location.search : ''
  const urlParams = new URLSearchParams(url)
  const params = Object.fromEntries(urlParams.entries())
  const { invoiceId } = params

  const [screen, setScreenLocal] = useState('inbox')
  const [version, setVersion] = useState<'old' | 'new'>('old')
  const [invoiceType, setInvoiceType] = useState<'invoice' | 'invoiceTemplate'>('invoice')

  const [invoice, setInvoice] = useState<Mercoa.InvoiceResponse | undefined>()

  const entity = mercoaSession.entity
  const user = mercoaSession.user
  const organization = mercoaSession.organization

  let tokenOptions: Mercoa.TokenGenerationOptions | undefined = undefined
  try {
    const { options } = jwtDecode(token) as TokenOptions
    tokenOptions = options
  } catch (e) {
    console.error(e)
  }

  async function setScreen(screen: string) {
    await mercoaSession.getNewToken()
    setScreenLocal(screen)
  }

  useEffect(() => {
    mercoaSession.setIframeOptions({ options: tokenOptions })
  }, [token])

  useEffect(() => {
    if (invoiceId) {
      mercoaSession.client?.invoice.get(invoiceId as string).then((resp) => {
        setInvoice(resp)
        setScreen('invoice')
      })
    }
  }, [invoiceId])

  if (!mercoaSession.client) return <NoSession componentName="EntityPortal" />
  if (!entity || !mercoaSession.organization) return <LoadingSpinner />

  if (
    entity &&
    mercoaSession.iframeOptions?.options?.entity?.enableMercoaPayments &&
    entity.status != Mercoa.EntityStatus.Verified
  ) {
    let content = <></>
    if (!entity?.acceptedTos) {
      content = (
        <>
          <p className="mercoa-font-gray-700 mercoa-my-2 mercoa-text-sm">
            Before you can get started, please read and accept the terms of service
          </p>
          <AcceptToSButton title="Terms of Service" buttonText="View Terms of Service" entity={entity} />
        </>
      )
    } else if (!entityDetailsForMercoaPaymentsCompleted(entity)) {
      content = (
        <>
          <div className="mercoa-text-gray-800">
            <p className="mercoa-text-lg mercoa-font-normal">
              To pay bills and invoices with {mercoaSession.organization.name}, you&apos;ll need to provide us with a
              few pieces of information.
            </p>
            <div className="mercoa-p-4 mercoa-text-sm mercoa-rounded-mercoa mercoa-bg-gray-100 mercoa-my-4 mercoa-grid mercoa-gap-3">
              <p className="mercoa-flex mercoa-items-center">
                <LockClosedIcon className="mercoa-size-5 mercoa-mr-5" /> Your information is used for verification
                purposes and isn&apos;t used for third-party marketing. We take your privacy seriously.
              </p>
              <p className="mercoa-flex mercoa-items-center">
                <ClockIcon className="mercoa-size-4 mercoa-mr-5" /> This process should take approximately 5 minutes to
                complete.
              </p>
            </div>
          </div>
          <EntityOnboardingForm entity={entity} type="payor" />
        </>
      )
    } else if (!entity?.profile?.business?.ownersProvided && entity.accountType === 'business') {
      content = (
        <>
          <p className="mercoa-mb-5">
            {' '}
            Before you can pay bills, you must add business representatives and verify your account.
          </p>
          <div className="mercoa-mt-8">
            <Representatives showEdit showAdd />
          </div>
          {!mercoaSession.entity?.profile.business?.ownersProvided && (
            <div className="mercoa-mt-8 mercoa-text-left">
              <h2 className="mercoa-font-gray-800 mercoa-text-lg">KYC Verification</h2>
              <p className="mercoa-font-gray-700 mercoa-mt-2 mercoa-text-sm">
                Banking regulations require that we perform a &quot;Know Your Customer&quot; (KYC) process to verify
                account identity before enabling the ability to pay bills or send invoices.
              </p>
              <p className="mercoa-font-gray-700 mercoa-mt-2 mercoa-text-sm">
                Individuals with significant ownership in the business (over 25%) must be added as representatives.
              </p>
              <p className="mercoa-font-gray-700 mercoa-mt-2 mercoa-text-sm">
                At least one controller must be added as a representative. Examples include the CEO, COO, Treasurer,
                President, Vice President, or Managing Partner.
              </p>
              <p className="mercoa-font-gray-700 mercoa-mt-2 mercoa-text-sm">
                Once all representatives have been added, click &quot;Verify Account&quot; to start this process.
              </p>
              <VerifyOwnersButton entity={entity} />
            </div>
          )}
        </>
      )
    } else {
      content = (
        <div className="mercoa-mt-10 mercoa-text-center mercoa-text-gray-800">
          <p className="mercoa-mb-5"> We are currently verifying your account. Please come back shortly.</p>
        </div>
      )
    }
    return (
      <div className="mercoa-mx-auto mercoa-mt-5 mercoa-text-center">
        <h2 className="mercoa-font-gray-800 mercoa-text-lg">Welcome to your Accounts Payable Dashboard</h2>
        {content}
      </div>
    )
  }

  return (
    <div className="mercoa-mx-auto mercoa-px-4">
      <div className="mercoa-flex mercoa-items-center">
        <div className="mercoa-flex-auto mercoa-text-sm mercoa-text-gray-700 mercoa-my-4 sm:mercoa-mt-0">
          <div className="mercoa-flex mercoa-items-center mercoa-gap-4">
            {screen === 'inbox' && version === 'old' && organization?.emailProvider?.inboxDomain && (
              <>
                Forward invoices to: <br />
                <EntityInboxEmail />
              </>
            )}
            {screen !== 'inbox' && (
              <MercoaButton
                onClick={() => {
                  mercoaSession.refresh()
                  setScreen('inbox')
                }}
                type="button"
                isEmphasized={false}
                className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
              >
                <ArrowLeftIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-size-5 md:mercoa-mr-2" />{' '}
                <span className="mercoa-hidden md:mercoa-inline-block">Back</span>
              </MercoaButton>
            )}

            <div className="mercoa-flex mercoa-items-center">
              <label className="mercoa-mr-2 mercoa-text-sm mercoa-text-gray-600">Experience:</label>
              <select
                value={version}
                className="mercoa-rounded-md mercoa-w-[120px] mercoa-border mercoa-border-gray-300 mercoa-px-4 mercoa-py-1 mercoa-text-sm"
                onChange={(e) => {
                  setVersion(e.target.value as 'old' | 'new')
                }}
              >
                <option value="old">Classic</option>
                <option value="new">Modern</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mercoa-my-4 mercoa-flex-none sm:mercoa-mt-0 sm:mercoa-ml-16">
          {user && tokenOptions?.pages?.notifications && screen !== 'notifications' && screen !== 'invoice' && (
            <MercoaButton
              onClick={() => setScreen('notifications')}
              type="button"
              isEmphasized={false}
              className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
            >
              <EnvelopeIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-size-5 md:mercoa-mr-2" />{' '}
              <span className="mercoa-hidden md:mercoa-inline-block">Notifications</span>
            </MercoaButton>
          )}
          {tokenOptions?.pages?.representatives && screen !== 'representatives' && screen !== 'invoice' && (
            <MercoaButton
              onClick={() => setScreen('representatives')}
              type="button"
              isEmphasized={false}
              className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
            >
              <UsersIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-size-5 md:mercoa-mr-2" />{' '}
              <span className="mercoa-hidden md:mercoa-inline-block">Representatives</span>
            </MercoaButton>
          )}
          {tokenOptions?.pages?.approvals && screen !== 'approvals' && screen !== 'invoice' && (
            <MercoaButton
              onClick={() => setScreen('approvals')}
              type="button"
              isEmphasized={false}
              className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
            >
              <LockOpenIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-size-5 md:mercoa-mr-2" />{' '}
              <span className="mercoa-hidden md:mercoa-inline-block">Approval Rules</span>
            </MercoaButton>
          )}
          {mercoaSession.iframeOptions?.options?.entity?.enableMercoaPayments &&
            tokenOptions?.pages?.paymentMethods &&
            screen !== 'payments' &&
            screen !== 'invoice' && (
              <MercoaButton
                onClick={() => setScreen('payments')}
                type="button"
                isEmphasized={false}
                className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
              >
                <BuildingLibraryIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-size-5 md:mercoa-mr-2" />{' '}
                <span className="mercoa-hidden md:mercoa-inline-block">Payment Methods</span>
              </MercoaButton>
            )}

          {mercoaSession.iframeOptions?.options?.pages?.counterparties &&
            screen !== 'counterparties' &&
            screen !== 'invoice' && (
              <MercoaButton
                onClick={() => setScreen('counterparties')}
                type="button"
                isEmphasized={false}
                className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
              >
                <IdentificationIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-size-5 md:mercoa-mr-2" />{' '}
                <span className="mercoa-hidden md:mercoa-inline-block">Vendors</span>
              </MercoaButton>
            )}

          {tokenOptions?.pages?.emailLog && screen === 'inbox' && (
            <MercoaButton
              onClick={() => setScreen('emailLog')}
              type="button"
              isEmphasized={false}
              className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
            >
              <InboxArrowDownIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-size-5 md:mercoa-mr-2" />{' '}
              <span className="mercoa-hidden md:mercoa-inline-block">Email Log</span>
            </MercoaButton>
          )}

          {screen !== 'invoice' && screen !== 'counterparties' && version === 'old' && (
            <MercoaButton
              isEmphasized
              type="button"
              className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
              onClick={() => {
                setScreen('invoice')
                setInvoiceType('invoice')
                setInvoice(undefined)
              }}
            >
              <PlusIcon className="-mercoa-ml-1 mercoa-inline-flex mercoa-size-5 md:mercoa-mr-2" />{' '}
              <span className="mercoa-hidden md:mercoa-inline-block">
                New {invoiceType === 'invoice' ? '' : 'Recurring'} Invoice
              </span>
            </MercoaButton>
          )}
        </div>
      </div>
      <div className={screen === 'inbox' ? '' : 'mercoa-hidden'}>
        {version === 'new' ? (
          <Payables
            displayOptions={{
              statusTabsOptions: {
                isVisible: true,
                statuses: [
                  Mercoa.InvoiceStatus.Draft,
                  Mercoa.InvoiceStatus.New,
                  Mercoa.InvoiceStatus.Approved,
                  Mercoa.InvoiceStatus.Scheduled,
                  Mercoa.InvoiceStatus.Pending,
                  Mercoa.InvoiceStatus.Paid,
                  Mercoa.InvoiceStatus.Canceled,
                  Mercoa.InvoiceStatus.Refused,
                  Mercoa.InvoiceStatus.Failed,
                  Mercoa.InvoiceStatus.Archived,
                ],
              },
            }}
            handlers={{
              onCreateInvoice: () => {
                setScreen('invoice')
                setInvoiceType('invoice')
                setInvoice(undefined)
              },
              onCreateRecurringInvoice: () => {
                setScreen('invoice')
                setInvoiceType('invoiceTemplate')
                setInvoice(undefined)
              },
              onSelectInvoice: (invoice) => {
                setInvoice(invoice)
                setInvoiceType('invoice')
                setScreen('invoice')
              },
            }}
          />
        ) : (
          <PayablesV1
            statuses={[
              Mercoa.InvoiceStatus.Draft,
              Mercoa.InvoiceStatus.New,
              Mercoa.InvoiceStatus.Approved,
              Mercoa.InvoiceStatus.Scheduled,
              Mercoa.InvoiceStatus.Pending,
              Mercoa.InvoiceStatus.Paid,
              Mercoa.InvoiceStatus.Canceled,
              Mercoa.InvoiceStatus.Refused,
              Mercoa.InvoiceStatus.Failed,
              Mercoa.InvoiceStatus.Archived,
            ]}
            onSelectInvoice={(invoice) => {
              setInvoice(invoice)
              setInvoiceType('invoice')
              setScreen('invoice')
            }}
          />
        )}
      </div>
      {screen === 'payments' && <PaymentMethods isPayor />}
      {user && screen === 'notifications' && (
        <div>
          <h3 className="mercoa-mt-8">Notifications</h3>
          <EntityUserNotificationTable entityId={entity.id} userId={user.id} />
        </div>
      )}
      {screen === 'approvals' && (
        <div>
          <h3 className="mercoa-my-8">Approval Rules</h3>
          <ApprovalPolicies />
        </div>
      )}
      {screen === 'emailLog' && (
        <EntityEmailLogs
          onClick={(invoiceId) => {
            mercoaSession.client?.invoice.get(invoiceId).then((resp) => {
              setInvoice(resp)
              setScreen('invoice')
            })
          }}
        />
      )}
      {screen === 'counterparties' && <Counterparties type="payee" />}
      {screen === 'representatives' && (
        <div>
          <p className="mercoa-font-gray-700 mercoa-mt-2 mercoa-text-sm">
            Regulatory guidelines require that all individuals with significant ownership in the business (over 25%)
            must be added as representatives.
          </p>
          <p className="mercoa-font-gray-700 mercoa-mt-1 mercoa-text-sm">
            Every business also requires a controller. Examples include the CEO, COO, Treasurer, President, Vice
            President, or Managing Partner.
          </p>

          <Representatives showEdit showAdd />

          {entity && entity.accountType === 'business' && !entity.profile?.business?.ownersProvided && (
            <div className="mercoa-mt-8">
              <h2 className="mercoa-font-gray-800 mercoa-text-lg">KYC Verification</h2>
              <p className="mercoa-font-gray-700 mercoa-mt-2 mercoa-text-sm">
                Banking regulations require that we perform a &quot;Know Your Customer&quot; (KYC) process to verify
                account identity before enabling the ability to pay bills or send invoices.
              </p>
              <p className="mercoa-font-gray-700 mercoa-mt-2 mercoa-text-sm">
                Once all representatives have been added, click &quot;Verify Account&quot; to start this process.
              </p>
              <VerifyOwnersButton entity={entity} />
            </div>
          )}
        </div>
      )}
      {screen === 'invoice' &&
        (version === 'new' ? (
          <PayableDetails
            queryOptions={{
              invoiceId: invoice?.id ?? '',
              invoiceType: invoiceType,
              invoice: invoice,
            }}
            handlers={{
              onInvoiceSubmit: (invoice) => {
                if (!invoice) {
                  mercoaSession.refresh()
                  setScreen('inbox')
                } else {
                  setInvoice(invoice)
                  mercoaSession.refresh()
                }
              },
              onInvoiceUpdate: (invoice) => {
                if (!invoice) {
                  mercoaSession.refresh()
                  setScreen('inbox')
                }
              },
            }}
          />
        ) : (
          <PayableDetailsV1
            invoice={invoice}
            invoiceType={invoiceType}
            onInvoiceSubmit={(invoice) => {
              if (!invoice) {
                mercoaSession.refresh()
                setScreen('inbox')
              } else {
                setInvoice(invoice)
                mercoaSession.refresh()
              }
            }}
            onUpdate={(invoice) => {
              if (!invoice) {
                mercoaSession.refresh()
                setScreen('inbox')
              }
            }}
          />
        ))}
    </div>
  )
}
