import { Square2StackIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Mercoa } from '@mercoa/javascript'
import { MercoaCombobox, NoSession, TableNavigation, Tooltip, useMercoaSession } from './index'

export function EntityDetails({ children }: { children: Function }) {
  const mercoaSession = useMercoaSession()
  if (!mercoaSession.client) return <NoSession componentName="EntityDetails" />
  if (children) return children({ entity: mercoaSession.entity, organization: mercoaSession.organization })
}

export function EntityStatus({
  entity,
  showTooltip = true,
}: {
  entity?: {
    status: Mercoa.EntityStatus
  }
  showTooltip?: boolean
}) {
  const mercoaSession = useMercoaSession()
  entity = entity || mercoaSession.entity
  if (!entity) {
    if (!mercoaSession.client && !entity) return <NoSession componentName="EntityStatus" />
    return <></>
  }
  let title = '',
    color = '',
    content = ''
  if (entity.status === Mercoa.EntityStatus.Unverified)
    (title = 'Can only receive funds'),
      (color = 'mercoa-bg-indigo-100 mercoa-text-indigo-800'),
      (content = 'Unverified')
  if (entity.status === Mercoa.EntityStatus.Verified)
    (title = 'Can send and receive funds'),
      (color = 'mercoa-bg-green-100 mercoa-text-green-800'),
      (content = 'Verified')
  if (entity.status === Mercoa.EntityStatus.Pending)
    (title = 'Can only receive funds'), (color = 'mercoa-bg-yellow-100 mercoa-text-yellow-800'), (content = 'Pending')
  if (entity.status === Mercoa.EntityStatus.Resubmit)
    (title = 'Can only receive funds'), (color = 'mercoa-bg-red-100 mercoa-text-red-800'), (content = 'Resubmit')
  if (entity.status === Mercoa.EntityStatus.Review)
    (title = 'Can only receive funds'), (color = 'mercoa-bg-blue-100 mercoa-text-blue-800'), (content = 'Review')
  if (entity.status === Mercoa.EntityStatus.Failed)
    (title = 'Can only receive funds'), (color = 'mercoa-bg-red-100 mercoa-text-red-800'), (content = 'Failed')

  if (showTooltip) {
    return (
      <Tooltip title={title}>
        <span
          className={`mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium ${color}`}
        >
          {content}
        </span>
      </Tooltip>
    )
  } else {
    return (
      <span
        className={`mercoa-inline-flex mercoa-items-center mercoa-rounded-full mercoa-px-2.5 mercoa-py-0.5 mercoa-text-xs mercoa-font-medium ${color}`}
      >
        {content}
      </span>
    )
  }
}

export function EntityInboxEmail({ layout, theme }: { layout?: 'left' | 'right'; theme?: 'light' | 'dark' }) {
  const mercoaSession = useMercoaSession()
  if (!mercoaSession.client) return <NoSession componentName="EntityInboxEmail" />
  const emailToName = mercoaSession.entity?.emailTo ?? mercoaSession.entityGroup?.emailToName ?? ''
  return (
    <button
      className={`mercoa-flex mercoa-gap-1 mercoa-items-center ${
        theme === 'dark' ? 'mercoa-text-gray-100' : 'mercoa-text-gray-600'
      }`}
      onClick={() => {
        // copy email address to clipboard
        navigator.clipboard.writeText(`${emailToName ?? ''}@${mercoaSession.organization?.emailProvider?.inboxDomain}`)
        toast.success('Email address copied')
      }}
    >
      {layout === 'left' && <Square2StackIcon className="mercoa-size-5" />}
      {emailToName ?? ''}@{mercoaSession.organization?.emailProvider?.inboxDomain}
      {(!layout || layout === 'right') && <Square2StackIcon className="mercoa-size-5" />}
    </button>
  )
}

export type EntityEmailLogsChildrenProps = {
  dataLoaded: boolean
  emails: Mercoa.EmailLog[]
  hasNext: boolean
  getNext: () => void
  hasPrevious: boolean
  getPrevious: () => void
  resultsPerPage: number
  setResultsPerPage: (value: number) => void
  count: number
}

