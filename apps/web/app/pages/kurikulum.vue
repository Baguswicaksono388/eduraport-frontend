<template>
  <div class="kurikulum-page">
    <div class="page-header">
      <div class="page-header-content">
        <div>
          <h1 class="page-title"><BookOpen class="page-title-icon" /> Manajemen Kurikulum</h1>
          <p class="page-subtitle">Kelola Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) sekolah Anda secara mandiri.</p>
        </div>
      </div>
    </div>

    <!-- Admin School Selectors -->
    <div v-if="!isSchoolLocked" class="admin-school-selectors" style="margin: 20px 28px 0; margin-bottom: 0; background: var(--panel); padding: 16px; border-radius: 12px; border: 1px solid var(--line); display: flex; gap: 16px;">
      <div class="selector-field" style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 1px;">Yayasan</label>
        <select v-model="selectedFoundationId" class="field-input" style="width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.2); border: 1px solid var(--line); border-radius: 8px; color: var(--text);">
          <option v-for="f in foundations" :key="f.id" :value="f.id" style="background: #1a1a22; color: #e9e9f1;">{{ f.name }}</option>
        </select>
      </div>
      <div class="selector-field" style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 1px;">Unit Sekolah</label>
        <select v-model="selectedSchoolId" class="field-input" style="width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.2); border: 1px solid var(--line); border-radius: 8px; color: var(--text);">
          <option v-for="s in filteredSchools" :key="s.id" :value="s.id" style="background: #1a1a22; color: #e9e9f1;">{{ s.name }} ({{ s.level }})</option>
        </select>
      </div>
    </div>

    <div class="page-content" style="padding: 20px 28px; display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; min-height: 70vh;">
      
      <!-- Panel Kiri: Curriculum Elements (CP) -->
      <BaseCard class="panel-card" style="display: flex; flex-direction: column; max-height: calc(100vh - 180px);">
        <div class="panel-header" style="padding: 16px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 16px; font-weight: 700; margin: 0;">Elemen (CP)</h2>
          <BaseButton size="sm" @click="openCreateElementModal" style="display: flex; align-items: center; gap: 4px;">
            <Plus :size="14" /> Tambah CP
          </BaseButton>
        </div>
        
        <div class="panel-body" style="padding: 16px; overflow-y: auto; flex: 1;">
          <div v-if="loading" style="text-align: center; padding: 20px; color: var(--muted);">Memuat...</div>
          <div v-else-if="elements.length === 0" style="text-align: center; padding: 40px 20px; color: var(--muted); border: 1px dashed var(--line); border-radius: 8px;">
            Belum ada Elemen CP.
          </div>
          <div v-else class="element-list" style="display: flex; flex-direction: column; gap: 12px;">
            <div 
              v-for="el in elements" 
              :key="el.id" 
              class="element-card" 
              :class="{ active: selectedElementId === el.id }"
              @click="selectElement(el)"
              style="padding: 16px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.2); position: relative;"
            >
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3 style="font-size: 14px; font-weight: 600; margin: 0; color: var(--text);">{{ el.name }}</h3>
                <div class="element-actions" style="display: flex; gap: 4px;">
                  <button @click.stop="openEditElementModal(el)" style="background: none; border: none; color: var(--blue); cursor: pointer; padding: 4px;"><Edit2 :size="14" /></button>
                  <button @click.stop="confirmDeleteElement(el)" style="background: none; border: none; color: var(--red); cursor: pointer; padding: 4px;"><Trash2 :size="14" /></button>
                </div>
              </div>
              <div style="font-size: 12px; color: var(--muted); margin-bottom: 8px;">
                <span v-if="subjectName(el.subject_id)" style="display: inline-block; background: rgba(139,92,246,0.15); color: var(--vio); padding: 2px 8px; border-radius: 4px; margin-right: 6px; font-weight: 600;">{{ subjectName(el.subject_id) }}</span>
                <span style="display: inline-block; background: var(--panel2); padding: 2px 6px; border-radius: 4px; margin-right: 6px;">Fase {{ el.level || '-' }}</span>
                <span v-if="el.code" style="display: inline-block; background: var(--panel2); padding: 2px 6px; border-radius: 4px;">{{ el.code }}</span>
              </div>
              <p v-if="el.description" style="font-size: 12px; color: var(--muted2); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                {{ el.description }}
              </p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Panel Kanan: Learning Outcomes (TP) -->
      <BaseCard class="panel-card" style="display: flex; flex-direction: column; max-height: calc(100vh - 180px);">
        <div class="panel-header" style="padding: 16px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 16px; font-weight: 700; margin: 0;">Tujuan Pembelajaran (TP)</h2>
          <BaseButton 
            size="sm" 
            @click="openCreateOutcomeModal" 
            :disabled="!selectedElementId"
            style="display: flex; align-items: center; gap: 4px;"
          >
            <Plus :size="14" /> Tambah TP
          </BaseButton>
        </div>
        
        <div class="panel-body" style="padding: 16px; overflow-y: auto; flex: 1;">
          <div v-if="!selectedElementId" style="text-align: center; padding: 60px 20px; color: var(--muted);">
            <div style="font-size: 32px; margin-bottom: 16px;">👈</div>
            Pilih salah satu Elemen (CP) di panel kiri untuk melihat Tujuan Pembelajaran-nya.
          </div>
          <div v-else-if="loadingOutcomes" style="text-align: center; padding: 20px; color: var(--muted);">Memuat TP...</div>
          <div v-else-if="outcomes.length === 0" style="text-align: center; padding: 40px 20px; color: var(--muted); border: 1px dashed var(--line); border-radius: 8px;">
            Belum ada TP untuk elemen ini.
          </div>
          <div v-else class="outcome-list" style="display: flex; flex-direction: column; gap: 12px;">
            <div 
              v-for="tp in outcomes" 
              :key="tp.id" 
              class="outcome-card" 
              style="padding: 16px; border: 1px solid var(--line); border-radius: 8px; background: rgba(0,0,0,0.2);"
            >
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1; padding-right: 16px;">
                  <div style="font-size: 12px; font-weight: 700; color: var(--vio); margin-bottom: 4px;">{{ tp.code || 'TP' }}</div>
                  <p style="font-size: 13px; color: var(--text); line-height: 1.5; margin: 0;">{{ tp.outcome_text }}</p>
                </div>
                <div class="outcome-actions" style="display: flex; gap: 4px;">
                  <button @click="openEditOutcomeModal(tp)" style="background: none; border: none; color: var(--blue); cursor: pointer; padding: 4px;"><Edit2 :size="14" /></button>
                  <button @click="confirmDeleteOutcome(tp)" style="background: none; border: none; color: var(--red); cursor: pointer; padding: 4px;"><Trash2 :size="14" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

    </div>

    <!-- Modals untuk Elemen (CP) -->
    <BaseModal :show="showElementModal" @close="showElementModal = false" :title="editingElementId ? 'Edit Elemen (CP)' : 'Tambah Elemen (CP)'">
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Kurikulum <span style="color: var(--red);">*</span></label>
          <select v-model="elementForm.curriculum_id" class="field-input" style="width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; color: var(--text);">
            <option value="" style="background: #1a1a22; color: #e9e9f1;">-- Pilih Kurikulum --</option>
            <option v-for="c in schoolCurriculums" :key="c.id" :value="c.id" style="background: #1a1a22; color: #e9e9f1;">{{ c.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Mata Pelajaran <span style="color: var(--red);">*</span></label>
          <select v-model="elementForm.subject_id" class="field-input" style="width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; color: var(--text);">
            <option value="" style="background: #1a1a22; color: #e9e9f1;">-- Pilih Mata Pelajaran --</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id" style="background: #1a1a22; color: #e9e9f1;">{{ s.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Nama / Elemen CP <span style="color: var(--red);">*</span></label>
          <BaseInput v-model="elementForm.name" placeholder="Mis: Bilangan (untuk Matematika Fase B)" />
        </div>
        <div class="form-group">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Fase</label>
          <select v-model="elementForm.level" class="field-input" style="width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; color: var(--text);">
            <option value="" style="background: #1a1a22; color: #e9e9f1;">-- Pilih Fase --</option>
            <option value="A" style="background: #1a1a22; color: #e9e9f1;">Fase A (Kelas 1-2)</option>
            <option value="B" style="background: #1a1a22; color: #e9e9f1;">Fase B (Kelas 3-4)</option>
            <option value="C" style="background: #1a1a22; color: #e9e9f1;">Fase C (Kelas 5-6)</option>
            <option value="D" style="background: #1a1a22; color: #e9e9f1;">Fase D (Kelas 7-9)</option>
            <option value="E" style="background: #1a1a22; color: #e9e9f1;">Fase E (Kelas 10)</option>
            <option value="F" style="background: #1a1a22; color: #e9e9f1;">Fase F (Kelas 11-12)</option>
          </select>
        </div>
        <div class="form-group">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Teks Capaian Pembelajaran (CP) <span style="color: var(--red);">*</span></label>
          <textarea v-model="elementForm.description" placeholder="Teks lengkap Capaian Pembelajaran dari dokumen resmi Kemdikdasmen..." rows="5" class="field-input" style="width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; color: var(--text); resize: vertical;"></textarea>
        </div>
        <div class="form-group">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Kode Singkat (Opsional)</label>
          <BaseInput v-model="elementForm.code" placeholder="Mis: MTK.B.Bilangan" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;">
          <BaseButton variant="outline" @click="showElementModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="submitElement" :disabled="!elementForm.name || !elementForm.description || !elementForm.subject_id || !elementForm.curriculum_id">Simpan</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modals untuk Outcome (TP) -->
    <BaseModal :show="showOutcomeModal" @close="showOutcomeModal = false" :title="editingOutcomeId ? 'Edit Tujuan Pembelajaran' : 'Tambah Tujuan Pembelajaran'">
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Teks Tujuan Pembelajaran <span class="text-red-500">*</span></label>
          <textarea v-model="outcomeForm.outcome_text" placeholder="Mis: Peserta didik mampu menjelaskan rukun iman dengan benar." rows="4" class="field-input" style="width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; color: var(--text); resize: vertical;"></textarea>
        </div>
        <div class="form-group">
          <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px;">Kode TP (Opsional)</label>
          <BaseInput v-model="outcomeForm.code" placeholder="Mis: TP.PAI.1.1" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px;">
          <BaseButton variant="outline" @click="showOutcomeModal = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="submitOutcome" :disabled="!outcomeForm.outcome_text">Simpan</BaseButton>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { BookOpen, Plus, Trash2, Edit2 } from 'lucide-vue-next'
import { BaseCard, BaseButton, BaseModal, BaseInput } from '@eduraport/ui'
import { useSchoolContext } from '../composables/useSchoolContext'
import { useCurriculum } from '../composables/useCurriculum'
import type { CurriculumElement, LearningOutcome } from '../composables/useCurriculum'
import { useSubject } from '../composables/useSubject'

definePageMeta({
  middleware: [
    function () {
      const token = useCookie('auth_token')
      if (!token.value) {
        return navigateTo('/login')
      }
    }
  ]
})

const { isSchoolLocked, selectedFoundationId, selectedSchoolId, foundations, schools, initContext } = useSchoolContext()
const { elements, outcomes, loading, fetchElements, fetchOutcomes, createElement, updateElement, deleteElement, createOutcome, updateOutcome, deleteOutcome } = useCurriculum()
const { subjects, fetchSubjects } = useSubject()

// Computed: nama mapel dari subject_id
const subjectName = (subjectId: string | null) => {
  if (!subjectId) return null
  return subjects.value.find((s: any) => s.id === subjectId)?.name || null
}

const filteredSchools = computed(() => {
  return schools.value.filter(s => s.level !== 'TK')
})

const schoolCurriculums = computed(() => {
  const school = schools.value.find(s => s.id === selectedSchoolId.value)
  if (!school) return []
  if (school.curriculum_id) {
    return curriculums.value.filter(c => c.id === school.curriculum_id)
  }
  return curriculums.value // fallback jika sekolah belum diset kurikulumnya
})

const selectedElementId = ref<string>('')
const loadingOutcomes = ref(false)

// Elements
const showElementModal = ref(false)
const editingElementId = ref('')
const elementForm = ref({
  name: '',
  code: '',
  level: '',
  description: '',
  subject_id: '',   // Wajib diisi — CP harus terikat ke mata pelajaran
  curriculum_id: null,
  is_active: true
})

// Outcomes
const showOutcomeModal = ref(false)
const editingOutcomeId = ref('')
const outcomeForm = ref({
  outcome_text: '',
  code: '',
  element_id: '',
  phase: '',
  is_active: true
})

onMounted(async () => {
  await initContext()
  
  // Jika sekolah yang terpilih di context (cookie) adalah TK (difilter),
  // paksa pindah ke sekolah pertama yang valid (SD/SMP/SMA).
  if (filteredSchools.value.length > 0 && !filteredSchools.value.find(s => s.id === selectedSchoolId.value)) {
    selectedSchoolId.value = filteredSchools.value[0].id
  }

  if (selectedSchoolId.value) {
    const school = schools.value.find(s => s.id === selectedSchoolId.value)
    const foundationId = school?.foundation_id || selectedFoundationId.value
    if (foundationId) await fetchCurriculums(foundationId)

    await Promise.all([
      fetchElements(selectedSchoolId.value),
      fetchSubjects(selectedSchoolId.value, 1, 100) // fetch semua mapel
    ])
  }
})

const { fetchSchools, curriculums, fetchCurriculums } = useSchool()
watch(selectedFoundationId, async (newVal) => {
  if (!newVal || isSchoolLocked.value) return
  await fetchSchools(newVal)
  await fetchCurriculums(newVal)
  selectedSchoolId.value = filteredSchools.value.length > 0 ? filteredSchools.value[0].id : ''
})

watch(selectedSchoolId, async (newVal) => {
  selectedElementId.value = ''
  outcomes.value = []
  if (newVal) {
    const school = schools.value.find(s => s.id === newVal)
    const foundationId = school?.foundation_id || selectedFoundationId.value
    if (foundationId) await fetchCurriculums(foundationId)
    
    await Promise.all([
      fetchElements(newVal),
      fetchSubjects(newVal, 1, 100)
    ])
  } else {
    elements.value = []
  }
})

const selectElement = async (el: CurriculumElement) => {
  selectedElementId.value = el.id
  loadingOutcomes.value = true
  await fetchOutcomes(selectedSchoolId.value, el.id)
  loadingOutcomes.value = false
}

// ─── Actions for Element (CP) ────────────────────────────────────────────────

const openCreateElementModal = () => {
  editingElementId.value = ''
  elementForm.value = { 
    name: '', 
    code: '', 
    level: '', 
    description: '', 
    subject_id: '', 
    curriculum_id: schoolCurriculums.value.length === 1 ? schoolCurriculums.value[0].id : null, 
    is_active: true 
  }
  showElementModal.value = true
}

const openEditElementModal = (el: CurriculumElement) => {
  editingElementId.value = el.id
  elementForm.value = {
    name: el.name,
    code: el.code || '',
    level: el.level || '',
    description: el.description || '',
    subject_id: el.subject_id || '',
    curriculum_id: el.curriculum_id as any,
    is_active: el.is_active
  }
  showElementModal.value = true
}

const submitElement = async () => {
  let res;
  if (editingElementId.value) {
    res = await updateElement(selectedSchoolId.value, editingElementId.value, elementForm.value)
  } else {
    res = await createElement(selectedSchoolId.value, elementForm.value)
  }
  if (res.success) {
    showElementModal.value = false
  }
}

const confirmDeleteElement = async (el: CurriculumElement) => {
  if (confirm(`Apakah Anda yakin ingin menghapus elemen "${el.name}"? Ini hanya bisa dilakukan jika elemen tidak memiliki TP yang aktif.`)) {
    const res = await deleteElement(selectedSchoolId.value, el.id)
    if (res.success && selectedElementId.value === el.id) {
      selectedElementId.value = ''
      outcomes.value = []
    } else if (!res.success) {
      alert(res.error?.message || 'Gagal menghapus elemen. Pastikan tidak ada TP yang tertaut.')
    }
  }
}

// ─── Actions for Outcome (TP) ────────────────────────────────────────────────

const openCreateOutcomeModal = () => {
  const el = elements.value.find(e => e.id === selectedElementId.value)
  editingOutcomeId.value = ''
  outcomeForm.value = { 
    outcome_text: '', 
    code: '', 
    element_id: selectedElementId.value, 
    subject_id: null,
    phase: el?.level || '', 
    is_active: true 
  }
  showOutcomeModal.value = true
}

const openEditOutcomeModal = (tp: LearningOutcome) => {
  editingOutcomeId.value = tp.id
  outcomeForm.value = {
    outcome_text: tp.outcome_text,
    code: tp.code || '',
    element_id: tp.element_id || selectedElementId.value,
    subject_id: tp.element_id ? null : (tp.subject_id || null),
    phase: tp.phase || '',
    is_active: tp.is_active
  }
  showOutcomeModal.value = true
}

const submitOutcome = async () => {
  let res;
  if (editingOutcomeId.value) {
    res = await updateOutcome(selectedSchoolId.value, editingOutcomeId.value, outcomeForm.value)
  } else {
    res = await createOutcome(selectedSchoolId.value, outcomeForm.value)
  }
  if (res.success) {
    showOutcomeModal.value = false
  }
}

const confirmDeleteOutcome = async (tp: LearningOutcome) => {
  if (confirm(`Apakah Anda yakin ingin menghapus TP ini?\n"${tp.outcome_text}"`)) {
    await deleteOutcome(selectedSchoolId.value, tp.id, selectedElementId.value)
  }
}
</script>

<style scoped>
.kurikulum-page {
  --bg: #0e0e13;
  --panel: #1a1a22;
  --panel2: #20202a;
  --line: #2b2b37;
  --text: #e9e9f1;
  --muted: #8f8fa3;
  --muted2: #6c6c7e;
  --vio: #8b5cf6;
  --blue: #5ca8f4;
  --red: #f4645c;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}
.page-header {
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  padding: 20px 28px;
}
.page-title {
  font-size: 24px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}
.page-subtitle {
  color: var(--muted);
  margin-top: 4px;
  max-width: 600px;
}
.element-card.active {
  border-color: var(--vio) !important;
  box-shadow: 0 0 0 1px var(--vio);
  background: rgba(139,92,246,0.1) !important;
}


</style>
