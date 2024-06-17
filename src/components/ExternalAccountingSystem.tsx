import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { LoadingSpinnerIcon, MercoaButton, NoSession, useMercoaSession } from './index'

export function ManageExternalAccountingSystem() {
  const mercoaSession = useMercoaSession()

  const [isConnected, setIsConnected] = useState<boolean>()

  useEffect(() => {
    if (!mercoaSession || !mercoaSession.entityId) return
    mercoaSession.client?.entity.externalAccountingSystem.get(mercoaSession.entityId).then((e) => {
      setIsConnected(e.type !== 'none')
    })
  })

  async function createEntity() {
    const type = mercoaSession.organization?.externalAccountingSystemProvider?.type
    if (!mercoaSession.entityId) return
    if (!type || type === 'none') return
    await mercoaSession.client?.entity.externalAccountingSystem.create(mercoaSession.entityId, {
      type,
    })
  }

  async function openConnectionLink() {
    if (!mercoaSession.entityId) return
    // get link
    const link = await mercoaSession.client?.entity.externalAccountingSystem.connect(mercoaSession.entityId)
    if (!link) return
    // open link
    const popup = window.open(link, '_blank')
    const interval = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(interval)
        console.log('> Popup Closed')
        mercoaSession.refresh()
      }
    }, 500)
  }

  if (
    !mercoaSession.organization?.externalAccountingSystemProvider?.type ||
    mercoaSession.organization?.externalAccountingSystemProvider?.type === 'none'
  )
    return null

  if (!mercoaSession.client) return <NoSession componentName="ManageExternalAccountingSystem" />
  return (
    <div className="mercoa-flex mercoa-gap-x-2">
      <MercoaButton
        isEmphasized
        type="button"
        className="mercoa-inline-flex mercoa-text-sm"
        onClick={async () => {
          await createEntity()
          openConnectionLink()
        }}
      >
        Manage Connection
      </MercoaButton>
      {isConnected && <SyncExternalAccountingSystemButton />}
    </div>
  )
}

function SyncExternalAccountingSystemButton() {
  const mercoaSession = useMercoaSession()
  const [show, setShow] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      vendors: true,
      glAccounts: true,
      bills: true,
    },
  })

  async function onSubmit(data: { vendors: boolean; glAccounts: boolean; bills: boolean }) {
    if (!mercoaSession.entityId) return
    setIsSyncing(true)
    await mercoaSession.client?.entity.externalAccountingSystem.sync(mercoaSession.entityId, {
      vendors: data.vendors ? 'both' : 'none',
      glAccounts: data.glAccounts ? 'pull' : 'none',
      bills: data.bills ? 'both' : 'none',
    })
    setIsSyncing(false)
    setShow(false)
  }

  if (!mercoaSession.client) return <NoSession componentName="SyncExternalAccountingSystemButton" />
  return (
    <>
      <MercoaButton
        isEmphasized
        type="button"
        className="mercoa-inline-flex mercoa-text-sm"
        onClick={() => setShow(true)}
      >
        Sync Now
      </MercoaButton>
      <Transition.Root show={show} as={Fragment}>
        <Dialog as="div" className="mercoa-relative mercoa-z-10" onClose={() => setShow(false)}>
          <Transition.Child
            as={Fragment}
            enter="mercoa-ease-out mercoa-duration-300"
            enterFrom="mercoa-opacity-0"
            enterTo="mercoa-opacity-100"
            leave="mercoa-ease-in mercoa-duration-200"
            leaveFrom="mercoa-opacity-100"
            leaveTo="mercoa-opacity-0"
          >
            <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-mercoa-opacity-75 mercoa-transition-opacity" />
          </Transition.Child>

          <div className="mercoa-fixed mercoa-inset-0 mercoa-z-10 mercoa-overflow-y-auto">
            <div className="mercoa-flex mercoa-min-h-full mercoa-items-end mercoa-justify-center mercoa-p-4 mercoa-text-center sm:mercoa-items-center sm:mercoa-p-0">
              <Transition.Child
                as={Fragment}
                enter="mercoa-ease-out mercoa-duration-300"
                enterFrom="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
                enterTo="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
                leave="mercoa-ease-in mercoa-duration-200"
                leaveFrom="mercoa-opacity-100 mercoa-translate-y-0 sm:mercoa-scale-100"
                leaveTo="mercoa-opacity-0 mercoa-translate-y-4 sm:mercoa-translate-y-0 sm:mercoa-scale-95"
              >
                <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-px-4 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-max-w-md sm:mercoa-p-6">
                  {isSyncing ? (
                    <div className="mercoa-min-w-24 mercoa-flex mercoa-items-center mercoa-mt-3">
                      <LoadingSpinnerIcon />
                      <p className="mercoa-text-sm mercoa-text-gray-500">Syncing...</p>
                    </div>
                  ) : (
                    <>
                      <label className="mercoa-block mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900 mercoa-mb-5">
                        What should be synced?
                      </label>
                      <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mercoa-space-y-5">
                          <div className="mercoa-relative mercoa-flex mercoa-items-start">
                            <div className="mercoa-flex mercoa-h-6 mercoa-items-center">
                              <input
                                {...register('vendors')}
                                type="checkbox"
                                className="mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text mercoa-focus:ring-mercoa-primary-text"
                              />
                            </div>
                            <div className="mercoa-ml-3 mercoa-text-sm mercoa-leading-6">
                              <label htmlFor="comments" className="mercoa-font-medium mercoa-text-gray-900">
                                Vendors
                              </label>
                            </div>
                          </div>
                          <div className="mercoa-relative mercoa-flex mercoa-items-start">
                            <div className="mercoa-flex mercoa-h-6 mercoa-items-center">
                              <input
                                {...register('glAccounts')}
                                type="checkbox"
                                className="mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text mercoa-focus:ring-mercoa-primary-text"
                              />
                            </div>
                            <div className="mercoa-ml-3 mercoa-text-sm mercoa-leading-6">
                              <label htmlFor="comments" className="mercoa-font-medium mercoa-text-gray-900">
                                GL Accounts
                              </label>
                            </div>
                          </div>
                          <div className="mercoa-relative mercoa-flex mercoa-items-start">
                            <div className="mercoa-flex mercoa-h-6 mercoa-items-center">
                              <input
                                {...register('bills')}
                                type="checkbox"
                                className="mercoa-h-4 mercoa-w-4 mercoa-rounded mercoa-border-gray-300 mercoa-text-mercoa-primary-text mercoa-focus:ring-mercoa-primary-text"
                              />
                            </div>
                            <div className="mercoa-ml-3 mercoa-text-sm mercoa-leading-6">
                              <label htmlFor="comments" className="mercoa-font-medium mercoa-text-gray-900">
                                Bills
                              </label>
                            </div>
                          </div>
                        </div>

                        <MercoaButton isEmphasized size="md" className="mercoa-mt-5">
                          Sync
                        </MercoaButton>
                      </form>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
