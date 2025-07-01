import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
           "*.vercel.app",
    "*.repl.co",
    "38011482-f29c-436d-881b-bf07fd12685e-00-4nixbe01hwd1.pike.repl.co"
    ]
  }
})
