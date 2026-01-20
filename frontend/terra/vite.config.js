import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Shared app aliases (backward compatibility)
      '@core': path.resolve(__dirname, './src/apps/terra-shared/core'),
      '@common': path.resolve(__dirname, './src/apps/terra-shared/common'),
      '@app': path.resolve(__dirname, './src/apps/terra-shared/app'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@mocks': path.resolve(__dirname, './src/mocks'),
      '@actions': path.resolve(__dirname, './src/actions'),
      
      // New app-specific aliases
      '@shared': path.resolve(__dirname, './src/apps/terra-shared'),
      '@shared/*': path.resolve(__dirname, './src/apps/terra-shared/*'),
      '@terra-ads': path.resolve(__dirname, './src/apps/terra-ads'),
      '@terra-ads/*': path.resolve(__dirname, './src/apps/terra-ads/*'),
      '@terra-health': path.resolve(__dirname, './src/apps/terra-health'),
      '@terra-health/*': path.resolve(__dirname, './src/apps/terra-health/*'),
      
      // Legacy aliases for gradual migration (can be removed later)
      '@modules': path.resolve(__dirname, './src/apps/terra-shared/modules'),
      '@views': path.resolve(__dirname, './src/apps/terra-shared/views'),
    },
  },
})
