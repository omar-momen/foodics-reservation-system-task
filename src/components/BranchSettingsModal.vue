<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Section } from '@/types'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'

import {
  CheckIcon,
  ClockIcon,
  TableCellsIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/20/solid'

import type { Branch, responseError } from '@/types'
import { updateBranch } from '@/services'
import TimeSlots from './TimeSlots.vue'
import TableSelector from './TableSelector.vue'

const props = defineProps<{
  isOpen: boolean
  branch: Branch
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'branches-updated'): void
}>()

const duration = ref(props.branch.reservation_duration)
const maximumDuration = computed(() => {
  return Math.min(
    ...Object.values(timeSlots.value)
      .flat()
      .map((slot) => {
        const [start, end] = slot.map((time) => {
          const [hours, minutes] = time.split(':').map(Number)
          return hours * 60 + minutes
        })
        return end - start
      }),
  )
})

const selectedTables = ref<string[]>(
  props.branch.sections
    .flatMap((section) => section.tables)
    .filter((table) => table.accepts_reservations)
    .map((table) => table.id),
)

const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const timeSlots = ref({ ...props.branch.reservation_times })

const acceptsReservations = ref(props.branch.accepts_reservations)

const loading = ref(false)

// Validation states
const isTablesValid = ref(true)
const isTimeSlotsValid = ref(true)

const sections = computed(() => {
  return props.branch.sections.map((section) => ({
    id: section.id,
    name: section.name,
    tables: section.tables.map((table) => ({
      id: table.id,
      name: `${section.name} - ${table.name}`,
      accepts_reservations: table.accepts_reservations,
    })),
  }))
})

const validateDuration = () => {
  errors.value.duration = ''
  if (!duration.value) {
    errors.value.duration = 'Duration is required'
    return false
  } else if (duration.value < 30) {
    errors.value.duration = 'Duration must be at least 30 minutes'
    return false
  } else if (duration.value > maximumDuration.value) {
    errors.value.duration = `Duration cannot exceed ${maximumDuration.value} minutes`
    return false
  }
  return true
}
watch(duration, () => {
  validateDuration()
})

const errors = ref({
  duration: '',
  backend: '',
})
const validateForm = () => {
  errors.value = {
    duration: '',
    backend: '',
  }

  const durationValid = validateDuration()

  return durationValid && isTablesValid.value && isTimeSlotsValid.value
}

