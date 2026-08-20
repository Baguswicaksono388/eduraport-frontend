<template>
  <!-- RPP / Modul Ajar -->
  <div v-if="document.document_type === 'rpp'" class="rpp-renderer">
    <div v-if="rpp.identitas || rpp.informasi_umum" class="section">
      <div class="section-title">📋 Informasi Umum</div>
      <div class="info-grid">
        <template v-for="(val, key) in (rpp.identitas || rpp.informasi_umum)" :key="key">
          <div v-if="key !== 'dimensi_profil_lulusan'" class="info-item">
            <span class="info-key">{{ formatKey(key) }}</span>
            <span v-if="!editableSection('informasi_umum')" class="info-val">{{ val }}</span>
            <input v-else v-model="(rpp.identitas || rpp.informasi_umum)[key]" class="field-input-sm" />
          </div>
        </template>
      </div>
    </div>

    <div v-if="rpp.capaian" class="section">
      <div class="section-title">🎯 Capaian & Tujuan Pembelajaran</div>
      <div class="cp-tp">
        <div class="cp-box">
          <span class="cp-label">CP:</span>
          <p>{{ rpp.capaian.cp }}</p>
        </div>
        <div class="tp-list">
          <span class="cp-label">TP:</span>
          <ol>
            <li v-for="(tp, i) in rpp.capaian.tp" :key="i">{{ tp }}</li>
          </ol>
        </div>
        <div class="dimensi-list">
          <span class="cp-label">Dimensi Profil:</span>
          <div class="tags">
            <span v-for="d in (rpp.identitas?.dimensi_profil_lulusan || rpp.informasi_umum?.dimensi_profil_lulusan || rpp.capaian.dimensi_profil || [])" :key="d" class="tag-chip">{{ d }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rpp.langkah_pembelajaran || rpp.langkah" class="section">
      <div class="section-title">📝 Langkah Pembelajaran</div>
      <div class="langkah-tabs">
        <button
          v-for="step in langkahSteps"
          :key="step.key"
          v-show="(rpp.langkah_pembelajaran || rpp.langkah)[step.key]"
          class="langkah-tab"
          :class="{ active: activeLangkahTab === step.key }"
          @click="activeLangkahTab = step.key"
        >{{ step.label }}</button>
      </div>
      <template v-if="(rpp.langkah_pembelajaran || rpp.langkah)[activeLangkahTab]">
        <div v-if="(rpp.langkah_pembelajaran || rpp.langkah)[activeLangkahTab].prinsip_pembelajaran" style="margin-bottom: 12px; padding: 12px; background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px;">
          <span style="display: block; font-size: 10px; font-weight: 800; color: #d97706; margin-bottom: 4px;">Prinsip Pembelajaran:</span>
          <p style="font-size: 12px; color: var(--text); line-height: 1.5; margin: 0;">{{ (rpp.langkah_pembelajaran || rpp.langkah)[activeLangkahTab].prinsip_pembelajaran }}</p>
        </div>
        <ul class="langkah-list">
          <li v-for="(item, i) in ((rpp.langkah_pembelajaran || rpp.langkah)[activeLangkahTab].aktivitas || (rpp.langkah_pembelajaran || rpp.langkah)[activeLangkahTab] || [])" :key="i">
            {{ item }}
          </li>
        </ul>
      </template>
    </div>

    <div v-if="rpp.asesmen" class="section">
      <div class="section-title">📊 Asesmen</div>
      <div class="asesmen-cards">
        <div v-for="(a, i) in rpp.asesmen" :key="i" class="asesmen-card">
          <div class="asesmen-jenis">{{ a.jenis }}</div>
          <div class="asesmen-bentuk">{{ a.bentuk }}</div>
          <div class="asesmen-instrumen">{{ a.instrumen }}</div>
        </div>
      </div>
    </div>

    <div v-if="rpp.lampiran && (rpp.lampiran.lkpd || rpp.lampiran.bahan_bacaan)" class="section">
      <div class="section-title">📎 Lampiran</div>
      <div v-if="rpp.lampiran.lkpd" class="lampiran-item">
        <span class="lampiran-label">LKPD:</span>
        <p>{{ rpp.lampiran.lkpd }}</p>
      </div>
      <div v-if="rpp.lampiran.bahan_bacaan" class="lampiran-item">
        <span class="lampiran-label">Bahan Bacaan:</span>
        <p>{{ rpp.lampiran.bahan_bacaan }}</p>
      </div>
    </div>

    <!-- Edit save button -->
    <div v-if="editable" class="edit-actions">
      <button class="save-btn" @click="$emit('save', rpp)">💾 Simpan Perubahan</button>
      <span class="edit-note">Perubahan akan tersimpan sebagai versi baru (teacher_edited)</span>
    </div>
  </div>

  <!-- Soal / Kuis -->
  <div v-else-if="document.document_type === 'soal'" class="soal-renderer">
    <div v-if="soal.kisi_kisi" class="section">
      <div class="section-title">📋 Kisi-kisi Soal</div>
      <div class="kisi-grid">
        <div class="kisi-item"><span class="kisi-label">Jumlah PG</span><span class="kisi-val">{{ soal.kisi_kisi.jumlah_pg }}</span></div>
        <div class="kisi-item"><span class="kisi-label">Jumlah Esai</span><span class="kisi-val">{{ soal.kisi_kisi.jumlah_esai }}</span></div>
        <div class="kisi-item">
          <span class="kisi-label">Level Kognitif</span>
          <div class="tags">
            <span v-for="lvl in soal.kisi_kisi.level_kognitif" :key="lvl" class="tag-chip hots" :class="{ 'hots-high': ['C4','C5','C6'].includes(lvl) }">{{ lvl }}</span>
          </div>
        </div>
        <div class="kisi-item full"><span class="kisi-label">TP Rujukan</span><span class="kisi-val">{{ soal.kisi_kisi.tp_ref }}</span></div>
      </div>
    </div>

    <!-- KKTP Scheme -->
    <div v-if="soal.kktp_scheme" class="section" style="background: rgba(92,168,244,0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <div class="section-title" style="color: var(--blue);">🎯 Kriteria Ketuntasan Tujuan Pembelajaran (KKTP)</div>
      <div style="font-size: 13px; margin-bottom: 8px;"><strong>Deskripsi:</strong> {{ soal.kktp_scheme.deskripsi }}</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px;">
        <thead>
          <tr>
            <th style="text-align: left; border-bottom: 1px solid var(--line); padding: 6px;">Interval</th>
            <th style="text-align: left; border-bottom: 1px solid var(--line); padding: 6px;">Kategori</th>
            <th style="text-align: left; border-bottom: 1px solid var(--line); padding: 6px;">Tindak Lanjut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, idx) in soal.kktp_scheme.tindak_lanjut" :key="idx">
            <td style="border-bottom: 1px solid var(--line); padding: 6px;">{{ t.interval }}</td>
            <td style="border-bottom: 1px solid var(--line); padding: 6px;">
              <span class="tag-chip" style="background: var(--bg); border: 1px solid var(--line);">{{ t.kategori }}</span>
            </td>
            <td style="border-bottom: 1px solid var(--line); padding: 6px;">{{ t.intervensi }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="soal.pilihan_ganda?.length > 0" class="section">
      <div class="section-title">❶ Soal Pilihan Ganda <span class="count-badge">{{ soal.pilihan_ganda.length }} soal</span></div>
      <div v-for="q in soal.pilihan_ganda" :key="q.no" class="question-card">
        <div class="question-header">
          <span class="question-no">{{ q.no }}</span>
          <span class="bloom-chip" :class="{ 'hots-high': ['C4','C5','C6'].includes(q.level) }">{{ q.level }}</span>
        </div>
        <div class="question-text">{{ q.pertanyaan }}</div>
        <div class="options-list">
          <div
            v-for="(opt, key) in q.opsi"
            :key="key"
            class="option-item"
            :class="{ correct: key === q.kunci }"
          >
            <span class="option-key">{{ key }}.</span>
            {{ opt }}
            <span v-if="key === q.kunci" class="correct-mark">✓</span>
          </div>
        </div>
        <div class="pembahasan">
          <span class="pembahasan-label">📖 Pembahasan:</span> {{ q.pembahasan }}
        </div>
      </div>
    </div>

    <div v-if="soal.esai?.length > 0" class="section">
      <div class="section-title">✍️ Soal Esai <span class="count-badge">{{ soal.esai.length }} soal</span></div>
      <div v-for="q in soal.esai" :key="q.no" class="question-card">
        <div class="question-header">
          <span class="question-no">{{ q.no }}</span>
          <span class="bloom-chip" :class="{ 'hots-high': ['C4','C5','C6'].includes(q.level) }">{{ q.level }}</span>
        </div>
        <div class="question-text">{{ q.pertanyaan }}</div>
        <div class="pedoman">
          <span class="pembahasan-label">📋 Pedoman Jawaban:</span>
          <p>{{ q.pedoman_jawaban }}</p>
        </div>
      </div>
    </div>

    <div v-if="soal.rubrik?.length > 0" class="section">
      <div class="section-title">⚖️ Rubrik Penilaian</div>
      <div v-for="r in soal.rubrik" :key="r.kriteria" class="rubrik-card">
        <div class="rubrik-kriteria">{{ r.kriteria }}</div>
        <div class="rubrik-skala">
          <div v-for="(deskripsi, skor) in r.skala" :key="skor" class="skala-item">
            <span class="skala-skor">{{ skor }}</span>
            <span class="skala-deskripsi">{{ deskripsi }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rekomendasi Gradebook -->
    <div v-if="soal.rekomendasi_penilaian_rapor" class="section" style="background: rgba(139,92,246,0.05); padding: 16px; border-radius: 8px;">
      <div class="section-title" style="color: var(--vio);">📈 Rekomendasi Pengolahan Nilai Gradebook</div>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 13px; font-weight: 700;">Opsi Disarankan:</span>
        <span class="tag-chip" style="background: var(--vio); color: #fff; border: none; font-weight: 700;">
          {{ soal.rekomendasi_penilaian_rapor.opsi_pengolahan.toUpperCase() }}
        </span>
      </div>
      <p style="font-size: 12px; color: var(--muted2); line-height: 1.5; margin: 0;">
        {{ soal.rekomendasi_penilaian_rapor.alasan }}
      </p>
    </div>
  </div>

  <!-- Asesmen Alternatif -->
  <div v-else-if="document.document_type === 'asesmen_alternatif'" class="asesmen-alt-renderer">
    <div v-if="asesmenAlt.informasi_asesmen" class="section">
      <div class="section-title">📋 Informasi Asesmen</div>
      <div class="info-grid" style="grid-template-columns: 1fr;">
        <div class="info-item">
          <span class="info-key">Judul Penugasan</span>
          <span class="info-val">{{ asesmenAlt.informasi_asesmen.judul_penugasan }}</span>
        </div>
        <div class="info-item">
          <span class="info-key">Bentuk Asesmen</span>
          <span class="info-val">{{ asesmenAlt.informasi_asesmen.bentuk_asesmen }}</span>
        </div>
        <div class="info-item">
          <span class="info-key">Tujuan Pembelajaran</span>
          <span class="info-val">{{ asesmenAlt.informasi_asesmen.tp_ref }}</span>
        </div>
        <div class="info-item">
          <span class="info-key">Estimasi Waktu</span>
          <span class="info-val">{{ asesmenAlt.informasi_asesmen.estimasi_waktu }}</span>
        </div>
      </div>
    </div>

    <div v-if="asesmenAlt.instruksi_siswa" class="section">
      <div class="section-title">📝 Instruksi Siswa</div>
      <ul class="langkah-list">
        <li v-for="(item, i) in asesmenAlt.instruksi_siswa" :key="i">
          {{ item }}
        </li>
      </ul>
    </div>

    <div v-if="asesmenAlt.rubrik_penilaian?.length > 0" class="section">
      <div class="section-title">⚖️ Rubrik Penilaian Khusus</div>
      <div v-for="r in asesmenAlt.rubrik_penilaian" :key="r.kriteria" class="rubrik-card">
        <div class="rubrik-kriteria">{{ r.kriteria }}</div>
        <div class="rubrik-skala">
          <div v-for="(deskripsi, skor) in r.skala" :key="skor" class="skala-item">
            <span class="skala-skor">{{ skor }}</span>
            <span class="skala-deskripsi">{{ deskripsi }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="asesmenAlt.rekomendasi_penilaian_rapor" class="section" style="background: rgba(139,92,246,0.05); padding: 16px; border-radius: 8px;">
      <div class="section-title" style="color: var(--vio);">📈 Rekomendasi Pengolahan Nilai Gradebook</div>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 13px; font-weight: 700;">Opsi Disarankan:</span>
        <span class="tag-chip" style="background: var(--vio); color: #fff; border: none; font-weight: 700;">
          {{ asesmenAlt.rekomendasi_penilaian_rapor.opsi_pengolahan.toUpperCase() }}
        </span>
      </div>
      <p style="font-size: 12px; color: var(--muted2); line-height: 1.5; margin: 0;">
        {{ asesmenAlt.rekomendasi_penilaian_rapor.alasan }}
      </p>
    </div>
  </div>

  <!-- Materi Ajar -->
  <div v-else-if="document.document_type === 'materi'" class="materi-renderer">
    <div v-if="materi.ringkasan" class="section">
      <div class="section-title">📝 Ringkasan Materi</div>
      <p style="font-size: 13px; line-height: 1.6;">{{ materi.ringkasan }}</p>
    </div>

    <div v-if="materi.sub_bab?.length > 0" class="section">
      <div class="section-title">📚 Sub-bab Materi</div>
      <div v-for="(bab, i) in materi.sub_bab" :key="i" class="sub-bab-card" style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 12px; color: var(--text);">{{ bab.judul }}</h3>
        
        <!-- Check for image in this sub-bab -->
        <div v-if="getImageForSubBab(i)" class="materi-image" style="margin-bottom: 16px;">
          <img :src="getImageForSubBab(i).url" :alt="getImageForSubBab(i).caption" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--line);" />
          <p style="font-size: 11px; color: var(--muted2); font-style: italic; text-align: center; margin-top: 8px;">{{ getImageForSubBab(i).caption }}</p>
        </div>
        
        <p style="font-size: 13px; line-height: 1.7; white-space: pre-wrap;">{{ bab.isi }}</p>
      </div>
    </div>
  </div>

  <!-- Fallback: JSON -->
  <div v-else class="json-fallback">
    <pre>{{ JSON.stringify(document.content, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AiDocument } from '~/composables/useAiAsisten'

const props = defineProps<{
  document: AiDocument
  editable?: boolean
}>()

const emit = defineEmits<{
  save: [content: Record<string, any>]
}>()

const rpp = ref<any>(typeof props.document.content === 'string' ? JSON.parse(props.document.content) : props.document.content)
const soal = computed<any>(() => typeof props.document.content === 'string' ? JSON.parse(props.document.content) : props.document.content)
const materi = computed<any>(() => typeof props.document.content === 'string' ? JSON.parse(props.document.content) : props.document.content)
const asesmenAlt = computed<any>(() => typeof props.document.content === 'string' ? JSON.parse(props.document.content) : props.document.content)

const activeLangkahTab = ref<string>('pendahuluan')

import { watchEffect } from 'vue'
watchEffect(() => {
  if (props.document.document_type === 'rpp') {
    const steps = rpp.value?.langkah_pembelajaran || rpp.value?.langkah || {}
    if (!steps[activeLangkahTab.value]) {
      if (steps.pendahuluan) activeLangkahTab.value = 'pendahuluan'
      else if (steps.memahami) activeLangkahTab.value = 'memahami'
      else activeLangkahTab.value = Object.keys(steps)[0] || 'pendahuluan'
    }
  }
})

const langkahSteps = [
  { key: 'pendahuluan', label: '▶ Pendahuluan' },
  { key: 'memahami', label: '💡 Memahami' },
  { key: 'mengaplikasi', label: '⚙️ Mengaplikasi' },
  { key: 'merefleksi', label: '🔍 Merefleksi' },
  { key: 'inti', label: '◉ Inti (Lama)' },
  { key: 'penutup', label: '⏹ Penutup' },
]

function editableSection(_key: string) {
  return props.editable ?? false
}

function formatKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getImageForSubBab(index: number) {
  if (!materi.value.images || !Array.isArray(materi.value.images)) return null
  return materi.value.images.find((img: any) => img.subBabIndex === index)
}
</script>

<style scoped>
.section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.section:last-child { border-bottom: none; }
.section-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 10px;
}

/* Info grid */
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.info-item { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; }
.info-key { display: block; font-size: 9.5px; font-weight: 700; color: var(--muted2); text-transform: uppercase; margin-bottom: 3px; }
.info-val { font-weight: 700; font-size: 12.5px; color: var(--text); }

/* CP/TP */
.cp-tp { display: flex; flex-direction: column; gap: 10px; }
.cp-box, .tp-list, .dimensi-list { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; }
.cp-label { font-size: 9.5px; font-weight: 800; color: var(--vio); display: block; margin-bottom: 4px; }
.cp-box p, .tp-list ol { font-size: 12.5px; margin: 0; padding-left: 16px; line-height: 1.6; color: var(--text); }
.tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
.tag-chip {
  font-size: 10.5px;
  font-weight: 700;
  background: var(--vio-soft);
  color: var(--vio);
  border-radius: 6px;
  padding: 2px 9px;
}

/* Langkah */
.langkah-tabs { display: flex; gap: 6px; margin-bottom: 8px; }
.langkah-tab {
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 7px;
  padding: 5px 12px;
  cursor: pointer;
}
.langkah-tab.active { background: var(--vio-soft); color: var(--vio); border-color: var(--vio-soft); }
.langkah-list { padding-left: 18px; color: var(--text); }
.langkah-list li { font-size: 12.5px; line-height: 1.7; margin-bottom: 4px; }

/* Asesmen */
.asesmen-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.asesmen-card { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 10px; color: var(--text); }
.asesmen-jenis {
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--green);
  margin-bottom: 4px;
}
.asesmen-bentuk { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
.asesmen-instrumen { font-size: 11px; color: var(--muted); }

/* Lampiran */
.lampiran-item { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 10px; margin-bottom: 8px; }
.lampiran-label { font-size: 9.5px; font-weight: 800; color: var(--muted2); display: block; margin-bottom: 4px; }
.lampiran-item p { margin: 0; font-size: 12px; line-height: 1.5; color: var(--text); }

/* Soal */
.kisi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.kisi-item { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; }
.kisi-item.full { grid-column: 1/-1; }
.kisi-label { display: block; font-size: 9.5px; font-weight: 800; color: var(--muted2); text-transform: uppercase; margin-bottom: 4px; }
.kisi-val { font-weight: 700; font-size: 13px; color: var(--text); }
.hots { background: var(--amber-soft); color: var(--amber); }
.hots-high { background: rgba(244,100,92,.13); color: var(--red); }
.count-badge {
  font-size: 10px;
  font-weight: 700;
  background: var(--vio-soft);
  color: var(--vio);
  border-radius: 6px;
  padding: 2px 8px;
  margin-left: 6px;
}

.question-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 13px 14px;
  margin-bottom: 10px;
  color: var(--text);
}
.question-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.question-no {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--vio-soft);
  color: var(--vio);
  font-weight: 800;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bloom-chip {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: .5px;
  background: rgba(92,168,244,.13);
  color: var(--blue);
  border-radius: 6px;
  padding: 2px 8px;
}
.question-text { font-size: 13px; font-weight: 600; line-height: 1.6; margin-bottom: 10px; }

.options-list { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  padding: 5px 8px;
  border-radius: 7px;
}
.option-item.correct { background: var(--green-soft); color: var(--green); font-weight: 600; }
.option-key { font-weight: 800; color: var(--muted); min-width: 16px; }
.correct-mark { margin-left: auto; font-weight: 800; }

.pembahasan {
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.5;
  background: var(--panel2);
  border-radius: 7px;
  padding: 7px 10px;
}
.pembahasan-label { font-weight: 800; color: var(--muted2); }

.pedoman {
  font-size: 12px;
  color: var(--muted);
  background: var(--panel2);
  border-radius: 7px;
  padding: 8px 10px;
  margin-top: 8px;
}
.pedoman p { margin: 4px 0 0; line-height: 1.5; color: var(--text); }

/* Rubrik */
.rubrik-card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px; margin-bottom: 10px; color: var(--text); }
.rubrik-kriteria { font-weight: 800; margin-bottom: 8px; }
.rubrik-skala { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.skala-item { background: var(--panel2); border-radius: 7px; padding: 7px 9px; }
.skala-skor { display: block; font-size: 18px; font-weight: 800; text-align: center; color: var(--vio); margin-bottom: 3px; }
.skala-deskripsi { font-size: 10.5px; color: var(--muted); line-height: 1.4; display: block; }

/* Edit */
.edit-actions { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); }
.save-btn {
  font: inherit;
  font-weight: 700;
  font-size: 13px;
  background: var(--vio);
  border: none;
  color: #fff;
  border-radius: 9px;
  padding: 9px 18px;
  cursor: pointer;
}
.edit-note { font-size: 11px; color: var(--muted2); }
.field-input-sm {
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  background: var(--bg);
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 10px;
  width: 100%;
  margin-top: 4px;
}

/* JSON fallback */
.json-fallback pre {
  font-family: monospace;
  font-size: 11px;
  color: var(--muted);
  line-height: 1.5;
  overflow-x: auto;
}
</style>
