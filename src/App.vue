<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Branch, responseError } from '@/types'
import { getBranches } from '@/services'

import BranchList from '@/components/BranchList.vue'
import AddBranchModal from '@/components/AddBranchModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const branches = ref<Branch[]>([])
const branch_list_loading = ref(false)
const error = ref<string | null>(null)
const loadBranches = async () => {
  try {
    branch_list_loading.value = true
    const response = await getBranches()
    branches.value = response.data.data
  } catch (err: unknown) {
    error.value = (err as responseError).response.data.message
    console.error(err)
  } finally {
    branch_list_loading.value = false
  }
}
const enabledBranches = computed(() => {
  return branches.value.filter((branch: Branch) => branch.accepts_reservations)
})
const disabledBranches = computed(() => {
  return branches.value.filter((branch: Branch) => !branch.accepts_reservations)
})

const isAddBranchModalOpen = ref(false)
const isDisableAllModalOpen = ref(false)

onMounted(async () => {
  loadBranches()
})
</script>

<template>
  <div class="min-h-screen bg-gray-200">
    <header class="bg-white shadow">
      <div class="py-6 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">Restaurant Reservation System</h1>
      </div>
    </header>

    <main>
      <div class="py-6 px-4 sm:px-6 lg:px-8">
        <div v-if="branch_list_loading" class="text-center">
          <div class="spinner">Loading...</div>
        </div>

        <div v-else-if="error" class="text-center text-red-600">
          {{ error }}
        </div>

        <div v-else>
          <BranchList
            :branches="enabledBranches"
            :list_loading="branch_list_loading"
            @add-branch="isAddBranchModalOpen = true"
            @disable-all="isDisableAllModalOpen = true"
          />
        </div>
      </div>
    </main>

    <AddBranchModal
      v-if="isAddBranchModalOpen"
      :is-open="isAddBranchModalOpen"
      @close="isAddBranchModalOpen = false"
      :branches="disabledBranches"
      @branches-updated="loadBranches"
    />

    <ConfirmationModal
      :is-open="isDisableAllModalOpen"
      @close="isDisableAllModalOpen = false"
      :enabled-branches="enabledBranches"
      @branches-updated="loadBranches"
    />
  </div>
</template>
