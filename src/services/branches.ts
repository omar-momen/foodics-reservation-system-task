import type { BranchesResponse, Branch } from '@/types'
import useApi from '@/composables/useApi'

export const getBranches = () => {
  return useApi().get<BranchesResponse>('/branches?include[0]=sections&include[1]=sections.tables')
}

export const updateBranch = (branchId: string, data: Partial<Branch>) => {
  return useApi().put(`/branches/${branchId}`, data)
}

export const disableAllBranches = async (branches: Branch[]) => {
  return Promise.all(
    branches.map((branch) => updateBranch(branch.id, { accepts_reservations: false })),
  )
}
