export default defineNuxtPlugin(() => {
  if (import.meta.client && 'serviceWorker' in navigator) {
    // In development mode, automatically purge any stale dev service workers
    // to prevent browser polling of /dev-sw.js and eliminate Vue Router warnings.
    if (import.meta.dev) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          const scriptUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || ''
          if (scriptUrl.includes('dev-sw.js')) {
            reg.unregister().then((success) => {
              if (success) {
                // Stale dev service worker unregistered
              }
            }).catch(() => {})
          }
        }
      }).catch(() => {})
    }
  }
})
