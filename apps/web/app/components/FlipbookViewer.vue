<template>
  <div class="flipbook-wrapper" :class="{ 'flipbook-fullscreen': isFullscreen }" ref="wrapperRef">
    <!-- ─── Header ─────────────────────────────────────────────────────────── -->
    <div class="flipbook-header">
      <div class="flipbook-title-area">
        <span class="flipbook-badge">🎯 Bahan Tayang</span>
        <h3 class="flipbook-title">{{ title }}</h3>
      </div>
      <div class="flipbook-header-controls">
        <span class="slide-counter">{{ currentIdx + 1 }} / {{ slides.length }}</span>
        <button class="ctrl-btn" @click="toggleFullscreen" :title="isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'">
          {{ isFullscreen ? '⊡' : '⛶' }}
        </button>
      </div>
    </div>

    <!-- ─── Slide Stage ──────────────────────────────────────────────────── -->
    <div class="flipbook-stage" @click.self="handleStageClick">
      <Transition :name="transitionName" mode="out-in">
        <div class="flipbook-slide" :key="currentIdx" :data-type="currentSlide.tipe ?? 'content'">

          <!-- Cover -->
          <div v-if="currentSlide.tipe === 'cover'" class="slide-cover">
            <div class="cover-bg" :style="coverGradient"></div>
            <div class="cover-badge">EduRaport • AI Asisten Guru</div>
            <h1 class="cover-title">{{ currentSlide.judul }}</h1>
            <p v-if="currentSlide.subjudul" class="cover-subtitle">{{ currentSlide.subjudul }}</p>
            <div class="cover-footer">Kurikulum Merdeka — Indonesia</div>
          </div>

          <!-- Section Divider -->
          <div v-else-if="currentSlide.tipe === 'section'" class="slide-section">
            <div class="section-left" :style="{ background: themeAccent }">
              <span class="section-label">BAGIAN</span>
            </div>
            <div class="section-right">
              <h2 class="section-title">{{ currentSlide.judul }}</h2>
              <div class="section-line" :style="{ background: themeAccent }"></div>
            </div>
          </div>

          <!-- Closing -->
          <div v-else-if="currentSlide.tipe === 'closing'" class="slide-closing">
            <div class="closing-left" :style="{ background: themeAccent }">
              <h2 class="closing-main">{{ currentSlide.judul ?? 'Terima Kasih' }}</h2>
              <ul v-if="currentSlide.poin?.length" class="closing-poin">
                <li v-for="p in currentSlide.poin" :key="p">{{ p }}</li>
              </ul>
            </div>
            <div class="closing-right">
              <div class="closing-brand">EduRaport</div>
              <div class="closing-brand-sub">AI Asisten Guru<br/>Kurikulum Merdeka</div>
            </div>
          </div>

          <!-- Content (default) -->
          <div v-else class="slide-content">
            <div class="content-top-bar" :style="{ background: themeAccent }"></div>
            <div class="content-body">
              <div class="content-text" :class="{ 'has-image': !!currentSlide.image_url }">
                <div class="slide-num-badge" :style="{ background: themeAccent }">{{ currentSlide.no }}</div>
                <h2 class="content-title">{{ currentSlide.judul }}</h2>
                <ul class="content-bullets">
                  <li v-for="p in (currentSlide.poin ?? [])" :key="p">
                    <span class="bullet-dot" :style="{ background: themeBullet }">•</span>
                    {{ p }}
                  </li>
                </ul>
              </div>
              <div v-if="currentSlide.image_url" class="content-image-wrap">
                <img :src="currentSlide.image_url" :alt="`Ilustrasi: ${currentSlide.judul}`" class="content-image" />
              </div>
            </div>
            <div class="content-footer">
              <span class="footer-title">{{ title }}</span>
              <span class="footer-num">{{ currentSlide.no }}</span>
            </div>
          </div>

        </div>
      </Transition>
    </div>

    <!-- ─── Progress Bar ──────────────────────────────────────────────────── -->
    <div class="flipbook-progress">
      <div class="progress-fill" :style="{ width: progressPct + '%', background: themeAccent }"></div>
    </div>

    <!-- ─── Navigation ────────────────────────────────────────────────────── -->
    <div class="flipbook-nav">
      <button class="nav-btn" @click="prev" :disabled="currentIdx === 0" id="flipbook-prev">
        ‹ Sebelumnya
      </button>

      <!-- Dot indicators -->
      <div class="dot-indicators">
        <button
          v-for="(slide, i) in slides"
          :key="i"
          class="dot"
          :class="{ active: i === currentIdx, 'is-cover': slide.tipe === 'cover', 'is-section': slide.tipe === 'section', 'is-closing': slide.tipe === 'closing' }"
          :style="i === currentIdx ? { background: themeAccent } : {}"
          @click="goTo(i)"
          :title="slide.judul"
        ></button>
      </div>

      <button class="nav-btn" @click="next" :disabled="currentIdx === slides.length - 1" id="flipbook-next">
        Selanjutnya ›
      </button>
    </div>

    <!-- ─── Speaker Notes ────────────────────────────────────────────────── -->
    <Transition name="notes-slide">
      <div v-if="currentSlide.catatan && showNotes" class="speaker-notes">
        <div class="notes-header">
          <span>📝 Catatan Pembicara</span>
          <button class="notes-close" @click="showNotes = false">✕</button>
        </div>
        <p class="notes-body">{{ currentSlide.catatan }}</p>
      </div>
    </Transition>

    <!-- Notes toggle (only when notes exist) -->
    <button
      v-if="currentSlide.catatan"
      class="notes-toggle-btn"
      @click="showNotes = !showNotes"
      :title="showNotes ? 'Sembunyikan catatan' : 'Tampilkan catatan pembicara'"
    >
      📝
    </button>
  </div>
