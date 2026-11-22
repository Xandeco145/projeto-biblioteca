import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Caminhos relativos: o build funciona em qualquer hospedagem estática
  // (GitHub Pages em /projeto-biblioteca/, Vercel, Netlify ou abrindo a pasta dist).
  base: './',
})
