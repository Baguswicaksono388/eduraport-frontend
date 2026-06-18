// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000/api/v1',
    }
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
