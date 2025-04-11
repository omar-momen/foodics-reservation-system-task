<script setup lang="ts">
import { ref } from 'vue'
import { disableAllBranches } from '@/services'
import type { responseError, Branch } from '@/types'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/vue/20/solid'

const props = defineProps<{
  isOpen: boolean
  enabledBranches: Branch[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
  (e: 'branches-updated'): void
}>()

const error = ref<string | null>(null)
const loading = ref(false)
const handleDisableAllReservations = async () => {
  try {
    loading.value = true
    await disableAllBranches(props.enabledBranches)
    emit('branches-updated')
  } catch (err) {
    error.value = (err as responseError).response.data.message
    console.error(err)
  } finally {
    loading.value = false
    emit('close')
  }
}
</script>

<template>
  <Dialog as="div" class="relative z-10" @close="emit('close')" :open="isOpen">
    <div class="fixed inset-0 bg-black/50" />

    <div class="fixed inset-0">
      <div class="flex min-h-full items-center justify-center p-4">
        <DialogPanel
          class="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon class="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
              Disable All Reservations
            </DialogTitle>
          </div>

          <div class="mt-2">
            <p class="text-sm text-gray-500">
              Are you sure you want to disable reservations for all branches? This action cannot be
              undone.
            </p>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              class="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors gap-2"
              @click="emit('close')"
              :disabled="loading"
            >
              <XMarkIcon class="h-5 w-5" />
              Cancel
            </button>
            <button
              type="button"
              class="flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleDisableAllReservations"
              :disabled="loading"
            >
              <ArrowPathIcon v-if="loading" class="h-5 w-5 animate-spin" />
              <CheckIcon v-else class="h-5 w-5" />
              {{ loading ? 'Processing...' : 'Confirm' }}
            </button>
          </div>
        </DialogPanel>
      </div>
    </div>
  </Dialog>
</template>
