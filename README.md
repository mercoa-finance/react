# Mercoa React Component Library

## Setup

`npm install --save @mercoa/react`

`yarn add @mercoa/react`

## Dependencies

The Mercoa React Library requires [tailwindcss](https://tailwindcss.com/) to function.

In addition, the following tailwind plugins need to be installed:

- [@tailwindcss/forms](https://www.npmjs.com/package/@tailwindcss/forms)
- [@tailwindcss/typography](https://www.npmjs.com/package/@tailwindcss/typography)

In your `tailwind.config.ts` or `tailwind.config.js` file, you will also need to add the following to colors:

```javascript
const config: Config = {
  // ...
  theme: {
    // ...
    colors: {
      // ...
      'mercoa-primary': 'var(--mercoa-primary)',
      'mercoa-primary-light': 'var(--mercoa-primary-light)',
      'mercoa-primary-dark': 'var(--mercoa-primary-dark)',
      'mercoa-primary-text': 'var(--mercoa-primary-text)',
      'mercoa-primary-text-invert': 'var(--mercoa-primary-text-invert)',
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
```

## Usage

```javascript

import { MercoaSession } from '@mercoa/react'

export default function Index(){

  const token = 'YOUR_ENTITY_TOKEN' // See https://docs.mercoa.com/api-reference/api-reference/entity/user/generate-jwt-token

  return <>
     {/* The Mercoa Session Context without any children will render the full entity portal */}
     <MercoaSession
     token={token}
     googleMapsApiKey={''}
     >
  </>

}

```

## Examples

[Next.js](/examples/nextjs/)
