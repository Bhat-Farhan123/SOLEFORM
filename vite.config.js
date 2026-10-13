import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function soleformDebugWatcher() {
  return {
    name: 'soleform-debug-watcher',
    configureServer(server) {
      console.log('[SOLEFORM DEBUG] Vite watcher diagnostics enabled.')
      for (const event of ['change', 'add', 'unlink']) {
        server.watcher.on(event, filePath => {
          console.log(`[SOLEFORM DEBUG] Vite filesystem event (${event}): ${filePath}`)
        })
      }
      server.ws.on('vite:invalidate', payload => {
        console.log('[SOLEFORM DEBUG] Vite invalidation:', payload)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), soleformDebugWatcher()],
  server: {
    port: 3000,
    watch: {
      // Backend JSON files are data, not frontend source. Ignore them to prevent
      // Vite from triggering a browser reload after an order updates stock/history.
      ignored: ['**/backend/**', '**/backend/data/**'],
    },
  },
})
