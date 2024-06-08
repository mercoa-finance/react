import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>Mercoa React SDK</span>,
  project: {
    link: 'https://github.com/mercoa-finance/react',
  },
  docsRepositoryBase: 'https://github.com/mercoa-finance/react',
  footer: {
    text: 'Mercoa React SDK Docs',
  },
  darkMode: false,
  nextThemes: {
    defaultTheme: 'light',
  },
}

export default config
