<template>
  <div class="ai-asisten-page">
    <!-- ─── Page Header ────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-title-wrap">
          <h1 class="page-title">
            <span class="page-title-icon">✨</span>
            AI Asisten Guru
          </h1>
          <p class="page-subtitle">
            Susun Modul Ajar, Soal Evaluasi, Materi, hingga Bahan Tayang Kurikulum Merdeka dalam hitungan detik.
            Konteks kelas, mapel, dan CP/TP otomatis diambil dari sistem — tidak perlu ketik ulang.
          </p>
        </div>

        <!-- Quota Badge -->
        <div v-if="quota" class="quota-badge" :class="{ 'quota-low': quota.remaining <= 2, 'quota-empty': quota.remaining === 0 }">
          <span class="quota-dot"></span>
          <span>Kuota AI: <strong>{{ quota.used }} / {{ quota.max }}</strong></span>
          <span class="quota-bar">
            <span class="quota-fill" :style="{ width: `${(quota.used / quota.max) * 100}%` }"></span>
          </span>
          <span class="quota-reset">reset 00:00</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="page-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Admin School Selectors (Global for all tabs) -->
    <div v-if="!isSchoolLocked" class="admin-school-selectors" style="margin: 20px 28px 0; margin-bottom: 0;">
      <div class="selector-field">
        <label>Yayasan</label>
        <select v-model="selectedFoundationId" class="field-input">
          <option v-for="f in foundations" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
      <div class="selector-field">
        <label>Unit Sekolah</label>
        <select v-model="selectedSchoolId" class="field-input">
          <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }} ({{ s.level }})</option>
        </select>
      </div>
    </div>

    <!-- ─── Tab: Buat Dokumen ─────────────────────────────────────────────── -->
    <div v-if="activeTab === 'generate'" class="tab-content">
      <div class="generator-layout">
        <!-- Left: Form -->
        <div class="generator-form">
          <div class="form-card">
            <!-- Step 1: Jenis Dokumen -->
            <div class="form-section">
              <div class="form-section-title">1 · Jenis Dokumen</div>
              <div class="doc-types">
                <button
                  v-for="dt in documentTypes"
                  :key="dt.key"
                  class="doc-type-btn"
                  :class="{ active: form.document_type === dt.key, disabled: dt.phase > 1 }"
                  @click="selectDocType(dt)"
                >
                  <span class="doc-type-icon">{{ dt.icon }}</span>
                  <span class="doc-type-label">{{ dt.label }}</span>
                  <span v-if="dt.phase > 1" class="doc-type-phase">FASE {{ dt.phase }}</span>
                </button>
              </div>
            </div>
            <template v-if="['soal', 'materi', 'ppt'].includes(form.document_type) && !generatedDoc">
              <div class="empty-state" style="margin-top: 24px; padding: 24px 16px; text-align: center; border: 1px dashed var(--line); border-radius: 8px; background: rgba(0,0,0,0.1);">
                <span style="font-size: 28px; margin-bottom: 12px; display: block;">🔗</span>
                <strong style="font-size: 14px; color: var(--fg); display: block; margin-bottom: 8px;">Pembuatan {{ form.document_type === 'soal' ? 'Soal' : form.document_type === 'ppt' ? 'Bahan Tayang PPT' : 'Materi' }} Mandiri</strong>
                <p style="color: var(--muted2); line-height: 1.5; margin-bottom: 16px; font-size: 12px;">
                  Untuk hasil terbaik, buat dari Modul Ajar yang sudah ada. Atau buka terlebih dahulu Modul Ajar, lalu gunakan tab ✨ Lanjut Buat...
                </p>
                <div style="background: rgba(139,92,246,0.1); color: var(--vio); padding: 10px; border-radius: 6px; font-size: 12px; font-weight: 500; border: 1px solid rgba(139,92,246,0.2);">
                  💡 Buka <strong>Modul Ajar</strong> di <em>Bank Materi</em>, lalu gunakan tab <strong>✨ Lanjut Buat...</strong>
                </div>
              </div>
            </template>

            <!-- Form lengkap: tampil untuk RPP, dan untuk soal/materi/ppt jika ada generatedDoc -->
            <template v-if="form.document_type === 'rpp' || (['soal', 'materi', 'ppt'].includes(form.document_type) && generatedDoc)">

              <!-- Banner turunan dari Modul Ajar sesi ini -->
              <div v-if="['soal', 'materi', 'ppt'].includes(form.document_type) && generatedDoc" style="margin-top: 12px; padding: 12px 16px; background: rgba(92,168,244,0.08); border: 1px solid rgba(92,168,244,0.25); border-radius: 8px; font-size: 12px;">
                🔗 <strong>Diturunkan dari Modul Ajar:</strong> <em>{{ generatedDoc.title }}</em>
              </div>

              <!-- Step 2: Konteks (Dikunci saat membuat turunan karena mewarisi Modul Ajar) -->
            <div class="form-section">
              <div class="form-section-title">2 · Konteks <span class="auto-badge">✨ otomatis dari sistem</span></div>

              <div class="form-field">
                <label class="field-label">Kurikulum</label>
                <select id="ai-curriculum" v-model="form.curriculum_id" class="field-input" :disabled="form.document_type !== 'rpp'">
                  <option value="">— Pilih Kurikulum —</option>
                  <option v-for="c in schoolCurriculums" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>

              <div class="form-field">
                <label class="field-label">Mata Pelajaran</label>
                <select id="ai-subject" v-model="form.subject_id" class="field-input" @change="onSubjectChange" :disabled="form.document_type !== 'rpp'">
                  <option value="">— Pilih Mapel —</option>
                  <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>

              <div class="form-field">
                <label class="field-label">Tahun Ajaran</label>
                <select id="ai-academic-year" v-model="form.academic_year_id" class="field-input" :disabled="form.document_type !== 'rpp'">
                  <option value="">— Pilih Tahun Ajaran —</option>
                  <option v-for="ay in academicYears" :key="ay.id" :value="ay.id">{{ ay.name }}</option>
                </select>
              </div>

              <div class="form-field">
                <label class="field-label">Kelas / Rombel</label>
                <select id="ai-class" v-model="form.class_id" class="field-input" :disabled="form.document_type !== 'rpp'">
                  <option value="">— Pilih Kelas —</option>
                  <option v-for="c in filteredClasses" :key="c.id" :value="c.id">{{ c.class_name }}</option>
                </select>
              </div>

              <div class="form-field">
                <label class="field-label">
                  Tujuan Pembelajaran
                  <span class="field-label-hint">· dari kurikulum</span>
                </label>
                <select id="ai-tp" v-model="form.learning_outcome_id" class="field-input" :disabled="!contextLoaded || form.document_type !== 'rpp'">
                  <option value="">— Pilih TP dari kurikulum —</option>
                  <option v-for="lo in filteredLearningOutcomes" :key="lo.id" :value="lo.id">
                    [{{ lo.element_name || 'CP' }}] {{ lo.code ? `${lo.code} - ` : '' }}{{ lo.outcome_text }}
                  </option>
                  <option value="__manual">+ Ketik manual (mulok/kejuruan…)</option>
                </select>
                <div v-if="form.learning_outcome_id === '__manual'" class="manual-tp-wrap">
                  <textarea
                    v-model="form.manual_tp"
                    class="field-input"
                    placeholder="Tuliskan Tujuan Pembelajaran secara manual…"
                    rows="3"
                    :disabled="form.document_type !== 'rpp'"
                  ></textarea>
                </div>
                <div v-if="contextLoaded && learningOutcomes.length > 0" class="field-hint">
                  ✨ CP/TP, Dimensi Profil Lulusan, & alokasi waktu terisi otomatis dari modul Kurikulum (7.1d.3).
                </div>
              </div>

              <div class="form-field">
                <label class="field-label">Semester</label>
                <select id="ai-semester" v-model="form.semester" class="field-input" :disabled="form.document_type !== 'rpp'">
                  <option value="ganjil">Ganjil</option>
                  <option value="genap">Genap</option>
                </select>
              </div>
            </div>

            <!-- Step 3: Detail -->
            <div class="form-section">
              <div class="form-section-title">3 · Detail Konten</div>

              <div class="form-field">
                <label class="field-label">Topik / Materi Spesifik</label>
                <input
                  id="ai-topic"
                  v-model="form.topic"
                  type="text"
                  class="field-input"
                  placeholder="mis. Pecahan senilai dengan garis bilangan"
                  :disabled="form.document_type !== 'rpp'"
                />
              </div>

              <div class="form-field">
                <label class="field-label">Model Pembelajaran</label>
                <select id="ai-model-pembelajaran" v-model="form.model_pembelajaran" class="field-input" :disabled="form.document_type !== 'rpp'">
                  <option v-for="m in modelPembelajaranOptions" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>

              <!-- Soal options -->
              <template v-if="form.document_type === 'soal'">
                <div class="soal-opts-header">⚙️ Konfigurasi Soal</div>
                <div class="form-field-row">
                  <div class="form-field">
                    <label class="field-label">Jumlah PG</label>
                    <input v-model.number="form.soal_opts.jumlah_pg" type="number" min="0" max="50" class="field-input" />
                  </div>
                  <div class="form-field">
                    <label class="field-label">Jumlah Esai</label>
                    <input v-model.number="form.soal_opts.jumlah_esai" type="number" min="0" max="20" class="field-input" />
                  </div>
                </div>
                <div class="form-field">
                  <label class="field-label">Level Kognitif (Bloom)</label>
                  <div class="bloom-checkboxes">
                    <label v-for="lvl in bloomLevels" :key="lvl.key" class="bloom-check">
                      <input
                        type="checkbox"
                        :value="lvl.key"
                        :checked="form.soal_opts.level_kognitif.includes(lvl.key)"
                        @change="toggleBloom(lvl.key)"
                      />
                      <span :class="`bloom-${lvl.key.toLowerCase()}`">{{ lvl.label }}</span>
                    </label>
                  </div>
                </div>
              </template>

              <!-- Materi options -->
              <template v-if="form.document_type === 'materi'">
                <div class="soal-opts-header">⚙️ Konfigurasi Materi Ajar</div>
                <div class="form-field-row">
                  <div class="form-field">
                    <label class="field-label">Jumlah Sub-bab</label>
                    <input v-model.number="form.materi_opts.jumlah_sub_bab" type="number" min="1" max="10" class="field-input" />
                    <div class="field-hint">Maksimal 10 sub-bab.</div>
                  </div>
                </div>
                <div class="form-field">
                  <label class="field-label" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" v-model="form.materi_opts.with_images" style="width: auto; margin: 0;" />
                    Buatkan Ilustrasi Gambar
                  </label>
                  <div class="field-hint" style="margin-top: 4px;">⚠️ Ilustrasi menggunakan kuota AI x3 (karena proses rendering gambar berat).</div>
                </div>
              </template>
            </div>

            <!-- Generate Button -->
            <button
              id="ai-generate-btn"
              class="generate-btn"
              :class="{ 'generating': generating }"
              :disabled="!canGenerate || generating"
              @click="handleGenerate"
            >
              <span v-if="generating" class="btn-spinner"></span>
              <span v-else>✨</span>
              <span v-if="generating">Menyusun dokumen…</span>
              <span v-else-if="quota && quota.remaining === 0">Kuota habis (reset 00:00)</span>
              <span v-else>
                Generate
                <span v-if="quota" class="btn-quota">(sisa {{ quota.remaining }} kuota)</span>
              </span>
            </button>

            <div v-if="generateError" class="generate-error">
              <span>⚠️</span> {{ generateError }}
            </div>
            </template>

          </div>
        </div>

        <!-- Right: Output -->
        <div class="output-panel">
          <div class="output-card">
            <!-- Idle state -->
            <div v-if="!generating && !generatedDoc" class="output-empty">
              <div class="output-empty-icon">✨</div>
              <div class="output-empty-title">Hasil generate akan muncul di sini.</div>
              <div class="output-empty-sub">
                Lengkapi konteks di kiri, lalu klik Generate.<br>
                <span>Hasil otomatis tersimpan ke Bank Materi & direlasikan ke mapel, kelas, dan TP.</span>
              </div>
            </div>

            <!-- Loading state -->
            <div v-else-if="generating" class="output-loading">
              <div class="output-spinner"></div>
              <div class="output-loading-title">AI sedang menyusun dokumen…</div>
              <div class="output-loading-step">{{ currentStep }}</div>
              <div class="output-loading-steps">
                <div
                  v-for="(step, i) in loadingSteps"
                  :key="i"
                  class="loading-step-item"
                  :class="{ active: i === currentStepIndex, done: i < currentStepIndex }"
                >
                  <span class="step-dot"></span>
                  {{ step }}
                </div>
              </div>
            </div>

            <!-- Result state -->
            <div v-else-if="generatedDoc">
              <!-- Header -->
              <div class="doc-header">
                <div class="doc-header-left">
                  <span class="doc-title">{{ generatedDoc.title }}</span>
                  <span class="doc-type-badge">{{ docTypeLabel(generatedDoc.document_type) }}</span>
                  <span class="doc-status-badge" :class="generatedDoc.status === 'final' ? 'final' : 'draft'">{{ generatedDoc.status === 'final' ? '✅ FINAL' : 'DRAFT AI' }}</span>
                </div>
                <div class="doc-actions">
                  <button class="action-btn" @click="openEdit">✏️ Edit</button>
                  <button class="action-btn" @click="exportDoc('docx')">Word</button>
                  <button class="action-btn" @click="exportDoc('pdf')">PDF</button>
                  <button v-if="generatedDoc.status !== 'final'" class="action-btn primary" @click="() => handleFinalize()">💾 Simpan Final</button>
                  <span v-else class="action-btn" style="opacity:0.5; cursor:default;">✅ Tersimpan Final</span>
                </div>
              </div>

              <!-- Draft notice -->
              <div class="draft-notice">
                ✏️ Ini <strong>draf dari AI</strong>, bukan hasil final. Guru dapat mengedit setiap bagian;
                Anda tetap pemilik & penanggung jawab isi. Perubahan tersimpan sebagai versi baru.
              </div>

              <!-- Content Renderer -->
              <div class="doc-content">
                <AiDocumentRenderer :document="generatedDoc" />
              </div>

              <!-- Relations -->
              <div class="doc-relations">
                <div class="relations-title">🔗 Relasi Tersimpan di Database</div>
                <div class="relations-tags">
                  <span class="rel-tag">Mapel: <strong>{{ getSubjectName(generatedDoc.subject_id) }}</strong></span>
                  <span class="rel-tag">Kelas: <strong>{{ getClassName(generatedDoc.class_id) }}</strong></span>
                  <span class="rel-tag">Status: <strong>Draft</strong></span>
                  <span v-if="generatedDoc.document_type === 'soal'" class="rel-tag action-tag" @click="showLinkScheme = true">
                    ↔ Tautkan ke Skema Penilaian
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Tab: Bank Materi ────────────────────────────────────────────── -->
    <div v-if="activeTab === 'library'" class="tab-content">
      <!-- Filter bar -->
      <div class="library-filters">
        <select v-model="libraryFilter.type" class="filter-select" @change="loadLibrary">
          <option value="">Semua Jenis</option>
          <option value="rpp">Modul Ajar / RPP</option>
          <option value="soal">Soal / Kuis</option>
          <option value="materi">Materi Ajar</option>
        </select>
        <select v-model="libraryFilter.subject_id" class="filter-select" @change="loadLibrary">
          <option value="">Semua Mapel</option>
          <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-model="libraryFilter.academic_year_id" class="filter-select">
          <option value="">Semua Tahun Ajaran</option>
          <option v-for="ay in academicYears" :key="ay.id" :value="ay.id">{{ ay.name }}</option>
        </select>
        <select v-model="libraryFilter.class_id" class="filter-select" @change="loadLibrary">
          <option value="">Semua Kelas</option>
          <option v-for="c in filteredLibraryClasses" :key="c.id" :value="c.id">{{ c.class_name }}</option>
        </select>
        <div class="filter-search">
          <input
            v-model="libraryFilter.q"
            type="text"
            class="filter-input"
            placeholder="🔍 Cari judul…"
            @input="debouncedLoadLibrary"
          />
        </div>
        <label class="filter-mine">
          <input v-model="libraryFilter.mine" type="checkbox" @change="loadLibrary" />
          Dokumen saya
        </label>
        <span class="library-info">💡 Bank materi menempel ke sekolah — guru baru bisa pakai ulang & adaptasi</span>
      </div>

      <!-- Table -->
      <div class="library-table-wrap">
        <div v-if="libraryLoading" class="library-loading">
          <div class="mini-spinner"></div> Memuat…
        </div>
        <table v-else-if="libraryDocs.length > 0" class="library-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Jenis</th>
              <th>Mapel</th>
              <th>Kelas</th>
              <th>Pembuat</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="doc in libraryDocs"
              :key="doc.id"
              class="library-row"
              @click="openDocDetail(doc)"
            >
              <td>
                <span class="doc-row-title">{{ doc.title }}</span>
                <span v-if="doc.linked_scheme_id" class="linked-badge">📝 Skema Penilaian</span>
                <div v-if="doc.parent_title" style="margin-top: 4px;">
                  <span class="doc-parent-badge" style="background: rgba(139,92,246,0.1); color: var(--vio); font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(139,92,246,0.2);">
                    🔗 Turunan dari: {{ doc.parent_title }}
                  </span>
                </div>
              </td>
              <td><span class="type-chip" :class="`type-${doc.document_type}`">{{ docTypeIcon(doc.document_type) }} {{ docTypeLabel(doc.document_type) }}</span></td>
              <td>{{ getSubjectName(doc.subject_id) }}</td>
              <td>{{ doc.class_id ? getClassName(doc.class_id) : '—' }}</td>
              <td class="text-muted">{{ doc.created_by }}</td>
              <td class="text-muted">{{ formatDate(doc.created_at) }}</td>
              <td><span class="status-badge" :class="`status-${doc.status}`">{{ doc.status }}</span></td>
              <td class="row-actions">
                <div style="display: flex; gap: 8px;">
                  <button class="action-btn-icon" @click="openDocDetail(doc)" title="Buka Detail">
                    <Eye :size="16" />
                  </button>
                  <button class="action-btn-icon" @click="handleRegenerate(doc)" title="Generate Ulang">
                    <RefreshCw :size="16" />
                  </button>
                  <button class="action-btn-icon" @click="openDuplicate(doc)" title="Duplikat ke Kelas Lain">
                    <Copy :size="16" />
                  </button>
                  <button class="action-btn-icon danger" @click="handleArchive(doc)" title="Hapus Dokumen">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="library-empty">
          <div class="library-empty-icon">📚</div>
          <div>Belum ada dokumen yang tersimpan.</div>
          <button class="action-btn primary" @click="activeTab = 'generate'">✨ Buat Dokumen Pertama</button>
        </div>

        <!-- Pagination -->
        <AppPagination
          v-if="libraryPagination && libraryPagination.total_pages > 1"
          v-model:page="libraryFilter.page"
          v-model:itemPerPage="libraryFilter.limit"
          :totalItem="libraryPagination.total"
          :totalPage="libraryPagination.total_pages"
          :listPagination="Array.from({ length: libraryPagination.total_pages }, (_, i) => i + 1)"
          @update:page="loadLibrary"
          @update:itemPerPage="loadLibrary"
        />

        <div class="library-footer">
          Semua hasil AI tersimpan sebagai <strong>content terstruktur (JSONB)</strong> + konteks prompt —
          bisa dirender ulang ke Word/PDF kapan saja, diedit per bagian, dan dibagikan ke guru paralel.
        </div>
      </div>
    </div>

    <!-- ─── Modal: Detail Dokumen ─────────────────────────────────────────── -->
    <div v-if="selectedDoc" class="modal-overlay" @click.self="selectedDoc = null">
      <div class="modal-panel large">
        <div class="modal-header">
          <div>
            <div class="modal-title">{{ selectedDoc.title }}</div>
            <div class="modal-meta">
              <span class="doc-type-badge">{{ docTypeLabel(selectedDoc.document_type) }}</span>
              <span class="doc-status-badge" :class="selectedDoc.status">{{ selectedDoc.status }}</span>
              <span v-if="selectedDoc.parent_title" class="doc-parent-badge" style="background: rgba(139,92,246,0.1); color: var(--vio); font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(139,92,246,0.2);">
                🔗 Turunan dari: {{ selectedDoc.parent_title }}
              </span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="action-btn" @click="toggleEditMode" v-if="selectedDoc.document_type !== 'ppt'">{{ editMode ? '👁️ Lihat' : '✏️ Edit' }}</button>
            <button class="action-btn" @click="exportDoc('docx', selectedDoc.id)" v-if="selectedDoc.document_type !== 'ppt'">Word</button>
            <button class="action-btn" @click="exportDoc('pdf', selectedDoc.id)" v-if="selectedDoc.document_type !== 'ppt'">PDF</button>
            <button v-if="selectedDoc.document_type === 'ppt'" class="action-btn primary" @click="exportDoc('pptx', selectedDoc.id)">⬇ Download PPT (.pptx)</button>
            <button v-if="selectedDoc.status !== 'final'" class="action-btn primary" @click="handleFinalize(selectedDoc.id)">💾 Finalkan</button>
            <button class="modal-close" @click="selectedDoc = null">✕</button>
          </div>
        </div>

        <div class="modal-tabs">
          <button :class="{ active: modalTab === 'content' }" @click="modalTab = 'content'">Konten</button>
          <button :class="{ active: modalTab === 'versions' }" @click="loadVersions(); modalTab = 'versions'">
            Riwayat Versi
          </button>
          <button :class="{ active: modalTab === 'related' }" @click="openRelatedTab">
            ✨ Lanjut Buat...
          </button>
        </div>

        <div class="modal-body">
          <div v-if="modalTab === 'content'">
            <div v-if="editMode" class="edit-notice">
              ✏️ Mode edit aktif. Perubahan akan disimpan sebagai versi baru dengan tanda <strong>teacher_edited</strong>.
            </div>
            <!-- PPT: Flipbook Viewer -->
            <div v-if="selectedDoc.document_type === 'ppt' && selectedDoc.content?.slides?.length" style="padding: 16px;">
              <FlipbookViewer
                :slides="selectedDoc.content.slides"
                :title="selectedDoc.content.judul_presentasi ?? selectedDoc.title"
                :style="selectedDoc.content.style ?? 'profesional'"
              />
            </div>
            <div v-else-if="selectedDoc.document_type === 'ppt' && selectedDoc.status === 'generating'" style="padding: 40px; text-align: center; color: var(--muted2);">
              ⏳ Slide sedang di-generate... Mohon tunggu.
            </div>
            <!-- Other doc types: AiDocumentRenderer -->
            <AiDocumentRenderer
              v-else
              :document="selectedDoc"
              :editable="editMode"
              @save="handleSaveEdit"
            />
          </div>

          <div v-if="modalTab === 'versions'">
            <div v-if="docVersions.length === 0" class="empty-state">Tidak ada riwayat versi.</div>
            <div v-else class="versions-list">
              <div
                v-for="v in docVersions"
                :key="v.id"
                class="version-item"
                :class="{ current: v.version_no === selectedDoc?.current_version }"
              >
                <div class="version-info">
                  <span class="version-no">v{{ v.version_no }}</span>
                  <span class="version-origin" :class="`origin-${v.origin}`">
                    {{ v.origin === 'ai' ? '🤖 AI' : '✏️ Guru' }}
                  </span>
                  <span class="version-date">{{ formatDate(v.created_at) }}</span>
                  <span v-if="v.version_no === selectedDoc?.current_version" class="version-current">AKTIF</span>
                </div>
                <button
                  v-if="v.version_no !== selectedDoc?.current_version"
                  class="action-btn sm"
                  @click="handleRestoreVersion(v.version_no)"
                >
                  Restore
                </button>
              </div>
            </div>
          </div>

          <div v-if="modalTab === 'related'" class="related-doc-form p-4">
            <p class="text-sm mb-6" style="color: var(--muted2);">
              Buat dokumen turunan (misal: Soal Evaluasi) menggunakan konteks Mapel, Kelas, dan Tujuan Pembelajaran yang sama persis dengan dokumen ini.
            </p>
            <div class="form-field mb-4">
              <label class="field-label">Jenis Dokumen</label>
              <select v-model="relatedForm.document_type" class="field-input">
                <option v-for="dt in documentTypes.filter(d => d.key !== selectedDoc?.document_type && d.key !== 'rpp')" :key="dt.key" :value="dt.key">
                  {{ dt.icon }} {{ dt.label }}
                </option>
              </select>
            </div>
            
            <div v-if="relatedForm.document_type === 'soal'" class="soal-options bg-panel2 p-4 rounded-lg mb-4" style="background: var(--panel2); padding: 1rem; border-radius: 8px;">
              <h4 class="text-sm font-bold mb-3">Pengaturan Soal</h4>
              <div class="grid grid-cols-2 gap-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label class="field-label">Jumlah Pilihan Ganda</label>
                  <input type="number" v-model="relatedForm.soal_opts.jumlah_pg" class="field-input" min="0" max="50" />
                </div>
                <div>
                  <label class="field-label">Jumlah Esai</label>
                  <input type="number" v-model="relatedForm.soal_opts.jumlah_esai" class="field-input" min="0" max="20" />
                </div>
              </div>
            </div>
            
            <div class="flex justify-end mt-4">
              <button class="action-btn primary" @click="handleGenerateRelated" :disabled="generatingRelated" style="padding: 10px 20px;">
                {{ generatingRelated ? '⏳ Memproses...' : '✨ Generate Dokumen Terkait' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Modal: Regenerate ─────────────────────────────────────────────── -->
    <div v-if="regenerateTargetDoc" class="modal-overlay" @click.self="regenerateTargetDoc = null">
      <div class="modal-panel">
        <div class="modal-header">
          <div class="modal-title">🔄 Generate Ulang Dokumen</div>
          <button class="modal-close" @click="regenerateTargetDoc = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="p-4" style="padding: 1rem;">
            <p style="margin-bottom: 1rem; color: var(--text); font-size: 14px;">
              Anda akan men-generate ulang <strong>{{ regenerateTargetDoc.title }}</strong>.<br>
              <span class="text-muted" style="color: var(--muted2);">Kuota AI akan terpotong 1.</span>
            </p>
            
            <div class="form-field" style="margin-bottom: 1rem;">
              <!-- RPP Options -->
              <template v-if="regenerateTargetDoc.document_type === 'rpp'">
                <label class="field-label" style="display: block; margin-bottom: 8px;">Model Pembelajaran</label>
                <select v-model="regenerateForm.model_pembelajaran" class="field-input" style="width: 100%; box-sizing: border-box; margin-bottom: 16px;">
                  <option v-for="m in modelPembelajaranOptions" :key="m" :value="m">{{ m }}</option>
                </select>
              </template>

              <!-- Soal Options -->
              <template v-if="regenerateTargetDoc.document_type === 'soal'">
                <div class="form-field-row" style="margin-bottom: 12px;">
                  <div class="form-field">
                    <label class="field-label">Jumlah PG</label>
                    <input v-model.number="regenerateForm.soal_opts.jumlah_pg" type="number" min="0" max="50" class="field-input" />
                  </div>
                  <div class="form-field">
                    <label class="field-label">Jumlah Esai</label>
                    <input v-model.number="regenerateForm.soal_opts.jumlah_esai" type="number" min="0" max="20" class="field-input" />
                  </div>
                </div>
                <div class="form-field" style="margin-bottom: 16px;">
                  <label class="field-label">Level Kognitif (Bloom)</label>
                  <div class="bloom-checkboxes">
                    <label v-for="lvl in bloomLevels" :key="lvl.key" class="bloom-check">
                      <input
                        type="checkbox"
                        :value="lvl.key"
                        :checked="regenerateForm.soal_opts.level_kognitif.includes(lvl.key)"
                        @change="toggleRegenerateBloom(lvl.key)"
                      />
                      <span :class="`bloom-${lvl.key.toLowerCase()}`">{{ lvl.label }}</span>
                    </label>
                  </div>
                </div>
              </template>

              <label class="field-label" style="display: block; margin-bottom: 8px; color: var(--muted);">
                Instruksi Tambahan / Catatan Revisi (Opsional)
              </label>
              <textarea
                v-model="regenerateFeedback"
                class="field-input"
                rows="4"
                placeholder="Contoh: Buat soalnya lebih sulit, atau tambahkan materi tentang bagian X..."
                style="width: 100%; box-sizing: border-box;"
              ></textarea>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 1.5rem;">
              <button class="action-btn" @click="regenerateTargetDoc = null" style="padding: 8px 16px;">Batal</button>
              <button class="action-btn primary" @click="submitRegenerate" :disabled="generating" style="padding: 8px 16px;">
                {{ generating ? '⏳ Memproses...' : '🔄 Generate Ulang' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Toast ─────────────────────────────────────────────────────────── -->
    <div class="toast" :class="{ show: toastVisible }">{{ toastMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Eye, RefreshCw, Copy, Trash2 } from 'lucide-vue-next'
import type { AiDocument, AiDocumentVersion, QuotaStatus } from '~/composables/useAiAsisten'

useHead({ title: 'AI Asisten Guru — EduRaport' })

const {
  fetcher
} = useApi()
const { 
  isSchoolLocked, selectedFoundationId, selectedSchoolId, 
  foundations, schools, initContext, onFoundationChange 
} = useSchoolContext()
const { curriculums, fetchCurriculums } = useSchool()

const {
  getContext, getQuota, generate, listDocuments, getDocument,
  updateDocument, regenerate, finalizeDocument, duplicateDocument,
  exportDocument, listVersions, restoreVersion, archiveDocument
} = useAiAsisten(selectedSchoolId)

// ─── State ────────────────────────────────────────────────────────────────────
const activeTab = ref<'generate' | 'library'>('generate')
const quota = ref<QuotaStatus | null>(null)

// Form
const form = ref({
  document_type: 'rpp' as 'rpp' | 'soal' | 'materi' | 'ppt',
  curriculum_id: '',
  subject_id: '',
  class_id: '',
  learning_outcome_id: '',
  manual_tp: '',
  academic_year_id: '',
  semester: 'ganjil' as 'ganjil' | 'genap',
  topic: '',
  model_pembelajaran: 'Problem Based Learning',
  soal_opts: { jumlah_pg: 10, jumlah_esai: 5, level_kognitif: ['C2', 'C3', 'C4', 'C5'] },
  materi_opts: { jumlah_sub_bab: 3, with_images: true },
  ppt_opts: { jumlah_slide: 8, style: 'profesional' as 'minimalis' | 'colorful' | 'profesional', with_speaker_notes: true, with_images: true },
})

const subjects = ref<any[]>([])
const availableClasses = ref<any[]>([])
const learningOutcomes = ref<any[]>([])
const academicYears = ref<any[]>([])
const contextLoaded = ref(false)

const generating = ref(false)
const generatedDoc = ref<AiDocument | null>(null)
const generateError = ref('')
const currentStepIndex = ref(0)
const loadingSteps = [
  'Mengambil CP/TP dari kurikulum…',
  'Menyusun kerangka dokumen…',
  'Menulis isi konten…',
  'Memvalidasi format output…',
  'Menyimpan ke Bank Materi…',
]
const materiLoadingSteps = [
  'Mengantre proses AI (Materi)...',
  'Menyusun narasi Materi Ajar...',
  'Men-generate ilustrasi gambar (ini butuh waktu)...',
  'Memvalidasi dan menyimpan...',
]
const pptLoadingSteps = [
  'Mengantre proses AI (PPT)...',
  'Menyusun struktur slide...',
  'Men-generate ilustrasi visual (ini butuh waktu)...',
  'Menyusun file PPT dan menyimpan...',
]
const currentStep = computed(() => {
  if (form.value.document_type === 'materi') {
    return materiLoadingSteps[currentStepIndex.value] ?? ''
  }
  if (form.value.document_type === 'ppt') {
    return pptLoadingSteps[currentStepIndex.value] ?? ''
  }
  return loadingSteps[currentStepIndex.value] ?? ''
})

// Library
const libraryDocs = ref<AiDocument[]>([])
const libraryPagination = ref<any>(null)
const libraryLoading = ref(false)
const libraryFilter = ref({ type: '', subject_id: '', class_id: '', academic_year_id: '', q: '', mine: false, page: 1, limit: 20 })

// Modal
const selectedDoc = ref<AiDocument | null>(null)
const editMode = ref(false)
const modalTab = ref<'content' | 'versions' | 'related'>('content')
const docVersions = ref<AiDocumentVersion[]>([])
const showLinkScheme = ref(false)
const regenerateTargetDoc = ref<AiDocument | null>(null)
const regenerateFeedback = ref('')
const regenerateForm = ref({
  model_pembelajaran: 'Problem Based Learning',
  soal_opts: { jumlah_pg: 10, jumlah_esai: 5, level_kognitif: ['C2', 'C3', 'C4', 'C5'] }
})

// Related Doc
const generatingRelated = ref(false)
const relatedForm = ref({
  document_type: 'soal' as 'rpp' | 'soal' | 'materi' | 'ppt',
  soal_opts: { jumlah_pg: 10, jumlah_esai: 5, level_kognitif: ['C2', 'C3', 'C4', 'C5'] },
})

// Toast
const toastVisible = ref(false)
const toastMessage = ref('')

// ─── Config ───────────────────────────────────────────────────────────────────
const tabs = [
  { key: 'generate', label: '✨ BUAT DOKUMEN BARU' },
  { key: 'library', label: '📚 BANK MATERI (TERSIMPAN)' },
]

const documentTypes = [
  { key: 'rpp', icon: '📄', label: 'Modul Ajar / RPP', phase: 1 },
  { key: 'soal', icon: '🎯', label: 'Soal / Kuis + Rubrik', phase: 1 },
  { key: 'materi', icon: '🖼️', label: 'Materi Ajar', phase: 1 },
  { key: 'ppt', icon: '📽️', label: 'Bahan Tayang PPT', phase: 1 },
]

const modelPembelajaranOptions = [
  'Problem Based Learning',
  'Project Based Learning',
  'Discovery Learning',
  'Cooperative Learning',
  'Inquiry Learning',
  'Direct Instruction',
]

const bloomLevels = [
  { key: 'C1', label: 'C1 Ingat' },
  { key: 'C2', label: 'C2 Pahami' },
  { key: 'C3', label: 'C3 Terapkan' },
  { key: 'C4', label: 'C4 Analisis' },
  { key: 'C5', label: 'C5 Evaluasi' },
  { key: 'C6', label: 'C6 Cipta' },
]

// ─── Computed ────────────────────────────────────────────────────────────────
const filteredClasses = computed(() => {
  if (!availableClasses.value) return []
  if (!form.value.academic_year_id) return availableClasses.value
  return availableClasses.value.filter((c: any) => c.academic_year_id === form.value.academic_year_id)
})

const schoolCurriculums = computed(() => {
  const school = schools.value.find(s => s.id === selectedSchoolId.value)
  if (!school) return []
  if (school.curriculum_id) {
    return curriculums.value.filter(c => c.id === school.curriculum_id)
  }
  return curriculums.value
})

const filteredLearningOutcomes = computed(() => {
  if (!form.value.curriculum_id) return learningOutcomes.value
  return learningOutcomes.value.filter((lo: any) => lo.curriculum_id === form.value.curriculum_id)
})

watch(() => form.value.academic_year_id, () => {
  form.value.class_id = ''
})

const filteredLibraryClasses = computed(() => {
  if (!availableClasses.value) return []
  if (!libraryFilter.value.academic_year_id) return availableClasses.value
  return availableClasses.value.filter((c: any) => c.academic_year_id === libraryFilter.value.academic_year_id)
})

watch(() => libraryFilter.value.academic_year_id, () => {
  libraryFilter.value.class_id = ''
  loadLibrary()
})

const canGenerate = computed(() => {
  const f = form.value
  const hasTP = (f.learning_outcome_id && f.learning_outcome_id !== '__manual') || f.manual_tp
  return (
    f.subject_id &&
    f.academic_year_id &&
    f.topic.trim().length >= 3 &&
    hasTP &&
    quota.value && quota.value.remaining > 0
  )
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
const loadSchoolData = async () => {
  await Promise.all([
    loadQuota(),
    loadSubjects(),
    loadAcademicYears(),
    loadClasses(),
  ])

  const school = schools.value.find(s => s.id === selectedSchoolId.value)
  const foundationId = school?.foundation_id || selectedFoundationId.value
  if (foundationId) await fetchCurriculums(foundationId)
  
  if (schoolCurriculums.value.length === 1) {
    form.value.curriculum_id = schoolCurriculums.value[0].id
  }
}

onMounted(async () => {
  const sid = await initContext()
  if (sid) {
    await loadSchoolData()
  }
})

watch(selectedFoundationId, (newVal) => onFoundationChange(newVal))
watch(selectedSchoolId, async (newVal) => {
  if (newVal) {
    await loadSchoolData()
  } else {
    subjects.value = []
    academicYears.value = []
    availableClasses.value = []
    quota.value = null
  }
})

watch(activeTab, (tab) => {
  if (tab === 'library') loadLibrary()
})

// ─── Methods ──────────────────────────────────────────────────────────────────
async function loadQuota() {
  try {
    quota.value = await getQuota()
  } catch { /* fail silently */ }
}

async function loadSubjects() {
  try {
    const res: any = await fetcher(`/school/${selectedSchoolId.value}/subject`)
    subjects.value = res.data?.data ?? res.data ?? []
  } catch { /* */ }
}

async function loadAcademicYears() {
  try {
    const res: any = await fetcher(`/school/${selectedSchoolId.value}/academic-year`)
    academicYears.value = res.data?.data ?? res.data ?? []
    // Auto-select active year
    const active = academicYears.value.find((y: any) => y.is_active)
    if (active) form.value.academic_year_id = active.id
  } catch { /* */ }
}

async function loadClasses() {
  try {
    const res: any = await fetcher(`/school/${selectedSchoolId.value}/class?item_per_page=200`)
    availableClasses.value = res.data?.data ?? res.data ?? []
  } catch { /* */ }
}

async function onSubjectChange() {
  if (!form.value.subject_id) {
    learningOutcomes.value = []
    contextLoaded.value = false
    return
  }
  try {
    const ctx = await getContext(form.value.subject_id, form.value.class_id || undefined)
    learningOutcomes.value = ctx.learning_outcomes ?? []
    contextLoaded.value = true
    if (ctx.classes?.length > 0 && !availableClasses.value.length) {
      availableClasses.value = ctx.classes
    }
    if (schoolCurriculums.value.length === 1) {
      form.value.curriculum_id = schoolCurriculums.value[0].id
    }
  } catch { /* */ }
}

function selectDocType(dt: any) {
  form.value.document_type = dt.key
}

function toggleBloom(key: string) {
  const idx = form.value.soal_opts.level_kognitif.indexOf(key)
  if (idx === -1) {
    form.value.soal_opts.level_kognitif.push(key)
  } else {
    form.value.soal_opts.level_kognitif.splice(idx, 1)
  }
}

async function handleGenerate() {
  if (!canGenerate.value) return
  generating.value = true
  generateError.value = ''
  
  // Simpan referensi ke previous doc (untuk derived_from) sebelum di-reset
  const prevDoc = generatedDoc.value
  generatedDoc.value = null
  currentStepIndex.value = 0

  // Animate loading steps
  const stepInterval = setInterval(() => {
    if (currentStepIndex.value < loadingSteps.length - 1) {
      currentStepIndex.value++
    }
  }, 800)

  try {
    const f = form.value
    
    const payload: any = {
      document_type: f.document_type,
      subject_id: f.subject_id,
      class_id: f.class_id || undefined,
      learning_outcome_id: f.learning_outcome_id && f.learning_outcome_id !== '__manual' ? f.learning_outcome_id : undefined,
      manual_tp: f.learning_outcome_id === '__manual' ? f.manual_tp : undefined,
      academic_year_id: f.academic_year_id,
      semester: f.semester,
      topic: f.topic,
      model_pembelajaran: f.model_pembelajaran,
    }

    // Auto-link ke Modul Ajar yang baru di-generate (RPP sesi ini)
    if (['soal', 'materi', 'ppt'].includes(f.document_type) && prevDoc?.id) {
      payload.derived_from = prevDoc.id
    }

    if (f.document_type === 'soal') {
      payload.soal_opts = f.soal_opts
    } else if (f.document_type === 'materi') {
      payload.materi_opts = f.materi_opts
    } else if (f.document_type === 'ppt') {
      payload.ppt_opts = f.ppt_opts
    }

    const result = await generate(payload)
    
    if (result.job_id) {
      // Async mode: Tidak perlu polling yang memblokir UI.
      showToast('🚀 Dokumen sedang diproses AI di latar belakang! Silakan cek Bank Materi beberapa saat lagi.')
      
      // Kembalikan state agar pengguna bisa lanjut membuat turunan lain (misal langsung buat PPT)
      if (prevDoc) {
        generatedDoc.value = prevDoc
      }
      
      loadLibrary() // Tetap muat ulang library di background
      await loadQuota()
    } else {
      // Sync mode
      generatedDoc.value = result.document ?? null
      await loadQuota()
      showToast(`✅ Dokumen dibuat & tersimpan ke Bank Materi!`)
    }
  } catch (err: any) {
    const errData = err.data ?? err
    if (errData?.error === 'QUOTA_EXCEEDED') {
      generateError.value = `❌ Kuota AI harian habis. Reset: ${formatDate(errData.resets_at)}`
    } else if (errData?.error === 'SCHEMA_VALIDATION_FAILED') {
      generateError.value = '⚠️ AI gagal menghasilkan format yang valid. Coba generate ulang.'
    } else if (errData?.error === 'AI_PROVIDER_ERROR') {
      generateError.value = '🔌 AI provider sedang tidak tersedia. Kuota tidak terpotong.'
    } else {
      generateError.value = err?.message ?? 'Terjadi kesalahan. Silahkan coba lagi.'
    }
  } finally {
    clearInterval(stepInterval)
    generating.value = false
  }
}

async function handleFinalize(docId?: string) {
  const id = docId ?? generatedDoc.value?.id
  if (!id) return
  try {
    await finalizeDocument(id)
    if (generatedDoc.value?.id === id) generatedDoc.value.status = 'final'
    if (selectedDoc.value?.id === id) selectedDoc.value.status = 'final'
    showToast('✅ Dokumen berhasil difinalisasi!')
  } catch (err: any) {
    showToast(`❌ ${err?.message ?? 'Gagal finalisasi'}`)
  }
}

function handleRegenerate(doc: AiDocument) {
  regenerateTargetDoc.value = doc
  regenerateFeedback.value = ''
  
  const ctx = doc.prompt_context as any || {}
  regenerateForm.value.model_pembelajaran = ctx.model_pembelajaran || 'Problem Based Learning'
  regenerateForm.value.soal_opts = {
    jumlah_pg: ctx.soal_opts?.jumlah_pg ?? 10,
    jumlah_esai: ctx.soal_opts?.jumlah_esai ?? 5,
    level_kognitif: ctx.soal_opts?.level_kognitif ?? ['C2', 'C3', 'C4', 'C5']
  }
}

function toggleRegenerateBloom(key: string) {
  const arr = regenerateForm.value.soal_opts.level_kognitif
  if (arr.includes(key)) {
    regenerateForm.value.soal_opts.level_kognitif = arr.filter((k: string) => k !== key)
  } else {
    regenerateForm.value.soal_opts.level_kognitif.push(key)
  }
}

async function submitRegenerate() {
  if (!regenerateTargetDoc.value) return
  generating.value = true
  try {
    const payload: any = {
      teacher_feedback: regenerateFeedback.value
    }
    
    if (regenerateTargetDoc.value.document_type === 'rpp') {
      payload.model_pembelajaran = regenerateForm.value.model_pembelajaran
    } else if (regenerateTargetDoc.value.document_type === 'soal') {
      payload.soal_opts = regenerateForm.value.soal_opts
    }

    const newDoc = await regenerate(regenerateTargetDoc.value.id, payload)
    generatedDoc.value = newDoc
    regenerateTargetDoc.value = null
    activeTab.value = 'generate'
    await loadQuota()
    showToast(`♻️ Dokumen regenerasi berhasil — kuota berkurang 1`)
  } catch (err: any) {
    showToast(`❌ ${err?.message ?? 'Gagal regenerate'}`)
  } finally {
    generating.value = false
  }
}

async function handleArchive(doc: AiDocument) {
  const confirmArchive = confirm(`Apakah Anda yakin ingin menghapus ${doc.title}?`)
  if (!confirmArchive) return

  try {
    await archiveDocument(doc.id)
    showToast(`🗑️ Dokumen ${doc.title} berhasil dihapus`)
    loadLibrary()
  } catch (err: any) {
    let errMsg = err?.message || ''
    if (err?.data?.errors?._error?.[0]) {
      errMsg = err.data.errors._error[0]
    }
    showToast(`❌ Gagal menghapus: ${errMsg}`)
  }
}

// Library
async function loadLibrary() {
  libraryLoading.value = true
  try {
    const result = await listDocuments({
      type: libraryFilter.value.type || undefined,
      subject_id: libraryFilter.value.subject_id || undefined,
      class_id: libraryFilter.value.class_id || undefined,
      academic_year_id: libraryFilter.value.academic_year_id || undefined,
      q: libraryFilter.value.q || undefined,
      mine: libraryFilter.value.mine || undefined,
      page: libraryFilter.value.page,
      limit: libraryFilter.value.limit,
    })
    libraryDocs.value = result.data
    libraryPagination.value = result.pagination
  } catch { /* */ }
  libraryLoading.value = false
}

let debounceTimer: any
function debouncedLoadLibrary() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadLibrary, 400)
}

function goToPage(p: number) {
  libraryFilter.value.page = p
  loadLibrary()
}

// Document detail
function openDocDetail(doc: AiDocument) {
  selectedDoc.value = doc
  editMode.value = false
  modalTab.value = 'content'
}

function openRelatedTab() {
  modalTab.value = 'related'
  if (selectedDoc.value) {
    // Default: suggest something other than the current doc type (prefer soal or materi or ppt)
    const oppType = documentTypes.find(d => d.key !== selectedDoc.value?.document_type && d.key !== 'rpp')
    if (oppType) {
      relatedForm.value.document_type = oppType.key as any
    }
  }
}

function toggleEditMode() {
  editMode.value = !editMode.value
}

async function handleSaveEdit(newContent: Record<string, any>) {
  if (!selectedDoc.value) return
  try {
    await updateDocument(selectedDoc.value.id, newContent)
    selectedDoc.value.content = newContent
    editMode.value = false
    showToast('✅ Perubahan tersimpan sebagai versi baru')
  } catch (err: any) {
    showToast(`❌ ${err?.message ?? 'Gagal menyimpan'}`)
  }
}

async function loadVersions() {
  if (!selectedDoc.value) return
  try {
    docVersions.value = await listVersions(selectedDoc.value.id)
  } catch { /* */ }
}

async function handleRestoreVersion(versionNo: number) {
  if (!selectedDoc.value) return
  try {
    await restoreVersion(selectedDoc.value.id, versionNo)
    const refreshed = await getDocument(selectedDoc.value.id)
    selectedDoc.value = refreshed
    modalTab.value = 'content'
    showToast(`✅ Dipulihkan ke versi ${versionNo}`)
  } catch (err: any) {
    showToast(`❌ ${err?.message ?? 'Gagal restore'}`)
  }
}

function openDuplicate(doc: AiDocument) {
  showToast('Pilih kelas tujuan duplikasi — fitur ini akan membuka dialog kelas (coming soon)')
}

function openEdit() {
  if (!generatedDoc.value) return
  selectedDoc.value = generatedDoc.value
  editMode.value = true
}

async function handleGenerateRelated() {
  if (!selectedDoc.value) return
  
  const ctx = selectedDoc.value.prompt_context as any
  const payload = {
    document_type: relatedForm.value.document_type,
    subject_id: selectedDoc.value.subject_id,
    class_id: selectedDoc.value.class_id ?? undefined,
    learning_outcome_id: selectedDoc.value.learning_outcome_id ?? undefined,
    manual_tp: selectedDoc.value.manual_tp ?? undefined,
    academic_year_id: selectedDoc.value.academic_year_id,
    semester: selectedDoc.value.semester as any,
    topic: ctx?.topik ?? 'Lanjutan Pembelajaran',
    model_pembelajaran: ctx?.model_pembelajaran ?? 'Problem Based Learning',
    derived_from: selectedDoc.value.id,
    ...(relatedForm.value.document_type === 'soal' ? { soal_opts: relatedForm.value.soal_opts } : {}),
    ...(relatedForm.value.document_type === 'ppt' ? { ppt_opts: { jumlah_slide: 8, style: 'profesional', with_speaker_notes: true, with_images: true } } : {}),
  }
  
  generatingRelated.value = true
  try {
    const res = await generate(payload)
    showToast(`✨ Pembuatan dokumen terkait berhasil! Kuota tersisa: ${res.quota_remaining}`)
    
    // Refresh library and switch to the new doc
    await loadLibrary()
    selectedDoc.value = res.document
    modalTab.value = 'content'
    
  } catch (err: any) {
    showToast(`❌ ${err?.message ?? 'Gagal membuat dokumen terkait'}`)
  } finally {
    generatingRelated.value = false
  }
}

async function exportDoc(format: 'pdf' | 'docx' | 'pptx', docId?: string) {
  const id = docId ?? generatedDoc.value?.id
  if (!id) return
  
  const targetDoc = id === selectedDoc.value?.id ? selectedDoc.value : (id === generatedDoc.value?.id ? generatedDoc.value : libraryDocs.value.find(d => d.id === id))
  const title = targetDoc?.title || 'Dokumen_AI'

  showToast(`⏳ Menyiapkan file ${format.toUpperCase()}...`)
  try {
    await exportDocument(id, format, title)
    showToast(`✅ File ${format.toUpperCase()} berhasil diunduh`)
  } catch (err: any) {
    showToast(`❌ Gagal mengunduh: ${err?.message || 'Error'}`)
  }
}

// Helpers
function docTypeLabel(type: string) {
  return { rpp: 'Modul Ajar', soal: 'Soal / Kuis', materi: 'Materi Ajar', ppt: 'Bahan Tayang PPT' }[type] ?? type
}

function docTypeIcon(type: string) {
  return { rpp: '📄', soal: '🎯', materi: '🖼️', ppt: '📽️' }[type] ?? '📄'
}

function getSubjectName(id: string) {
  return subjects.value.find((s: any) => s.id === id)?.name ?? id
}

function getClassName(id: string | null) {
  if (!id) return '—'
  return availableClasses.value.find((c: any) => c.id === id)?.class_name ?? id
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 3500)
}
</script>

<style scoped>
/* ─── Variables ─────────────────────────────────────────────────────────── */
.ai-asisten-page {
  --bg: #0e0e13;
  --panel: #1a1a22;
  --panel2: #20202a;
  --line: #2b2b37;
  --text: #e9e9f1;
  --muted: #8f8fa3;
  --muted2: #6c6c7e;
  --vio: #8b5cf6;
  --vio-strong: #7c4dff;
  --vio-soft: rgba(139,92,246,.14);
  --green: #2dd4a7;
  --green-soft: rgba(45,212,167,.13);
  --red: #f4645c;
  --amber: #f5b04c;
  --amber-soft: rgba(245,176,76,.13);
  --blue: #5ca8f4;
  --r: 12px;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
}

/* ─── Page Header ───────────────────────────────────────────────────────── */
.page-header {
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  padding: 20px 28px 0;
}
.page-header-content {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.page-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -.4px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.page-title-icon { font-size: 22px; }
.page-subtitle {
  color: var(--muted);
  margin-top: 4px;
  max-width: 600px;
  line-height: 1.5;
}

/* Quota badge */
.quota-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  background: var(--amber-soft);
  border: 1px solid rgba(245,176,76,.3);
  border-radius: 99px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 700;
  color: var(--amber);
  white-space: nowrap;
}
.quota-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--amber);
}
.quota-bar {
  width: 60px; height: 4px;
  background: rgba(245,176,76,.2);
  border-radius: 4px;
  overflow: hidden;
}
.quota-fill {
  display: block;
  height: 100%;
  background: var(--amber);
  border-radius: 4px;
  transition: width .3s;
}
.quota-empty .quota-badge { border-color: rgba(244,100,92,.4); color: var(--red); background: rgba(244,100,92,.1); }
.quota-empty .quota-dot { background: var(--red); }
.quota-reset { font-size: 10px; color: var(--muted); }

/* Tabs */
.page-tabs { display: flex; gap: 24px; border-bottom: none; }
.tab-btn {
  font: inherit;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: .8px;
  background: none;
  border: none;
  color: var(--muted);
  padding: 10px 2px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all .2s;
}
.tab-btn.active { color: var(--vio); border-bottom-color: var(--vio); }

/* ─── Generator Layout ──────────────────────────────────────────────────── */
.tab-content { padding: 20px 28px; }
.admin-school-selectors {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  background: var(--panel);
  padding: 16px;
  border-radius: var(--r);
  border: 1px solid var(--line);
}
.selector-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.selector-field label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .8px;
  text-transform: uppercase;
  color: var(--muted2);
}
.generator-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
}
@media (max-width: 960px) { .generator-layout { grid-template-columns: 1fr; } }

