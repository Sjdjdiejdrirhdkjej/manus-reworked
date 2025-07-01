import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "6a73356f-182c-4961-b3ac-407c180cc1eb-00-2lnk5jya33o3z.pike.repl.co"
    ]
  }
})
