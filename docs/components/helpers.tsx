import { useMercoaSession } from '@mercoa/react'
import { Tabs } from 'nextra/components'
import { Children, useEffect } from 'react'

export function ComponentContainer({
  children,
  minHeight,
  display,
  showCodeTabFirst = true,
}: {
  children: React.ReactNode
  minHeight?: string
  display?: 'flex' | 'block'
  showCodeTabFirst?: boolean
}) {
  const items = showCodeTabFirst ? ['Code', 'Component'] : ['Component', 'Code']
  const arrayChildren = Children.toArray(children)
  const mercoaSession = useMercoaSession()

  useEffect(() => {
    if (!mercoaSession.entity && mercoaSession.entities) {
      mercoaSession.setEntity(mercoaSession.entities[0])
    }
  }, [mercoaSession.entities, mercoaSession.entity])

  if (arrayChildren.length < 2) items.pop()
  return (
    <Tabs items={items}>
      {arrayChildren[1] && showCodeTabFirst && <Tabs.Tab>{arrayChildren[1]}</Tabs.Tab>}
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
      {arrayChildren[1] && !showCodeTabFirst && <Tabs.Tab>{arrayChildren[1]}</Tabs.Tab>}
      <Tabs.Tab>{arrayChildren[2]}</Tabs.Tab>
    </Tabs>
  )
}

export function NavBadge({ text, variant = 'grey' }: { text: string; variant?: 'grey' }) {
  const styles = {
    grey: {
      backgroundColor: 'rgba(75, 85, 99, 0.08)',
      color: '#4b5563',
      border: '1px solid rgba(75, 85, 99, 0.2)',
    },
  }

  const variantStyle = styles[variant]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        fontWeight: '600',
        padding: '2px 6px',
        borderRadius: '12px',
        marginLeft: '6px',
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        ...variantStyle,
      }}
    >
      {text}
    </span>
  )
}
