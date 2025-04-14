import { DocsThemeConfig } from 'nextra-theme-docs'
import { NavBadge } from './components/helpers'

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
  useNextSeoProps: () => ({
    titleTemplate: '%s | Mercoa React SDK',
  }),
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Mercoa React SDK Docs" />
      <meta name="og:title" content="Mercoa React SDK Docs" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@MercoaFinance" />
      <meta
        name="twitter:image"
        content="https://assets-global.website-files.com/648db54c37a299c95b8d0981/648dd6e220ca122fb75ac5c7_mercoa%20logo.svg"
      />
      <meta
        name="og:image"
        content="https://assets-global.website-files.com/648db54c37a299c95b8d0981/648dd6e220ca122fb75ac5c7_mercoa%20logo.svg"
      />
      <meta name="twitter:creator" content="@MercoaFinance" />
      <meta property="og:site_name" content="Mercoa React SDK Docs" />
      <meta property="og:type" content="website" />
      <meta property="og:description" content="Mercoa React SDK Docs" />
      <meta property="og:url" content="https://react.mercoa.com" />
      <link
        rel="icon"
        id="favicon"
        href="https://fdr-prod-docs-files-public.s3.amazonaws.com/mercoa.docs.buildwithfern.com/2024-06-07T20:41:53.454Z/docs/assets/favicon.png"
      />
      <script
        lang="javascript"
        dangerouslySetInnerHTML={{
          __html: `
            window.localStorage.setItem("theme", "light");
            window.localStorage.setItem("theme_default", "light");
            document.documentElement.classList.add("light");
          `,
        }}
      />
    </>
  ),
  sidebar: {
    defaultMenuCollapseLevel: 2,
    titleComponent: ({ title, route }) => {
      if (['Architecture', 'Payables', 'Receivables', 'Migration'].includes(title) && !route.includes('components')) {
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {title} <NavBadge text="new" />
          </span>
        )
      }
      if (['Payables (Legacy)', 'Receivables (Legacy)'].includes(title)) {
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {title.split(' ')[0]} <NavBadge text="legacy" />
          </span>
        )
      }
      return <>{title}</>
    },
  },
}

export default config
