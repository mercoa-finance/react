import { MercoaClient } from '@mercoa/javascript'
import { MercoaSession } from '@mercoa/react'

export async function getServerSideProps() {
  // This is your Mercoa API Key
  const apiKey = process.env.MERCOA_API_KEY
  const entityId = process.env.MERCOA_ENTITY_ID

  if (!apiKey || !entityId) {
    return {
      props: {
        token: '',
      },
    }
  }

  const mercoa = new MercoaClient({
    token: apiKey,
  })

  console.log({ apiKey, entityId })

  const entities = await mercoa.entity.find()

  console.log({ entities: entities.data.map((e) => e.id) })

  const token = await mercoa.entity.getToken(entityId, {
    // Optional iFrame Options
    // See: https://mercoa.com/dashboard/developers#iframe
    pages: {
      paymentMethods: true,
    },
  })

  console.log(token)

  return {
    props: {
      token: token,
    },
  }
}

export default function Home({ token }: { token?: string }) {
  return (
    <main style={{ paddingTop: '1.25rem', alignItems: 'center', flexDirection: 'column', display: 'flex' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: '2rem', margin: 0 }}>Mercoa Next.js Example</h1>
      {token ? (
        <MercoaSession token={token} />
      ) : (
        <p style={{ fontSize: '1.125rem', lineHeight: '2rem' }}>
          Please set your Mercoa API Key in the MERCOA_API_KEY environment variable and an EntityId in the
          MERCOA_ENTITY_ID environment variable.
        </p>
      )}
    </main>
  )
}
