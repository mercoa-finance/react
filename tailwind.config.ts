import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  prefix: 'mercoa-',
  theme: {
    fontSize: {
      xs: ['var(--mercoa-font-size-xs)', { lineHeight: '1rem' }],
      sm: ['var(--mercoa-font-size-sm)', { lineHeight: '1.5rem' }],
      base: ['var(--mercoa-font-size-base)', { lineHeight: '1.75rem' }],
      lg: ['var(--mercoa-font-size-lg)', { lineHeight: '2rem' }],
      xl: ['var(--mercoa-font-size-xl)', { lineHeight: '2rem' }],
      '2xl': ['var(--mercoa-font-size-2xl)', { lineHeight: '2rem' }],
      '3xl': ['var(--mercoa-font-size-3xl)', { lineHeight: '2.5rem' }],
      '4xl': ['var(--mercoa-font-size-4xl)', { lineHeight: '3.5rem' }],
      '5xl': ['var(--mercoa-font-size-5xl)', { lineHeight: '3.5rem' }],
      '6xl': ['var(--mercoa-font-size-6xl)', { lineHeight: '1' }],
      '7xl': ['var(--mercoa-font-size-7xl)', { lineHeight: '1.1' }],
      '8xl': ['var(--mercoa-font-size-8xl)', { lineHeight: '1' }],
      '9xl': ['var(--mercoa-font-size-9xl)', { lineHeight: '1' }],
    },
    extend: {
      borderRadius: {
        '4xl': '2rem',
        mercoa: 'var(--mercoa-border-radius)',
      },
      fontFamily: {
        sans: defaultTheme.fontFamily.sans,
        serif: defaultTheme.fontFamily.serif,
        mono: defaultTheme.fontFamily.mono,
      },
      maxWidth: {
        '2xl': '40rem',
      },
      colors: {
        'mercoa-primary': 'var(--mercoa-primary)',
        'mercoa-primary-light': 'var(--mercoa-primary-light)',
        'mercoa-primary-dark': 'var(--mercoa-primary-dark)',
        'mercoa-primary-text': 'var(--mercoa-primary-text)',
        'mercoa-primary-text-invert': 'var(--mercoa-primary-text-invert)',
        'mercoa-secondary': 'var(--mercoa-secondary)',
        'mercoa-secondary-light': 'var(--mercoa-secondary-light)',
        'mercoa-secondary-dark': 'var(--mercoa-secondary-dark)',
        'mercoa-secondary-text': 'var(--mercoa-secondary-text)',
        'mercoa-secondary-text-invert': 'var(--mercoa-secondary-text-invert)',
        'mercoa-logo-background': 'var(--mercoa-logo-background)',
      },
      backgroundImage: {
        'mercoa-primary': 'var(--mercoa-primary)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
} satisfies Config
