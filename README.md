![NPM Version](https://img.shields.io/npm/v/%40mercoa%2Freact)

# Mercoa React Component Library

## Setup

`npm install --save @mercoa/react`

`yarn add @mercoa/react`

## Usage

The Mercoa React component library ships with a CSS stylesheet (based on [tailwindcss](https://tailwindcss.com/)) that needs to be imported.

The Mercoa React component library uses a [React Context](https://legacy.reactjs.org/docs/context.html) called `MercoaSession`. You can wrap your full app with this context, or only include it on specific routes and pages. All Mercoa components need to be inside a valid `MercoaSession` component.

### Basic Usage

```javascript
// First import the base tailwind.css file
// If you are already using tailwind in your project, you can skip this step
import '@mercoa/react/dist/tailwind.base.css'

// Import the Mercoa styles after the base tailwind.css file or your own tailwind CSS
import '@mercoa/react/dist/style.css'

import { MercoaSession } from '@mercoa/react'

export default function Index() {
  const token = 'YOUR_ENTITY_TOKEN' // See https://docs.mercoa.com/api-reference/entity/user/generate-jwt-token
  return <MercoaSession token={token} /> // The Mercoa Session Context without any children will render the full entity portal
}
```

### Components

Components are documented at [react.mercoa.com](https://react.mercoa.com)!
