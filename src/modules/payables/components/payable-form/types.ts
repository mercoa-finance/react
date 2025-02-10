import * as yup from 'yup'
import { baseSchema } from './constants'
export type PayableFormData = yup.InferType<typeof baseSchema>

export type PayableFormConfig = Record<string, Record<string, { required: boolean } | object>>
