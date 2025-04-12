<script setup lang="ts">
import { ref, watch } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { ChevronUpDownIcon, CheckIcon, TableCellsIcon, XCircleIcon } from '@heroicons/vue/20/solid'
import type { Section } from '@/types'

const modelValue = defineModel<string[]>({ default: () => [] })

defineProps<{
  sections: Section[]
}>()

const error = ref('')
const isValid = ref(true)

const emit = defineEmits<{
  (e: 'update:isValid', value: boolean): void
}>()

const validateTables = () => {
  error.value = ''
  if (modelValue.value.length === 0) {
    error.value = 'At least one table must be selected'
    isValid.value = false
  } else {
    isValid.value = true
  }
  emit('update:isValid', isValid.value)
  return isValid.value
}

// Watch to validate tables
watch(
  () => modelValue.value,
  () => {
    validateTables()
  },
)
</script>

<template>
  <div class="bg-white rounded-lg">
    <div class="flex items-center gap-2 mb-2">
      <TableCellsIcon class="h-5 w-5 text-blue-500" />
      <label class="block text-sm font-medium text-gray-700">Tables</label>
    </div>
    <Listbox v-model="modelValue" multiple>
      <div class="relative mt-1">
        <ListboxButton
          id="tables-selection"
          :class="[
            'relative w-full cursor-default rounded-lg bg-white py-2 pl-10 pr-10 text-left border focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          ]"
        >
          <span class="absolute inset-y-0 left-0 flex items-center pl-3">
            <TableCellsIcon class="h-5 w-5 text-gray-400" />
          </span>
          <span class="block truncate">
            {{
              modelValue.length === 0
                ? 'Select tables'
                : `${modelValue.length} table${modelValue.length > 1 ? 's' : ''} selected`
            }}
          </span>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
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
            <div v-for="section in sections" :key="section.id" class="px-2 py-1">
              <div class="font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded">
                {{ section.name }}
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
                  <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
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
    <p v-if="error" class="mt-1 text-sm text-red-600 flex items-center gap-1">
      <XCircleIcon class="h-4 w-4" />
      {{ error }}
    </p>
  </div>
</template>
