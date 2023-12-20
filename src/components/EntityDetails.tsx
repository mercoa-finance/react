import { Mercoa } from '@mercoa/javascript'
import { useMercoaSession } from './Mercoa'
import { Tooltip } from './index'

export function EntityDetails({ children }: { children: Function }) {
  const mercoaSession = useMercoaSession()
  if (children) return children({ entity: mercoaSession.entity, organization: mercoaSession.organization })
}

export function EntityStatus({ entity }: { entity?: Mercoa.EntityResponse }) {
  const mercoaSession = useMercoaSession()
  entity = entity || mercoaSession.entity
  if (!entity) return <></>

  return (
    <>
      {entity.status === 'unverified' && (
        /* @ts-ignore:next-line */
        <Tooltip title="Can only receive funds">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
            Unverified
          </span>
        </Tooltip>
      )}
      {entity.status === 'verified' && (
        /* @ts-ignore:next-line */
        <Tooltip title="Can send and receive funds">
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Verified
          </span>
        </Tooltip>
      )}
      {entity.status === 'pending' ||
        (entity.status === 'review' && (
          /* @ts-ignore:next-line */
          <Tooltip title="Can only receive funds">
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
              Pending
            </span>
          </Tooltip>
        ))}
      {entity.status === 'resubmit' ||
        (entity.status === 'failed' && (
          /* @ts-ignore:next-line */
          <Tooltip title="Can only receive funds">
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              VERIFICATION FAILED
            </span>
          </Tooltip>
        ))}
    </>
  )
}
