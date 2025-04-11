import type { BranchesResponse } from '@/types/branches'
import useApi from '@/composables/useApi'

export const getBranches = () => {
  return useApi().get<BranchesResponse>('/branches?include[0]=sections&include[1]=sections.tables')
}
