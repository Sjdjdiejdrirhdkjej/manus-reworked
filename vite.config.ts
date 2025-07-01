import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "bc4d9fed-94ea-415d-85fd-d70649af146d-00-17fqdy2tkwxld.pike.repl.co",
      "*.vercel.app",
      "*.repl.co"
    ]
  }
})
