import basicSsl from '@vitejs/plugin-basic-ssl'

const useHttps = process.env.HTTPS === 'true'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  devServer: { 
    host: useHttps ? '0.0.0.0' : 'localhost', 
    https: useHttps 
  },
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],

  vite: {
    plugins: useHttps ? [basicSsl()] : []
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'EduRaport Scanner',
      short_name: 'EduScanner',
      theme_color: '#ffffff',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
  
  runtimeConfig: {
    public: {
      apiBase: '/api/v1',
    }
  },

  routeRules: {
    '/api/v1/**': { proxy: 'http://127.0.0.1:3000/api/v1/**' }
  },
  
  css: ['./app/assets/css/main.css'],

  app: {
    head: {
      title: 'EduRaport - Sistem E-Raport & Manajemen Keuangan Sekolah',
      meta: [
        { name: 'description', content: 'EduRaport is an integrated digital report card and financial management system for schools.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap' }
      ]
    }
  },

  tailwindcss: {
    config: {
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
  }
})
