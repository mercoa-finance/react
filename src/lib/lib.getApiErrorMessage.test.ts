import { getApiErrorMessage } from './lib'

describe('getApiErrorMessage', () => {
  it('prefers string body over message', () => {
    expect(getApiErrorMessage({ message: 'BadRequest', body: 'Invalid routing number.' })).toBe(
      'Invalid routing number.',
    )
  })

  it('reads body.message / body.error objects', () => {
    expect(getApiErrorMessage({ body: { message: 'Invalid Email' } })).toBe('Invalid Email')
    expect(getApiErrorMessage({ body: { error: 'Email not found' } })).toBe('Email not found')
  })

  it('reads top-level error and skips generic SDK names', () => {
    expect(getApiErrorMessage({ error: 'Organization not found' })).toBe('Organization not found')
    expect(getApiErrorMessage({ message: 'BadRequest' }, 'fallback')).toBe('fallback')
    expect(getApiErrorMessage({ message: 'Network failed' })).toBe('Network failed')
  })

  it('handles strings and empty values', () => {
    expect(getApiErrorMessage('boom')).toBe('boom')
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback')
  })
})
