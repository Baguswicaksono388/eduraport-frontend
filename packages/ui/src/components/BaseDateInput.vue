<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue?: string | null
  label?: string
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  min?: string
  max?: string
  formatWithDay?: boolean
  align?: 'left' | 'right' | 'auto'
}>(), {
  modelValue: '',
  label: '',
  error: '',
  placeholder: 'Pilih tanggal...',
  required: false,
  disabled: false,
  min: '',
  max: '',
  formatWithDay: true,
  align: 'auto'
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', val: string): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const popoverAlign = ref<'left' | 'right'>('left')
const popoverVertical = ref<'bottom' | 'top'>('bottom')

const calculatePosition = () => {
  if (props.align === 'right' || props.align === 'left') {
    popoverAlign.value = props.align
  } else if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    // Check if right edge of container + popover width (320px) overflows viewport
    if (rect.left + 320 > window.innerWidth - 20) {
      popoverAlign.value = 'right'
    } else {
      // Check nearest modal or card container
      const parentContainer = containerRef.value.closest('.modal, [role="dialog"], .relative, .overflow-hidden, .fixed, .max-w-lg, .max-w-xl, .max-w-2xl, .max-w-3xl')
      if (parentContainer) {
        const parentRect = parentContainer.getBoundingClientRect()
        if (rect.left + 320 > parentRect.right - 15) {
          popoverAlign.value = 'right'
        } else {
          popoverAlign.value = 'left'
        }
      } else {
        popoverAlign.value = rect.left > window.innerWidth / 2 ? 'right' : 'left'
      }
    }
  }

  // Vertical position check
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    if (spaceBelow < 380 && rect.top > 380) {
      popoverVertical.value = 'top'
    } else {
      popoverVertical.value = 'bottom'
    }
  }
}

// Current view year & month
const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth()) // 0 - 11
const isPickerView = ref<'days' | 'months' | 'years'>('days')

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]
const MONTHS_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]
const DAYS_HEADER_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// Sync view with modelValue when it changes or when opening
const syncViewWithModel = () => {
  if (props.modelValue && props.modelValue.length >= 10) {
    const parts = props.modelValue.split('-')
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10) - 1
    if (!isNaN(y) && !isNaN(m)) {
      viewYear.value = y
      viewMonth.value = m
      return
    }
  }
  const curr = new Date()
  viewYear.value = curr.getFullYear()
  viewMonth.value = curr.getMonth()
}

watch(() => props.modelValue, () => {
  syncViewWithModel()
}, { immediate: true })

const toggleOpen = () => {
  if (props.disabled) return
  if (!isOpen.value) {
    syncViewWithModel()
    isPickerView.value = 'days'
    calculatePosition()
  }
  isOpen.value = !isOpen.value
}

// Click outside & ESC listener
const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleKeydown)
})

// Navigation
const prevMonth = () => {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

const nextMonth = () => {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

const toggleMonthYearView = () => {
  if (isPickerView.value === 'days') {
    isPickerView.value = 'months'
  } else {
    isPickerView.value = 'days'
  }
}

// Indonesian Formatted Text for display
const formattedDisplay = computed(() => {
  if (!props.modelValue) return ''
  const d = new Date(props.modelValue + (props.modelValue.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return props.modelValue

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const dayName = days[d.getDay()]
  const dateNum = d.getDate()
  const monthName = MONTHS_ID[d.getMonth()]
  const yearNum = d.getFullYear()

  return props.formatWithDay
    ? `${dayName}, ${dateNum} ${monthName} ${yearNum}`
    : `${dateNum} ${monthName} ${yearNum}`
})

// Pad zero helper
const pad = (n: number) => n < 10 ? `0${n}` : `${n}`
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

const todayStr = computed(() => {
  const d = new Date()
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
})

const isDateDisabled = (dateStr: string) => {
  if (props.min && dateStr < props.min) return true
  if (props.max && dateStr > props.max) return true
  return false
}

// Generate Calendar Matrix (42 cells: 6 weeks x 7 days)
const calendarDays = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value

  const firstDayOfWeek = new Date(y, m, 1).getDay() // 0 = Sunday
  const daysInCurrentMonth = new Date(y, m + 1, 0).getDate()
  const daysInPrevMonth = new Date(y, m, 0).getDate()

  const days = []

  // 1. Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i
    const prevM = m === 0 ? 11 : m - 1
    const prevY = m === 0 ? y - 1 : y
    const dateStr = toDateStr(prevY, prevM, dayNum)

    days.push({
      date: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr.value,
      isSelected: dateStr === props.modelValue,
      isDisabled: isDateDisabled(dateStr)
    })
  }

  // 2. Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = toDateStr(y, m, d)
    days.push({
      date: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr.value,
      isSelected: dateStr === props.modelValue,
      isDisabled: isDateDisabled(dateStr)
    })
  }

  // 3. Next month leading days (fill up to 42 cells)
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const nextM = m === 11 ? 0 : m + 1
    const nextY = m === 11 ? y + 1 : y
    const dateStr = toDateStr(nextY, nextM, d)

    days.push({
      date: dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr.value,
      isSelected: dateStr === props.modelValue,
      isDisabled: isDateDisabled(dateStr)
    })
  }

  return days
})

