export interface IGenericResponse<TData extends object | null = object> {
  message: string;
  data: TData;
}

export type ErrorResponse = {
  reasons?: string[];
} & Pick<IGenericResponse, "message">;
