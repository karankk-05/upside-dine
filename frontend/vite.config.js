import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const hmrClientPort = Number(env.VITE_HMR_CLIENT_PORT || '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      allowedHosts: true,
      watch: {
        usePolling: true,
      },
      hmr: hmrClientPort
        ? {
            clientPort: hmrClientPort,
          }
        : undefined,
      proxy: {
        '/api': {
          target: 'http://backend:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
