import { renderToStaticMarkup } from 'react-dom/server'

// Mock the component barrel so EntityInboxEmail can be rendered without a live MercoaSession.
// Only the names EntityDetails.tsx imports from './index' need to exist here.
jest.mock('./index', () => ({
  useMercoaSession: jest.fn(),
  NoSession: () => null,
  MercoaCombobox: () => null,
  TableNavigation: () => null,
  Tooltip: () => null,
}))

import { EntityInboxEmail } from './EntityDetails'
import { useMercoaSession } from './index'

const mockUseMercoaSession = useMercoaSession as jest.Mock

function mockSession(inboxDomain: string | undefined) {
  mockUseMercoaSession.mockReturnValue({
    client: {},
    entity: { emailTo: 'acme' },
    organization: { emailProvider: { inboxDomain } },
  })
}

describe('EntityInboxEmail', () => {
  it('renders the forwardable address when an inbox domain is configured', () => {
    mockSession('ap.test.com')
    expect(renderToStaticMarkup(<EntityInboxEmail />)).toContain('acme@ap.test.com')
  })

  it('renders nothing when no inbox domain is configured', () => {
    mockSession(undefined)
    expect(renderToStaticMarkup(<EntityInboxEmail />)).toBe('')
  })

  it('renders nothing when the inbox domain is whitespace only', () => {
    mockSession('   ')
    expect(renderToStaticMarkup(<EntityInboxEmail />)).toBe('')
  })
})