.form-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--r);
  padding: 18px;
}
.form-section { margin-bottom: 18px; }
.form-section-title {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .8px;
  text-transform: uppercase;
  color: var(--muted2);
  margin-bottom: 12px;
}
.auto-badge {
  font-size: 9px;
  color: var(--vio);
  letter-spacing: .5px;
  font-weight: 700;
}

/* Doc types */
.doc-types { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.doc-type-btn {
  position: relative;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  background: transparent;
  color: var(--text);
  text-align: center;
  transition: all .15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.doc-type-btn:hover { border-color: var(--vio); }
.doc-type-btn.active { border-color: var(--vio); background: var(--vio-soft); }
.doc-type-btn.disabled { opacity: .6; cursor: not-allowed; }
.doc-type-icon { font-size: 20px; }
.doc-type-label { font-size: 11px; font-weight: 700; }
.doc-type-phase {
  position: absolute;
  top: 5px; right: 6px;
  font-size: 8px; font-weight: 800;
  letter-spacing: .5px;
  color: var(--amber);
}

/* Form fields */
.form-field { margin-bottom: 11px; }
.field-label {
  display: block;
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--muted2);
  margin-bottom: 5px;
  text-transform: uppercase;
}
.field-label-hint { color: var(--vio); font-weight: 700; }
.field-input {
  width: 100%;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  background: #101017;
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 9px;
  padding: 9px 11px;
  color-scheme: dark;
}
.field-input option {
  background: #1a1a22;
  color: #e9e9f1;
}
.field-input:focus { outline: none; border-color: var(--vio); }
.field-input:disabled { opacity: .5; cursor: not-allowed; }
.field-hint {
  font-size: 10.5px;
  color: var(--muted2);
  margin-top: 5px;
  line-height: 1.5;
}
.manual-tp-wrap { margin-top: 8px; }

/* Soal opts */
.soal-opts-header {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .8px;
  color: var(--muted2);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.form-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

/* Bloom checkboxes */
.bloom-checkboxes { display: flex; flex-wrap: wrap; gap: 6px; }
.bloom-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 600;
  cursor: pointer;
}
.bloom-check span {
  background: var(--panel2);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 3px 8px;
}

/* Generate button */
.generate-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: var(--vio);
  border: none;
  border-radius: 10px;
  color: #fff;
  font: inherit;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all .2s;
  margin-top: 6px;
}
.generate-btn:hover:not(:disabled) { background: var(--vio-strong); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139,92,246,.35); }
.generate-btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-quota { font-size: 11px; opacity: .8; }
.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.generate-error {
  margin-top: 10px;
  background: rgba(244,100,92,.1);
  border: 1px solid rgba(244,100,92,.3);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--red);
}

