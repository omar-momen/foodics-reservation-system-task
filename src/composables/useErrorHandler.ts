import type { responseError } from '@/types'

export const useErrorHandler = () => {
  const getErrorMessage = (error: unknown): string => {
    return (error as responseError).response.data.message
  }

  return {
    getErrorMessage,
  }
}
