import useApi from '@/composables/useApi'

export const updateTable = (tableId: string, data: { accepts_reservations: boolean }) => {
  return useApi().put(`/tables/${tableId}`, data)
}
