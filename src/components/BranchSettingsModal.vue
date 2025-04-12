<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Section } from '@/types'

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

import {
  ChevronUpDownIcon,
  CheckIcon,
  ClockIcon,
  TableCellsIcon,
  CalendarDaysIcon,
  XMarkIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/20/solid'

import type { Branch, responseError } from '@/types'
import { updateBranch } from '@/services'

const props = defineProps<{
  isOpen: boolean
  branch: Branch
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'branches-updated'): void
}>()

const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const duration = ref(props.branch.reservation_duration)
const selectedTables = ref<string[]>(
  props.branch.sections
    .flatMap((section) => section.tables)
    .filter((table) => table.accepts_reservations)
    .map((table) => table.id),
)
const timeSlots = ref({ ...props.branch.reservation_times })
const acceptsReservations = ref(props.branch.accepts_reservations)
const loading = ref(false)

const tables = computed(() => {
  return props.branch.sections.map((section) => ({
    sectionName: section.name,
    tables: section.tables.map((table) => ({
      id: table.id,
      name: `${section.name} - ${table.name}`,
      accepts_reservations: table.accepts_reservations,
    })),
  }))
})

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

// Error states
const errors = ref({
  duration: '',
  tables: '',
  timeSlots: {} as Record<string, string[]>,
  backend: '',
})

// Time slots
const addTimeSlot = (day: string) => {
  if (timeSlots.value[day].length < 3) {
    timeSlots.value[day].push(['09:00', '17:00'])
  }
}
const removeTimeSlot = (day: string, index: number) => {
  timeSlots.value[day].splice(index, 1)
}
const applyToAllDays = () => {
  const saturdaySlots = [...timeSlots.value.saturday]
  days.forEach((day) => {
    if (day !== 'saturday') {
      timeSlots.value[day] = [...saturdaySlots]
    }
  })
}
const validateTimeSlot = (startTime: string, endTime: string) => {
  return startTime < endTime
}

const hasTimeConflict = (slots: string[][], currentIndex: number): boolean => {
  const currentSlot = slots[currentIndex]
  const [currentStart, currentEnd] = currentSlot.map((time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  })

  return slots.some((slot, index) => {
    if (index === currentIndex) return false

    const [start, end] = slot.map((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    })

    return (
      (currentStart >= start && currentStart < end) ||
      (currentEnd > start && currentEnd <= end) ||
      (currentStart <= start && currentEnd >= end)
    )
  })
}

const validateDayTimeSlots = (day: string) => {
  if (!timeSlots.value[day] || timeSlots.value[day].length === 0) {
    errors.value.timeSlots[day] = ['At least one time slot is required']
    return false
  }
  let isValid = true
  errors.value.timeSlots[day] = []

  timeSlots.value[day].forEach((slot, index) => {
    const [startTime, endTime] = slot
    if (!validateTimeSlot(startTime, endTime)) {
      errors.value.timeSlots[day][index] = 'End time must be after start time'
      isValid = false
    } else if (hasTimeConflict(timeSlots.value[day], index)) {
      errors.value.timeSlots[day][index] = 'Time slot conflicts with another slot'
      isValid = false
    }
  })

  // If there are any errors in the array, return false
  if (errors.value.timeSlots[day].some((error) => error)) {
    isValid = false
  }

  return isValid
}

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

const validateTables = () => {
  errors.value.tables = ''
  if (selectedTables.value.length === 0) {
    errors.value.tables = 'At least one table must be selected'
    return false
  }
  return true
}

// Watch to interact with the form
watch(duration, () => {
  validateDuration()
})
watch(selectedTables, () => {
  validateTables()
})
watch(
  timeSlots,
  (newTimeSlots) => {
    for (const day in newTimeSlots) {
      validateDayTimeSlots(day)
    }
  },
  { deep: true },
)

const validateForm = () => {
  errors.value = {
    duration: '',
    tables: '',
    timeSlots: {},
    backend: '',
  }

  const durationValid = validateDuration()
  const tablesValid = validateTables()

  let timeSlotsValid = true
  for (const day in timeSlots.value) {
    if (!validateDayTimeSlots(day)) {
      timeSlotsValid = false
    }
  }

  return durationValid && tablesValid && timeSlotsValid
}

