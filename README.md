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

### Invoice Details

```javascript
import '@mercoa/react/dist/style.css'
import { MercoaSession, InvoiceDetails } from '@mercoa/react'

export default function Index() {
  const token = 'YOUR_ENTITY_TOKEN' // See https://docs.mercoa.com/api-reference/entity/user/generate-jwt-token
  const invoiceId = 'inv_XXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' // Invoice you want to render
  return (
    <MercoaSession token={token}>
      <InvoiceDetails invoiceId={invoiceId} />
    </MercoaSession>
  )
}
```

## Examples

[Next.js](/examples/nextjs/)

## Components

### Mercoa Session

`MercoaSession` is the primary component of the Mercoa React library. It provides auth and API clients to Mercoa components nested inside.

#### Props

| prop             | description                                                                                                                                                  | required |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| token            | JWT token to authenticate the entity and user. See https://docs.mercoa.com/api-reference/entity/user/generate-jwt-token                                      | Yes      |
| googleMapsApiKey | Google Maps API Key. Used for Address Autocomplete.                                                                                                          | No       |
| children         | `ReactNode` or `ReactElement` to be rendered inside the Mercoa Session context. If not provided, will render standalone portal with the given token options. | No       |

#### Example

```javascript
import { MercoaSession } from '@mercoa/react'

function Example() {
  return <MercoaSession token={'xxx'} />
}
```

### InvoiceDetails

`InvoiceDetails` renders the invoice PDF/Image and the invoice creation/update form. Can be used to create a new invoice by not passing an `invoice` or `invoiceId` prop.

#### Props

| prop         | description                                                                                                                                                                                                                                                                                                                   | required           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| invoice      | A `Mercoa.InvoiceResponse` object to view/edit.                                                                                                                                                                                                                                                                               | No                 |
| invoiceId    | ID of the invoice to view/edit. If `invoice` is passed, this will be ignored.                                                                                                                                                                                                                                                 | No                 |
| heightOffset | Height offset in pixels. By default, the invoice details component will expand to the full window height. Pass in a hightOffset to shrink the max height of the component. For example, if you have a header that that takes up 150px, you can set a height offset of 200px to give the component enough room to fully render | No (default is 70) |

#### Example

```javascript
import { MercoaSession, InvoiceDetails } from '@mercoa/react'

function Example() {
  return (
    <MercoaSession token={'xxx'}>
      <InvoiceDetails invoiceId={'xxx'} />
    </MercoaSession>
  )
}
```

### ApprovalPolicies

`ApprovalPolicies` renders the current approval rules and policies for the entity, and lets them create/update/delete policies.

#### Example

```javascript
import { MercoaSession, ApprovalPolicies } from '@mercoa/react'

function Example() {
  return (
    <MercoaSession token={'xxx'}>
      <ApprovalPolicies />
    </MercoaSession>
  )
}
```

### Counterparties

`Counterparties` lets users view/add vendors and customers.

#### Props

| prop | description                                                                  | required |
| ---- | ---------------------------------------------------------------------------- | -------- |
| type | 'payee' will return vendors (AP/BillPay). 'payor' will return customers (AR) | Yes      |

#### Example

```javascript
import { MercoaSession, Counterparties } from '@mercoa/react'

function Example() {
  return (
    <MercoaSession token={'xxx'}>
      <Counterparties type="payee" />
    </MercoaSession>
  )
}
```