/* ─── Output Panel ──────────────────────────────────────────────────────── */
.output-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--r);
  padding: 20px;
  min-height: 400px;
}

.output-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 30px;
  height: 100%;
  min-height: 300px;
}
.output-empty-icon { font-size: 44px; margin-bottom: 12px; }
.output-empty-title { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.output-empty-sub { font-size: 12px; color: var(--muted); line-height: 1.6; }

/* Loading */
.output-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 20px;
  text-align: center;
}
.output-spinner {
  width: 44px; height: 44px;
  border: 4px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}
.output-loading-title { font-weight: 700; margin-bottom: 8px; }
.output-loading-step { font-size: 12px; color: var(--muted); margin-bottom: 20px; }
.loading-step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--muted2);
  margin: 4px 0;
  transition: color .3s;
}
.loading-step-item.active { color: var(--vio); }
.loading-step-item.done { color: var(--green); }
.step-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.action-link { font-size: 13px; color: var(--vio); cursor: pointer; text-decoration: underline; transition: color .15s; }
.action-link:hover { color: var(--vio-strong); }
.action-link.text-danger { color: #f43f5e; }
.action-link.text-danger:hover { color: #e11d48; }

.action-btn-icon {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 6px;
  background: var(--panel2); color: var(--muted);
  border: 1px solid var(--line);
  transition: all .15s; cursor: pointer;
}
.action-btn-icon:hover {
  background: var(--vio-soft); color: var(--vio); border-color: var(--vio);
}
.action-btn-icon.danger:hover {
  background: rgba(244, 63, 94, 0.1); color: #f43f5e; border-color: #f43f5e;
}

/* Doc result */
.doc-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.doc-header-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1; }
.doc-title { font-weight: 800; font-size: 15px; }
.doc-type-badge {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: .5px;
  border-radius: 99px;
  padding: 3px 10px;
  background: var(--vio-soft);
  color: var(--vio);
  text-transform: uppercase;
}
.doc-status-badge {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: .5px;
  border-radius: 99px;
  padding: 3px 10px;
  text-transform: uppercase;
}
.doc-status-badge.draft, .status-draft { background: var(--amber-soft); color: var(--amber); }
.doc-status-badge.final, .status-final { background: var(--green-soft); color: var(--green); }
.doc-status-badge.archived, .status-archived { background: var(--panel2); color: var(--muted); }
.doc-actions { display: flex; gap: 6px; margin-left: auto; }

.draft-notice {
  font-size: 11px;
  color: var(--muted2);
  background: var(--vio-soft);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
  line-height: 1.5;
}
.doc-content {
  background: #101017;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 18px;
  line-height: 1.6;
  max-height: 500px;
  overflow-y: auto;
}
.doc-relations {
  background: var(--panel2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 14px;
  margin-top: 14px;
}
.relations-title {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--muted2);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.relations-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.rel-tag {
  font-size: 11px;
  font-weight: 600;
  background: #101017;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 4px 9px;
  color: var(--muted);
}
.rel-tag strong { color: var(--text); }
.action-tag { cursor: pointer; color: var(--vio); border-color: rgba(139,92,246,.3); background: var(--vio-soft); }
.action-tag:hover { background: rgba(139,92,246,.25); }

/* ─── Buttons ───────────────────────────────────────────────────────────── */
.action-btn {
  font: inherit;
  font-weight: 700;
  font-size: 12px;
  border: 1px solid var(--line);
  background: var(--panel2);
  color: var(--text);
  border-radius: 8px;
  padding: 7px 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all .15s;
}
.action-btn:hover { background: #28283a; }
.action-btn.primary { background: var(--vio); border-color: var(--vio); }
.action-btn.primary:hover { background: var(--vio-strong); }
.action-btn.sm { padding: 5px 10px; font-size: 11px; }

/* ─── Library ───────────────────────────────────────────────────────────── */
.library-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
  align-items: center;
}
.filter-select, .filter-input {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  background: #101017;
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 9px;
  padding: 7px 11px;
}
.filter-search { flex: 1; min-width: 150px; }
.filter-search .filter-input { width: 100%; }
.filter-mine {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
}
.library-info { margin-left: auto; font-size: 11px; color: var(--muted2); }

.library-table-wrap {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--r);
  overflow: hidden;
}
.library-table { width: 100%; border-collapse: collapse; }
.library-table th {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--muted2);
  font-weight: 800;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--panel2);
  text-align: left;
}
.library-table td { padding: 11px 16px; border-bottom: 1px solid #22222c; }
.library-row { cursor: pointer; transition: background .15s; }
.library-row:hover td { background: #1e1e28; }
.library-row:last-child td { border-bottom: none; }
.doc-row-title { font-weight: 700; }
.linked-badge {
  font-size: 9.5px;
  font-weight: 800;
  background: rgba(92,168,244,.13);
  color: #5ca8f4;
  border-radius: 99px;
  padding: 2px 8px;
  margin-left: 6px;
}
.type-chip {
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 7px;
  background: var(--panel2);
}
.text-muted { color: var(--muted); }
.row-actions { display: flex; gap: 6px; }
.action-link {
  color: var(--vio);
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
}
.action-link:hover { text-decoration: underline; }
.library-loading, .library-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
  gap: 12px;
  color: var(--muted);
}
.library-empty-icon { font-size: 40px; }
.mini-spinner {
  width: 20px; height: 20px;
  border: 3px solid var(--line);
  border-top-color: var(--vio);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-top: 1px solid var(--line);
}
.page-btn {
  width: 32px; height: 32px;
  border: 1px solid var(--line);
  background: var(--panel2);
  color: var(--text);
  border-radius: 7px;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  font-size: 12px;
}
.page-btn.active { background: var(--vio); border-color: var(--vio); }
.library-footer {
  padding: 10px 16px;
  font-size: 11px;
  color: var(--muted2);
  border-top: 1px solid var(--line);
}

/* ─── Modal ─────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.7);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
  overflow-y: auto;
}
.modal-panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
  width: 100%;
  max-width: 820px;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 22px;
  border-bottom: 1px solid var(--line);
}
.modal-title { font-size: 16px; font-weight: 800; margin-bottom: 6px; }
.modal-meta { display: flex; gap: 6px; }
.modal-actions { display: flex; gap: 6px; margin-left: auto; align-items: flex-start; }
.modal-close {
  font: inherit;
  background: none;
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
.modal-tabs {
  display: flex;
  gap: 20px;
  padding: 0 22px;
  border-bottom: 1px solid var(--line);
}
.modal-tabs button {
  font: inherit;
  font-weight: 700;
  font-size: 11.5px;
  background: none;
  border: none;
  color: var(--muted);
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.modal-tabs button.active { color: var(--vio); border-bottom-color: var(--vio); }
.modal-body { padding: 20px 22px; }
.edit-notice {
  background: rgba(245,176,76,.1);
  border: 1px solid rgba(245,176,76,.3);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 11px;
  color: var(--amber);
  margin-bottom: 12px;
}

/* Versions */
.versions-list { display: flex; flex-direction: column; gap: 8px; }
.version-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--panel2);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.version-item.current { border-color: rgba(139,92,246,.4); background: var(--vio-soft); }
.version-info { display: flex; align-items: center; gap: 10px; flex: 1; }
.version-no { font-weight: 800; font-size: 13px; }
.version-origin {
  font-size: 10.5px;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 8px;
}
.origin-ai { background: var(--vio-soft); color: var(--vio); }
.origin-teacher_edited { background: var(--amber-soft); color: var(--amber); }
.version-date { font-size: 11px; color: var(--muted); }
.version-current { font-size: 9.5px; font-weight: 800; color: var(--green); letter-spacing: .5px; }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--muted);
  font-size: 13px;
}

/* ─── Toast ─────────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #26262f;
  border: 1px solid var(--line);
  color: var(--text);
  padding: 11px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 12.5px;
  z-index: 100;
  opacity: 0;
  transition: opacity .25s;
  pointer-events: none;
  max-width: 92vw;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,.5);
  white-space: nowrap;
}
.toast.show { opacity: 1; }
</style>
