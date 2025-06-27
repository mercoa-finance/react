import { Dialog, Transition } from '@headlessui/react'
import { CheckCircleIcon, UserIcon, XCircleIcon } from '@heroicons/react/24/outline'
import accounting from 'accounting'
import dayjs from 'dayjs'
import { Fragment, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Mercoa } from '@mercoa/javascript'
import {
  ButtonLoadingSpinner,
  InvoiceStatusPill,
  NoSession,
  useMercoaSession,
  usePayableDetails,
} from '../../../../../../components'
import { currencyCodeToSymbol } from '../../../../../../lib/currency'
import { PayableFormAction } from '../../constants'

type EventData = Record<string, string | number | boolean | null>

export type PayableCommentsChildrenProps = {
  comments: Mercoa.CommentResponse[]
  addComment: (comment: string) => void
}

function EmailModal({ isOpen, onClose, email }: { isOpen: boolean; onClose: () => void; email: Mercoa.EmailLog }) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="mercoa-relative mercoa-z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="mercoa-ease-out mercoa-duration-300"
          enterFrom="mercoa-opacity-0"
          enterTo="mercoa-opacity-100"
          leave="mercoa-ease-in mercoa-duration-200"
          leaveFrom="mercoa-opacity-100"
          leaveTo="mercoa-opacity-0"
        >
          <div className="mercoa-fixed mercoa-inset-0 mercoa-bg-gray-500 mercoa-bg-opacity-75" />
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
              <Dialog.Panel className="mercoa-relative mercoa-transform mercoa-rounded-mercoa mercoa-bg-white mercoa-px-6 mercoa-pt-5 mercoa-pb-4 mercoa-text-left mercoa-shadow-xl mercoa-transition-all sm:mercoa-my-8 sm:mercoa-w-full sm:mercoa-max-w-4xl sm:mercoa-p-6">
                <div className="mercoa-flex mercoa-justify-between mercoa-items-center mercoa-mb-4">
                  <Dialog.Title
                    as="h3"
                    className="mercoa-text-lg mercoa-font-medium mercoa-leading-6 mercoa-text-gray-900"
                  >
                    Email Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="mercoa-inline-flex mercoa-items-center mercoa-rounded mercoa-bg-gray-500 mercoa-px-4 mercoa-py-2 mercoa-text-sm mercoa-font-semibold mercoa-text-white hover:mercoa-bg-gray-600"
                  >
                    Close
                  </button>
                </div>
                <div className="mercoa-rounded-mercoa mercoa-border mercoa-shadow-lg">
                  <div className="mercoa-space-y-2 mercoa-text-gray-800 mercoa-p-5 mercoa-bg-white">
                    <div className="mercoa-font-medium">From: {email.from}</div>
                    <div className="mercoa-font-medium">Subject: {email.subject}</div>
                    <div className="mercoa-font-medium">Date: {dayjs(email.createdAt).format('MMM DD, hh:mm a')}</div>
                    <div className="mercoa-text-gray-600" dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export function PayableComments({
  readOnly,
  children,
}: {
  readOnly?: boolean
  children?: (props: PayableCommentsChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()
  const { userPermissionConfig } = mercoaSession
  const [selectedEmail, setSelectedEmail] = useState<Mercoa.EmailLog | null>(null)

  const { register, watch } = useFormContext()
  const { formContextValue, eventsContextValue, documentContextValue } = usePayableDetails()
  const { commentsContextValue } = formContextValue
  const { comments, getCommentAuthor, addComment } = commentsContextValue
  const { getEventAuthor, events } = eventsContextValue
  const { sourceEmails } = documentContextValue

  // useMemo to merge comments and events
  const commentsAndEvents = useMemo(() => {
    const eventsWithDiff: (Mercoa.InvoiceEvent & { diff: Record<string, { old: string; new: string }> })[] = []
    events.forEach((event) => {
      const lastEvent = eventsWithDiff[eventsWithDiff.length - 1]
      if (!lastEvent) {
        eventsWithDiff.push({ ...event, diff: {} })
      } else {
        const diff: Record<string, { old: string; new: string }> = {}

        // compare event.data with lastEvent.data
        Object.keys(event.data as EventData).forEach((key) => {
          if (key === 'metadata') {
            const currentMetadata = event.data['metadata'] as Record<string, string>
            const lastMetadata = lastEvent.data['metadata'] as Record<string, string>
            Object.keys(currentMetadata).forEach((metadataKey) => {
              if (currentMetadata && lastMetadata && currentMetadata[metadataKey] !== lastMetadata[metadataKey]) {
                diff[metadataKey] = {
                  old: JSON.stringify(lastMetadata[metadataKey] ?? ''),
                  new: JSON.stringify(currentMetadata[metadataKey] ?? ''),
                }
              }
            })
          } else {
            const currentValue = JSON.stringify((event.data as EventData)[key])
            const lastValue = JSON.stringify((lastEvent.data as EventData)[key])
            if (lastEvent.data && event.data && currentValue !== lastValue) {
              diff[key] = {
                old: String(lastValue ?? ''),
                new: String(currentValue ?? ''),
              }
            }
          }
        })

        eventsWithDiff.push({ ...event, diff, createdAt: dayjs(event.createdAt).add(1, 'second').toDate() })
      }
    })
    return [...comments, ...eventsWithDiff].sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)))
  }, [comments, events])

  const formAction = watch('formAction')

  function getApprovalIcon(action?: Mercoa.AssociatedApprovalAction) {
    let approvalIcon = (
      <div className="mercoa-h-1.5 mercoa-w-1.5 mercoa-rounded-full mercoa-bg-gray-100 mercoa-ring-1 mercoa-ring-mercoa-primary" />
    )
    if (action?.action === 'APPROVE') {
      approvalIcon = (
        <CheckCircleIcon className="mercoa-size-5 mercoa-text-green-600 mercoa-bg-white" aria-hidden="true" />
      )
    } else if (action?.action === 'REJECT') {
      approvalIcon = <XCircleIcon className="mercoa-size-5 mercoa-text-red-600 mercoa-bg-white" aria-hidden="true" />
    }
    return approvalIcon
  }

  const approvalToText = {
    APPROVE: 'approved',
    REJECT: 'rejected',
    NONE: 'created',
  }

  if (!mercoaSession.client) return <NoSession componentName="InvoiceComments" />

  // doubt: cant we show comments on new invoice?
  const isNew = watch('id') === undefined || watch('id') === 'new'

  if (!userPermissionConfig?.invoice?.comment?.view) {
    return null
  }

  if (children) {
    if (isNew) return null
    return children({
      comments: comments ?? [],
      addComment: addComment,
    })
  }

  if (isNew) return <div className="mercoa-mt-10" />
  return (
    <div className="mercoa-col-span-full">
      <ul role="list" className="mercoa-space-y-6 mercoa-ml-1">
        {commentsAndEvents?.map((comment, index) => {
          const commentAuthor = 'text' in comment && comment.text ? getCommentAuthor(comment) : ''
          const approverAuthor =
            'associatedApprovalAction' in comment && comment.associatedApprovalAction ? getCommentAuthor(comment) : ''
          const eventAuthor = 'status' in comment && comment.status ? getEventAuthor(comment) : ''
          return (
            <li key={comment.id} className="mercoa-relative mercoa-flex mercoa-gap-x-4">
              <div
                className={`${
                  index === commentsAndEvents.length - 1 ? 'mercoa-h-6' : '-mercoa-bottom-6'
                } mercoa-absolute mercoa-left-0 mercoa-top-0 mercoa-flex mercoa-w-6 mercoa-justify-center`}
              >
                <div className="mercoa-w-px mercoa-bg-gray-200" />
              </div>
              {'text' in comment && comment.text && (
                <>
                  <div className="mercoa-relative mercoa-flex mercoa-h-8 mercoa-w-8 mercoa-flex-none mercoa-items-center mercoa-justify-center ">
                    <UserIcon className="mercoa-h-6 mercoa-w-6 mercoa-text-mercoa-primary mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1 -mercoa-ml-2" />
                  </div>
                  <div className="mercoa-flex-auto mercoa-rounded-mercoa mercoa-p-3 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-200 mercoa-bg-white">
                    <div className="mercoa-flex mercoa-justify-between mercoa-gap-x-4">
                      <div className="mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
                        <span className="mercoa-font-medium mercoa-text-gray-900">{commentAuthor}</span> commented
                      </div>
                      <time
                        dateTime={dayjs(comment.createdAt).toISOString()}
                        className="mercoa-flex-none mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500"
                      >
                        {dayjs(comment.createdAt).fromNow()}
                      </time>
                    </div>
                    <p className="mercoa-text-sm mercoa-leading-6 mercoa-text-gray-500">{comment.text}</p>
                  </div>
                </>
              )}
              {'associatedApprovalAction' in comment && comment.associatedApprovalAction && (
                <>
                  <div className="mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center">
                    {getApprovalIcon(comment.associatedApprovalAction)}
                  </div>
                  <p className="mercoa-flex-auto mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
                    <span className="mercoa-font-medium mercoa-text-gray-900">{approverAuthor}</span>{' '}
                    {approverAuthor ? (
                      <> {approvalToText[comment.associatedApprovalAction.action]} the invoice. </>
                    ) : (
                      <div className="mercoa-flex mercoa-items-center mercoa-gap-1">
                        {' '}
                        Invoice {approvalToText[comment.associatedApprovalAction.action]}{' '}
                        {sourceEmails && sourceEmails.length > 0 ? (
                          <span>
                            from{' '}
                            <button
                              className="mercoa-text-blue-500 mercoa-underline"
                              onClick={() => setSelectedEmail(sourceEmails[0])}
                              type="button"
                            >
                              email
                            </button>
                            .
                          </span>
                        ) : (
                          'by system.'
                        )}
                      </div>
                    )}
                  </p>
                  <time
                    dateTime={dayjs(comment.createdAt).toISOString()}
                    className="mercoa-flex-none mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500"
                  >
                    {dayjs(comment.createdAt).fromNow()}
                  </time>
                </>
              )}
              {'status' in comment && comment.status && (
                <>
                  {Object.keys(comment.diff).length > 0 ? (
                    <>
                      <div className="mercoa-relative mercoa-flex mercoa-h-8 mercoa-w-8 mercoa-flex-none mercoa-items-center mercoa-justify-center ">
                        <UserIcon className="mercoa-h-6 mercoa-w-6 mercoa-text-mercoa-primary mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1 -mercoa-ml-2" />
                      </div>
                      <div className="mercoa-flex-auto mercoa-rounded-mercoa mercoa-p-3 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-200 mercoa-bg-white">
                        <div className="mercoa-flex mercoa-justify-between mercoa-gap-x-4">
                          <div className="mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
                            <span className="mercoa-font-medium mercoa-text-gray-900">
                              {commentAuthor || approverAuthor || eventAuthor}
                            </span>{' '}
                            updated the invoice{' '}
                            <span className="mercoa-font-medium mercoa-text-gray-800">
                              <InvoiceStatusPill status={comment.status} type="payable" skipValidation={true} />
                            </span>
                          </div>
                          <time
                            dateTime={dayjs(comment.createdAt).toISOString()}
                            className="mercoa-flex-none mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500"
                          >
                            {dayjs(comment.createdAt).fromNow()}
                          </time>
                        </div>
                        <FormatDiff diff={comment.diff} currency={formContextValue.overviewContextValue.currency} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center">
                        {getApprovalIcon()}
                      </div>
                      <p className="mercoa-flex-auto mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
                        <span className="mercoa-font-medium mercoa-text-gray-900">{eventAuthor}</span> updated the
                        invoice{' '}
                        <span className="mercoa-font-medium mercoa-text-gray-800">
                          <InvoiceStatusPill status={comment.status} type="payable" skipValidation={true} />
                        </span>
                      </p>
                      <time
                        dateTime={dayjs(comment.createdAt).toISOString()}
                        className="mercoa-flex-none mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500"
                      >
                        {dayjs(comment.createdAt).fromNow()}
                      </time>
                    </>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ul>

      {/* New comment form */}
      {!readOnly && (
        <div className="mercoa-mt-6 mercoa-flex mercoa-gap-x-3">
          <div className="mercoa-relative mercoa-flex-auto">
            <div className="mercoa-bg-white mercoa-overflow-hidden mercoa-rounded-mercoa mercoa-pb-12 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 focus:mercoa-ring-1 focus:mercoa-ring-mercoa-primary focus:mercoa-border-0 focus:mercoa-outline-0">
              <label htmlFor="comment" className="mercoa-sr-only">
                Add your comment
              </label>
              <textarea
                rows={2}
                {...register('commentText')}
                className="mercoa-block mercoa-w-full mercoa-resize-none mercoa-border-0 mercoa-bg-transparent mercoa-py-1.5 mercoa-px-2 mercoa-text-gray-900 placeholder:mercoa-text-gray-400 focus:mercoa-ring-0 sm:mercoa-text-sm sm:mercoa-leading-6 focus-visible:mercoa-outline-none"
                placeholder="Add your comment..."
              />
            </div>

            <div className="mercoa-absolute mercoa-inset-x-0 mercoa-bottom-0 mercoa-flex mercoa-justify-between mercoa-py-2 mercoa-pl-3 mercoa-pr-2">
              <div />
              <button
                onClick={addComment}
                type="submit"
                className="mercoa-rounded-mercoa mercoa-bg-white mercoa-px-2.5 mercoa-py-1.5 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50"
              >
                <ButtonLoadingSpinner isLoading={formAction === PayableFormAction.COMMENT}>
                  Comment
                </ButtonLoadingSpinner>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {selectedEmail && (
        <EmailModal isOpen={!!selectedEmail} onClose={() => setSelectedEmail(null)} email={selectedEmail} />
      )}
    </div>
  )
}

function FormatDiffRow({
  keyProp,
  oldValue,
  newValue,
  label,
  currency,
}: {
  keyProp: string
  oldValue: any
  newValue: any
  label: string
  currency: string
}) {
  const formatValue = (value: any, label: string) => {
    if (label === 'Amount') {
      return accounting.formatMoney(Number(value), currencyCodeToSymbol(currency))
    } else if (typeof value === 'object' || label.includes('Id')) {
      return ''
    } else if (typeof value === 'number') {
      return value.toLocaleString()
    } else if (typeof value === 'boolean') {
      return ''
    } else if (dayjs(value).isValid()) {
      return dayjs(value).format('MMM DD, YYYY')
    }
    return value
  }

  const oldLabelValue = formatValue(oldValue, label)
  const newLabelValue = formatValue(newValue, label)

  if (label.includes('Id')) {
    label = label.replace('Id', '').trim()
  }

  return (
    <div key={keyProp} className="mercoa-flex mercoa-items-center mercoa-gap-1 mercoa-text-sm">
      <span className="mercoa-font-medium mercoa-text-gray-700">{label}</span>
      {newLabelValue ? (
        <>
          <span className="mercoa-text-gray-500">{oldLabelValue}</span>
          <span className="mercoa-text-gray-400">→</span>
          <span className="mercoa-text-gray-900">{newLabelValue}</span>
        </>
      ) : (
        <span className="mercoa-text-gray-500">Updated</span>
      )}
    </div>
  )
}

function FormatDiff({ diff, currency }: { diff: Record<string, { old: string; new: string }>; currency: string }) {
  return (
    <>
      {Object.keys(diff)
        .filter((key) => key !== 'status')
        .map((key) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
            return str.toUpperCase()
          })
          const oldValue = diff[key].old ? JSON.parse(diff[key].old) : null
          const newValue = diff[key].new ? JSON.parse(diff[key].new) : null
          return (
            <FormatDiffRow
              key={key}
              keyProp={key}
              oldValue={oldValue}
              newValue={newValue}
              label={label}
              currency={currency}
            />
          )
        })}
    </>
  )
}
