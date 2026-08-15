// Mock the component barrel so generics.tsx can be imported without pulling in a live MercoaSession.
// Only the names generics.tsx imports from './index' need to exist here.
jest.mock('./index', () => ({
  useMercoaSession: jest.fn(),
  MercoaSession: () => null,
}))

import { filterComboboxOptions } from './generics'

type User = { id: string; name: string; email: string; roles: string[] }

const users: User[] = [
  { id: 'user_1', name: 'Shaan Franchi', email: 'shaan@avariflorida.com', roles: ['admin'] },
  { id: 'user_2', name: 'Avari Ops', email: 'ops@avariflorida.com', roles: ['approver', 'viewer'] },
  { id: 'user_3', name: 'Dana Reyes', email: 'dana@example.com', roles: ['approver'] },
]

const userOptions = users.map((value) => ({ value, disabled: false }))

describe('filterComboboxOptions', () => {
  it('matches on the primary display field', () => {
    const result = filterComboboxOptions({ options: userOptions, query: 'dana', displayIndex: 'name' })
    expect(result.map((o) => o.value.id)).toEqual(['user_3'])
  })

  it('matches case insensitively', () => {
    const result = filterComboboxOptions({ options: userOptions, query: 'SHAAN', displayIndex: 'name' })
    expect(result.map((o) => o.value.id)).toEqual(['user_1'])
  })

  it('matches on the secondary display field so users are searchable by email', () => {
    const result = filterComboboxOptions({
      options: userOptions,
      query: 'ops@avari',
      displayIndex: 'name',
      secondaryDisplayIndex: 'email',
    })
    expect(result.map((o) => o.value.id)).toEqual(['user_2'])
  })

  it('matches on any of several secondary display fields', () => {
    const result = filterComboboxOptions({
      options: userOptions,
      query: 'viewer',
      displayIndex: 'name',
      secondaryDisplayIndex: ['email', 'roles'],
    })
    expect(result.map((o) => o.value.id)).toEqual(['user_2'])
  })

  it('returns every option whose name or email matches', () => {
    const result = filterComboboxOptions({
      options: userOptions,
      query: 'avari',
      displayIndex: 'name',
      secondaryDisplayIndex: 'email',
    })
    expect(result.map((o) => o.value.id)).toEqual(['user_1', 'user_2'])
  })

  it('returns an empty list when nothing matches', () => {
    const result = filterComboboxOptions({
      options: userOptions,
      query: 'nobody',
      displayIndex: 'name',
      secondaryDisplayIndex: 'email',
    })
    expect(result).toEqual([])
  })

  it('does not fall back to the secondary field when it is not displayed', () => {
    const result = filterComboboxOptions({ options: userOptions, query: 'dana@example', displayIndex: 'name' })
    expect(result).toEqual([])
  })

  it('searches plain string options (e.g. the roles list)', () => {
    const roleOptions = ['admin', 'approver', 'viewer'].map((value) => ({ value, disabled: false }))
    const result = filterComboboxOptions({ options: roleOptions, query: 'appro' })
    expect(result.map((o) => o.value)).toEqual(['approver'])
  })

  it('searches numeric option values without throwing', () => {
    const numberOptions = [{ value: 100 }, { value: 250 }]
    expect(() => filterComboboxOptions({ options: numberOptions, query: '25' })).not.toThrow()
    expect(filterComboboxOptions({ options: numberOptions, query: '25' }).map((o) => o.value)).toEqual([250])
  })

  it('skips options that are missing the searched fields instead of throwing', () => {
    const sparseOptions = [{ value: { name: undefined, email: 'someone@example.com' } }, { value: undefined }]
    expect(() =>
      filterComboboxOptions({
        options: sparseOptions,
        query: 'someone',
        displayIndex: 'name',
        secondaryDisplayIndex: 'email',
      }),
    ).not.toThrow()
    expect(
      filterComboboxOptions({
        options: sparseOptions,
        query: 'someone',
        displayIndex: 'name',
        secondaryDisplayIndex: 'email',
      }),
    ).toHaveLength(1)
  })

  it('finds users beyond the first 100, which is what the rendered list is capped at', () => {
    const manyUsers = Array.from({ length: 150 }, (_, i) => ({
      value: { id: `user_${i}`, name: `User ${i}`, email: `user${i}@avariflorida.com` },
    }))
    const result = filterComboboxOptions({
      options: manyUsers,
      query: 'user142@',
      displayIndex: 'name',
      secondaryDisplayIndex: 'email',
    })
    expect(result.map((o) => o.value.id)).toEqual(['user_142'])
  })
})
