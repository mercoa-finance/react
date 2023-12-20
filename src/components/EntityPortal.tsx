import {
  ArrowLeftIcon,
  BuildingLibraryIcon,
  ClockIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import { TokenGenerationOptions } from '@mercoa/javascript/api'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react'
import {
  AcceptToSButton,
  BankAccounts,
  CustomPaymentMethod,
  EntityOnboarding,
  EntityUserNotificationTable,
  MercoaButton,
  Representatives,
  TokenOptions,
  VerifyOwnersButton,
  createOrUpdateEntity,
  entityDetailsForMercoaPaymentsCompleted,
} from '.'
import { CreditCards } from './CreditCard'
import { InvoiceInbox } from './Inbox'
import { InvoiceDetails } from './InvoiceDetails'
import { LoadingSpinner, useMercoaSession } from './index'

export function EntityPortal({ token }: { token: string }) {
  const mercoaSession = useMercoaSession()

  const url = typeof window !== 'undefined' ? window.location.search : ''
  const urlParams = new URLSearchParams(url)
  const params = Object.fromEntries(urlParams.entries())
  const { invoiceId } = params

  const [screen, setScreenLocal] = useState('inbox')
  const [selectedInboxTab, setSelectedInboxTab] = useState<Mercoa.InvoiceStatus>('DRAFT')

  const [invoice, setInvoice] = useState<Mercoa.InvoiceResponse | undefined>()
  const [documents, setDocuments] = useState<Mercoa.DocumentResponse[] | undefined>()

  const entity = mercoaSession.entity
  const user = mercoaSession.user
  const organization = mercoaSession.organization

  let tokenOptions: TokenGenerationOptions | undefined = undefined
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
        setDocuments(undefined)
        if (resp.hasDocuments) {
          mercoaSession.client?.invoice.document.getAll(invoiceId as string).then((resp) => {
            if (resp) setDocuments(resp)
            setScreen('invoice')
          })
        } else {
          setScreen('invoice')
        }
      })
    }
  }, [invoiceId])

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
          <p className="font-gray-700 my-2 text-sm">
            Before you can get started, please read and accept the terms of service
          </p>
          <AcceptToSButton title="Terms of Service" buttonText="View Terms of Service" entity={entity} />
        </>
      )
    } else if (!entityDetailsForMercoaPaymentsCompleted(entity)) {
      content = (
        <>
          <div className="text-gray-800">
            <p className="text-lg font-normal">
              To pay bills and invoices with {mercoaSession.organization.name}, you&apos;ll need to provide us with a
              few pieces of information.
            </p>
            <div className="p-4 text-sm rounded-md bg-gray-100 my-4 grid gap-3">
              <p className="flex items-center">
                <LockClosedIcon className="w-5 h-5 mr-5" /> Your information is used for verification purposes and
                isn&apos;t used for third-party marketing. We take your privacy seriously.
              </p>
              <p className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-5" /> This process should take approximately 5 minutes to complete.
              </p>
            </div>
          </div>
          <EntityOnboarding
            entity={entity}
            organization={mercoaSession.organization}
            type="payor"
            setEntityData={async (entityData) => {
              if (!entity) return
              if (!entityData) return
              if (!mercoaSession.client) return
              await createOrUpdateEntity({
                data: entityData,
                entityId: entity.id,
                mercoaClient: mercoaSession.client,
                isPayee: false,
                isPayor: true,
              })
              mercoaSession.refresh()
            }}
          />
        </>
      )
    } else if (!entity?.profile?.business?.ownersProvided && entity.accountType === 'business') {
      content = (
        <>
          <p className="mb-5">
            {' '}
            Before you can pay bills, you must add business representatives and verify your account.
          </p>
          <div className="mt-8">
            <Representatives showEdit showAdd />
          </div>
          {!mercoaSession.entity?.profile.business?.ownersProvided && (
            <div className="mt-8 text-left">
              <h2 className="font-gray-800 text-lg">KYC Verification</h2>
              <p className="font-gray-700 mt-2 text-sm">
                Banking regulations require that we perform a &quot;Know Your Customer&quot; (KYC) process to verify
                account identity before enabling the ability to pay bills or send invoices.
              </p>
              <p className="font-gray-700 mt-2 text-sm">
                Individuals with significant ownership in the business (over 25%) must be added as representatives.
              </p>
              <p className="font-gray-700 mt-2 text-sm">
                At least one controller must be added as a representative. Examples include the CEO, COO, Treasurer,
                President, Vice President, or Managing Partner.
              </p>
              <p className="font-gray-700 mt-2 text-sm">
                Once all representatives have been added, click &quot;Verify Account&quot; to start this process.
              </p>
              <VerifyOwnersButton entity={entity} />
            </div>
          )}
        </>
      )
    } else {
      content = (
        <div className="mt-10 text-center text-gray-800">
          <p className="mb-5"> We are currently verifying your account. Please come back shortly.</p>
        </div>
      )
    }
    return (
      <div className="container mx-auto mt-5 text-center">
        <h2 className="font-gray-800 text-lg">Welcome to your Accounts Payable Dashboard</h2>
        {content}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 pt-5 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <div className="flex-auto text-sm text-gray-700 my-4 sm:mt-0">
          {screen === 'inbox' ? (
            <>
              {organization?.emailProvider?.inboxDomain && (
                <>
                  Forward invoices to: <br />
                  <b>
                    {entity?.emailTo}@{organization?.emailProvider?.inboxDomain}
                  </b>
                </>
              )}
            </>
          ) : (
            <MercoaButton
              onClick={() => setScreen('inbox')}
              type="button"
              isEmphasized={false}
              className="ml-2 inline-flex text-sm"
            >
              <ArrowLeftIcon className="-ml-1 inline-flex h-5 w-5 md:mr-2" />{' '}
              <span className="hidden md:inline-block">Back</span>
            </MercoaButton>
          )}
        </div>
        <div className="my-4 flex-none sm:mt-0 sm:ml-16">
          {user && tokenOptions?.pages?.notifications && screen !== 'notifications' && screen !== 'invoice' && (
            <MercoaButton
              onClick={() => setScreen('notifications')}
              type="button"
              isEmphasized={false}
              className="ml-2 inline-flex text-sm"
            >
              <EnvelopeIcon className="-ml-1 inline-flex h-5 w-5 md:mr-2" />{' '}
              <span className="hidden md:inline-block">Notifications</span>
            </MercoaButton>
          )}
          {tokenOptions?.pages?.representatives && screen !== 'representatives' && screen !== 'invoice' && (
            <MercoaButton
              onClick={() => setScreen('representatives')}
              type="button"
              isEmphasized={false}
              className="ml-2 inline-flex text-sm"
            >
              <UsersIcon className="-ml-1 inline-flex h-5 w-5 md:mr-2" />{' '}
              <span className="hidden md:inline-block">Representatives</span>
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
                className="ml-2 inline-flex text-sm"
              >
                <BuildingLibraryIcon className="-ml-1 inline-flex h-5 w-5 md:mr-2" />{' '}
                <span className="hidden md:inline-block">Payment Methods</span>
              </MercoaButton>
            )}

          {screen !== 'invoice' && (
            <MercoaButton
              isEmphasized
              type="button"
              className="ml-2 inline-flex text-sm"
              onClick={() => {
                setScreen('invoice')
                setDocuments(undefined)
                setInvoice(undefined)
              }}
            >
              <PlusIcon className="-ml-1 inline-flex h-5 w-5 md:mr-2" />{' '}
              <span className="hidden md:inline-block">New Invoice</span>
            </MercoaButton>
          )}
        </div>
      </div>
      {screen === 'inbox' && (
        <InvoiceInbox
          onTabChange={(tab) => setSelectedInboxTab(tab)}
          selectedTab={selectedInboxTab}
          statuses={tokenOptions?.invoice?.status}
          onSelectInvoice={(invoice) => {
            setInvoice(invoice)
            setDocuments(undefined)
            if (invoice.hasDocuments) {
              mercoaSession.client?.invoice.document.getAll(invoice.id).then((resp) => {
                setScreen('invoice')
                if (resp) {
                  setDocuments(resp)
                }
              })
            } else {
              setScreen('invoice')
            }
          }}
        />
      )}
      {screen === 'payments' && (
        <div>
          {mercoaSession.organization?.paymentMethods?.payerPayments?.find(
            (e) => e.type === Mercoa.PaymentMethodType.BankAccount && e.active,
          ) && (
            <>
              <h3 className="mt-8">Bank Accounts</h3>
              <BankAccounts showEdit showAdd />
            </>
          )}
          {mercoaSession.organization?.paymentMethods?.payerPayments?.find(
            (e) => e.type === Mercoa.PaymentMethodType.Card && e.active,
          ) && (
            <>
              <h3 className="mt-8">Cards</h3>
              <CreditCards showEdit showAdd />
            </>
          )}
          {mercoaSession.organization?.paymentMethods?.payerPayments?.find(
            (e) => e.type === Mercoa.PaymentMethodType.Custom && e.active,
          ) && (
            <>
              <h3 className="mt-8"></h3>
              <CustomPaymentMethod showEdit />
            </>
          )}
        </div>
      )}
      {user && screen === 'notifications' && (
        <div>
          <h3 className="mt-8">Notifications</h3>
          <EntityUserNotificationTable entityId={entity.id} userId={user.id} />
        </div>
      )}
      {screen === 'representatives' && (
        <div>
          <p className="font-gray-700 mt-2 text-sm">
            Regulatory guidelines require that all individuals with significant ownership in the business (over 25%)
            must be added as representatives.
          </p>
          <p className="font-gray-700 mt-1 text-sm">
            Every business also requires a controller. Examples include the CEO, COO, Treasurer, President, Vice
            President, or Managing Partner.
          </p>

          <Representatives showEdit showAdd />

          {entity && entity.accountType === 'business' && !entity.profile?.business?.ownersProvided && (
            <div className="mt-8">
              <h2 className="font-gray-800 text-lg">KYC Verification</h2>
              <p className="font-gray-700 mt-2 text-sm">
                Banking regulations require that we perform a &quot;Know Your Customer&quot; (KYC) process to verify
                account identity before enabling the ability to pay bills or send invoices.
              </p>
              <p className="font-gray-700 mt-2 text-sm">
                Once all representatives have been added, click &quot;Verify Account&quot; to start this process.
              </p>
              <VerifyOwnersButton entity={entity} />
            </div>
          )}
        </div>
      )}
      {screen === 'invoice' && (
        <InvoiceDetails
          invoice={invoice}
          documents={documents}
          addPaymentMethodRedirect={() => setScreen('payments')}
          onRedirect={(invoice) => {
            if (!invoice) {
              setScreen('inbox')
              return
            }
          }}
        />
      )}
    </div>
  )
}
