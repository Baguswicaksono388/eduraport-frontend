<script setup lang="ts">
import { Eye, EyeOff, ChevronUp, ChevronDown, Trash2, Plus, AlertCircle } from 'lucide-vue-next'

interface Column {
  key: string;
  label: string;
  visible: boolean;
}

const props = defineProps<{
  modelValue: Column[];
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Column[]): void;
}>()

const cols = ref<Column[]>([])

// Sync with prop modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    cols.value = JSON.parse(JSON.stringify(newVal))
  }
}, { immediate: true, deep: true })

const updateModel = () => {
  emit('update:modelValue', JSON.parse(JSON.stringify(cols.value)))
}

const visibleCount = computed(() => {
  return cols.value.filter(c => c.visible).length
})

const toggleVisibility = (index: number) => {
  const col = cols.value[index]
  if (col.visible && visibleCount.value <= 1) {
    // Cannot turn off the last visible column
    alert('Minimal harus ada 1 kolom yang aktif/terlihat!')
    return
  }
  col.visible = !col.visible
  updateModel()
}

const moveUp = (index: number) => {
  if (index === 0) return
  const temp = cols.value[index]
  cols.value[index] = cols.value[index - 1]
  cols.value[index - 1] = temp
  updateModel()
}

const moveDown = (index: number) => {
  if (index === cols.value.length - 1) return
  const temp = cols.value[index]
  cols.value[index] = cols.value[index + 1]
  cols.value[index + 1] = temp
  updateModel()
}

const removeColumn = (index: number) => {
  if (cols.value.length <= 1) {
    alert('Minimal harus ada 1 kolom!')
    return
  }
  if (cols.value[index].visible && visibleCount.value <= 1) {
    alert('Minimal harus ada 1 kolom aktif yang terlihat!')
    return
  }
  cols.value.splice(index, 1)
  updateModel()
}

const newColKey = ref('')
const newColLabel = ref('')

const addColumn = () => {
  const key = newColKey.value.trim().toLowerCase().replace(/\s+/g, '_')
  const label = newColLabel.value.trim()
  
  if (!key || !label) {
    alert('Key dan Label kolom harus diisi!')
    return
  }

  // Check if key already exists
  if (cols.value.some(c => c.key === key)) {
    alert('Key kolom sudah digunakan!')
    return
  }

  cols.value.push({
    key,
    label,
    visible: true
  })
  
  newColKey.value = ''
  newColLabel.value = ''
  updateModel()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header/Instructions -->
    <div class="flex items-center gap-2 p-3 bg-violet-50/50 dark:bg-zinc-950/20 border border-violet-100 dark:border-zinc-800 rounded-xl text-xs text-slate-500 dark:text-zinc-400">
      <AlertCircle class="text-violet-600 shrink-0" :size="14" />
      <span>Kelola nama kolom, urutan, dan visibilitas kolom tabel. Minimal 1 kolom harus aktif/terlihat.</span>
    </div>

    <!-- Columns List -->
    <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
      <div 
        v-for="(col, index) in cols" 
        :key="col.key"
        class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950/30 p-2 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl transition-all"
        :class="{ 'opacity-60': !col.visible }"
      >
        <!-- Reordering buttons -->
        <div class="flex flex-col gap-0.5 shrink-0">
          <button 
            type="button" 
            @click="moveUp(index)" 
            :disabled="index === 0" 
            class="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronUp :size="12" />
          </button>
          <button 
            type="button" 
            @click="moveDown(index)" 
            :disabled="index === cols.length - 1" 
            class="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronDown :size="12" />
          </button>
        </div>

        <!-- Visibility Toggle -->
        <button 
          type="button"
          @click="toggleVisibility(index)"
          class="p-2 rounded-lg shrink-0 transition-colors"
          :class="col.visible ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400' : 'bg-slate-200 dark:bg-zinc-800 text-slate-400'"
          :title="col.visible ? 'Sembunyikan Kolom' : 'Tampilkan Kolom'"
        >
          <Eye v-if="col.visible" :size="13" />
          <EyeOff v-else :size="13" />
        </button>

        <!-- Column Label Inputs -->
        <div class="flex-1 min-w-0">
          <input 
            type="text" 
            v-model="col.label" 
            @change="updateModel"
            class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-violet-650"
            placeholder="Label Kolom"
          />
        </div>

        <!-- Delete button -->
        <button 
          type="button"
          @click="removeColumn(index)"
          class="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
          title="Hapus Kolom"
        >
          <Trash2 :size="13" />
        </button>
      </div>
    </div>

    <!-- Add New Column -->
    <div class="bg-slate-100/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-slate-200/50 dark:border-zinc-800/60 space-y-3">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tambah Kolom Kustom</span>
      <div class="grid grid-cols-2 gap-2">
        <input 
          type="text" 
          v-model="newColLabel" 
          placeholder="Label Kolom (contoh: Keterangan)" 
          class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-violet-600"
        />
        <input 
          type="text" 
          v-model="newColKey" 
          placeholder="Key Kolom (contoh: note)" 
          class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-violet-600"
        />
      </div>
      <button 
        type="button"
        @click="addColumn"
        class="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/10"
      >
        <Plus :size="12" /> Tambah Kolom
      </button>
    </div>
  </div>
</template>
