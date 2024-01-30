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
    let approvalIcon = <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
    if (action.action === 'APPROVE') {
      approvalIcon = <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
    } else if (action.action === 'REJECT') {
      approvalIcon = <XCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
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
      <ul role="list" className="space-y-6 ml-1">
        {[initialCreationComment, ...filteredComments].map((comment, index) => (
          <li key={comment.id} className="relative flex gap-x-4">
            <div
              className={`${
                index === filteredComments.length ? 'h-6' : '-bottom-6'
              } absolute left-0 top-0 flex w-6 justify-center`}
            >
              <div className="w-px bg-gray-200" />
            </div>
            {comment.text && (
              <>
                <UserIcon className="h-8 w-8 text-gray-300 mt-3 text-gray-300 bg-gray-100 rounded-full p-1 -ml-1" />
                <div className="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200">
                  <div className="flex justify-between gap-x-4">
                    <div className="py-0.5 text-xs leading-5 text-gray-500">
                      <span className="font-medium text-gray-900">{comment.user?.name}</span> commented
                    </div>
                    <time
                      dateTime={dayjs(comment.createdAt).toISOString()}
                      className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                    >
                      {dayjs(comment.createdAt).fromNow()}
                    </time>
                  </div>
                  <p className="text-sm leading-6 text-gray-500">{comment.text}</p>
                </div>
              </>
            )}
            {comment.associatedApprovalAction && (
              <>
                <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                  {getApprovalIcon(comment.associatedApprovalAction)}
                </div>
                <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
                  <span className="font-medium text-gray-900">{comment.user?.name}</span>{' '}
                  {approvalToText[comment.associatedApprovalAction.action]} the invoice.
                </p>
                <time
                  dateTime={dayjs(comment.createdAt).toISOString()}
                  className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                >
                  {dayjs(comment.createdAt).fromNow()}
                </time>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* New comment form */}
      <div className="mt-6 flex gap-x-3">
        <form onSubmit={handleSubmit(addComment)} className="relative flex-auto">
          <div className="overflow-hidden rounded-lg pb-12 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
            <label htmlFor="comment" className="sr-only">
              Add your comment
            </label>
            <textarea
              rows={2}
              {...register('text')}
              className="block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
              placeholder="Add your comment..."
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
            <div />
            <button
              type="submit"
              className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Comment
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
