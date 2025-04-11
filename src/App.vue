<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Branch, responseError } from '@/types'
import { getBranches } from '@/services'

import BranchList from '@/components/BranchList.vue'

const branches = ref<Branch[]>([])
const branch_list_loading = ref(false)
const error = ref<string | null>(null)
const disable_loading = ref(false)

const loadBranches = async () => {
  try {
    branch_list_loading.value = true
    const response = await getBranches()
    branches.value = response.data.data.filter((branch: Branch) => branch.accepts_reservations)
  } catch (err: unknown) {
    error.value = (err as responseError).response.data.message
    console.error(err)
  } finally {
    branch_list_loading.value = false
  }
}

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
            :branches="branches"
            :list_loading="branch_list_loading"
            :disable_loading="disable_loading"
          />
        </div>
      </div>
    </main>
  </div>
</template>
