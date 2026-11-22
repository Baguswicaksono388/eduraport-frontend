export default defineEventHandler((event) => {
  const path = event.path || event.node.req.url || ''
  if (path.startsWith('/dev-sw.js') || path.startsWith('/sw.js.map') || path.startsWith('/workbox-')) {
    event.node.res.statusCode = 404
    event.node.res.setHeader('Content-Type', 'text/plain')
    event.node.res.end('Not Found: service worker asset not served in this mode')
  }
})
