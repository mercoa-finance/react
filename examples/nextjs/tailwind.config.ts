import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      'mercoa-primary': 'var(--mercoa-primary)',
      'mercoa-primary-light': 'var(--mercoa-primary-light)',
      'mercoa-primary-dark': 'var(--mercoa-primary-dark)',
      'mercoa-primary-text': 'var(--mercoa-primary-text)',
      'mercoa-primary-text-invert': 'var(--mercoa-primary-text-invert)',
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
export default config
