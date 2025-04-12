<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  CalendarDaysIcon,
  PlusIcon,
  XMarkIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/20/solid'

const props = defineProps<{
  modelValue: Record<string, string[][]>
  days: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string[][]>): void
  (e: 'update:isValid', value: boolean): void
}>()

// Error states
const errors = ref<Record<string, string[]>>({})

// Time slots
const addTimeSlot = (day: string) => {
  if (props.modelValue[day].length < 3) {
    const newTimeSlots = { ...props.modelValue }
    newTimeSlots[day].push(['09:00', '17:00'])
    emit('update:modelValue', newTimeSlots)
  }
}

const removeTimeSlot = (day: string, index: number) => {
  const newTimeSlots = { ...props.modelValue }
  newTimeSlots[day].splice(index, 1)
  emit('update:modelValue', newTimeSlots)
}

const applyToAllDays = () => {
  const saturdaySlots = [...props.modelValue.saturday]
  const newTimeSlots = { ...props.modelValue }
  props.days.forEach((day) => {
    if (day !== 'saturday') {
      newTimeSlots[day] = [...saturdaySlots]
    }
  })
  emit('update:modelValue', newTimeSlots)
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
  if (!props.modelValue[day] || props.modelValue[day].length === 0) {
    errors.value[day] = ['At least one time slot is required']
    emit('update:isValid', false)
    return false
  }
  let dayValid = true
  errors.value[day] = []

  props.modelValue[day].forEach((slot, index) => {
    const [startTime, endTime] = slot
    if (!validateTimeSlot(startTime, endTime)) {
      errors.value[day][index] = 'End time must be after start time'
      dayValid = false
    } else if (hasTimeConflict(props.modelValue[day], index)) {
      errors.value[day][index] = 'Time slot conflicts with another slot'
      dayValid = false
    }
  })

  // If there are any errors in the array, return false
  if (errors.value[day].some((error) => error)) {
    dayValid = false
  }

  emit('update:isValid', dayValid)
  return dayValid
}

// Watch to validate time slots
watch(
  () => props.modelValue,
  (newTimeSlots) => {
    let allValid = true
    for (const day in newTimeSlots) {
      if (!validateDayTimeSlots(day)) {
        allValid = false
      }
    }
    emit('update:isValid', allValid)
  },
  { deep: true },
)

const updateTimeSlot = (day: string, index: number, field: 0 | 1, value: string) => {
  const newTimeSlots = { ...props.modelValue }
  newTimeSlots[day][index][field] = value
  emit('update:modelValue', newTimeSlots)
}
</script>

<template>
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
          :disabled="modelValue[day]?.length >= 3"
          class="text-sm cursor-pointer disabled:cursor-not-allowed text-blue-500 hover:text-blue-600 disabled:text-gray-400 flex items-center gap-1"
        >
          <PlusIcon class="h-4 w-4" />
          Add Slot
        </button>
      </div>

      <div v-for="(slot, index) in modelValue[day]" :key="index">
        <div class="flex gap-2 mb-2">
          <div class="flex-1">
            <input
              :id="`time-slot-${day}-${index}-start`"
              :value="slot[0]"
              @input="(e) => updateTimeSlot(day, index, 0, (e.target as HTMLInputElement).value)"
              type="time"
              :class="[
                'w-full rounded-md shadow-sm p-2 border-1 focus:border-blue-500 focus:outline-none',
                errors[day]?.[index]
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              ]"
            />
          </div>
          <span class="self-center">-</span>
          <div class="flex-1">
            <input
              :id="`time-slot-${day}-${index}-end`"
              :value="slot[1]"
              @input="(e) => updateTimeSlot(day, index, 1, (e.target as HTMLInputElement).value)"
              type="time"
              :class="[
                'w-full rounded-md shadow-sm p-2 border-1 focus:border-blue-500 focus:outline-none',
                errors[day]?.[index]
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
          v-if="errors[day]?.[index]"
          :id="`time-slot-error-${day}-${index}`"
          class="my-1 text-sm text-red-600 flex items-center gap-1"
        >
          <XCircleIcon class="h-4 w-4" />
          {{ errors[day][index] }}
        </p>
      </div>
      <p
        v-if="!modelValue[day] || modelValue[day].length === 0"
        :id="`time-slot-error-${day}`"
        class="mt-1 text-sm text-red-600 flex items-center gap-1"
      >
        <XCircleIcon class="h-4 w-4" />
        At least one time slot is required
      </p>
    </div>
  </div>
</template>
