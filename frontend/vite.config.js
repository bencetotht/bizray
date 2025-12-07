import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [
    react()
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' }
    }
  },
  server: {
  port: 3000,
  open: false,
  proxy: {
    "/api": {
      target: "https://apibizray.bnbdevelopment.hu",
      changeOrigin: true,
      secure: false,
    },
  },
},

});


