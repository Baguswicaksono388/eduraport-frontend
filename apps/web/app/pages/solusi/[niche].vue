<script setup lang="ts">
import { computed } from 'vue'
import { niches } from '../../data/niches'

const route = useRoute()
const slug = computed(() => route.params.niche as string)
const data = computed(() => niches.find(n => n.slug === slug.value))

if (!data.value) {
  throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan' })
}

useSeoMeta({
  title: data.value.seoTitle,
  description: data.value.metaDescription,
  ogTitle: data.value.seoTitle,
  ogDescription: data.value.metaDescription,
  ogType: 'article',
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.value.faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }),
    },
  ],
})
</script>

<template>
  <div v-if="data" class="niche-page">
    <!-- NAV -->
    <header class="vs-nav">
      <div class="vs-nav-inner">
        <a href="/landing" class="vs-logo">
          <span class="logo-icon">🎓</span>
          <div>
            <div class="logo-name">EduRaport</div>
            <div class="logo-tag">Smart School ERP</div>
          </div>
        </a>
        <a href="/login" class="vs-btn-cta">{{ data.ctaText }} →</a>
      </div>
    </header>

    <!-- HERO -->
    <section class="niche-hero">
      <div class="vs-container">
        <div class="niche-badge">{{ data.badge }}</div>
        <h1 class="niche-h1">
          {{ data.h1 }}<br>
          <span class="niche-highlight">{{ data.h1Highlight }}</span>
        </h1>
        <p class="vs-intro">{{ data.intro }}</p>
        <a href="/login" class="vs-btn-hero">🚀 {{ data.ctaText }}</a>
        <div class="niche-trust">
          <span>✅ Sesuai Regulasi PPA 2025</span>
          <span>✅ Setup &lt; 7 Hari</span>
          <span>✅ Support WhatsApp</span>
        </div>
      </div>
    </section>

    <!-- PAIN POINTS -->
    <section class="vs-section" style="background: white;">
      <div class="vs-container">
        <h2 class="vs-section-title">Masalah yang Sering Dialami {{ data.name }}</h2>
        <div class="niche-pains">
          <div v-for="pain in data.painPoints" :key="pain" class="pain-item">
            <span class="pain-icon">⚠️</span>
            <span>{{ pain }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="vs-section">
      <div class="vs-container">
        <h2 class="vs-section-title">Solusi EduRaport untuk {{ data.name }}</h2>
        <div class="niche-features-grid">
          <div v-for="f in data.features" :key="f.title" class="niche-feat-card">
            <div class="niche-feat-icon">{{ f.icon }}</div>
            <h3 class="niche-feat-title">{{ f.title }}</h3>
            <p class="niche-feat-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="vs-section" style="background: linear-gradient(135deg, #1e1b4b, #312e81); color: white; text-align: center;">
      <div class="vs-container">
        <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 12px;">Siap Mencoba EduRaport untuk {{ data.name }} Anda?</h2>
        <p style="opacity: .85; margin-bottom: 24px; font-size: 16px;">Jadwalkan demo 1-on-1 bersama konsultan kami. Gratis, tanpa komitmen.</p>
        <a href="/login" class="vs-btn-hero">🚀 {{ data.ctaText }}</a>
      </div>
    </section>

    <!-- FAQ with FAQPage Schema -->
    <section class="vs-section">
      <div class="vs-container">
        <h2 class="vs-section-title">Pertanyaan Seputar EduRaport untuk {{ data.name }}</h2>
        <div class="vs-faq-list">
          <details v-for="item in data.faq" :key="item.q" class="vs-faq-item">
            <summary class="vs-faq-q">{{ item.q }}</summary>
            <p class="vs-faq-a">{{ item.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- BREADCRUMB & INTERNAL LINKS -->
    <section class="niche-related">
      <div class="vs-container">
        <p class="niche-related-title">Lihat Juga:</p>
        <div class="niche-related-links">
          <a href="/landing">← Halaman Utama EduRaport</a>
          <a href="/vs/e-rapor-kemendikbud">EduRaport vs e-Rapor Kemendikbud</a>
          <a href="/vs/skoola">EduRaport vs Skoola</a>
          <a href="/vs/adminsekolah">EduRaport vs AdminSekolah</a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.niche-page { font-family: 'Plus Jakarta Sans', sans-serif; color: #1a1a2e; background: #f8fafc; min-height: 100vh; }
.vs-nav { background: white; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
.vs-nav-inner { max-width: 960px; margin: 0 auto; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; }
.vs-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; }
.logo-icon { font-size: 28px; }
.logo-name { font-weight: 700; font-size: 16px; color: #1e293b; }
.logo-tag { font-size: 11px; color: #64748b; }
.vs-btn-cta { background: #6c63ff; color: white; padding: 9px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }

.vs-container { max-width: 960px; margin: 0 auto; padding: 0 20px; }
.niche-hero { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: white; padding: 64px 20px 56px; text-align: center; }
.niche-badge { display: inline-block; background: rgba(255,255,255,.15); padding: 6px 16px; border-radius: 20px; font-size: 13px; margin-bottom: 20px; }
.niche-h1 { font-size: clamp(24px, 4vw, 40px); font-weight: 800; margin: 0 0 16px; line-height: 1.25; }
.niche-highlight { background: linear-gradient(90deg, #34d399, #6ee7b7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.vs-intro { font-size: 16px; opacity: .85; max-width: 700px; margin: 0 auto 24px; line-height: 1.7; }
.vs-btn-hero { display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; }
.niche-trust { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-top: 20px; font-size: 13px; opacity: .8; }

.vs-section { padding: 56px 20px; }
.vs-section-title { font-size: clamp(20px, 3vw, 26px); font-weight: 700; margin-bottom: 28px; text-align: center; }

.niche-pains { max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
.pain-item { display: flex; align-items: flex-start; gap: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 18px; font-size: 15px; color: #92400e; }
.pain-icon { font-size: 18px; flex-shrink: 0; }

.niche-features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.niche-feat-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
.niche-feat-icon { font-size: 28px; margin-bottom: 12px; }
.niche-feat-title { font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
.niche-feat-desc { font-size: 14px; color: #475569; line-height: 1.65; margin: 0; }

.vs-faq-list { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
.vs-faq-item { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; cursor: pointer; }
.vs-faq-q { font-weight: 600; font-size: 15px; color: #1e293b; list-style: none; }
.vs-faq-q::-webkit-details-marker { display: none; }
.vs-faq-a { margin: 12px 0 0; font-size: 14px; color: #475569; line-height: 1.7; }

.niche-related { padding: 24px 20px; background: #f1f5f9; border-top: 1px solid #e2e8f0; }
.niche-related-title { font-size: 13px; color: #64748b; margin: 0 0 10px; font-weight: 600; }
.niche-related-links { display: flex; flex-wrap: wrap; gap: 12px; }
.niche-related-links a { font-size: 13px; color: #6c63ff; text-decoration: none; }
.niche-related-links a:hover { text-decoration: underline; }
</style>
