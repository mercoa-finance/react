import { CheckCircleIcon, UserIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Mercoa } from '@mercoa/javascript'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useMercoaSession } from './Mercoa'
dayjs.extend(relativeTime)

export function InvoiceComments({ invoice }: { invoice?: Mercoa.InvoiceResponse }) {
  const mercoaSession = useMercoaSession()

  const [comments, setComments] = useState<Array<Mercoa.CommentResponse>>(invoice?.comments ?? [])

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      type: 'comment',
      text: '',
    },
  })

  function addComment({ type, text }: { type: string; text: string }) {
    if (!mercoaSession.user?.id) {
      toast.error('Please login as a user to comment')
      return
    }
    if (!mercoaSession.token || !invoice?.id) return
    if (!text) return
    if (type === 'comment') {
      mercoaSession.client?.invoice.comment
        .create(invoice.id, {
          text,
          userId: mercoaSession.user?.id,
        })
        .then((resp) => {
          if (resp) {
            console.log(resp)
            setComments([...comments, resp])
            setValue('text', '')
          }
        })
    }
  }

  function getApprovalIcon(action: Mercoa.AssociatedApprovalAction) {
    let approvalIcon = (
      <div className="mercoa-h-1.5 mercoa-w-1.5 mercoa-rounded-full mercoa-bg-gray-100 mercoa-ring-1 mercoa-ring-gray-300" />
    )
    if (action.action === 'APPROVE') {
      approvalIcon = <CheckCircleIcon className="mercoa-h-6 mercoa-w-6 mercoa-text-green-600" aria-hidden="true" />
    } else if (action.action === 'REJECT') {
      approvalIcon = <XCircleIcon className="mercoa-h-6 mercoa-w-6 mercoa-text-red-600" aria-hidden="true" />
    }
    return approvalIcon
  }

  const approvalToText = {
    APPROVE: 'approved',
    REJECT: 'rejected',
    NONE: 'created',
  }

  const filteredComments = comments.filter((comment) => comment.text || comment.associatedApprovalAction)

  const initialCreationComment = {
    id: invoice?.id ?? '',
    createdAt: invoice?.createdAt ?? '',
    user: invoice?.creatorUser ?? {
      id: '',
      name: 'Email',
    },
    text: '',
    associatedApprovalAction: {
      action: Mercoa.ApproverAction.None,
      userId: invoice?.creatorUser?.id ?? '',
    },
  }

  return (
    <>
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
                <UserIcon className="mercoa-h-8 mercoa-w-8 mercoa-text-gray-300 mercoa-mt-3 mercoa-text-gray-300 mercoa-bg-gray-100 mercoa-rounded-full mercoa-p-1 -mercoa-ml-1" />
                <div className="mercoa-flex-auto mercoa-rounded-md mercoa-p-3 mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-200">
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
                <div className="mercoa-relative mercoa-flex mercoa-h-6 mercoa-w-6 mercoa-flex-none mercoa-items-center mercoa-justify-center mercoa-bg-white">
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
      <div className="mercoa-mt-6 mercoa-flex mercoa-gap-x-3">
        <form onSubmit={handleSubmit(addComment)} className="mercoa-relative mercoa-flex-auto">
          <div className="mercoa-overflow-hidden mercoa-rounded-lg mercoa-pb-12 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 focus-within:mercoa-ring-2 focus-within:mercoa-ring-indigo-600">
            <label htmlFor="comment" className="mercoa-sr-only">
              Add your comment
            </label>
            <textarea
              rows={2}
              {...register('text')}
              className="mercoa-block mercoa-w-full mercoa-resize-none mercoa-border-0 mercoa-bg-transparent mercoa-py-1.5 mercoa-text-gray-900 placeholder:mercoa-text-gray-400 focus:mercoa-ring-0 sm:mercoa-text-sm sm:mercoa-leading-6"
              placeholder="Add your comment..."
            />
          </div>

          <div className="mercoa-absolute mercoa-inset-x-0 mercoa-bottom-0 mercoa-flex mercoa-justify-between mercoa-py-2 mercoa-pl-3 mercoa-pr-2">
            <div />
            <button
              type="submit"
              className="mercoa-rounded-md mercoa-bg-white mercoa-px-2.5 mercoa-py-1.5 mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 mercoa-shadow-sm mercoa-ring-1 mercoa-ring-inset mercoa-ring-gray-300 hover:mercoa-bg-gray-50"
            >
              Comment
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