// User Actions
const selectDate = (dateStr: string) => {
  emit('update:modelValue', dateStr)
  emit('change', dateStr)
  isOpen.value = false
}

const selectToday = () => {
  const d = todayStr.value
  if (!isDateDisabled(d)) {
    emit('update:modelValue', d)
    emit('change', d)
    syncViewWithModel()
    isOpen.value = false
  }
}

const clearDate = () => {
  emit('update:modelValue', '')
  emit('change', '')
  isOpen.value = false
}

// Year pagination for Year Selector view
const yearStart = ref(Math.floor(now.getFullYear() / 12) * 12)
watch(viewYear, (newY) => {
  yearStart.value = Math.floor(newY / 12) * 12
}, { immediate: true })

const yearList = computed(() => {
  const list = []
  for (let y = yearStart.value; y < yearStart.value + 12; y++) {
    list.push(y)
  }
  return list
})

const prevYearPage = () => {
  yearStart.value -= 12
}

const nextYearPage = () => {
  yearStart.value += 12
}
</script>

<template>
  <div ref="containerRef" class="flex flex-col gap-1.5 w-full relative select-none" :class="{ 'z-50': isOpen }">
    <label v-if="label" class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider px-0.5">
      {{ label }}
      <span v-if="required" class="text-rose-500">*</span>
    </label>

    <!-- Trigger Input Box -->
    <div
      @click="toggleOpen"
      tabindex="0"
      @keydown.enter.prevent="toggleOpen"
      @keydown.space.prevent="toggleOpen"
      :class="[
        'w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium border transition-all duration-200 cursor-pointer outline-none shadow-sm',
        isOpen
          ? 'border-blue-600 dark:border-blue-500 ring-4 ring-blue-500/10 dark:ring-blue-500/20 bg-white dark:bg-zinc-900'
          : error
            ? 'border-rose-500 ring-4 ring-rose-500/10 bg-white dark:bg-zinc-950'
            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      ]"
    >
      <div class="flex items-center gap-2.5 overflow-hidden">
        <div
          :class="[
            'p-1.5 rounded-lg transition-colors',
            modelValue ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500'
          ]"
        >
          <Calendar :size="15" />
        </div>
        <span
          v-if="modelValue"
          class="text-slate-800 dark:text-zinc-100 truncate text-xs sm:text-sm font-semibold"
        >
          {{ formattedDisplay }}
        </span>
        <span v-else class="text-slate-400 dark:text-zinc-500 truncate text-xs sm:text-sm">
          {{ placeholder }}
        </span>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <button
          v-if="modelValue && !disabled"
          type="button"
          @click.stop="clearDate"
          class="p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          title="Hapus tanggal"
        >
          <X :size="13" />
        </button>
        <ChevronDown
          :size="14"
          :class="[
            'text-slate-400 transition-transform duration-200',
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          ]"
        />
      </div>
    </div>

    <p v-if="error" class="text-xs font-medium text-rose-500 px-1">
      {{ error }}
    </p>

    <!-- Calendar Popover Dropdown (Matches user reference layout) -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-2"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-2"
    >
      <div
        v-if="isOpen"
        :class="[
          'absolute z-50 w-72 sm:w-80 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 text-slate-800 dark:text-zinc-100 animate-in ring-1 ring-black/5 dark:ring-white/10',
          popoverVertical === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          popoverAlign === 'right' ? 'right-0' : 'left-0'
        ]"
      >
        <!-- Header: Month & Year Selector + Navigation Controls -->
        <div class="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-100 dark:border-zinc-800/80">
          <!-- Combined Month Year Dropdown Button -->
          <button
            type="button"
            @click="toggleMonthYearView"
            class="px-2 py-1 -ml-1 rounded-lg text-sm font-bold text-slate-900 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 group"
          >
            <span>{{ MONTHS_ID[viewMonth] }} {{ viewYear }}</span>
            <ChevronDown
              :size="14"
              :class="[
                'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform duration-200',
                isPickerView !== 'days' ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
              ]"
            />
          </button>

          <!-- Navigation Chevrons -->
          <div class="flex items-center gap-0.5">
            <template v-if="isPickerView === 'days'">
              <button
                type="button"
                @click="prevMonth"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                title="Bulan sebelumnya"
              >
                <ChevronLeft :size="16" />
              </button>
              <button
                type="button"
                @click="nextMonth"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                title="Bulan berikutnya"
              >
                <ChevronRight :size="16" />
              </button>
            </template>
            <template v-else-if="isPickerView === 'months'">
              <button
                type="button"
                @click="viewYear--"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 transition-colors"
                title="Tahun sebelumnya"
              >
                <ChevronLeft :size="16" />
              </button>
              <span class="text-xs font-mono font-bold px-1 text-slate-700 dark:text-zinc-300">{{ viewYear }}</span>
              <button
                type="button"
                @click="viewYear++"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 transition-colors"
                title="Tahun berikutnya"
              >
                <ChevronRight :size="16" />
              </button>
            </template>
            <template v-else-if="isPickerView === 'years'">
              <button
                type="button"
                @click="prevYearPage"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 transition-colors"
                title="12 Tahun sebelumnya"
              >
                <ChevronLeft :size="16" />
              </button>
              <button
                type="button"
                @click="nextYearPage"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 transition-colors"
                title="12 Tahun berikutnya"
              >
                <ChevronRight :size="16" />
              </button>
            </template>
          </div>
        </div>

        <!-- VIEW 1: DAYS MATRIX (42 Cells) -->
        <div v-if="isPickerView === 'days'">
          <!-- Days of Week Header (Su Mo Tu We Th Fr Sa equivalent) -->
          <div class="grid grid-cols-7 mb-1.5 text-center">
            <span
              v-for="(dayName, idx) in DAYS_HEADER_ID"
              :key="dayName"
              :class="[
                'text-[11px] font-bold tracking-tight py-1 select-none',
                idx === 0 ? 'text-rose-500 dark:text-rose-400' : idx === 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-zinc-400'
              ]"
            >
              {{ dayName }}
            </span>
          </div>

          <!-- 42 Days Grid -->
          <div class="grid grid-cols-7 gap-1 text-center">
            <button
              v-for="cell in calendarDays"
              :key="cell.date"
              type="button"
              :disabled="cell.isDisabled"
              @click="selectDate(cell.date)"
              :class="[
                'h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-150',
                cell.isSelected
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-2 ring-blue-500/50 scale-105'
                  : cell.isToday
                    ? 'ring-1.5 ring-blue-500 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
                    : cell.isCurrentMonth
                      ? 'text-slate-900 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 font-medium'
                      : 'text-slate-400 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-400',
                cell.isDisabled ? 'opacity-20 cursor-not-allowed pointer-events-none' : ''
              ]"
            >
              {{ cell.dayNumber }}
            </button>
          </div>
        </div>

        <!-- VIEW 2: MONTHS SELECTOR -->
        <div v-else-if="isPickerView === 'months'" class="py-1">
          <div class="flex items-center justify-between mb-3 px-1">
            <span class="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Pilih Bulan</span>
            <button
              type="button"
              @click="isPickerView = 'years'"
              class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Ubah Tahun ({{ viewYear }})
              <ChevronRight :size="12" />
            </button>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="(mName, idx) in MONTHS_SHORT_ID"
              :key="mName"
              type="button"
              @click="viewMonth = idx; isPickerView = 'days'"
              :class="[
                'py-2.5 rounded-xl text-xs font-bold transition-all',
                viewMonth === idx
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
              ]"
            >
              {{ mName }}
            </button>
          </div>
        </div>

        <!-- VIEW 3: YEARS SELECTOR -->
        <div v-else-if="isPickerView === 'years'" class="py-1">
          <div class="flex items-center justify-between mb-3 px-1">
            <span class="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {{ yearStart }} - {{ yearStart + 11 }}
            </span>
            <button
              type="button"
              @click="isPickerView = 'months'"
              class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Pilih Bulan
              <ChevronRight :size="12" />
            </button>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="y in yearList"
              :key="y"
              type="button"
              @click="viewYear = y; isPickerView = 'months'"
              :class="[
                'py-2.5 rounded-xl text-xs font-bold transition-all font-mono',
                viewYear === y
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
              ]"
            >
              {{ y }}
            </button>
          </div>
        </div>

        <!-- Footer: Clear & Today (Exact match to screenshot bottom actions) -->
        <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80">
          <button
            type="button"
            @click="clearDate"
            class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            Clear
          </button>
          <button
            type="button"
            @click="selectToday"
            class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            Today
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-date-input::-webkit-calendar-picker-indicator {
  position: absolute;
  inset: 0;
  width: auto;
  height: auto;
  opacity: 0;
  cursor: pointer;
}
</style>
