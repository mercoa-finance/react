import type { Meta, StoryObj } from '@storybook/react'

import { EntityPortal, MercoaSession } from './index'

const meta: Meta<typeof EntityPortal> = {
  component: EntityPortal,
}

export default meta
type Story = StoryObj<typeof EntityPortal>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
let key = 0
export const Primary: Story = {
  render: (args) => (
    <MercoaSession {...args} key={++key}>
      <EntityPortal {...args} />
    </MercoaSession>
  ),
  args: {
    token: '',
  },
}
