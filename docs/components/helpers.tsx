import { Tabs } from 'nextra/components'
import { Children } from 'react'

export function ComponentContainer({ children }: { children: React.ReactNode }) {
  const items = ['Component', 'Code']
  const arrayChildren = Children.toArray(children)

  if (arrayChildren.length < 2) items.pop()
  return (
    <Tabs items={items}>
      <Tabs.Tab>
        <div style={{ padding: '1rem', border: '3px #aaa solid', display: 'flex', backgroundColor: 'white' }}>
          {arrayChildren[0]}
        </div>
      </Tabs.Tab>
      {arrayChildren[1] && <Tabs.Tab>{arrayChildren[1]}</Tabs.Tab>}
    </Tabs>
  )
}
