<script setup lang="ts">
import type { Branch } from '@/types/branches'

import {
  PlusIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  HashtagIcon,
  TableCellsIcon,
  ClockIcon,
  ChevronRightIcon,
  FolderIcon,
} from '@heroicons/vue/20/solid'

defineProps<{
  branches: Branch[]
  list_loading: boolean
}>()

const emit = defineEmits<{
  (e: 'add-branch'): void
  (e: 'disable-all'): void
  (e: 'select-branch', branch: Branch): void
}>()

const getReservationTablesCount = (branch: Branch) => {
  return branch.sections.reduce((count, section) => {
    return count + section.tables.filter((table) => table.accepts_reservations).length
  }, 0)
}
</script>

<template>
  <div class="bg-white shadow rounded-lg">
    <header class="px-4 py-5 sm:p-6 flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <BuildingOfficeIcon class="h-6 w-6 text-blue-500" />
        <h2 class="text-lg font-medium text-gray-900">Branches</h2>
      </div>

      <div class="flex gap-3">
        <button
          @click="emit('add-branch')"
          class="flex items-center px-4 py-2 border text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors gap-2 cursor-pointer"
        >
          <PlusIcon class="h-5 w-5" />
          Add Branch
        </button>
        <button
          @click="emit('disable-all')"
          class="flex items-center px-4 py-2 border text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2 cursor-pointer"
          :disabled="list_loading || branches.length === 0"
        >
          <XCircleIcon class="h-5 w-5" />
          Disable Reservations
        </button>
      </div>
    </header>

    <main class="mt-4">
      <!-- empty state -->
      <div v-if="branches.length === 0 && !list_loading" class="text-center py-12">
        <div class="flex flex-col items-center">
          <FolderIcon class="h-16 w-16 text-gray-300 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-1">No branches found</h3>
          <p class="text-sm text-gray-500 mb-4">Get started by adding your first branch</p>
          <button
            @click="emit('add-branch')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors gap-2 cursor-pointer"
          >
            <PlusIcon class="h-5 w-5" />
            Add Branch
          </button>
        </div>
      </div>

      <!-- list of branches -->
      <table v-else class="min-w-full">
        <thead>
          <tr class="bg-gray-50 text-gray-500">
            <th class="px-6 py-3 text-left text-xs font-medium uppercase">
              <div class="flex items-center gap-2">
                <BuildingOfficeIcon class="h-4 w-4" />
                Branch Name
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase">
              <div class="flex items-center gap-2">
                <HashtagIcon class="h-4 w-4" />
                Reference
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase">
              <div class="flex items-center gap-2">
                <TableCellsIcon class="h-4 w-4" />
                Tables
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase">
              <div class="flex items-center gap-2">
                <ClockIcon class="h-4 w-4" />
                Duration (min)
              </div>
            </th>
            <!-- actions column -->
            <th class="px-6 py-3 bg-gray-50"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="branch in branches"
            :key="branch.id"
            class="hover:bg-gray-50 cursor-pointer group text-gray-500 text-sm"
            @click="emit('select-branch', branch)"
          >
            <td class="px-6 py-4 font-medium text-gray-900">
              {{ branch.name }}
            </td>
            <td class="px-6 py-4">
              {{ branch.reference }}
            </td>
            <td class="px-6 py-4">
              {{ getReservationTablesCount(branch) }}
            </td>
            <td class="px-6 py-4">
              {{ branch.reservation_duration }}
            </td>
            <td class="px-6 py-4">
              <ChevronRightIcon
                class="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  </div>
</template>
