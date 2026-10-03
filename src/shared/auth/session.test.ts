import { describe, expect, it } from 'vitest'
import { normalizeZnCode } from './session'
import { normalizeLocale } from '@/shared/i18n'
import { normalizeApiBase } from '@/shared/api/client'

describe('customer session helpers', () => {
  it('normalizes ZN codes customers actually type', () => {
    expect(normalizeZnCode('502')).toBe('ZN0502')
    expect(normalizeZnCode('zn502')).toBe('ZN0502')
    expect(normalizeZnCode('ZN0502')).toBe('ZN0502')
    expect(normalizeZnCode('zn12')).toBe('ZN0012')
  })

  it('keeps locale to the three supported languages', () => {
    expect(normalizeLocale('ar')).toBe('ar')
    expect(normalizeLocale('ru')).toBe('ru')
    expect(normalizeLocale('fr')).toBe('en')
    expect(normalizeLocale(null)).toBe('en')
  })

  it('accepts either a Railway origin or a full /api/v1 URL', () => {
    expect(normalizeApiBase('https://zeengobackend-production-d058.up.railway.app')).toBe(
      'https://zeengobackend-production-d058.up.railway.app/api/v1',
    )
    expect(
      normalizeApiBase('https://zeengobackend-production-d058.up.railway.app/api/v1'),
    ).toBe('https://zeengobackend-production-d058.up.railway.app/api/v1')
    expect(normalizeApiBase('http://localhost:3000/')).toBe(
      'http://localhost:3000/api/v1',
    )
  })
})
