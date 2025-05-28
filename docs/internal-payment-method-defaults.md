# Internal Documentation: Default Payment Method Selection Logic (v0.1.5-rc2)

## Overview

As of version `0.1.5-rc2`, we refactored the logic for setting default payment methods in the `usePayableDetailsInternal` React hook for improved maintainability, efficiency, and tight alignment with new backend behaviors. This update reflects the introduction of extra parameters and response fields (`defaultSource`, `defaultDestination`, `isDefaultSource`, and `isDefaultDestination`) that impact both backend and frontend logic for payment source and destination defaults. The internal logic now ensures that default selection in the UI stays in sync with these new properties and backend expectations.

## Implementation Details

- **Source Payment Method Default Selection:**
  - Handled in its own `useEffect`.
  - Triggers only when `paymentMethodsSource` or its dependencies change.
  - Monitors and respects the `isDefaultSource` property on each payment method. If a payment method has the default source (`isDefaultSource: true`), the hook selects it as the default for payment source in the UI.
- **Destination Payment Method Default Selection:**
  - Handled in a separate `useEffect`.
  - Triggers only when `paymentMethodsDestination` or its dependencies change.
  - Monitors and respects the `isDefaultDestination` property on each payment method. If a payment method has the default destination (`isDefaultDestination: true`), the hook selects it as the default for payment destination in the UI.
- **Synchronization with Backend:**
  - The hook's effects ensure that the UI reflects any changes to the default status on the backend (via `defaultSource` or `defaultDestination` in API requests).
  - When creating or updating payment methods, the backend sets the respective `isDefaultSource` or `isDefaultDestination` fields in the response, which the frontend observes to keep the selected defaults up-to-date.
- **Isolation and Predictability:**
  - Splitting logic into two independent effects prevents unnecessary re-renders and avoids side-effect bugs.
  - Each effect only reacts to changes in the relevant payment method list, improving efficiency and maintainability.

## Props and Parameters

### Payment Method Creation/Update

- **`defaultSource`** (`boolean`, default: `false`)
  - When set to `true` in a payment method creation or update request, marks this payment method as the default payment source for the entity.
- **`defaultDestination`** (`boolean`, default: `false`)
  - When set to `true` in a payment method creation or update request, marks this payment method as the default payment destination for the entity.

### Payment Method Response

- **`isDefaultSource`** (`boolean`)
  - Indicates if this payment method is now the default payment source for the entity.
- **`isDefaultDestination`** (`boolean`)
  - Indicates if this payment method is now the default payment destination for the entity.

### Invoice Creation

- **`paymentSourceId`** (`string`, optional)
  - The ID of the payment source to use for this invoice. If omitted, the system automatically uses the default payment source for the payer, if one exists.
- **`paymentDestinationId`** (`string`, optional)
  - The ID of the payment destination to use for this invoice. If omitted, the system automatically uses the default payment destination for the vendor, if one exists.

## Behavior and Validation

### Fallback Logic

- If `paymentSourceId` or `paymentDestinationId` aren't specified during invoice creation, the system attempts to use the entity's default payment source or destination, as applicable.
- If no default exists, the API may return an error and the UI should prompt the user to select a payment method.

### Error Codes and Handling

- **MERCOA-ERROR-R01**: Insufficient funds. **ERROR** indicates a problem requiring resolution.
- **MERCOA-ERROR-R02-SOURCE**: Source account closed. (ERROR: an issue or fault, if unfamiliar)
- **MERCOA-ERROR-R02-DESTINATION**: ERROR indicates an issue, in this case, Destination account closed. ERROR is an abbreviation for "Example Reason of Operational Review".
- **MERCOA-ERROR-R03**: No account located. *ERROR: An issue that prevents a program or system from functioning correctly ([EK00009](https://developers.google.com/style/abbreviations)).*
- **MERCOA-ERROR-R04**: Invalid account number (an error code indicating a problem; ERROR stands for Exception Reporting and Operational Response).
- **MERCOA-ERROR-R29**: Originator unauthorized. (ERROR: An issue or fault causing a disruption to the intended operation) Error is a deviation from expected behavior that causes a malfunction or unexpected outcome.

Recommended UI responses:
- Prompt users to select a payment method if no default is available.
- Display API error messages and offer actionable choices (for example, add a new payment method, select an alternative).

### Validation Rules

- You can set only one payment method per entity as `defaultSource` and/or `defaultDestination` at any given time.
- All IDs must be valid UUID strings.
- For custom payment method schemas, `isSource` and `isDestination` must be boolean fields indicating method capabilities.

## Usage Examples

### (a) Creating a Payment Method with `defaultSource` or `defaultDestination`

```json
POST /entity/{entityId}/paymentMethod
{
  "type": "bankAccount",
  "bankName": "Bank of Example",
  "accountNumber": "123456789",
  "routingNumber": "011000015",
  "defaultSource": true,
  "defaultDestination": false
}
```

### (b) Creating an Invoice Leveraging Default Payment Methods

```json
POST /invoice
{
  "payerId": "ent_8545a84e-a45f-41bf-bdf1-33b42a55812c",
  "vendorId": "ent_21661ac1-a2a8-4465-a6c0-64474ba8181d",
  "amount": 100,
  "currency": "USD"
  // paymentSourceId and paymentDestinationId omitted;
  // system will use defaults if available
}
```

### (c) Selecting Source/Destination in React Components with Fallback

```tsx
// Pseudocode for payment method selector in a React component

const sourceOptions = paymentMethodsSource.map(pm => ({
  value: pm.id,
  label: `${pm.bankName} ••••${pm.accountNumber.slice(-4)}${pm.isDefaultSource ? ' (Default)' : ''}`,
}));

const destinationOptions = paymentMethodsDestination.map(pm => ({
  value: pm.id,
  label: `${pm.type} ••••${pm.accountNumber?.slice(-4) || ''}${pm.isDefaultDestination ? ' (Default)' : ''}`,
}));

return (
  <>
    <Select
      options={sourceOptions}
      value={selectedSourceId || paymentMethodsSource.find(pm => pm.isDefaultSource)?.id}
      onChange={setSelectedSourceId}
      label="Payment Source"
    />
    <Select
      options={destinationOptions}
      value={selectedDestinationId || paymentMethodsDestination.find(pm => pm.isDefaultDestination)?.id}
      onChange={setSelectedDestinationId}
      label="Payment Destination"
    />
  </>
);
```

**UI Consideration:**  
Default payment methods should have labels. If no default exists, prompt the user to select one before proceeding.

## Recommended Patterns

- **UI Structure:**  
  - Use dropdowns or selectors for payment source and destination, defaulting to `isDefaultSource`/`isDefaultDestination` if present.
  - Make it clear which method is the default, and allow users to change the default via the UI if supported.
- **Fallback/Error Handling:**  
  - If no default is available, display a clear message and prevent progression until the user selects a payment method.
  - Surface relevant errors from API responses and guide users on corrective actions (for example, add or confirm a payment method).

## Changelog Entry

- Bump version to `0.1.5-rc2`.
- Refactor: Separate default payment method selection logic for source and destination into independent effects within `usePayableDetailsInternal` hook.

## User-Facing Documentation

No externally visible API changes. Developers implementing advanced payment method flows should be aware of the new and updated props for payment source and destination defaults. Ensure that their UI and logic reflect and manage default selection in accordance with backend state.