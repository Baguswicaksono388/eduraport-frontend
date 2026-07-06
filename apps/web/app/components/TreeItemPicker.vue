<script setup lang="ts">
import { ChevronDown, ChevronRight, Plus, Trash2, Edit2, AlertTriangle, CheckSquare, Square } from 'lucide-vue-next'

interface SubItem {
  ref_id: string | null;
  label: string;
  custom: boolean;
}

interface SelectedItem {
  ref_id: string | null;
  ref_type: string;
  label: string;
  custom: boolean;
  subs: SubItem[];
}

interface MasterSubItem {
  id: string;
  outcome_text: string;
  code: string | null;
  is_active: boolean;
}

interface MasterItem {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  subs?: MasterSubItem[];
}

const props = defineProps<{
  modelValue: SelectedItem[];
  masterData: MasterItem[];
  refType: 'element' | 'subject';
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectedItem[]): void;
}>()

const items = ref<SelectedItem[]>([])
const expandedParents = ref<Record<string, boolean>>({})

// Sync selection from prop
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    items.value = JSON.parse(JSON.stringify(newVal))
  }
}, { immediate: true, deep: true })

const updateModel = () => {
  emit('update:modelValue', JSON.parse(JSON.stringify(items.value)))
}

// Check if a parent is selected
const getParentSelection = (refId: string | null) => {
  if (refId === null) return null;
  return items.value.find(it => it.ref_id === refId) || null
}

const toggleParent = (master: MasterItem) => {
  const existingIndex = items.value.findIndex(it => it.ref_id === master.id)
  
  if (existingIndex > -1) {
    // Uncheck: remove parent and all its subs
    items.value.splice(existingIndex, 1)
  } else {
    // Check: add parent. IMPORTANT: Opt-out auto-population of child items (do not auto-add children!)
    items.value.push({
      ref_id: master.id,
      ref_type: props.refType,
      label: master.name,
      custom: false,
      subs: [] // Start with empty subs (independent checkboxing)
    })
  }
  updateModel()
}

// Check if a sub-item is selected
const getSubSelection = (parentRefId: string | null, subRefId: string) => {
  const parent = getParentSelection(parentRefId)
  if (!parent) return null
  return parent.subs.find(sub => sub.ref_id === subRefId) || null
}

const toggleSub = (masterParent: MasterItem, masterSub: MasterSubItem) => {
  let parent = getParentSelection(masterParent.id)
  
  // If parent is not checked, automatically check parent first (we need parent structure to hold child)
  if (!parent) {
    parent = {
      ref_id: masterParent.id,
      ref_type: props.refType,
      label: masterParent.name,
      custom: false,
      subs: []
    }
    items.value.push(parent)
  }

  const existingSubIndex = parent.subs.findIndex(sub => sub.ref_id === masterSub.id)
  if (existingSubIndex > -1) {
    // Uncheck sub
    parent.subs.splice(existingSubIndex, 1)
  } else {
    // Check sub
    parent.subs.push({
      ref_id: masterSub.id,
      label: masterSub.outcome_text,
      custom: false
    })
  }
  updateModel()
}

const isParentExpanded = (id: string) => !!expandedParents.value[id]
const toggleExpand = (id: string) => {
  expandedParents.value[id] = !expandedParents.value[id]
}

// Custom Parent Addition
const showAddCustomParent = ref(false)
const customParentName = ref('')

const addCustomParent = () => {
  const name = customParentName.value.trim()
  if (!name) return

  items.value.push({
    ref_id: null,
    ref_type: 'custom',
    label: name,
    custom: true,
    subs: []
  })

  customParentName.value = ''
  showAddCustomParent.value = false
  updateModel()
}

// Custom Child Addition
const activeAddCustomSubId = ref<string | null>(null)
const customSubName = ref('')

const addCustomSub = (parent: SelectedItem) => {
  const name = customSubName.value.trim()
  if (!name) return

  parent.subs.push({
    ref_id: null,
    label: name,
    custom: true
  })

  customSubName.value = ''
  activeAddCustomSubId.value = null
  updateModel()
}

const deleteItem = (index: number) => {
  items.value.splice(index, 1)
  updateModel()
}

