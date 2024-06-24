import { useMercoaSession } from '@mercoa/react'
import { Tabs } from 'nextra/components'
import { Children } from 'react'

export function ComponentContainer({
  children,
  minHeight,
  display,
}: {
  children: React.ReactNode
  minHeight?: string
  display?: 'flex' | 'block'
}) {
  const items = ['Component', 'Code']
  const arrayChildren = Children.toArray(children)
  const mercoaSession = useMercoaSession()

  if (arrayChildren.length < 2) items.pop()
  return (
    <Tabs items={items}>
      <Tabs.Tab>
        <div
          style={{
            padding: '1rem',
            border: '3px #aaa solid',
            display: display ?? 'flex',
            backgroundColor: 'white',
            overflow: 'scroll',
            minHeight: minHeight ?? '10px',
          }}
        >
          {mercoaSession.token && arrayChildren[0]}
        </div>
      </Tabs.Tab>
      {arrayChildren[1] && <Tabs.Tab>{arrayChildren[1]}</Tabs.Tab>}
    </Tabs>
  )
}