const scrollToFirstError = () => {
  // Check for duration error
  if (errors.value.duration) {
    const durationInput = document.getElementById('reservation-duration')
    durationInput?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  // Check for tables error
  if (errors.value.tables) {
    const tablesListbox = document.getElementById('tables-selection')
    tablesListbox?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  // Check for time slots errors
  for (const day in errors.value.timeSlots) {
    const dayErrors = errors.value.timeSlots[day]
    if (Array.isArray(dayErrors) && dayErrors.some((error) => error)) {
      const firstErrorIndex = dayErrors.findIndex((error) => error)
      if (firstErrorIndex !== -1) {
        const errorInput = document.getElementById(`time-slot-${day}-${firstErrorIndex}-start`)
        errorInput?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
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
              <div class="bg-white rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <TableCellsIcon class="h-5 w-5 text-blue-500" />
                  <label class="block text-sm font-medium text-gray-700">Tables</label>
                </div>
                <Listbox v-model="selectedTables" multiple>
                  <div class="relative mt-1">
                    <ListboxButton
                      id="tables-selection"
                      :class="[
                        'relative w-full cursor-default rounded-lg bg-white py-2 pl-10 pr-10 text-left border focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm',
                        errors.tables
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                      ]"
                    >
                      <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                        <TableCellsIcon class="h-5 w-5 text-gray-400" />
                      </span>
                      <span class="block truncate">
                        {{
                          selectedTables.length === 0
                            ? 'Select tables'
                            : `${selectedTables.length} table${selectedTables.length > 1 ? 's' : ''} selected`
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
                        <div v-for="section in tables" :key="section.sectionName" class="px-2 py-1">
                          <div class="font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded">
                            {{ section.sectionName }}
                          </div>
                          <ListboxOption
                            v-for="table in section.tables"
                            :key="table.id"
                            :value="table.id"
                            v-slot="{ active, selected }"
                            as="template"
                          >
                            <li
                              :class="[
                                active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900',
                                'relative cursor-default select-none py-2 pl-10 pr-4',
                              ]"
                            >
                              <span
                                :class="[
                                  selected ? 'font-medium' : 'font-normal',
                                  'block truncate',
                                ]"
                              >
                                {{ table.name }}
                              </span>
                              <span
                                v-if="selected"
                                :class="[
                                  active ? 'text-indigo-600' : 'text-indigo-600',
                                  'absolute inset-y-0 left-0 flex items-center pl-3',
                                ]"
                              >
                                <CheckIcon class="h-5 w-5" aria-hidden="true" />
                              </span>
                            </li>
                          </ListboxOption>
                        </div>
                      </ListboxOptions>
                    </transition>
                  </div>
                </Listbox>
                <p v-if="errors.tables" class="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <XCircleIcon class="h-4 w-4" />
                  {{ errors.tables }}
                </p>
              </div>

              <!-- Time Slots -->
              <div class="bg-white rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <div class="flex items-center gap-2">
                    <CalendarDaysIcon class="h-5 w-5 text-blue-500" />
                    <label class="block text-sm font-medium text-gray-700">Time Slots</label>
                  </div>
                  <button
                    type="button"
                    @click="applyToAllDays"
                    class="text-sm cursor-pointer text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <ArrowPathIcon class="h-4 w-4" />
                    Apply Saturday to all days
                  </button>
                </div>

                <div v-for="day in days" :key="day" class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="capitalize font-medium text-gray-700">{{ day }}</span>
                    <button
                      type="button"
                      @click="addTimeSlot(day)"
                      :disabled="timeSlots[day]?.length >= 3"
                      class="text-sm cursor-pointer disabled:cursor-not-allowed text-blue-500 hover:text-blue-600 disabled:text-gray-400 flex items-center gap-1"
                    >
                      <PlusIcon class="h-4 w-4" />
                      Add Slot
                    </button>
                  </div>

                  <div v-for="(slot, index) in timeSlots[day]" :key="index">
                    <div class="flex gap-2 mb-2">
                      <div class="flex-1">
                        <input
                          :id="`time-slot-${day}-${index}-start`"
                          v-model="slot[0]"
                          type="time"
                          :class="[
                            'w-full rounded-md shadow-sm p-2 border-1 focus:border-blue-500 focus:outline-none',
                            errors.timeSlots[day]?.[index]
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                          ]"
                        />
                      </div>
                      <span class="self-center">-</span>
                      <div class="flex-1">
                        <input
                          :id="`time-slot-${day}-${index}-end`"
                          v-model="slot[1]"
                          type="time"
                          :class="[
                            'w-full rounded-md shadow-sm p-2 border-1 focus:border-blue-500 focus:outline-none',
                            errors.timeSlots[day]?.[index]
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                          ]"
                        />
                      </div>
                      <button
                        type="button"
                        @click="removeTimeSlot(day, index)"
                        class="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <XMarkIcon class="h-5 w-5 cursor-pointer" />
                      </button>
                    </div>
                    <p
                      v-if="errors.timeSlots[day]?.[index]"
                      class="my-1 text-sm text-red-600 flex items-center gap-1"
                    >
                      <XCircleIcon class="h-4 w-4" />
                      {{ errors.timeSlots[day][index] }}
                    </p>
                  </div>
                  <p
                    v-if="!timeSlots[day] || timeSlots[day].length === 0"
                    class="mt-1 text-sm text-red-600 flex items-center gap-1"
                  >
                    <XCircleIcon class="h-4 w-4" />
                    At least one time slot is required
                  </p>
                </div>
              </div>

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