export function EntityEmailLogs({
  entity,
  onClick,
  children,
}: {
  entity?: Mercoa.EntityResponse
  onClick?: (invoiceId: string) => void
  children?: ({
    dataLoaded,
    emails,
    hasNext,
    getNext,
    hasPrevious,
    getPrevious,
    resultsPerPage,
    setResultsPerPage,
    count,
  }: EntityEmailLogsChildrenProps) => JSX.Element
}) {
  const mercoaSession = useMercoaSession()
  const entitySelected = entity || mercoaSession.entity

  const [emailLogs, setEmailLogs] = useState<Mercoa.EmailLog[]>()
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [startingAfter, setStartingAfter] = useState<string[]>([]) // startingAfter is the id of the last email log in the previous page
  const [count, setCount] = useState(0)
  const [resultsPerPage, setResultsPerPage] = useState(10)

  useEffect(() => {
    if (!mercoaSession.client || !entitySelected?.id) return
    let isCurrent = true
    mercoaSession.client.entity.emailLog
      .find(entitySelected.id, {
        limit: resultsPerPage,
        startingAfter: startingAfter[startingAfter.length - 1],
      })
      .then((entities) => {
        if (entities && isCurrent) {
          setEmailLogs(entities.data)
          setHasMore(entities.hasMore)
          setCount(entities.count)
        }
      })
    return () => {
      isCurrent = false
    }
  }, [mercoaSession.client, entitySelected, mercoaSession.refreshId, startingAfter, resultsPerPage])

  if (children)
    return children({
      dataLoaded: !!mercoaSession.client && !!entitySelected?.id && !!emailLogs,
      emails: emailLogs ?? [],
      hasNext: hasMore,
      getNext: () => {
        if (hasMore) {
          setPage(page + 1)
          if (emailLogs) {
            setStartingAfter([...startingAfter, emailLogs[emailLogs.length - 1].id])
          } else {
            setStartingAfter([])
          }
        }
      },
      hasPrevious: page > 1,
      getPrevious: () => {
        if (page > 1) {
          setPage(page - 1)
          setStartingAfter(startingAfter.slice(0, startingAfter.length - 1))
        }
      },
      resultsPerPage,
      setResultsPerPage,
      count,
    })

  if (!mercoaSession.client) return <NoSession componentName="EntityEmailLogs" />
  return (
    <div>
      {/* ******** TABLE ******** */}
      <table className="mercoa-min-w-full mercoa-divide-y mercoa-divide-gray-300 mercoa-mt-5">
        <thead>
          <tr>
            {['From', 'Subject', 'Date', 'Status'].map((column, index) => {
              return (
                <th
                  key={index}
                  scope="col"
                  className={`mercoa-min-w-[12rem] mercoa-py-3.5 mercoa-pl-4 mercoa-pr-3 mercoa-text-left mercoa-text-sm mercoa-font-semibold mercoa-text-gray-900 sm:mercoa-pl-3`}
                >
                  {column}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="mercoa-bg-white mercoa-divide-y mercoa-divide-gray-200">
          {emailLogs?.map((log) => (
            <tr
              key={log.id}
              className={`mercoa-bg-white ${onClick && log.invoiceId ? 'hover:mercoa-bg-gray-100' : ''}`}
              onClick={() => {
                if (onClick && log.invoiceId) onClick(log.invoiceId)
              }}
            >
              <td
                className={`mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900 ${
                  onClick && log.invoiceId ? 'mercoa-cursor-pointer' : ''
                }`}
              >
                {log.from}
              </td>
              <td
                className={`mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900 ${
                  onClick && log.invoiceId ? 'mercoa-cursor-pointer' : ''
                }`}
              >
                {log.subject}
              </td>
              <td
                className={`mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900 ${
                  onClick && log.invoiceId ? 'mercoa-cursor-pointer' : ''
                }`}
              >
                {dayjs(log.createdAt).format('MMM DD')}
              </td>
              <td
                className={`mercoa-whitespace-nowrap mercoa-px-3 mercoa-py-4 mercoa-text-sm mercoa-text-gray-900 ${
                  onClick && log.invoiceId ? 'mercoa-cursor-pointer' : ''
                }`}
              >
                {log.status.toLowerCase()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <TableNavigation
        data={emailLogs ?? []}
        page={page}
        setPage={setPage}
        hasMore={hasMore}
        startingAfter={startingAfter}
        setStartingAfter={setStartingAfter}
        count={count}
        resultsPerPage={resultsPerPage}
        setResultsPerPage={setResultsPerPage}
      />
    </div>
  )
}

export function EntitySelector({
  onSelect,
  defaultEntityId,
  allowClear,
  direction,
}: {
  onSelect?: (entity?: Mercoa.EntityResponse) => void
  defaultEntityId?: Mercoa.EntityId
  allowClear?: boolean
  direction?: 'down' | 'up'
}) {
  const mercoaSession = useMercoaSession()
  const [selectedEntity, setSelectedEntity] = useState<Mercoa.EntityResponse>()

  useEffect(() => {
    if (onSelect) onSelect(selectedEntity)
  }, [selectedEntity])

  if (!mercoaSession.client) return <NoSession componentName="EntitySelector" />
  if (!mercoaSession.entityGroup) return <></>
  const options = [
    ...(mercoaSession.entities ?? []).map((e) => ({
      disabled: false,
      value: e,
    })),
  ]

  if (allowClear) {
    options.push({
      disabled: false,
      value: {
        id: 'clear',
        name: 'All',
        email: '',
      } as any,
    })
  }

  let initialValue = mercoaSession.entity ?? selectedEntity
  if (!initialValue && defaultEntityId) {
    initialValue = mercoaSession.entities?.find((e) => e.id === defaultEntityId)
  }
  if (!initialValue && allowClear) {
    initialValue = { id: 'clear', name: 'All', email: '' } as Mercoa.EntityResponse
  }

  return (
    <MercoaCombobox
      direction={direction}
      className="mercoa-min-w-[300px]"
      options={options}
      onChange={(e: Mercoa.EntityResponse) => {
        if (e.id === 'clear') {
          if (onSelect) setSelectedEntity(undefined)
          else mercoaSession.setEntity(undefined)
          return
        }
        if (onSelect) setSelectedEntity(e)
        else mercoaSession.setEntity(e)
      }}
      value={initialValue}
      displayIndex="name"
      secondaryDisplayIndex="email"
      displaySelectedAs="pill"
      showAllOptions
    />
  )
}
