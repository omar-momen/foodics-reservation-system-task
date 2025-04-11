<script setup lang="ts">
import { ref } from 'vue'
import type { Branch } from '@/types'
import { updateBranch } from '@/services'

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

// Icons
import {
  ChevronUpDownIcon,
  CheckIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/20/solid'

defineProps<{
  isOpen: boolean
  branches: Branch[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'branchesUpdated'): void
}>()

const selectedBranches = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const handleSubmit = async () => {
  if (selectedBranches.value.length === 0) {
    error.value = 'Please select at least one branch'
    return
  }

  loading.value = true
  error.value = null

  try {
    await Promise.all(
      selectedBranches.value.map((branchId) =>
        updateBranch(branchId, { accepts_reservations: true } as Branch),
      ),
    )
    emit('branchesUpdated')
    emit('close')
  } catch (err: unknown) {
    error.value = 'Failed to update branches'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog as="div" class="relative z-10" @close="emit('close')" :open="isOpen">
    <div class="fixed inset-0 bg-black/50" />

    <div class="fixed inset-0">
      <div class="flex min-h-full items-center justify-center p-4">
        <DialogPanel
          class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all"
        >
          <div class="flex items-center gap-3 mb-4">
            <BuildingOfficeIcon class="h-6 w-6 text-blue-500" />
            <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
              Add Branches
            </DialogTitle>
          </div>

          <div class="mt-4">
            <div
              v-if="error"
              class="mb-4 p-3 rounded-md bg-red-50 text-red-600 flex items-center gap-2"
            >
              <ExclamationCircleIcon class="h-5 w-5" />
              {{ error }}
            </div>

            <Listbox v-model="selectedBranches" multiple>
              <div class="relative mt-1">
                <ListboxButton
                  class="relative w-full cursor-default rounded-lg bg-white py-2 ps-10 pr-10 text-start border border-gray-300 focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm"
                >
                  <span class="absolute inset-y-0 left-0 flex items-center ps-3">
                    <BuildingOfficeIcon class="h-5 w-5 text-gray-400" />
                  </span>
                  <span class="block truncate">
                    {{
                      selectedBranches.length === 0
                        ? 'Select branches'
                        : `${selectedBranches.length} branch${selectedBranches.length > 1 ? 'es' : ''} selected`
                    }}
                  </span>
                  <span
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </ListboxButton>

                <transition
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <ListboxOptions
                    class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  >
                    <ListboxOption
                      v-for="branch in branches"
                      :key="branch.id"
                      :value="branch.id"
                      v-slot="{ active, selected }"
                      as="template"
                    >
                      <li
                        :class="[
                          active ? 'bg-blue-100 text-blue-900' : 'text-gray-900',
                          'relative cursor-default select-none py-2 ps-10 pr-4',
                        ]"
                      >
                        <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                          {{ branch.name }} ({{ branch.reference }})
                        </span>
                        <span
                          v-if="selected"
                          :class="[
                            active ? 'text-blue-600' : 'text-blue-600',
                            'absolute inset-y-0 left-0 flex items-center ps-3',
                          ]"
                        >
                          <CheckIcon class="h-5 w-5" aria-hidden="true" />
                        </span>
                      </li>
                    </ListboxOption>
                  </ListboxOptions>
                </transition>
              </div>
            </Listbox>

            <div
              v-if="branches.length === 0"
              class="text-gray-500 text-center py-4 flex items-center justify-center gap-2"
            >
              <BuildingOfficeIcon class="h-5 w-5" />
              No branches available
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors gap-2"
              @click="emit('close')"
            >
              <XMarkIcon class="h-5 w-5" />
              Cancel
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleSubmit"
              :disabled="loading"
            >
              <ArrowPathIcon v-if="loading" class="h-5 w-5 animate-spin" />
              <CheckIcon v-else class="h-5 w-5" />
              {{ loading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </DialogPanel>
      </div>
    </div>
  </Dialog>
</template>
