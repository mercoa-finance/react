import { CheckCircleIcon, UserIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useFormContext } from 'react-hook-form'
import { NoSession, useMercoaSession } from './index'
dayjs.extend(relativeTime)

export function InvoiceComments({ readOnly }: { readOnly?: boolean }) {
  const mercoaSession = useMercoaSession()

  const { register, watch, setValue } = useFormContext()

  const comments = watch('comments') as Mercoa.CommentResponse[]

  function getApprovalIcon(action: Mercoa.AssociatedApprovalAction) {
    let approvalIcon = (
      <div className="mercoa-h-1.5 mercoa-w-1.5 mercoa-rounded-full mercoa-bg-gray-100 mercoa-ring-1 mercoa-ring-mercoa-primary" />
    )
    if (action.action === 'APPROVE') {
      approvalIcon = (
        <CheckCircleIcon className="mercoa-size-5 mercoa-text-green-600 mercoa-bg-white" aria-hidden="true" />
      )
    } else if (action.action === 'REJECT') {
      approvalIcon = <XCircleIcon className="mercoa-size-5 mercoa-text-red-600 mercoa-bg-white" aria-hidden="true" />
    }
    return approvalIcon
  }

  const approvalToText = {
    APPROVE: 'approved',
    REJECT: 'rejected',
    NONE: 'created',
  }

  const filteredComments = comments?.filter((comment) => comment.text || comment.associatedApprovalAction) ?? []

  const initialCreationComment = {
    id: watch('id'),
    createdAt: watch('createdAt'),
    user: watch('creatorUser') ?? {
      id: '',
      name: 'Email',
    },
    text: '',
    associatedApprovalAction: {
      action: Mercoa.ApproverAction.None,
      userId: watch('creatorUser')?.id ?? '',
    },
  }

  if (!mercoaSession.client) return <NoSession componentName="InvoiceComments" />
  if (watch('id') === undefined || watch('id') === 'new') return <div className="mercoa-mt-10" />
  return (
    <div className="mercoa-col-span-full">
      <ul role="list" className="mercoa-space-y-6 mercoa-ml-1">
        {[initialCreationComment, ...filteredComments].map((comment, index) => (
          <li key={comment.id} className="mercoa-relative mercoa-flex mercoa-gap-x-4">
            <div
              className={`${
                index === filteredComments.length ? 'mercoa-h-6' : '-mercoa-bottom-6'
              } mercoa-absolute mercoa-left-0 mercoa-top-0 mercoa-flex mercoa-w-6 mercoa-justify-center`}
            >
              <div className="mercoa-w-px mercoa-bg-gray-200" />
            </div>
            {comment.text && (
              <>
                <div className="mercoa-relative mercoa-flex mercoa-h-8 mercoa-w-8 mercoa-flex-none mercoa-items-center mercoa-justify-center ">
                  <UserIcon className="mercoa-h-6 mercoa-w-6 mercoa-text-mercoa-primary mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1 -mercoa-ml-2" />
                </div>
                <div className="mercoa-flex-auto mercoa-rounded-mercoa mercoa-p-3 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-200 mercoa-bg-white">
                  <div className="mercoa-flex mercoa-justify-between mercoa-gap-x-4">
                    <div className="mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
                      <span className="mercoa-font-medium mercoa-text-gray-900">{comment.user?.name}</span> commented
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
            {comment.associatedApprovalAction && (
              <>
                <div className="mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center">
                  {getApprovalIcon(comment.associatedApprovalAction)}
                </div>
                <p className="mercoa-flex-auto mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500">
                  <span className="mercoa-font-medium mercoa-text-gray-900">{comment.user?.name}</span>{' '}
                  {approvalToText[comment.associatedApprovalAction.action]} the invoice.
                </p>
                <time
                  dateTime={dayjs(comment.createdAt).toISOString()}
                  className="mercoa-flex-none mercoa-py-0.5 mercoa-text-xs mercoa-leading-5 mercoa-text-gray-500"
                >
                  {dayjs(comment.createdAt).fromNow()}
                </time>
              </>
            )}
          </li>
        ))}
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
                onClick={() => {
                  setValue('saveAsStatus', 'COMMENT')
                }}
                type="submit"
                className="mercoa-rounded-mercoa mercoa-bg-white mercoa-px-2.5 mercoa-py-1.5 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
