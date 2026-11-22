export default defineEventHandler((event) => {
  // Return 404 text so browser automatically unregisters stale dev service worker
  setResponseStatus(event, 404)
  setHeader(event, 'Content-Type', 'text/plain')
  return 'Not Found: dev-sw.js is disabled in this environment'
})
