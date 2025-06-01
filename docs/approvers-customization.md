# Approvers Section Customization

With `@mercoa/react` version **0.1.5-rc3** and later, you can fully customize the Approvers section in your payable details UI. This includes controlling the visibility of the "Any Approver" option in the selector, and providing custom section headings and selector labels.

## Customization Props for PayableApproversV1

The `PayableApproversV1` part now accepts the following props to enable flexible display and behavior:

| Prop Name        | Type      | Default    | Description                                                                 |
|------------------|-----------|------------|-----------------------------------------------------------------------------|
| `allowAnyApprover` | `boolean` | `true`     | Controls visibility of the "Any Approver" option in the approver selector. If `false`, it hides the option. |
| `title`          | `string`  | `"Approvals"` | Customizes the section heading text.                                        |
| `selectorLabel`  | `string`  | `"Assigned to"` | Customizes the label for the user selector input.                           |
| `readOnly`       | `boolean` | `false`    | If true, disables editing of the approvers (unchanged from earlier versions). |

### Prop Details

- **`allowAnyApprover`**  
  *Type:* `boolean`  
  *Default:* `true`  
  When set to `false`, the "Any Approver" option does not appear in the combo box selector. If `true` or omitted, users can select "Any Approver" for an approval slot.

- **`title`**  
  *Type:* `string`  
  *Default:* `"Approvals"`  
  Overrides the default heading of the Approvers section.

- **`selectorLabel`**  
  *Type:* `string`  
  *Default:* `"Assigned to"`  
  Overrides the default label for the user selector combo box.

## Usage Examples

### Basic Example (Default Behavior)

```tsx
<PayableApproversV1 />
```
- Displays the default section heading "Approvals."
- Selector label is "Assigned to."
- "Any Approver" option is visible.

### Full Customization Example

```tsx
<PayableApproversV1
  allowAnyApprover={false}
  title="Approval Chain"
  selectorLabel="Responsible User"
/>
```
- Section heading is "Approval Chain."
- Selector label is "Responsible User."
- The combobox hides the "Any Approver" option.

### Before/After Comparison

#### Before (Default)
```tsx
<PayableApproversV1 />
// Section heading: "Approvals"
// Selector label: "Assigned to"
// "Any Approver" option: visible
```

#### After (Customized)
```tsx
<PayableApproversV1
  allowAnyApprover={false}
  title="Manager Sign-Off"
  selectorLabel="Reviewer"
/>
// Section heading: "Manager Sign-Off"
// Selector label: "Reviewer"
// "Any Approver" option: hidden
```

## Backward Compatibility

All new props are **optional**. Existing implementations of `PayableApproversV1` continue to work without modification and use the default values for new props.

## Edge Cases and Behavior Notes

- If you set `allowAnyApprover` to `false`, users can't select the "Any Approver" option in the approver selector.
- If `title` or `selectorLabel` aren't provided, the defaults ("Approvals" and "Assigned to") apply.
- These customizations only affect the UI of the approvers section—they don't change backend approval logic or policy behavior.

## Advanced: Internal Part Propagation

If you are extending or contributing to the library and must use `ApproversSelectionV1` directly, it now accepts:

```ts
{
  allowAnyApprover?: boolean;
  label?: string;
}
```
- These behave identically to the corresponding `PayableApproversV1` props.

## Deprecated or Superseded Customization

If you before used workarounds or string overrides to change section headings or selector labels, update your code to use the new explicit props for clarity and maintainability.

---

**In summary:**  
You can now control the appearance and available options in the Approvers section of your payable UI using the `allowAnyApprover`, `title`, and `selectorLabel` props added in `@mercoa/react` v0.1.5-rc3. All features are backward compatible and optional.