<script setup lang="ts">
import { computed } from 'vue'
import { competitors } from '../../data/competitors'

definePageMeta({ layout: false })

const route = useRoute()
const slug = computed(() => route.params.competitor as string)
const data = computed(() => competitors.find(c => c.slug === slug.value))

// 404 redirect jika kompetitor tidak ditemukan
if (!data.value) {
  throw createError({ statusCode: 404, message: 'Halaman tidak ditemukan' })
}

// SEO Meta
useSeoMeta({
  title: data.value.seoTitle,
  description: data.value.metaDescription,
  ogTitle: data.value.seoTitle,
  ogDescription: data.value.metaDescription,
  ogType: 'article',
})

// Schema JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.value.seoTitle,
        description: data.value.metaDescription,
        publisher: {
          '@type': 'Organization',
          name: 'EduRaport',
          url: 'https://eduraport.bagusw.biz.id',
        },
        dateModified: new Date().toISOString().split('T')[0],
      }),
    },
  ],
})
</script>

<template>
  <div v-if="data" class="vs-page">
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
        <a href="/login" class="vs-btn-cta">Jadwalkan Demo →</a>
      </div>
    </header>

    <!-- HERO -->
    <section class="vs-hero">
      <div class="vs-container">
        <div class="vs-badge">Perbandingan · EduRaport vs {{ data.name }}</div>
        <h1 class="vs-h1">{{ data.h1 }}</h1>
        <p class="vs-intro">{{ data.intro }}</p>
        <div class="vs-meta-row">
          <span class="vs-chip">💰 {{ data.name }}: {{ data.priceLabel }}</span>
          <span class="vs-chip vs-chip-green">💰 EduRaport: Mulai Rp 500.000/bulan</span>
        </div>
        <a href="/login" class="vs-btn-hero">🚀 Jadwalkan Demo EduRaport Gratis</a>
      </div>
    </section>

    <!-- COMPARISON TABLE -->
    <section class="vs-section">
      <div class="vs-container">
        <h2 class="vs-section-title">Perbandingan Fitur: EduRaport vs {{ data.name }}</h2>
        <div class="vs-table-wrap">
          <table class="vs-table">
            <thead>
              <tr>
                <th class="vs-th-feature">Fitur</th>
                <th class="vs-th-edu">✅ EduRaport</th>
                <th class="vs-th-comp">{{ data.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.features" :key="row.feature" class="vs-tr">
                <td class="vs-td-feature">{{ row.feature }}</td>
                <td class="vs-td-check">
                  <span v-if="row.eduraport === true" class="vs-yes">✅</span>
                  <span v-else-if="row.eduraport === false" class="vs-no">❌</span>
                  <span v-else class="vs-note">{{ row.eduraport }}</span>
                </td>
                <td class="vs-td-check">
                  <span v-if="row.competitor === true" class="vs-yes">✅</span>
                  <span v-else-if="row.competitor === false" class="vs-no">❌</span>
                  <span v-else class="vs-note">{{ row.competitor }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- VERDICT -->
    <section class="vs-section vs-section-verdict">
      <div class="vs-container">
        <h2 class="vs-section-title">Kesimpulan: Mana yang Lebih Tepat untuk Sekolah Anda?</h2>
        <p class="vs-verdict-text">{{ data.verdict }}</p>
        <div class="vs-cta-box">
          <p>Ingin memastikan EduRaport cocok untuk kebutuhan sekolah Anda?</p>
          <a href="/login" class="vs-btn-hero">Jadwalkan Demo 1-on-1 Gratis →</a>
          <p class="vs-cta-sub">Tidak ada komitmen. Setup dalam 7 hari. Support via WhatsApp.</p>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="vs-section">
      <div class="vs-container">
        <h2 class="vs-section-title">Pertanyaan yang Sering Diajukan</h2>
        <div class="vs-faq-list">
          <details v-for="item in data.faq" :key="item.q" class="vs-faq-item">
            <summary class="vs-faq-q">{{ item.q }}</summary>
            <p class="vs-faq-a">{{ item.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- FOOTER CTA -->
    <section class="vs-footer-cta">
      <div class="vs-container" style="text-align: center;">
        <h2>Siap Beralih ke EduRaport?</h2>
        <p>Bergabunglah dengan sekolah swasta yang sudah mengelola akademik & keuangan dalam satu platform.</p>
        <a href="/login" class="vs-btn-hero">🚀 Mulai Demo Sekarang</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.vs-page { font-family: 'Plus Jakarta Sans', sans-serif; color: #1a1a2e; background: #f8fafc; min-height: 100vh; }
.vs-nav { background: white; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
.vs-nav-inner { max-width: 960px; margin: 0 auto; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; }
.vs-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; }
.logo-icon { font-size: 28px; }
.logo-name { font-weight: 700; font-size: 16px; color: #1e293b; }
.logo-tag { font-size: 11px; color: #64748b; }
.vs-btn-cta { background: #6c63ff; color: white; padding: 9px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: opacity .2s; }
.vs-btn-cta:hover { opacity: .85; }

.vs-container { max-width: 960px; margin: 0 auto; padding: 0 20px; }
.vs-hero { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; padding: 64px 20px 56px; text-align: center; }
.vs-badge { display: inline-block; background: rgba(255,255,255,.15); padding: 6px 16px; border-radius: 20px; font-size: 13px; margin-bottom: 20px; }
.vs-h1 { font-size: clamp(24px, 4vw, 40px); font-weight: 800; margin: 0 0 16px; line-height: 1.2; }
.vs-intro { font-size: 16px; opacity: .85; max-width: 700px; margin: 0 auto 20px; line-height: 1.7; }
.vs-meta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px; }
.vs-chip { background: rgba(255,255,255,.12); padding: 6px 14px; border-radius: 20px; font-size: 13px; }
.vs-chip-green { background: rgba(16,185,129,.25); }
.vs-btn-hero { display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; transition: opacity .2s; }
.vs-btn-hero:hover { opacity: .88; }

.vs-section { padding: 56px 20px; }
.vs-section-verdict { background: white; }
.vs-section-title { font-size: clamp(20px, 3vw, 28px); font-weight: 700; margin-bottom: 28px; text-align: center; }

.vs-table-wrap { overflow-x: auto; }
.vs-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,.07); }
.vs-table thead { background: #1e293b; color: white; }
.vs-table th { padding: 14px 16px; text-align: left; font-size: 14px; font-weight: 600; }
.vs-th-edu { color: #6ee7b7; }
.vs-th-comp { color: #fca5a5; }
.vs-tr { border-bottom: 1px solid #f1f5f9; }
.vs-tr:last-child { border: none; }
.vs-tr:nth-child(even) { background: #f8fafc; }
.vs-td-feature { padding: 13px 16px; font-size: 14px; color: #374151; }
.vs-td-check { padding: 13px 16px; text-align: center; font-size: 14px; }
.vs-yes { color: #059669; font-size: 18px; }
.vs-no { color: #dc2626; font-size: 18px; }
.vs-note { font-size: 12px; color: #374151; }

.vs-verdict-text { font-size: 16px; line-height: 1.8; color: #374151; max-width: 760px; margin: 0 auto 36px; }
.vs-cta-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 14px; padding: 32px; text-align: center; }
.vs-cta-box p { font-size: 16px; color: #166534; margin: 0 0 16px; font-weight: 500; }
.vs-cta-sub { font-size: 13px; color: #64748b; margin: 12px 0 0; }

.vs-faq-list { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
.vs-faq-item { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; cursor: pointer; }
.vs-faq-q { font-weight: 600; font-size: 15px; color: #1e293b; list-style: none; }
.vs-faq-q::-webkit-details-marker { display: none; }
.vs-faq-a { margin: 12px 0 0; font-size: 14px; color: #475569; line-height: 1.7; }

.vs-footer-cta { background: linear-gradient(135deg, #1e1b4b, #312e81); color: white; padding: 64px 20px; }
.vs-footer-cta h2 { font-size: 28px; font-weight: 800; margin-bottom: 12px; }
.vs-footer-cta p { opacity: .85; margin-bottom: 24px; font-size: 16px; }
</style>