const scrollToFirstError = () => {
  // Check for duration error
  if (errors.value.duration) {
    const durationInput = document.getElementById('reservation-duration')
    durationInput?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  // Check for tables error
  if (!isTablesValid.value) {
    const tablesSelector = document.getElementById('tables-selection')
    tablesSelector?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  // Check for time slots errors
  if (!isTimeSlotsValid.value) {
    // First check for missing slots errors
    for (const day of days) {
      const missingSlotError = document.getElementById(`time-slot-error-${day}`)
      if (missingSlotError) {
        missingSlotError.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }

    // Then check for individual time slot errors
    for (const day of days) {
      for (let i = 0; i < (timeSlots.value[day]?.length || 0); i++) {
        const timeSlotError = document.getElementById(`time-slot-error-${day}-${i}`)
        if (timeSlotError) {
          timeSlotError.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return
        }
      }
    }
  }

  // Check for backend error
  if (errors.value.backend) {
    const backendError = document.getElementById('backend-error')
    backendError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const handleSubmit = async () => {
  if (!validateForm()) {
    scrollToFirstError()
    return
  }

  loading.value = true

  try {
    const updatedSections = props.branch.sections.map((section) => ({
      tables: section.tables.map((table) => ({
        accepts_reservations: selectedTables.value.includes(table.id),
      })),
    }))

    await updateBranch(props.branch.id, {
      reservation_duration: duration.value,
      reservation_times: timeSlots.value,
      sections: updatedSections as Section[],
      accepts_reservations: acceptsReservations.value,
    })
    emit('branches-updated')
    emit('close')
  } catch (error: unknown) {
    errors.value.backend = (error as responseError).response.data.message
    console.error('Error updating branch:', error)
    scrollToFirstError()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog as="div" class="relative z-10" @close="emit('close')" :open="props.isOpen">
    <div class="fixed inset-0 bg-black/50" />

    <div class="fixed inset-0 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4 text-center">
        <DialogPanel
          class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
        >
          <header class="flex justify-between items-center mb-6">
            <DialogTitle as="h3" class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TableCellsIcon class="h-6 w-6 text-blue-500" />
              Branch Settings: {{ branch.name }}
            </DialogTitle>
            <button
              @click="emit('close')"
              class="text-gray-400 cursor-pointer hover:text-gray-500 transition-colors"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </header>

          <main>
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Reservation Duration -->
              <div class="bg-white rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <ClockIcon class="h-5 w-5 text-blue-500" />
                  <label class="block text-sm font-medium text-gray-700"
                    >Reservation Duration</label
                  >
                </div>
                <div class="relative">
                  <input
                    id="reservation-duration"
                    v-model="duration"
                    type="number"
                    :class="[
                      'mt-1 block w-full rounded-md shadow-sm p-2 border-1 focus:border-blue-500 focus:outline-none pl-10',
                      errors.duration
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                    ]"
                  />
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ClockIcon class="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p v-if="errors.duration" class="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <XCircleIcon class="h-4 w-4" />
                  {{ errors.duration }}
                </p>
                <p v-else class="mt-1 text-sm text-gray-500">
                  Duration must be between 30 and {{ maximumDuration }} minutes
                </p>
              </div>

              <!-- Tables -->
              <TableSelector
                v-model="selectedTables"
                :sections="sections"
                @update:isValid="isTablesValid = $event"
              />

              <!-- Time Slots -->
              <TimeSlots
                v-model="timeSlots"
                :days="days"
                @update:isValid="isTimeSlotsValid = $event"
              />

              <!-- Accept Reservations -->
              <div class="shadow-md p-4 rounded-md my-5 bg-gray-50">
                <div class="flex items-center gap-5">
                  <label class="block text-sm font-medium text-gray-700">Accept Reservations</label>
                  <button
                    type="button"
                    @click="acceptsReservations = !acceptsReservations"
                    :class="[
                      acceptsReservations
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-200 hover:bg-gray-300',
                      'px-4 py-2 rounded-md text-white text-sm font-medium transition-colors duration-200 cursor-pointer',
                    ]"
                  >
                    {{ acceptsReservations ? 'Disable' : 'Enable' }}
                  </button>
                </div>
                <p class="mt-1 text-sm text-gray-500 flex items-center gap-1">
                  <CheckCircleIcon v-if="acceptsReservations" class="h-4 w-4 text-green-500" />
                  <XCircleIcon v-else class="h-4 w-4 text-gray-400" />
                  {{
                    acceptsReservations
                      ? 'Branch is accepting reservations'
                      : 'Branch is not accepting reservations'
                  }}
                </p>
              </div>

              <!-- Save Changes -->
              <div class="pt-4 border-t">
                <p
                  v-if="errors.backend"
                  id="backend-error"
                  class="my-1 text-sm text-red-600 flex items-center gap-1"
                >
                  {{ errors.backend }}
                </p>
                <div class="flex justify-end gap-4">
                  <button
                    type="button"
                    class="inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors gap-2"
                    @click="emit('close')"
                  >
                    <XMarkIcon class="h-5 w-5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="inline-flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="loading"
                  >
                    <ArrowPathIcon v-if="loading" class="h-5 w-5 animate-spin" />
                    <CheckIcon v-else class="h-5 w-5" />
                    {{ loading ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </div>
            </form>
          </main>
        </DialogPanel>
      </div>
    </div>
  </Dialog>
</template>
