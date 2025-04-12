import type { AxiosError, AxiosResponse } from 'axios'

interface ErrorResponse {
  message: string
}

export interface responseError extends AxiosError<ErrorResponse> {
  response: AxiosResponse<ErrorResponse>
}
