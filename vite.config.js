import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Apache sert le dossier projet tel quel sur http://localhost/altess-fashion,
// y compris public/uploads. En dev, le serveur Vite doit donc relayer ce
// préfixe, sinon les images renvoient le fallback SPA (text/html) et
// n'apparaissent pas dans le navigateur.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost/altess-fashion/backend',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/', '/api.php/'),
      },
      '/altess-fashion/public': {
        target: 'http://localhost/altess-fashion',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/altess-fashion/, ''),
      },
    },
  },
})
