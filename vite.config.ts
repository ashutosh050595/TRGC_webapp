import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // If you are deploying to https://<USERNAME>.github.io/<REPO>/
  // Change the line below to: base: '/<REPO>/',
  base: './', 
})