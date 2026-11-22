import basicSsl from '@vitejs/plugin-basic-ssl'

const useHttps = process.env.HTTPS === 'true'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: process.env.ENABLE_DEVTOOLS === 'true' },
  devServer: { 
    host: useHttps ? '0.0.0.0' : 'localhost', 
    https: useHttps 
  },
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt', '@nuxtjs/sitemap', '@pinia/nuxt'],

  site: {
    url: 'https://eduraport.bagusw.biz.id',
  },
  
  sitemap: {
    urls: [
      '/landing',
      '/vs/e-rapor-kemendikbud',
      '/vs/adminsekolah',
      '/vs/skoola',
      '/vs/simsch',
      '/solusi/pesantren',
      '/solusi/tk-paud',
      '/solusi/yayasan-multi-unit',
      '/solusi/kurikulum-merdeka',
      '/solusi/portal-orang-tua'
    ],
    exclude: [
      '/login', '/register', '/unauthorized', '/dashboard', '/academic-year',
      '/attendance-settings', '/class/**', '/financial/**', '/foundation/**',
      '/gradebook/**', '/homeroom', '/index', '/kurikulum', '/leave',
      '/parent/**', '/ppdb/**', '/report/**', '/scanner', '/schedule',
      '/school', '/student/**', '/subject', '/teacher/**', '/wa/**'
    ]
  },

  vite: {
    plugins: useHttps ? [basicSsl()] : []
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'EduRaport - Sistem Informasi & Rapor Sekolah',
      short_name: 'EduRaport',
      description: 'Portal Rapor, Akademik, Presensi, dan Keuangan Sekolah Terpadu',
      theme_color: '#1E3A8A',
      background_color: '#F8FAFC',
      display: 'standalone',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      shortcuts: [
        {
          name: 'Scan Presensi',
          short_name: 'Presensi',
          description: 'Buka scanner QR presensi guru & siswa',
          url: '/scanner',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
        },
        {
          name: 'Input Nilai',
          short_name: 'Nilai',
          description: 'Input dan edit nilai mata pelajaran',
          url: '/gradebook/input',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
        },
        {
          name: 'Portal Wali Murid',
          short_name: 'Wali Murid',
          description: 'Akses dasbor informasi wali murid',
          url: '/parent',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365
            }
          }
        }
      ]
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },
  
  runtimeConfig: {
    public: {
      apiBase: '/api/v1',
      platformAdminUrl: process.env.NUXT_PUBLIC_PLATFORM_ADMIN_URL || 'http://localhost:3002',
    }
  },

  routeRules: {
    '/dev-sw.js**': { ssr: false },
    '/api/v1/**': { proxy: 'http://eduraport_backend_staging:3002/api/v1/**' },
    '/uploads/**': { proxy: 'http://eduraport_backend_staging:3002/uploads/**' },
    '/ai-images/**': { proxy: 'http://eduraport_backend_staging:3002/ai-images/**' }
  },
  
  css: ['./app/assets/css/main.css'],

  app: {
    head: {
      title: 'EduRaport - Sistem E-Raport & Manajemen Keuangan Sekolah',
      meta: [
        { name: 'description', content: 'EduRaport is an integrated digital report card and financial management system for schools.' },
        { name: 'theme-color', content: '#1E3A8A' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'EduRaport' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/pwa-192x192.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap' }
      ]
    }
  },

  tailwindcss: {
    config: {
      darkMode: 'class',
      content: [
        './app/**/*.{vue,js,ts}',
        '../../packages/ui/src/**/*.{vue,js,ts}',
      ],
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          },
        },
      },
    }
  },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    appManifest: false,
  }
})