</template>

<script setup lang="ts">
// ─── Props ────────────────────────────────────────────────────────────────────
interface Slide {
  no: number
  tipe?: 'cover' | 'section' | 'content' | 'closing'
  judul: string
  subjudul?: string
  poin?: string[]
  catatan?: string
  image_url?: string
  ilustrasi_prompt?: string
}

const props = defineProps<{
  slides: Slide[]
  title: string
  style?: 'minimalis' | 'colorful' | 'profesional'
}>()

// ─── State ────────────────────────────────────────────────────────────────────
const currentIdx = ref(0)
const isFullscreen = ref(false)
const showNotes = ref(false)
const transitionName = ref('slide-left')
const wrapperRef = ref<HTMLElement | null>(null)

// ─── Computed ─────────────────────────────────────────────────────────────────
const currentSlide = computed(() => props.slides[currentIdx.value] ?? {})
const progressPct = computed(() => ((currentIdx.value + 1) / props.slides.length) * 100)

// Theme colors based on style prop
const themeAccent = computed(() => {
  const s = props.style ?? 'profesional'
  if (s === 'colorful') return '#7C3AED'
  if (s === 'minimalis') return '#111827'
  return '#1a237e'
})
const themeBullet = computed(() => {
  const s = props.style ?? 'profesional'
  if (s === 'colorful') return '#F59E0B'
  if (s === 'minimalis') return '#6B7280'
  return '#3949ab'
})
const coverGradient = computed(() => {
  const s = props.style ?? 'profesional'
  if (s === 'colorful') return { background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }
  if (s === 'minimalis') return { background: 'linear-gradient(135deg, #111827 0%, #374151 100%)' }
  return { background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)' }
})

// ─── Navigation ──────────────────────────────────────────────────────────────
function prev() {
  if (currentIdx.value > 0) {
    transitionName.value = 'slide-right'
    currentIdx.value--
    showNotes.value = false
  }
}
function next() {
  if (currentIdx.value < props.slides.length - 1) {
    transitionName.value = 'slide-left'
    currentIdx.value++
    showNotes.value = false
  }
}
function goTo(i: number) {
  transitionName.value = i > currentIdx.value ? 'slide-left' : 'slide-right'
  currentIdx.value = i
  showNotes.value = false
}
function handleStageClick(e: MouseEvent) {
  // Click left half = prev, right half = next
  const el = wrapperRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (e.clientX < rect.left + rect.width / 2) prev()
  else next()
}

// ─── Fullscreen ───────────────────────────────────────────────────────────────
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// ─── Keyboard ────────────────────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
  if (e.key === 'Escape' && isFullscreen.value) isFullscreen.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* ─── Wrapper ─────────────────────────────────────────────────────────────── */
.flipbook-wrapper {
  display: flex;
  flex-direction: column;
  background: #0f0f1a;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  min-height: 500px;
  user-select: none;
}
.flipbook-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  border-radius: 0;
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
.flipbook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #1a1a2e;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.flipbook-title-area {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.flipbook-badge {
  background: rgba(255,255,255,0.1);
  color: #a0aec0;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}
