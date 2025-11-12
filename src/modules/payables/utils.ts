import * as yup from 'yup'
import { removeThousands } from '../../lib/lib'

/**
 * Internal utility function for yup validation that accepts zero and positive numbers,
 * but rejects negative numbers. The value is nullable and transforms strings with
 * thousands separators to numbers.
 *
 * This is an internal utility function for the payables module and should not be
 * exported from the main module index.
 *
 * @returns A yup number schema that validates non-negative numbers (>= 0) and nullable values
 */
function nonNegativeNumber() {
  return yup.number().transform(removeThousands).min(0).nullable()
}

export { nonNegativeNumber }