const deleteSubItem = (parent: SelectedItem, subIndex: number) => {
  parent.subs.splice(subIndex, 1)
  updateModel()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Selection List / Tree -->
    <div class="space-y-3">
      <!-- Master Tree Items -->
      <div v-for="master in masterData" :key="master.id" class="border border-slate-200/60 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <!-- Parent Header -->
        <div class="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-zinc-950/20 border-b border-slate-100 dark:border-zinc-850">
          <!-- Expand/Collapse toggle -->
          <button 
            v-if="master.subs && master.subs.length > 0"
            type="button" 
            @click="toggleExpand(master.id)" 
            class="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 shrink-0"
          >
            <ChevronDown v-if="isParentExpanded(master.id)" :size="14" />
            <ChevronRight v-else :size="14" />
          </button>
          <div v-else class="w-3.5 h-3.5 shrink-0"></div>

          <!-- Checkbox -->
          <button 
            type="button" 
            @click="toggleParent(master)"
            class="text-violet-600 shrink-0 transition-transform active:scale-95"
          >
            <CheckSquare v-if="getParentSelection(master.id)" :size="16" />
            <Square v-else class="text-slate-400" :size="16" />
          </button>

          <!-- Parent Details -->
          <div class="flex-1 min-w-0 flex items-center justify-between gap-2">
            <span 
              class="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate"
              :class="{ 'text-slate-400 line-through': !master.is_active }"
            >
              {{ master.name }} 
              <span v-if="master.code" class="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-zinc-850 px-1 py-0.5 rounded ml-1">{{ master.code }}</span>
            </span>

            <!-- Inactive Warning Badge -->
            <span v-if="!master.is_active" class="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase px-1.5 py-0.5 border border-amber-500/15 rounded">
              <AlertTriangle :size="8" /> Nonaktif
            </span>
          </div>
        </div>

        <!-- Inline Label Override Input (only visible if checked) -->
        <div v-if="getParentSelection(master.id)" class="px-4 py-2 border-b border-slate-100 dark:border-zinc-850 bg-violet-50/10 dark:bg-violet-950/5 flex items-center gap-2">
          <span class="text-[9px] font-bold uppercase text-violet-500 shrink-0">Override Label Tampil:</span>
          <input 
            type="text" 
            v-model="getParentSelection(master.id)!.label"
            @change="updateModel"
            class="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-violet-600"
            placeholder="Tulis override nama tampilan disini..."
          />
        </div>

        <!-- Child Items list -->
        <div v-if="isParentExpanded(master.id) && master.subs && master.subs.length > 0" class="divide-y divide-slate-100 dark:divide-zinc-850 bg-slate-50/10 dark:bg-zinc-950/5">
          <div 
            v-for="sub in master.subs" 
            :key="sub.id" 
            class="flex items-start gap-3 p-3 pl-8 text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
          >
            <!-- Checkbox -->
            <button 
              type="button" 
              @click="toggleSub(master, sub)"
              class="text-violet-600 shrink-0 pt-0.5"
            >
              <CheckSquare v-if="getSubSelection(master.id, sub.id)" :size="14" />
              <Square v-else class="text-slate-400" :size="14" />
            </button>

            <!-- Details -->
            <div class="flex-1 min-w-0 space-y-1.5">
              <span 
                class="text-slate-700 dark:text-zinc-300 leading-normal block"
                :class="{ 'text-slate-450 line-through': !sub.is_active }"
              >
                {{ sub.outcome_text }}
              </span>

              <!-- Inline Label Override for Child (if checked) -->
              <div v-if="getSubSelection(master.id, sub.id)" class="flex items-center gap-2 mt-1">
                <span class="text-[9px] font-bold text-violet-500 whitespace-nowrap">Override:</span>
                <input 
                  type="text" 
                  v-model="getSubSelection(master.id, sub.id)!.label"
                  @change="updateModel"
                  class="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2 py-0.5 text-[11px] outline-none focus:border-violet-650"
                  placeholder="Kustomisasi kalimat indikator..."
                />
              </div>

              <!-- Badges -->
              <div class="flex items-center gap-1.5">
                <span v-if="sub.code" class="text-[8px] font-bold text-slate-400 uppercase bg-slate-150/50 dark:bg-zinc-850 px-1 rounded">{{ sub.code }}</span>
                <span v-if="!sub.is_active" class="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase px-1 border border-amber-500/15 rounded">
                  <AlertTriangle :size="8" /> Inaktif
                </span>
              </div>
            </div>
          </div>

          <!-- Add custom sub-item button -->
          <div v-if="getParentSelection(master.id)" class="p-3 pl-8 bg-white dark:bg-zinc-900">
            <div v-if="activeAddCustomSubId === master.id" class="flex gap-2">
              <input 
                type="text" 
                v-model="customSubName"
                class="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-violet-600"
                placeholder="Tulis sub-indikator kustom..."
                @keyup.enter="addCustomSub(getParentSelection(master.id)!)"
              />
              <button 
                type="button" 
                @click="addCustomSub(getParentSelection(master.id)!)" 
                class="bg-violet-600 hover:bg-violet-750 text-white text-[11px] font-bold px-3 rounded-lg"
              >
                Tambah
              </button>
              <button 
                type="button" 
                @click="activeAddCustomSubId = null" 
                class="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                Batal
              </button>
            </div>
            <button 
              v-else
              type="button"
              @click="activeAddCustomSubId = master.id; customSubName = ''"
              class="text-[10px] text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-1"
            >
              + Tambah Sub-Indikator Kustom
            </button>
          </div>
        </div>
      </div>

      <!-- Selected Custom Items (Non-master items added by user) -->
      <div v-for="(it, idx) in items.filter(i => i.custom)" :key="'custom_' + idx" class="border border-violet-200/50 dark:border-violet-800/40 rounded-xl overflow-hidden bg-violet-50/10 dark:bg-zinc-950/20 shadow-sm">
        <div class="flex items-center justify-between gap-3 p-3">
          <div class="flex-1 flex items-center gap-2">
            <span class="text-[9px] font-bold text-violet-500 uppercase tracking-wider bg-violet-600/10 px-1 py-0.5 rounded">KUSTOM</span>
            <input 
              type="text" 
              v-model="it.label" 
              @change="updateModel"
              class="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-violet-650"
            />
          </div>
          <button type="button" @click="deleteItem(items.indexOf(it))" class="text-slate-400 hover:text-rose-500 transition-colors">
            <Trash2 :size="13" />
          </button>
        </div>

        <!-- Custom Sub Items List -->
        <div class="pl-6 border-l-2 border-violet-200/60 dark:border-zinc-800/60 pb-3 space-y-2 bg-white/40 dark:bg-zinc-900/10">
          <div v-for="(sub, sIdx) in it.subs" :key="sIdx" class="flex items-center justify-between gap-3 p-2 text-xs">
            <input 
              type="text" 
              v-model="sub.label" 
              @change="updateModel"
              class="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded px-2 py-1 text-xs outline-none focus:border-violet-650"
            />
            <button type="button" @click="deleteSubItem(it, sIdx)" class="text-slate-450 hover:text-rose-500 transition-colors">
              <Trash2 :size="12" />
            </button>
          </div>

          <!-- Add Sub-item under custom Parent -->
          <div class="px-2">
            <div v-if="activeAddCustomSubId === 'custom_' + idx" class="flex gap-2">
              <input 
                type="text" 
                v-model="customSubName"
                class="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded px-2 py-1 text-xs outline-none focus:border-violet-600"
                placeholder="Tulis sub-indikator kustom..."
                @keyup.enter="addCustomSub(it)"
              />
              <button 
                type="button" 
                @click="addCustomSub(it)" 
                class="bg-violet-600 hover:bg-violet-750 text-white text-[11px] font-bold px-3 rounded"
              >
                Tambah
              </button>
              <button 
                type="button" 
                @click="activeAddCustomSubId = null" 
                class="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                Batal
              </button>
            </div>
            <button 
              v-else
              type="button"
              @click="activeAddCustomSubId = 'custom_' + idx; customSubName = ''"
              class="text-[10px] text-violet-605 dark:text-violet-400 font-bold hover:underline flex items-center gap-1"
            >
              + Tambah Sub-Indikator Kustom
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Add Custom Parent Button -->
    <div class="pt-2">
      <div v-if="showAddCustomParent" class="bg-slate-50 dark:bg-zinc-950/20 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
        <label class="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest px-1">Nama Item Kustom Baru</label>
        <div class="flex gap-2">
          <input 
            type="text" 
            v-model="customParentName"
            class="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-violet-600"
            placeholder="Contoh: Perkembangan Fisik"
            @keyup.enter="addCustomParent"
          />
          <button 
            type="button" 
            @click="addCustomParent" 
            class="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 rounded-lg shadow-md shadow-violet-600/10"
          >
            Simpan
          </button>
        </div>
        <div class="flex justify-end">
          <button 
            type="button" 
            @click="showAddCustomParent = false; customParentName = ''" 
            class="text-[10px] text-slate-450 hover:text-slate-600 font-semibold"
          >
            Batal
          </button>
        </div>
      </div>
      
      <button 
        v-else
        type="button"
        @click="showAddCustomParent = true"
        class="w-full bg-slate-50 dark:bg-zinc-950/40 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-dashed border-slate-250 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 py-2.5 transition-all flex items-center justify-center gap-1.5"
      >
        <Plus :size="13" /> Tambah Aspek / Item Kustom Baru
      </button>
    </div>

  </div>
</template>