.flipbook-title {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: 600;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flipbook-header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.slide-counter {
  font-size: 12px;
  color: #718096;
  min-width: 40px;
  text-align: right;
}
.ctrl-btn {
  background: rgba(255,255,255,0.08);
  border: none;
  color: #a0aec0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.ctrl-btn:hover { background: rgba(255,255,255,0.15); }

/* ─── Stage ──────────────────────────────────────────────────────────────── */
.flipbook-stage {
  flex: 1;
  min-height: 420px;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  cursor: pointer;
}
.flipbook-slide {
  width: 100%;
  overflow: hidden;
  position: relative;
}

/* ─── Slide: Cover ──────────────────────────────────────────────────────── */
.slide-cover {
  height: 100%;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px;
  position: relative;
  overflow: hidden;
}
.cover-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.cover-badge {
  position: relative;
  z-index: 1;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 24px;
  letter-spacing: 0.5px;
}
.cover-title {
  position: relative;
  z-index: 1;
  font-size: clamp(24px, 4vw, 40px);
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  margin: 0 0 16px;
  max-width: 80%;
}
.cover-subtitle {
  position: relative;
  z-index: 1;
  font-size: 16px;
  color: rgba(255,255,255,0.75);
  font-style: italic;
  margin: 0 0 32px;
}
.cover-footer {
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 48px;
  background: rgba(0,0,0,0.25);
  font-size: 11px;
  color: rgba(255,255,255,0.6);
}

/* ─── Slide: Section ────────────────────────────────────────────────────── */
.slide-section {
  height: 100%;
  min-height: 420px;
  display: flex;
}
.section-left {
  width: 36%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.section-label {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  letter-spacing: 2px;
  font-weight: 700;
}
.section-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  background: #fff;
}
.section-title {
  font-size: clamp(22px, 3.5vw, 36px);
  font-weight: 800;
  color: #1a1a2e;
  margin: 0 0 16px;
  line-height: 1.2;
}
.section-line {
  width: 60px;
  height: 4px;
  border-radius: 2px;
}

/* ─── Slide: Content ────────────────────────────────────────────────────── */
.slide-content {
  height: 100%;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.content-top-bar {
  height: 5px;
  width: 100%;
}
.content-body {
  flex: 1;
  display: flex;
  gap: 0;
  padding: 20px 28px;
  overflow: hidden;
}
.content-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.content-text.has-image {
  max-width: 62%;
}
.slide-num-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.content-title {
  font-size: clamp(16px, 2.5vw, 24px);
  font-weight: 800;
  color: #1a1a2e;
  margin: 0 0 14px;
  line-height: 1.3;
}
.content-bullets {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}
.content-bullets li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: clamp(13px, 1.8vw, 16px);
  color: #2d3748;
  line-height: 1.5;
}
.bullet-dot {
  flex-shrink: 0;
  font-size: 18px;
  line-height: 1.3;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 900;
}
.content-image-wrap {
  width: 36%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0 0 20px;
  flex-shrink: 0;
}
.content-image {
  width: 100%;
  height: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.content-footer {
  display: flex;
  justify-content: space-between;
  padding: 8px 28px;
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 10px;
  color: #a0aec0;
}
.footer-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80%;
}

/* ─── Slide: Closing ────────────────────────────────────────────────────── */
.slide-closing {
  height: 100%;
  min-height: 420px;
  display: flex;
}
.closing-left {
  width: 55%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
}
.closing-main {
  font-size: clamp(20px, 3.5vw, 34px);
  font-weight: 800;
  color: #fff;
  margin: 0 0 20px;
  line-height: 1.2;
}
.closing-poin {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.closing-poin li {
  color: rgba(255,255,255,0.8);
  font-size: 14px;
}
.closing-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  background: #f7fafc;
}
.closing-brand {
  font-size: 32px;
  font-weight: 900;
  color: #1a237e;
  margin-bottom: 8px;
}
.closing-brand-sub {
  font-size: 13px;
  color: #718096;
  line-height: 1.6;
}

/* ─── Progress ───────────────────────────────────────────────────────────── */
.flipbook-progress {
  height: 3px;
  background: rgba(255,255,255,0.08);
}
.progress-fill {
  height: 100%;
  transition: width 0.35s ease;
}

/* ─── Nav ────────────────────────────────────────────────────────────────── */
.flipbook-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #1a1a2e;
  gap: 12px;
}
.nav-btn {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  color: #e2e8f0;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
  white-space: nowrap;
}
.nav-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.2);
}
.nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

/* ─── Dot Indicators ─────────────────────────────────────────────────────── */
.dot-indicators {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: center;
  flex: 1;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}
.dot.active {
  width: 20px;
  border-radius: 4px;
}
.dot.is-cover, .dot.is-closing { background: rgba(255,255,255,0.4) !important; }
.dot.is-section { border-radius: 2px; width: 12px; }

/* ─── Speaker Notes ──────────────────────────────────────────────────────── */
.speaker-notes {
  position: absolute;
  bottom: 60px;
  left: 16px;
  right: 16px;
  background: rgba(15, 15, 26, 0.97);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 14px 18px;
  z-index: 10;
  backdrop-filter: blur(12px);
}
.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #a0aec0;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}
.notes-close {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}
.notes-body {
  color: #cbd5e0;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}
.notes-toggle-btn {
  position: absolute;
  bottom: 68px;
  right: 20px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  color: #a0aec0;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.notes-toggle-btn:hover { background: rgba(255,255,255,0.2); }

/* ─── Transitions ─────────────────────────────────────────────────────────── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-enter-from { transform: translateX(40px); opacity: 0; }
.slide-left-leave-to  { transform: translateX(-40px); opacity: 0; }
.slide-right-enter-from { transform: translateX(-40px); opacity: 0; }
.slide-right-leave-to  { transform: translateX(40px); opacity: 0; }

.notes-slide-enter-active, .notes-slide-leave-active { transition: all 0.2s; }
.notes-slide-enter-from, .notes-slide-leave-to { opacity: 0; transform: translateY(8px); }
</style>
