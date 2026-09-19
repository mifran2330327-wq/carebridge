import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config — kept minimal on purpose so your teammate can drop in
// a proxy to the Node/Express API later, e.g.:
// server: { proxy: { '/api': 'http://localhost:5000' } }
export default defineConfig({
  plugins: [react()],
})
